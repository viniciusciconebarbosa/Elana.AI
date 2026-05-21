"use client"

import { Button } from "@/interface/components/ui/button"
import { Settings, Save, Menu } from "lucide-react"
import { useSidebar } from "@/interface/context/SidebarContext"


// CABEÇALHO DA PÁGINA DE CONFIGURAÇÕES — EXIBE TÍTULO E BOTÃO DE SALVAR
export function SettingsHeader() {
  const { toggleMobile } = useSidebar()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm shrink-0 flex-wrap gap-3" style={{ boxShadow: '0 1px 8px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)' }}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 -ml-2"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Personalize sua experiência</p>
        </div>
      </div>
    </header>
  )
}
