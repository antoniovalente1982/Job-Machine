ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS pipeline_stages JSONB DEFAULT '[
  {
    "id": "received",
    "name": "Candidature Ricevute",
    "color": "#6366f1",
    "definition": "Ricezione e primissimo contatto."
  },
  {
    "id": "first_selection",
    "name": "1° Selezione (Questionario)",
    "color": "#f59e0b",
    "definition": "Inviata richiesta di questionario e lettera."
  },
  {
    "id": "selected",
    "name": "Selezionati DA CONTATTARE",
    "color": "#22c55e",
    "definition": "Profilo in linea, in attesa di colloquio o contratto."
  },
  {
    "id": "rejected",
    "name": "SCARTATI (Non in linea)",
    "color": "#ef4444",
    "definition": "Profilo non idoneo o incompleto."
  }
]'::jsonb;
