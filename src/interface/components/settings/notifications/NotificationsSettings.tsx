import { useTranslation } from "react-i18next"
import { Label } from "@/interface/components/ui/label"
import { Switch } from "@/interface/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Separator } from "@/interface/components/ui/separator"
import { Bell } from "lucide-react"
import { useEffect, useState } from "react"

// PAINEL DE NOTIFICAÇÕES — TOGGLES DE E-MAIL, PUSH E RESUMO SEMANAL
export function NotificationsSettings() {   
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    email: true,
    push: false,
    weeklyDigest: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem("elana-notifications-settings")
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  // ATUALIZA UM TOGGLE E PERSISTE NO LOCALSTORAGE
  const handleChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("elana-notifications-settings", JSON.stringify(newSettings))
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t("settings.notifications.title", "Notificações")}
          </CardTitle>
          <CardDescription>{t("settings.notifications.description", "Escolha como você quer ser avisado")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.notifications.email.label", "E-mail")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.notifications.email.desc", "Alertas de segurança por e-mail")}</p>
            </div>
            <Switch
              checked={settings.email}
              onCheckedChange={(checked) => handleChange("email", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.notifications.push.label", "Push")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.notifications.push.desc", "Notificações no navegador")}</p>
            </div>
            <Switch
              checked={settings.push}
              onCheckedChange={(checked) => handleChange("push", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.notifications.weeklyDigest.label", "Resumo Semanal")}</Label>
              <p className="text-sm text-muted-foreground">{t("settings.notifications.weeklyDigest.desc", "Relatório de uso da semana")}</p>
            </div>
            <Switch
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => handleChange("weeklyDigest", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
