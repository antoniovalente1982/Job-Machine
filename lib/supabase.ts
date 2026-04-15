import { createClient } from '@supabase/supabase-js';

// Queste variabili dovranno essere configurate nel file .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Assicurati di impostare le variabili d\'ambiente in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
