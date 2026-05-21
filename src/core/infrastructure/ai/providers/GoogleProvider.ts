import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIProvider, ProviderConfig } from '../AIProvider';
import { LanguageModel } from 'ai';

// PROVEDOR GOOGLE — INSTANCIA MODELOS GEMINI VIA AI SDK
export class GoogleProvider implements AIProvider {
  // CRIA O MODELO GEMINI COM A CHAVE DE API FORNECIDA
  createModel(config: ProviderConfig, apiKey: string): LanguageModel {
    const google = createGoogleGenerativeAI({
      apiKey,
    });

    return google(config.model);
  }

  // TODOS OS MODELOS GEMINI MODERNOS SUPORTAM IMAGENS
  supportsVision(_modelName: string): boolean {
    // A maioria dos modelos Gemini modernos suporta visão
    return true;
  }
}
