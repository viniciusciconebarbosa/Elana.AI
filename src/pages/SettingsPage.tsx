import { Suspense } from "react"
import { Outlet } from "react-router-dom"
import { SettingsHeader } from "@/interface/components/settings/SettingsHeader"

// FALLBACK DE LOADING — exibido enquanto o código do painel específico é carregado
function PanelSkeleton() {
    return (
        <div className="space-y-4 animate-pulse pt-2">
            <div className="h-6 w-48 rounded-lg bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
        </div>
    )
}

// PÁGINA DE CONFIGURAÇÕES (LAYOUT)
export default function SettingsPage() {
    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <SettingsHeader />

            <div className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-3xl mx-auto w-full">
                    {/* O React Router renderiza o subpainel correto aqui com Suspense */}
                    <Suspense fallback={<PanelSkeleton />}>
                        <Outlet />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
