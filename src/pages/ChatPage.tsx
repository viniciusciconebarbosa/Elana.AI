import { useRef, useEffect, useState, Suspense, forwardRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useChatList } from "@/interface/context/ChatListContext"
import { useModel } from "@/interface/context/ModelContext"
import { ChatHeader } from "@/interface/components/chat/ChatHeader"
import { ChatInput } from "@/interface/components/chat/ChatInput"
import { MessageBubble } from "@/interface/components/chat/MessageBubble"
import { DaySeparator } from "@/interface/components/chat/DaySeparator"
import { LoadingIndicator } from "@/interface/components/chat/LoadingIndicator"
import { WelcomeScreen } from "@/interface/components/chat/WelcomeScreen"
import { useChat } from "@/interface/components/chat/ChatService"
import { Virtuoso, VirtuosoHandle } from "react-virtuoso"
import type { Message } from "@/interface/components/chat/ChatService"

type ConversationMode = "casual" | "deep" | "planning" | "memory"

/* ─── Contexto passado para os componentes do Virtuoso ──────────────────────── */
interface VirtuosoContext {
    isLoading: boolean
    toolStatus: string | null
}

/* ─── Componentes estáticos do Virtuoso — definidos FORA do render para que
       suas referências sejam estáveis e o React nunca desmonte/remonte o DOM. ─ */

// Contêiner de scroll — recebe o forwardRef do Virtuoso (oculta a barra de rolagem nativa)
const ChatScroller = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
    (props, ref) => (
        <div
            {...props}
            ref={ref}
            id="chat-scroll-area"
            className="flex-1 overflow-y-auto mx-5 [&::-webkit-scrollbar]:hidden"
            style={{ ...props.style, scrollbarWidth: "none", msOverflowStyle: "none" }}
        />
    )
)
ChatScroller.displayName = "ChatScroller"

// Espaçamento no topo da lista
const ChatListHeader = () => <div style={{ height: 32 }} />

// Footer exibe o LoadingIndicator via context (sem closure que invalida a referência)
const ChatListFooter = ({ context }: { context?: VirtuosoContext }) => (
    <div className="max-w-3xl mx-auto py-1 px-4">
        {context?.isLoading && <LoadingIndicator toolStatus={context.toolStatus} />}
        <div style={{ height: 16 }} />
    </div>
)

// Wrapper de cada item da lista — aplica max-width e espaçamento vertical
const ChatListItem = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
    <div {...props} className="max-w-5xl mx-auto py-3">
        {children}
    </div>
)

// Objeto de componentes — definido fora para ter referência estável entre renders
const virtuosoComponents = {
    Scroller: ChatScroller,
    Header: ChatListHeader,
    Footer: ChatListFooter,
    Item: ChatListItem,
} as const

/* ─── Skeleton de histórico ─────────────────────────────────────────────────── */
function HistorySkeleton() {
    return (
        <div id="chat-scroll-area" className="flex-1 overflow-y-auto px-4">
            <div className="max-w-5xl mx-auto py-8">
                <div className="space-y-6 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                            <div className={`h-14 rounded-2xl bg-muted ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ─── Conteúdo da página ────────────────────────────────────────────────────── */
function ChatPageContent() {
    const [searchParams] = useSearchParams()
    const chatId = searchParams.get("id") || "new"
    const isNewChat = chatId === "new"

    const { config } = useModel()
    const {
        messages, input, setInput, isLoading, isLoadingHistory, toolStatus,
        sendMessage, deleteFromHere, webSearchEnabled, setWebSearchEnabled,
    } = useChat({ chatId })
    const { removeChat } = useChatList()
    const navigate = useNavigate()

    const [mode, setMode] = useState<ConversationMode>("casual")
    const virtuosoRef = useRef<VirtuosoHandle>(null)

    // DELETA O CHAT ATUAL E REDIRECIONA PARA UM NOVO CHAT
    const handleDeleteChat = async () => {
        await removeChat(chatId)
        navigate("/chat?id=new")
    }

    // Garante que o scroll vá para o final exato após o carregamento.
    // Disparamos em múltiplos momentos para absorver todos os reflows causados
    // pelo react-markdown e rehype-highlight ao processar o histórico.
    useEffect(() => {
        if (!isLoadingHistory && messages.length > 0) {
            let stopped = false
            const scrollToEnd = () => {
                if (stopped) return
                virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "auto" })
            }

            const raf = requestAnimationFrame(scrollToEnd)
            const t1 = setTimeout(scrollToEnd, 150)
            const t2 = setTimeout(scrollToEnd, 500)
            const t3 = setTimeout(scrollToEnd, 1000)

            return () => {
                stopped = true
                cancelAnimationFrame(raf)
                clearTimeout(t1)
                clearTimeout(t2)
                clearTimeout(t3)
            }
        }
    }, [isLoadingHistory, chatId])

    // Garante que a rolagem acompanhe e se ajuste ao final da lista assim que o LoadingIndicator é desmontado
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            const scrollToEnd = () => {
                virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "smooth" })
            }
            // Aguarda um pequeno delay para a desmontagem do LoadingIndicator completar no DOM
            const t = setTimeout(scrollToEnd, 60)
            return () => clearTimeout(t)
        }
    }, [isLoading])

    // Garante que a rolagem acompanhe e revele totalmente o LoadingIndicator quando ele surge ou muda de status (toolStatus)
    useEffect(() => {
        if (isLoading) {
            const scrollToEnd = () => {
                virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "auto" })
            }
            scrollToEnd()
            const t1 = setTimeout(scrollToEnd, 50)
            const t2 = setTimeout(scrollToEnd, 150)
            return () => {
                clearTimeout(t1)
                clearTimeout(t2)
            }
        }
    }, [isLoading, toolStatus])

    // HANDLER DE SUBMIT DA MENSAGEM, PASSANDO AS IMAGENS ANEXADAS
    const handleSubmit = async (e: React.FormEvent, images?: string[]) => {
        e.preventDefault()
        if ((!input.trim() && (!images || images.length === 0)) || isLoading) return
        await sendMessage(input, images)
    }

    // Contexto passado para os componentes do Virtuoso (Footer, etc.)
    const virtuosoContext: VirtuosoContext = { isLoading, toolStatus }

    return (
        <div className="flex flex-col w-full h-full">
            <ChatHeader
                isNewChat={isNewChat}
                modelName={config?.modelName}
                mode={mode}
                onModeChange={setMode}
                onDelete={handleDeleteChat}
            />

            {/* ── Estado 1: Carregando histórico do banco ── */}
            {isLoadingHistory ? (
                <HistorySkeleton />

            /* ── Estado 2: Chat vazio / novo ── */
            ) : messages.length === 0 ? (
                <div 
                    id="chat-scroll-area" 
                    className="flex-1 overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    <div className="max-w-5xl mx-auto py-8">
                        <WelcomeScreen onPromptClick={(prompt) => setInput(prompt)} />
                    </div>
                </div>

            /* ── Estado 3: Lista virtualizada de mensagens ── */
            ) : (
                <Virtuoso<Message, VirtuosoContext>
                    ref={virtuosoRef}
                    style={{ flex: 1 }}
                    data={messages}
                    context={virtuosoContext}
                    components={virtuosoComponents}
                    initialTopMostItemIndex={{ index: "LAST", align: "end" }}
                    alignToBottom
                    computeItemKey={(_, message) => message.id}
                    followOutput={(isAtBottom) => {
                        // Quando está carregando/streamando, forçamos o scroll a acompanhar
                        // mesmo que pequenas variações no DOM façam o isAtBottom falhar temporariamente.
                        if (isLoading) return "smooth"
                        return isAtBottom ? "smooth" : false
                    }}
                    itemContent={(index, message) => {
                        const isLastAssistant =
                            message.role === "assistant" && index === messages.length - 1
                        const currentDay = message.timestamp.toDateString()
                        const previousDay = index > 0
                            ? messages[index - 1].timestamp.toDateString()
                            : null
                        const showSeparator = currentDay !== previousDay

                        return (
                            <div>
                                {showSeparator && <DaySeparator date={message.timestamp} />}
                                <MessageBubble
                                    message={message}
                                    isStreaming={isLoading && isLastAssistant}
                                    onDeleteFromHere={deleteFromHere}
                                    isFirstMessage={index === 0}
                                />
                            </div>
                        )
                    }}
                />
            )}

            <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                modelName={config?.modelName}
                webSearchEnabled={webSearchEnabled}
                onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
            />
        </div>
    )
}

// PÁGINA PRINCIPAL DO CHAT — ENVOLVE O CONTEÚDO EM SUSPENSE PARA LOADING SEGURO
export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingIndicator /></div>}>
            <ChatPageContent />
        </Suspense>
    )
}
