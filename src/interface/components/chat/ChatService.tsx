import { useState, useCallback, useRef, useEffect, useTransition } from "react"
import { useModel } from "@/interface/context/ModelContext"
import { useChatList } from "@/interface/context/ChatListContext"
import { useApiKeys } from "@/interface/context/ApiKeysContext"
import { cn } from "@/interface/lib/utils"
import { runChatService } from "@/core/application/services/ChatService"
import { getChatRepository } from "@/core/infrastructure/repositories/ChatRepositoryFactory"

const chatRepository = getChatRepository()
import { getPublicImageBaseUrl } from "@/core/infrastructure/storage/S3Client"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    memoryUsed?: string[]
    isHistory?: boolean
    images?: string[]
}

interface UseChatOptions {
    chatId?: string
    onMessageStart?: () => void
    onMessageComplete?: (message: Message) => void
}

interface UseChatReturn {
    messages: Message[]
    input: string
    setInput: (value: string) => void
    isLoading: boolean
    isLoadingHistory: boolean
    toolStatus: string | null
    sendMessage: (content: string, images?: string[]) => Promise<void>
    clearMessages: () => void
    deleteFromHere: (messageId: string) => Promise<void>
    webSearchEnabled: boolean
    setWebSearchEnabled: (value: boolean) => void
}



// HOOK PRINCIPAL DO CHAT — GERENCIA MENSAGENS, LOADING, STREAMING E ENVIO
export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { config } = useModel()
    const { addChat } = useChatList()
    const { getEncryptedKeys } = useApiKeys()
    const navigate = useNavigate()
    const [isPending, startTransition] = useTransition()

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    // SEPARADO DE isLoading: indica carregamento do histórico do banco (não bloqueia o chat)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    // STATUS DA TOOL ATIVA — exibido no LoadingIndicator enquanto o modelo usa uma ferramenta
    const [toolStatus, setToolStatus] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const pendingFlushRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [webSearchEnabled, setWebSearchEnabled] = useState(true)
    // Tracks the resolved chatId after a "new" chat is created so we don't create duplicates
    const resolvedChatIdRef = useRef<string | null>(null)

    // Helper to identify if we are currently transitioning to a newly created chat
    const isInitialNavigationRef = useRef(false)

    // Refs estáveis para evitar recriar sendMessage a cada mudança de estado
    const messagesRef = useRef(messages)
    const isLoadingRef = useRef(isLoading)
    const configRef = useRef(config)
    const optionsRef = useRef(options)
    const webSearchRef = useRef(webSearchEnabled)

    messagesRef.current = messages
    isLoadingRef.current = isLoading
    configRef.current = config
    optionsRef.current = options
    webSearchRef.current = webSearchEnabled

    // Load messages from the database when a chatId is provided
    useEffect(() => {
        let cancelled = false

        // Abort any in-flight stream when switching chats
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }

        if (options.chatId && options.chatId !== "new") {
            // If we are currently navigating to a newly created chat, skip reloading from DB
            if (options.chatId === resolvedChatIdRef.current || isInitialNavigationRef.current) {
                isInitialNavigationRef.current = false;
                resolvedChatIdRef.current = null;
                return;
            }

            // Reset stale refs from the previous chat
            resolvedChatIdRef.current = null
            isInitialNavigationRef.current = false

            setIsLoadingHistory(true)
            chatRepository.getAllMessagesFromChat(options.chatId)
                .then(data => {
                    if (cancelled) return  // chat foi trocado antes do fetch terminar
                    if (Array.isArray(data)) {
                        setMessages(data.map((m: any) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                            timestamp: new Date(m.created_at || Date.now()),
                            isHistory: true,
                            images: m.metadata?.images?.map((img: string) =>
                                img.startsWith('http') || img.startsWith('data:') || img.startsWith('asset://')
                                    ? img
                                    : `${getPublicImageBaseUrl()}/${img}`
                            ) || undefined
                        })))
                    }
                })
                .catch(err => { if (!cancelled) console.error("Error loading messages:", err) })
                .finally(() => { if (!cancelled) setIsLoadingHistory(false) })
        } else {
            isInitialNavigationRef.current = false;
            resolvedChatIdRef.current = null;
            setMessages([])
        }

        return () => { cancelled = true }
    }, [options.chatId])

    const sendMessage = useCallback(async (content: string, images: string[] = []) => {
        if ((!content.trim() && images.length === 0) || isLoadingRef.current) return

        const apiKeysData = getEncryptedKeys()
        const hasActiveKeys = apiKeysData?.all?.some(k => k.isActive)

        if (!hasActiveKeys) {
            toast.error("Nenhuma chave configurada", {
                description: "Por favor, adicione e ative uma chave de API nas configurações."
            })
            return
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
            images: images.length > 0 ? images : undefined
        }

        // Postgres requires a valid UUID for parent_id.
        // If the previous message is local (Date.now), we skip parentId to avoid a DB crash.
        const currentMessages = messagesRef.current
        const prevId = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].id : ""
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prevId)
        const parentId = isValidUUID ? prevId : undefined

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        optionsRef.current.onMessageStart?.()

        abortControllerRef.current = new AbortController()

        // Unique ID for the assistant reply bubble, created before try/catch so all handlers can reference it
        const assistantMessageId = (Date.now() + 1).toString()

        // EXIBE UMA MENSAGEM DE ERRO DIRETO NO CHAT COMO BOLHA DO ASSISTENTE
        const showErrorInChat = (errorContent: string) => {
            setMessages((prev) => [
                ...prev,
                { id: assistantMessageId, role: "assistant", content: errorContent, timestamp: new Date() },
            ])
        }

        try {
            const allMessages = [...messagesRef.current, userMessage]

            // JANELA DE CONTEXTO ADAPTATIVA: MENOS MENSAGENS EM CONVERSAS LONGAS
            const calculateWindowSize = (msgs: Message[]) => {
                if (msgs.length <= 1) return 80
                const recentMsgs = msgs.slice(-10)
                const avgLength = recentMsgs.reduce((sum, m) => sum + m.content.length, 0) / recentMsgs.length
                if (avgLength > 800) return 30
                if (avgLength > 300) return 45
                return 80
            }

            const contextWindow = allMessages.slice(-calculateWindowSize(allMessages))

            const apiMessages = contextWindow.map((m) => {
                const timeStr = m.timestamp.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
                const dateStr = m.timestamp.toLocaleDateString("pt-BR");
                const local = Intl.DateTimeFormat().resolvedOptions().timeZone;

                // Prefixo de data/hora/local apenas nas mensagens do usuário
                const contentWithTime = m.role === "user"
                    ? `[${dateStr} ${timeStr} - ${local}] ${m.content}`
                    : m.content;

                if (m.images && m.images.length > 0) {
                    const parts: any[] = []
                    if (m.content.trim()) {
                        parts.push({ type: "text", text: contentWithTime })
                    } else {
                        parts.push({ type: "text", text: `[${dateStr} ${timeStr}] O que há nesta imagem?` })
                    }
                    m.images.forEach(img => parts.push({ type: "image", image: img }))
                    return { role: m.role, content: parts }
                }
                return { role: m.role, content: contentWithTime }
            })

            const apiKeys = getEncryptedKeys()

            const result = await runChatService({
                messages: apiMessages,

                rawUserText: userMessage.content,
                chatId: resolvedChatIdRef.current || optionsRef.current.chatId,
                parentId,
                webSearchEnabled: webSearchRef.current,
                config: configRef.current || undefined,
                apiKeys
            })

            // --- Error Handling ---
            if ('error' in result) {
                let errorMessage = `⚠️ **Erro no Processamento**`
                const msg = result.error?.message
                errorMessage += `\n\n${msg}`
                showErrorInChat(errorMessage)
                return
            }

            const { customStream, currentChatId: newChatId, uploadedImages } = result as any

            // --- New Chat ID ---
            if (newChatId && (!resolvedChatIdRef.current || optionsRef.current.chatId === "new")) {
                resolvedChatIdRef.current = newChatId
                if (optionsRef.current.chatId === "new") {
                    isInitialNavigationRef.current = true
                    startTransition(() => {
                        navigate(`/chat?id=${newChatId}`, { replace: true })
                    })
                }
                addChat({
                    id: newChatId,
                    title: new Date().toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                    }),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
            }

            // --- Stream Reading ---
            const reader = customStream?.getReader()
            if (!reader) {
                showErrorInChat("⚠️ **Erro de leitura**\n\nNão foi possível ler o stream de resposta.")
                return
            }

            let assistantContent = ""

            setMessages((prev) => [
                ...prev,
                { id: assistantMessageId, role: "assistant", content: "", timestamp: new Date() },
            ])

            const textDecoder = new TextDecoder()


            let lastFlush = 0
            const FLUSH_INTERVAL_MS = 80

            // FLUSH THROTTLED: ATUALIZA O ESTADO NO MÁXIMO A CADA 80ms PARA EVITAR RE-RENDERS EXCESSIVOS
            const flushUpdate = () => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                    )
                )
                lastFlush = Date.now()
                pendingFlushRef.current = null
            }

            try {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const decoded = textDecoder.decode(value, { stream: true })
                    if (decoded) {
                        // PARSEIA LINHAS DE STATUS DE TOOL INJETADAS PELO BACKEND
                        const lines = decoded.split('\n')
                        let textChunk = ''
                        for (const line of lines) {
                            if (line.startsWith('[TOOL:')) {
                                setToolStatus(line.slice(6, -1)) // extrai o label entre [TOOL: e ]
                            } else if (line === '[TOOL_DONE]') {
                                setToolStatus(null)
                            } else {
                                textChunk += line + (lines.indexOf(line) < lines.length - 1 ? '\n' : '')
                            }
                        }
                        if (textChunk) {
                            assistantContent += textChunk
                        }
                        const now = Date.now()
                        if (now - lastFlush >= FLUSH_INTERVAL_MS) {
                            if (pendingFlushRef.current) {
                                clearTimeout(pendingFlushRef.current)
                                pendingFlushRef.current = null
                            }
                            flushUpdate()
                        } else if (!pendingFlushRef.current) {
                            pendingFlushRef.current = setTimeout(flushUpdate, FLUSH_INTERVAL_MS)
                        }
                    }
                }
            } finally {
                if (pendingFlushRef.current) {
                    clearTimeout(pendingFlushRef.current)
                    pendingFlushRef.current = null
                }
                // garante o estado final e limpa o status de tool
                setToolStatus(null)
                flushUpdate()
                try { reader.releaseLock() } catch { /* noop */ }
            }



            // --- Empty Stream (silent failure) ---
            if (!assistantContent.trim()) {
                const emptyStreamError = `⚠️ **Resposta vazia**\n\nO modelo não retornou nenhum conteúdo. Verifique se a chave de API está configurada corretamente.`
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMessageId ? { ...m, content: emptyStreamError } : m
                    )
                )
                return
            }

            const finalMessage: Message = {
                id: assistantMessageId,
                role: "assistant",
                content: assistantContent,
                timestamp: new Date(),
            }
            optionsRef.current.onMessageComplete?.(finalMessage)

            // Substitui imagens base64 pelas URLs finais do S3 retornadas pelo backend
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.role === "user" && m.id === userMessage.id) {
                        const finalImages = uploadedImages && uploadedImages.length > 0 
                            ? uploadedImages.map((img: string) => 
                                img.startsWith('http') || img.startsWith('data:') 
                                ? img 
                                : `${getPublicImageBaseUrl()}/${img}`
                              )
                            : m.images
                            
                        return { ...m, images: finalImages }
                    }
                    return m
                })
            )

        } catch (err: unknown) {
            // Ignore user-triggered cancellations
            if (err instanceof Error && err.name === "AbortError") return

            // --- Network / Unexpected Error ---
            console.error("Error sending message:", err)
            const message = err instanceof Error ? err.message : "Erro desconhecido"
            showErrorInChat(`🔌 **Erro de conexão**\n\nNão foi possível se comunicar com o servidor. Verifique sua conexão e tente novamente.\n\n\`\`\`\n${message}\n\`\`\``)
        } finally {
            setIsLoading(false)
            abortControllerRef.current = null
        }
    }, [])

    // LIMPA TODAS AS MENSAGENS DO CHAT
    const clearMessages = useCallback(() => setMessages([]), [])

    // APAGA A MENSAGEM SELECIONADA E TODAS AS SEGUINTES
    const deleteFromHere = useCallback(async (messageId: string) => {
        if (!optionsRef.current.chatId || optionsRef.current.chatId === "new") return

        const targetIndex = messagesRef.current.findIndex(m => m.id === messageId)
        if (targetIndex === -1) return

        try {
            // Coleta imagens locais (asset://) das mensagens que serão apagadas
            const msgsToDelete = messagesRef.current.slice(targetIndex)
            const localImagePaths: string[] = []
            for (const msg of msgsToDelete) {
                if (msg.images) {
                    for (const img of msg.images) {
                        if (img.startsWith('asset://')) {
                            localImagePaths.push(img)
                        }
                    }
                }
            }

            setMessages(prev => prev.slice(0, targetIndex))
            await chatRepository.deleteMessageAndSubsequent(messageId, optionsRef.current.chatId)

            // Remove os arquivos físicos do disco após confirmar deleção do banco
            if (localImagePaths.length > 0) {
                const { remove } = await import('@tauri-apps/plugin-fs')
                const { convertFileSrc } = await import('@tauri-apps/api/core')
                for (const assetUrl of localImagePaths) {
                    try {
                        // Converte asset:// de volta para o caminho físico do sistema
                        // asset:// URLs no Tauri seguem o padrão: asset://localhost/<path absoluto>
                        const physicalPath = decodeURIComponent(assetUrl.replace(/^asset:\/\/localhost/, '').replace(/^asset:\/\//, ''))
                        await remove(physicalPath)
                    } catch (e) {
                        console.warn('Não foi possível apagar imagem local:', e)
                    }
                }
            }

            toast.success("Histórico truncado", {
                description: "Mensagens excluídas com sucesso."
            })
        } catch (err) {
            console.error("Erro ao apagar mensagens:", err)
            toast.error("Erro ao apagar", {
                description: "Falha ao excluir as mensagens do banco de dados."
            })
        }
    }, [])

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort()
            if (pendingFlushRef.current) {
                clearTimeout(pendingFlushRef.current)
                pendingFlushRef.current = null
            }
        }
    }, [])

    return { messages, input, setInput, isLoading, isLoadingHistory, toolStatus, sendMessage, clearMessages, deleteFromHere, webSearchEnabled, setWebSearchEnabled }
}