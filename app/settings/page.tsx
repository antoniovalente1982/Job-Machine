'use client';

import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { Settings, Construction } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardShell>
      <h1 className={styles.title}>Impostazioni</h1>
      <p className={styles.subtitle}>Configurazione del tuo account e della piattaforma</p>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center', borderRadius: 16 }}>
        <Construction size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>In Costruzione</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
          Qui potrai gestire il tuo team, le integrazioni email, il branding personalizzato per i clienti e le preferenze della piattaforma.
        </p>
      </div>
    </DashboardShell>
  );
}
