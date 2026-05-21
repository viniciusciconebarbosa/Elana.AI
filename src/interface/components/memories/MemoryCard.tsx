"use client"

import { cn } from "@/interface/lib/utils"
import { Card, CardContent } from "@/interface/components/ui/card"
import { Badge } from "@/interface/components/ui/badge"
import { Button } from "@/interface/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/interface/components/ui/tooltip"
import { Database, Clock, Eye } from "lucide-react"

export interface Memory {
  id: string
  content: string
  category: string
  tags: string[]
  source: string
  date: Date
  confidence: number
  relatedMemories?: string[]
}

interface MemoryCardProps {
  memory: Memory
  getCategoryIcon: (id: string) => typeof Database
  getCategoryLabel: (id: string) => string
  onView: () => void
}

// CARTÃO DE MEMÓRIA — EXIBE CONTEÚDO, TAGS, CONFIANÇA E BOTÃO DE VISUALIZAÇÃO
export function MemoryCard({ memory, getCategoryIcon, getCategoryLabel, onView }: MemoryCardProps) {
  const Icon = getCategoryIcon(memory.category)

  return (
    <Card className="glass border-glass-border hover:border-primary/30 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2 rounded-lg bg-secondary/50">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    memory.confidence >= 90
                      ? "border-accent/50 text-accent"
                      : memory.confidence >= 70
                        ? "border-chart-4/50 text-chart-4"
                        : "border-muted-foreground/50"
                  )}
                >
                  {memory.confidence}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Nível de confiança</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-3">
          {memory.content}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {memory.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs py-0">
              {tag}
            </Badge>
          ))}
          {memory.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs py-0">
              +{memory.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {memory.date.toLocaleDateString("pt-BR")}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onView}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
