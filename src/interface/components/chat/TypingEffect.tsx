import { useEffect, useRef, useState } from "react"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface TypingEffectProps {
    text: string
    isStreaming: boolean
}

// EFEITO DE DIGITAÇÃO — EXIBE O TEXTO PROGRESSIVAMENTE E RENDERIZA MARKDOWN AO FINALIZAR
export function TypingEffect({ text, isStreaming }: TypingEffectProps) {
    const [displayedLength, setDisplayedLength] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Sempre atualizado no render — o interval lê daqui sem precisar reiniciar
    const textRef = useRef(text)
    textRef.current = text

    const isStreamingRef = useRef(isStreaming)
    isStreamingRef.current = isStreaming

    // Inicia o interval UMA VEZ por instância do componente.
    // Como cada mensagem cria uma nova instância de TypingEffect,
    // não há necessidade de reiniciar quando `text` cresce.
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setDisplayedLength((prev) => {
                const target = textRef.current.length
                // Se já exibiu tudo e não está mais streamando, para o interval
                if (prev >= target) {
                    if (!isStreamingRef.current && intervalRef.current) {
                        clearInterval(intervalRef.current)
                        intervalRef.current = null
                    }
                    return prev
                }
                return prev + 3
            })
        }, 15)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, []) // [] = roda só no mount, nunca reinicia por mudança de `text`

    const clamped = Math.min(displayedLength, text.length)
    const isComplete = clamped >= text.length && !isStreaming
    const displayedText = text.slice(0, clamped)

    // AUTO-SCROLL INTELIGENTE DURANTE O EFEITO DE DIGITAÇÃO
    // Como o TypingEffect continua rodando mesmo após a rede finalizar,
    // garantimos que o scroll desça acompanhando as letrinhas sendo renderizadas.
    useEffect(() => {
        if (!isComplete) {
            const scrollArea = document.getElementById("chat-scroll-area")
            if (scrollArea) {
                // Checa se o usuário está perto do fim (não rolou pra cima pra ler outra coisa)
                const isNearBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 250
                if (isNearBottom) {
                    scrollArea.scrollTop = scrollArea.scrollHeight
                }
            }
        }
    }, [displayedLength, isComplete])

    // Durante streaming: plain text para não re-parsear Markdown a cada frame.
    // Quando completo: renderização completa com Markdown.
    if (!isComplete || isStreaming) {
        return (
            <span style={{ whiteSpace: "pre-wrap" }}>
                {displayedText}
                {isStreaming && !isComplete && (
                    <span style={{ opacity: 0.7 }}> ▍</span>
                )}
            </span>
        )
    }

    return <MarkdownRenderer>{displayedText}</MarkdownRenderer>
}