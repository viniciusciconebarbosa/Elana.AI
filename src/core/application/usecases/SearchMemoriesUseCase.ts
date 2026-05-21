/**
 * Search Memories Use Case
 * Following Clean Architecture - Application Layer
 */
import { MemorySearchParams, MemorySearchResult } from '../../domain/entities/Memory';
import { IMemoryRepository, IEmbeddingService } from '../../domain/interfaces/IMemoryRepository';

export interface SearchMemoriesInput {
  query: string;
  category?: MemorySearchParams['category'];
  minImportance?: number;
  limit?: number;
}

export interface SearchMemoriesOutput {
  results: MemorySearchResult[];
}

// BUSCA MEMÓRIAS SEMÂNTICAS BASEADAS EM UMA QUERY
export class SearchMemoriesUseCase {
  constructor(
    private memoryRepository: IMemoryRepository,
    private embeddingService: IEmbeddingService
  ) {}

  async execute(input: SearchMemoriesInput): Promise<SearchMemoriesOutput> {
    // 1. Gerar embedding da query
    const queryVector = await this.embeddingService.generateEmbedding(input.query);
    
    // 2. Buscar no repositório
    const results = await this.memoryRepository.search(
      {
        query: input.query,
        category: input.category,
        minImportance: input.minImportance,
        limit: input.limit || 6,
      },
      queryVector
    );
    
    return { results };
  }
}