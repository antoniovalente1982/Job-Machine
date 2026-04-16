import { getPortalSession, logoutClient } from '@/app/portalActions';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ClientPipelineClient from './ClientPipelineClient';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usiamo supabaseServiceKey per estrarre la roba interna evitando problemi di RLS 
// se la RLS policy non è perfettamente settata per i candidate read senza Auth.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function ClientPortalPipeline({ params }: { params: Promise<{ slug: string, jobId: string }> }) {
  const { slug, jobId } = await params;
  const session = await getPortalSession();
  
  if (!session || !session.isAuthenticated || session.slug !== slug) {
    redirect(`/portal/${slug}/login`);
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  // Verifichiamo che il job appartenga veramente a questo cliente! (Sicurezza)
  const { data: job } = await sb
    .from('job_positions')
    .select('*, structure:structures!inner(id, name, client_id, client:clients(id, name, logo_url))')
    .eq('id', jobId)
    .single();

  if (!job || job.structure.client_id !== session.clientId) {
    return <div>Accesso Negato o Job non trovato.</div>;
  }

  const client = job.structure.client;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0b1120', color: 'white', overflow: 'hidden' }}>
      
      {/* ── HEADER PORTALE CLIENTE ── */}
      <header style={{ flexShrink: 0, background: '#111827', borderBottom: '1px solid #1e293b', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href={`/portal/${slug}`} style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <span>← Torna alla Dashboard</span>
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#1e293b' }}></div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'white' }}>{job.title}</h1>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📍 {job.structure.name}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {client.logo_url && (
              <img src={client.logo_url} alt="Logo" style={{ height: 32, objectFit: 'contain' }} />
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>{client.name}</span>
        </div>
      </header>

      {/* ── KANBAN COMPONENT ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ClientPipelineClient jobId={jobId} initialJob={job} slug={slug} />
      </div>

    </div>
  );
}
