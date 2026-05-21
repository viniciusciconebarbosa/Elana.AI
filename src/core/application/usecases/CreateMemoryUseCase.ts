/**
 * Create Memory Use Case
 * Following Clean Architecture - Application Layer
 */
import { Memory, MemoryCreateInput } from '../../domain/entities/Memory';
import { IMemoryRepository, IEmbeddingService, ITextChunker } from '../../domain/interfaces/IMemoryRepository';

export interface CreateMemoryInput {
  text: string;
  category: MemoryCreateInput['category'];
  importance?: number;
  entities?: string[];
  sentiment?: string;
  source?: MemoryCreateInput['source'];
}

export interface CreateMemoryOutput {
  memories: Memory[];
}

export class CreateMemoryUseCase {
  constructor(
    private memoryRepository: IMemoryRepository,
    private embeddingService: IEmbeddingService,
    private textChunker: ITextChunker
  ) {}

  async execute(input: CreateMemoryInput): Promise<CreateMemoryOutput> {
    // 1. Chunk o texto de entrada
    const chunks = this.textChunker.chunkText(input.text);
    
    // 2. Gerar embeddings para todos os chunks
    const embeddings = await this.embeddingService.generateBatchEmbeddings(chunks);
    
    // 3. Criar memórias no repositório
    const memories: Memory[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const memoryInput: MemoryCreateInput = {
        text: chunks[i],
        category: input.category,
        importance: input.importance || 5,
        entities: input.entities || [],
        sentiment: input.sentiment,
        source: input.source || 'manual',
      };
      
      const memory = await this.memoryRepository.create(memoryInput, embeddings[i]);
      memories.push(memory);
    }
    
    return { memories };
  }
}