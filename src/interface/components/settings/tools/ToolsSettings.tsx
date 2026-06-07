import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/interface/components/ui/button"
import { Input } from "@/interface/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Save, RotateCcw, AlertTriangle, Hammer, Eye, EyeOff, Search } from "lucide-react"
import { toast } from "sonner"
import { useToolsSettings } from "@/interface/context/ToolsSettingsContext"

function SettingField({
    label,
    description,
    value,
    onChange,
    placeholder,
    secret = false,
}: {
    label: string
    description?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    secret?: boolean
}) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <Input
                    type={secret && !visible ? "password" : "text"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="text-sm font-mono pr-10"
                />
                {secret && (
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
            )}
        </div>
    )
}

export function ToolsSettings() {
    const { t } = useTranslation()
    const { config, updateConfig, saveConfig, resetConfig, isDirty } = useToolsSettings()
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            saveConfig()
            toast.success(t("common.success", "Configurações salvas com sucesso!"))
        } catch {
            toast.error(t("common.error", "Erro ao salvar configurações"))
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        resetConfig()
        toast.success(t("common.restored", "Configurações restauradas para os padrões"))
    }

    return (
        <div className="space-y-6">
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Hammer className="w-4 h-4 text-blue-500" />
                        </div>
                        {t("settings.tools.title", "Ferramentas e Integrações")}
                    </CardTitle>
                    <CardDescription>
                        {t("settings.tools.description", "Configure as chaves de acesso para ferramentas externas usadas pela inteligência artificial.")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Tavily Web Search */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">Tavily Web Search</h3>
                        </div>
                        
                        <SettingField
                            label="Tavily API Key"
                            description={t("settings.tools.tavily.keyDesc", "Chave de API para a ferramenta de busca na internet.")}
                            value={config.tavilyApiKey}
                            onChange={(v) => updateConfig({ tavilyApiKey: v })}
                            placeholder="tvly-xxxxxxxxxxxxxxxxxxxxxx"
                            secret
                        />
                        
                        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">{t("settings.tools.tavily.guide.title", "Como obter sua chave:")}</strong><br/>
                                1. {t("settings.tools.tavily.guide.step1", "Acesse")} <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">tavily.com</a><br/>
                                2. {t("settings.tools.tavily.guide.step2", "Crie uma conta gratuita (Free Tier).")}<br/>
                                3. {t("settings.tools.tavily.guide.step3", "Vá no painel e copie sua API Key que começa com tvly-.")}
                            </p>
                        </div>
                    </div>

                    {isDirty && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{t("settings.tools.unsavedChanges", "Você tem alterações não salvas.")}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                        <Button onClick={handleSave} disabled={isSaving || !isDirty} className="w-full sm:w-auto gap-2">
                            <Save className="w-4 h-4" />
                            {isSaving ? t("common.saving", "Salvando...") : t("settings.tools.saveConfig", "Salvar Configurações")}
                        </Button>
                        <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto gap-2">
                            <RotateCcw className="w-4 h-4" />
                            {t("settings.tools.restoreDefaults", "Restaurar Padrões")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
