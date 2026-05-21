"use client"

import { Coffee, Zap } from "lucide-react"

interface LoadingIndicatorProps {
  toolStatus?: string | null
}

// INDICADOR DE CARREGAMENTO — EXIBIDO ENQUANTO O MODELO ESTÁ GERANDO A RESPOSTA
// QUANDO UMA TOOL ESTÁ ATIVA, EXIBE O STATUS DA TOOL EM VEZ DE "PENSANDO..."
export function LoadingIndicator({ toolStatus }: LoadingIndicatorProps = {}) {
  const isTool = !!toolStatus
  return (
    <div className="flex gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isTool ? 'bg-primary/20' : 'bg-accent/20'}`}>
        {isTool
          ? <Zap className="w-4 h-4 text-primary animate-pulse" />
          : <Coffee className="w-4 h-4 text-accent animate-pulse" />}
      </div>
      <div className="glass rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-muted-foreground">{toolStatus ?? 'Pensando...'}</span>
        </div>
      </div>
    </div>
  )
}
