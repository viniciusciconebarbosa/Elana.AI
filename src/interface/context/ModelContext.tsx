"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { decrypt } from "@/core/lib/encryption"
import { useApiKeys } from "./ApiKeysContext"

export interface ModelConfig {
  route: string
  routeName: string
  baseUrl: string
  model: string
  modelName: string
  maxTokens?: number
  temperature?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
}

export interface ModelInfo {
  id: string
  name: string
}

export interface RouteModels {
  route: string
  routeName: string
  baseUrl: string
  models: ModelInfo[]
}

interface ModelContextType {
  config: ModelConfig | null
  routes: RouteModels[]
  isRoutesLoading: boolean
  updateConfig: (config: ModelConfig) => void
  refreshRoutes: () => Promise<void>
}

const defaultConfig: ModelConfig = {
  route: "",
  routeName: "Nenhum",
  baseUrl: "",
  model: "",
  modelName: "Nenhum Selecionado",
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  presencePenalty: 0,
  frequencyPenalty: 0,
}

const STORAGE_KEY = "elana-model-config"
const ROUTES_STORAGE_KEY = "elana-routes-models"

const ModelContext = createContext<ModelContextType | undefined>(undefined)

// PROVEDOR DE CONTEXTO — GERENCIA A CONFIGURAÇÃO DO MODELO E A LISTA DE ROTAS/PROVEDORES
export function ModelProvider({ children }: { children: ReactNode }) {
  const { apiKeys, isLoading: isKeysLoading, getEncryptedKeys } = useApiKeys()

  // Config iniciada como null no servidor e no cliente para evitar hydration mismatch
  const [config, setConfig] = useState<ModelConfig | null>(null)
  const [routes, setRoutes] = useState<RouteModels[]>([])
  const [isRoutesLoading, setIsRoutesLoading] = useState(true)
  const loadAbortRef = useRef<AbortController | null>(null)

  // Lê o localStorage somente no cliente, após a montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setConfig(saved ? JSON.parse(saved) : defaultConfig)
    } catch {
      setConfig(defaultConfig)
    }
  }, [])

  // CARREGA TODAS AS ROTAS ATIVAS BUSCANDO OS MODELOS DISPONÍVEIS EM CADA PROVEDOR
  const loadAllRoutes = useCallback(async (forceRefresh = false) => {
    // Cancela qualquer invocação anterior em andamento
    if (loadAbortRef.current) loadAbortRef.current.abort()
    const controller = new AbortController()
    loadAbortRef.current = controller
    const { signal } = controller

    setIsRoutesLoading(true)

    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(ROUTES_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          const isNewFormat = parsed.length > 0 && parsed.every((r: any) => 'baseUrl' in r)
          if (isNewFormat) {
            if (!signal.aborted) {
              setRoutes(parsed)
              setIsRoutesLoading(false)
            }
            return
          }
        }
      } catch (e) { console.error("Erro ao carregar routes cache:", e) }
    }

    const results: RouteModels[] = []
    const { all } = getEncryptedKeys()
    const activeKeysWithUrl = (all || []).filter(k => k.isActive && (k.baseUrl || k.provider === 'Gemini'))

    for (const keyMeta of activeKeysWithUrl) {
      const isGoogle = keyMeta.provider === 'Gemini'
      const baseUrl = keyMeta.baseUrl || (isGoogle ? "https://generativelanguage.googleapis.com" : "")

      if (!baseUrl) continue

      if (isGoogle) {
        try {
          const geminiKey = await decrypt(keyMeta.encryptedKey)
          if (signal.aborted) return
          if (geminiKey) {
            const response = await fetch(`${baseUrl}/v1beta/models?key=${geminiKey}`, { signal })
            if (response.ok) {
              const data = await response.json()
              const models = data.models
                .filter((m: any) => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: any) => ({
                  id: m.name.replace('models/', ''),
                  name: m.displayName || m.name.replace('models/', '')
                }))

              results.push({ route: keyMeta.id, routeName: keyMeta.name, baseUrl, models })
              continue
            }
          }
        } catch (error) { console.error("Erro Google:", error) }

        results.push({ route: keyMeta.id, routeName: keyMeta.name, baseUrl, models: [] })
        continue
      }

      // Rota OpenAI Compatível (Proxy ou Direta)
      try {
        const decryptedKey = await decrypt(keyMeta.encryptedKey)
        if (signal.aborted) return
        const response = await fetch(`${baseUrl}/models`, {
          signal,
          headers: {
            "Authorization": `Bearer ${decryptedKey || ""}`,
            "Content-Type": "application/json"
          }
        })

        if (response.ok) {
          const data = await response.json()
          const uniqueModels = new Map<string, ModelInfo>()
          ;(data.data || []).forEach((m: { id: string }) => {
            if (!uniqueModels.has(m.id)) {
              uniqueModels.set(m.id, { id: m.id, name: m.id })
            }
          })
          results.push({ route: keyMeta.id, routeName: keyMeta.name, baseUrl, models: Array.from(uniqueModels.values()) })
        } else {
          results.push({ route: keyMeta.id, routeName: keyMeta.name, baseUrl, models: [] })
        }
      } catch (error) {
        console.error(`Erro ao buscar modelos de ${keyMeta.name}:`, error)
        results.push({ route: keyMeta.id, routeName: keyMeta.name, baseUrl, models: [] })
      }
    }

    if (signal.aborted) return
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(results))
    setRoutes(results)
    setIsRoutesLoading(false)
  }, [getEncryptedKeys])

  // Recarregar rotas quando as chaves mudarem (aguarda o carregamento inicial para evitar sobrescrever o cache)
  useEffect(() => {
    if (isKeysLoading) return
    loadAllRoutes()
  }, [apiKeys, isKeysLoading, loadAllRoutes])

  // FORÇA O RECARREGAMENTO DAS ROTAS IGNORANDO O CACHE
  const refreshRoutes = () => loadAllRoutes(true)

  // ATUALIZA A CONFIGURAÇÃO ATIVA DO MODELO E PERSISTE NO LOCALSTORAGE
  const updateConfig = (newConfig: ModelConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    setConfig(newConfig)
  }

  return (
    <ModelContext.Provider value={{ config, routes, isRoutesLoading, updateConfig, refreshRoutes }}>
      {children}
    </ModelContext.Provider>
  )
}

// HOOK PARA CONSUMIR O MODELCONTEXT EM QUALQUER COMPONENTE
export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) throw new Error("useModel must be used within a ModelProvider")
  return context
}
