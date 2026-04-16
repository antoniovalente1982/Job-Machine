'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { X, User, FileText, ExternalLink, ClipboardList, MessageSquare } from 'lucide-react';
import { getClientCvSignedUrl } from '@/app/portalActions'; // We will add this

const DEFAULT_STAGES = [
  { id: 'received',       name: 'Candidature ricevute', color: '#3b82f6', definition: "Candidature ricevute" },
  { id: 'first_selection',name: '1° Selezione',         color: '#f59e0b', definition: '1° Selezione' },
  { id: 'to_contact',     name: 'Selezionati DA CONTATTARE', color: '#22c55e', definition: 'Selezionati DA CONTATTARE' },
  { id: 'stand_by',       name: 'STAND BY',             color: '#f97316', definition: 'In attesa di decisione' },
  { id: 'rejected',       name: 'SCARTATI',             color: '#ef4444', definition: "Scartati" },
  { id: 'selected',       name: 'SELEZIONATO ✅',       color: '#10b981', definition: 'Selezionato' }
];

const DEFAULT_CHECKLIST_LABELS = [
  'Invio 1° messaggio per compilazione questionario',
  'Invio 2° messaggio (promemoria questionario)',
  'Questionario compilato (dal candidato)',
  'Invio promemoria per invio CV e lettera',
  'CV e lettera motivazionale inviati (dal candidato)',
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ClientPipelineClient({ jobId, initialJob, slug, initialCandidates }: { jobId: string, initialJob: any, slug: string, initialCandidates: any[] }) {
  const [candidates, setCandidates] = useState<any[]>(initialCandidates || []);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);

  // Manteniamo in sync con le prop del server se la pagina revalida
  useEffect(() => {
    if (initialCandidates) {
      setCandidates(initialCandidates);
    }
  }, [initialCandidates]);

  const currentStages = (initialJob?.pipeline_stages && Array.isArray(initialJob.pipeline_stages) && initialJob.pipeline_stages.length > 0)
    ? initialJob.pipeline_stages
    : DEFAULT_STAGES;

  const clLabels = (initialJob?.checklist_labels && Array.isArray(initialJob.checklist_labels) && initialJob.checklist_labels.length === 5)
    ? initialJob.checklist_labels
    : DEFAULT_CHECKLIST_LABELS;

  async function openCandidate(candidate: any) {
    setSelectedCandidate(candidate);
    setCvUrl(null);
    if (candidate.cv_file_path) {
      setCvLoading(true);
      try {
        // Usa una Server Action protetta per estrarre il CV (così bypassiamo Supabase Auth anon restriction)
        const res = await getClientCvSignedUrl(slug, candidate.cv_file_path);
        if (res.url) setCvUrl(res.url);
      } catch (e) {
        console.error('CV URL error:', e);
      } finally {
        setCvLoading(false);
      }
    }
  }

  // Costruiamo lo stesso layout del kanban
  return (
    <div style={{ display: 'flex', height: '100%', overflowX: 'auto', background: 'transparent', padding: '1.5rem 2rem' }}>
      {currentStages.map((stage: any, index: number) => {
        const sid = stage.id || stage.key;
        const cands = candidates.filter(c => c.pipeline_stage === sid || (sid === 'received' && !c.pipeline_stage));
        const stageColor = stage.color || '#6366f1';
        
        return (
          <div key={sid} style={{ 
            minWidth: 270, maxWidth: 270, flex: '0 0 270px', 
            background: '#0d1117', 
            borderRadius: 14, 
            border: '2px solid rgba(255,255,255,0.06)', 
            display: 'flex', flexDirection: 'column',
            marginRight: '1rem',
            position: 'relative'
          }}>
            
            {/* Accent top bar */}
            <div style={{ height: 4, background: stageColor, borderRadius: '12px 12px 0 0', flexShrink: 0 }} />

            {/* Header Colonna */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0.75rem 0.5rem 0.875rem', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, lineHeight: 1.3 }}>
                {stage.name}
              </h2>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.1rem 0.5rem', fontSize: '0.7rem', color: '#9eaab5', fontWeight: 600 }}>
                {cands.length}
              </div>
            </div>

            {/* Box Definizione if exists */}
            {stage.definition && (
              <div style={{ margin: '0 0.75rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.55rem 0.7rem', color: '#7a8fa6', fontSize: '0.73rem', lineHeight: 1.45 }}>
                {stage.definition}
              </div>
            )}

            {/* Area Carte */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0 0.5rem 1rem 0.5rem' }}>
              {cands.map(candidate => {
                const isSelected = selectedCandidate?.id === candidate.id;
                let cCount = 0;
                if (candidate.checklist_msg1_sent) cCount++;
                if (candidate.checklist_msg2_sent) cCount++;
                if (candidate.checklist_quest_done) cCount++;
                if (candidate.checklist_remind_cv) cCount++;
                if (candidate.checklist_cv_done) cCount++;
                const hasCv = !!candidate.cv_file_path;

                return (
                  <div
                    key={candidate.id}
                    onClick={() => openCandidate(candidate)}
                    style={{
                      background: '#1c2333',
                      borderRadius: 9,
                      padding: '0.7rem 0.75rem',
                      cursor: 'pointer',
                      border: isSelected ? `2px solid ${stageColor}` : '1px solid rgba(255,255,255,0.03)',
                      transition: 'border-color 0.2s',
                      boxShadow: isSelected ? `0 0 15px ${hexToRgba(stageColor, 0.25)}` : '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.3 }}>
                        {candidate.first_name} {candidate.last_name}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {hasCv && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: 4, display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                          <FileText size={10} /> CV
                        </span>
                      )}
                      {cCount > 0 && (
                        <span style={{ fontSize: '0.7rem', color: '#9eaab5', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <ClipboardList size={10} /> {cCount}/5
                        </span>
                      )}
                      
                      {candidate.internal_notes && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#6b7a90', marginLeft: 'auto' }}>
                           📝
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {cands.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#4a5568', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                  Nessun candidato
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* PANNELLO DETTAGLIO LATERALE (Read-Only) */}
      {selectedCandidate && (
        <div style={{ width: 450, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>{selectedCandidate.first_name} {selectedCandidate.last_name}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Dettagli Candidatura</div>
            </div>
            <button onClick={() => setSelectedCandidate(null)} style={{ background: 'var(--border-light)', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
            
            {/* Contact */}
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Contatti</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.95rem' }}><span style={{ color: 'var(--text-muted)' }}>Email:</span> <a href={`mailto:${selectedCandidate.email}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>{selectedCandidate.email}</a></div>
                <div style={{ fontSize: '0.95rem' }}><span style={{ color: 'var(--text-muted)' }}>Telefono:</span> {selectedCandidate.phone || 'Non specificato'}</div>
              </div>
            </div>

            {/* Curriculum */}
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Curriculum Vitae</h4>
              {selectedCandidate.cv_file_path ? (
                 cvLoading ? (
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Caricamento CV...</div>
                 ) : cvUrl ? (
                   <a href={cvUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, border: '1px solid rgba(99,102,241,0.2)' }}>
                     <FileText size={18} /> Apri e Scarica CV
                   </a>
                 ) : (
                   <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>Errore caricamento PDF</div>
                 )
              ) : (
                 <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Curriculum non allegato</div>
              )}
            </div>

            {/* Modulo Dati / Questionario */}
            {selectedCandidate.questionnaire_responses && Object.keys(selectedCandidate.questionnaire_responses).length > 0 && (
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Risposte Questionario</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {Object.entries(selectedCandidate.questionnaire_responses).map(([key, value]) => {
                      const schemaItem = (initialJob?.form_schema || []).find((s:any) => s.id === key);
                      const fieldLabel = schemaItem ? schemaItem.label : key;
                      const valStr = Array.isArray(value) ? value.join(', ') : String(value);
                      return (
                        <div key={key}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>{fieldLabel}</div>
                          <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                            {valStr || '-'}
                          </div>
                        </div>
                      );
                   })}
                </div>
              </div>
            )}

            {/* Note Agenzia per il Cliente */}
            <div style={{ background: 'rgba(16,185,129,0.05)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={14} /> Note Agenzia per il Cliente
              </h4>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {selectedCandidate.client_notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nessuna nota condivisa per questo candidato.</span>}
              </div>
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
