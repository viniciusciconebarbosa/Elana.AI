"use client"

import { useState, useCallback } from "react"
import { cn } from "@/interface/lib/utils"
import { Button } from "@/interface/components/ui/button"
import { Input } from "@/interface/components/ui/input"
import { Textarea } from "@/interface/components/ui/textarea"
import { Badge } from "@/interface/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/interface/components/ui/tabs"
import { Progress } from "@/interface/components/ui/progress"
import {
  Upload,
  FileText,
  Link,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Globe,
  File,
  Zap,
} from "lucide-react"

interface IngestionItem {
  id: string
  type: "file" | "url" | "text"
  name: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  size?: string
  factsExtracted?: number
  timestamp: Date
}

const mockIngestions: IngestionItem[] = [
  {
    id: "1",
    type: "file",
    name: "diario-2024.pdf",
    status: "completed",
    progress: 100,
    size: "2.4 MB",
    factsExtracted: 47,
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "url",
    name: "linkedin.com/in/usuario",
    status: "completed",
    progress: 100,
    factsExtracted: 23,
    timestamp: new Date(),
  },
  {
    id: "3",
    type: "text",
    name: "Notas sobre reunião",
    status: "processing",
    progress: 65,
    timestamp: new Date(),
  },
]

const stats = [
  { label: "Fatos Armazenados", value: "1,247", icon: Zap, color: "text-primary" },
  { label: "Documentos Processados", value: "89", icon: FileText, color: "text-accent" },
  { label: "URLs Indexadas", value: "34", icon: Globe, color: "text-chart-4" },
  { label: "Última Atualização", value: "5 min", icon: Clock, color: "text-muted-foreground" },
]

// CONTEÚDO PRINCIPAL DA PÁGINA BRAIN — EXIBE STATS, UPLOAD E FILA DE PROCESSAMENTO
export function BrainContent() {
  const [activeTab, setActiveTab] = useState("upload")
  const [isDragging, setIsDragging] = useState(false)
  const [ingestions, setIngestions] = useState<IngestionItem[]>(mockIngestions)
  const [urlInput, setUrlInput] = useState("")
  const [textInput, setTextInput] = useState("")

  // ATIVA O ESTADO DE DRAG QUANDO O USUÁRIO ARRASTA UM ARQUIVO SOBRE A ÁREA
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  // DESATIVA O ESTADO DE DRAG QUANDO O USUÁRIO SAI DA ÁREA DE DROP
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // RECEBE O ARQUIVO SOLTO NA ÁREA DE DROP (IMPLEMENTAÇÃO FUTURA)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Simulação de upload
  }, [])

  // RETORNA O ÍCONE DE STATUS CORRETO PARA CADA ITEM DA FILA
  const getStatusIcon = (status: IngestionItem["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-muted-foreground" />
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-accent" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <Card key={i} className=" border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className=" border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Adicionar Conhecimento
              </CardTitle>
              <CardDescription>
                Faça upload de arquivos, URLs ou texto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="upload" className="gap-2">
                    <File className="w-4 h-4" />
                    Arquivos
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <Globe className="w-4 h-4" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Texto
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-0">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-foreground mb-1">
                      Arraste arquivos aqui ou{" "}
                      <span className="text-primary font-medium">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, TXT, JSON, imagens, e mais
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="https://exemplo.com/pagina"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                  <Button disabled={!urlInput.trim()} className="w-full">
                    <Globe className="w-4 h-4 mr-2" />
                    Processar URL
                  </Button>
                </TabsContent>

                <TabsContent value="text" className="mt-0 space-y-4">
                  <Textarea
                    placeholder="Cole ou digite o texto aqui..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <Button disabled={!textInput.trim()} className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Processar Texto
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Processing Queue */}
          <Card className=" border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-accent" />
                    Fila de Processamento
                  </CardTitle>
                  <CardDescription>
                    {ingestions.filter((i) => i.status === "processing").length} em andamento
                  </CardDescription>
                </div>
                <Badge variant="secondary">{ingestions.length} itens</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-3">
                  {ingestions.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-secondary">
                            {item.type === "file" && <File className="w-4 h-4" />}
                            {item.type === "url" && <Globe className="w-4 h-4" />}
                            {item.type === "text" && <MessageSquare className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.size && (
                                <span className="text-xs text-muted-foreground">{item.size}</span>
                              )}
                              {item.factsExtracted && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.factsExtracted} fatos
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {item.status === "processing" && (
                        <Progress value={item.progress} className="h-1 mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supported Formats */}
        <Card className=" border-border mt-10 mb-50">
          <CardHeader>
            <CardTitle className="text-lg">Formatos Suportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: FileText, label: "PDF", color: "text-red-400" },
                { icon: FileText, label: "TXT", color: "text-gray-400" },
                { icon: FileText, label: "JSON", color: "text-yellow-400" },
                { icon: FileText, label: "CSV", color: "text-green-400" },
                { icon: FileText, label: "Imagens", color: "text-blue-400" },
                { icon: Globe, label: "URLs", color: "text-primary" },
                { icon: MessageSquare, label: "Texto", color: "text-accent" },
              ].map((format, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="py-2 px-3 gap-2 bg-secondary/30"
                >
                  <format.icon className={cn("w-4 h-4", format.color)} />
                  {format.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
