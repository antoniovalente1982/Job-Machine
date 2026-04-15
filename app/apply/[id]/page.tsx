'use client';

import { useState, useEffect } from 'react';
import { submitApplication } from '../../actions';
import styles from './page.module.css';

export default function ApplicationForm({ params }: { params: { id: string } }) {
  const [jobInfo, setJobInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dato che questa è una Client Component, fetcho i dettagli tramite API (se ci fosse un backend locale) 
  // O semplicemente passiamo JobID al server e ci fidiamo
  useEffect(() => {
    // In un'app vera prenderemmo i dati di Job ID da Supabase, ma in questo step ci fermiamo al form
    setLoading(false);
  }, [params.id]);

  async function clientAction(formData: FormData) {
    setSubmitting(true);
    const res = await submitApplication(params.id, formData);
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

          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>2. Questionario Attitudinale</h3>
            <div className={styles.inputGroup}>
              <label>Perché vorresti lavorare con noi in questa struttura, e perché dovremmo sceglierti? (Motivazione) *</label>
              <textarea name="motivation" required className={`${styles.input} ${styles.textarea}`} placeholder="Scrivi una breve motivazione..."></textarea>
            </div>
            <div className={styles.inputGroup}>
              <label>Descrivi brevemente la tua esperienza più significativa in questo ruolo *</label>
              <textarea name="experience" required className={`${styles.input} ${styles.textarea}`} placeholder="Ho lavorato 3 anni presso..."></textarea>
            </div>
            <div className={styles.inputGroup}>
              <label>Hai necessità di vitto e alloggio o risiedi in zona? *</label>
              <input type="text" name="residency" required className={styles.input} placeholder="Es: Risiedo in zona / Necessito alloggio" />
            </div>
          </div>

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
