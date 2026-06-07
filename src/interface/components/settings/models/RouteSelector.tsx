import { useTranslation } from "react-i18next"
import { Label } from "@/interface/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/interface/components/ui/select"
import { useModelSettingsForm } from "./ContextSettings"

// SELECTOR DE ROTA — LISTA AS ROTAS/PROVEDORES CONFIGURADOS E PERMITE ESCOLHER UM
export function RouteSelector() {
    const { draft, routes, handleRouteChange } = useModelSettingsForm()
    const { t } = useTranslation()

    if (!draft) return null

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="route-select">
                    {t("settings.models.apiRoute", "Rota da API")}{" "}
                    {routes.length === 0 && (
                        <span className="font-normal text-muted-foreground ml-1">
                            {t("settings.models.noRoutes", "Nenhuma rota configurada")}
                        </span>
                    )}
                </Label>
                {!draft.route && (
                    <span className="text-[10px] font-medium text-primary/60 uppercase tracking-wider">
                        {t("settings.models.default", "Default")}
                    </span>
                )}
            </div>
            <Select
                value={draft.route || undefined}
                onValueChange={handleRouteChange}
                disabled={routes.length === 0}
            >
                <SelectTrigger id="route-select" className="w-full bg-background/40">
                    <SelectValue
                        placeholder={
                            routes.length === 0
                                ? t("settings.models.configureKeyFirst", "Configure uma Chave primeiro")
                                : t("settings.models.defaultPattern", "Padrão (Default)")
                        }
                    />
                </SelectTrigger>
                <SelectContent>
                    {routes.length > 0 ? (
                        routes.map((route) => (
                            <SelectItem key={route.route} value={route.route} className="focus:bg-muted! focus:text-foreground!">
                                {route.routeName}
                                <span className="text-xs font-normal tracking-wider">{route.baseUrl}</span>
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="default" disabled>
                            {t("settings.models.noRouteDefault", "Nenhuma rota (Default)")}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    )
}
