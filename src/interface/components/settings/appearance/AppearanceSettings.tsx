import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/interface/lib/utils"
import { Label } from "@/interface/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Button } from "@/interface/components/ui/button"
import { Palette, Sun, Moon, Monitor, Sunset, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"

// PAINEL DE APARÊNCIA — SELEÇÃO DE TEMA (CLARO, ESCURO OU SISTEMA)
export function AppearanceSettings() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("elana-chat-font-size")
      return saved ? parseInt(saved, 10) : 16
    }
    return 16
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--chat-font-size', `${fontSize}px`)
    localStorage.setItem("elana-chat-font-size", fontSize.toString())
  }, [fontSize])

  const themes = useMemo(() => [
    { id: "light", label: t("settings.appearance.themes.light", "Claro"), icon: Sun },
    { id: "dark", label: t("settings.appearance.themes.dark", "Escuro"), icon: Moon },
    { id: "black-metal", label: t("settings.appearance.themes.blackMetal", "Black Metal"), icon: Sparkles },
    { id: "sunrise", label: t("settings.appearance.themes.sunrise", "Sunrise Vintage"), icon: Sunset },
    { id: "system", label: t("settings.appearance.themes.system", "Sistema"), icon: Monitor },
  ], [t])

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {t("settings.appearance.title", "Aparência")}
          </CardTitle>
          <CardDescription>{t("settings.appearance.description", "Personalize o visual da Elana")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">{t("settings.appearance.theme", "Tema")}</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    theme === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <t.icon className="w-6 h-6" />
                  <span className="text-sm">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tamanho da Fonte do Chat */}
          <div className="pt-6 border-t border-glass-border">
            <Label className="mb-3 block text-sm font-medium">{t("settings.appearance.fontSize", "Tamanho da Fonte do Chat")}</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFontSize((prev) => Math.max(12, prev - 1))}
                disabled={fontSize <= 12}
                className="h-9 w-9 border-glass-border hover:bg-primary/5 active:scale-95 transition-all"
              >
                -
              </Button>
              <span className="text-sm font-semibold min-w-[48px] text-center font-mono">
                {fontSize}px
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFontSize((prev) => Math.min(24, prev + 1))}
                disabled={fontSize >= 24}
                className="h-9 w-9 border-glass-border hover:bg-primary/5 active:scale-95 transition-all"
              >
                +
              </Button>

              {fontSize !== 16 && (
                <Button
                  variant="ghost"
                  onClick={() => setFontSize(16)}
                  className="text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 ml-2 h-9 px-3"
                >
                  {t("common.reset", "Redefinir")}
                </Button>
              )}

              <span className="text-xs text-muted-foreground ml-2">
                {t("settings.appearance.fontSizeTip", "Ajuste o tamanho da fonte das mensagens no chat (mínimo 12px, máximo 24px).")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
