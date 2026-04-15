'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';
import { createSupabaseClient } from '@/lib/supabase';
import { ArrowLeft, User, GripVertical, FileText, Star, X, CheckSquare, Mail, MessageSquare } from 'lucide-react';
import { updateCandidateChecklist, updateCandidateNotes, updateJobPipelineStages, updateJobFormSchema, moveCandidatePipeline } from '../../adminActions';

const DEFAULT_STAGES = [
  { id: 'received', name: 'Candidature ricevute (Ancora in screening)', color: '#1e293b', definition: "Qui trovi tutti coloro che si sono candidati all'offerta. Non hanno ancora inviato i propri dati, e sono quindi ancora da valutare." },
  { id: 'first_selection', name: '1° Selezione (Questionario compilato)', color: '#d97706', definition: 'Qui trovi i candidati che hanno inviato i propri dati tramite il questionario, ma non ancora il CV. Sono ancora da valutare.' },
  { id: 'to_contact', name: 'Selezionati DA CONTATTARE', color: '#4d7c0f', definition: 'Qui trovi i candidati che hanno superato tutti gli step e sono da contattare. Dentro ciascun candidato trovi in allegato le risposte del questionario e il cv.' },
  { id: 'stand_by', name: 'STAND BY (Contattati, in attesa di decisione)', color: '#ea580c', definition: 'Qui puoi spostare i candidati che sono stati contattati e che sono in fase di vostra valutazione.' },
  { id: 'rejected', name: 'SCARTATI (Non in linea)', color: '#dc2626', definition: "Qui trovi i candidati scartati. Nella descrizione di ciascun candidato c'è la motivazione." },
  { id: 'selected', name: 'SELEZIONATO ✅', color: '#16a34a', definition: 'Qui puoi spostare i candidati che sono stati selezionati' }
];

export default function PipelinePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [notesTemp, setNotesTemp] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingStages, setEditingStages] = useState<any[]>([]);
  const [editingFormSchema, setEditingFormSchema] = useState<any[]>([]);
  const [savingStages, setSavingStages] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'form'>('pipeline');

  const currentStages = (job?.pipeline_stages && Array.isArray(job.pipeline_stages) && job.pipeline_stages.length > 0)
    ? job.pipeline_stages 
    : DEFAULT_STAGES;

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
    // Aggiornamento ottimistico UI
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipeline_stage: newStage } : c));
    
    const stageConfig = currentStages.find((s:any) => s.id === newStage);
    const emailConfig = stageConfig ? { autoEmail: stageConfig.autoEmail, emailSubject: stageConfig.emailSubject, emailBody: stageConfig.emailBody } : undefined;
    
    // Server action con email integrata
    await moveCandidatePipeline(candidateId, newStage, emailConfig);
  }

  async function handleChecklistToggle(field: string, value: boolean) {
    if (!selectedCandidate) return;
    
    // Optimistic UI update
    const updatedCandidate = { ...selectedCandidate, [field]: value };
    setSelectedCandidate(updatedCandidate);
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updatedCandidate : c));
    
    // DB Update
    await updateCandidateChecklist(selectedCandidate.id, field, value);
  }

  async function handleSaveNotes() {
    if (!selectedCandidate) return;
    setSavingNotes(true);
    
    await updateCandidateNotes(selectedCandidate.id, notesTemp);
    
    const updatedCandidate = { ...selectedCandidate, internal_notes: notesTemp };
    setSelectedCandidate(updatedCandidate);
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updatedCandidate : c));
    setSavingNotes(false);
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

  function handleOpenSettings() {
    const currentStages = (job?.pipeline_stages && Array.isArray(job.pipeline_stages) && job.pipeline_stages.length > 0)
      ? JSON.parse(JSON.stringify(job.pipeline_stages))
      : JSON.parse(JSON.stringify(DEFAULT_STAGES));
    
    const currentFormSchema = (job?.form_schema && Array.isArray(job.form_schema))
      ? JSON.parse(JSON.stringify(job.form_schema))
      : [];

    setEditingStages(currentStages);
    setEditingFormSchema(currentFormSchema);
    setActiveTab('pipeline');
    setIsSettingsOpen(true);
  }

  async function handleSaveStages() {
    setSavingStages(true);
    await updateJobPipelineStages(jobId, editingStages);
    await updateJobFormSchema(jobId, editingFormSchema);
    await loadData();
    setSavingStages(false);
    setIsSettingsOpen(false);
  }

  // --- FORM BUILDER LOGIC ---
  function handleAddField(type: string) {
    setEditingFormSchema([...editingFormSchema, { 
      id: 'field_' + Date.now(), 
      type, 
      label: 'Nuova Domanda', 
      required: false,
      options: type === 'select' ? ['Opzione 1', 'Opzione 2'] : undefined
    }]);
  }

  function handleUpdateField(index: number, field: string, value: any) {
    const newSchema = [...editingFormSchema];
    newSchema[index][field] = value;
    setEditingFormSchema(newSchema);
  }

  function handleRemoveField(index: number) {
    const newSchema = [...editingFormSchema];
    newSchema.splice(index, 1);
    setEditingFormSchema(newSchema);
  }

  function moveField(index: number, direction: 'up'|'down') {
    const newSchema = [...editingFormSchema];
    if (direction === 'up' && index > 0) {
      const temp = newSchema[index - 1];
      newSchema[index - 1] = newSchema[index];
      newSchema[index] = temp;
    } else if (direction === 'down' && index < newSchema.length - 1) {
      const temp = newSchema[index + 1];
      newSchema[index + 1] = newSchema[index];
      newSchema[index] = temp;
    }
    setEditingFormSchema(newSchema);
  }
  // --- END FORM BUILDER LOGIC ---

  function handleAddStage() {
    setEditingStages([...editingStages, { id: 'stage_' + Date.now(), name: 'Nuovo Step', color: '#94a3b8', definition: '' }]);
  }

  function handleUpdateStage(index: number, field: string, value: any) {
    const newStages = [...editingStages];
    newStages[index][field] = value;
    setEditingStages(newStages);
  }

  function handleRemoveStage(index: number) {
    if (confirm("Sei sicuro di eliminare questo step? I candidati al suo interno non saranno più visibili finché non li sposti.")) {
      const newStages = [...editingStages];
      newStages.splice(index, 1);
      setEditingStages(newStages);
    }
  }

  function moveStage(index: number, direction: 'up'|'down') {
    const newStages = [...editingStages];
    if (direction === 'up' && index > 0) {
      const temp = newStages[index - 1];
      newStages[index - 1] = newStages[index];
      newStages[index] = temp;
    } else if (direction === 'down' && index < newStages.length - 1) {
      const temp = newStages[index + 1];
      newStages[index + 1] = newStages[index];
      newStages[index] = temp;
    }
    setEditingStages(newStages);
  }

  const breadcrumb = job ? `${job.structure?.client?.name} › ${job.structure?.name} › ${job.title}` : '...';

  return (
    <DashboardShell>
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> {breadcrumb}
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Pipeline: {job?.title || '...'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{candidates.length} candidati totali · Trascina le card per spostare i candidati tra le fasi</p>
          </div>
          <button onClick={handleOpenSettings} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            ⚙️ Impostazioni Pipeline
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '2rem', minHeight: '60vh' }}>
        {currentStages.map((stage: any) => {
          const stageRawId = stage.id || stage.key;
          const stageCards = candidates.filter(c => c.pipeline_stage === stageRawId || (stageRawId === 'received' && !c.pipeline_stage));
          return (
            <div 
              key={stageRawId}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stageRawId)}
                style={{ 
                  minWidth: 260, 
                  maxWidth: 280,
                  flex: '0 0 260px',
                  background: stage.color || '#1e293b', 
                  borderRadius: 12, 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, flex: 1, color: '#ffffff', textShadow: '0px 1px 2px rgba(0,0,0,0.4)' }}>{stage.name || stage.label}</span>
                    <span style={{ fontSize: '0.75rem', color: '#ffffff', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.5rem', borderRadius: 99 }}>{stageCards.length}</span>
                  </div>
                  {stage.definition && (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, marginTop: '0.2rem' }}>
                      ℹ️ {stage.definition}
                    </div>
                  )}
                </div>

              {/* Cards */}
              {stageCards.map(candidate => (
                <div 
                  key={candidate.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, candidate.id)}
                  onClick={() => { setSelectedCandidate(candidate); setNotesTemp(candidate.internal_notes || ''); }}
                  style={{ 
                    background: '#22272b', 
                    border: '1px solid #3b424a', 
                    borderRadius: 8, 
                    padding: '0.85rem',
                    cursor: 'grab',
                    transition: 'all 0.15s',
                    boxShadow: '0 1px 1px #091e4240',
                    color: '#e2e8f0'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#3b424a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <User size={14} style={{ color: (stage.color && stage.color !== '#1e293b' && stage.color !== '#000000') ? stage.color : '#94a3b8' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>{candidate.first_name} {candidate.last_name}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{candidate.email}</div>
                  {candidate.phone && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{candidate.phone}</div>}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {candidate.cv_file_path && (
                      <span style={{ fontSize: '0.65rem', background: '#1e3a8a', color: '#60a5fa', padding: '0.15rem 0.4rem', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                        📎 CV
                      </span>
                    )}
                    {candidate.questionnaire_responses && Object.keys(candidate.questionnaire_responses).length > 0 && (
                      <span style={{fontSize: '0.65rem', background: '#78350f', color: '#fbbf24', padding: '0.15rem 0.4rem', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
                        📝 Form
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {stageCards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8 }}>
                  Trascina qui i candidati
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Candidate Modal (Checklist & Notes) */}
      {selectedCandidate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 500, background: 'var(--bg-primary)', height: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedCandidate.first_name} {selectedCandidate.last_name}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedCandidate.email} {selectedCandidate.phone && `• ${selectedCandidate.phone}`}</div>
                <span style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: currentStages.find((s:any) => (s.id || s.key) === selectedCandidate.pipeline_stage)?.color + '20', color: currentStages.find((s:any) => (s.id || s.key) === selectedCandidate.pipeline_stage)?.color }}>
                  Fase: {currentStages.find((s:any) => (s.id || s.key) === selectedCandidate.pipeline_stage)?.name || currentStages.find((s:any) => (s.id || s.key) === selectedCandidate.pipeline_stage)?.label || 'Bozza'}
                </span>
              </div>
              <button onClick={() => setSelectedCandidate(null)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Trello Checklist Replica */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={18} style={{ color: 'var(--accent-primary)' }}/> Checklist Operativa
                </h3>
                
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedCandidate.checklist_msg1_sent} onChange={(e) => handleChecklistToggle('checklist_msg1_sent', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                    <span style={{ flex: 1, fontSize: '0.9rem', color: selectedCandidate.checklist_msg1_sent ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: selectedCandidate.checklist_msg1_sent ? 'line-through' : 'none' }}>Invio 1° messaggio per compilazione questionario</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedCandidate.checklist_msg2_sent} onChange={(e) => handleChecklistToggle('checklist_msg2_sent', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                    <span style={{ flex: 1, fontSize: '0.9rem', color: selectedCandidate.checklist_msg2_sent ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: selectedCandidate.checklist_msg2_sent ? 'line-through' : 'none' }}>Invio 2° messaggio (promemoria questionario)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedCandidate.checklist_quest_done} onChange={(e) => handleChecklistToggle('checklist_quest_done', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                    <span style={{ flex: 1, fontSize: '0.9rem', color: selectedCandidate.checklist_quest_done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: selectedCandidate.checklist_quest_done ? 'line-through' : 'none' }}>Questionario Compilato (dal candidato)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedCandidate.checklist_remind_cv} onChange={(e) => handleChecklistToggle('checklist_remind_cv', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                    <span style={{ flex: 1, fontSize: '0.9rem', color: selectedCandidate.checklist_remind_cv ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: selectedCandidate.checklist_remind_cv ? 'line-through' : 'none' }}>Invio promemoria per invio CV e lettera</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedCandidate.checklist_cv_done} onChange={(e) => handleChecklistToggle('checklist_cv_done', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }} />
                    <span style={{ flex: 1, fontSize: '0.9rem', color: selectedCandidate.checklist_cv_done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: selectedCandidate.checklist_cv_done ? 'line-through' : 'none' }}>Inviato CV e lettera motivazionale (dal candidato)</span>
                  </label>

                </div>
              </div>

              {/* Note / Motivazione Scarto */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }}/> Note e Motivazioni (In linea / Scarto)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea 
                    value={notesTemp}
                    onChange={(e) => setNotesTemp(e.target.value)}
                    placeholder="Scrivi qui eventuali note rilevanti o il motivo dello scarto se non in linea..."
                    style={{ width: '100%', minHeight: 120, padding: '1rem', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', resize: 'vertical', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSaveNotes}
                      disabled={savingNotes || notesTemp === (selectedCandidate.internal_notes || '')}
                      style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: (savingNotes || notesTemp === (selectedCandidate.internal_notes || '')) ? 0.5 : 1 }}
                    >
                      {savingNotes ? 'Salvataggio...' : 'Salva Note'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Configurazione Job</h2>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setActiveTab('pipeline')}
                style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'pipeline' ? 'var(--accent-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'pipeline' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
              >
                1. Pipeline
              </button>
              <button 
                onClick={() => setActiveTab('form')}
                style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'form' ? 'var(--accent-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'form' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
              >
                2. Modulo Candidatura (Form)
              </button>
            </div>

            {activeTab === 'pipeline' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Definisci i passaggi del processo di selezione per questa specifica mansione. 
                  Puoi aggiungere una <strong>Spiegazione del passaggio</strong> per allineare tutto il team sulle procedure da seguire.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {editingStages.map((stage, index) => (
                    <div key={index} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <button onClick={() => moveStage(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>⬆️</button>
                        <button onClick={() => moveStage(index, 'down')} disabled={index === editingStages.length - 1} style={{ background: 'none', border: 'none', cursor: index === editingStages.length - 1 ? 'not-allowed' : 'pointer', opacity: index === editingStages.length - 1 ? 0.3 : 1 }}>⬇️</button>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="color" 
                            value={stage.color || '#cccccc'} 
                            onChange={(e) => handleUpdateStage(index, 'color', e.target.value)}
                            style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          />
                          <input 
                            type="text" 
                            value={stage.name || stage.label || ''} 
                            onChange={(e) => handleUpdateStage(index, 'name', e.target.value)}
                            placeholder="Nome del passaggio (es. 1° Colloquio Tecnico)"
                            style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}
                          />
                        </div>
                        <textarea 
                          value={stage.definition || ''} 
                          onChange={(e) => handleUpdateStage(index, 'definition', e.target.value)}
                          placeholder="Spiegazione chiara delle azioni da compiere in questo step (es. Inviare email con questionario tecnico e attendere risposta in 48h)..."
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', resize: 'vertical', minHeight: 60, fontSize: '0.85rem' }}
                        />
                        
                        <div style={{ marginTop: '0.2rem', background: stage.autoEmail ? 'var(--bg-primary)' : 'transparent', border: stage.autoEmail ? '1px solid var(--accent-primary)' : '1px dashed var(--border-primary)', padding: '0.75rem', borderRadius: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: stage.autoEmail ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            <input 
                              type="checkbox" 
                              checked={!!stage.autoEmail} 
                              onChange={(e) => handleUpdateStage(index, 'autoEmail', e.target.checked)}
                              style={{ width: 16, height: 16 }}
                            />
                            ✉️ Invia Email Automatica all'ingresso
                          </label>
                          
                          {stage.autoEmail && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                              <input 
                                type="text" 
                                value={stage.emailSubject || ''} 
                                onChange={(e) => handleUpdateStage(index, 'emailSubject', e.target.value)}
                                placeholder="Oggetto dell'email (es. Prossimo Step nella Selezione)"
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontSize: '0.85rem' }}
                              />
                              <textarea 
                                value={stage.emailBody || ''} 
                                onChange={(e) => handleUpdateStage(index, 'emailBody', e.target.value)}
                                placeholder="Testo dell'email. Usa {Nome} per salutare automaticamente il candidato..."
                                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minHeight: 80, resize: 'vertical', fontSize: '0.85rem' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <button onClick={() => handleRemoveStage(index)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-1rem', marginBottom: '2rem' }}>
                  <button onClick={handleAddStage} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px dashed var(--border-primary)', color: 'var(--text-primary)', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                    + Aggiungi Step Pipeline
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Costruisci il form dinamico per la candidatura. Nome, Cognome, Email, Telefono e Upload del CV sono già inclusi di default e non c'è bisogno di aggiungerli qui.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {editingFormSchema.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <button onClick={() => moveField(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>⬆️</button>
                        <button onClick={() => moveField(index, 'down')} disabled={index === editingFormSchema.length - 1} style={{ background: 'none', border: 'none', cursor: index === editingFormSchema.length - 1 ? 'not-allowed' : 'pointer', opacity: index === editingFormSchema.length - 1 ? 0.3 : 1 }}>⬇️</button>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <select 
                            value={field.type} 
                            onChange={(e) => handleUpdateField(index, 'type', e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}
                          >
                            <option value="text">Testo Breve</option>
                            <option value="textarea">Paragrafo lungo</option>
                            <option value="select">Scelta Multipla a tendina</option>
                            <option value="checkbox">Checkbox (Vero/Falso)</option>
                            <option value="file">Upload File</option>
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                            <input type="checkbox" checked={field.required} onChange={(e) => handleUpdateField(index, 'required', e.target.checked)} />
                            Obbligatorio
                          </label>
                        </div>

                        <input 
                          type="text" 
                          value={field.label} 
                          onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                          placeholder="Scrivi qui la domanda o il titolo del campo..."
                          style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', fontWeight: 600 }}
                        />

                        {field.type === 'select' && (
                          <div style={{ padding: '0.75rem', background: 'var(--bg-primary)', border: '1px dashed var(--border-primary)', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Opzioni Aggiuntive (Separate da virgola)</div>
                            <input 
                              type="text" 
                              value={(field.options || []).join(', ')} 
                              onChange={(e) => handleUpdateField(index, 'options', e.target.value.split(',').map((s:string)=>s.trim()).filter((s:string)=>s))} 
                              placeholder="Opzione 1, Opzione 2, Opzione 3"
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}
                            />
                          </div>
                        )}
                      </div>

                      <button onClick={() => handleRemoveField(index)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {editingFormSchema.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border-primary)', borderRadius: 8 }}>
                      Nessuna domanda aggiuntiva configurata. Il form richiederà solo dati standard.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '-1rem', marginBottom: '2rem' }}>
                  <button onClick={() => handleAddField('text')} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>+ Testo</button>
                  <button onClick={() => handleAddField('textarea')} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>+ Paragrafo</button>
                  <button onClick={() => handleAddField('select')} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>+ Scelta Multipla</button>
                  <button onClick={() => handleAddField('checkbox')} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>+ Checkbox</button>
                  <button onClick={() => handleAddField('file')} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>+ File</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              
              <button 
                onClick={handleSaveStages} 
                disabled={savingStages}
                style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, opacity: savingStages ? 0.7 : 1 }}
              >
                {savingStages ? 'Salvataggio...' : 'Salva Modifiche (Tutto)'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
