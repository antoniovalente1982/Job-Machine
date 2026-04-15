'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { updatePasswordAction } from '../authActions';

type User = {
  id: string;
  email: string;
  full_name?: string;
} | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  logout: () => Promise<void>;
  requiresPasswordReset: boolean;
  setRequiresPasswordReset: (val: boolean) => void;
}>({
  user: null,
  loading: true,
  logout: async () => {},
  requiresPasswordReset: false,
  setRequiresPasswordReset: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Lettura sincrona dal localStorage — ZERO attesa
function getStoredUser(): User {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sb-session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        full_name: session.user.user_metadata?.full_name,
      };
    }
  } catch {}
  return null;
}

function PasswordResetModal({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      return;
    }
    
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('password', password);

    const result = await updatePasswordAction(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess();
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-primary)', padding: '2.5rem', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Aggiorna Password</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scegli la tua nuova password per completare il recupero.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nuova Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Inserisci password sicura..."
              required
              minLength={6}
              style={{ width: '100%', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
          </div>

          {error && <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem', textAlign: 'center', border: '1px solid currentColor' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              background: 'var(--accent-primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              fontSize: '1rem', 
              fontWeight: 600, 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Aggiornamento...' : 'Conferma Nuova Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inizializza lo user SINCRONO dal localStorage — niente loading!
  const [user, setUser] = useState<User>(() => getStoredUser());
  const [loading, setLoading] = useState(false); // Parte da false!
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    // Verifica sessione in background (non blocca il render)
    const storedSession = localStorage.getItem('sb-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        supabase.auth.setSession(session).then(({ data }) => {
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name,
            });
          } else {
            // Sessione scaduta
            localStorage.removeItem('sb-session');
            setUser(null);
            router.push('/login');
          }
        });
      } catch {
        localStorage.removeItem('sb-session');
        setUser(null);
      }
    }

    // Listener per cambiamenti di auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Se l'evento è PASSWORD_RECOVERY, forziamo il modale per la nuova password
      if (event === 'PASSWORD_RECOVERY') {
        setRequiresPasswordReset(true);
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
        });
        localStorage.setItem('sb-session', JSON.stringify(session));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('sb-session');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('sb-session');
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, requiresPasswordReset, setRequiresPasswordReset }}>
      {children}
      {requiresPasswordReset && (
        <PasswordResetModal onSuccess={() => {
          setRequiresPasswordReset(false);
          router.push('/');
        }} />
      )}
    </AuthContext.Provider>
  );
}
