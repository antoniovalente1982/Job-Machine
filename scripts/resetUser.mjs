import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xtgqzixgrlotrkbzahbm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Z3F6aXhncmxvdHJrYnphaGJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0OTAyMSwiZXhwIjoyMDkxODI1MDIxfQ.nFmW205AgATnQK4N1tUvZJpsqbIKH0Ac0fTEAPP_dDw'
);

async function run() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error(error); return; }
  
  const user = users.users.find(u => u.email === 'valente.antonio@me.com');
  if (!user) { console.log('Utente non trovato!'); return; }
  
  console.log('User ID trovato:', user.id);
  
  const { data, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password: 'Password123!' });
  if (updateErr) { console.error('Errore update:', updateErr); return; }
  
  console.log('Password impostata a: Password123!');
}

run();
