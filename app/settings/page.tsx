'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../components/DashboardShell';
import styles from '../dashboard.module.css';
import { createSupabaseClient } from '@/lib/supabase';
import { inviteTeamMember, updateUserRole } from '../adminActions';
import { Users, Plus, Shield, ShieldCheck, Crown, Mail } from 'lucide-react';

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; desc: string }> = {
  owner: { label: 'Proprietario', icon: Crown, color: '#d97706', bg: '#fffbeb', desc: 'Accesso completo + billing' },
  admin: { label: 'Amministratore', icon: ShieldCheck, color: '#4f46e5', bg: '#eef2ff', desc: 'Gestione team + clienti' },
  operator: { label: 'Operatore', icon: Shield, color: '#059669', bg: '#ecfdf5', desc: 'Solo pipeline e candidati' },
};

export default function SettingsPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    const sb = createSupabaseClient();
    const { data } = await sb.from('profiles').select('*').order('created_at');
    setTeam(data || []);
  }

  async function handleInvite(formData: FormData) {
    setLoading(true);
    setInviteResult(null);
    const result = await inviteTeamMember(formData);
    if (result.error) {
      setInviteResult({ error: result.error });
    } else {
      setInviteResult({ success: true, tempPassword: result.tempPassword });
      await loadTeam();
    }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: string) {
    await updateUserRole(userId, newRole);
    await loadTeam();
  }

  return (
    <DashboardShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className={styles.title}>Impostazioni</h1>
          <p className={styles.subtitle}>Gestisci il tuo team e la piattaforma</p>
        </div>
      </div>

      {/* Team Members */}
      <div className="glass-panel" style={{ borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Team</h2>
          <button onClick={() => { setShowInvite(true); setInviteResult(null); }} style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} /> Invita Membro
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {team.map(member => {
            const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.operator;
            const RoleIcon = role.icon;
            return (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid var(--border-light)', background: 'var(--bg-primary)' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: role.bg, color: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {member.full_name ? member.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{member.full_name || 'Utente'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select 
                    value={member.role} 
                    onChange={e => handleRoleChange(member.id, e.target.value)}
                    style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid var(--border-primary)', background: role.bg, color: role.color, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}
                  >
                    <option value="owner">👑 Proprietario</option>
                    <option value="admin">🛡️ Amministratore</option>
                    <option value="operator">📋 Operatore</option>
                  </select>
                </div>
              </div>
            );
          })}

          {team.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>Nessun membro nel team</p>
            </div>
          )}
        </div>
      </div>

      {/* Ruoli spiegazione */}
      <div className="glass-panel" style={{ borderRadius: 16, padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Ruoli e Permessi</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(ROLE_CONFIG).map(([key, role]) => {
            const Icon = role.icon;
            return (
              <div key={key} style={{ padding: '1rem', borderRadius: 10, background: role.bg, border: '1px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Icon size={16} style={{ color: role.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: role.color }}>{role.label}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{role.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Invito */}
      {showInvite && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-panel" style={{ maxWidth: 440, width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} /> Invita Membro del Team
            </h3>

            {inviteResult?.success ? (
              <div>
                <div style={{ background: 'var(--green-light)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 10, padding: '1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--green)' }}>
                  ✅ Membro aggiunto con successo!
                </div>
                {inviteResult.tempPassword && (
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Password temporanea:</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem' }}>{inviteResult.tempPassword}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Condividila privatamente con il membro del team</div>
                  </div>
                )}
                <button onClick={() => { setShowInvite(false); setInviteResult(null); }} style={{ width: '100%', padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Chiudi
                </button>
              </div>
            ) : (
              <form action={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" name="full_name" required placeholder="Nome completo (es. Federica Rossi)" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <input type="email" name="email" required placeholder="Email" 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }} />
                <select name="role" defaultValue="admin"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '0.8rem', color: 'var(--text-primary)' }}>
                  <option value="admin">🛡️ Amministratore</option>
                  <option value="operator">📋 Operatore</option>
                </select>

                {inviteResult?.error && (
                  <div style={{ background: 'var(--rose-light)', border: '1px solid rgba(225,29,72,0.15)', color: 'var(--rose)', padding: '0.65rem 0.85rem', borderRadius: 6, fontSize: '0.85rem' }}>
                    {inviteResult.error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowInvite(false)} style={{ flex: 1, padding: '0.8rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 8, color: 'var(--text-primary)', cursor: 'pointer' }}>Annulla</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.8rem', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Invita'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
