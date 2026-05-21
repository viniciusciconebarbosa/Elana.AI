/**
 * Memory Entity - Representa uma memória do usuário no sistema
 * Following Clean Architecture - Domain Layer - NAO SEI OQUE ISSO QUER DIZER, MAS OCODIGO ESTA AQUI!
 */
export interface Memory {
  id: string;
  text: string;
  timestamp: Date;
  category: MemoryCategory;
  importance: number; // 1-10
  entities: string[];
  sentiment?: string;
  source: MemorySource;
}

export type MemoryCategory = 
  | 'Work' 
  | 'Health' 
  | 'Relationships' 
  | 'Goals' 
  | 'Finance' 
  | 'Events' 
  | 'Travel'
  | 'Personal';

export type MemorySource = 'manual' | 'auto-extracted' | 'file-upload';

export interface MemoryCreateInput {
  text: string;
  category: MemoryCategory;
  importance: number;
  entities: string[];
  sentiment?: string;
  source: MemorySource;
}

export interface MemorySearchParams {
  query: string;
  category?: MemoryCategory;
  minImportance?: number;
  limit?: number;
}

export interface MemorySearchResult {
  id: string;
  text: string;
  score: number;
  category: MemoryCategory;
  timestamp: Date;
  importance: number;
  entities: string[];
}