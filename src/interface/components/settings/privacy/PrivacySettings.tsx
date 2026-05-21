"use client"

import { useState, useEffect } from "react"
import { Label } from "@/interface/components/ui/label"
import { Switch } from "@/interface/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Separator } from "@/interface/components/ui/separator"
import { Shield } from "lucide-react"

// PAINEL DE PRIVACIDADE — TOGGLES DE ANALYTICS, MELHORIA DE MODELOS E RETENÇÃO DE HISTÓRICO
export function PrivacySettings() {
  const [settings, setSettings] = useState({
    shareAnalytics: false,
    improveModels: false,
    retainHistory: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem("elana-privacy-settings")
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  // ATUALIZA UM TOGGLE E PERSISTE NO LOCALSTORAGE
  const handleChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("elana-privacy-settings", JSON.stringify(newSettings))
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Privacidade & Segurança
          </CardTitle>
          <CardDescription>Gerencie como seus dados são tratados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Compartilhar Analytics</Label>
              <p className="text-sm text-muted-foreground">Ajude-nos a melhorar o app (anônimo)</p>
            </div>
            <Switch
              checked={settings.shareAnalytics}
              onCheckedChange={(checked) => handleChange("shareAnalytics", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Melhorar Modelos</Label>
              <p className="text-sm text-muted-foreground">Permitir uso das mensagens para treino (anônimo)</p>
            </div>
            <Switch
              checked={settings.improveModels}
              onCheckedChange={(checked) => handleChange("improveModels", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Reter Histórico</Label>
              <p className="text-sm text-muted-foreground">Mantém suas conversas salvas no dispositivo</p>
            </div>
            <Switch
              checked={settings.retainHistory}
              onCheckedChange={(checked) => handleChange("retainHistory", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
