/* ============================================================
   CONTENUTI DEL SITO — modifica solo questo file.
   Salva e ricarica la pagina: nessuna compilazione necessaria.
   ============================================================ */

/* --- Contatti e link social --- */
const SITE = {
  email: "simone.conca2006@gmail.com",
  links: [
    { label: "GitHub", url: "https://github.com/simoneconca" }
    // Aggiungi altri link qui, es: { label: "LinkedIn", url: "https://..." }
  ]
};

/* --- Progetti ---
   Campi: title, description, tags[], demo (URL o ""), repo (URL o "").
   Aggiungi "placeholder: true" alle card ancora da riempire. */
const PROJECTS = [
  {
    title: "Primo progetto",
    description: "Breve descrizione di cosa fa e perché l'hai creato — un tool per studenti, un eserciziario o un lavoro personale.",
    tags: ["Didattica", "Web"],
    demo: "",
    repo: "https://github.com/simoneconca"
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
    description: "Placeholder: sostituisci o elimina questa card quando pubblichi qualcosa di nuovo.",
    tags: ["In arrivo"],
    demo: "",
    repo: "",
    placeholder: true
  }
];

/* --- Pubblicazioni (manuali Amazon) ---
   Campi: title, description, year, status, url (lascia "" se non ancora online). */
const PUBLICATIONS = [
  {
    title: "Titolo del primo manuale",
    description: "Di cosa tratta, a chi è rivolto e cosa imparerà chi lo legge.",
    year: "2026",
    status: "In preparazione",
    url: ""
  },
  {
    title: "Secondo manuale",
    description: "Aggiungi altre pubblicazioni man mano che le completi.",
    year: "2026",
    status: "Bozza",
    url: ""
  }
];
