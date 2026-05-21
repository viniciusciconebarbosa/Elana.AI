import type { IChatRepository } from '@/core/domain/interfaces/IChatRepository'
import { ChatRepository } from './ChatRepository'
import { SQLiteChatRepository } from './SQLiteChatRepository'

// CHAVE DE PERSISTÊNCIA DO PROVEDOR NO LOCALSTORAGE
export const DB_PROVIDER_KEY = 'elana:db-provider'
export type DbProvider = 'supabase' | 'sqlite'

// LÊ O PROVEDOR ATIVO — SQLITE É O PADRÃO
// Lê o provedor ativo do localStorage (Supabase ou SQLite). Retorna 'sqlite' como padrão.
export function getActiveDbProvider(): DbProvider {
    try {
        const saved = localStorage.getItem(DB_PROVIDER_KEY)
        if (saved === 'sqlite' || saved === 'supabase') return saved
    } catch { /* ignora */ }
    return 'sqlite'
}

// Salva e persiste imediatamente a escolha do usuário sobre qual banco de dados usar.
export function setActiveDbProvider(provider: DbProvider) {
    localStorage.setItem(DB_PROVIDER_KEY, provider)
}

// Fábrica que decide em tempo real qual motor de banco instanciar (isolando a UI do backend).
export function getChatRepository(): IChatRepository {
    if (getActiveDbProvider() === 'sqlite') {
        return new SQLiteChatRepository()
    }
    return new ChatRepository()
}
