"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { toast } from "sonner"
import { encrypt } from "@/core/lib/encryption"

export interface ApiKeyMeta {
  id: string
  name: string
  provider: string
  baseUrl?: string // Adicionado para rotas customizadas
  maskedKey: string
  encryptedKey: string 
  isActive: boolean
  lastUsed: Date
}

interface ApiKeysContextType {
  apiKeys: ApiKeyMeta[]
  isLoading: boolean
  addKey: (rawKey: string, customProvider?: string, customName?: string, baseUrl?: string) => Promise<void>
  deleteKey: (id: string) => Promise<void>
  hasProvider: (provider: string) => boolean
  getEncryptedKeys: () => { gemini?: string; openai?: string; all?: ApiKeyMeta[] }
}

const LS_KEY = 'elana-api-keys-meta'
const ApiKeysContext = createContext<ApiKeysContextType | undefined>(undefined)

// PROVEDOR DE CONTEXTO — GERENCIA AS CHAVES DE API CRIPTOGRAFADAS
export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [apiKeys, setApiKeys] = useState<ApiKeyMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar estado ao montar
  useEffect(() => {
    const init = async () => {
      // 1. Carregar metadados visuais do localStorage
      try {
        const saved = localStorage.getItem(LS_KEY)
        if (saved) {
          const parsed: ApiKeyMeta[] = JSON.parse(saved)
          setApiKeys(parsed.map(k => ({ ...k, lastUsed: new Date(k.lastUsed) })))
        }
      } catch (e) {
        console.error('Erro ao ler chaves do localStorage:', e)
      } 

      // No mode estático/Tauri, apenas o localStorage é usado.
      setIsLoading(false)
    }
    init()
  }, [])

  // ADICIONA UMA NOVA CHAVE DE API, DETECTANDO O PROVEDOR AUTOMATICAMENTE
  const addKey = useCallback(async (rawKey: string, customProvider?: string, customName?: string, baseUrl?: string) => {
    const trimmedKey = rawKey.trim()
    const autoProvider = trimmedKey.startsWith('AIza') ? 'gemini'
      : trimmedKey.startsWith('sk-ant') ? 'anthropic'
      : trimmedKey.startsWith('sk-or-') ? 'openrouter'
      : 'openai'
    
    const providerStr = customProvider || autoProvider
    const providerName = providerStr === 'openrouter' 
      ? 'OpenRouter' 
      : providerStr.charAt(0).toUpperCase() + providerStr.slice(1)

    // Criptografar a chave localmente
    const encryptedKey = await encrypt(trimmedKey)

    const finalBaseUrl = baseUrl || (
      providerStr === 'openrouter' ? 'https://openrouter.ai/api/v1' : undefined
    )

    const newKey: ApiKeyMeta = {
      id: `${providerStr}-${Date.now()}`,
      name: customName || `Chave ${providerName}`,
      provider: providerName,
      baseUrl: finalBaseUrl,
      maskedKey: `${trimmedKey.slice(0, 6)}...${trimmedKey.slice(-4)}`,
      encryptedKey,
      isActive: true,
      lastUsed: new Date(),
    }

    setApiKeys(prev => {
      // Se não for customizado (ou seja, se for Gemini/OpenAI padrão), removemos a antiga do mesmo provedor
      // Se for customizado, permitimos múltiplas chaves (ex: várias rotas do proxy)
      const isStandard = !customProvider;
      const withoutOld = isStandard 
        ? prev.filter(k => k.provider.toLowerCase() !== providerStr.toLowerCase())
        : prev;
        
      const updated = [...withoutOld, newKey]
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // REMOVE UMA CHAVE DE API PELO ID
  const deleteKey = useCallback(async (id: string) => {
    setApiKeys(prev => {
      const updated = prev.filter(k => k.id !== id)
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // VERIFICA SE UM PROVEDOR ESPECÍFICO JA ESTÁ ATIVO
  const hasProvider = useCallback((provider: string) => {
    return apiKeys.some(k => k.provider.toLowerCase() === provider.toLowerCase() && k.isActive)
  }, [apiKeys])

  // RETORNA AS CHAVES CRIPTOGRAFADAS PARA USO NOS SERVIÇOS DE IA
  const getEncryptedKeys = useCallback(() => {
    const gemini = apiKeys.find(k => k.provider.toLowerCase() === 'gemini')?.encryptedKey
    const openai = apiKeys.find(k => k.provider.toLowerCase() === 'openai')?.encryptedKey
    return { gemini, openai, all: apiKeys }
  }, [apiKeys])

  return (
    <ApiKeysContext.Provider value={{ apiKeys, isLoading, addKey, deleteKey, hasProvider, getEncryptedKeys }}>
      {children}
    </ApiKeysContext.Provider>
  )
}

// HOOK PARA CONSUMIR O APIKEYSCONTEXT EM QUALQUER COMPONENTE
export function useApiKeys() {
  const ctx = useContext(ApiKeysContext)
  if (!ctx) throw new Error("useApiKeys must be used within ApiKeysProvider")
  return ctx
}
