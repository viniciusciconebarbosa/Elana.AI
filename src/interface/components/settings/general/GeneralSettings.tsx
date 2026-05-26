import { useState, useEffect, useCallback } from "react"
import { Label } from "@/interface/components/ui/label"
import { Switch } from "@/interface/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Separator } from "@/interface/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/interface/components/ui/select"
import { Input } from "@/interface/components/ui/input"
import { useUserProfile } from "@/interface/context/UserProfileContext"
import { Button } from "../../ui/button"

const SETTINGS_STORAGE_KEY = "elana-general-settings"

import { SystemPromptSettingsCard } from "./SystemPromptSettingsCard"

// PAINEL DE CONFIGURAÇÕES GERAIS — PERFIL, IDIOMA, AUTO-SAVE, STREAMING E INDICADORES DE MEMÓRIA
export function GeneralSettings() {
  const { userName, updateUserName } = useUserProfile()
  const [settings, setSettings] = useState({
      language: "pt-BR",
      autoSave: true,
      streamResponses: true,
      showMemoryIndicators: true,
    })
  const [nameInput, setNameInput] = useState(() => userName)
  const [isReady, setIsReady] = useState(false)

  const onChangeNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNameInput(e.target.value)
  }

  // Sincroniza com a animação de entrada para renderização diferida (60 FPS)
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 120)
    return () => clearTimeout(t)
  }, [])

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) { console.error("Erro ao carregar configurações gerais:", e) }
    }
  }, [])

  // ATUALIZA UM CAMPO E PERSISTE O ESTADO NO LOCALSTORAGE
  const handleChange = (key: string, value: string | boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
  }

  if (!isReady) {
    return (
      <div 
        className="space-y-6 animate-in fade-in duration-150"
        style={{ 
          willChange: "transform, opacity",
          transform: "translate3d(0, 0, 0)"
        }}
      >
        <Card className="glass border-glass-border">
          <CardHeader>
            <div className="h-6 w-32 bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-56 bg-muted-foreground/10 rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent className="h-16 bg-muted-foreground/5 rounded-b-xl" />
        </Card>
        <Card className="glass border-glass-border">
          <CardHeader>
            <div className="h-6 w-36 bg-muted-foreground/10 rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted-foreground/10 rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="h-10 bg-muted-foreground/5 rounded animate-pulse" />
            <div className="h-10 bg-muted-foreground/5 rounded animate-pulse" />
            <div className="h-10 bg-muted-foreground/5 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="space-y-6 animate-in fade-in duration-200"
      style={{ 
        willChange: "transform, opacity",
        transform: "translate3d(0, 0, 0)"
      }}
    >
      {/* Perfil do Usuário */}
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
          <CardDescription>Personalize como a Elana se comunica com você</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Seu Nome</Label>
            <Input
              id="profile-name"
              type="text"
              value={nameInput}
              onChange={(e) => onChangeNameInput(e)}
              placeholder={userName}
              className="max-w-md mr-2 bg-background/50 border-glass-border focus-visible:ring-primary/40"
              maxLength={30}
              autoComplete="off"
            />
            <Button variant="outline" onClick={() => updateUserName(nameInput)}>Salvar</Button>

            <p className="text-xs text-muted-foreground">
              Este nome será exibido nos balões das suas mensagens e na barra lateral.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle>Preferências Gerais</CardTitle>
          <CardDescription>Configure as opções básicas da Elana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Idioma</Label>
              <p className="text-sm text-muted-foreground">Idioma da interface</p>
            </div>
            <Select value={settings.language} onValueChange={(value) => handleChange("language", value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (BR)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Salvar automaticamente</Label>
              <p className="text-sm text-muted-foreground">Salva conversas automaticamente</p>
            </div>
            <Switch
              checked={settings.autoSave}
              onCheckedChange={(checked) => handleChange("autoSave", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Streaming de respostas</Label>
              <p className="text-sm text-muted-foreground">Mostra respostas em tempo real</p>
            </div>
            <Switch
              checked={settings.streamResponses}
              onCheckedChange={(checked) => handleChange("streamResponses", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Indicadores de memória</Label>
              <p className="text-sm text-muted-foreground">Mostra quando memórias são usadas</p>
            </div>
            <Switch
              checked={settings.showMemoryIndicators}
              onCheckedChange={(checked) => handleChange("showMemoryIndicators", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <SystemPromptSettingsCard />
    </div>
  )
}
