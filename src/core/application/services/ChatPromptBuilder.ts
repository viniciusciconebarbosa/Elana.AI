import { SystemPromptService } from "./SystemPromptService"

// PROMPT DO SISTEMA — PERSONALIDADE E REGRAS DE COMPORTAMENTO DO ELANA
export function getSystemPrompt(): string {
    const customPrompt = SystemPromptService.getCustomPrompt()
    
    // 1. Se o usuário tem prompt personalizado, usamos ele como base da personalidade.
    // Se não, usamos a personalidade padrão da Elana.
    const basePrompt = customPrompt.trim() 
        ? customPrompt 
        : `Você é a Elana, uma assistente pessoal inteligente, direta e levemente sarcástica e extremamente útil.`

    // 2. Seção dinâmica do nome do usuário
    const userName = typeof window !== 'undefined' ? localStorage.getItem("elana_user_name") : ""
    const nameSection = userName
        ? `\n\n[INFORMAÇÃO: O nome do usuário que está interagindo com você é "${userName}". Use este nome para se referir a ele de forma personalizada e natural quando apropriado.]`
        : ""

    // 3. Regras técnicas obrigatórias do sistema (Segurança de ferramentas de busca)
    const systemRules = `
\n[REGRAS OBRIGATÓRIAS DO SISTEMA]:
- REGRA DE FERRAMENTAS: Você NUNCA deve usar ferramentas de busca (web_search, research, crawl, read_webpage) de forma 
automática. Se você identificar que uma busca na internet ajudaria a responder melhor, você deve primeiro explicar o 
motivo e perguntar ao usuário: 'Gostaria que eu pesquisasse isso na web?'. Apenas execute a ferramenta se o usuário 
confirmar na próxima mensagem.
- Instrução de Conteúdo: Ao receber resultados, resuma de forma natural.`

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
