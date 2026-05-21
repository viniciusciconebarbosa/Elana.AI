/**
 * Text Chunker - Implementação de chunking de texto
 * Following Clean Architecture - Infrastructure Layer
 * 
 * Usa RecursiveCharacterTextSplitter com 1000 tokens e 20% overlap
 */
import { ITextChunker } from '../../domain/interfaces/IMemoryRepository';

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

export class RecursiveCharacterTextSplitter implements ITextChunker {
  private chunkSize: number;
  private overlap: number;
  private separators: string[];

  constructor(
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_OVERLAP,
    separators: string[] = ['\n\n', '\n', '. ', ' ', '']
  ) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
    this.separators = separators;
  }

  // DIVIDE O TEXTO EM CHUNKS RESPEITANDO SEPARADORES NATURAIS (PARÁGRAFOS, LINHAS, FRASES)
  chunkText(text: string, chunkSize?: number, overlap?: number): string[] {
    const size = chunkSize || this.chunkSize;
    const overlapSize = overlap || this.overlap;
    
    if (text.length <= size) {
      return [text];
    }

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      // Encontrar o melhor ponto de quebra
      let endIndex = startIndex + size;
      
      if (endIndex >= text.length) {
        // Se estamos no final, pegar tudo até o fim
        chunks.push(text.slice(startIndex));
        break;
      }

      // Procurar pelo melhor separador antes do limite
      let bestSeparatorIndex = -1;
      for (const separator of this.separators) {
        if (separator === '') continue;
        
        const lastSeparatorIndex = text.lastIndexOf(separator, endIndex);
        if (lastSeparatorIndex > startIndex) {
          bestSeparatorIndex = lastSeparatorIndex + separator.length;
          break;
        }
      }

      if (bestSeparatorIndex > startIndex) {
        endIndex = bestSeparatorIndex;
      } else {
        // Se não encontrou separador, quebrar no limite
        endIndex = startIndex + size;
      }

      // Adicionar chunk com o texto encontrado
      const chunk = text.slice(startIndex, endIndex).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      // Mover para o próximo chunk com overlap
      startIndex = endIndex - overlapSize;
      
      // Garantir que não entramos em loop infinito
      if (startIndex <= 0 || startIndex >= text.length) {
        if (chunks.length > 0 && chunks[chunks.length - 1] !== text) {
          const remaining = text.slice(chunks.reduce((acc, c) => acc + c.length, 0));
          if (remaining) {
            chunks.push(remaining);
          }
        }
        break;
      }
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Estima o número de tokens em um texto
   * Aproximação: 1 token ≈ 4 caracteres em média
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Divide texto em chunks baseado em tokens estimados
   */
  chunkByTokens(text: string, maxTokens?: number): string[] {
    const tokensPerChunk = maxTokens || this.chunkSize;
    const charsPerToken = 4;
    const charsPerChunk = tokensPerChunk * charsPerToken;
    
    return this.chunkText(text, charsPerChunk, Math.floor(charsPerChunk * 0.2));
  }
}

// Singleton instance
let textChunkerInstance: RecursiveCharacterTextSplitter | null = null;

// SINGLETON — RETORNA UMA ÚINICA INSTÂNCIA DO CHUNKER PARA REUTILIZAÇÃO
export function getTextChunker(): RecursiveCharacterTextSplitter {
  if (!textChunkerInstance) {
    textChunkerInstance = new RecursiveCharacterTextSplitter();
  }
  return textChunkerInstance;
}