ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS pipeline_stages JSONB DEFAULT '[
  {
    "id": "received",
    "name": "Candidature ricevute (Ancora in screening)",
    "color": "#1e293b",
    "definition": "Qui trovi tutti coloro che si sono candidati all''offerta. Non hanno ancora inviato i propri dati, e sono quindi ancora da valutare."
  },
  {
    "id": "first_selection",
    "name": "1° Selezione (Questionario compilato)",
    "color": "#d97706",
    "definition": "Qui trovi i candidati che hanno inviato i propri dati tramite il questionario, ma non ancora il CV. Sono ancora da valutare."
  },
  {
    "id": "to_contact",
    "name": "Selezionati DA CONTATTARE",
    "color": "#4d7c0f",
    "definition": "Qui trovi i candidati che hanno superato tutti gli step e sono da contattare. Dentro ciascun candidato trovi in allegato le risposte del questionario e il cv."
  },
  {
    "id": "stand_by",
    "name": "STAND BY (Contattati, in attesa di decisione)",
    "color": "#ea580c",
    "definition": "Qui puoi spostare i candidati che sono stati contattati e che sono in fase di vostra valutazione."
  },
  {
    "id": "rejected",
    "name": "SCARTATI (Non in linea)",
    "color": "#dc2626",
    "definition": "Qui trovi i candidati scartati. Nella descrizione di ciascun candidato c''è la motivazione."
  },
  {
    "id": "selected",
    "name": "SELEZIONATO ✅",
    "color": "#16a34a",
    "definition": "Qui puoi spostare i candidati che sono stati selezionati"
  }
]'::jsonb;
