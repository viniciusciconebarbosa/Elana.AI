import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = import.meta.env.VITE_QDRANT_URL || '';
const QDRANT_API_KEY = import.meta.env.VITE_QDRANT_API_KEY || '';

// Singleton do cliente Qdrant
let qdrantClient: QdrantClient | null = null;

// RETORNA O CLIENTE QDRANT (SINGLETON) JA CONFIGURADO COM URL E API KEY
export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
    });
  }
  return qdrantClient;
}

const COLLECTION_NAME = 'memories';

// Dimensões do embedding Mistral (1024)
const VECTOR_SIZE = 1024;

// GARANTE QUE A COLEÇÃO "memories" EXISTE NO QDRANT, CRIANDO SE NECESSÁRIO
export async function ensureCollection(): Promise<void> {
  const client = getQdrantClient();
  
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
  
  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
    console.log(`Collection '${COLLECTION_NAME}' created successfully`);
  }
}

export interface MemoryPayload {
  text: string;
  timestamp: string;
  category: string;
  importance: number;
  entities: string[];
  sentiment?: string;
  source: string;
}

// INSERE OU ATUALIZA UM VETOR DE MEMÓRIA NA COLEÇÃO (UPSERT)
export async function insertMemory(
  id: string,
  vector: number[],
  payload: MemoryPayload
): Promise<void> {
  const client = getQdrantClient();
  
  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id,
        vector,
        payload: payload as unknown as Record<string, unknown>,
      },
    ],
  });
}

export interface SearchResult {
  id: string;
  score: number;
  payload: MemoryPayload;
}

// BUSCA MEMÓRIAS POR SIMILARIDADE DE VETOR, COM FILTROS OPCIONAIS
export async function searchMemories(
  queryVector: number[],
  limit: number = 6,
  minScore: number = 0.5,
  category?: string,
  minImportance?: number
): Promise<SearchResult[]> {
  const client = getQdrantClient();
  
  const filter: Record<string, unknown> = {};
  
  if (category) {
    filter.category = category;
  }
  
  const results = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    limit,
    score_threshold: minScore,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });
  
  return results
    .filter(r => !minImportance || (r.payload as unknown as MemoryPayload).importance >= minImportance)
    .map(r => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload as unknown as MemoryPayload,
    }));
}

// DELETA UMA MEMÓRIA DO QDRANT PELO ID
export async function deleteMemory(id: string): Promise<void> {
  const client = getQdrantClient();
  
  await client.delete(COLLECTION_NAME, {
    wait: true,
    points: [id],
  });
}

// ATUALIZA O PAYLOAD DE UMA MEMÓRIA EXISTENTE
export async function updateMemory(
  id: string,
  payload: Partial<MemoryPayload>
): Promise<void> {
  const client = getQdrantClient();
  
  await client.setPayload(COLLECTION_NAME, {
    wait: true,
    points: [id],
    payload,
  });
}

// RETORNA TODAS AS MEMÓRIAS (SEM VETOR) COM LIMITE CONFIGURADO
export async function getAllMemories(limit: number = 100): Promise<SearchResult[]> {
  const client = getQdrantClient();
  
  const results = await client.scroll(COLLECTION_NAME, {
    limit,
    with_vector: false,
  });
  
  return results.points.map(r => ({
    id: String(r.id),
    score: 1,
    payload: r.payload as unknown as MemoryPayload,
  }));
}