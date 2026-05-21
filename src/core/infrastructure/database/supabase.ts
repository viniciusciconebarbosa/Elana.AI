import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getActiveDatabaseConfig } from '@/interface/context/DatabaseSettingsContext';

// CLIENTE SUPABASE — LÊ CONFIGURAÇÃO DO LOCALSTORAGE (COM FALLBACK PARA .ENV)
// Criação lazy: o cliente só é instanciado quando realmente necessário,
// evitando falhas de inicialização quando as credenciais ainda não foram configuradas.
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  const cfg = getActiveDatabaseConfig();
  const url = cfg.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const key = cfg.supabasePublishableKey || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || '';

  if (!url || !key) return null;

  if (!_supabase) {
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase: credenciais não configuradas. Configure nas Configurações do app.');
      return () => ({ data: null, error: new Error('Supabase não configurado') });
    }
    return (client as any)[prop];
  },
});

