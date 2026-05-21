import React, { createContext, useContext, useState, useCallback } from "react"

interface SidebarContextType {
  isOpenMobile: boolean
  setIsOpenMobile: (open: boolean) => void
  toggleMobile: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// PROVEDOR DE CONTEXTO — CONTROLA O ESTADO DE ABERTURA DA SIDEBAR MOBILE
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  const toggleMobile = useCallback(() => {
    setIsOpenMobile((prev) => !prev)
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpenMobile, setIsOpenMobile, toggleMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

// HOOK PARA CONSUMIR O SIDEBARCONTEXT EM QUALQUER COMPONENTE
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
