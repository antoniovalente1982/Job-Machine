'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  full_name?: string;
} | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  logout: () => Promise<void>;
}>({
  user: null,
  loading: true,
  logout: async () => {},
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

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inizializza lo user SINCRONO dal localStorage — niente loading!
  const [user, setUser] = useState<User>(() => getStoredUser());
  const [loading, setLoading] = useState(false); // Parte da false!
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
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
