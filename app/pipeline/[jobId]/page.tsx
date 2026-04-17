'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../components/DashboardShell';
import { createSupabaseClient } from '@/lib/supabase';
import {
  ArrowLeft, X, CheckSquare, MessageSquare, MoreHorizontal,
  Plus, Pencil, Trash2, ChevronRight, User, Save,
  FileText, Download, ExternalLink, ClipboardList,
  Mail, Phone, ChevronDown
} from 'lucide-react';
import {
  updateCandidateChecklist,
  updateCandidateNotes,
  updateJobPipelineStages,
  updateJobFormSchema,
  moveCandidatePipeline,
  addManualCandidate,
  getCvSignedUrl,
  updateJobChecklistLabels,
  updateJobPublicDescription
} from '../../adminActions';

const DEFAULT_STAGES = [
  { id: 'received',       name: 'Candidature ricevute (Ancora in screening)', color: '#3b82f6', definition: "Qui trovi tutti coloro che si sono candidati all'offerta. Non hanno ancora inviato i propri dati, e sono quindi ancora da valutare." },
  { id: 'first_selection',name: '1° Selezione (Questionario compilato)',       color: '#f59e0b', definition: 'Qui trovi i candidati che hanno inviato i propri dati tramite il questionario, ma non ancora il CV. Sono ancora da valutare.' },
  { id: 'to_contact',     name: 'Selezionati DA CONTATTARE',                  color: '#22c55e', definition: 'Qui trovi i candidati che hanno superato tutti gli step e sono da contattare. Dentro ciascun candidato trovi in allegato le risposte del questionario e il cv.' },
  { id: 'stand_by',       name: 'STAND BY (In attesa di decisione)',           color: '#f97316', definition: 'Qui puoi spostare i candidati che sono stati contattati e che sono in fase di vostra valutazione.' },
  { id: 'rejected',       name: 'SCARTATI (Non in linea)',                    color: '#ef4444', definition: "Qui trovi i candidati scartati. Nella descrizione di ciascun candidato c'è la motivazione." },
  { id: 'selected',       name: 'SELEZIONATO ✅',                             color: '#10b981', definition: 'Qui puoi spostare i candidati che sono stati selezionati.' }
];

const DEFAULT_CHECKLIST_LABELS = [
  'Invio 1° messaggio per compilazione questionario',
  'Invio 2° messaggio (promemoria questionario)',
  'Questionario compilato (dal candidato)',
  'Invio promemoria per invio CV e lettera',
  'CV e lettera motivazionale inviati (dal candidato)',
];

// ─── Colori gradienti per le colonne ──────────────────────────────────────────
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function PipelinePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();

  const [job,               setJob]               = useState<any>(null);
  const [candidates,        setCandidates]        = useState<any[]>([]);
  const [draggedId,         setDraggedId]         = useState<string | null>(null);
  const [dragOverStage,     setDragOverStage]     = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [notesTemp,         setNotesTemp]         = useState('');
  const [savingNotes,       setSavingNotes]       = useState(false);

  // Settings modal
  const [isSettingsOpen,   setIsSettingsOpen]   = useState(false);
  const [editingStages,    setEditingStages]    = useState<any[]>([]);
  const [editingFormSchema,setEditingFormSchema]= useState<any[]>([]);
  const [savingStages,     setSavingStages]     = useState(false);
  const [activeTab,        setActiveTab]        = useState<'pipeline'|'form'|'checklist'|'description'>('pipeline');
  const [editingPublicDesc, setEditingPublicDesc] = useState('');

  // CV + questionario
  const [cvUrl,            setCvUrl]            = useState<string | null>(null);
  const [checklistOpen,    setChecklistOpen]    = useState(false);
  const [cvLoading,        setCvLoading]        = useState(false);

  // Checklist labels edit
  const [editingChecklistLabels, setEditingChecklistLabels] = useState<string[]>([]);
  const [savingChecklist,        setSavingChecklist]        = useState(false);

  // 3-dot column menu
  const [openMenuStageId,  setOpenMenuStageId]  = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Inline edit column name / definition
  const [editingColId,   setEditingColId]   = useState<string | null>(null);
  const [editColName,    setEditColName]    = useState('');
  const [editColDef,     setEditColDef]     = useState('');
  const [savingCol,      setSavingCol]      = useState(false);

  // "+ Aggiungi scheda" inline form per colonna
  const [addCardStageId, setAddCardStageId] = useState<string | null>(null);
  const [addFirstName,   setAddFirstName]   = useState('');
  const [addLastName,    setAddLastName]    = useState('');
  const [addEmail,       setAddEmail]       = useState('');
  const [addingCard,     setAddingCard]     = useState(false);

  const currentStages = (job?.pipeline_stages && Array.isArray(job.pipeline_stages) && job.pipeline_stages.length > 0)
    ? job.pipeline_stages
    : DEFAULT_STAGES;

  useEffect(() => { loadData(); }, [jobId]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuStageId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadData() {
    const sb = createSupabaseClient();
    const { data: jobData } = await sb
      .from('job_positions')
      .select('*, structure:structures(id, name, client_id, client:clients(id, name))')
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
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, pipeline_stage: newStage } : c));
    const stageConfig = currentStages.find((s:any) => s.id === newStage);
    const emailConfig = stageConfig
      ? { autoEmail: stageConfig.autoEmail, emailSubject: stageConfig.emailSubject, emailBody: stageConfig.emailBody }
      : undefined;
    await moveCandidatePipeline(candidateId, newStage, emailConfig);
  }

  async function handleChecklistToggle(field: string, value: boolean) {
    if (!selectedCandidate) return;
    const updated = { ...selectedCandidate, [field]: value };
    setSelectedCandidate(updated);
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updated : c));
    await updateCandidateChecklist(selectedCandidate.id, field, value);
  }

  async function openCandidate(candidate: any) {
    setSelectedCandidate(candidate);
    setNotesTemp(candidate.internal_notes || '');
    setCvUrl(null);
    if (candidate.cv_file_path) {
      setCvLoading(true);
      try {
        const sb = createSupabaseClient();
        const { data, error } = await sb.storage
          .from('resumes')
          .createSignedUrl(candidate.cv_file_path, 3600);
        if (error) throw error;
        setCvUrl(data.signedUrl);
      } catch (e) {
        console.error('CV URL error:', e);
        setCvUrl(null);
      } finally {
        setCvLoading(false);
      }
    }
  }


  async function handleSaveNotes() {
    if (!selectedCandidate) return;
    setSavingNotes(true);
    await updateCandidateNotes(selectedCandidate.id, notesTemp);
    const updated = { ...selectedCandidate, internal_notes: notesTemp };
    setSelectedCandidate(updated);
    setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updated : c));
    setSavingNotes(false);
  }

  // Drag & Drop
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOverStage(stageId);
    e.dataTransfer.dropEffect = 'move';
  }
  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (draggedId) { moveCandidate(draggedId, stage); setDraggedId(null); }
    setDragOverStage(null);
  }
  function handleDragEnd() { setDraggedId(null); setDragOverStage(null); }

  // Settings
  function handleOpenSettings(tab: 'pipeline'|'form'|'checklist'|'description' = 'pipeline') {
    const s = (job?.pipeline_stages && Array.isArray(job.pipeline_stages) && job.pipeline_stages.length > 0)
      ? JSON.parse(JSON.stringify(job.pipeline_stages))
      : JSON.parse(JSON.stringify(DEFAULT_STAGES));
    const f = (job?.form_schema && Array.isArray(job.form_schema))
      ? JSON.parse(JSON.stringify(job.form_schema))
      : [];
    const cl = (job?.checklist_labels && Array.isArray(job.checklist_labels) && job.checklist_labels.length === 5)
      ? [...job.checklist_labels]
      : [...DEFAULT_CHECKLIST_LABELS];
    setEditingStages(s);
    setEditingFormSchema(f);
    setEditingChecklistLabels(cl);
    setEditingPublicDesc(job?.public_description || '');
    setActiveTab(tab);
    setIsSettingsOpen(true);
  }

  async function handleSaveStages() {
    setSavingStages(true);
    let r1 = await updateJobPipelineStages(jobId, editingStages);
    let r2 = await updateJobFormSchema(jobId, editingFormSchema);
    let r3 = await updateJobChecklistLabels(jobId, editingChecklistLabels);
    let r4 = await updateJobPublicDescription(jobId, editingPublicDesc);
    await loadData();
    setSavingStages(false);
    
    if (r1?.error || r2?.error || r3?.error || r4?.error) {
      alert("Si è verificato un errore durante il salvataggio dei dati: " + (r1?.error || r2?.error || r3?.error || r4?.error));
    } else {
      setIsSettingsOpen(false);
    }
  }

  // Inline col edit (from 3-dot menu)
  function openColEdit(stage: any) {
    setOpenMenuStageId(null);
    setEditingColId(stage.id);
    setEditColName(stage.name || stage.label || '');
    setEditColDef(stage.definition || '');
  }

  async function handleSaveColEdit() {
    if (!editingColId) return;
    setSavingCol(true);
    const newStages = currentStages.map((s: any) =>
      s.id === editingColId ? { ...s, name: editColName, definition: editColDef } : s
    );
    await updateJobPipelineStages(jobId, newStages);
    await loadData();
    setEditingColId(null);
    setSavingCol(false);
  }

  // "+ Aggiungi scheda"
  function openAddCard(stageId: string) {
    setAddCardStageId(stageId);
    setAddFirstName('');
    setAddLastName('');
    setAddEmail('');
  }

  async function handleAddCard(stageId: string) {
    if (addingCard || !addFirstName.trim() || !addLastName.trim()) return;
    setAddingCard(true);
    await addManualCandidate(jobId, addFirstName.trim(), addLastName.trim(), addEmail.trim(), stageId);
    await loadData();
    setAddFirstName('');
    setAddLastName('');
    setAddEmail('');
    setAddCardStageId(null);
    setAddingCard(false);
  }

  // Form builder helpers
  function handleAddField(type: string) {
    setEditingFormSchema([...editingFormSchema, {
      id: 'field_' + Date.now(), type, label: 'Nuova Domanda', required: false,
      options: type === 'select' ? ['Opzione 1', 'Opzione 2'] : undefined
    }]);
  }
  function handleUpdateField(i: number, field: string, value: any) {
    const n = [...editingFormSchema]; n[i][field] = value; setEditingFormSchema(n);
  }
  function handleRemoveField(i: number) {
    const n = [...editingFormSchema]; n.splice(i,1); setEditingFormSchema(n);
  }
  function moveField(i: number, dir: 'up'|'down') {
    const n = [...editingFormSchema];
    if (dir==='up'&&i>0){const t=n[i-1];n[i-1]=n[i];n[i]=t;}
    else if (dir==='down'&&i<n.length-1){const t=n[i+1];n[i+1]=n[i];n[i]=t;}
    setEditingFormSchema(n);
  }
  function handleAddStage() {
    setEditingStages([...editingStages, { id:'stage_'+Date.now(), name:'Nuovo Step', color:'#6366f1', definition:'' }]);
  }
  function handleUpdateStage(i: number, field: string, value: any) {
    const n=[...editingStages]; n[i][field]=value; setEditingStages(n);
  }
  function handleRemoveStage(i: number) {
    if (confirm('Eliminare questo step? I candidati al suo interno non saranno più visibili.')) {
      const n=[...editingStages]; n.splice(i,1); setEditingStages(n);
    }
  }
  function moveStage(i: number, dir: 'up'|'down') {
    const n=[...editingStages];
    if (dir==='up'&&i>0){const t=n[i-1];n[i-1]=n[i];n[i]=t;}
    else if (dir==='down'&&i<n.length-1){const t=n[i+1];n[i+1]=n[i];n[i]=t;}
    setEditingStages(n);
  }

  const clientId   = job?.structure?.client_id;
  const clientName = job?.structure?.client?.name;
  const breadcrumb = job
    ? `${clientName} › ${job.structure?.name} › ${job.title}`
    : '...';

  return (
    <DashboardShell>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .kanban-card:hover { outline: 2px solid #579dff !important; }
        .col-menu-btn { opacity: 0; transition: opacity 0.15s; }
        .kanban-col:hover .col-menu-btn { opacity: 1; }
        .add-card-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.6rem; border-radius: 6px;
          color: #9eaab5; font-size: 0.82rem; font-weight: 500;
          cursor: pointer; transition: background 0.15s, color 0.15s;
          background: transparent; border: none; width: 100%;
        }
        .add-card-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .settings-tab { 
          padding: 0.5rem 1.2rem; background: none; border: none; cursor: pointer;
          font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => clientId ? router.push(`/clients/${clientId}`) : router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.82rem', padding: 0 }}
        >
          <ArrowLeft size={14} />
          <span style={{ opacity: 0.7 }}>{breadcrumb}</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
              Pipeline: <span style={{ color: 'var(--accent-primary)' }}>{job?.title || '...'}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 99, padding: '0.1rem 0.6rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                {candidates.length}
              </span>
              candidati totali · Trascina le card per spostare tra le fasi
            </p>
          </div>
          <button
            onClick={() => handleOpenSettings()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            ⚙️ Impostazioni Pipeline
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '2rem', minHeight: '70vh', alignItems: 'flex-start' }}>
        {currentStages.map((stage: any, stageIndex: number) => {
          const sid = stage.id || stage.key;
          const allStageIds = currentStages.map((s: any) => s.id || s.key);
          const isFirstCol = stageIndex === 0;
          const stageCards = candidates.filter(c => {
            if (c.pipeline_stage === sid) return true;
            // Candidati senza stage O con stage orfano (non più esistente) → prima colonna
            if (isFirstCol && (!c.pipeline_stage || !allStageIds.includes(c.pipeline_stage))) return true;
            return false;
          });
          const isDragTarget = dragOverStage === sid;
          const stageColor  = stage.color || '#6366f1';
          const isEditingThisCol = editingColId === sid;

          return (
            <div
              key={sid}
              className="kanban-col"
              onDragOver={e => handleDragOver(e, sid)}
              onDrop={e => handleDrop(e, sid)}
              onDragLeave={() => setDragOverStage(null)}
              style={{
                minWidth: 270, maxWidth: 270,
                flex: '0 0 270px',
                background: isDragTarget
                  ? `linear-gradient(180deg, ${hexToRgba(stageColor, 0.18)} 0%, #0d1117 100%)`
                  : '#0d1117',
                borderRadius: 14,
                border: isDragTarget
                  ? `2px solid ${hexToRgba(stageColor, 0.6)}`
                  : '2px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'border-color 0.2s, background 0.2s',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {/* Accent top bar */}
              <div style={{ height: 4, background: stageColor, borderRadius: '12px 12px 0 0', flexShrink: 0 }} />

              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0.75rem 0.5rem 0.875rem', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c7d0db', letterSpacing: '0.02em', lineHeight: 1.3 }}>
                      {stage.name || stage.label}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, background: hexToRgba(stageColor, 0.22), color: stageColor, padding: '0.05rem 0.45rem', borderRadius: 99 }}>
                      {stageCards.length}
                    </span>
                  </div>
                </div>

                {/* 3-dot menu */}
                <div style={{ position: 'relative', flexShrink: 0 }} ref={openMenuStageId === sid ? menuRef : undefined}>
                  <button
                    className="col-menu-btn"
                    onClick={() => setOpenMenuStageId(openMenuStageId === sid ? null : sid)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9eaab5', borderRadius: 6, padding: '0.2rem 0.3rem', display: 'flex', alignItems: 'center' }}
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {openMenuStageId === sid && (
                    <div style={{
                      position: 'absolute', top: '110%', right: 0, zIndex: 500,
                      background: '#1e2630', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      minWidth: 190, overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease-out'
                    }}>
                      <button
                        onClick={() => openColEdit(stage)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#c7d0db', fontSize: '0.85rem', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background='none')}
                      >
                        <Pencil size={14} /> Modifica testo e commento
                      </button>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0.5rem' }} />
                      <button
                        onClick={() => openAddCard(sid)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#c7d0db', fontSize: '0.85rem', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background='none')}
                      >
                        <Plus size={14} /> Aggiungi candidato
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Definition box */}
              {stage.definition && !isEditingThisCol && (
                <div style={{ margin: '0 0.75rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.55rem 0.7rem', color: '#7a8fa6', fontSize: '0.73rem', lineHeight: 1.45 }}>
                  {stage.definition}
                </div>
              )}

              {/* ── Inline edit modal per colonna ── */}
              {isEditingThisCol && (
                <div style={{ margin: '0 0.75rem 0.75rem', background: '#1a2235', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', animation: 'fadeIn 0.15s' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9eaab5', marginBottom: '0.1rem' }}>Modifica colonna</div>
                  <input
                    autoFocus
                    value={editColName}
                    onChange={e => setEditColName(e.target.value)}
                    placeholder="Nome colonna"
                    style={{ padding: '0.5rem 0.7rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1117', color: '#e2e8f0', fontSize: '0.85rem', width: '100%' }}
                  />
                  <textarea
                    value={editColDef}
                    onChange={e => setEditColDef(e.target.value)}
                    placeholder="Descrizione / commento della colonna..."
                    rows={3}
                    style={{ padding: '0.5rem 0.7rem', borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)', background: '#0d1117', color: '#e2e8f0', fontSize: '0.8rem', resize: 'vertical', width: '100%' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleSaveColEdit}
                      disabled={savingCol}
                      style={{ flex: 1, padding: '0.45rem', background: '#4f46e5', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      <Save size={13} /> {savingCol ? '...' : 'Salva'}
                    </button>
                    <button
                      onClick={() => setEditingColId(null)}
                      style={{ padding: '0.45rem 0.7rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#9eaab5', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0 0.5rem', overflowY: 'auto', flex: 1 }}>
                {stageCards.map(candidate => {
                  const checkDone = [
                    candidate.checklist_msg1_sent,
                    candidate.checklist_msg2_sent,
                    candidate.checklist_quest_done,
                    candidate.checklist_remind_cv,
                    candidate.checklist_cv_done
                  ].filter(Boolean).length;
                  const isDragging = draggedId === candidate.id;

                  return (
                    <div
                      key={candidate.id}
                      className="kanban-card"
                      draggable
                      onDragStart={e => handleDragStart(e, candidate.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openCandidate(candidate)}
                      style={{
                        background: '#1c2333',
                        borderRadius: 9,
                        padding: '0.7rem 0.75rem',
                        cursor: 'grab',
                        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.3)',
                        color: '#b6c2cf',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        opacity: isDragging ? 0.4 : 1,
                        transition: 'opacity 0.15s',
                        outline: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: hexToRgba(stageColor, 0.18), border: `1px solid ${hexToRgba(stageColor, 0.35)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color={stageColor} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.84rem', color: '#dde4ed', lineHeight: 1.3 }}>
                          {candidate.first_name} {candidate.last_name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: checkDone === 5 ? '#22c55e' : '#6b7a90' }}>
                          <CheckSquare size={12} />
                          <span style={{ fontWeight: 600 }}>{checkDone}/5</span>
                        </div>
                        {candidate.cv_file_path && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#4ade80' }} title="CV allegato">
                            <FileText size={12} />
                            <span>CV</span>
                          </div>
                        )}
                        {candidate.internal_notes && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#6b7a90' }}>
                            <MessageSquare size={12} />
                          </div>
                        )}
                        <ChevronRight size={11} style={{ marginLeft: 'auto', color: '#4a5568' }} />
                      </div>
                    </div>
                  );
                })}

                {/* Inline Add Card form */}
                {addCardStageId === sid && (
                  <div style={{ background: '#1c2333', borderRadius: 9, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid rgba(99,102,241,0.4)', animation: 'fadeIn 0.15s' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9eaab5', marginBottom: '0.1rem' }}>Nuovo candidato</div>
                    <input
                      autoFocus
                      value={addFirstName}
                      onChange={e => setAddFirstName(e.target.value)}
                      placeholder="Nome *"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1117', color: '#e2e8f0', fontSize: '0.82rem', width: '100%' }}
                    />
                    <input
                      value={addLastName}
                      onChange={e => setAddLastName(e.target.value)}
                      placeholder="Cognome *"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1117', color: '#e2e8f0', fontSize: '0.82rem', width: '100%' }}
                    />
                    <input
                      value={addEmail}
                      onChange={e => setAddEmail(e.target.value)}
                      placeholder="Email (opzionale)"
                      type="email"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0d1117', color: '#e2e8f0', fontSize: '0.82rem', width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleAddCard(sid)}
                        disabled={addingCard || !addFirstName.trim() || !addLastName.trim()}
                        style={{ flex: 1, padding: '0.45rem', background: '#4f46e5', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: (!addFirstName.trim() || !addLastName.trim()) ? 0.5 : 1 }}
                      >
                        {addingCard ? '...' : '+ Aggiungi'}
                      </button>
                      <button
                        onClick={() => setAddCardStageId(null)}
                        style={{ padding: '0.45rem 0.6rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#9eaab5', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* "+ Aggiungi una scheda" bottom button */}
              {addCardStageId !== sid && (
                <div style={{ padding: '0.5rem 0.5rem 0.625rem', flexShrink: 0 }}>
                  <button
                    className="add-card-btn"
                    onClick={() => { setOpenMenuStageId(null); openAddCard(sid); }}
                  >
                    <Plus size={14} /> Aggiungi una scheda
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Candidate Detail Panel ── */}
      {selectedCandidate && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setSelectedCandidate(null); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}
        >
          <div style={{ width: '100%', maxWidth: 520, background: '#0b1120', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.28s ease-out' }}>

            {/* Panel Header */}
            <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                      {selectedCandidate.first_name?.[0]}{selectedCandidate.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.15rem' }}>
                      {selectedCandidate.first_name} {selectedCandidate.last_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {selectedCandidate.email && (
                        <a
                          href={`mailto:${selectedCandidate.email}`}
                          onClick={e => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: '#818cf8', textDecoration: 'none', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.2)'; e.currentTarget.style.color='#a5b4fc'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.color='#818cf8'; }}
                          title="Invia email"
                        >
                          <Mail size={13} /> {selectedCandidate.email}
                        </a>
                      )}
                      {selectedCandidate.phone && (
                        <a
                          href={`tel:${selectedCandidate.phone}`}
                          onClick={e => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color: '#4ade80', textDecoration: 'none', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(34,197,94,0.2)'; e.currentTarget.style.color='#86efac'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(34,197,94,0.1)'; e.currentTarget.style.color='#4ade80'; }}
                          title="Chiama"
                        >
                          <Phone size={13} /> {selectedCandidate.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9eaab5' }}
                >
                  <X size={17} />
                </button>
              </div>

              {/* Stage badge */}
              {(() => {
                const st = currentStages.find((s:any) => (s.id||s.key) === selectedCandidate.pipeline_stage);
                const col = st?.color || '#6366f1';
                return (
                  <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.85rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: hexToRgba(col,0.18), color: col, border: `1px solid ${hexToRgba(col,0.35)}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, display: 'inline-block' }} />
                      {st?.name || st?.label || 'Sconosciuta'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>



              {/* CV Download */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9eaab5', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} style={{ color: '#4f46e5' }} /> Curriculum Vitae
                </h3>
                {selectedCandidate.cv_file_path ? (
                  cvLoading ? (
                    <div style={{ padding: '0.9rem 1rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', color: '#6b7a90', fontSize: '0.85rem' }}>Caricamento link CV...</div>
                  ) : cvUrl ? (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: 9, border: '1px solid rgba(79,70,229,0.35)', background: 'rgba(79,70,229,0.08)', color: '#818cf8', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}
                    >
                      <Download size={16} />
                      <span>Scarica / Visualizza CV</span>
                      <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                    </a>
                  ) : (
                    <div style={{ padding: '0.9rem 1rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', color: '#ef4444', fontSize: '0.85rem' }}>Errore caricamento link CV</div>
                  )
                ) : (
                  <div style={{ padding: '0.9rem 1rem', borderRadius: 9, border: '1px dashed rgba(255,255,255,0.08)', color: '#4a5568', fontSize: '0.85rem' }}>Nessun CV allegato</div>
                )}
              </div>

              {/* Risposte Questionario */}
              {selectedCandidate.questionnaire_responses && Object.keys(selectedCandidate.questionnaire_responses).length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9eaab5', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList size={16} style={{ color: '#4f46e5' }} /> Risposte Questionario
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(selectedCandidate.questionnaire_responses).map(([key, value]: [string, any]) => (
                      <div key={key} style={{ padding: '0.9rem 1rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7a90', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {/* Mostra label dal form_schema se disponibile */}
                          {job?.form_schema?.find((f: any) => f.id === key)?.label || key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#c7d0db', lineHeight: 1.5 }}>
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9eaab5', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={16} style={{ color: '#4f46e5' }} /> Note Interne
                </h3>
                <textarea
                  value={notesTemp}
                  onChange={e => setNotesTemp(e.target.value)}
                  placeholder="Scrivi note rilevanti o il motivo dello scarto..."
                  style={{ width: '100%', minHeight: 130, padding: '0.9rem 1rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', resize: 'vertical', fontSize: '0.88rem', color: '#c7d0db', lineHeight: 1.6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes || notesTemp === (selectedCandidate.internal_notes || '')}
                    style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: (savingNotes || notesTemp === (selectedCandidate.internal_notes || '')) ? 0.45 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Save size={14} /> {savingNotes ? 'Salvataggio...' : 'Salva Note'}
                  </button>
                </div>
              </div>

              {/* Checklist Operativa — collapsible */}
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setChecklistOpen(!checklistOpen)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', color: '#9eaab5' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    <CheckSquare size={15} style={{ color: '#4f46e5' }} /> Checklist Operativa
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7a90', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.45rem', borderRadius: 99 }}>
                      {[selectedCandidate.checklist_msg1_sent, selectedCandidate.checklist_msg2_sent, selectedCandidate.checklist_quest_done, selectedCandidate.checklist_remind_cv, selectedCandidate.checklist_cv_done].filter(Boolean).length}/5
                    </span>
                  </span>
                  <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: checklistOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {checklistOpen && (
                  <div style={{ padding: '0.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.3rem' }}>
                      <button
                        onClick={() => handleOpenSettings('checklist')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                        title="Modifica etichette checklist"
                      >
                        <Pencil size={11} /> Personalizza
                      </button>
                    </div>
                    {[
                      { key: 'checklist_msg1_sent',  label: (job?.checklist_labels?.[0] || DEFAULT_CHECKLIST_LABELS[0]) },
                      { key: 'checklist_msg2_sent',  label: (job?.checklist_labels?.[1] || DEFAULT_CHECKLIST_LABELS[1]) },
                      { key: 'checklist_quest_done', label: (job?.checklist_labels?.[2] || DEFAULT_CHECKLIST_LABELS[2]) },
                      { key: 'checklist_remind_cv',  label: (job?.checklist_labels?.[3] || DEFAULT_CHECKLIST_LABELS[3]) },
                      { key: 'checklist_cv_done',    label: (job?.checklist_labels?.[4] || DEFAULT_CHECKLIST_LABELS[4]) },
                    ].map(item => {
                      const done = !!selectedCandidate[item.key];
                      return (
                        <label
                          key={item.key}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.65rem 0.85rem', background: done ? 'rgba(79,70,229,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 8, cursor: 'pointer', border: `1px solid ${done ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.04)'}`, transition: 'all 0.15s' }}
                        >
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={e => handleChecklistToggle(item.key, e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: '#4f46e5', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '0.84rem', color: done ? '#7c8fa6' : '#c7d0db', textDecoration: done ? 'line-through' : 'none', transition: 'color 0.15s' }}>
                            {item.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Move to stage quick buttons */}
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9eaab5', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.9rem' }}>
                  Sposta in fase
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {currentStages.map((s: any) => {
                    const sid = s.id || s.key;
                    const isActive = selectedCandidate.pipeline_stage === sid || (!selectedCandidate.pipeline_stage && sid === 'received');
                    return (
                      <button
                        key={sid}
                        disabled={isActive}
                        onClick={async () => {
                          await moveCandidate(selectedCandidate.id, sid);
                          setSelectedCandidate({ ...selectedCandidate, pipeline_stage: sid });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 0.9rem', borderRadius: 8, border: `1px solid ${isActive ? hexToRgba(s.color||'#6366f1',0.4) : 'rgba(255,255,255,0.06)'}`, background: isActive ? hexToRgba(s.color||'#6366f1',0.12) : 'transparent', cursor: isActive ? 'default' : 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
                      >
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color || '#6366f1', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', color: isActive ? (s.color||'#818cf8') : '#9eaab5', fontWeight: isActive ? 700 : 400 }}>
                          {s.name || s.label}
                        </span>
                        {isActive && <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: s.color||'#818cf8', fontWeight: 700 }}>Attuale</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {isSettingsOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setIsSettingsOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', animation: 'fadeIn 0.2s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>⚙️ Configurazione Job</h2>
              <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {([
                { id: 'pipeline',  label: '1. Pipeline' },
                { id: 'form',      label: '2. Form Candidatura' },
                { id: 'checklist', label: '3. Checklist' },
                { id: 'description', label: '4. Testo Annuncio' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  className="settings-tab"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{ color: activeTab===tab.id ? 'var(--accent-primary)' : 'var(--text-muted)', borderBottom: activeTab===tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'pipeline' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Definisci i passaggi del processo di selezione. Puoi aggiungere una <strong>spiegazione</strong> per allineare il team.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {editingStages.map((stage, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.2rem' }}>
                        <button onClick={() => moveStage(i,'up')} disabled={i===0} style={{ background: 'none', border: 'none', cursor: i===0?'not-allowed':'pointer', opacity: i===0?0.3:1, fontSize: '0.9rem' }}>⬆️</button>
                        <button onClick={() => moveStage(i,'down')} disabled={i===editingStages.length-1} style={{ background: 'none', border: 'none', cursor: i===editingStages.length-1?'not-allowed':'pointer', opacity: i===editingStages.length-1?0.3:1, fontSize: '0.9rem' }}>⬇️</button>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input type="color" value={stage.color||'#6366f1'} onChange={e => handleUpdateStage(i,'color',e.target.value)} style={{ width: 38, height: 38, padding: 2, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                          <input type="text" value={stage.name||stage.label||''} onChange={e => handleUpdateStage(i,'name',e.target.value)} placeholder="Nome step" style={{ flex: 1, padding: '0.5rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                        </div>
                        <textarea value={stage.definition||''} onChange={e => handleUpdateStage(i,'definition',e.target.value)} placeholder="Spiegazione del passaggio..." style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', resize: 'vertical', minHeight: 56, fontSize: '0.83rem', color: 'var(--text-primary)' }} />
                        <div style={{ background: stage.autoEmail ? 'var(--bg-primary)' : 'transparent', border: stage.autoEmail ? '1px solid var(--accent-primary)' : '1px dashed var(--border-primary)', padding: '0.65rem', borderRadius: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', color: stage.autoEmail ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            <input type="checkbox" checked={!!stage.autoEmail} onChange={e => handleUpdateStage(i,'autoEmail',e.target.checked)} style={{ width: 15, height: 15 }} />
                            ✉️ Email automatica all'ingresso
                          </label>
                          {stage.autoEmail && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                              <input type="text" value={stage.emailSubject||''} onChange={e => handleUpdateStage(i,'emailSubject',e.target.value)} placeholder="Oggetto email" style={{ padding: '0.45rem 0.7rem', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontSize: '0.83rem', color: 'var(--text-primary)' }} />
                              <textarea value={stage.emailBody||''} onChange={e => handleUpdateStage(i,'emailBody',e.target.value)} placeholder="Testo email. Usa {Nome} per il nome del candidato." style={{ padding: '0.45rem 0.7rem', borderRadius: 6, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minHeight: 70, resize: 'vertical', fontSize: '0.83rem', color: 'var(--text-primary)' }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveStage(i)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <button onClick={handleAddStage} style={{ padding: '0.65rem 1.5rem', background: 'transparent', border: '1px dashed var(--border-primary)', color: 'var(--text-primary)', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                    + Aggiungi Step
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Costruisci il form. Nome, Cognome, Email, Telefono e CV sono già inclusi di default.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {editingFormSchema.map((field, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-light)', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.2rem' }}>
                        <button onClick={() => moveField(i,'up')} disabled={i===0} style={{ background:'none',border:'none',cursor:i===0?'not-allowed':'pointer',opacity:i===0?0.3:1,fontSize:'0.9rem' }}>⬆️</button>
                        <button onClick={() => moveField(i,'down')} disabled={i===editingFormSchema.length-1} style={{ background:'none',border:'none',cursor:i===editingFormSchema.length-1?'not-allowed':'pointer',opacity:i===editingFormSchema.length-1?0.3:1,fontSize:'0.9rem' }}>⬇️</button>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select value={field.type} onChange={e => handleUpdateField(i,'type',e.target.value)} style={{ padding: '0.45rem 0.7rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            <option value="text">Testo breve</option>
                            <option value="textarea">Paragrafo</option>
                            <option value="select">Scelta multipla</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="file">File upload</option>
                          </select>
                          <label style={{ display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.83rem',fontWeight:600,cursor:'pointer' }}>
                            <input type="checkbox" checked={field.required} onChange={e => handleUpdateField(i,'required',e.target.checked)} />
                            Obbligatorio
                          </label>
                        </div>
                        <input type="text" value={field.label} onChange={e => handleUpdateField(i,'label',e.target.value)} placeholder="Domanda / titolo campo" style={{ padding:'0.5rem 0.9rem',borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--bg-primary)',fontSize:'0.88rem',fontWeight:600,color:'var(--text-primary)' }} />
                        {field.type==='select' && (
                          <input type="text" value={(field.options||[]).join(', ')} onChange={e => handleUpdateField(i,'options',e.target.value.split(',').map((s:string)=>s.trim()).filter((s:string)=>s))} placeholder="Opzione 1, Opzione 2, Opzione 3" style={{ padding:'0.45rem 0.7rem',borderRadius:8,border:'1px dashed var(--border-primary)',background:'var(--bg-primary)',fontSize:'0.83rem',color:'var(--text-primary)' }} />
                        )}
                      </div>
                      <button onClick={() => handleRemoveField(i)} style={{ background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',borderRadius:8,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {editingFormSchema.length === 0 && (
                    <div style={{ textAlign:'center',padding:'2rem',color:'var(--text-muted)',border:'1px dashed var(--border-primary)',borderRadius:10 }}>
                      Nessuna domanda aggiuntiva. Il form userà solo i campi standard.
                    </div>
                  )}
                </div>
                <div style={{ display:'flex',justifyContent:'center',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap' }}>
                  {[['text','Testo'],['textarea','Paragrafo'],['select','Scelta Multipla'],['checkbox','Checkbox'],['file','File']].map(([type,label]) => (
                    <button key={type} onClick={() => handleAddField(type)} style={{ padding:'0.5rem 1rem',background:'var(--bg-secondary)',border:'1px solid var(--border-primary)',borderRadius:8,cursor:'pointer',fontSize:'0.83rem',color:'var(--text-primary)' }}>
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Personalizza le <strong>5 voci della checklist operativa</strong> per questo job.
                  Le etichette vengono mostrate nel pannello di ogni candidato.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {editingChecklistLabels.map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {i + 1}
                      </div>
                      <input
                        type="text"
                        value={label}
                        onChange={e => { const n = [...editingChecklistLabels]; n[i] = e.target.value; setEditingChecklistLabels(n); }}
                        style={{ flex: 1, padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0.9rem 1rem', borderRadius: 10, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.83rem', color: '#818cf8', lineHeight: 1.6 }}>
                  💡 Le 5 voci corrispondono ai 5 checkbox nella checklist del candidato. Personalizzale in base al processo di selezione di questo ruolo.
                </div>
              </div>
            )}

            {activeTab === 'description' && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Il testo integrale del Job Ad che viene mostrato al candidato nella <strong>Pagina di Candidatura Pubblica</strong> e che descrive nel dettaglio il ruolo.
                </p>
                <textarea
                  value={editingPublicDesc}
                  onChange={e => setEditingPublicDesc(e.target.value)}
                  placeholder="Selezioniamo uno chef de rang per noto ristorante..."
                  style={{ width: '100%', minHeight: 250, padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', resize: 'vertical', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}
                />
              </div>
            )}

            <div style={{ display:'flex',justifyContent:'flex-end',paddingTop:'1rem',borderTop:'1px solid var(--border-light)' }}>
              <button onClick={handleSaveStages} disabled={savingStages} style={{ padding:'0.75rem 2rem',background:'linear-gradient(135deg,#4f46e5,#6366f1)',color:'white',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,opacity:savingStages?0.7:1,fontSize:'0.95rem' }}>
                {savingStages ? 'Salvataggio...' : '💾 Salva Modifiche'}
              </button>

            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
