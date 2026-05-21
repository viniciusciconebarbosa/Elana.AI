"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/interface/lib/utils"
import { Button } from "@/interface/components/ui/button"
import { Textarea } from "@/interface/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/interface/components/ui/tooltip"
import { Send, Paperclip, Mic, Loader2, X, Image as ImageIcon, Globe, Ghost, Bot } from "lucide-react"
import { toast } from "sonner"

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: (e: React.FormEvent, images?: string[]) => void
    isLoading: boolean
    modelName?: string
    webSearchEnabled?: boolean
    onToggleWebSearch?: () => void
}

// Converte um blob: URL em data URL (base64) apenas no momento do envio
async function blobUrlToDataUrl(url: string): Promise<string> {
    if (!url.startsWith("blob:")) return url
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

// COMPONENTE DE ENTRADA DO CHAT — TEXTAREA, IMAGENS E BOTÕES DE AÇÃO
export function ChatInput({ value, onChange, onSubmit, isLoading, modelName, webSearchEnabled, onToggleWebSearch }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [images, setImages] = useState<string[]>([])
    const imagesRef = useRef<string[]>([])
    imagesRef.current = images  // sempre aponta para o array atual

    // Revoga blob URLs ao desmontar — usa ref para evitar closure stale
    useEffect(() => {
        return () => {
            imagesRef.current.forEach((url) => {
                if (url.startsWith("blob:")) URL.revokeObjectURL(url)
            })
        }
    }, [])

    // REVOGA TODAS AS BLOB URLS DA LISTA PARA LIBERAR MEMÓRIA
    const revokeAll = (urls: string[]) => {
        urls.forEach((u) => {
            if (u.startsWith("blob:")) URL.revokeObjectURL(u)
        })
    }

    // SUBMETE A MENSAGEM CONVERTENDO IMAGENS BLOB PARA BASE64 ANTES DO ENVIO
    const submitWithImages = async (e: React.FormEvent) => {
        e.preventDefault()
        // Converte blob URLs -> data URLs (base64) só agora
        const dataUrls = await Promise.all(images.map(blobUrlToDataUrl))
        onSubmit(e, dataUrls)
        revokeAll(images)
        setImages([])
    }

    // ATALHO DE TECLADO: ENTER ENVIA, SHIFT+ENTER QUEBRA LINHA
    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (isLoading) {
                toast.warning("Aguarde a resposta", { description: "O modelo ainda está respondendo." })
                return
            }
            await submitWithImages(e as unknown as React.FormEvent)
        }
    }

    // HANDLER DE SUBMIT DO FORMULÁRIO
    const handleFormSubmit = async (e: React.FormEvent) => {
        await submitWithImages(e)
    }

    // PROCESSA ARQUIVOS SELECIONADOS PELO INPUT DE IMAGEM
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        Array.from(files).forEach((file) => {
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file)
                setImages((prev) => [...prev, url])
            }
        })

        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    // CAPTURA IMAGENS COLADAS DO CLIPBOARD (CTRL+V)
    const handlePaste = async (e: React.ClipboardEvent) => {
        if (isLoading) {
            toast.warning("Aguarde a resposta", { description: "O modelo ainda está respondendo." })
            return
        }

        let imagePasted = false
        const hasFiles = e.clipboardData?.types.includes("Files")

        // 1. Tenta capturar do files (comum em capturas de tela no Linux/Gnome e Chrome)
        const files = e.clipboardData?.files
        if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
                // Algumas distros Linux (WebKitGTK) deixam o type vazio para imagens PNG.
                // Checamos a extensão do nome do arquivo como fallback.
                const isImage = file.type.startsWith("image/") || file.name.match(/\.(png|jpe?g|gif|webp)$/i);
                if (isImage) {
                    const url = URL.createObjectURL(file)
                    setImages((prev) => [...prev, url])
                    imagePasted = true
                }
            })
        }

        // 2. Fallback para items (clipboardData.items)
        if (!imagePasted) {
            const items = e.clipboardData?.items
            if (items) {
                // Usa for clássico porque DataTransferItemList não é um array puro
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    if (item.type.startsWith("image/")) {
                        const file = item.getAsFile()
                        if (file) {
                            const url = URL.createObjectURL(file)
                            setImages((prev) => [...prev, url])
                            imagePasted = true
                            break
                        }
                    }
                }
            }
        }

        // 3. Fallback SUPER Agressivo (Async Clipboard API) - Resolve problemas crônicos de WebKitGTK/Linux
        if (!imagePasted) {
            try {
                const clipboardItems = await navigator.clipboard.read()
                for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                        if (type.startsWith("image/")) {
                            const blob = await clipboardItem.getType(type)
                            const url = URL.createObjectURL(blob)
                            setImages((prev) => [...prev, url])
                            imagePasted = true
                            break
                        }
                    }
                }
            } catch (err) {
                console.warn("Async clipboard fallback não retornou imagem:", err)
            }
        }
        // 3. Se uma imagem foi processada, previne o comportamento padrão de colar texto/lixo binário
        if (imagePasted) {
            e.preventDefault()
        }
    }

    // REMOVE UMA IMAGEM DA LISTA E REVOGA A BLOB URL
    const removeImage = (index: number) => {
        setImages((prev) => {
            const url = prev[index]
            if (url?.startsWith("blob:")) URL.revokeObjectURL(url)
            return prev.filter((_, i) => i !== index)
        })
    }

    return (
        <div className="relative z-10 px-3 pb-3 pt-7 bg-sidebar border-t border-border/40 shadow-depth-lg-up">
            <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto relative">

                {/* Model Name "Orelhinha" Tab */}
                {modelName && (
                    <div className="absolute -top-5 left-3 z-10 flex items-center gap-1.5 px-3 py-0.5 rounded-t-md bg-card text-[10px] font-semibold text-primary uppercase tracking-widest shadow-depth-sm">
                        <Bot className="w-3 h-3" />
                        {modelName}
                    </div>
                )}

                {/* Main Input Card */}
                <div className="rounded-2xl bg-card shadow-depth-md ring-1 ring-border/40 overflow-hidden">

                    {/* Image Previews */}
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-3 pt-3">
                            {images.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img src={img} alt="preview" className="h-16 w-16 object-cover rounded-lg shadow-depth-sm" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-depth-sm"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Textarea */}
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Envie uma mensagem..."
                        className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] leading-relaxed px-4 pt-4 pb-2 placeholder:text-muted-foreground/50"
                        rows={1}
                    />

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-between px-2 pb-2">
                        <div className="flex items-center gap-0.5">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Anexar arquivo</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={onToggleWebSearch}
                                            className={cn(
                                                "h-8 w-8 rounded-xl transition-colors",
                                                webSearchEnabled
                                                    ? "text-primary bg-primary/10 hover:bg-primary/20"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                            )}
                                        >
                                            {webSearchEnabled ? <Globe className="h-4 w-4" /> : <Ghost className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{webSearchEnabled ? "Busca na Web Ativada" : "Busca na Web Desativada"}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <Button
                            type="submit"
                            size="icon"
                            disabled={(!value.trim() && images.length === 0) || isLoading}
                            className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 transition-all shadow-depth-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </form>
        </div>
    )
}