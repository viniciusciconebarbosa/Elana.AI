import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/interface/components/ui/button"
import { Input } from "@/interface/components/ui/input"
import { Switch } from "@/interface/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/interface/components/ui/card"
import { Badge } from "@/interface/components/ui/badge"
import {
    Database,
    HardDrive,
    Eye,
    EyeOff,
    RotateCcw,
    Save,
    CheckCircle2,
    AlertTriangle,
    Info,
    Cloud,
    HardDriveDownload,
    ArrowRight,
    Wand2,
    Copy,
    Check,
} from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/interface/components/ui/alert-dialog"
import { useDatabaseSettings } from "@/interface/context/DatabaseSettingsContext"
import {
    getActiveDbProvider,
    setActiveDbProvider,
    type DbProvider,
} from "@/core/infrastructure/repositories/ChatRepositoryFactory"
import { databaseMigrationService } from "@/core/application/services/DatabaseMigrationService"
import { checkTablesExist, setupSupabaseTables, testSupabaseConnection } from "@/core/application/services/SupabaseSetupService"

// CAMPO COM LABEL, DESCRIÇÃO E TOGGLE DE VISIBILIDADE OPCIONAL (OTIMIZADO COM ESTADO LOCAL)
function SettingField({
    label,
    description,
    value,
    onChange,
    placeholder,
    secret = false,
    monospace = false,
}: {
    label: string
    description?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    secret?: boolean
    monospace?: boolean
}) {
    const [visible, setVisible] = useState(false)
    const [localValue, setLocalValue] = useState(value)

    // Sincroniza o valor local se o valor externo mudar (ex: reset ou carregamento tardio)
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <Input
                    type={secret && !visible ? "password" : "text"}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => {
                        if (localValue !== value) {
                            onChange(localValue)
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && localValue !== value) {
                            onChange(localValue)
                        }
                    }}
                    placeholder={placeholder}
                    className={monospace ? "font-mono text-sm pr-10" : "text-sm pr-10"}
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

// PAINEL DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE + S3)
export function DatabaseSettings() {
    const { t } = useTranslation()
    const { config, updateConfig, saveConfig, resetConfig, isDirty } = useDatabaseSettings()
    const [isSaving, setIsSaving] = useState(false)
    const [provider, setProvider] = useState<DbProvider>(getActiveDbProvider())
    const [isSettingUp, setIsSettingUp] = useState(false)
    const [showManualSQL, setShowManualSQL] = useState(false)
    const [sqlCopied, setSqlCopied] = useState(false)

    const MANUAL_SQL = `-- Cole este SQL no SQL Editor do seu projeto Supabase:
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);`

    // Migration State
    const [isMigrating, setIsMigrating] = useState(false)
    const [migrationProgress, setMigrationProgress] = useState(0)
    const [migrationStatus, setMigrationStatus] = useState("")

    // Dialog de confirmação de migração
    const [migrationDialog, setMigrationDialog] = useState<{
        isOpen: boolean
        from: DbProvider | null
        to: DbProvider | null
    }>({ isOpen: false, from: null, to: null })

    const isSQLite = provider === "sqlite"

    // ALTERNA O PROVEDOR E PERSISTE A ESCOLHA — REQUER RELOAD PARA EFEITO COMPLETO
    const handleProviderToggle = (checked: boolean) => {
        const next: DbProvider = checked ? "sqlite" : "supabase"
        setProvider(next)
        setActiveDbProvider(next)
        toast.success(
            next === "sqlite"
                ? t("settings.database.migration.toast.sqliteActive", "Modo SQLite Local ativado — recarregue o app para aplicar.")
                : t("settings.database.migration.toast.supabaseActive", "Modo Supabase (PostgreSQL) ativado — recarregue o app para aplicar."),
            { duration: 5000 }
        )
    }

    // SALVA AS CONFIGURAÇÕES DO BANCO DE DADOS E SOLICITA O RECARREGAMENTO DO APP
    const handleSave = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            saveConfig()
            toast.success(t("settings.database.migration.toast.saved", "Configurações salvas! Recarregue o app para aplicar as mudanças."), {
                icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                duration: 5000,
            })
        } catch {
            toast.error(t("settings.database.migration.toast.setupFailed", "Erro ao salvar configurações"))
        } finally {
            setIsSaving(false)
        }
    }

    // TESTA A CONEXÃO COM O SUPABASE E CONFIGURA AS TABELAS INICIAIS AUTOMATICAMENTE CASO NECESSÁRIO
    const handleTestAndSetup = async () => {
        if (!config.supabaseUrl || !config.supabasePublishableKey) {
            toast.error(t("settings.database.migration.toast.fillRequired", "Preencha a URL e a Publishable Key antes de testar."))
            return
        }
        setIsSettingUp(true)
        setShowManualSQL(false)
        try {
            // 1. Testa a conexão
            const conn = await testSupabaseConnection(config.supabaseUrl, config.supabasePublishableKey)
            if (!conn.ok) {
                toast.error(`Falha na conexão: ${conn.error}`)
                return
            }

            // 2. Verifica se as tabelas já existem
            const exists = await checkTablesExist(config.supabaseUrl, config.supabasePublishableKey)
            if (exists) {
                toast.success(t("settings.database.migration.toast.connOk", "Conexão OK! As tabelas já existem e estão prontas."), {
                    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                    duration: 4000,
                })
                return
            }

            // 3. Tenta criar automaticamente com a connection string via Rust/sqlx
            if (config.supabaseConnectionString) {
                const setup = await setupSupabaseTables(config.supabaseConnectionString)
                if (setup.success) {
                    toast.success(t("settings.database.migration.toast.tablesCreated", "Tabelas criadas com sucesso! Banco pronto para uso."), {
                        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                        duration: 5000,
                    })
                    return
                } else {
                    toast.error(`Falha ao configurar banco: ${setup.error}`)
                }
            }

            // 4. Fallback: mostra o SQL para o usuário executar manualmente
            setShowManualSQL(true)
            toast.warning(t("settings.database.migration.toast.tablesNotFound", "Tabelas não encontradas. Cole a Connection String ou execute o SQL abaixo no painel."), {
                duration: 6000,
            })
        } finally {
            setIsSettingUp(false)
        }
    }

    // RESTAURA AS CONFIGURAÇÕES PARA OS VALORES PADRÃO DO AMBIENTE
    const handleReset = () => {
        resetConfig()
        toast.success(t("settings.database.migration.toast.restored", "Configurações restauradas para os valores padrão do ambiente"))
    }

    // ABRE O DIÁLOGO DE CONFIRMAÇÃO PARA INICIAR A MIGRAÇÃO ENTRE BANCOS DE DADOS
    const confirmMigration = (from: DbProvider, to: DbProvider) => {
        setMigrationDialog({ isOpen: true, from, to })
    }

    // EXECUTA O FLUXO DE MIGRAÇÃO DE DADOS EXIBINDO PROGRESSO E ATUALIZANDO O ESTADO DA UI
    const handleMigrate = async () => {
        const { from, to } = migrationDialog
        if (!from || !to) return

        setMigrationDialog({ isOpen: false, from: null, to: null })
        setIsMigrating(true)
        setMigrationProgress(0)
        setMigrationStatus(t("settings.database.migration.toast.starting", "Iniciando..."))

        try {
            await databaseMigrationService.migrate(from, to, (progress, status) => {
                setMigrationProgress(progress)
                setMigrationStatus(status)
            })
            toast.success(t("settings.database.migration.toast.migrated", "Migração concluída! Recarregando para sincronizar os dados..."), {
                duration: 2000,
            })
            setTimeout(() => {
                window.location.reload()
            }, 2000)
        } catch (e: any) {
            toast.error(e.message || t("settings.database.migration.toast.setupFailed", "Ocorreu um erro ao migrar os dados."), {
                duration: 5000,
                action: {
                    label: "X",
                    onClick: () => { }
                }
            })
        } finally {
            setIsMigrating(false)
        }
    }

    return (
        <div className="space-y-6">

            {/* ── Seletor de Provedor ── */}
            <Card className="border-glass-border overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between p-5 gap-4">
                        {/* Lado Supabase */}
                        <div className={`flex items-center gap-3 flex-1 transition-opacity duration-200 ${isSQLite ? "opacity-40" : "opacity-100"}`}>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Cloud className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Supabase</p>
                                <p className="text-xs text-muted-foreground">{t("settings.database.description", "PostgreSQL na nuvem")}</p>
                            </div>
                            {!isSQLite && <Badge className="ml-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">{t("settings.database.active", "Ativo")}</Badge>}
                        </div>

                        {/* Switch central */}
                        <Switch
                            checked={isSQLite}
                            onCheckedChange={handleProviderToggle}
                            className="shrink-0"
                        />

                        {/* Lado SQLite */}
                        <div className={`flex items-center gap-3 flex-1 justify-end transition-opacity duration-200 ${isSQLite ? "opacity-100" : "opacity-40"}`}>
                            {isSQLite && <Badge className="mr-1 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0 text-[10px]">{t("settings.database.active", "Ativo")}</Badge>}
                            <div className="text-right">
                                <p className="font-semibold text-sm">SQLite Local</p>
                                <p className="text-xs text-muted-foreground">{t("settings.database.sqlite.desc", "Dados no dispositivo")}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                <HardDriveDownload className="w-5 h-5 text-violet-500" />
                            </div>
                        </div>
                    </div>

                    {/* Banner informativo contextual */}
                    <div className={`px-5 pb-4 text-xs leading-relaxed flex items-start gap-2 ${isSQLite ? "text-violet-500" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        {isSQLite
                            ? t("settings.database.activeSQLite", "SQLite ativo: os dados ficam 100% locais neste dispositivo, sem necessidade de internet. Ideal para uso privado e offline.")
                            : t("settings.database.activeSupabase", "Supabase ativo: os chats são sincronizados com o PostgreSQL na nuvem. Configure as credenciais abaixo.")}
                    </div>
                </CardContent>
            </Card>

            {/* Aviso de reload */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p className="font-medium text-blue-400">{t("settings.database.dynamicConfig.title", "Configuração Dinâmica")}</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        {t("settings.database.dynamicConfig.desc")}
                    </p>
                </div>
            </div>

            {/* ── Configurações Específicas do Supabase ── */}
            {!isSQLite && (
                <>
                    {/* Supabase */}
                    <Card className="glass border-glass-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Database className="w-4 h-4 text-emerald-500" />
                                </div>
                                {t("settings.database.supabase.title", "Supabase — Banco de Dados")}
                            </CardTitle>
                            <CardDescription className="space-y-2 mt-2">
                                <p>{t("settings.database.supabase.desc", "Para conectar a Elana à nuvem, você precisa de duas coisas:")}</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs">
                                    <li>{t("settings.database.supabase.bullet1")}</li>
                                    <li>{t("settings.database.supabase.bullet2")}</li>
                                </ul>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingField
                                label={t("settings.database.supabase.projectUrl", "Passo 1: URL do Projeto")}
                                description={t("settings.database.supabase.projectUrlDesc", "URL base do seu projeto Supabase. Ex: https://xyzabc.supabase.co")}
                                value={config.supabaseUrl}
                                onChange={(v) => updateConfig({ supabaseUrl: v })}
                                placeholder="https://xxxxxxxxxxxx.supabase.co"
                                monospace
                            />
                            <SettingField
                                label={t("settings.database.supabase.anonKey", "Passo 1: Publishable Key (anon key)")}
                                description={t("settings.database.supabase.anonKeyDesc", "Chave pública de acesso ao Supabase. Encontrada em Project Settings → API.")}
                                value={config.supabasePublishableKey}
                                onChange={(v) => updateConfig({ supabasePublishableKey: v })}
                                placeholder="sb_publishable_..."
                                secret
                                monospace
                            />

                            {/* Connection String + instrução */}
                            <div className="pt-2 border-t border-border/40 space-y-3">
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                    <div className="text-sm space-y-1">
                                        <p className="font-semibold text-blue-400">{t("settings.database.supabase.connStringTitle", "Passo 2: Connection String (Obrigatório apenas na 1ª vez)")}</p>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            {t("settings.database.supabase.connStringDesc")}
                                        </p>
                                    </div>
                                </div>
                                <SettingField
                                    label={t("settings.database.supabase.connStringLabel", "Connection String (URI) para criar tabelas iniciais")}
                                    description={t("settings.database.supabase.connStringSubDesc", "Usada apenas para criar tabelas automaticamente. Ex: postgresql://postgres:[SENHA]...")}
                                    value={config.supabaseConnectionString}
                                    onChange={(v) => updateConfig({ supabaseConnectionString: v })}
                                    placeholder="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres"
                                    secret
                                    monospace
                                />
                            </div>

                            {/* Botão de Testar + Setup automático */}
                            <Button
                                variant="outline"
                                className="gap-2 w-full"
                                onClick={handleTestAndSetup}
                                disabled={isSettingUp}
                            >
                                <Wand2 className="w-4 h-4" />
                                {isSettingUp ? t("settings.database.supabase.testing", "Verificando e configurando...") : t("settings.database.supabase.testAndSetup", "Testar Conexão e Configurar Banco")}
                            </Button>

                            {/* SQL Manual de fallback */}
                            {showManualSQL && (
                                <div className="space-y-2 p-4 rounded-lg bg-black/30 border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-muted-foreground">{t("settings.database.supabase.sqlLabel", "SQL para executar no Supabase → SQL Editor")}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 gap-1 text-xs"
                                            onClick={() => {
                                                navigator.clipboard.writeText(MANUAL_SQL)
                                                setSqlCopied(true)
                                                setTimeout(() => setSqlCopied(false), 2000)
                                            }}
                                        >
                                            {sqlCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {sqlCopied ? t("database.supabase.copied", "Copiado!") : t("database.supabase.copy", "Copiar")}
                                        </Button>
                                    </div>
                                    <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed">{MANUAL_SQL}</pre>
                                    <a
                                        href={`${config.supabaseUrl}/project/_/sql/new`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary underline underline-offset-2"
                                    >
                                        {t("settings.database.supabase.openSqlEditor", "Abrir SQL Editor do Supabase →")}
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* S3 Storage */}
                    <Card className="glass border-glass-border">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                    <HardDrive className="w-4 h-4 text-violet-500" />
                                </div>
                                {t("settings.database.s3.title", "Supabase Storage — S3")}
                            </CardTitle>
                            <CardDescription>
                                {t("settings.database.s3.desc", "Armazenamento de objetos (imagens, arquivos) via protocolo S3 compatível.")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SettingField
                                    label={t("settings.database.s3.accessKeyId", "Access Key ID")}
                                    description={t("settings.database.s3.accessKeyIdDesc", "Chave de acesso S3 gerada no Supabase Storage.")}
                                    value={config.s3AccessKeyId}
                                    onChange={(v) => updateConfig({ s3AccessKeyId: v })}
                                    placeholder="35910573f85542ea..."
                                    secret
                                    monospace
                                />
                                <SettingField
                                    label={t("settings.database.s3.region", "Região")}
                                    description={t("settings.database.s3.regionDesc", "Região do servidor de armazenamento.")}
                                    value={config.s3Region}
                                    onChange={(v) => updateConfig({ s3Region: v })}
                                    placeholder="sa-east-1"
                                    monospace
                                />
                            </div>

                            <SettingField
                                label={t("settings.database.s3.secretAccessKey", "Secret Access Key")}
                                description={t("settings.database.s3.secretAccessKeyDesc", "Chave secreta de acesso S3. Nunca compartilhe esta chave.")}
                                value={config.s3SecretAccessKey}
                                onChange={(v) => updateConfig({ s3SecretAccessKey: v })}
                                placeholder="4abb78a78e7fa6a045bad03caf27ca66..."
                                secret
                                monospace
                            />

                            <SettingField
                                label={t("settings.database.s3.endpoint", "S3 Endpoint")}
                                description={t("settings.database.s3.endpointDesc", "URL do endpoint S3 do Supabase. Encontrada em Storage → S3 Connection.")}
                                value={config.s3Endpoint}
                                onChange={(v) => updateConfig({ s3Endpoint: v })}
                                placeholder="https://xxxxxxxxxxxx.storage.supabase.co/storage/v1/s3"
                                monospace
                            />
                        </CardContent>
                    </Card>

                    {/* Aviso de mudanças pendentes */}
                    {isDirty && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{t("settings.tools.unsavedChanges", "Você tem alterações não salvas.")}</span>
                        </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-3">
                        <Button onClick={handleSave} disabled={isSaving || !isDirty} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isSaving ? t("common.saving", "Salvando...") : t("settings.tools.saveConfig", "Salvar Configurações")}
                        </Button>
                        <Button variant="outline" onClick={handleReset} className="gap-2">
                            <RotateCcw className="w-4 h-4" />
                            {t("settings.tools.restoreDefaults", "Restaurar Padrões")}
                        </Button>
                    </div>
                </>
            )}

            {/* ── Ferramentas de Migração ── */}
            <Card className="glass border-glass-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <HardDrive className="w-4 h-4 text-blue-500" />
                        </div>
                        {t("settings.database.migration.title", "Migração de Dados")}
                    </CardTitle>
                    <CardDescription>
                        {t("settings.database.migration.desc")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="outline"
                            className="justify-start gap-3 h-auto py-3 whitespace-normal hover:bg-muted! focus:text-foreground!"
                            onClick={() => confirmMigration('supabase', 'sqlite')}
                            disabled={isMigrating}
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Database className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-medium text-secondary-foreground">{t("settings.database.migration.exportTitle", "Nuvem ➔ Computador Local (Exportar)")}</div>
                                <div className="text-xs text-muted-foreground font-normal">{t("settings.database.migration.exportDesc", "Traz tudo do Supabase para o seu SQLite local.")}</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start gap-3 h-auto py-3 whitespace-normal hover:bg-muted! focus:text-foreground!"
                            onClick={() => confirmMigration('sqlite', 'supabase')}
                            disabled={isMigrating}
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <HardDrive className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-medium text-secondary-foreground">{t("settings.database.migration.importTitle", "Computador Local ➔ Nuvem (Importar)")}</div>
                                <div className="text-xs text-muted-foreground font-normal">{t("settings.database.migration.importDesc", "Envia as conversas e imagens deste PC para o Supabase.")}</div>
                            </div>
                        </Button>
                    </div>

                    {isMigrating && (
                        <div className="mt-4 p-4 rounded-lg bg-black/20 border border-white/10 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{migrationStatus}</span>
                                <span className="font-mono">{migrationProgress}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${migrationProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Confirmação da Migração */}
            <AlertDialog
                open={migrationDialog.isOpen}
                onOpenChange={(isOpen) => setMigrationDialog(prev => ({ ...prev, isOpen }))}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("settings.database.migration.confirmTitle", "Iniciar Migração de Dados?")}</AlertDialogTitle>
                        <AlertDialogDescription
                            dangerouslySetInnerHTML={{
                                __html: t("settings.database.migration.confirmDesc", "Você está prestes a copiar todos os chats, mensagens e imagens do {{from}} para o {{to}}.<br /><br />Este processo não apagará seus dados originais. O tempo de conclusão dependerá da quantidade de imagens que precisam ser transferidas.", {
                                    from: migrationDialog.from?.toUpperCase(),
                                    to: migrationDialog.to?.toUpperCase()
                                })
                            }}
                        />
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isMigrating}>{t("common.cancel", "Cancelar")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleMigrate}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {t("settings.database.migration.confirmBtn", "Iniciar Migração")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
