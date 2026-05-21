import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom"
import { useState, memo, useCallback, useMemo, useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/interface/lib/utils"
import { Badge } from "@/interface/components/ui/badge"
import { Button } from "@/interface/components/ui/button"
import { Input } from "@/interface/components/ui/input"
import { ScrollArea } from "@/interface/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/interface/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/interface/components/ui/sheet"
import { useChatList } from "@/interface/context/ChatListContext"
import {
    MessageSquare,
    Brain,
    Database,
    Settings,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    Sun,
    Moon,
    User,
    Briefcase,
    GraduationCap,
    Plane,
    Heart,
    MapPin,
    Bot,
    Key,
    Palette,
    Bell,
    Shield,
    Menu,
    Pencil,
    Trash2,
    ServerCog,
    Hammer,
} from "lucide-react"

import { useSidebar } from "@/interface/context/SidebarContext"
import { RenameChatModal } from "@/interface/components/chat/RenameChatModal"
import { DeleteChatModal } from "@/interface/components/chat/DeleteChatModal"

const navItems = [
    { href: "/chat?id=new", icon: MessageSquare, label: "Chat" },
    { href: "/brain", icon: Brain, label: "Brain" },
    { href: "/memories", icon: Database, label: "Memórias" },
    { href: "/settings", icon: Settings, label: "Configurações" },
]

export const categories = [
    { id: "all", label: "Todos", icon: Database, count: 1247 },
    { id: "personal", label: "Pessoal", icon: User, count: 342 },
    { id: "work", label: "Trabalho", icon: Briefcase, count: 289 },
    { id: "education", label: "Educação", icon: GraduationCap, count: 156 },
    { id: "travel", label: "Viagens", icon: Plane, count: 134 },
    { id: "relationships", label: "Relacionamentos", icon: Heart, count: 198 },
    { id: "locations", label: "Lugares", icon: MapPin, count: 128 },
]

// ANOS DISPONÍVEIS NO FILTRO DE TIMELINE
export const timelineYears = ["2024", "2023", "2022", "2021"]

export const settingsSections = [
    { id: "general", label: "Geral", icon: Settings },
    { id: "models", label: "Modelos", icon: Bot },
    { id: "chat-database", label: "Chat Database", icon: ServerCog },
    { id: "api-keys", label: "Chaves API", icon: Key },
    { id: "tools", label: "Ferramentas", icon: Hammer },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "privacy", label: "Privacidade", icon: Shield },
    { id: "data", label: "Dados", icon: Database },
]

// COMPONENTE PRINCIPAL DA SIDEBAR — EXIBE NAVEGAÇÃO, LISTA DE CHATS E USUÁRIO
export const AppSidebar = memo(function AppSidebar() {
    const location = useLocation()
    const pathname = location.pathname
    const [searchParams] = useSearchParams()
    const activeChatId = searchParams.get('id')
    const navigate = useNavigate()
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sidebar-collapsed")
            return saved ? JSON.parse(saved) : true // Inicia fechado por padrão (true)
        }
        return true
    })
    const { isOpenMobile, setIsOpenMobile } = useSidebar()
    const [collapsedMenus, setCollapsedMenus] = useState<Record<string, boolean>>({})
    const [searchQuery, setSearchQuery] = useState("")
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const { chats, removeChat } = useChatList()

    // Modal rename state
    const [renameModalOpen, setRenameModalOpen] = useState(false)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renameInitialValue, setRenameInitialValue] = useState("")

    // Evita hydration mismatch - só mostra o tema após mounted
    useEffect(() => {
        setMounted(true)
    }, [])

    const resolvedTheme = mounted ? (theme || "light") : "light"

    // ALTERNA ENTRE TEMA CLARO E ESCURO
    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark")
    }, [theme, setTheme])

    // COLAPSA OU EXPANDE A SIDEBAR NO DESKTOP COM PERSISTÊNCIA
    const toggleCollapse = useCallback(() => {
        setIsCollapsed((prev: any) => {
            const next = !prev
            localStorage.setItem("sidebar-collapsed", JSON.stringify(next))
            return next
        })
    }, [])

    // ATUALIZA O FILTRO DE BUSCA DE CHATS
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }, [])

    // ABRE O MODAL DE RENAME COM OS DADOS DO CHAT SELECIONADO
    const openRenameModal = useCallback((id: string, currentTitle: string) => {
        setRenamingId(id)
        setRenameInitialValue(currentTitle)
        setRenameModalOpen(true)
    }, [])

    // FILTRA OS CHATS PELO TEXTO DO CAMPO DE BUSCA (MEMOIZADO)
    const filteredChats = useMemo(() =>
        chats.filter((chat) =>
            chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [chats, searchQuery]
    )

    // RENDERIZA O CONTEÚDO INTERNO DA SIDEBAR — COMPARTILHADO ENTRE DESKTOP E MOBILE
    const renderSidebarContent = (isMobileView: boolean) => {
        const collapsed = isMobileView ? false : isCollapsed;

        return (
            <div className={cn(
                "flex flex-col h-full border-t border-border/70 border-r w-full",
                isMobileView && "pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-2 ">
                    {!collapsed && (
                        <Link to="/chat?id=new" className="flex items-center gap-2" onClick={() => isMobileView && setIsOpenMobile(false)}>
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                                {/*   <Sparkles className="w-5 h-5 text-primary" /> */}
                            </div>
                            <span className="text-lg font-semibold gradient-text">Elana</span>
                        </Link>
                    )}
                    {!isMobileView && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleCollapse}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            {collapsed ? (
                                <ChevronRight className="h-4 w-4" />
                            ) : (
                                <ChevronLeft className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    asChild
                                    size="icon"
                                    className="w-10 h-10 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                                >
                                    <Link to="/chat?id=new" onClick={() => isMobileView && setIsOpenMobile(false)}>
                                        <Plus className="h-5 w-5" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Novo Chat</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            asChild
                            className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                        >
                            <Link to="/chat?id=new" onClick={() => isMobileView && setIsOpenMobile(false)}>
                                <Plus className="h-4 w-4" />
                                Novo Chat
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="px-3 space-y-1">
                    {navItems.map((item) => {
                        const basePath = item.href.split("?")[0]
                        const isActive = pathname.startsWith(basePath)

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "w-10 h-10",
                                                isActive
                                                    ? "bg-sidebar-accent text-primary"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                                            )}
                                        >
                                            <Link to={item.href} onClick={() => isMobileView && setIsOpenMobile(false)}>
                                                <item.icon className="h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                </Tooltip>
                            )
                        }

                        return (
                            <div key={item.href} className="space-y-1">
                                <Button
                                    asChild
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3 h-10",
                                        isActive
                                            ? "bg-sidebar-accent text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                                    )}
                                >
                                    <Link
                                        to={item.href}
                                        onClick={(e) => {
                                            const hasSubmenu = item.href === '/settings' || item.href === '/memories';
                                            if (isActive && hasSubmenu) {
                                                e.preventDefault()
                                                setCollapsedMenus(prev => ({
                                                    ...prev,
                                                    [item.href]: !prev[item.href]
                                                }))
                                            } else if (isMobileView) {
                                                setIsOpenMobile(false)
                                            }
                                        }}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                </Button>

                                {/* Submenu for Memories */}
                                {isActive && item.href === "/memories" && !collapsed && !collapsedMenus["/memories"] && (
                                    <div className="pl-9 pr-2 py-2 space-y-1">
                                        <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Categorias</div>
                                        {categories.map((category) => {
                                            const isCategoryActive = searchParams.get("category") === category.id || (!searchParams.get("category") && category.id === "all")
                                            return (
                                                <button
                                                    key={category.id}
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams.toString())
                                                        params.set("category", category.id)
                                                        navigate(`${pathname}?${params.toString()}`)
                                                        if (isMobileView) setIsOpenMobile(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                                                        isCategoryActive
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <category.icon className="w-4 h-4" />
                                                        <span>{category.label}</span>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-4 flex items-center justify-center">
                                                        {category.count}
                                                    </Badge>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Submenu for Settings */}
                                {isActive && item.href === "/settings" && !collapsed && !collapsedMenus["/settings"] && (
                                    <div className="pl-9 pr-2 py-2 space-y-1">
                                        {settingsSections.map((section) => {
                                            const isSectionActive = searchParams.get("section") === section.id || (!searchParams.get("section") && section.id === "general")
                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams.toString())
                                                        params.set("section", section.id)
                                                        navigate(`${pathname}?${params.toString()}`)
                                                        if (isMobileView) setIsOpenMobile(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                                        isSectionActive
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                    )}
                                                >
                                                    <section.icon className="w-4 h-4" />
                                                    <span>{section.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Recent Chats */}
                {!collapsed && (
                    <div className="flex-1 mt-6 overflow-hidden flex flex-col">
                        <div className="px-4 pb-2">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Recentes
                            </h3>
                        </div>
                        <ScrollArea className="flex-1 px-3">
                            <div className="space-y-1 pb-4">
                                {filteredChats.length === 0 && (
                                    <p className="text-xs text-muted-foreground px-3 py-2">
                                        Nenhuma conversa ainda.
                                    </p>
                                )}
                                {filteredChats.map((chat) => {
                                    const isActive = pathname === '/chat' && activeChatId === chat.id

                                    return (
                                        <div
                                            key={chat.id}
                                            className={cn(
                                                "group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                                                isActive
                                                    ? "bg-sidebar-accent text-foreground"
                                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                navigate(`/chat?id=${chat.id}`)
                                                if (isMobileView) setIsOpenMobile(false)
                                            }}
                                        >
                                            <div className="flex flex-col flex-1 min-w-0 pr-2">
                                                <span className="break-words whitespace-normal text-left block font-medium" title={chat.title}>
                                                    {chat.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground/70 mt-0.5">
                                                    {new Date(chat.updated_at).toLocaleDateString("pt-BR", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "2-digit",
                                                    })}
                                                </span>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-100 sm:opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openRenameModal(chat.id, chat.title)
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                <span className="sr-only">Renomear</span>
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* User Section */}
                <div className="p-3 mt-auto space-y-2" >
                    {/* Theme toggle */}
                    {!mounted ? (
                        <div className={collapsed ? "w-10 h-10" : "w-full h-9"} />
                    ) : collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    className="w-10 h-10 text-muted-foreground hover:text-foreground"
                                >
                                    {resolvedTheme === "dark" ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Moon className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {resolvedTheme === "dark" ? "Tema claro" : "Tema escuro"}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleTheme}
                            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-9"
                        >
                            {resolvedTheme === "dark" ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                                {resolvedTheme === "dark" ? "Tema Claro" : "Tema Escuro"}
                            </span>
                        </Button>
                    )}

                    {/* User info */}
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer">
                                    <span className="text-sm font-medium text-primary">U</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">Usuário</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">U</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Usuário</p>
                                <p className="text-xs text-muted-foreground truncate">Plano Pro</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <TooltipProvider delayDuration={300} skipDelayDuration={100}>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col h-full bg-sidebar shrink-0",
                    isCollapsed ? "w-16" : "w-72"
                )}
                style={{
                    transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    willChange: "width",
                    boxShadow: "2px 0 16px oklch(0 0 0 / 0.08), 1px 0 4px oklch(0 0 0 / 0.05)"
                }}
            >
                {renderSidebarContent(false)}
            </aside>

            {/* Mobile Sidebar Content (Sheet) - Triggered via context */}
            <Sheet open={isOpenMobile} onOpenChange={setIsOpenMobile}>
                <SheetContent side="left" className="p-0 w-72 flex flex-col bg-sidebar">
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    {renderSidebarContent(true)}
                </SheetContent>
            </Sheet>

            <RenameChatModal
                chatId={renamingId}
                currentTitle={renameInitialValue}
                isOpen={renameModalOpen}
                onClose={() => setRenameModalOpen(false)}
            />

        </TooltipProvider>
    )
})
