'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import styles from './Sidebar.module.css';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect solo se siamo certi che non c'è utente
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Non loggato? Redirect — non mostrare nulla
  if (!user && !loading) {
    return null;
  }

  // Mostra TUTTO subito — nessun gatekeeping
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
