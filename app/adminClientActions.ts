'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function updateClientPortalData(clientId: string, password?: string, market?: string, context?: string) {
  const sb = getClient();
  const updates: any = {};
  if (password !== undefined) updates.client_password = password;
  if (market !== undefined) updates.market_sector = market;
  if (context !== undefined) updates.company_context = context;

  const { error } = await sb
    .from('clients')
    .update(updates)
    .eq('id', clientId);
  
  if (error) console.error('Error updating client portal data:', error);
}

export async function updateStructureData(structureId: string, context?: string) {
  const sb = getClient();
  const { error } = await sb
    .from('structures')
    .update({ structure_context: context })
    .eq('id', structureId);
    
  if (error) console.error('Error updating structure data:', error);
}

export async function updateStructurePassword(structureId: string, password?: string) {
  const sb = getClient();
  // Se la colonna `structure_password` non esiste ancora, provocherà un errore.
  // Assicurarsi di aver lanciato la migrazione prima.
  const { error } = await sb
    .from('structures')
    .update({ structure_password: password || null })
    .eq('id', structureId);
    
  if (error) {
    console.error('Error updating structure password:', error);
    return { error: error.message };
  }
  return { success: true };
}
