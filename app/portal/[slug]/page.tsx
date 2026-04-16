import { getPortalSession, logoutClient } from '@/app/portalActions';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function ClientPortalDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getPortalSession();
  
  // Validazione sessione: se non c'è, o se lo slug del cookie non matcha lo slug dell'URL, login
  if (!session || !session.isAuthenticated || session.slug !== slug) {
    redirect(`/portal/${slug}/login`);
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  // Carichiamo il client
  const { data: client } = await sb.from('clients').select('*').eq('id', session.clientId).single();
  
  if (!client) {
    return <div>Errore: Cliente non trovato.</div>;
  }

  // Carichiamo le posizioni associate al client (con le strutture)
  // Per via del nostro schema: job_positions -> structures -> clients
  // Faremo una query sulle posizioni dove la struttura.client_id = session.clientId
  const { data: jobs } = await sb
    .from('job_positions')
    .select('*, structure:structures!inner(id, name, client_id)')
    .eq('structure.client_id', session.clientId)
    .order('created_at', { ascending: false });

  // Facciamo fetch dei conteggi dei candidati per ogni lavoro
  // Visto che è una query complessa per il server component, facciamo chiamate multiple o le uniamo in javascript
  let jobData = jobs || [];
  for (let j of jobData) {
    const { count } = await sb.from('candidates').select('*', { count: 'exact', head: true }).eq('job_id', j.id);
    j.candidate_count = count || 0;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b1120', color: 'white' }}>
      
      {/* ── HEADER PORTALE CLIENTE ── */}
      <header style={{ background: '#111827', borderBottom: '1px solid #1e293b', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {client.logo_url ? (
            <img src={client.logo_url} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 40, height: 40, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {client.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Area Riservata</h1>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{client.name}</div>
          </div>
        </div>
        
        <form action={async () => {
          'use action';
          await logoutClient();
          redirect(`/portal/${slug}/login`);
        }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
            Esci
          </button>
        </form>
      </header>

      {/* ── CONTENUTO ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' }}>
        
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Le tue Ricerche Attive</h2>
          <p style={{ color: '#94a3b8' }}>Seleziona una posizione per visualizzare i candidati in tempo reale.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {jobData.length === 0 ? (
            <div style={{ padding: '3rem', background: '#111827', borderRadius: 16, border: '1px solid #1e293b', textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8' }}>
              Nessuna ricerca attiva trovata per la tua azienda.
            </div>
          ) : (
            jobData.map((job) => (
              <Link key={job.id} href={`/portal/${slug}/pipeline/${job.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  background: '#111827', 
                  border: '1px solid #1e293b', 
                  borderRadius: 16, 
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }} className="portal-job-card">
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      💼
                    </div>
                    {job.is_active ? (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 20, fontWeight: 600 }}>Attivo</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(148,163,184,0.1)', color: '#94a3b8', borderRadius: 20, fontWeight: 600 }}>Chiuso</span>
                    )}
                  </div>

                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '0.3rem' }}>{job.title}</h3>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📍 {job.structure?.name}
                    </div>
                  </div>

                  <div style={{ paddingTop: '1rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                     <span style={{ color: '#94a3b8' }}>Candidati Totali</span>
                     <span style={{ fontWeight: 700, color: 'white' }}>{job.candidate_count}</span>
                  </div>

                </div>
              </Link>
            ))
          )}
        </div>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .portal-job-card:hover {
          transform: translateY(-3px);
          border-color: #6366f1 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
      `}} />

    </div>
  );
}
