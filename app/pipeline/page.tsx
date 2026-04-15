'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { Kanban, ChevronRight, Users } from 'lucide-react';

export default function PipelineListPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    const sb = createSupabaseClient();
    const { data } = await sb
      .from('job_positions')
      .select('*, structure:structures(name, client:clients(name)), candidates(id, pipeline_stage)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setJobs(data || []);
  }

  return (
    <DashboardShell>
      <h1 className={styles.title}>Pipeline</h1>
      <p className={styles.subtitle}>Seleziona una posizione per aprire la Kanban Board</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        {jobs.map(job => {
          const candidateCount = job.candidates?.length || 0;
          return (
            <div
              key={job.id}
              onClick={() => router.push(`/pipeline/${job.id}`)}
              className="glass-panel"
              style={{ padding: '1.25rem', cursor: 'pointer', borderRadius: 14, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '1rem' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{job.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {job.structure?.client?.name} › {job.structure?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Users size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{candidateCount} candidati</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Kanban size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>Nessuna posizione attiva. Crea un cliente e una posizione dalla sezione Clienti.</p>
        </div>
      )}
    </DashboardShell>
  );
}
