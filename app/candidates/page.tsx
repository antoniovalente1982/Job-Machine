'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { Users, Search, Download } from 'lucide-react';

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  candidatura_ricevuta: { label: 'Ricevuta', color: '#6366f1' },
  questionario_compilato: { label: 'Questionario', color: '#f59e0b' },
  form_completed: { label: 'Form OK', color: '#f59e0b' },
  cv_ricevuto: { label: 'CV Ricevuto', color: '#3b82f6' },
  in_valutazione: { label: 'Valutazione', color: '#8b5cf6' },
  selezionato: { label: 'Selezionato', color: '#22c55e' },
  da_contattare: { label: 'Da Contattare', color: '#14b8a6' },
  colloquio_fissato: { label: 'Colloquio', color: '#06b6d4' },
  assunto: { label: 'Assunto', color: '#10b981' },
  scartato: { label: 'Scartato', color: '#ef4444' },
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadCandidates(); }, []);

  async function loadCandidates() {
    const sb = createSupabaseClient();
    const { data } = await sb
      .from('candidates')
      .select('*, job:job_positions(title, structure:structures(name, client:clients(name)))')
      .order('created_at', { ascending: false });
    setCandidates(data || []);
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    return `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(q);
  });

  return (
    <DashboardShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.title}>Candidati</h1>
          <p className={styles.subtitle}>{candidates.length} candidati totali nel sistema</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Cerca per nome o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.95rem' }}
        />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidato</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posizione</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stato</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const stage = STAGE_LABELS[c.pipeline_stage || c.status] || STAGE_LABELS.candidatura_ricevuta;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{c.job?.title || '-'}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{c.job?.structure?.client?.name || '-'}</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', background: `${stage.color}22`, color: stage.color, padding: '0.2rem 0.6rem', borderRadius: 99, fontWeight: 500 }}>
                      {stage.label}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {new Date(c.created_at).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>Nessun candidato trovato</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
