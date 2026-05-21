import { ModelConfig } from '@/interface/context/ModelContext';
import { decrypt } from '@/core/lib/encryption';


export interface ResolvedModel {
    config: ModelConfig;
    isGeminiModel: boolean;
    apiKey: string;
}

// RESOLVE A CONFIGURAÇÃO FINAL DO MODELO, USANDO O CONFIG DO CLIENTE OU VALORES DO .ENV COMO FALLBACK
export async function resolveModelConfig(clientConfig?: ModelConfig) {
    const fallback: ModelConfig = {
        route: '',
        routeName: 'Default',
        baseUrl: import.meta.env.VITE_OPENAI_COMPATIBLE_HOST || '',
        model: import.meta.env.VITE_OPENAI_COMPATIBLE_MODEL || '',
        modelName: 'Default',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
    };

    const finalConfig = clientConfig ? { ...fallback, ...clientConfig } : fallback;
    const isGeminiModel = finalConfig.route === 'google' || finalConfig.model.toLowerCase().includes('gemini');

    return { ...finalConfig, isGeminiModel };
}

// DESCRIPTOGRAFA E RETORNA A CHAVE DE API CORRETA COM BASE NO TIPO DE PROVEDOR (GEMINI OU OPENAI)
export async function resolveApiKey(isGeminiModel: boolean, apiKeys?: { gemini?: string; openai?: string }) {
    if (isGeminiModel) {
        if (apiKeys?.gemini) {
            try {
                return await decrypt(apiKeys.gemini);
            } catch (e) {
                console.error('Erro ao descriptografar chave Gemini:', e);
            }
        }
        return import.meta.env.VITE_GEMINI_KEY || "";
    }

    if (apiKeys?.openai) {
        try {
            return await decrypt(apiKeys.openai);
        } catch (e) {
            console.error('Erro ao descriptografar chave OpenAI:', e);
        }
    }

    return import.meta.env.VITE_OPENAI_COMPATIBLE_KEY || ""
}
