'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Minus, Square, X, Pin, MessageSquare } from 'lucide-react'
import { cn } from '@/interface/lib/utils'

// Detecção síncrona: verifica __TAURI_INTERNALS__ antes do primeiro render
const IS_TAURI = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

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
    // isMobile: null = não detectado ainda, true = mobile, false = desktop
    const [isMobile, setIsMobile] = useState<boolean | null>(null)
    const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)
    const shown = useRef(false)

    useEffect(() => {
        if (!IS_TAURI) {
            setIsMobile(false)
            return
        }

        const detectPlatform = async () => {
            // Tenta via __TAURI_INTERNALS__ primeiro
            const platform = getTauriPlatform()
            if (platform !== null) {
                setIsMobile(MOBILE_PLATFORMS.has(platform))
                return
            }

            // Fallback: aguarda um tick e tenta novamente
            await new Promise(r => setTimeout(r, 100))
            const platformRetry = getTauriPlatform()
            if (platformRetry !== null) {
                setIsMobile(MOBILE_PLATFORMS.has(platformRetry))
                return
            }

            // Último fallback: usa largura de tela como heurística
            setIsMobile(window.screen.width <= 768)
        }

        detectPlatform()

        // Mostra a janela apenas uma vez
        if (!shown.current) {
            shown.current = true
            getWin().then(win => win.show())
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

    // Fora do Tauri: não renderiza nada
    if (!IS_TAURI) return null

    return (
        <div className="h-11 flex items-center justify-between select-none z-[200] w-full shrink-0 bg-sidebar/85 backdrop-blur-md transition-all duration-300 rounded-t-[23px]">

            {/* Drag Area & Logo */}
            <div
                onMouseDown={handleDrag}
                className="flex items-center pl-4 h-full flex-1 cursor-default"
            >
                <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold tracking-[0.15em] text-foreground font-sans uppercase">
                        ELANA<span className="text-primary">.</span>
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
                            'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-300 hover:scale-[1.02] active:scale-95',
                            isAlwaysOnTop
                                ? 'bg-primary/15 text-primary shadow-sm border border-primary/20'
                                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                        )}
                        title={isAlwaysOnTop ? 'Desafixar do topo' : 'Fixar no topo'}
                    >
                        <Pin className={cn('w-3 h-3 transition-all duration-300', isAlwaysOnTop && 'fill-current scale-105 rotate-45')} />
                    </button>
                )}

                {/* Separator */}
                {isMobile === false && <div className="w-[1px] h-4 bg-border/30 mx-1" />}

                {/* Min / Max / Close */}
                {isMobile === false && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={minimize}
                            className="flex items-center justify-center w-8 h-7 rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-all active:scale-90"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={toggleMaximize}
                            className="flex items-center justify-center w-8 h-7 rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-all active:scale-90"
                        >
                            <Square className="w-2.5 h-2.5" />
                        </button>
                        <button
                            onClick={close}
                            className="flex items-center justify-center w-11 h-7 rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-all active:scale-90 group/close"
                        >
                            <X className="w-3.5 h-3.5 transition-transform group-hover/close:scale-105" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
