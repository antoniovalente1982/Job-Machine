import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client generico (usato dalle Server Actions e dai Server Components)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client con sessione utente (usato dal browser per operazioni autenticate)
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
