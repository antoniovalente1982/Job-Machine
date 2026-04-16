'use client';

import { useState } from 'react';
import styles from './AdminDashboard.module.css';
import pageStyles from '../page.module.css';
import CopyLinkButton from './CopyLinkButton';
import { ChefHat, Utensils, UtensilsCrossed, Wine, Coffee, Wrench, Shirt, ConciergeBell, Plus, X, FileText } from 'lucide-react';
import { createClient, createStructure, createJobPosition } from '../adminActions';

const iconMap: Record<string, any> = { ChefHat, Utensils, UtensilsCrossed, Wine, Coffee, Wrench, Shirt, ConciergeBell };

export default function AdminDashboard({ clients }: { clients: any[] }) {
  const [activeClientId, setActiveClientId] = useState(clients[0]?.id || null);
  const [modal, setModal] = useState<'client' | 'structure' | 'job' | null>(null);
  const [activeStructureContext, setActiveStructureContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeClient = clients.find(c => c.id === activeClientId);

  async function handleAddClient(formData: FormData) {
    setLoading(true);
    await createClient(formData);
    setModal(null);
    setLoading(false);
  }

  async function handleAddStructure(formData: FormData) {
    if (!activeClientId) return;
    setLoading(true);
    await createStructure(activeClientId, formData);
    setModal(null);
    setLoading(false);
  }

  async function handleAddJob(formData: FormData) {
    if (!activeStructureContext) return;
    setLoading(true);
    await createJobPosition(activeStructureContext, formData);
    setModal(null);
    setLoading(false);
    setActiveStructureContext(null);
  }

  return (
    <div className={styles.container}>
      {/* Selettore Clienti (Tabs) */}
      <div className={styles.clientTabs}>
        {clients.map(c => (
          <div 
            key={c.id} 
            className={`${styles.tab} ${c.id === activeClientId ? styles.activeTab : ''}`}
            onClick={() => setActiveClientId(c.id)}
          >
            {c.name}
          </div>
        ))}
        <button className={styles.actionBtn} onClick={() => setModal('client')}>
          <Plus size={16} /> Nuovo Cliente
        </button>
      </div>

      {/* Contenuto del Cliente Attivo */}
      {activeClient && (
        <>
          <section className={pageStyles.hero}>
            <div className={pageStyles.superTitle}>{activeClient.name} (HUB)</div>
            <h1 className={pageStyles.title}>Pannello Agenzia</h1>
            <p className={pageStyles.subtitle}>
              Gestisci le strutture e copia i link di candidatura per questo cliente.
            </p>
          </section>

          <div className={pageStyles.structuresContainer}>
            {activeClient.structures?.map((structure: any) => (
              <div key={structure.id} className={pageStyles.structureSection}>
                <div className={pageStyles.structureHeader}>
                  <div className={pageStyles.structureTitleContainer}>
                    <h2 className={pageStyles.structureTitle}>{structure.name}</h2>
                    <span className={pageStyles.structureLocation}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {structure.location || 'Sede Principale'}
                    </span>
                  </div>
                </div>
                
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
                          <button 
                            onClick={(e) => {
                              // Avoid card click or pipeline routing
                              e.preventDefault();
                              if (role.public_description) {
                                navigator.clipboard.writeText(role.public_description);
                                alert('Testo annuncio copiato negli appunti! Ora puoi incollarlo sui Social.');
                              } else {
                                alert('Non hai ancora impostato il testo annuncio! Entra in "Pipeline" e poi clicca sull\'ingranaggio "Impostazioni".');
                              }
                            }}
                            className={pageStyles.trelloButton} 
                            style={{ flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}
                            title="Copia Testo Annuncio"
                          >
                            <FileText size={14} />
                            <span>Testo</span>
                          </button>
                          <CopyLinkButton 
                            id={role.id}
                            className={pageStyles.trelloButton} 
                            style={{ flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Bottone Aggiungi Posizione in questa struttura */}
                  <div className={`glass-panel ${pageStyles.roleCard}`} style={{borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', opacity: 0.7}} onClick={() => { setActiveStructureContext(structure.id); setModal('job'); }}>
                    <Plus size={32} style={{marginBottom: '0.5rem'}} />
                    <span>Aggiungi Nuova Posizione</span>
                  </div>
                </div>
              </div>
            ))}

            <button className={`${styles.actionBtn} ${styles.addStructureBtn}`} onClick={() => setModal('structure')}>
              <Plus size={18} /> Aggiungi Nuova Struttura per {activeClient.name}
            </button>
          </div>
        </>
      )}

      {/* Modals Overlay */}
      {modal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modal === 'client' && 'Nuovo Cliente'}
                {modal === 'structure' && 'Nuova Struttura'}
                {modal === 'job' && 'Nuova Posizione Lavorativa'}
              </h3>
              <button className={styles.closeBtn} onClick={() => setModal(null)}><X size={20} /></button>
            </div>

            {modal === 'client' && (
              <form action={handleAddClient} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label>Nome Azienda/Cliente</label>
                  <input type="text" name="name" className={styles.input} required placeholder="Es. Rossi S.p.A." />
                </div>
                <button disabled={loading} type="submit" className={styles.submitBtn}>Crea Cliente</button>
              </form>
            )}

            {modal === 'structure' && (
              <form action={handleAddStructure} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label>Nome Struttura</label>
                  <input type="text" name="name" className={styles.input} required placeholder="Es. Ristorante sul mare" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Località</label>
                  <input type="text" name="location" className={styles.input} required placeholder="Es. Roma (RM)" />
                </div>
                <button disabled={loading} type="submit" className={styles.submitBtn}>Aggiungi Struttura</button>
              </form>
            )}

            {modal === 'job' && (
              <form action={handleAddJob} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label>Titolo Ruolo</label>
                  <input type="text" name="title" className={styles.input} required placeholder="Es. Sommelier" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Salario/Inquadramento</label>
                  <input type="text" name="salary" className={styles.input} required placeholder="Es. 1500€ + Mance" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Testo Completo Annuncio (Opzionale)</label>
                  <textarea name="public_description" className={styles.input} rows={4} placeholder="Incolla il testo completo dell'offerta di lavoro (verrà mostrato ai candidati nella pagina di apply)..." style={{ resize: 'vertical', minHeight: '100px' }}></textarea>
                </div>
                <div className={styles.inputGroup}>
                  <label>Link Bacheca Trello (Opzionale per ora)</label>
                  <input type="text" name="trello_board_link" className={styles.input} placeholder="https://trello.com/..." />
                </div>
                <button disabled={loading} type="submit" className={styles.submitBtn}>Genera Posizione</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
