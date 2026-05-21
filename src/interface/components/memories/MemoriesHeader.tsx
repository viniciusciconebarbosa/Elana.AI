"use client"

import { Button } from "@/interface/components/ui/button"
import { Database, Download, Menu } from "lucide-react"
import { useSidebar } from "@/interface/context/SidebarContext"

interface MemoriesHeaderProps {
  count: number
}

// CABEÇALHO DA PÁGINA DE MEMÓRIAS — EXIBE CONTAGEM DE FATOS E AÇÕES DE EXPORTAR/BUSCA
export function MemoriesHeader({ count }: MemoriesHeaderProps) {
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
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Memórias</h1>
          <p className="text-sm text-muted-foreground">{count} fatos armazenados</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
        <Button size="sm" className="gap-2">
          Busca Semântica
        </Button>
      </div>
    </header>
  )
}
