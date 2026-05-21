"use client"

import { Button } from "@/interface/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Separator } from "@/interface/components/ui/separator"
import { Database, Download, RefreshCw, Trash2 } from "lucide-react"

// PAINEL DE DADOS — AÇÕES DE EXPORTAR, SINCRONIZAR E EXCLUIR TODOS OS DADOS
export function DataSettings() {
  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>Exporte ou exclua seus dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">Exportar todos os dados</p>
              <p className="text-sm text-muted-foreground">Baixe uma cópia completa dos seus dados</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="font-medium">Sincronizar memórias</p>
              <p className="text-sm text-muted-foreground">Forçar sincronização com o servidor</p>
            </div>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Sincronizar
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div>
              <p className="font-medium text-destructive">Zona de Perigo</p>
              <p className="text-sm text-muted-foreground">Excluir permanentemente todos os dados</p>
            </div>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Excluir Tudo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
