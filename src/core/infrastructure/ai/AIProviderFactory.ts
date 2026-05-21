import { AIProvider, ProviderConfig } from './AIProvider';
import { GoogleProvider } from './providers/GoogleProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';

// FÁBRICA DE PROVEDORES DE IA — RETORNA GOOGLE OU OPENAI COM BASE NA CONFIGURAÇÃO DO MODELO
export class AIProviderFactory {
  private static googleProvider = new GoogleProvider();
  private static openAIProvider = new OpenAIProvider();

  // RETORNA O PROVEDOR CORRETO BASEADO NA ROTA OU NOME DO MODELO
  static getProvider(config: ProviderConfig): AIProvider {
    const isGemini = 
      config.route === 'google' || 
      config.model.toLowerCase().includes('gemini');

    if (isGemini) {
      return this.googleProvider;
    }

    return this.openAIProvider;
  }
}
