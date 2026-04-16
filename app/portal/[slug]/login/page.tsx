import { getPortalSession } from '@/app/portalActions';
import { redirect } from 'next/navigation';
import PortalLoginClient from './PortalLoginClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function ClientPortalLogin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getPortalSession();
  
  // Se ha già accesso a questo portale, lo rimando alla dashboard
  if (session?.isAuthenticated && session.slug === slug) {
    redirect(`/portal/${slug}`);
  }

  // Preleviamo il nome e logo del client
  const sb = createClient(supabaseUrl, supabaseKey);
  const { data: client } = await sb.from('clients').select('name, logo_url').eq('slug', slug).single();

  if (!client) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0b1120', color:'white' }}>
        <h2>Cliente non trovato.</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b1120', padding: '1rem' }}>
      <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        
        {client.logo_url ? (
          <img src={client.logo_url} alt="Logo Cliente" style={{ height: 60, objectFit: 'contain', marginBottom: '1.5rem', borderRadius: 8 }} />
        ) : (
          <div style={{ width: 60, height: 60, background: '#1e293b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem', fontWeight: 800, color: '#94a3b8' }}>
            {client.name.substring(0, 2).toUpperCase()}
          </div>
        )}

        <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Accesso Area Riservata
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Inserisci la chiave di accesso per accedere all'ambiente di {client.name}.
        </p>

        <PortalLoginClient slug={slug} />

        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#64748b' }}>
          <p>Potenziato da Job Machine</p>
        </div>
      </div>
    </div>
  );
}
