"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Bot, Loader2 } from "lucide-react"

import { RouteSelector } from "./RouteSelector"
import { ModelSelector } from "./ModelSelector"
import { GenerationParameters } from "./AdvancedParameters"
import { ModelSettingsActions } from "./ModelSettingsActions"
import { ModelSettingsProvider, useModelSettingsForm } from "./ContextSettings"
import { ModelConfig } from "@/interface/context/ModelContext"

interface ModelSelectorProps {
    onConfigChange?: (config: ModelConfig) => void
}

// CONTEÚDO INTERNO DAS CONFIGURAÇÕES DE MODELO — EXIBE OS SUB-COMPONENTES COM GUARD DE LOADING
function ModelSettingsContent() {
    const { draft } = useModelSettingsForm()

    if (!draft) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
        )
    }

    return (
        <Card className="glass border-glass-border overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Modelo de IA</CardTitle>
                            <CardDescription className="text-xs">Configure o cérebro do assistente</CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">

                <RouteSelector />
                <ModelSelector />

                <GenerationParameters />
                <ModelSettingsActions />
            </CardContent>
        </Card>
    )
}

// PAINEL PRINCIPAL DE MODELO — ENVOLVE O CONTEÚDO NO PROVIDER DE CONTEXTO LOCAL
export function ModelSettings({ onConfigChange }: ModelSelectorProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ModelSettingsProvider onConfigChange={onConfigChange}>
                <ModelSettingsContent />
            </ModelSettingsProvider>
        </div>
    )
}
