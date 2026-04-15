import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xtgqzixgrlotrkbzahbm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0Z3F6aXhncmxvdHJrYnphaGJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0OTAyMSwiZXhwIjoyMDkxODI1MDIxfQ.nFmW205AgATnQK4N1tUvZJpsqbIKH0Ac0fTEAPP_dDw'
);

async function run() {
  const { data: profiles, error } = await supabase.from('profiles').select('*').eq('email', 'valente.antonio@me.com');
  if (error) { console.error(error); return; }
  
  if (profiles.length === 0) { console.log('Profile non trovato!'); return; }
  
  const id = profiles[0].id;
  const { data: updateData, error: updateErr } = await supabase.from('profiles').update({ role: 'owner' }).eq('id', id);
  if (updateErr) { console.error('Errore update:', updateErr); return; }
  
  console.log('Ruolo impostato con successo a Proprietario per', id);
}

run();
