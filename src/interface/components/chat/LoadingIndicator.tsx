"use client"

import { Sparkles, Loader2, Globe, Search, Database, Terminal, Cpu, Cog, Coffee } from "lucide-react"

interface LoadingIndicatorProps {
  toolStatus?: string | null
}

// Retorna o ícone apropriado com base no texto do status da ferramenta (usando tons neutros de cinza)
function getToolIcon(status: string) {
  const lower = status.toLowerCase()
  if (lower.includes("pesquisa") || lower.includes("search") || lower.includes("tavily")) {
    return <Search className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
  }
  if (lower.includes("web") || lower.includes("página") || lower.includes("site") || lower.includes("crawl")) {
    return <Globe className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
  }
  if (lower.includes("memória") || lower.includes("banco") || lower.includes("database") || lower.includes("qdrant")) {
    return <Database className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
  }
  return <Cpu className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
}

export function LoadingIndicator({ toolStatus }: LoadingIndicatorProps = {}) {
  const isTool = !!toolStatus

  // --- ESTADO 1: PENSANDO (FLUXO PADRÃO) ---
  if (!isTool) {
    return (
      <div className="flex gap-2 items-start animate-in fade-in duration-300 mb-4 w-full">
        {/* Avatar com Coffee e aura pulsante de IA */}

        
        {/* Balão de Pensando com Glassmorphic Design */}
        <div className=" px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Dots de Carregamento Premium */}
            <div className="flex items-center gap-1.5 h-2">
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.8s" }} />
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.8s" }} />
              <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.8s" }} />
            </div>
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
              Pensando...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // --- ESTADO 2: EXECUTANDO FERRAMENTA (TOOL RUNNING) ---
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in duration-500 mb-3 w-full max-w-4xl">
      {/* Card Principal — Glassmorphic com borda gradiente sutil */}
      <div className="relative overflow-hidden">
        
        {/* Barra de progresso animada no topo */}
        <div className="h-[2px] w-full bg-muted/30 overflow-hidden">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
            style={{
              animation: "shimmer 0.8s ease-in-out infinite",
            }}
          />
        </div>

        <div className="px-4 py-3.5 space-y-3">
          {/* Cabeçalho — Ícone + Label + Badge */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 border border-primary/15">
                {getToolIcon(toolStatus)}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-foreground/90 tracking-widest leading-none">
                  Recurso
                </span>
                <span className="text-[9px] text-muted-foreground/70 mt-0.5 leading-none">
                  Processando
                </span>
              </div>
            </div>

            {/* Badge pulsante */}
            <span className="flex items-center gap-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-md bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-md bg-emerald-500" />
              </span>
              Ativo
            </span>
          </div>

          {/* Console — Fundo escuro sutil com texto monospace */}
          <div className="flex items-center gap-2.5 px-3 py-2.5  bg-primary/6 border border-primary/20 overflow-hidden">
            <Terminal className="w-3.5 h-3.5 shrink-0 text-primary/50" />
            <span className="truncate flex-1 font-mono text-[11px] text-foreground/70 leading-tight">
              {toolStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
