"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// CHAVES DE ARMAZENAMENTO NO LOCALSTORAGE
const STORAGE_KEY = "elana:database-settings"

export interface DatabaseConfig {
  // Supabase
  supabaseUrl: string
  supabasePublishableKey: string
  supabaseConnectionString: string
  // S3 Storage
  s3AccessKeyId: string
  s3SecretAccessKey: string
  s3Endpoint: string
  s3Region: string
}

const DEFAULT_CONFIG: DatabaseConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseConnectionString: import.meta.env.VITE_SUPABASE_CONNECTION_STRING ?? "",
  s3AccessKeyId: import.meta.env.VITE_SUPABASE_S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: import.meta.env.VITE_SUPABASE_S3_SECRET_ACCESS_KEY ?? "",
  s3Endpoint: import.meta.env.VITE_SUPABASE_S3_ENDPOINT ?? "",
  s3Region: import.meta.env.VITE_SUPABASE_S3_REGION ?? "sa-east-1",
}

interface DatabaseSettingsContextValue {
  config: DatabaseConfig
  updateConfig: (partial: Partial<DatabaseConfig>) => void
  saveConfig: (partial?: Partial<DatabaseConfig>) => void
  resetConfig: () => void
  isDirty: boolean
}

const DatabaseSettingsContext = createContext<DatabaseSettingsContextValue | null>(null)

// CARREGA CONFIGURAÇÃO PERSISTIDA OU USA PADRÕES DO .ENV
function loadConfig(): DatabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch {
    // ignora erros de parse
  }
  return DEFAULT_CONFIG
}

export function DatabaseSettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DatabaseConfig>(loadConfig)
  const [savedConfig, setSavedConfig] = useState<DatabaseConfig>(loadConfig)

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)

  // ATUALIZA ESTADO LOCAL SEM PERSISTIR — PARA EDIÇÃO EM PROGRESSO
  const updateConfig = useCallback((partial: Partial<DatabaseConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  // PERSISTE A CONFIGURAÇÃO NO LOCALSTORAGE
  const saveConfig = useCallback((partial?: Partial<DatabaseConfig>) => {
    setConfig((prev) => {
      const next = partial ? { ...prev, ...partial } : prev
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignora erros de storage
      }
      setSavedConfig(next)
      return next
    })
  }, [])

  // RESTAURA OS VALORES PADRÃO DO .ENV
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setSavedConfig(DEFAULT_CONFIG)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <DatabaseSettingsContext.Provider value={{ config, updateConfig, saveConfig, resetConfig, isDirty }}>
      {children}
    </DatabaseSettingsContext.Provider>
  )
}

export function useDatabaseSettings() {
  const ctx = useContext(DatabaseSettingsContext)
  if (!ctx) throw new Error("useDatabaseSettings must be used within DatabaseSettingsProvider")
  return ctx
}

// HELPER: retorna a config ativa (persistida ou env) sem react — para uso em módulos fora de componentes
export function getActiveDatabaseConfig(): DatabaseConfig {
  return loadConfig()
}
