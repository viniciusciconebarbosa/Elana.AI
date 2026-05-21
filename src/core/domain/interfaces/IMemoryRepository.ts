/**
 * Interface para repositório de memórias
 * Following Clean Architecture - Domain Layer (Interface Adapters)
 */
import { 
  Memory, 
  MemoryCreateInput, 
  MemorySearchParams, 
  MemorySearchResult 
} from '../entities/Memory';

export interface IMemoryRepository {
  create(input: MemoryCreateInput, vector: number[]): Promise<Memory>;
  search(params: MemorySearchParams, queryVector: number[]): Promise<MemorySearchResult[]>;
  findById(id: string): Promise<Memory | null>;
  update(id: string, input: Partial<MemoryCreateInput>): Promise<Memory>;
  delete(id: string): Promise<void>;
  findAll(limit?: number): Promise<Memory[]>;
}

export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface ITextChunker {
  chunkText(text: string, chunkSize?: number, overlap?: number): string[];
}