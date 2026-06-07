"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Bot, Loader2 } from "lucide-react"

import { RouteSelector } from "./RouteSelector"
import { ModelSelector } from "./ModelSelector"
import { GenerationParameters } from "./AdvancedParameters"
import { ModelSettingsActions } from "./ModelSettingsActions"
import { ModelSettingsProvider, useModelSettingsForm } from "./ContextSettings"
import { ModelConfig } from "@/interface/context/ModelContext"

import { useTranslation } from "react-i18next"

interface ModelSelectorProps {
    onConfigChange?: (config: ModelConfig) => void
}

// CONTEÚDO INTERNO DAS CONFIGURAÇÕES DE MODELO — EXIBE OS SUB-COMPONENTES COM GUARD DE LOADING
function ModelSettingsContent() {
    const { draft } = useModelSettingsForm()
    const { t } = useTranslation()

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
                            <CardTitle className="text-lg">{t("settings.models.title", "Modelo de IA")}</CardTitle>
                            <CardDescription className="text-xs">{t("settings.models.description", "Configure o cérebro do assistente")}</CardDescription>
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
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setIsReady(true), 120)
        return () => clearTimeout(t)
    }, [])

    if (!isReady) {
        return (
            <div 
                className="space-y-6 animate-in fade-in duration-150"
                style={{ 
                    willChange: "transform, opacity",
                    transform: "translate3d(0, 0, 0)"
                }}
            >
                <Card className="glass border-glass-border">
                    <CardHeader>
                        <div className="h-6 w-32 bg-muted-foreground/10 rounded animate-pulse" />
                        <div className="h-4 w-56 bg-muted-foreground/10 rounded animate-pulse mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <div className="h-10 bg-muted-foreground/5 rounded animate-pulse" />
                        <div className="h-10 bg-muted-foreground/5 rounded animate-pulse" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div 
            className="space-y-6 animate-in fade-in duration-200"
            style={{ 
                willChange: "transform, opacity",
                transform: "translate3d(0, 0, 0)"
            }}
        >
            <ModelSettingsProvider onConfigChange={onConfigChange}>
                <ModelSettingsContent />
            </ModelSettingsProvider>
        </div>
    )
}
