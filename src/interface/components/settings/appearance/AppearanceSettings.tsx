"use client"

import { cn } from "@/interface/lib/utils"
import { Label } from "@/interface/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Palette, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

// PAINEL DE APARÊNCIA — SELEÇÃO DE TEMA (CLARO, ESCURO OU SISTEMA)
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Escuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </CardTitle>
          <CardDescription>Personalize o visual da Elana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Tema</Label>
            <div className="grid grid-cols-3 gap-3">
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
        </CardContent>
      </Card>
    </div>
  )
}
