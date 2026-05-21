'use client'

import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Minus, Square, X, Pin } from 'lucide-react'
import { cn } from '@/interface/lib/utils'

// Helper: retorna sempre uma instância fresca da janela atual
async function getWin() {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    return getCurrentWindow()
}

// Detecta plataforma mobile via Tauri internals (sem lib extra)
function getTauriPlatform(): string | null {
    if (typeof window === 'undefined') return null
    const internals = (window as any).__TAURI_INTERNALS__
    return internals?.metadata?.currentPlatform ?? internals?.platform ?? null
}

const MOBILE_PLATFORMS = new Set(['android', 'ios'])

// BARRA DE TÍTULO CUSTOMIZADA PARA TAURI (DESKTOP) — SUBSTITUI A BARRA NATIVA DO SISTEMA
export function TitleBar() {
    const [isTauri, setIsTauri] = useState(false)
    // null = ainda não detectado, true = mobile, false = desktop
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            setIsTauri(true)

            const detectPlatform = async () => {
                // Tenta via __TAURI_INTERNALS__ primeiro
                const platform = getTauriPlatform()
                if (platform !== null) {
                    setIsMobile(MOBILE_PLATFORMS.has(platform))
                    return
                }

                // Fallback: aguarda um tick e tenta novamente (pode não estar populado ainda)
                await new Promise(r => setTimeout(r, 100))
                const platformRetry = getTauriPlatform()
                if (platformRetry !== null) {
                    setIsMobile(MOBILE_PLATFORMS.has(platformRetry))
                    return
                }

                // Último fallback: usa largura de tela como heurística
                const isNarrowScreen = window.screen.width <= 768
                setIsMobile(isNarrowScreen)
            }

            detectPlatform()
            getWin().then(win => win.show())
        } else if (typeof window !== 'undefined') {
            // Fora do Tauri, não é mobile (não importa)
            setIsMobile(false)
        }
    }, [])

    // CONTROLES DA JANELA — MINIMIZAR, MAXIMIZAR/RESTAURAR, FECHAR E FIXAR NO TOPO
    const minimize = async () => (await getWin()).minimize()

    const toggleMaximize = async () => {
        const win = await getWin()
        const isMax = await win.isMaximized()
        if (isMax) await win.unmaximize()
        else await win.maximize()
    }

    const close = async () => (await getWin()).close()

    const toggleAlwaysOnTop = async () => {
        const newValue = !isAlwaysOnTop
        setIsAlwaysOnTop(newValue)
        try {
            const win = await getWin()
            await win.setAlwaysOnTop(newValue)
        } catch (err) {
            console.error('setAlwaysOnTop error:', err)
            setIsAlwaysOnTop(!newValue)
        }
    }

    // PERMITE ARRASTAR A JANELA — DUPLO CLIQUE MAXIMIZA/RESTAURA
    const handleDrag = async (e: MouseEvent) => {
        if (e.detail === 2) {
            await toggleMaximize()
            return
        }
        const win = await getWin()
        win.startDragging()
    }

    if (!isTauri) return null

    return (
        <div className="h-8 flex items-center justify-between select-none z-[200] w-full shrink-0 bg-sidebar border-b border-border/20">

            {/* Drag Area & Logo */}
            <div
                onMouseDown={handleDrag}
                className="flex items-center pl-4 h-full flex-1 cursor-default group"
            >
                <div className="flex items-center gap-2 transition-transform duration-200 group-active:scale-[0.98]">
                    <span className="text-[11px] font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        <span className="text-primary/80">ELANA</span>
                    </span>
                </div>
            </div>

            {/* Window Controls Group */}
            <div className="flex items-center h-full px-1 gap-1">

                {/* Pin Toggle */}
                {isMobile === false && (
                    <button
                        onClick={toggleAlwaysOnTop}
                        className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200',
                            isAlwaysOnTop
                                ? 'bg-primary/10 text-primary shadow-inner'
                                : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                        )}
                        title={isAlwaysOnTop ? 'Desafixar do topo' : 'Fixar no topo'}
                    >
                        <Pin className={cn('w-3 h-3 transition-transform', isAlwaysOnTop && 'fill-current scale-110')} />
                    </button>
                )}

                {/* Separator */}
                {isMobile === false && <div className="w-[1px] h-4 bg-border/20 mx-1" />}

                {/* Min / Max / Close */}
                {isMobile === false && (
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={minimize}
                            className="flex items-center justify-center w-8 h-7 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={toggleMaximize}
                            className="flex items-center justify-center w-8 h-7 rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                        >
                            <Square className="w-2.5 h-2.5" />
                        </button>
                        <button
                            onClick={close}
                            className="flex items-center justify-center w-8 h-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group/close"
                        >
                            <X className="w-3.5 h-3.5 group-hover/close:scale-110 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
