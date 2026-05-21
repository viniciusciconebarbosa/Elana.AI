"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

const STORAGE_KEY = "elana:tools-settings"

export interface ToolsConfig {
  tavilyApiKey: string
}

const DEFAULT_CONFIG: ToolsConfig = {
  tavilyApiKey: "",
}

interface ToolsSettingsContextValue {
  config: ToolsConfig
  updateConfig: (partial: Partial<ToolsConfig>) => void
  saveConfig: (partial?: Partial<ToolsConfig>) => void
  resetConfig: () => void
  isDirty: boolean
}

const ToolsSettingsContext = createContext<ToolsSettingsContextValue | null>(null)

function loadConfig(): ToolsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch {
    // ignora erros
  }
  return DEFAULT_CONFIG
}

export function ToolsSettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ToolsConfig>(loadConfig)
  const [savedConfig, setSavedConfig] = useState<ToolsConfig>(loadConfig)

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)

  const updateConfig = useCallback((partial: Partial<ToolsConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const saveConfig = useCallback((partial?: Partial<ToolsConfig>) => {
    setConfig((prev) => {
      const next = partial ? { ...prev, ...partial } : prev
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      setSavedConfig(next)
      return next
    })
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setSavedConfig(DEFAULT_CONFIG)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <ToolsSettingsContext.Provider value={{ config, updateConfig, saveConfig, resetConfig, isDirty }}>
      {children}
    </ToolsSettingsContext.Provider>
  )
}

export function useToolsSettings() {
  const ctx = useContext(ToolsSettingsContext)
  if (!ctx) throw new Error("useToolsSettings must be used within ToolsSettingsProvider")
  return ctx
}

// HELPER: retorna a config ativa para uso fora de componentes React
export function getActiveToolsConfig(): ToolsConfig {
  return loadConfig()
}
