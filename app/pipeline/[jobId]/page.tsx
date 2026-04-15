'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';
import { createSupabaseClient } from '@/lib/supabase';
import { ArrowLeft, User, GripVertical, FileText, Star } from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'candidatura_ricevuta', label: 'Candidature Ricevute', color: '#6366f1' },
  { key: 'questionario_compilato', label: 'Questionario Compilato', color: '#f59e0b' },
  { key: 'cv_ricevuto', label: 'CV Ricevuto', color: '#3b82f6' },
  { key: 'in_valutazione', label: 'In Valutazione', color: '#8b5cf6' },
  { key: 'selezionato', label: 'Selezionati', color: '#22c55e' },
  { key: 'da_contattare', label: 'Da Contattare', color: '#14b8a6' },
  { key: 'colloquio_fissato', label: 'Colloquio Fissato', color: '#06b6d4' },
  { key: 'assunto', label: 'Assunti ✅', color: '#10b981' },
  { key: 'scartato', label: 'Scartati', color: '#ef4444' },
];

export default function PipelinePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [jobId]);

  async function loadData() {
    const sb = createSupabaseClient();
    
    const { data: jobData } = await sb
      .from('job_positions')
      .select('*, structure:structures(name, client:clients(name))')
      .eq('id', jobId)
      .single();
    setJob(jobData);

    const { data: candidatesData } = await sb
      .from('candidates')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    setCandidates(candidatesData || []);
  }

  async function moveCandidate(candidateId: string, newStage: string) {
    const sb = createSupabaseClient();
    await sb.from('candidates').update({ pipeline_stage: newStage }).eq('id', candidateId);
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipeline_stage: newStage } : c));
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (draggedId) {
      moveCandidate(draggedId, stage);
      setDraggedId(null);
    }
  }

  const breadcrumb = job ? `${job.structure?.client?.name} › ${job.structure?.name} › ${job.title}` : '...';

  return (
    <DashboardShell>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> {breadcrumb}
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Pipeline: {job?.title || '...'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{candidates.length} candidati totali · Trascina le card per spostare i candidati tra le fasi</p>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '2rem', minHeight: '60vh' }}>
        {PIPELINE_STAGES.map(stage => {
          const stageCards = candidates.filter(c => c.pipeline_stage === stage.key);
          return (
            <div 
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              style={{ 
                minWidth: 260, 
                maxWidth: 280,
                flex: '0 0 260px',
                background: 'var(--bg-primary)', 
                borderRadius: 16, 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                border: '1px solid var(--border-light)'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${stage.color}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>{stage.label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '0.15rem 0.5rem', borderRadius: 99 }}>{stageCards.length}</span>
              </div>

              {/* Cards */}
              {stageCards.map(candidate => (
                <div 
                  key={candidate.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, candidate.id)}
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: 10, 
                    padding: '0.85rem',
                    cursor: 'grab',
                    transition: 'all 0.15s',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <User size={14} style={{ color: stage.color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{candidate.first_name} {candidate.last_name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.email}</div>
                  {candidate.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{candidate.phone}</div>}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {candidate.cv_file_path && (
                      <span style={{ fontSize: '0.65rem', background: 'var(--blue-light)', color: 'var(--blue)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                        📎 CV
                      </span>
                    )}
                    {candidate.questionnaire_responses && (
                      <span style={{fontSize: '0.65rem', background: 'var(--amber-light)', color: 'var(--amber)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                        📝 Questionario
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {stageCards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>
                  Trascina qui i candidati
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
