'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginClient } from '@/app/portalActions';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function PortalLoginClient({ slug }: { slug: string }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await loginClient(slug, password);
      
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res.success) {
        // Successo! Ricarica e ridireziona
        router.push(`/portal/${slug}`);
        router.refresh(); // Assicura che la sessione lato server sia vista
      }
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ position: 'relative' }}>
        <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        <input 
          type="password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password Aziendale" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.8rem',
            borderRadius: 10,
            border: '1px solid #334155',
            background: '#0f172a',
            color: 'white',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || !password.trim()}
        style={{
          width: '100%',
          padding: '0.85rem',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
          color: 'white',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: (loading || !password.trim()) ? 'not-allowed' : 'pointer',
          opacity: (loading || !password.trim()) ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '0.5rem'
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Controllo in corso...
          </>
        ) : (
          <>
            Accedi ad Area Riservata <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  );
}
