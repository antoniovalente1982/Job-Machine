'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { FileText, Plus, Pencil, Trash2, X } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import { createTemplateMessage, updateTemplateMessage, deleteTemplateMessage } from '../adminActions';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    const sb = createSupabaseClient();
    const { data } = await sb.from('message_templates').select('*').order('created_at', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditingTemplate(null);
    setTitle('');
    setSubject('');
    setBody('');
    setModalOpen(true);
  }

  function openEdit(t: any) {
    setEditingTemplate(t);
    setTitle(t.title);
    setSubject(t.subject || '');
    setBody(t.body);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    let res;
    if (editingTemplate) {
      res = await updateTemplateMessage(editingTemplate.id, title, subject, body);
    } else {
      res = await createTemplateMessage(title, subject, body);
    }
    setSubmitting(false);
    
    if (res?.error) {
      alert("Errore salvataggio: " + res.error);
    } else {
      setModalOpen(false);
      await loadTemplates();
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Sei sicuro di voler eliminare questo template?')) {
      let res = await deleteTemplateMessage(id);
      if (res?.error) alert("Errore eliminazione: " + res.error);
      else await loadTemplates();
    }
  }

  return (
    <DashboardShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.title}>Template Messaggi</h1>
          <p className={styles.subtitle}>Gestisci gli script di comunicazione standard per i candidati</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16} /> Nuovo Template
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Caricamento template...</div>
      ) : templates.length === 0 ? (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center', borderRadius: 16 }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Nessun Template</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Non hai ancora creato nessun template messaggi. Clicca su "+ Nuovo Template" per crearne uno.
          </p>
          <button onClick={openCreate} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Inizia ora</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {templates.map(t => (
            <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: '2rem' }}>{t.title}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', position: 'absolute', top: '1.2rem', right: '1.2rem' }}>
                  <button onClick={() => openEdit(t)} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {t.subject && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 600 }}>
                  <span style={{ opacity: 0.6 }}>Oggetto:</span> {t.subject}
                </div>
              )}
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                {t.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREA/MODIFICA TEMPLATE */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: 640, padding: '2rem', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingTemplate ? 'Modifica Template' : 'Nuovo Template'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={22} /></button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome Template *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Lettera motivazionale mancante" style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Oggetto Email (Opzionale se per WhatsApp)</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Aggiornamento sulla tua candidatura" style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Testo del Messaggio *</label>
                <textarea required value={body} onChange={e => setBody(e.target.value)} placeholder="Gentile candidato,\n\nTi contattiamo in merito..." style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', minHeight: 180, lineHeight: 1.5 }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>💡 Suggerimento: Usa segnaposti manuali come [NOME] o [COGNOME] da sostituire prima dell'invio.</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '0.8rem 1.2rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Annulla</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.8rem 1.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Salvataggio...' : 'Salva Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
