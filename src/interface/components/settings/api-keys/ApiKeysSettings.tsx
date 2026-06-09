import { useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/interface/lib/utils"
import { Button } from "@/interface/components/ui/button"
import { Input } from "@/interface/components/ui/input"
import { Badge } from "@/interface/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Key, Trash2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useApiKeys } from "@/interface/context/ApiKeysContext"

export type { ApiKeyMeta as ApiKey } from "@/interface/context/ApiKeysContext"

// PAINEL DE GERENCIAMENTO DE CHAVES DE API — ADICIONA, LISTA E REMOVE CHAVES CRIPTOGRAFADAS
export function ApiKeysSettings() {
  const { t } = useTranslation()
  const { apiKeys, isLoading, addKey, deleteKey } = useApiKeys()
  const [showNewKeyInput, setShowNewKeyInput] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [newKeyProvider, setNewKeyProvider] = useState("auto")
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyBaseUrl, setNewKeyBaseUrl] = useState("")

  const presets = [
    { id: "custom", name: "Personalizado (Digitar URL)", provider: "openai", baseUrl: "" },
    { id: "openrouter", name: "OpenRouter", provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1" },
    { id: "deepseek", name: "DeepSeek", provider: "deepseek", baseUrl: "https://api.deepseek.com" },
    { id: "groq", name: "Groq", provider: "groq", baseUrl: "https://api.groq.com/openai/v1" },
    { id: "alibaba", name: "Alibaba Cloud (Qwen)", provider: "alibaba", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
    { id: "zenapi", name: "Zen API (OpenCode)", provider: "zenapi", baseUrl: "https://opencode.ai/zen/v1" },
    { id: "mistral", name: "Mistral AI", provider: "mistral", baseUrl: "https://api.mistral.ai/v1" },
    { id: "ollama", name: "Ollama (Local)", provider: "ollama", baseUrl: "http://localhost:11434/v1" },
  ]
  const [selectedPreset, setSelectedPreset] = useState("custom")

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setNewKeyName(preset.id === "custom" ? "" : preset.name)
      setNewKeyBaseUrl(preset.baseUrl)
      setNewKeyProvider(preset.provider)
    }
  }

  // CRIPTOGRAFA E SALVA UMA NOVA CHAVE, VALIDANDO O TIPO DE PROVEDOR
  const handleAdd = async () => {
    if (!newKeyValue.trim() || isSaving) return
    
    // Validar se URL foi preenchida para provedor customizado/proxy
    if (newKeyProvider !== "auto" && !newKeyBaseUrl.trim()) {
      toast.error(t("settings.apiKeys.validation.urlRequired", "A URL base é obrigatória para provedores personalizados/proxies"))
      return
    }

    setIsSaving(true)
    try {
      await addKey(
        newKeyValue.trim(), 
        newKeyProvider === "auto" ? undefined : newKeyProvider,
        newKeyName || undefined,
        newKeyBaseUrl || undefined
      )
      setNewKeyValue("")
      setNewKeyName("")
      setNewKeyBaseUrl("")
      setNewKeyProvider("auto")
      setSelectedPreset("custom")
      setShowNewKeyInput(false)
      toast.success(t("settings.apiKeys.toast.saved", "Chave criptografada e salva!"))
    } catch {
      toast.error(t("settings.apiKeys.toast.saveError", "Erro ao salvar chave API"))
    } finally {
      setIsSaving(false)
    }
  }

  // REMOVE UMA CHAVE PELO ID E NOTIFICA O USUÁRIO
  const handleDelete = async (id: string) => {
    await deleteKey(id)
    toast.success(t("settings.apiKeys.toast.deleted", "Chave removida"))
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                {t("settings.apiKeys.title", "Chaves de API")}
              </CardTitle>
              <CardDescription>{t("settings.apiKeys.description", "Chaves criptografadas e salvas com segurança no navegador")}</CardDescription>
            </div>
            {!showNewKeyInput && (
              <Button variant="outline" size="sm" onClick={() => setShowNewKeyInput(true)} disabled={isLoading}>
                {t("settings.apiKeys.addKey", "Adicionar Chave")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{t("settings.apiKeys.checkingKeys", "Verificando chaves salvas...")}</span>
            </div>
          )}

          {showNewKeyInput && (
            <div className="space-y-4 p-4 rounded-lg bg-secondary/20 border border-glass-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">{t("settings.apiKeys.providerType", "Tipo de Provedor")}</label>
                  <select 
                    className="w-full bg-background border border-glass-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={newKeyProvider === "auto" ? "auto" : (newKeyProvider === "custom" ? "custom" : "openai")}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewKeyProvider(val)
                      if (val === "auto") {
                        setSelectedPreset("custom")
                        setNewKeyName("")
                        setNewKeyBaseUrl("")
                      }
                    }}
                  >
                    <option value="auto">{t("settings.apiKeys.providers.auto", "Detecção Automática")}</option>
                    <option value="openai">{t("settings.apiKeys.providers.openai", "OpenAI Compatível (Proxy)")}</option>
                    <option value="custom">{t("settings.apiKeys.providers.custom", "Provedor Personalizado")}</option>
                  </select>
                </div>
                
                {newKeyProvider !== "auto" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Preset de Provedor</label>
                    <select 
                      className="w-full bg-background border border-glass-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      value={selectedPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                    >
                      {presets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {newKeyProvider !== "auto" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("settings.apiKeys.providerName", "Nome do Provedor")}</label>
                    <Input
                      placeholder={t("settings.apiKeys.providerNamePlaceholder", "Ex: Meu Proxy DigitalOcean")}
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase">{t("settings.apiKeys.baseUrl", "Base URL (API Host)")}</label>
                    <Input
                      placeholder={t("settings.apiKeys.baseUrlPlaceholder", "Ex: http://localhost:3100/v1")}
                      value={newKeyBaseUrl}
                      onChange={(e) => setNewKeyBaseUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {newKeyProvider !== "auto" && (
                <p className="text-[10px] text-muted-foreground italic">
                  {t("settings.apiKeys.baseUrlTip", "A URL onde os modelos estão hospedados. Deve suportar /models e /chat/completions.")}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">{t("settings.apiKeys.apiKey", "Chave de API")}</label>
                <Input
                  type="password"
                  placeholder={t("settings.apiKeys.apiKeyPlaceholder", "Cole sua chave aqui...")}
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAdd} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("settings.apiKeys.saveKey", "Salvar Chave")}
                </Button>
                <Button variant="outline" onClick={() => { setShowNewKeyInput(false); setNewKeyValue("") }}>
                  {t("common.cancel", "Cancelar")}
                </Button>
              </div>
            </div>
          )}

          {!isLoading && apiKeys.map((key) => (
            <div 
              key={key.id} 
              className="flex items-start sm:items-center justify-between p-4 rounded-lg bg-secondary/10 border border-glass-border group hover:bg-secondary/20 transition-all duration-200 gap-3"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0", key.isActive ? "bg-accent/20" : "bg-secondary")}>
                  <Key className={cn("w-5 h-5", key.isActive ? "text-accent" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 leading-none">
                    <p className="font-semibold text-sm sm:text-base truncate">{key.name}</p>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 uppercase font-bold shrink-0">{key.provider}</Badge>
                    {key.baseUrl && (
                      <span className="text-[10px] text-muted-foreground break-all whitespace-normal">
                        ({key.baseUrl})
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate break-all">{key.maskedKey}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 mt-1 sm:mt-0" 
                onClick={() => handleDelete(key.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {!isLoading && apiKeys.length === 0 && !showNewKeyInput && (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("settings.apiKeys.noKeys", "Nenhuma chave configurada")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("settings.apiKeys.encryptionNotice", "As chaves são criptografadas com AES-256 antes de serem salvas")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
