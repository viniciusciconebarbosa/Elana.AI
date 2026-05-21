import { createClient } from '@supabase/supabase-js'
import { invoke } from '@tauri-apps/api/core'

export type SetupResult =
  | { success: true; created: boolean }
  | { success: false; error: string }

// Verifica se as tabelas já existem usando a anon key
export async function checkTablesExist(url: string, anonKey: string): Promise<boolean> {
  try {
    const client = createClient(url, anonKey)
    const { error } = await client.from('chats').select('id').limit(1)
    // Erro 42P01 = tabela não existe
    if (error?.code === '42P01') return false
    return true
  } catch {
    return false
  }
}

// Cria as tabelas chamando o backend Rust com sqlx
export async function setupSupabaseTables(
  connectionString: string
): Promise<SetupResult> {
  try {
    await invoke('setup_supabase_tables', { connectionString })
    return { success: true, created: true }
  } catch (err: any) {
    return { success: false, error: err?.toString() || 'Erro desconhecido' }
  }
}

// Verifica a conectividade básica com o Supabase (URL + anon key)
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!url || !anonKey) return { ok: false, error: 'URL ou chave não informada.' }
    const client = createClient(url, anonKey)
    const { error } = await client.from('chats').select('id').limit(1)
    if (error && error.code !== '42P01') {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha na conexão' }
  }
}
