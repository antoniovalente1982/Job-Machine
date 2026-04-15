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

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');

    if (isSignup) {
      const result = await signupAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError('');
        // Dopo signup, logghiamoci automaticamente
        const loginResult = await loginAction(formData);
        if (loginResult.success && loginResult.session) {
          // Salviamo la sessione nel localStorage per il client
          localStorage.setItem('sb-session', JSON.stringify(loginResult.session));
          router.push('/');
          router.refresh();
        }
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
