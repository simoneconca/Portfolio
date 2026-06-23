/**
 * Modifica questo file per aggiornare progetti, pubblicazioni e contatti.
 * Non serve ricompilare nulla: salva e ricarica la pagina.
 */

const SITE = {
  email: "simone.conca@example.com",
  links: [
    { label: "GitHub", url: "https://github.com/TUO-USERNAME" },
    { label: "LinkedIn", url: "https://linkedin.com/in/TUO-PROFILO" }
  ]
};

const PROJECTS = [
  {
    title: "Titolo del tuo primo progetto",
    description: "Breve descrizione di cosa fa e perché l'hai creato. Può essere un tool per studenti, un eserciziario o un lavoro personale.",
    tags: ["Didattica", "Web"],
    demo: "",
    repo: "https://github.com/TUO-USERNAME/nome-repo"
  },
  {
    title: "Progetto di diploma",
    description: "Descrivi qui il tuo lavoro di maturità o un progetto scolastico rilevante.",
    tags: ["Progetto scolastico"],
    demo: "",
    repo: ""
  },
  {
    title: "Prossimo progetto",
    description: "Placeholder: sostituisci o elimina questa card quando aggiungi qualcosa di nuovo.",
    tags: ["In arrivo"],
    demo: "",
    repo: "",
    placeholder: true
  }
];

const PUBLICATIONS = [
  {
    title: "Titolo del primo manuale",
    description: "Di cosa tratta, a chi è rivolto e cosa imparerà chi lo legge.",
    year: "2026",
    status: "In preparazione",
    url: ""
  },
  {
    title: "Secondo manuale (opzionale)",
    description: "Aggiungi altre pubblicazioni man mano che le completi.",
    year: "2026",
    status: "Bozza",
    url: ""
  }
];
