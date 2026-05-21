import { Suspense, lazy } from "react"
import { useSearchParams } from "react-router-dom"
import { SettingsHeader } from "@/interface/components/settings/SettingsHeader"

// IMPORTS DINÂMICOS — cada painel só é baixado e processado quando o usuário
// navegar até aquela seção, reduzindo drasticamente o tempo de carregamento inicial.
const GeneralSettings      = lazy(() => import("@/interface/components/settings/general/GeneralSettings").then(m => ({ default: m.GeneralSettings })))
const ModelSettings        = lazy(() => import("@/interface/components/settings/models/ModelSettings").then(m => ({ default: m.ModelSettings })))
const DatabaseSettings     = lazy(() => import("@/interface/components/settings/database/DatabaseSettings").then(m => ({ default: m.DatabaseSettings })))
const ApiKeysSettings      = lazy(() => import("@/interface/components/settings/api-keys/ApiKeysSettings").then(m => ({ default: m.ApiKeysSettings })))
const ToolsSettings        = lazy(() => import("@/interface/components/settings/tools/ToolsSettings").then(m => ({ default: m.ToolsSettings })))
const AppearanceSettings   = lazy(() => import("@/interface/components/settings/appearance/AppearanceSettings").then(m => ({ default: m.AppearanceSettings })))
const NotificationsSettings = lazy(() => import("@/interface/components/settings/notifications/NotificationsSettings").then(m => ({ default: m.NotificationsSettings })))
const PrivacySettings      = lazy(() => import("@/interface/components/settings/privacy/PrivacySettings").then(m => ({ default: m.PrivacySettings })))
const DataSettings         = lazy(() => import("@/interface/components/settings/data/DataSettings").then(m => ({ default: m.DataSettings })))

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

// PÁGINA DE CONFIGURAÇÕES
export default function SettingsPage() {
    return (
        <Suspense fallback={<PanelSkeleton />}>
            <SettingsContent />
        </Suspense>
    )
}

// CONTEÚDO DAS CONFIGURAÇÕES — LÊ A SEÇÃO ATIVA VIA URL E EXIBE O PAINEL CORRESPONDENTE
function SettingsContent() {
    const [searchParams] = useSearchParams()
    const activeSection = searchParams.get("section") || "general"

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <SettingsHeader />

            <div className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-3xl mx-auto w-full">
                    {/* Cada painel tem seu próprio Suspense para que o skeleton apareça
                        somente na área de conteúdo, sem afetar o SettingsHeader */}
                    <Suspense fallback={<PanelSkeleton />}>
                        {activeSection === "general"        && <GeneralSettings />}
                        {activeSection === "models"         && <ModelSettings />}
                        {activeSection === "chat-database"  && <DatabaseSettings />}
                        {activeSection === "api-keys"       && <ApiKeysSettings />}
                        {activeSection === "tools"          && <ToolsSettings />}
                        {activeSection === "appearance"     && <AppearanceSettings />}
                        {activeSection === "notifications"  && <NotificationsSettings />}
                        {activeSection === "privacy"        && <PrivacySettings />}
                        {activeSection === "data"           && <DataSettings />}
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
