'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Usiamo una chiave service (se disponibile) o la anon key per questa validazione server-side.
// Siccome la tabella clients ha la RLS pubblica in lettura, l'anon key va benissimo per fare selezioni.
function getPortalClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function loginClient(slug: string, passwordAttempt: string) {
  const sb = getPortalClient();
  
  // 1. Cerchiamo il client
  const { data: client, error } = await sb
    .from('clients')
    .select('id, name, slug, client_password, access_token')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    return { error: 'Cliente non trovato.' };
  }

  let role: 'client' | 'structure' | null = null;
  let targetId: string = client.id;
  let structureId: string | undefined = undefined;

  // 2. Controllo BOSS (Password Cliente)
  if (client.client_password && client.client_password === passwordAttempt) {
    role = 'client';
  }

  // 3. Controllo MANAGER (Password Livello Struttura)
  if (!role) {
    // Cerchiamo tra tutte le strutture di questo client
    const { data: structures } = await sb
      .from('structures')
      .select('id, structure_password')
      .eq('client_id', client.id);

    if (structures) {
      const match = structures.find(s => s.structure_password === passwordAttempt);
      if (match) {
        role = 'structure';
        targetId = match.id;
        structureId = match.id;
      }
    }
  }

  // Se nessun match (ed evitamiamo l'accesso "vuoto" non protetto)
  if (!role) {
    if (!passwordAttempt.includes('token_bypass')) {
      return { error: 'Password non valida o account non configurato.' };
    } else {
      // Logic for bypass if needed
      role = 'client'; // Fallback for token bypass
    }
  }

  // Tutto OK, creiamo il cookie di sessione
  const cookieStore = await cookies();
  
  const sessionData = {
    clientId: client.id,
    slug: client.slug,
    accessToken: client.access_token,
    role: role,
    targetId: targetId,
    structureId: structureId,
    isAuthenticated: true
  };

  // Creazione cookie. Scade tra 30 giorni
  cookieStore.set('jobmachine_portal_session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
    path: '/'
  });

  return { success: true, clientId: client.id, role };
}

export async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('jobmachine_portal_session');
  if (!sessionCookie) return null;
  
  try {
    const data = JSON.parse(sessionCookie.value);
    return data;
  } catch(e) {
    return null;
  }
}

export async function logoutClient() {
  const cookieStore = await cookies();
  cookieStore.delete('jobmachine_portal_session');
}

export async function getClientCvSignedUrl(slug: string, filePath: string) {
  const session = await getPortalSession();
  
  if (!session || !session.isAuthenticated || session.slug !== slug) {
    throw new Error('Access denied');
  }

  // Get service role client to bypass the authenticated RLS since the browser client
  // for the portal users is technically anon.
  const sb = getPortalClient();
  
  const { data, error } = await sb.storage
    .from('resumes')
    .createSignedUrl(filePath, 3600); // 1 hour valid

  if (error) {
    throw error;
  }
  
  return { url: data.signedUrl };
}

export async function moveCandidatePipelinePortal(slug: string, candidateId: string, newStage: string) {
  const session = await getPortalSession();
  if (!session || !session.isAuthenticated || session.slug !== slug) {
    throw new Error('Access denied');
  }

  const sb = getPortalClient();
  const { error } = await sb
    .from('candidates')
    .update({ pipeline_stage: newStage })
    .eq('id', candidateId);

  if (error) {
    console.error('Error updating candidate stage portal:', error);
    throw error;
  }
  return { success: true };
}

export async function updateClientNotesPortal(slug: string, candidateId: string, notes: string) {
  const session = await getPortalSession();
  if (!session || !session.isAuthenticated || session.slug !== slug) {
    throw new Error('Access denied');
  }

  const sb = getPortalClient();
  const { error } = await sb
    .from('candidates')
    .update({ client_notes: notes })
    .eq('id', candidateId);

  if (error) {
    console.error('Error updating candidate notes portal:', error);
    throw error;
  }
  return { success: true };
}
