'use client';

import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { FileText, Construction } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <DashboardShell>
      <h1 className={styles.title}>Template Messaggi</h1>
      <p className={styles.subtitle}>Gestisci gli script di comunicazione per i candidati</p>

      <div className="glass-panel" style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center', borderRadius: 16 }}>
        <Construction size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>In Costruzione</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
          Qui potrai creare e gestire i template per i messaggi automatici ai candidati (benvenuto, promemoria 48h, ringraziamento, ecc.)
        </p>
      </div>
    </DashboardShell>
  );
}
