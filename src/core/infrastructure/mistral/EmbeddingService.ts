/**
 * Embedding Service - Implementação usando Mistral AI
 * Following Clean Architecture - Infrastructure Layer
 */
import { IEmbeddingService } from '../../domain/interfaces/IMemoryRepository';

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';
const MISTRAL_EMBEDDING_URL = 'https://api.mistral.ai/v1/embeddings';

interface MistralEmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class MistralEmbeddingService implements IEmbeddingService {
  private apiKey: string;
  private cache: Map<string, number[]>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || MISTRAL_API_KEY;
    this.cache = new Map();
  }

  // GERA O EMBEDDING DE UM TEXTO USANDO O MISTRAL, COM CACHE INTERNO
  async generateEmbedding(text: string): Promise<number[]> {
    // Verificar cache
    const cacheKey = this.getCacheKey(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(MISTRAL_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const data: MistralEmbeddingResponse = await response.json();
    const embedding = data.data[0]?.embedding;

    if (!embedding) {
      throw new Error('No embedding returned from Mistral API');
    }

    // Armazenar em cache
    this.cache.set(cacheKey, embedding);

    return embedding;
  }

  // GERA EMBEDDINGS EM LOTE, APROVEITANDO O CACHE PARA OS JÁ PROCESSADOS
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // Verificar cache para cada texto
    const uncachedTexts: string[] = [];
    const results: (number[] | null)[] = [];

    for (const text of texts) {
      const cacheKey = this.getCacheKey(text);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        results.push(cached);
      } else {
        results.push(null);
        uncachedTexts.push(text);
      }
    }

    // Se todos estão em cache, retornar
    if (uncachedTexts.length === 0) {
      return results as number[][];
    }

    const response = await fetch(MISTRAL_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: uncachedTexts,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const data: MistralEmbeddingResponse = await response.json();

    // Mapear resultados de volta para a ordem original
    let dataIndex = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i] === null) {
        const embedding = data.data[dataIndex]?.embedding;
        if (embedding) {
          const cacheKey = this.getCacheKey(uncachedTexts[dataIndex]);
          this.cache.set(cacheKey, embedding);
          results[i] = embedding;
        }
        dataIndex++;
      }
    }

    return results as number[][];
  }

  // GERA UMA CHAVE DE CACHE BASEADA NO CONTEÚDO E TAMANHO DO TEXTO
  private getCacheKey(text: string): string {
    // Criar hash simples para cache
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${hash}_len_${text.length}`;
  }

  // LIMPA O CACHE DE EMBEDDINGS
  clearCache(): void {
    this.cache.clear();
  }
}