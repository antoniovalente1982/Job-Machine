'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Proviamo a ripristinare la sessione dal localStorage
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
          }
          setLoading(false);
        });
      } catch {
        localStorage.removeItem('sb-session');
        setLoading(false);
      }
    } else {
      setLoading(false);
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
      } else {
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
