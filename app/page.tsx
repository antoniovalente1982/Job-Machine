import pageStyles from './page.module.css';
import { 
  ChefHat, 
  Utensils, 
  UtensilsCrossed, 
  Wine, 
  Coffee, 
  Wrench, 
  Shirt, 
  ConciergeBell
} from 'lucide-react';

const structuresData = [
  {
    id: "ristorante",
    name: "Ristorante Pasta e Vino / Ristorante FRESCO",
    location: "Palau (SS)",
    description: "Servizi alla carta pranzo e cena, 120 coperti, da inizio maggio a fine ottobre. Cucina mediterranea con influenze sarde. Un giorno di riposo a settimana, vitto e alloggio forniti da noi in prossimità dei ristoranti.",
    image: "/restaurant.png",
    roles: [
      {
        title: "Capopartita primi/secondi",
        salary: "2000€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de17743d25d60a06a13a50/ATTI4d41fc73a754e2049eedda7a2eadf",
        icon: <ChefHat size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Aiuto Cuoco",
        salary: "1500€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de1ef3e420cf43c790f601/ATTI25dbc03b04b00cc19ea1ccff99052",
        icon: <Utensils size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Chef de Rang",
        salary: "1800€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de1f18a7f074715b3cd177/ATTIf77586cfab8df181e936acd1d8724",
        icon: <UtensilsCrossed size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Cameriere di Sala",
        salary: "1400€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de1f2def13230c7ddbcb4d/ATTI3ec68513367bd498bdcadc75",
        icon: <Wine size={22} className={pageStyles.roleIcon} />
      }
    ]
  },
  {
    id: "hotel",
    name: "Hotel Palau 4 stelle S",
    location: "Palau (SS)",
    description: "Servizio colazione e cena (con bistrot pranzo a turnazione). Colazione al buffet + caffetteria express. Cena servizio impiattato con scelta la sera precedente (max 200 pax), in alta stagione anche ristorante alla carta 20/40 pax con servizi alla francese. Un giorno di riposo a settimana, vitto e alloggio forniti da noi adiacenti o in prossimità della struttura. Da subito fino al 31 ottobre.",
    image: "/hotel.png",
    roles: [
      {
        title: "Capopartita",
        salary: "1800€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de17743d25d60a06a13a50/ATTI4d41fc73a754e2049eedda7a2eadf",
        icon: <ChefHat size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Aiuto cuoco",
        salary: "1400€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de1ef3e420cf43c790f601/ATTI25dbc03b04b00cc19ea1ccff99052",
        icon: <Utensils size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Chef de Rang",
        salary: "1800€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de1f18a7f074715b3cd177/ATTIf77586cfab8df181e936acd1d8724",
        icon: <UtensilsCrossed size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Cameriere di Sala",
        salary: "1400€ mese + TFR",
        trelloLink: "https://trello.com/invite/b/69de1f2def13230c7ddbcb4d/ATTI3ec68513367bd498bdcadc75",
        icon: <Wine size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Barista",
        salary: "1400€ mese + TFR",
        trelloLink: "#",
        icon: <Coffee size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Manutentore hotel",
        salary: "1700€ mese + TFR",
        trelloLink: "#",
        icon: <Wrench size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Addetta lavanderia",
        salary: "1400€ mese + TFR",
        trelloLink: "#",
        icon: <Shirt size={22} className={pageStyles.roleIcon} />
      },
      {
        title: "Ricevimento front office",
        salary: "1500€ mese + TFR",
        trelloLink: "#",
        icon: <ConciergeBell size={22} className={pageStyles.roleIcon} />
      }
    ]
  }
];

export default function Home() {
  return (
    <main className={pageStyles.main}>
      <header className={pageStyles.header}>
        <div className={`glass-panel ${pageStyles.logo}`}>
          <span className={pageStyles.logoAccent}>CMG</span> Recruiting
        </div>
        <nav className={pageStyles.nav}>
          <div className={pageStyles.navLinkActive}>Gestione Trello</div>
        </nav>
      </header>

      <section className={pageStyles.hero}>
        <div className={pageStyles.superTitle}>Consulting Manager Group (HR MACHINE)</div>
        <h1 className={pageStyles.title}>Portale Smistamento Candidati</h1>
        <p className={pageStyles.subtitle}>
          Seleziona la struttura e apri la bacheca Trello corrispondente per gestire i candidati.
        </p>
      </section>

      <div className={pageStyles.structuresContainer}>
        {structuresData.map((structure) => (
          <div key={structure.id} className={pageStyles.structureSection}>
            <div className={pageStyles.structureHeader}>
              <img src={structure.image} alt={structure.name} className={pageStyles.structureImage} />
              <div className={pageStyles.structureTitleContainer}>
                <h2 className={pageStyles.structureTitle}>{structure.name}</h2>
                <span className={pageStyles.structureLocation}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {structure.location}
                </span>
              </div>
            </div>
            <p className={pageStyles.structureDesc}>{structure.description}</p>
            
            <div className={pageStyles.rolesGrid}>
              {structure.roles.map((role, idx) => (
                <div key={idx} className={`glass-panel ${pageStyles.roleCard}`}>
                  <div className={pageStyles.roleInfo}>
                    <h3 className={pageStyles.roleTitle}>
                      {role.icon}
                      <span>{role.title}</span>
                    </h3>
                    <div className={pageStyles.roleSalary}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      {role.salary}
                    </div>
                  </div>
                  <a href={role.trelloLink} target="_blank" rel="noopener noreferrer" className={pageStyles.trelloButton}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="9"></rect><rect x="14" y="7" width="3" height="5"></rect></svg>
                    <span>Apri Bacheca</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
