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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Mostra il layout con sidebar SUBITO, anche durante il caricamento auth
  // Questo elimina il "flash bianco" di loading
  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />
      <main className={styles.content}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div style={{ 
              width: 32, height: 32, 
              border: '3px solid var(--border-primary)', 
              borderTopColor: 'var(--accent-primary)', 
              borderRadius: '50%', 
              animation: 'spin 0.6s linear infinite' 
            }} />
          </div>
        ) : user ? (
          children
        ) : null}
      </main>
    </div>
  );
}
