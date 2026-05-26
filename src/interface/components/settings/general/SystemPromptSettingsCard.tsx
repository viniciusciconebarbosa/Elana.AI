"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Button } from "@/interface/components/ui/button"
import { Textarea } from "@/interface/components/ui/textarea"
import { Label } from "@/interface/components/ui/label"
import { Terminal, Save, RotateCcw, Sparkles, Wand2 } from "lucide-react"
import { SystemPromptService } from "@/core/application/services/SystemPromptService"
import { toast } from "sonner"
import { PERSONALITY_TEMPLATES } from "./personalityTemplates"

export function SystemPromptSettingsCard() {
    const [promptInput, setPromptInput] = useState("")
    const [savedPrompt, setSavedPrompt] = useState("")

    // Carrega o prompt salvo no início
    useEffect(() => {
        const saved = SystemPromptService.getCustomPrompt()
        setPromptInput(saved)
        setSavedPrompt(saved)
    }, [])

    const handleSave = () => {
        SystemPromptService.saveCustomPrompt(promptInput)
        setSavedPrompt(promptInput)
        toast.success("Instruções do sistema salvas com sucesso!")
    }

    const handleReset = () => {
        SystemPromptService.clearCustomPrompt()
        setPromptInput("")
        setSavedPrompt("")
        toast.success("Personalidade restaurada para o padrão da Elana!")
    }

    const applyTemplate = (templatePrompt: string, templateTitle: string) => {
        setPromptInput(templatePrompt)
        toast.success(`Template "${templateTitle}" carregado no editor!`, {
            description: "Clique em 'Salvar Alterações' para ativá-lo."
        })
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
                        <CardTitle className="text-lg">Instruções do Sistema (System Prompt)</CardTitle>
                        <CardDescription className="text-xs">
                            Defina o comportamento principal, tom e regras de conduta da Elana.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Editor Area */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="custom-prompt" className="text-sm font-medium">
                            Instrução Ativa no Editor
                        </Label>
                        {hasCustomPrompt && (
                            <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                                Personalizado Ativo
                            </span>
                        )}
                    </div>
                    
                    <Textarea
                        id="custom-prompt"
                        placeholder={SystemPromptService.getDefaultBasePrompt()}
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        className="min-h-60 bg-background/50 border-glass-border focus-visible:ring-primary/40 text-sm font-mono leading-relaxed resize-y"
                    />
                    
                    <p className="text-xs text-muted-foreground">
                        Escreva como você deseja que o modelo se comporte. Se deixado em branco, a Elana usará a personalidade padrão dela (sarcástica, inteligente e direta).
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
                        Salvar Alterações
                    </Button>
                    
                    {(hasCustomPrompt || promptInput.trim().length > 0) && (
                        <Button 
                            variant="outline" 
                            onClick={handleReset} 
                            className="gap-2 border-glass-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 shrink-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restaurar Padrão
                        </Button>
                    )}
                </div>

                {/* Templates Section */}
                <div className="pt-4 border-t border-glass-border space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="text-sm font-semibold">Modelos de Personalidade (Inspecione ou Use)</h4>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                        Clique em um dos templates abaixo para carregá-lo no editor de texto. Você poderá personalizá-lo ainda mais antes de salvar.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {PERSONALITY_TEMPLATES.map((tpl) => (
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

                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary opacity-80 group-hover:opacity-100 transition-opacity self-end">
                                    <Wand2 className="w-3.5 h-3.5" />
                                    <span>Aplicar ao editor</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
