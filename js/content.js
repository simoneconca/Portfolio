/* ============================================================
   CONTENUTI DEL SITO — modifica solo questo file.
   Salva e ricarica la pagina: nessuna compilazione necessaria.
   ============================================================ */

/* --- Contatti e link social --- */
const SITE = {
  email: "simone.conca2006@gmail.com",
  links: [
    { label: "Instagram", url: "https://instagram.com/simoneconca_" }
  ]
};

/* --- Progetti ---
   Campi: title, description, tags[], page (pagina di presentazione interna),
          demo (URL app/live o ""), repo (URL codice o "").
   "page" apre nella stessa scheda; "demo"/"repo" in una nuova.
   Aggiungi "placeholder: true" alle card ancora da riempire. */
const PROJECTS = [
  {
    title: "AURA",
    description: "App personale (Flutter) per tenere insieme la vita di tutti i giorni: calendario ed eventi, abitudini, obiettivi, diario, spese, galleria e documenti. Funziona offline, con un database locale crittografato.",
    tags: ["Flutter", "Dart", "App mobile"],
    page: "progetti/aura/",
    demo: "",
    repo: ""
  },
  {
    title: "GestForm",
    description: "Gestionale web (PHP + MySQL) per dipendenti, corsi di formazione, visite mediche e relative scadenze. È uno dei miei primi progetti, realizzato durante le superiori.",
    tags: ["PHP", "MySQL", "Progetto scolastico"],
    page: "progetti/gestionale/",
    demo: "",
    repo: ""
  }
  // Aggiungi qui gli altri tuoi progetti:
  // { title: "...", description: "...", tags: ["..."], page: "", demo: "", repo: "" }
];

/* --- Pubblicazioni (manuali Amazon) ---
   Campi: title, description, year, status, url (lascia "" se non ancora online).
   Sostituisci con i titoli reali appena i manuali sono pronti. */
const PUBLICATIONS = [
  {
    title: "Manuale di informatica per le superiori",
    description: "Un manuale pensato per studenti e docenti, con spiegazioni chiare ed esempi pratici. Attualmente in scrittura: il titolo definitivo e i dettagli arriveranno alla pubblicazione.",
    year: "2026",
    status: "In preparazione",
    url: ""
  }
];
