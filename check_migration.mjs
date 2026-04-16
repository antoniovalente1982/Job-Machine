/**
 * Script one-shot per applicare la migration checklist_labels.
 * Usa l'API REST di Supabase con la anon key (accesso limitato a operazioni permesse dalle policy).
 * Se non funziona con anon key, eseguire il SQL manualmente nella Supabase SQL Editor.
 */

const SUPABASE_URL = 'https://xtgqzixgrlotrkbzahbm.supabase.co';
const ANON_KEY = 'sb_publishable_GsMjcsIc5YJX5g-d5WAGVQ_TZOrj0Dv';

// Proviamo a usare la REST API per verificare se la colonna già esiste
// controllando la struttura della tabella
async function checkColumn() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/job_positions?select=checklist_labels&limit=1`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  });
  
  if (response.ok) {
    console.log('✅ Colonna checklist_labels già presente nel DB!');
    return true;
  } else {
    const err = await response.json();
    if (err.message?.includes('does not exist') || err.hint?.includes('checklist_labels')) {
      console.log('❌ Colonna checklist_labels NON presente. Aggiungila manualmente:');
      console.log('');
      console.log('Vai su: https://supabase.com/dashboard/project/xtgqzixgrlotrkbzahbm/editor');
      console.log('');
      console.log('Esegui questo SQL:');
      console.log('ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS checklist_labels JSONB DEFAULT NULL;');
      return false;
    } else {
      console.log('Status:', response.status, JSON.stringify(err));
      return false;
    }
  }
}

checkColumn().catch(console.error);
