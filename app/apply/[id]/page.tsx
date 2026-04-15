'use client';

import { useState, useEffect, use } from 'react';
import { submitApplication } from '../../actions';
import styles from './page.module.css';
import { createSupabaseClient } from '@/lib/supabase';

export default function ApplicationForm({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const [jobInfo, setJobInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dato che questa è una Client Component, fetcho i dettagli tramite API (se ci fosse un backend locale) 
  // O semplicemente passiamo JobID al server e ci fidiamo
  const [formSchema, setFormSchema] = useState<any[]>([]);

  useEffect(() => {
    async function fetchJob() {
      const sb = createSupabaseClient();
      const { data } = await sb.from('job_positions').select('form_schema').eq('id', jobId).single();
      
      let schemaToUse = data?.form_schema;
      if (!schemaToUse || !Array.isArray(schemaToUse) || schemaToUse.length === 0) {
        // Fallback schema to not break older setups
        schemaToUse = [
          { id: 'motivation', type: 'textarea', label: 'Perché vorresti lavorare con noi in questa struttura, e perché dovremmo sceglierti? (Motivazione)', required: true },
          { id: 'experience', type: 'textarea', label: 'Descrivi brevemente la tua esperienza più significativa in questo ruolo', required: true },
          { id: 'residency', type: 'text', label: 'Hai necessità di vitto e alloggio o risiedi in zona?', required: true }
        ];
      }
      
      setFormSchema(schemaToUse);
      setLoading(false);
    }
    fetchJob();
  }, [jobId]);

  async function clientAction(formData: FormData) {
    setSubmitting(true);
    const res = await submitApplication(jobId, formData);
    if (res.success) {
      setSuccess(true);
    } else {
      alert(res.message);
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <main className={styles.main}>
        <div className={`glass-panel ${styles.container} ${styles.successMessage}`}>
          <h2 className={styles.successTitle}>Candidatura Ricevuta! 🎉</h2>
          <p className={styles.successDesc}>
            Abbiamo ricevuto il tuo curriculum e il questionario. Il nostro team di selezione
            valuterà il tuo profilo il prima possibile.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.container}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Candidatura Veloce</h1>
          <p className={styles.subtitle}>Compila il questionario per inviare immediatamente la tua candidatura.</p>
        </div>

        <form action={clientAction} className={styles.form}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>1. Anagrafica</h3>
            <div className={styles.inputGroup}>
              <label>Nome *</label>
              <input type="text" name="first_name" required className={styles.input} placeholder="Mario" />
            </div>
            <div className={styles.inputGroup}>
              <label>Cognome *</label>
              <input type="text" name="last_name" required className={styles.input} placeholder="Rossi" />
            </div>
            <div className={styles.inputGroup}>
              <label>Email *</label>
              <input type="email" name="email" required className={styles.input} placeholder="mario.rossi@email.com" />
            </div>
            <div className={styles.inputGroup}>
              <label>Telefono / WhatsApp *</label>
              <input type="tel" name="phone" required className={styles.input} placeholder="+39 333 1234567" />
            </div>
          </div>

          {formSchema.length > 0 && (
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>2. Modulo Personalizzato</h3>
              {formSchema.map((field) => (
                <div key={field.id} className={styles.inputGroup}>
                  <label>{field.label} {field.required && '*'}</label>
                  
                  {field.type === 'text' && (
                    <input type="text" name={field.id} required={field.required} className={styles.input} />
                  )}
                  {field.type === 'textarea' && (
                    <textarea name={field.id} required={field.required} className={`${styles.input} ${styles.textarea}`}></textarea>
                  )}
                  {field.type === 'select' && (
                    <select name={field.id} required={field.required} className={styles.input} style={{ height: 'auto', padding: '0.75rem', WebkitAppearance: 'none' }}>
                      <option value="">Seleziona un'opzione...</option>
                      {(field.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal', fontSize: '1rem', marginTop: '0.5rem' }}>
                      <input type="checkbox" name={field.id} value="true" required={field.required} style={{ width: 20, height: 20 }} />
                      Sì, confermo
                    </label>
                  )}
                  {field.type === 'file' && (
                    <input type="file" name={field.id} required={field.required} className={styles.fileInput} style={{ marginTop: '0.5rem' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>3. Curriculum Vitae</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Allega il tuo Curriculum Vitae aggiornato comprensivo di foto. (Solo file PDF o Word)
            </p>
            <input type="file" name="cv_file" required accept=".pdf,.doc,.docx" className={styles.fileInput} />
          </div>

          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? 'Invio in corso...' : 'Invia Candidatura Definitiva'}
          </button>
        </form>
      </div>
    </main>
  );
}
