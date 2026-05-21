"use client"

import { Badge } from "@/interface/components/ui/badge"
import { Button } from "@/interface/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/interface/components/ui/dialog"
import { Database, Tag, Brain, Edit3, Trash2 } from "lucide-react"
import type { Memory } from "./MemoryCard"

interface MemoryDetailDialogProps {
  memory: Memory | null
  onClose: () => void
  getCategoryIcon: (id: string) => typeof Database
  getCategoryLabel: (id: string) => string
}

// DIALOG DE DETALHES DE MEMÓRIA — EXIBE TODOS OS CAMPOS DA MEMÓRIA SELECIONADA
export function MemoryDetailDialog({
  memory,
  onClose,
  getCategoryIcon,
  getCategoryLabel,
}: MemoryDetailDialogProps) {
  return (
    <Dialog open={!!memory} onOpenChange={onClose}>
      <DialogContent className="glass max-w-lg">
        {memory && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Detalhe da Memória
              </DialogTitle>
              <DialogDescription>Informação armazenada sobre você</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-foreground leading-relaxed">{memory.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Categoria</span>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    {(() => {
                      const Icon = getCategoryIcon(memory.category)
                      return <Icon className="w-4 h-4 text-primary" />
                    })()}
                    {getCategoryLabel(memory.category)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fonte</span>
                  <p className="font-medium mt-1">{memory.source}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data</span>
                  <p className="font-medium mt-1">{memory.date.toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Confiança</span>
                  <p className="font-medium mt-1">{memory.confidence}%</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {memory.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1 gap-2">
                  <Edit3 className="w-4 h-4" />
                  Editar
                </Button>
                <Button variant="outline" className="text-destructive hover:text-destructive gap-2">
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
