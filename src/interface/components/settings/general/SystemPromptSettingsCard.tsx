"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Button } from "@/interface/components/ui/button"
import { Textarea } from "@/interface/components/ui/textarea"
import { Label } from "@/interface/components/ui/label"
import { Input } from "@/interface/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/interface/components/ui/dialog"
import { Terminal, Save, RotateCcw, Sparkles, Wand2, Plus, Trash2, Eye, Pencil } from "lucide-react"
import { SystemPromptService } from "@/core/application/services/SystemPromptService"
import { toast } from "sonner"
import { PERSONALITY_TEMPLATES, PersonalityTemplate } from "./personalityTemplates"

export function SystemPromptSettingsCard() {
    const { t } = useTranslation()
    const [promptInput, setPromptInput] = useState("")
    const [savedPrompt, setSavedPrompt] = useState("")

    // Estado para os templates customizados do usuário
    const [customTemplates, setCustomTemplates] = useState<PersonalityTemplate[]>([])

    // Estado para o modal de visualização (olho)
    const [viewingTemplate, setViewingTemplate] = useState<PersonalityTemplate | null>(null)
    const [isEditingTemplate, setIsEditingTemplate] = useState(false)
    const [editTitle, setEditTitle] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editPrompt, setEditPrompt] = useState("")

    // Estados do Modal de Criação
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newPrompt, setNewPrompt] = useState("")

    // Carrega o prompt salvo no início e os templates customizados
    useEffect(() => {
        const saved = SystemPromptService.getCustomPrompt()
        setPromptInput(saved)
        setSavedPrompt(saved)

        let parsedCustom: PersonalityTemplate[] = []
        const savedTemplates = localStorage.getItem("elana_custom_prompt_templates")
        if (savedTemplates) {
            try {
                parsedCustom = JSON.parse(savedTemplates)
                setCustomTemplates(parsedCustom)
            } catch (e) {
                console.error("Erro ao ler templates customizados:", e)
            }
        }
    }, [])

    // Computa todos os templates e traduz os nativos dinamicamente
    const allTemplates = useMemo(() => {
        const tpls = [...customTemplates, ...PERSONALITY_TEMPLATES]
        return tpls.map(tpl => {
            if (!tpl.id.startsWith("custom-")) {
                let key = ""
                if (tpl.id === "productivity-assistant") key = "productivity"
                else if (tpl.id === "didactic-tutor") key = "didactic"
                else if (tpl.id === "empathetic-companion") key = "empathetic"
                else if (tpl.id === "creative-writer") key = "creative"

                if (key) {
                    return {
                        ...tpl,
                        title: t(`personalityTemplates.${key}.title`),
                        tag: t(`personalityTemplates.${key}.tag`),
                        description: t(`personalityTemplates.${key}.description`),
                        prompt: t(`personalityTemplates.${key}.prompt`)
                    }
                }
            }
            return tpl
        })
    }, [customTemplates, t])

    // Determina o título da instrução ativa dinamicamente
    const activeTemplateTitle = useMemo(() => {
        const matched = allTemplates.find(t => t.prompt.trim() === promptInput.trim())
        if (matched) {
            return matched.title
        } else if (promptInput.trim().length > 0) {
            return t("systemPrompt.custom")
        } else {
            return t("systemPrompt.defaultElana")
        }
    }, [allTemplates, promptInput, t])

    // Versão traduzida do template atualmente em visualização
    const translatedViewingTemplate = useMemo(() => {
        if (!viewingTemplate) return null
        const matched = allTemplates.find(t => t.id === viewingTemplate.id)
        return matched || viewingTemplate
    }, [allTemplates, viewingTemplate])

    const handleSave = () => {
        SystemPromptService.saveCustomPrompt(promptInput)
        setSavedPrompt(promptInput)
        toast.success(t("systemPrompt.promptSavedSuccess"))
    }

    const handleReset = () => {
        SystemPromptService.clearCustomPrompt()
        setPromptInput("")
        setSavedPrompt("")
        toast.success(t("systemPrompt.personalityRestored"))
    }

    const applyTemplate = (templatePrompt: string, templateTitle: string) => {
        setPromptInput(templatePrompt)
        toast.success(t("systemPrompt.templateLoaded", { title: templateTitle }), {
            description: t("systemPrompt.clickToActivate")
        })
    }

    // Função para salvar novo template
    const handleSaveNewTemplate = () => {
        if (!newTitle.trim() || !newPrompt.trim()) {
            toast.error(t("systemPrompt.fillRequired"))
            return
        }

        const newTpl: PersonalityTemplate = {
            id: `custom-${Date.now()}`,
            title: newTitle.trim(),
            tag: t("systemPrompt.userTag"),
            description: newDescription.trim() || t("systemPrompt.customCreatedDesc"),
            prompt: newPrompt.trim()
        }

        const updated = [...customTemplates, newTpl]
        setCustomTemplates(updated)
        localStorage.setItem("elana_custom_prompt_templates", JSON.stringify(updated))

        // Limpar inputs e fechar modal
        setNewTitle("")
        setNewDescription("")
        setNewPrompt("")
        setIsModalOpen(false)

        toast.success(t("systemPrompt.templateAddedSuccess", { title: newTpl.title }))
    }

    // Função para atualizar um template existente
    const handleUpdateTemplate = () => {
        if (!viewingTemplate) return

        if (!editTitle.trim() || !editPrompt.trim()) {
            toast.error(t("systemPrompt.fillRequired"))
            return
        }

        const updatedTemplates = customTemplates.map(tpl => {
            if (tpl.id === viewingTemplate.id) {
                return {
                    ...tpl,
                    title: editTitle.trim(),
                    description: editDescription.trim() || t("systemPrompt.customCreatedDesc"),
                    prompt: editPrompt.trim()
                }
            }
            return tpl
        })

        setCustomTemplates(updatedTemplates)
        localStorage.setItem("elana_custom_prompt_templates", JSON.stringify(updatedTemplates))

        // Atualiza a visualização com o template editado
        setViewingTemplate({
            ...viewingTemplate,
            title: editTitle.trim(),
            description: editDescription.trim() || t("systemPrompt.customCreatedDesc"),
            prompt: editPrompt.trim()
        })

        // Se este template editado era o que estava ativo, atualiza o prompt input
        if (promptInput.trim() === viewingTemplate.prompt.trim()) {
            setPromptInput(editPrompt.trim())
        }

        setIsEditingTemplate(false)
        toast.success(t("systemPrompt.templateUpdatedSuccess"))
    }

    // Função para deletar um template customizado
    const handleDeleteTemplate = (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation() // Não ativa a aplicação do prompt ao clicar em deletar
        const updated = customTemplates.filter(tpl => tpl.id !== id)
        setCustomTemplates(updated)
        localStorage.setItem("elana_custom_prompt_templates", JSON.stringify(updated))
        toast.success(t("systemPrompt.templateRemovedSuccess", { title }))
    }

    const isChanged = promptInput.trim() !== savedPrompt.trim()
    const hasCustomPrompt = savedPrompt.trim().length > 0

    return (
        <Card className="glass border-glass-border overflow-hidden mt-6">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{t("systemPrompt.title")}</CardTitle>
                        <CardDescription className="text-xs">
                            {t("systemPrompt.description")}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Editor Area */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="custom-prompt" className="text-sm font-medium flex items-center gap-1.5">
                            {t("systemPrompt.activeInstruction")} <span className="text-primary font-semibold">{activeTemplateTitle}</span>
                        </Label>
                        {hasCustomPrompt && (
                            <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                                {t("systemPrompt.customActive")}
                            </span>
                        )}
                    </div>

                    <div
                        id="custom-prompt"
                        className="bg-background/30 border border-glass-border rounded-xl p-3.5 text-xs font-mono leading-relaxed text-foreground select-text"
                    >
                        {promptInput.trim() 
                            ? (promptInput.trim().length > 100 
                                ? promptInput.trim().substring(0, 100) + "..." 
                                : promptInput.trim())
                            : t("systemPrompt.noCustomPrompt")}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {t("systemPrompt.instructionNotice")}
                    </p>
                </div>

                {/* Action Buttons for Editor */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={!isChanged}
                        className="gap-2 shrink-0"
                    >
                        <Save className="w-4 h-4" />
                        {t("systemPrompt.saveChanges")}
                    </Button>

                    {(hasCustomPrompt || promptInput.trim().length > 0) && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="gap-2 border-glass-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 shrink-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {t("systemPrompt.restoreDefault")}
                        </Button>
                    )}
                </div>

                {/* Templates Section */}
                <div className="pt-4 border-t border-glass-border space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <h4 className="text-sm font-semibold">{t("systemPrompt.personalityTemplatesTitle")}</h4>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {t("systemPrompt.templatesSubtitle")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Card Adicional (+) */}
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="group p-4 rounded-xl border border-dashed border-glass-border hover:border-primary/50 bg-background/5 hover:bg-primary/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[120px] text-muted-foreground hover:text-primary gap-2"
                        >
                            <div className="p-2 rounded-full bg-muted-foreground/5 group-hover:bg-primary/10 transition-colors">
                                <Plus className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            <span className="text-xs font-semibold">{t("systemPrompt.newPromptTemplate")}</span>
                        </div>

                        {allTemplates.map((tpl) => (
                            <div
                                key={tpl.id}
                                className="group p-3 rounded-xl border border-glass-border bg-background/20 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3"
                                onClick={() => applyTemplate(tpl.prompt, tpl.title)}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {tpl.title}
                                        </h5>
                                        <span className="text-[9px] bg-secondary text-secondary-foreground font-medium px-2 py-0.5 rounded-md">
                                            {tpl.tag}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-normal">
                                        {tpl.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between w-full mt-2">
                                    {/* Ações da esquerda (lixeira e visualização) */}
                                    <div className="flex items-center gap-1">
                                        {tpl.id.startsWith("custom-") && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                onClick={(e) => handleDeleteTemplate(e, tpl.id, tpl.title)}
                                                title={t("systemPrompt.deleteTemplate")}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setViewingTemplate(tpl)
                                            }}
                                            title={t("systemPrompt.viewPrompt")}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                                        <Wand2 className="w-3.5 h-3.5" />
                                        <span>{t("systemPrompt.applyToEditor")}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            {/* Modal de Visualização (Olho) */}
            <Dialog open={translatedViewingTemplate !== null} onOpenChange={(open) => {
                if (!open) {
                    setViewingTemplate(null)
                    setIsEditingTemplate(false)
                }
            }}>
                <DialogContent className="glass border-glass-border sm:max-w-[500px] max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-md">
                                {translatedViewingTemplate?.tag}
                            </span>
                        </div>
                            {translatedViewingTemplate?.id.startsWith("custom-") && !isEditingTemplate && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                    onClick={() => {
                                        if (translatedViewingTemplate) {
                                            setEditTitle(translatedViewingTemplate.title || "")
                                            setEditDescription(translatedViewingTemplate.description || "")
                                            setEditPrompt(translatedViewingTemplate.prompt || "")
                                            setIsEditingTemplate(true)
                                        }
                                    }}
                                    title={t("systemPrompt.editTemplate")}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}
                        {isEditingTemplate ? (
                            <DialogTitle className="text-lg mt-1">{t("systemPrompt.editTemplate")}</DialogTitle>
                        ) : (
                            <DialogTitle className="text-lg mt-1">{translatedViewingTemplate?.title}</DialogTitle>
                        )}
                        {!isEditingTemplate && (
                            <DialogDescription className="text-xs text-muted-foreground max-h-[100px] overflow-y-auto custom-scrollbar pr-1 whitespace-pre-wrap">
                                {translatedViewingTemplate?.description}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {isEditingTemplate ? (
                        <div className="space-y-4 py-4">
                            {/* Edit Title */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-tpl-title" className="text-xs font-semibold">{t("systemPrompt.templateTitleLabel")}</Label>
                                <Input
                                    id="edit-tpl-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="bg-background/40 border-glass-border focus-visible:ring-primary/40 text-sm"
                                />
                            </div>

                            {/* Edit Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-tpl-desc" className="text-xs font-semibold">{t("systemPrompt.templateDescLabel")}</Label>
                                <Input
                                    id="edit-tpl-desc"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="bg-background/40 border-glass-border focus-visible:ring-primary/40 text-sm"
                                />
                            </div>

                            {/* Edit Prompt Content */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-tpl-prompt" className="text-xs font-semibold">{t("systemPrompt.templatePromptLabel")}</Label>
                                <Textarea
                                    id="edit-tpl-prompt"
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    className="min-h-[120px] max-h-[200px] overflow-y-auto bg-background/40 border-glass-border focus-visible:ring-primary/40 text-sm font-mono custom-scrollbar"
                                    style={{ fieldSizing: 'fixed' as any }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 py-4">
                            <Label className="text-xs font-semibold text-muted-foreground">{t("systemPrompt.templatePromptLabel")}:</Label>
                            <div className="max-h-[300px] overflow-y-auto bg-background/50 border border-glass-border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground select-text custom-scrollbar">
                                {translatedViewingTemplate?.prompt}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {isEditingTemplate ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditingTemplate(false)}
                                    className="border-glass-border hover:bg-secondary"
                                >
                                    {t("common.cancel")}
                                </Button>
                                <Button onClick={handleUpdateTemplate}>
                                    {t("systemPrompt.saveChanges")}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingTemplate(null)}
                                    className="border-glass-border hover:bg-secondary"
                                >
                                    {t("systemPrompt.closeBtn")}
                                </Button>
                                <Button onClick={() => {
                                    if (translatedViewingTemplate) {
                                        applyTemplate(translatedViewingTemplate.prompt, translatedViewingTemplate.title)
                                        setViewingTemplate(null)
                                    }
                                }}>
                                    {t("systemPrompt.applyToEditor")}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Criação (3 Inputs) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="glass border-glass-border sm:max-w-[425px] max-h-[80vh] overflow-y-auto ">
                    <DialogHeader>
                        <DialogTitle>{t("systemPrompt.createNewTemplateTitle")}</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {t("systemPrompt.createNewTemplateDesc")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Input 1: Título */}
                        <div className="space-y-1.5">
                            <Label htmlFor="tpl-title" className="text-xs font-semibold">{t("systemPrompt.templateTitleLabel")}</Label>
                            <Input
                                id="tpl-title"
                                placeholder="Ex: Assistente de Tradução"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="bg-background/40 border-glass-border focus-visible:ring-primary/40 text-sm"
                            />
                        </div>

                        {/* Input 2: Descrição */}
                        <div className="space-y-1.5">
                            <Label htmlFor="tpl-desc" className="text-xs font-semibold">{t("systemPrompt.templateDescLabel")}</Label>
                            <Input
                                id="tpl-desc"
                                placeholder="Ex: Traduz e explica gírias regionais para inglês."
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                className="bg-background/40 border-glass-border focus-visible:ring-primary/40 text-sm"
                            />
                        </div>

                        {/* Input 3: Conteúdo do Prompt */}
                        <div className="space-y-1.5">
                            <Label htmlFor="tpl-prompt" className="text-xs font-semibold">{t("systemPrompt.templatePromptLabel")}</Label>
                            <Textarea
                                id="tpl-prompt"
                                placeholder="Você é um tradutor especialista. Quando eu enviar uma frase..."
                                value={newPrompt}
                                onChange={(e) => setNewPrompt(e.target.value)}
                                className="min-h-[120px] max-h-[200px] overflow-y-auto bg-background/40 border-glass-border focus-visible:ring-primary/40 text-sm font-mono custom-scrollbar"
                                style={{ fieldSizing: 'fixed' as any }}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="border-glass-border hover:bg-secondary"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSaveNewTemplate}>
                            {t("systemPrompt.saveTemplateBtn")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
