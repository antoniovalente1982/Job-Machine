'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';
import CopyLinkButton from '../../components/CopyLinkButton';
import styles from '../../dashboard.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { createStructure, createJobPosition, updateJobStatus } from '../../adminActions';
import { updateClientPortalData, updateStructureData } from '../../adminClientActions';
import { ArrowLeft, Plus, MapPin, Building2, Play, Pause, XCircle, Archive, Lock, Link as LinkIcon, Save, FileText } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Aperta', color: '#059669', bg: '#ecfdf5' },
  draft: { label: 'Bozza', color: '#6b7280', bg: '#f3f4f6' },
  paused: { label: 'In Pausa', color: '#d97706', bg: '#fffbeb' },
  closed: { label: 'Chiusa', color: '#e11d48', bg: '#fff1f2' },
  archived: { label: 'Archiviata', color: '#6b7280', bg: '#f1f5f9' },
};

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [modal, setModal] = useState<'structure' | 'job' | null>(null);
  const [structureContext, setStructureContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => { loadClient(); }, [clientId]);

  async function loadClient() {
    const sb = createSupabaseClient();
    const { data } = await sb
      .from('clients')
      .select('*, structures(*, job_positions(*, candidates(id, pipeline_stage)))')
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

  async function handleStatusChange(jobId: string, newStatus: string) {
    await updateJobStatus(jobId, newStatus);
    await loadClient();
  }

  async function handleSaveClientSettings() {
    if (!client) return;
    setLoading(true);
    await updateClientPortalData(client.id, client.client_password, client.market_sector, client.company_context);
    alert('Impostazioni salvate con successo!');
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className={styles.title}>{client.name}</h1>
            <p className={styles.subtitle}>{client.structures?.length || 0} strutture · {client.structures?.reduce((a: number, s: any) => a + (s.job_positions?.length || 0), 0)} posizioni</p>
          </div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
            Mostra archiviate
          </label>
        </div>
      </div>

      {/* Portale Cliente (Lucchetto) & Contesto */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Lock size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Portale Cliente & Dati Aziendali</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Link Accesso "Lucchetto"</label>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-light)', alignItems: 'center' }}>
              <LinkIcon size={14} style={{ color: 'var(--text-muted)' }} />
              <input type="text" readOnly value={`https://jobmachine.biz/portal/${client.slug}`} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem', outline: 'none' }} />
              <CopyLinkButton link={`https://jobmachine.biz/portal/${client.slug}`} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Password di Accesso (Opzionale)</label>
            <input 
              type="text" 
              placeholder="Es. CMG2026" 
              value={client.client_password || ''} 
              onChange={e => setClient({...client, client_password: e.target.value})}
              style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Settore di Mercato</label>
             <input type="text" placeholder="Es. Hotellerie 4-5 Stelle, Ristorazione di Lusso..." value={client.market_sector || ''} onChange={e => setClient({...client, market_sector: e.target.value})} style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </div>
          <div>
             <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Contesto / Cultura Aziendale</label>
             <textarea placeholder="Note sul cliente, come lavorano, benefit offerti, particolarità..." value={client.company_context || ''} onChange={e => setClient({...client, company_context: e.target.value})} style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: 80 }} />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSaveClientSettings} disabled={loading} style={{ padding: '0.65rem 1.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> {loading ? 'Salvataggio...' : 'Salva Dati Cliente'}
          </button>
        </div>
      </div>

      {/* Strutture */}
      {client.structures?.map((structure: any) => {
        const jobs = structure.job_positions?.filter((j: any) => showArchived || j.status !== 'archived') || [];
        return (
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
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔑 Pwd Manager Esterno:</div>
              <input 
                 type="text" 
                 placeholder="Es. FRESCO"
                 value={structure.structure_password || ''}
                 onChange={e => {
                    const newStructures = client.structures.map((s:any) => s.id === structure.id ? {...s, structure_password: e.target.value} : s);
                    setClient({...client, structures: newStructures});
                 }}
                 style={{ width: '160px', padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
              <button 
                onClick={async () => {
                  const { updateStructurePassword } = await import('@/app/adminClientActions');
                  const res = await updateStructurePassword(structure.id, structure.structure_password);
                  if (res && typeof res === 'object' && res.error) alert('Errore:\n' + res.error);
                  else alert('Password definita e salvata con successo per ' + structure.name);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                <Save size={14} /> Salva
              </button>
            </div>
          </div>
          {/* Job Positions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {jobs.map((job: any) => {
              const st = STATUS_CONFIG[job.status] || STATUS_CONFIG.open;
              const isInactive = job.status === 'closed' || job.status === 'archived';
              const newCandidatesCount = job.candidates?.filter((c: any) => c.pipeline_stage === 'received').length || 0;

              return (
              <div key={job.id} style={{ 
                background: isInactive ? 'var(--bg-hover)' : 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)', 
                borderRadius: 10, 
                padding: '1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem',
                opacity: job.status === 'archived' ? 0.6 : 1,
              }}>
                {/* Header con stato */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {job.title}
                    {newCandidatesCount > 0 && (
                      <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 99, fontWeight: 700 }} title={`${newCandidatesCount} candidati da valutare`}>
                        {newCandidatesCount}
                      </span>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: 600, 
                    background: st.bg, color: st.color,
                    padding: '0.15rem 0.5rem', borderRadius: 99
                  }}>
                    {st.label}
                  </span>
                </div>
                
                {job.salary && <div style={{ fontSize: '0.8rem', color: 'var(--green)' }}>💰 {job.salary}</div>}
                
                {/* Azioni stato */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {job.status !== 'open' && job.status !== 'archived' && (
                    <button onClick={() => handleStatusChange(job.id, 'open')} title="Riapri"
                      style={{ padding: '0.3rem 0.5rem', background: '#ecfdf5', border: 'none', borderRadius: 5, color: '#059669', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Play size={10} /> Apri
                    </button>
                  )}
                  {job.status === 'open' && (
                    <button onClick={() => handleStatusChange(job.id, 'paused')} title="Metti in pausa"
                      style={{ padding: '0.3rem 0.5rem', background: '#fffbeb', border: 'none', borderRadius: 5, color: '#d97706', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Pause size={10} /> Pausa
                    </button>
                  )}
                  {job.status !== 'closed' && job.status !== 'archived' && (
                    <button onClick={() => handleStatusChange(job.id, 'closed')} title="Chiudi posizione"
                      style={{ padding: '0.3rem 0.5rem', background: '#fff1f2', border: 'none', borderRadius: 5, color: '#e11d48', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <XCircle size={10} /> Chiudi
                    </button>
                  )}
                  {job.status === 'closed' && (
                    <button onClick={() => handleStatusChange(job.id, 'archived')} title="Archivia"
                      style={{ padding: '0.3rem 0.5rem', background: '#f1f5f9', border: 'none', borderRadius: 5, color: '#6b7280', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Archive size={10} /> Archivia
                    </button>
                  )}
                </div>

                {/* Pipeline + Link */}
                {job.status === 'open' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button onClick={() => router.push(`/pipeline/${job.id}`)} style={{ flex: 1, padding: '0.5rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                      Pipeline
                    </button>
                    <button 
                      onClick={() => {
                        if (job.public_description) {
                          navigator.clipboard.writeText(job.public_description);
                          alert('Testo annuncio copiato negli appunti! Ora puoi incollarlo su Facebook/LinkedIn.');
                        } else {
                          alert('Non hai ancora impostato il testo annuncio! Entra in Pipeline -> ⚙️ Impostazioni -> 4. Testo Annuncio (o Modifica struttuta da AdminDashboard se non hai lo snapshot aggiornato).');
                        }
                      }}
                      style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      title="Copia l'Annuncio di testo per i Social"
                    >
                      <FileText size={14} /> Testo
                    </button>
                    <CopyLinkButton
                      id={job.id}
                      className=""
                      style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                    />
                  </div>
                )}
              </div>
            )})}
            
            {/* Add Job Button */}
            <div onClick={() => { setStructureContext(structure.id); setModal('job'); }} 
              style={{ background: 'transparent', border: '1px dashed var(--border-primary)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', minHeight: 100 }}>
              <Plus size={18} /> Nuova Posizione
            </div>
          </div>
        </div>
      )})}

      {/* Add Structure Button */}
      <button onClick={() => setModal('structure')} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px dashed var(--border-primary)', borderRadius: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Plus size={18} /> Aggiungi Nuova Struttura
      </button>

      {/* Modals */}
      {modal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-panel" style={{ maxWidth: 440, width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>
              {modal === 'structure' ? 'Nuova Struttura' : 'Nuova Posizione'}
            </h3>
            
            {modal === 'structure' && (
              <form action={handleAddStructure} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="name" required placeholder="Nome struttura" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <input type="text" name="location" required placeholder="Località (es. Roma)" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>Annulla</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Crea'}</button>
                </div>
              </form>
            )}
            
            {modal === 'job' && (
              <form action={handleAddJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="title" required placeholder="Titolo ruolo (es. Sommelier)" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <input type="text" name="salary" required placeholder="Compenso (es. 1500€/mese + TFR)" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <input type="text" name="trello_board_link" placeholder="Link Trello (opzionale)" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>Annulla</button>
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
