import { SystemPromptService } from "./SystemPromptService"
import i18n from "@/i18n"

// PROMPT DO SISTEMA — lê textos dos arquivos de locale em vez de hardcode
export function getSystemPrompt(): string {
    const customPrompt = SystemPromptService.getCustomPrompt()
    const lang = i18n.language || "pt-BR"

    // Lê as chaves do arquivo de locale ativo (fallback para pt-BR)
    const res = (key: string): string => {
        return i18n.t(key, { lng: lang }) as string
    }

    // 1. Prompt base: custom do usuário ou o padrão traduzido
    const basePrompt = customPrompt.trim()
        ? customPrompt
        : res("systemPrompt.llm.defaultBase")

    // 2. Seção do nome do usuário (traduzida)
    const userName = typeof window !== "undefined" ? localStorage.getItem("elana_user_name") : ""
    const nameSection = userName
        ? res("systemPrompt.llm.nameSection").replace("{{userName}}", userName)
        : ""

    // 3. Regras obrigatórias do sistema (traduzidas)
    const systemRules = res("systemPrompt.llm.systemRules")

    return `${basePrompt}${nameSection}${systemRules}`
}


// FORMATA AS MENSAGENS PARA O MODELO, REMOVENDO IMAGENS DO HISTÓRICO PARA ECONOMIZAR TOKENS
export function formatModelMessages(modelMessages: any[], supportsVision: boolean) {
    // Verifica se a última mensagem (a atual do usuário) contém uma imagem
    const lastMessage = modelMessages[modelMessages.length - 1];
    const hasActiveImage = Array.isArray(lastMessage?.content) &&
        lastMessage.content.some((part: any) => part.type === 'image');

    let messagesToProcess = modelMessages;

    // Se a mensagem atual possui imagem e o modelo suporta visão,
    // limitamos o histórico de mensagens para apenas as últimas 4 (A atual + 3 passadas).
    if (hasActiveImage && supportsVision) {
        messagesToProcess = modelMessages.slice(-4);
    }

    return messagesToProcess.map((m, index) => {
        const isLast = index === messagesToProcess.length - 1;
        if (!Array.isArray(m.content)) return m;
        return {
            ...m,
            content: m.content.filter((part: any) => {
                if (part.type !== 'image') return true;
                const img = typeof part.image === 'string' ? part.image : (part.image as URL).href;
                if (img.includes('placehold.co')) return false;
                // Intencional: imagens do histórico são removidas para economizar tokens.
                // Apenas a última mensagem (atual) pode conter imagens enviadas ao modelo.
                return supportsVision && isLast;
            }),
        };
    });
}
