'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, signupAction } from '../authActions';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupDone, setSignupDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    const email = formData.get('email') as string;

    if (isSignup) {
      const result = await signupAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        // Mostra schermata di conferma email
        setSignupEmail(email);
        setSignupDone(true);
      }
    } else {
      const result = await loginAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.session) {
        localStorage.setItem('sb-session', JSON.stringify(result.session));
        router.push('/');
        router.refresh();
      }
    }

    setLoading(false);
  }

  // Schermata di ringraziamento post-registrazione
  if (signupDone) {
    return (
      <main className={styles.main}>
        <div className={`glass-panel ${styles.container}`}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <h1 className={styles.logo} style={{ fontSize: '1.5rem' }}>Registrazione Completata!</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '1rem 0 1.5rem' }}>
              Grazie per esserti registrato su <strong>Job Machine</strong>.<br />
              Ti abbiamo inviato un'email di verifica a:<br />
              <strong style={{ color: 'var(--accent-primary)' }}>{signupEmail}</strong>
            </p>
            <div style={{ 
              background: 'var(--accent-light)', 
              border: '1px solid var(--border-accent)', 
              borderRadius: 10, 
              padding: '1rem', 
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem'
            }}>
              📬 Controlla la tua casella di posta (anche lo spam!) e clicca sul link di conferma per attivare il tuo account.
            </div>
            <button 
              onClick={() => { setSignupDone(false); setIsSignup(false); }}
              className={styles.submitBtn}
            >
              Ho confermato, portami al Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.container}`}>
        <h1 className={styles.logo}>Job Machine</h1>
        <p className={styles.logoSub}>
          {isSignup ? 'Crea il tuo account agenzia' : 'Accedi al pannello di controllo'}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form action={handleSubmit} className={styles.form}>
          {isSignup && (
            <div className={styles.inputGroup}>
              <label>Nome Completo</label>
              <input type="text" name="full_name" required className={styles.input} placeholder="Antonio Valente" />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" name="email" required className={styles.input} placeholder="info@tuaagenzia.it" />
          </div>
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input type="password" name="password" required minLength={6} className={styles.input} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Caricamento...' : isSignup ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <p className={styles.toggle}>
          {isSignup ? 'Hai già un account? ' : 'Non hai un account? '}
          <span className={styles.toggleLink} onClick={() => { setIsSignup(!isSignup); setError(''); }}>
            {isSignup ? 'Accedi' : 'Registrati'}
          </span>
        </p>
      </div>
    </main>
  );
}
