'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';
import CopyLinkButton from '../../components/CopyLinkButton';
import styles from '../../dashboard.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { createStructure, createJobPosition } from '../../adminActions';
import { ArrowLeft, Plus, MapPin, Briefcase, ChevronRight, Building2 } from 'lucide-react';

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [modal, setModal] = useState<'structure' | 'job' | null>(null);
  const [structureContext, setStructureContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadClient(); }, [clientId]);

  async function loadClient() {
    const sb = createSupabaseClient();
    const { data } = await sb
      .from('clients')
      .select('*, structures(*, job_positions(*))')
      .eq('id', clientId)
      .single();
    setClient(data);
  }

  async function handleAddStructure(formData: FormData) {
    setLoading(true);
    await createStructure(clientId, formData);
    await loadClient();
    setModal(null);
    setLoading(false);
  }

  async function handleAddJob(formData: FormData) {
    if (!structureContext) return;
    setLoading(true);
    await createJobPosition(structureContext, formData);
    await loadClient();
    setModal(null);
    setStructureContext(null);
    setLoading(false);
  }

  if (!client) {
    return <DashboardShell><p style={{color: 'var(--text-muted)'}}>Caricamento...</p></DashboardShell>;
  }

  return (
    <DashboardShell>
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Torna alla Dashboard
        </button>
        <h1 className={styles.title}>{client.name}</h1>
        <p className={styles.subtitle}>{client.structures?.length || 0} strutture · {client.structures?.reduce((a: number, s: any) => a + (s.job_positions?.length || 0), 0)} posizioni aperte</p>
      </div>

      {/* Strutture */}
      {client.structures?.map((structure: any) => (
        <div key={structure.id} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Building2 size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{structure.name}</h3>
              {structure.location && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={12} /> {structure.location}
                </span>
              )}
            </div>
          </div>

          {structure.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>{structure.description}</p>
          )}

          {/* Job Positions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {structure.job_positions?.map((job: any) => (
              <div key={job.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{job.title}</div>
                {job.salary && <div style={{ fontSize: '0.8rem', color: '#4ade80' }}>💰 {job.salary}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button onClick={() => router.push(`/pipeline/${job.id}`)} style={{ flex: 1, padding: '0.5rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                    Pipeline
                  </button>
                  <CopyLinkButton
                    id={job.id}
                    className=""
                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            ))}
            
            {/* Add Job Button */}
            <div onClick={() => { setStructureContext(structure.id); setModal('job'); }} 
              style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: 100, transition: 'all 0.2s' }}>
              <Plus size={18} /> Nuova Posizione
            </div>
          </div>
        </div>
      ))}

      {/* Add Structure Button */}
      <button onClick={() => setModal('structure')} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Plus size={18} /> Aggiungi Nuova Struttura
      </button>

      {/* Modals */}
      {modal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-panel" style={{ maxWidth: 440, width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
              {modal === 'structure' ? 'Nuova Struttura' : 'Nuova Posizione'}
            </h3>
            
            {modal === 'structure' && (
              <form action={handleAddStructure} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="name" required placeholder="Nome struttura" 
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.8rem', color: 'white' }} />
                <input type="text" name="location" required placeholder="Località (es. Roma)" 
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.8rem', color: 'white' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Annulla</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Crea'}</button>
                </div>
              </form>
            )}
            
            {modal === 'job' && (
              <form action={handleAddJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="title" required placeholder="Titolo ruolo (es. Sommelier)" 
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.8rem', color: 'white' }} />
                <input type="text" name="salary" required placeholder="Compenso (es. 1500€/mese + TFR)" 
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.8rem', color: 'white' }} />
                <input type="text" name="trello_board_link" placeholder="Link Trello (opzionale)" 
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.8rem', color: 'white' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', cursor: 'pointer' }}>Annulla</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Crea'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
