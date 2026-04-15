'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './components/AuthProvider';
import DashboardShell from './components/DashboardShell';
import styles from './dashboard.module.css';
import { Building2, Users, Briefcase, CheckCircle, Plus, ChevronRight } from 'lucide-react';
import { createClient } from './adminActions';

type DashboardData = {
  clients: any[];
  stats: { clients: number; structures: number; jobs: number; candidates: number; hired: number };
};

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { clients, stats } = initialData;

  async function handleAddClient(formData: FormData) {
    setLoading(true);
    await createClient(formData);
    setShowModal(false);
    setLoading(false);
    router.refresh();
  }

  const kpis = [
    { label: 'Clienti Attivi', value: stats.clients, icon: Building2, color: 'blue' },
    { label: 'Strutture', value: stats.structures, icon: Building2, color: 'purple' },
    { label: 'Posizioni Aperte', value: stats.jobs, icon: Briefcase, color: 'amber' },
    { label: 'Candidati Totali', value: stats.candidates, icon: Users, color: 'green' },
    { label: 'Assunti', value: stats.hired, icon: CheckCircle, color: 'rose' },
  ];

  return (
    <DashboardShell>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Benvenuto{user?.full_name ? `, ${user.full_name}` : ''}. Ecco la panoramica della tua agenzia.
        </p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpis.map(kpi => (
          <div key={kpi.label} className={`glass-panel ${styles.kpiCard}`}>
            <div className={`${styles.kpiIcon} ${styles[kpi.color]}`}>
              <kpi.icon size={22} />
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiValue}>{kpi.value}</div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Clients List */}
      <h2 className={styles.sectionTitle}>I Tuoi Clienti</h2>
      <div className={styles.clientsGrid}>
        {clients.map(client => {
          const structCount = client.structures?.length || 0;
          const jobCount = client.structures?.reduce((acc: number, s: any) => acc + (s.job_positions?.length || 0), 0) || 0;
          const initials = client.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div 
              key={client.id} 
              className={`glass-panel ${styles.clientCard}`}
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <div className={styles.clientAvatar}>{initials}</div>
              <div className={styles.clientInfo}>
                <div className={styles.clientName}>{client.name}</div>
                <div className={styles.clientMeta}>{structCount} strutture · {jobCount} posizioni</div>
              </div>
              <ChevronRight size={18} className={styles.clientArrow} />
            </div>
          );
        })}

        <button className={styles.addClientBtn} onClick={() => setShowModal(true)}>
          <Plus size={20} /> Aggiungi Cliente
        </button>
      </div>

      {/* Modal Nuovo Cliente */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div className="glass-panel" style={{ maxWidth: 420, width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Nuovo Cliente</h3>
            <form action={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" name="name" required placeholder="Nome del cliente (es. Hotel Excelsior)" 
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)', fontSize: '1rem' }} 
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} 
                  style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Annulla
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {loading ? '...' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
