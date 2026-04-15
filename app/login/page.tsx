'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, signupAction, resetPasswordAction } from '../authActions';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupDone, setSignupDone] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const email = formData.get('email') as string;

    if (mode === 'reset') {
      const result = await resetPasswordAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSignupEmail(email);
        setResetDone(true);
      }
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      const result = await signupAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
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

  // Schermata conferma reset password
  if (resetDone) {
    return (
      <main className={styles.main}>
        <div className={`glass-panel ${styles.container}`}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
            <h1 className={styles.logo} style={{ fontSize: '1.5rem' }}>Email Inviata!</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '1rem 0 1.5rem' }}>
              Ti abbiamo inviato un link per reimpostare la password a:<br />
              <strong style={{ color: 'var(--accent-primary)' }}>{signupEmail}</strong>
            </p>
            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              📬 Controlla la tua casella (anche lo spam!) e clicca sul link per reimpostare la password.
            </div>
            <button onClick={() => { setResetDone(false); setMode('login'); }} className={styles.submitBtn}>
              Torna al Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Schermata conferma registrazione
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
            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              📬 Controlla la tua casella (anche lo spam!) e clicca sul link per attivare il tuo account.
            </div>
            <button onClick={() => { setSignupDone(false); setMode('login'); }} className={styles.submitBtn}>
              Ho confermato, portami al Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  const titles = {
    login: 'Accedi al pannello di controllo',
    signup: 'Crea il tuo account agenzia',
    reset: 'Recupera la tua password',
  };

  return (
    <main className={styles.main}>
      <div className={`glass-panel ${styles.container}`}>
        <h1 className={styles.logo}>Job Machine</h1>
        <p className={styles.logoSub}>{titles[mode]}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form action={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.inputGroup}>
              <label>Nome Completo</label>
              <input type="text" name="full_name" required className={styles.input} placeholder="Antonio Valente" />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input type="email" name="email" required className={styles.input} placeholder="info@tuaagenzia.it" />
          </div>
          {mode !== 'reset' && (
            <div className={styles.inputGroup}>
              <label>Password</label>
              <input type="password" name="password" required minLength={6} className={styles.input} placeholder="••••••••" />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
              <span className={styles.toggleLink} onClick={() => { setMode('reset'); setError(''); }} style={{ fontSize: '0.82rem' }}>
                Password dimenticata?
              </span>
            </div>
          )}

          <button type="submit" disabled={loading} className={`${styles.submitBtn} ${loading ? styles.submitBtnLoading : ''}`}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                Attendere...
              </span>
            ) : mode === 'login' ? 'Accedi' : mode === 'signup' ? 'Registrati' : 'Invia link di recupero'}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'login' && <>Non hai un account? <span className={styles.toggleLink} onClick={() => { setMode('signup'); setError(''); }}>Registrati</span></>}
          {mode === 'signup' && <>Hai già un account? <span className={styles.toggleLink} onClick={() => { setMode('login'); setError(''); }}>Accedi</span></>}
          {mode === 'reset' && <>Ricordi la password? <span className={styles.toggleLink} onClick={() => { setMode('login'); setError(''); }}>Torna al Login</span></>}
        </p>
      </div>
    </main>
  );
}
