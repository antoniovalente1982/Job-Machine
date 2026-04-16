-- Migration: Aggiunta checklist_labels personalizzabili per job

-- Permette a ogni job di avere etichette personalizzate per le 5 voci checklist
ALTER TABLE job_positions 
  ADD COLUMN IF NOT EXISTS checklist_labels JSONB DEFAULT NULL;

-- Commento: il valore è un array di 5 stringhe, es:
-- '["Invio 1° messaggio", "Secondo promemoria", "Questionario ok", "Richiesta CV", "CV ricevuto"]'::jsonb
