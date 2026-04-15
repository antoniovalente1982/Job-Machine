import pageStyles from './page.module.css';
import { supabase } from '../lib/supabase';
import { 
  ChefHat, 
  Utensils, 
  UtensilsCrossed, 
  Wine, 
  Coffee, 
  Wrench, 
  Shirt, 
  ConciergeBell
} from 'lucide-react';
import CopyLinkButton from './components/CopyLinkButton';

const iconMap: Record<string, any> = {
  ChefHat,
  Utensils,
  UtensilsCrossed,
  Wine,
  Coffee,
  Wrench,
  Shirt,
  ConciergeBell
};

export const revalidate = 0; // Ensure data is strictly realtime bypassing Next cache

export default async function Home() {
  // Dati estratti da Supabase in tempo reale
  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .select('name, logo_url, structures(*, job_positions(*))')
    .eq('slug', 'consulting-manager-group')
    .single();

  if (clientErr || !clientData) {
    return (
      <div style={{ color: 'white', padding: '3rem', textAlign: 'center' }}>
        <h2>Errore di caricamento dati 🔴</h2>
        <p>Assicurati di aver configurato .env.local e creato le tabelle.</p>
        <pre>{clientErr?.message}</pre>
      </div>
    );
  }

  return (
    <main className={pageStyles.main}>
      <header className={pageStyles.header}>
        <div className={`glass-panel ${pageStyles.logo}`}>
          <span className={pageStyles.logoAccent}>CMG</span> Recruiting
        </div>
        <nav className={pageStyles.nav}>
          <div className={pageStyles.navLinkActive}>Gestione Trello</div>
        </nav>
      </header>

      <section className={pageStyles.hero}>
        <div className={pageStyles.superTitle}>{clientData.name} (HR MACHINE)</div>
        <h1 className={pageStyles.title}>Portale Smistamento Candidati</h1>
        <p className={pageStyles.subtitle}>
          Seleziona la struttura e apri la bacheca Trello corrispondente per gestire i candidati.
        </p>
      </section>

      <div className={pageStyles.structuresContainer}>
        {clientData.structures?.map((structure: any) => (
          <div key={structure.id} className={pageStyles.structureSection}>
            <div className={pageStyles.structureHeader}>
              {structure.image_url && (
                <img src={structure.image_url} alt={structure.name} className={pageStyles.structureImage} />
              )}
              <div className={pageStyles.structureTitleContainer}>
                <h2 className={pageStyles.structureTitle}>{structure.name}</h2>
                <span className={pageStyles.structureLocation}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {structure.location || 'Sede Principale'}
                </span>
              </div>
            </div>
            
            {structure.description && (
              <p className={pageStyles.structureDesc}>{structure.description}</p>
            )}
            
            <div className={pageStyles.rolesGrid}>
              {structure.job_positions?.map((role: any) => {
                const IconComponent = iconMap[role.icon_name] || ChefHat;
                return (
                  <div key={role.id} className={`glass-panel ${pageStyles.roleCard}`}>
                    <div className={pageStyles.roleInfo}>
                      <h3 className={pageStyles.roleTitle}>
                        <IconComponent size={22} className={pageStyles.roleIcon} />
                        <span>{role.title}</span>
                      </h3>
                      <div className={pageStyles.roleSalary}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        {role.salary || 'Da confermare'}
                      </div>
                    </div>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: 'auto' }}>
                    <a href={role.trello_board_link || '#'} target="_blank" rel="noopener noreferrer" className={pageStyles.trelloButton} style={{ flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <rect x="7" y="7" width="3" height="9"></rect>
                        <rect x="14" y="7" width="3" height="5"></rect>
                      </svg>
                      <span>Trello</span>
                    </a>
                    <CopyLinkButton 
                      id={role.id}
                      className={pageStyles.trelloButton} 
                      style={{ flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
