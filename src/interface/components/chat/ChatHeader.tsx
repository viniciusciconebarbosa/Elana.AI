import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { Button } from "@/interface/components/ui/button"
import { Badge } from "@/interface/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/interface/components/ui/dropdown-menu"
import { cn } from "@/interface/lib/utils"
import { ChevronDown, Bot, Coffee, Brain, CalendarDays, Lightbulb, Trash2, Menu } from "lucide-react"
import { DeleteChatModal } from "./DeleteChatModal"
import { useSidebar } from "@/interface/context/SidebarContext"

// TIPO DOS MODOS DE CONVERSA DISPONÍVEIS
type ConversationMode = "casual" | "deep" | "planning" | "memory"

interface ChatHeaderProps {
    isNewChat: boolean
    modelName?: string
    mode: ConversationMode
    onModeChange: (mode: ConversationMode) => void
    onDelete?: () => void
}

// CABEÇALHO DO CHAT — EXIBE O TÍTULO, SELETOR DE MODO E BOTÃO DE DELETAR
export function ChatHeader({ isNewChat, modelName, mode, onModeChange, onDelete }: ChatHeaderProps) {
    const { t } = useTranslation()
    const { toggleMobile } = useSidebar()

    // LISTA DE MODOS COM ÍCONE E DESCRIÇÃO DINÂMICOS
    const modes = useMemo<({ id: ConversationMode; label: string; icon: typeof Coffee; description: string })[]>(() => [
        { id: "casual", label: t("chatModes.casual"), icon: Coffee, description: t("chatModes.casualDesc") },
        { id: "deep", label: t("chatModes.deep"), icon: Brain, description: t("chatModes.deepDesc") },
        { id: "planning", label: t("chatModes.planning"), icon: CalendarDays, description: t("chatModes.planningDesc") },
        { id: "memory", label: t("chatModes.memory"), icon: Lightbulb, description: t("chatModes.memoryDesc") },
    ], [t])

    // Encontra o objeto do modo atual para exibir o ícone e label corretos
    const currentMode = useMemo(() => modes.find((m) => m.id === mode) || modes[0], [modes, mode])

    return (
        <header
            className="relative z-10 flex items-center justify-between bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur-md border-b border-border/40 px-4 sm:px-6 py-3 shrink-0 transition-all shadow-[0_1px_34px_rgba(0,0,0,0.21)] dark:shadow-[0_1px_34px_rgba(0,0,0,0.8)]"
        >
            <div className="flex items-center gap-2 sm:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={toggleMobile}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <h1 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">
                    {isNewChat ? t("chat.newChat") : t("chat.chat")}
                </h1>

                <div className="h-5 w-[1px] bg-border/60 hidden sm:block" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 h-8 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all">
                            <currentMode.icon className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{currentMode.label}</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 rounded-xl">
                        {modes.map((m) => (
                            <DropdownMenuItem
                                key={m.id}
                                onClick={() => onModeChange(m.id)}
                                className="flex items-center gap-3 py-2.5 rounded-lg cursor-pointer"
                            >
                                <m.icon className={cn("h-4 w-4", mode === m.id ? "text-primary" : "text-muted-foreground")} />
                                <div className="flex flex-col gap-0.5">
                                    <span className={cn("text-sm", mode === m.id ? "text-primary font-medium" : "text-foreground font-medium")}>
                                        {m.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground/80">{m.description}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {!isNewChat && onDelete && (
                <div className="flex items-center">
                    <DeleteChatModal onConfirm={onDelete}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full transition-colors"
                            title={t("modals.deleteChat.confirm", "Excluir Chat")}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("modals.deleteChat.confirm", "Excluir Chat")}</span>
                        </Button>
                    </DeleteChatModal>
                </div>
            )}
        </header>
    )
}
