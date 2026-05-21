import { Label } from "@/interface/components/ui/label"
import { Slider } from "@/interface/components/ui/slider"
import { Input } from "@/interface/components/ui/input"
import { Button } from "@/interface/components/ui/button"
import { Settings2 } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/interface/components/ui/accordion"
import { useModelSettingsForm } from "./ContextSettings"

// PARÂMETROS DE GERAÇÃO — CONTROLES DE TOKENS, TEMPERATURA, TOP-P, PRESENCE E FREQUENCY PENALTY
export function GenerationParameters() {
    const { draft, updateDraftParam, handleResetAdvanced } = useModelSettingsForm()

    if (!draft) return null

    return (
        <>
            {/* Controle de Tamanho de Resposta (Tokens) */}
            <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="tokens-slider" className="text-sm font-medium">Limite de Resposta</Label>
                        <p className="text-[11px] text-muted-foreground">Máximo de tokens por mensagem</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={draft.maxTokens}
                            onChange={(e) => updateDraftParam('maxTokens', Number(e.target.value))}
                            className="w-20 h-8 text-right text-xs bg-background/50 border-none focus-visible:ring-1"
                        />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">tokens</span>
                    </div>
                </div>
                <Slider
                    id="tokens-slider"
                    min={128}
                    max={8192}
                    step={128}
                    value={[draft.maxTokens || 4096]}
                    onValueChange={(val) => updateDraftParam('maxTokens', val[0])}
                    className="py-2"
                />
            </div>

            {/* Configurações Avançadas */}
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced" className="border-none">
                    <AccordionTrigger className="py-2 px-4 rounded-lg hover:bg-secondary/30 transition-all hover:no-underline text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Ajustes Avançados
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2 space-y-6 px-4">
                        <div className="flex justify-end">
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-[11px] text-muted-foreground hover:text-primary"
                                onClick={handleResetAdvanced}
                            >
                                Restaurar padrões
                            </Button>
                        </div>

                        {/* Temperature */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Temperatura ({draft.temperature?.toFixed(2) || '0.70'})</Label>
                                <span className="text-[10px] text-muted-foreground">Criatividade vs Precisão</span>
                            </div>
                            <Slider
                                min={0}
                                max={2}
                                step={0.05}
                                value={[draft.temperature ?? 0.7]}
                                onValueChange={(val) => updateDraftParam('temperature', val[0])}
                            />
                        </div>

                        {/* Top P */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Top P ({draft.topP?.toFixed(2) || '1.00'})</Label>
                                <span className="text-[10px] text-muted-foreground">Diversidade de vocabulário</span>
                            </div>
                            <Slider
                                min={0}
                                max={1}
                                step={0.05}
                                value={[draft.topP ?? 1]}
                                onValueChange={(val) => updateDraftParam('topP', val[0])}
                            />
                        </div>

                        {/* Presence Penalty */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Presence Penalty ({draft.presencePenalty?.toFixed(2) || '0.00'})</Label>
                                <span className="text-[10px] text-muted-foreground">Assuntos novos</span>
                            </div>
                            <Slider
                                min={-2}
                                max={2}
                                step={0.1}
                                value={[draft.presencePenalty ?? 0]}
                                onValueChange={(val) => updateDraftParam('presencePenalty', val[0])}
                            />
                        </div>

                        {/* Frequency Penalty */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Frequency Penalty ({draft.frequencyPenalty?.toFixed(2) || '0.00'})</Label>
                                <span className="text-[10px] text-muted-foreground">Evitar repetição</span>
                            </div>
                            <Slider
                                min={-2}
                                max={2}
                                step={0.1}
                                value={[draft.frequencyPenalty ?? 0]}
                                onValueChange={(val) => updateDraftParam('frequencyPenalty', val[0])}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </>
    )
}
