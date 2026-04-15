'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { createClient } from '../adminActions';
import { Plus, ChevronRight, Building2 } from 'lucide-react';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    const sb = createSupabaseClient();
    const { data } = await sb.from('clients').select('*, structures(id, job_positions(id))').order('name');
    setClients(data || []);
  }

  async function handleAdd(formData: FormData) {
    setLoading(true);
    await createClient(formData);
    await loadClients();
    setShowModal(false);
    setLoading(false);
  }

  return (
    <DashboardShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.title}>Clienti</h1>
          <p className={styles.subtitle}>Gestisci tutti i clienti della tua agenzia HR</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ padding: '0.7rem 1.25rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nuovo Cliente
        </button>
      </div>

      <div className={styles.clientsGrid}>
        {clients.map(client => {
          const structCount = client.structures?.length || 0;
          const jobCount = client.structures?.reduce((a: number, s: any) => a + (s.job_positions?.length || 0), 0) || 0;
          const initials = client.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div key={client.id} className={`glass-panel ${styles.clientCard}`} onClick={() => router.push(`/clients/${client.id}`)}>
              <div className={styles.clientAvatar}>{initials}</div>
              <div className={styles.clientInfo}>
                <div className={styles.clientName}>{client.name}</div>
                <div className={styles.clientMeta}>{structCount} strutture · {jobCount} posizioni</div>
              </div>
              <ChevronRight size={18} className={styles.clientArrow} />
            </div>
          );
        })}
      </div>

      {clients.length === 0 && (
        <div className={styles.emptyState}>
          <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>Non hai ancora clienti. Clicca il bottone in alto per crearne uno!</p>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-panel" style={{ maxWidth: 420, width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Nuovo Cliente</h3>
            <form action={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" name="name" required placeholder="Nome cliente"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)', fontSize: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>Annulla</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Crea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
