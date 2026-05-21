import { LanguageModel } from 'ai';
import { ModelConfig } from '@/interface/context/ModelContext';

export type ProviderConfig = Pick<ModelConfig, 'model' | 'route' | 'baseUrl'>;

// INTERFACE PARA DEFINIR AS OPERAÇÕES QUE UM PROVEDOR DE IA DEVE IMPLEMENTAR
export interface AIProvider {
  // CRIA O MODELO DE LINGUAGEM COM CONFIGURAÇÃO E API KEY
  createModel(config: ProviderConfig, apiKey: string): LanguageModel;
  // VERIFICA SE O MODELO SUPORTA ENTRADAS VISUAIS (IMAGENS)
  supportsVision(modelName: string): boolean;
}
