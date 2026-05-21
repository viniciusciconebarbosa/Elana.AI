"use client"
import { Label } from "@/interface/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/interface/components/ui/select"
import { Button } from "@/interface/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { useModelSettingsForm } from "./ContextSettings"

// SELECTOR DE MODELO — LISTA OS MODELOS DISPONÍVEIS NA ROTA ATIVA E PERMITE ATUALIZAR
export function ModelSelector() {
    const {
        draft,
        routes,
        availableModels,
        isRoutesLoading,
        refreshRoutes,
        handleModelChange
    } = useModelSettingsForm()

    if (!draft) return null

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between ">
                <Label htmlFor="model-select">
                    Modelo {routes.length === 0 && <span className="font-normal text-muted-foreground ml-1">Nenhum modelo disponível</span>}
                </Label>
                {!draft.model && <span className="text-[10px] font-medium text-primary/60 uppercase tracking-wider">Default</span>}
                <div className="flex items-center gap-2">
                    {isRoutesLoading && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Carregando...
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => refreshRoutes()}
                        disabled={routes.length === 0}
                        title="Recarregar modelos da API"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isRoutesLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>
            <Select
                value={draft.model || undefined}
                onValueChange={handleModelChange}
                disabled={routes.length === 0 || availableModels.length === 0}
            >
                <SelectTrigger id="model-select" className="w-full bg-background/40">
                    <SelectValue placeholder={routes.length === 0 ? "⌛ Selecione uma Rota primeiro" : "Padrão (Default)"} />
                </SelectTrigger>
                <SelectContent>
                    {availableModels.length > 0 ? (
                        availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}  className="focus:bg-muted! focus:text-foreground!" >
                                {model.name}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="default" disabled>
                            Nenhum modelo (Default)
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}
