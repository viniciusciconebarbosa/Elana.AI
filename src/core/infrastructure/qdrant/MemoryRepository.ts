/**
 * Memory Repository - Implementação usando Qdrant
 * Following Clean Architecture - Infrastructure Layer
 */
import { QdrantClient } from '@qdrant/js-client-rest';
// Using Web Crypto API (browser-compatible)
import {
  Memory,
  MemoryCreateInput,
  MemorySearchParams,
  MemorySearchResult,
  MemoryCategory,
  MemorySource,
} from '../../domain/entities/Memory';
import { IMemoryRepository, IEmbeddingService } from '../../domain/interfaces/IMemoryRepository';

const COLLECTION_NAME = 'memories';
const VECTOR_SIZE = 1024;

interface QdrantMemoryPayload {
  text: string;
  timestamp: string;
  category: string;
  importance: number;
  entities: string[];
  sentiment?: string;
  source: string;
}

// REPOSITÓRIO DE MEMÓRIAS USANDO QDRANT COMO BANCO DE VETORES
export class QdrantMemoryRepository implements IMemoryRepository {
  private client: QdrantClient;

  constructor(client?: QdrantClient) {
    this.client = client || new QdrantClient({
      url: import.meta.env.VITE_QDRANT_URL || '',
      apiKey: import.meta.env.VITE_QDRANT_API_KEY || '',
    });
  }

  // GARANTE QUE A COLEÇÃO EXISTE NO QDRANT ANTES DE QUALQUER OPERAÇÃO
  private async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await this.client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
    }
  }

  // INSERE UMA NOVA MEMÓRIA COM VETOR NO QDRANT
  async create(input: MemoryCreateInput, vector: number[]): Promise<Memory> {
    await this.ensureCollection();

    const id = crypto.randomUUID();
    const now = new Date();

    const payload: QdrantMemoryPayload = {
      text: input.text,
      timestamp: now.toISOString(),
      category: input.category,
      importance: input.importance,
      entities: input.entities,
      sentiment: input.sentiment,
      source: input.source,
    };

    await this.client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [{
        id,
        vector,
        payload: payload as unknown as Record<string, unknown>,
      }],
    });

    return {
      id,
      text: input.text,
      timestamp: now,
      category: input.category,
      importance: input.importance,
      entities: input.entities,
      sentiment: input.sentiment,
      source: input.source,
    };
  }

  // BUSCA MEMÓRIAS POR SIMILARIDADE DE VETOR, FILTRADAS POR CATEGORIA E IMPORTÂNCIA
  async search(
    params: MemorySearchParams,
    queryVector: number[]
  ): Promise<MemorySearchResult[]> {
    await this.ensureCollection();

    const filter: Record<string, unknown> = {};
    if (params.category) {
      filter.category = params.category;
    }

    const results = await this.client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: params.limit || 6,
      score_threshold: 0.5,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    return results
      .filter(r => {
        const payload = r.payload as unknown as QdrantMemoryPayload;
        return !params.minImportance || payload.importance >= params.minImportance;
      })
      .map(r => {
        const payload = r.payload as unknown as QdrantMemoryPayload;
        return {
          id: String(r.id),
          text: payload.text,
          score: r.score,
          category: payload.category as MemoryCategory,
          timestamp: new Date(payload.timestamp),
          importance: payload.importance,
          entities: payload.entities,
        };
      });
  }

  // BUSCA UMA MEMÓRIA PELO ID
  async findById(id: string): Promise<Memory | null> {
    const results = await this.client.scroll(COLLECTION_NAME, {
      filter: { must: [{ key: 'id', match: { value: id } }] },
      limit: 1,
      with_vector: false,
    });

    if (results.points.length === 0) return null;

    const payload = results.points[0].payload as unknown as QdrantMemoryPayload;
    return {
      id: String(results.points[0].id),
      text: payload.text,
      timestamp: new Date(payload.timestamp),
      category: payload.category as MemoryCategory,
      importance: payload.importance,
      entities: payload.entities,
      sentiment: payload.sentiment,
      source: payload.source as MemorySource,
    };
  }

  // ATUALIZA O PAYLOAD DE UMA MEMÓRIA EXISTENTE
  async update(id: string, input: Partial<MemoryCreateInput>): Promise<Memory> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Memory with id ${id} not found`);
    }

    const updatedPayload = {
      ...(input.text && { text: input.text }),
      ...(input.category && { category: input.category }),
      ...(input.importance && { importance: input.importance }),
      ...(input.entities && { entities: input.entities }),
      ...(input.sentiment && { sentiment: input.sentiment }),
      ...(input.source && { source: input.source }),
    };

    await this.client.setPayload(COLLECTION_NAME, {
      wait: true,
      points: [id],
      payload: updatedPayload as unknown as Record<string, unknown>,
    });

    return { ...existing, ...updatedPayload };
  }

  // DELETA UMA MEMÓRIA PELO ID
  async delete(id: string): Promise<void> {
    await this.client.delete(COLLECTION_NAME, {
      wait: true,
      points: [id],
    });
  }

  // RETORNA TODAS AS MEMÓRIAS (SEM VETOR) COM LIMITE CONFIGURADO
  async findAll(limit: number = 100): Promise<Memory[]> {
    const results = await this.client.scroll(COLLECTION_NAME, {
      limit,
      with_vector: false,
    });

    return results.points.map(r => {
      const payload = r.payload as unknown as QdrantMemoryPayload;
      return {
        id: String(r.id),
        text: payload.text,
        timestamp: new Date(payload.timestamp),
        category: payload.category as MemoryCategory,
        importance: payload.importance,
        entities: payload.entities,
        sentiment: payload.sentiment,
        source: payload.source as MemorySource,
      };
    });
  }
}