"use client"

import { Badge } from "@/interface/components/ui/badge"
import { Button } from "@/interface/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/interface/components/ui/tooltip"
import { cn } from "@/interface/lib/utils"
import { Coffee, Brain, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react"
import { TypingEffect } from "./TypingEffect"
import type { Message } from "@/interface/components/chat/ChatService"

import { MarkdownRenderer } from "./MarkdownRenderer"
import { memo, useState } from "react";
import { toast } from "sonner"
import { DeleteMessageButton } from "./DeleteMessageModal"

interface MessageBubbleProps {
    message: Message
    isStreaming?: boolean
    onDeleteFromHere?: (messageId: string) => void
    isFirstMessage?: boolean
}

export function MessageBubbleComponent({ message, isStreaming, onDeleteFromHere, isFirstMessage }: MessageBubbleProps) {
    const isUser = message.role === "user"
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)

    }

    // Se a mensagem estava streamando quando montou, mantemos o TypingEffect vivo
    // mesmo quando isStreaming vira false (para que ele termine a animação de digitar)
    const [wasStreaming] = useState(isStreaming)

    return (
        <div className={cn("flex items-center justify-center gap-0.1 group", isUser && "flex-row-reverse")}>
            <div className={cn("flex-1 max-w-[100%] sm:max-w-[95%] md:max-w-[95%] lg:max-w-[78%] ", isUser && "flex flex-col items-end")}>
                {isUser ? (
                    <div>
                        <span className=" mb-2 rounded-xl px-3 py-5 shadow-lg border border-primary/50 shadow-primary/50  flex items-center justify-center bg-primary/20 font-medium text-primary">Vinicius</span>
                    </div>
                ) : (
                    <div className="w-8 h-8 mb-2 rounded-full flex items-center justify-center bg-primary/20 text-accent">
                        <Coffee className="w-4 h-4" />
                    </div>
                )}
                <div
                    className={cn(
                        "rounded-xl break-words overflow-hidden max-w-full",
                        isUser ? "msg-user px-5 py-4" : "msg-assistant"
                    )}
                >
                    {/* Renderização de Imagens */}
                    {message.images && message.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {message.images.map((img, i) => (
                                <a
                                    key={i}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-44 h-30 rounded-lg overflow-hidden group relative cursor-zoom-in shadow-depth-sm"
                                >
                                    <img
                                        src={img}
                                        alt="Attachment"
                                        className="block w-44 h-30  object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </a>
                            ))}
                        </div>
                    )}

                    <div className={cn(
                        "leading-relaxed font-[400] tracking-[0.02em] break-words",
                        !isUser && ""
                    )}>
                        {wasStreaming && !isUser ? (
                            <TypingEffect text={message.content} isStreaming={isStreaming ?? false} />
                        ) : (
                            <MarkdownRenderer>{message.content}</MarkdownRenderer>
                        )}
                    </div>
                </div>

                {/* Memory indicators */}
                {message.memoryUsed && message.memoryUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {message.memoryUsed.map((memory, i) => (
                            <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-accent/10 text-accent border-accent/30"
                            >
                                <Brain className="w-3 h-3 mr-1" />
                                {memory}
                            </Badge>
                        ))}
                    </div>
                )}



                {/* Actions for user messages */}
                {isUser && !isFirstMessage && (
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                            <DeleteMessageButton onConfirm={() => onDeleteFromHere?.(message.id)}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </DeleteMessageButton>
                        </TooltipProvider>
                    </div>
                )}

                {/* Actions for assistant messages */}
                {!isUser && (
                    <div className="flex items-center gap-1 mt-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handleCopy}
                                    >
                                        {copied ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar Markdown</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7  ">
                                        <RotateCcw className="h-3 w-3  " />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Regenerar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 ">
                                        <ThumbsUp className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bom</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 ">
                                        <ThumbsDown className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ruim</TooltipContent>
                            </Tooltip>
                            {!isFirstMessage && (
                                <DeleteMessageButton onConfirm={() => onDeleteFromHere?.(message.id)}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </DeleteMessageButton>
                            )}
                        </TooltipProvider>
                    </div>
                )}

                <span className="text-[12px] font-medium text-muted-foreground mt-1.5 opacity-80">
                    {message.timestamp.toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "long",
                        weekday: "long"
                    })}
                </span>

            </div>
        </div>
    )
}

export const MessageBubble = memo(
    MessageBubbleComponent,
    (prev, next) => {
        if (prev.isStreaming !== next.isStreaming) return false
        if (prev.message.id !== next.message.id) return false
        if (prev.message.content !== next.message.content) return false
        if (prev.message.isHistory !== next.message.isHistory) return false
        // Comparação rasa de imagens
        const prevImgs = prev.message.images || []
        const nextImgs = next.message.images || []
        if (prevImgs.length !== nextImgs.length) return false
        for (let i = 0; i < prevImgs.length; i++) {
            if (prevImgs[i] !== nextImgs[i]) return false
        }
        return true
    }
)