import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Supabase Admin client — uses the service_role key.
 * ONLY use server-side for privileged operations like auth.admin.createUser().
 * Falls back to anon key with a warning if service_role is missing.
 */
export function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    console.error(
      '[SUPABASE ADMIN] ⚠️  SUPABASE_SERVICE_ROLE_KEY mancante! ' +
      'Le operazioni admin (createUser, etc.) falliranno. ' +
      'Aggiungila al file .env.local'
    );
    // Fallback to anon key — admin operations will fail gracefully
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
