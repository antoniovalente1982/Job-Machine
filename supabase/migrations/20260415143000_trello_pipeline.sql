-- Migrazione: Adeguamento pipeline_stage candidates alla Trello Pipeline

-- 1. Aggiornamento degli stage pre-esistenti ai nuovi valori
UPDATE candidates SET pipeline_stage = 'received' WHERE pipeline_stage = 'candidatura_ricevuta';
UPDATE candidates SET pipeline_stage = 'first_selection' WHERE pipeline_stage IN ('questionario_inviato', 'questionario_compilato', 'cv_ricevuto');
UPDATE candidates SET pipeline_stage = 'selected' WHERE pipeline_stage IN ('in_valutazione', 'selezionato', 'da_contattare', 'colloquio_fissato', 'assunto');
UPDATE candidates SET pipeline_stage = 'rejected' WHERE pipeline_stage = 'scartato';

-- 2. Drop del vecchio constraint CHECK e ricreazione con i nuovi valori
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_pipeline_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_pipeline_check CHECK (pipeline_stage IN ('received', 'first_selection', 'selected', 'rejected'));

-- 3. Imposta nuovo valore di default
ALTER TABLE candidates ALTER COLUMN pipeline_stage SET DEFAULT 'received';

-- 4. Aggiunta campi boolean per la Checklist Trello
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS checklist_msg1_sent BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS checklist_msg2_sent BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS checklist_quest_done BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS checklist_remind_cv BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS checklist_cv_done BOOLEAN DEFAULT false;

-- 5. Aggiunta campo note interne per motivazioni di scarto o note selezione
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS internal_notes TEXT;
