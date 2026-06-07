"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Separator } from "@/interface/components/ui/separator"
import { HelpCircle, Sparkles, Terminal, FileText, Globe, Code, Key, Search, Sliders } from "lucide-react"

export function HelpSettings() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="glass border-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {t("settings.help.title", "Guia & Ajuda do Elana")}
          </CardTitle>
          <CardDescription>
            {t("settings.help.description", "Como configurar seus modelos e prompts para obter a melhor experiência e formatação.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Sessão 1: Prompt do Sistema */}
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("settings.help.optimizingSystemPrompt.title", "Otimizando o System Prompt")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("settings.help.optimizingSystemPrompt.desc")}
            </p>
            <div className="bg-secondary/40 rounded-lg p-3.5 border border-border/60 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> {t("settings.help.optimizingSystemPrompt.exampleTitle", "Exemplo de Prompt Recomendado")}
              </p>
              <pre className="text-xs text-foreground font-mono bg-background/50 p-2.5 rounded border border-border/40 whitespace-pre-wrap select-all cursor-pointer hover:bg-background/80 transition-colors">
                {t("settings.help.optimizingSystemPrompt.exampleContent")}
              </pre>
              <p className="text-[11px] text-muted-foreground italic">
                {t("settings.help.optimizingSystemPrompt.exampleTip")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Sessão 2: Regras de Renderização do Markdown */}
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center gap-2 text-foreground">
              <Code className="w-4 h-4 text-primary" />
              {t("settings.help.markdownCapabilities.title", "Capacidades de Renderização (Markdown)")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("settings.help.markdownCapabilities.desc")}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
              <li className="flex items-start gap-2 bg-secondary/20 p-2.5 rounded-lg border border-border/40">
                <Terminal className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">{t("settings.help.markdownCapabilities.codeBlocks.title", "Blocos de Código")}</span>
                  <span className="text-xs text-muted-foreground">{t("settings.help.markdownCapabilities.codeBlocks.desc")}</span>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-secondary/20 p-2.5 rounded-lg border border-border/40">
                <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">{t("settings.help.markdownCapabilities.smartLinks.title", "Links Inteligentes")}</span>
                  <span className="text-xs text-muted-foreground">{t("settings.help.markdownCapabilities.smartLinks.desc")}</span>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-secondary/20 p-2.5 rounded-lg border border-border/40">
                <span className="text-primary font-bold shrink-0 mt-0.5 w-4 text-center">#</span>
                <div>
                  <span className="font-semibold block">{t("settings.help.markdownCapabilities.headersList.title", "Títulos e Listas")}</span>
                  <span className="text-xs text-muted-foreground">{t("settings.help.markdownCapabilities.headersList.desc")}</span>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-secondary/20 p-2.5 rounded-lg border border-border/40">
                <span className="text-primary font-bold shrink-0 mt-0.5 w-4 text-center">田</span>
                <div>
                  <span className="font-semibold block">{t("settings.help.markdownCapabilities.tables.title", "Tabelas Ricas")}</span>
                  <span className="text-xs text-muted-foreground">{t("settings.help.markdownCapabilities.tables.desc")}</span>
                </div>
              </li>
            </ul>
          </div>

          <Separator />

          {/* Sessão 3: Parâmetros de Geração Avançados */}
          <div className="space-y-3">
            <h3 className="text-md font-semibold flex items-center gap-2 text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              {t("settings.help.advancedParameters.title", "Parâmetros Avançados de Modelos")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("settings.help.advancedParameters.desc")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-secondary/15 rounded-lg border border-border/40 space-y-1">
                <span className="font-semibold block">{t("settings.help.advancedParameters.maxTokens.title")}</span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  {t("settings.help.advancedParameters.maxTokens.desc")}
                </span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-lg border border-border/40 space-y-1">
                <span className="font-semibold block">{t("settings.help.advancedParameters.temperature.title")}</span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  {t("settings.help.advancedParameters.temperature.desc")}
                </span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-lg border border-border/40 space-y-1">
                <span className="font-semibold block">{t("settings.help.advancedParameters.topP.title")}</span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  {t("settings.help.advancedParameters.topP.desc")}
                </span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-lg border border-border/40 space-y-1">
                <span className="font-semibold block">{t("settings.help.advancedParameters.presence.title")}</span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  {t("settings.help.advancedParameters.presence.desc")}
                </span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-lg border border-border/40 md:col-span-2 space-y-1">
                <span className="font-semibold block">{t("settings.help.advancedParameters.frequency.title")}</span>
                <span className="text-xs text-muted-foreground leading-relaxed block">
                  {t("settings.help.advancedParameters.frequency.desc")}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sessão 3: Chaves API & Pesquisa na Web */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold flex items-center gap-2 text-foreground">
              <Key className="w-4 h-4 text-primary" />
              {t("settings.help.apiKeysSearch.title", "Chaves API & Pesquisa na Web")}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2 p-3 bg-secondary/15 rounded-lg border border-border/40">
                <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                  <Key className="w-3.5 h-3.5 text-primary" /> {t("settings.help.apiKeysSearch.keys.title")}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.help.apiKeysSearch.keys.desc")}
                </p>
              </div>
              <div className="space-y-2 p-3 bg-secondary/15 rounded-lg border border-border/40">
                <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                  <Search className="w-3.5 h-3.5 text-primary" /> {t("settings.help.apiKeysSearch.search.title")}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("settings.help.apiKeysSearch.search.desc")}
                </p>
              </div>
              <div className="space-y-2 p-3 bg-secondary/15 rounded-lg border border-border/40">
                <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                  <Globe className="w-3.5 h-3.5 text-primary" /> {t("settings.help.apiKeysSearch.deepseek.title")}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {t("settings.help.apiKeysSearch.deepseek.desc")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sessão 4: Dicas Gerais */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground">{t("settings.help.tips.title", "Dica Importante para Desenvolvimento:")}</h4>
            <p className="leading-relaxed">
              {t("settings.help.tips.desc")}
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
