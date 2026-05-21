"use client"
import React, { createContext, useContext, useState, useMemo } from "react"
import { useModel, ModelConfig, ModelInfo, RouteModels } from "@/interface/context/ModelContext"
import { toast } from "sonner"

interface ModelSettingsContextType {
    draft: ModelConfig | null
    updateDraftParam: (key: keyof ModelConfig, value: any) => void
    routes: RouteModels[]
    availableModels: ModelInfo[]
    isRoutesLoading: boolean
    refreshRoutes: () => void
    handleRouteChange: (routeId: string) => void
    handleModelChange: (modelId: string) => void
    handleResetAdvanced: () => void
    handleSave: () => void
    isDirty: boolean
}

const ModelSettingsContext = createContext<ModelSettingsContextType | null>(null)

// HOOK PARA CONSUMIR O CONTEXTO LOCAL DE CONFIGURAÇÕES DE MODELO
export function useModelSettingsForm() {
    const context = useContext(ModelSettingsContext)
    if (!context) {
        throw new Error("useModelSettingsForm must be used within a ModelSettingsProvider")
    }
    return context
}

// PROVIDER LOCAL DE ESTADO DO FORMULÁRIO DE MODELO — ISOLA O DRAFT DO CONTEXTO GLOBAL
export function ModelSettingsProvider({ children, onConfigChange }: { children: React.ReactNode, onConfigChange?: (config: ModelConfig) => void }) {
    const { config, updateConfig, routes, isRoutesLoading, refreshRoutes } = useModel()

    // Draft inicializado diretamente com o config atual — sem useEffect
    const [draft, setDraft] = useState<ModelConfig | null>(() => config ?? null)

    // Modelos disponíveis para a rota selecionada — Estado Derivado
    const availableModels = useMemo(() => {
        if (!draft?.route || !routes.length) return []
        const routeData = routes.find(r => r.route === draft.route)
        return routeData?.models || []
    }, [draft?.route, routes])

    // Apenas mudanças reais disparam o recálculo
    const isDirty = useMemo(
        () => JSON.stringify(draft) !== JSON.stringify(config),
        [draft, config]
    )

    // HANDLER GENÉRICO — ATUALIZA QUALQUER CAMPO DO DRAFT SEM TOCAR NO CONTEXTO GLOBAL
    const updateDraftParam = (key: keyof ModelConfig, value: any) => {
        setDraft(prev => prev ? ({ ...prev, [key]: value }) : null)
    }

    // TROCA DE ROTA — ATUALIZA ROTA E SELECIONA AUTOMATICAMENTE O PRIMEIRO MODELO
    const handleRouteChange = (routeId: string) => {
        const routeInfo = routes.find(r => r.route === routeId)
        if (!routeInfo) return

        const firstModel = routeInfo.models[0]

        setDraft(prev => prev ? ({
            ...prev,
            route: routeId,
            routeName: routeInfo.routeName,
            baseUrl: routeInfo.baseUrl,
            model: firstModel?.id || "",
            modelName: firstModel?.name || ""
        }) : null)
    }

    // TROCA DE MODELO — ATUALIZA MODEL ID E NOME NO DRAFT
    const handleModelChange = (modelId: string) => {
        const modelInfo = availableModels.find(m => m.id === modelId)
        if (!modelInfo) return

        setDraft(prev => prev ? ({
            ...prev,
            model: modelId,
            modelName: modelInfo.name
        }) : null)
    }

    // RESETA OS PARÂMETROS AVANÇADOS PARA OS VALORES PADRÃO
    const handleResetAdvanced = () => {
        setDraft(prev => prev ? ({
            ...prev,
            temperature: 0.75,
            topP: 0.9,
            presencePenalty: 0.4,
            frequencyPenalty: 0.3,
            maxTokens: 4096
        }) : null)
        toast.info("Parâmetros avançados resetados para o padrão")
    }

    // SALVA O DRAFT NO CONTEXTO GLOBAL (LOCALSTORAGE) E NOTIFICA O CALLBACK OPCIONAL
    const handleSave = () => {
        if (!draft) return
        updateConfig(draft)
        onConfigChange?.(draft)
        toast.success(`Modelo salvo: ${draft.modelName}`)
    }

    const value = {
        draft,
        updateDraftParam,
        routes,
        availableModels,
        isRoutesLoading,
        refreshRoutes,
        handleRouteChange,
        handleModelChange,
        handleResetAdvanced,
        handleSave,
        isDirty
    }

    return (
        <ModelSettingsContext.Provider value={value}>
            {children}
        </ModelSettingsContext.Provider>
    )
}
