-- Seed Data for Consulting Manager Group

-- 1. Insert Client
INSERT INTO clients (id, name, slug, logo_url) 
VALUES (
    '50000000-0000-0000-0000-000000000001', 
    'Consulting Manager Group', 
    'consulting-manager-group', 
    null
);

-- 2. Insert Structures
INSERT INTO structures (id, client_id, name, location, description, image_url)
VALUES 
(
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'Ristorante Pasta e Vino / Ristorante FRESCO',
    'Palau (SS)',
    'Servizi alla carta pranzo e cena, 120 coperti, da inizio maggio a fine ottobre. Cucina mediterranea con influenze sarde. Un giorno di riposo a settimana, vitto e alloggio forniti da noi in prossimità dei ristoranti.',
    '/restaurant.png'
),
(
    '60000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    'Hotel Palau 4 stelle S',
    'Palau (SS)',
    'Servizio colazione e cena (con bistrot pranzo a turnazione). Colazione al buffet + caffetteria express. Cena servizio impiattato con scelta la sera precedente (max 200 pax), in alta stagione anche ristorante alla carta 20/40 pax con servizi alla francese. Un giorno di riposo a settimana, vitto e alloggio forniti da noi adiacenti o in prossimità della struttura. Da subito fino al 31 ottobre.',
    '/hotel.png'
);

-- 3. Insert Jobs
INSERT INTO job_positions (structure_id, title, salary, icon_name, trello_board_link)
VALUES 
-- Restaurant
('60000000-0000-0000-0000-000000000001', 'Capopartita primi/secondi', '2000€ mese + TFR', 'ChefHat', 'https://trello.com/invite/b/69de17743d25d60a06a13a50/ATTI4d41fc73a754e2049eedda7a2eadf'),
('60000000-0000-0000-0000-000000000001', 'Aiuto Cuoco', '1500€ mese + TFR', 'Utensils', 'https://trello.com/invite/b/69de1ef3e420cf43c790f601/ATTI25dbc03b04b00cc19ea1ccff99052'),
('60000000-0000-0000-0000-000000000001', 'Chef de Rang', '1800€ mese + TFR', 'UtensilsCrossed', 'https://trello.com/invite/b/69de1f18a7f074715b3cd177/ATTIf77586cfab8df181e936acd1d8724'),
('60000000-0000-0000-0000-000000000001', 'Cameriere di Sala', '1400€ mese + TFR', 'Wine', 'https://trello.com/invite/b/69de1f2def13230c7ddbcb4d/ATTI3ec68513367bd498bdcadc75'),

-- Hotel
('60000000-0000-0000-0000-000000000002', 'Capopartita', '1800€ mese + TFR', 'ChefHat', 'https://trello.com/invite/b/69de17743d25d60a06a13a50/ATTI4d41fc73a754e2049eedda7a2eadf'),
('60000000-0000-0000-0000-000000000002', 'Aiuto cuoco', '1400€ mese + TFR', 'Utensils', 'https://trello.com/invite/b/69de1ef3e420cf43c790f601/ATTI25dbc03b04b00cc19ea1ccff99052'),
('60000000-0000-0000-0000-000000000002', 'Chef de Rang', '1800€ mese + TFR', 'UtensilsCrossed', 'https://trello.com/invite/b/69de1f18a7f074715b3cd177/ATTIf77586cfab8df181e936acd1d8724'),
('60000000-0000-0000-0000-000000000002', 'Cameriere di Sala', '1400€ mese + TFR', 'Wine', 'https://trello.com/invite/b/69de1f2def13230c7ddbcb4d/ATTI3ec68513367bd498bdcadc75'),
('60000000-0000-0000-0000-000000000002', 'Barista', '1400€ mese + TFR', 'Coffee', '#'),
('60000000-0000-0000-0000-000000000002', 'Manutentore hotel', '1700€ mese + TFR', 'Wrench', '#'),
('60000000-0000-0000-0000-000000000002', 'Addetta lavanderia', '1400€ mese + TFR', 'Shirt', '#'),
('60000000-0000-0000-0000-000000000002', 'Ricevimento front office', '1500€ mese + TFR', 'ConciergeBell', '#');
