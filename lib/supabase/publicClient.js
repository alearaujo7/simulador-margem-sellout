import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cliente simples para leitura pública (sem login), usado só na página
// de compartilhamento /s/[token]. Não lida com sessão/cookies.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
