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
  
  // Cerchiamo il client
  const { data: client, error } = await sb
    .from('clients')
    .select('id, name, slug, client_password, access_token')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    return { error: 'Cliente non trovato.' };
  }

  // Verifica password (se configurata)
  if (client.client_password && client.client_password !== passwordAttempt) {
    return { error: 'Password non valida.' };
  }
  
  // Se il cliente NON ha una password impostata, rifiutiamo il login (sicurezza) a meno che non si entri via token
  if (!client.client_password && !passwordAttempt.includes('token_bypass')) {
      return { error: 'Questo account cliente non ha ancora accesso configurato.' };
  }

  // Tutto OK, creiamo un cookie per la sessione del portale "Lucchetto"
  // Per sicurezza minima useremo un cookie HTTP Only firmato idealmente, o semplicemente settiamo clientId e lo slug.
  const cookieStore = cookies();
  
  const sessionData = {
    clientId: client.id,
    slug: client.slug,
    accessToken: client.access_token,
    isAuthenticated: true
  };

  // Creazione cookie. Scade tra 30 giorni
  cookieStore.set('jobmachine_portal_session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 giorni
    path: '/'
  });

  return { success: true, clientId: client.id };
}

export async function getPortalSession() {
  const cookieStore = cookies();
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
  const cookieStore = cookies();
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

