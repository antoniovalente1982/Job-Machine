import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Setup supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Avvio il seeding del database...');

  // 1. Inserisci il cliente "Consulting Manager Group"
  const clientId = crypto.randomUUID();
  const { error: clientErr } = await supabase.from('clients').insert({
    id: clientId,
    name: 'Consulting Manager Group',
    slug: 'consulting-manager-group',
    logo_url: null
  });
  if (clientErr) console.error('Client Error:', clientErr);

  // 2. Inserisci le due Strutture
  const ristoranteId = crypto.randomUUID();
  const hotelId = crypto.randomUUID();

  const structuresData = [
    {
      id: ristoranteId,
      client_id: clientId,
      name: "Ristorante Pasta e Vino / Ristorante FRESCO",
      location: "Palau (SS)",
      description: "Servizi alla carta pranzo e cena, 120 coperti, da inizio maggio a fine ottobre. Cucina mediterranea con influenze sarde. Un giorno di riposo a settimana, vitto e alloggio forniti da noi in prossimità dei ristoranti.",
      image_url: "/restaurant.png"
    },
    {
      id: hotelId,
      client_id: clientId,
      name: "Hotel Palau 4 stelle S",
      location: "Palau (SS)",
      description: "Servizio colazione e cena (con bistrot pranzo a turnazione). Colazione al buffet + caffetteria express. Cena servizio impiattato con scelta la sera precedente (max 200 pax), in alta stagione anche ristorante alla carta 20/40 pax con servizi alla francese. Un giorno di riposo a settimana, vitto e alloggio forniti da noi adiacenti o in prossimità della struttura. Da subito fino al 31 ottobre.",
      image_url: "/hotel.png"
    }
  ];

  const { error: structErr } = await supabase.from('structures').insert(structuresData);
  if (structErr) console.error('Structures Error:', structErr);

  // 3. Inserisci le posizioni lavorative collegate alle rispettive strutture
  const jobsData = [
    // Ristorante
    { structure_id: ristoranteId, title: "Capopartita primi/secondi", salary: "2000€ mese + TFR", icon_name: "ChefHat", trello_board_link: "https://trello.com/invite/b/69de17743d25d60a06a13a50/ATTI4d41fc73a754e2049eedda7a2eadf" },
    { structure_id: ristoranteId, title: "Aiuto Cuoco", salary: "1500€ mese + TFR", icon_name: "Utensils", trello_board_link: "https://trello.com/invite/b/69de1ef3e420cf43c790f601/ATTI25dbc03b04b00cc19ea1ccff99052" },
    { structure_id: ristoranteId, title: "Chef de Rang", salary: "1800€ mese + TFR", icon_name: "UtensilsCrossed", trello_board_link: "https://trello.com/invite/b/69de1f18a7f074715b3cd177/ATTIf77586cfab8df181e936acd1d8724" },
    { structure_id: ristoranteId, title: "Cameriere di Sala", salary: "1400€ mese + TFR", icon_name: "Wine", trello_board_link: "https://trello.com/invite/b/69de1f2def13230c7ddbcb4d/ATTI3ec68513367bd498bdcadc75" },
    
    // Hotel
    { structure_id: hotelId, title: "Capopartita", salary: "1800€ mese + TFR", icon_name: "ChefHat", trello_board_link: "https://trello.com/invite/b/69de17743d25d60a06a13a50/ATTI4d41fc73a754e2049eedda7a2eadf" },
    { structure_id: hotelId, title: "Aiuto cuoco", salary: "1400€ mese + TFR", icon_name: "Utensils", trello_board_link: "https://trello.com/invite/b/69de1ef3e420cf43c790f601/ATTI25dbc03b04b00cc19ea1ccff99052" },
    { structure_id: hotelId, title: "Chef de Rang", salary: "1800€ mese + TFR", icon_name: "UtensilsCrossed", trello_board_link: "https://trello.com/invite/b/69de1f18a7f074715b3cd177/ATTIf77586cfab8df181e936acd1d8724" },
    { structure_id: hotelId, title: "Cameriere di Sala", salary: "1400€ mese + TFR", icon_name: "Wine", trello_board_link: "https://trello.com/invite/b/69de1f2def13230c7ddbcb4d/ATTI3ec68513367bd498bdcadc75" },
    { structure_id: hotelId, title: "Barista", salary: "1400€ mese + TFR", icon_name: "Coffee", trello_board_link: "#" },
    { structure_id: hotelId, title: "Manutentore hotel", salary: "1700€ mese + TFR", icon_name: "Wrench", trello_board_link: "#" },
    { structure_id: hotelId, title: "Addetta lavanderia", salary: "1400€ mese + TFR", icon_name: "Shirt", trello_board_link: "#" },
    { structure_id: hotelId, title: "Ricevimento front office", salary: "1500€ mese + TFR", icon_name: "ConciergeBell", trello_board_link: "#" }
  ];

  const { error: jobsErr } = await supabase.from('job_positions').insert(jobsData);
  if (jobsErr) console.error('Jobs Error:', jobsErr);

  console.log('✅ Seeding completato. Il database ora contiene i dati veri!');
}

seed();
