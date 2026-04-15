import pageStyles from './page.module.css';
import { supabase } from '../lib/supabase';
import AdminDashboard from './components/AdminDashboard';

export const revalidate = 0; // Disable cache for live dashboard

export default async function Home() {
  // Ora peschiamo TUTTI i clienti, non solo Consulting Manager Group
  const { data: clientsData, error: clientErr } = await supabase
    .from('clients')
    .select('id, name, slug, logo_url, structures(*, job_positions(*))')
    .order('name');

  if (clientErr || !clientsData) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center' }}>
        <h2>Errore di caricamento dati 🔴</h2>
        <pre>{clientErr?.message}</pre>
      </div>
    );
  }

  return (
    <main className={pageStyles.main}>
      <header className={pageStyles.header} style={{ marginBottom: '2rem' }}>
        <div className={`glass-panel ${pageStyles.logo}`}>
          <span className={pageStyles.logoAccent}>Master</span> Hub
        </div>
        <nav className={pageStyles.nav}>
          <div className={pageStyles.navLinkActive}>Dashboard Agenzia</div>
        </nav>
      </header>

      {/* Tutto il layout interattivo è delegato a questa Client Component! */}
      <AdminDashboard clients={clientsData} />
    </main>
  );
}
