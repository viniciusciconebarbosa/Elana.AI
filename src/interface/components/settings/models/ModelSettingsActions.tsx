"use client"
import { Button } from "@/interface/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useModelSettingsForm } from "./ContextSettings"

// BARRA DE AÇÕES DO PAINEL DE MODELO — INDICADOR DE DIRTY STATE E BOTÃO DE SALVAR
export function ModelSettingsActions() {
    const {
        draft,
        routes,
        availableModels,
        handleSave,
        isDirty,
        isRoutesLoading
    } = useModelSettingsForm()

    if (!draft) return null

    return (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
                {isDirty ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Pendentes</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Sincronizado</span>
                    </div>
                )}
                <div className="hidden sm:block text-[10px] text-muted-foreground ml-2">
                    {availableModels.find(m => m.id === draft.model)?.name || draft.modelName}
                    {" • "}
                    {routes.find(r => r.route === draft.route)?.routeName || draft.routeName}
                </div>
            </div>
            <Button
                onClick={handleSave}
                disabled={!isDirty || isRoutesLoading}
                className="min-w-[160px] gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
            >
                <CheckCircle2 className="w-4 h-4" />
                Salvar Alterações
            </Button>
        </div>
    )
}
