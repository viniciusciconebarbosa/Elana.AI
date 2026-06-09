import { createOpenAI } from '@ai-sdk/openai';
import { AIProvider, ProviderConfig } from '../AIProvider';
import { LanguageModel } from 'ai';

// PROVEDOR OPENAI COMPATÍVEL — INSTANCIA MODELOS OPENAI OU COMPATÍVEIS (PROXY, GROQ, ETC.)
export class OpenAIProvider implements AIProvider {
    // CRIA O MODELO OPENAI, OPCIONALMENTE APONTANDO PARA UM BASE_URL CUSTOMIZADO
    createModel(config: ProviderConfig, apiKey: string): LanguageModel {
        const openai = createOpenAI({
            ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
            apiKey,
        });

        return openai.chat(config.model);
    }

    // VERIFICA SE O MODELO SUPORTA VISÃO BASEADO EM PALAVRAS-CHAVE NO NOME
    supportsVision(modelName: string): boolean {
        const visionKeywords = [
            'vision', 'gpt-4o', 'claude-3', 'multimodal', 'grok', 'glm',
            'pixtral', 'llama-3.2', 'kimi', 'qwen', 'deepseek', 'llama', 'gpt', 'deep', 'minimax', 'mini'
        ];
        return visionKeywords.some((k) => modelName.toLowerCase().includes(k));
    }
}
