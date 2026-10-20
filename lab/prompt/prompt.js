/* ============================================================
   prompt.js — Prompt Engineering (lezione guidata)
   1) Perché conta (debole vs forte, risposte simulate)
   2) Anatomia interattiva di un prompt
   3) Costruttore a componenti (barra di completezza)
   4) Analizzatore euristico del prompt scritto dall'utente
   5) Debole → forte (con ingredienti aggiunti)
   6) Tecniche (accordion + ricerca)
   7) Errori comuni + casi reali
   Tutto nel browser: nessuna IA, nessun invio.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

  /* tipi/ingredienti di un prompt, con colore ed etichetta */
  const TYPES = {
    ruolo:    { label: "Ruolo", color: "#7c5cff", ex: "Dà all'IA un'identità: ne orienta tono, competenze e priorità. «Sei un…»." },
    compito:  { label: "Compito", color: "#e0533d", ex: "L'azione precisa, con un verbo chiaro (spiega, scrivi, elenca…). È l'unico pezzo davvero obbligatorio." },
    contesto: { label: "Contesto", color: "#2c6fe0", ex: "Per chi e perché serve: il pubblico e lo scopo cambiano completamente la risposta." },
    formato:  { label: "Formato", color: "#3fae6b", ex: "La forma dell'output: elenco, tabella, lunghezza, lingua. Meno libertà = meno sorprese." },
    esempi:   { label: "Esempi", color: "#d99a1c", ex: "Mostrare 1-2 esempi del risultato voluto guida lo stile meglio di mille spiegazioni." },
    vincoli:  { label: "Vincoli", color: "#c2558a", ex: "Cosa includere o evitare, tono, limiti di lunghezza o lingua: meno fraintendimenti." },
  };

  /* ============================================================
     1) PERCHÉ CONTA — debole vs forte (risposte simulate)
     ============================================================ */
  const SCENARIOS = [
    { topic: "✉️ Email al prof",
      weak: "Scrivi un'email al prof.",
      weakOut: "Gentile professore,\nle scrivo per un motivo. Spero vada tutto bene.\nCordiali saluti.",
      weakNote: "Non sa a chi, perché, con che tono né come firmarsi: inventa qualcosa di generico e inutile.",
      strong: "Sei uno studente educato. Scrivi un'email al professore di matematica per chiedere un colloquio la prossima settimana. Tono formale, massimo 6 righe, con oggetto e firma «Mario Rossi, 3ª B».",
      strongOut: "Oggetto: Richiesta di colloquio\n\nGentile professore,\nsono Mario Rossi della 3ª B. Vorrei chiederLe un colloquio la prossima settimana per chiarire alcuni argomenti. Resto a disposizione per giorno e ora.\nGrazie,\nMario Rossi, 3ª B",
      strongNote: "Ruolo, destinatario, scopo, tono, lunghezza e firma: la risposta è pronta da inviare." },
    { topic: "📝 Riassunto",
      weak: "Riassumi questo.",
      weakOut: "Il testo parla di vari argomenti e presenta diverse idee in modo abbastanza completo.",
      weakNote: "Senza lunghezza, formato né pubblico, esce un riassunto vago che non serve a nessuno.",
      strong: "Riassumi il testo in 5 punti elenco, massimo una riga ciascuno, in italiano semplice per uno studente di 1ª superiore.",
      strongOut: "• Idea principale spiegata in parole semplici\n• Secondo punto chiave\n• Terzo punto\n• Quarto punto\n• Conclusione in una riga",
      strongNote: "Formato (5 punti), lunghezza, lingua e pubblico rendono il riassunto davvero usabile." },
    { topic: "💻 Codice",
      weak: "Fammi un sito.",
      weakOut: "Certo! Che tipo di sito? Con quali pagine, colori, tecnologie? Mi servono più dettagli…",
      weakNote: "Troppo vago: l'IA deve indovinare tutto, o ti sommerge di domande.",
      strong: "Sei uno sviluppatore web. Crea una pagina HTML+CSS in un solo file con un titolo, un form di contatto (nome, email, messaggio) e un pulsante. Codice commentato, senza JavaScript.",
      strongOut: "<!-- Pagina di contatto, HTML+CSS in un file -->\n<!DOCTYPE html>\n<html> … titolo, form con nome/email/messaggio, pulsante, stile CSS … </html>",
      strongNote: "Tecnologie, contenuti, vincoli e formato: niente dieci domande di chiarimento." },
    { topic: "📚 Studiare",
      weak: "Spiegami la fotosintesi.",
      weakOut: "La fotosintesi clorofilliana è il processo mediante il quale gli organismi autotrofi convertono l'energia luminosa in energia chimica attraverso reazioni…",
      weakNote: "Senza pubblico esce una definizione da manuale, piena di termini difficili.",
      strong: "Spiega la fotosintesi a un ragazzo di 14 anni con un esempio di tutti i giorni, in massimo 4 frasi, senza termini tecnici che non spieghi.",
      strongOut: "Immagina che le foglie siano piccole cucine. Prendono la luce del sole, l'acqua e l'aria e le trasformano in «cibo» per la pianta. Come energia usano la luce, invece del gas. E come scarto producono l'ossigeno che respiriamo.",
      strongNote: "Pubblico, esempio richiesto, lunghezza e vincolo sul linguaggio: adatta a chi legge." },
  ];
  let scen = 0;
  function renderScenPick() {
    $("peScenPick").innerHTML = SCENARIOS.map((s, i) =>
      '<button type="button" class="pe-scenbtn' + (i === scen ? " active" : "") + '" data-s="' + i + '">' + esc(s.topic) + "</button>").join("");
  }
  function renderCompare() {
    const s = SCENARIOS[scen];
    $("peCompare").innerHTML =
      '<div class="pe-cmp-col weak">' +
        '<span class="pe-cmp-tag weak">✗ Prompt debole</span>' +
        '<div class="pe-cmp-prompt">' + esc(s.weak) + "</div>" +
        '<span class="pe-cmp-arrow">↓ possibile risposta</span>' +
        '<div class="pe-cmp-out">' + esc(s.weakOut).replace(/\n/g, "<br>") + "</div>" +
        '<p class="pe-cmp-note">' + esc(s.weakNote) + "</p>" +
      "</div>" +
      '<div class="pe-cmp-col strong">' +
        '<span class="pe-cmp-tag strong">✓ Prompt forte</span>' +
        '<div class="pe-cmp-prompt">' + esc(s.strong) + "</div>" +
        '<span class="pe-cmp-arrow">↓ possibile risposta</span>' +
        '<div class="pe-cmp-out">' + esc(s.strongOut).replace(/\n/g, "<br>") + "</div>" +
        '<p class="pe-cmp-note">' + esc(s.strongNote) + "</p>" +
      "</div>";
  }
  $("peScenPick").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) { scen = +b.dataset.s; renderScenPick(); renderCompare(); } });

  /* ============================================================
     2) ANATOMIA di un prompt (interattiva)
     ============================================================ */
  const ANATOMY = [
    { type: "ruolo", text: "Sei un insegnante di storia paziente e chiaro." },
    { type: "compito", text: "Spiega la Rivoluzione francese" },
    { type: "contesto", text: "a studenti di 3ª superiore che non l'hanno mai studiata," },
    { type: "formato", text: "in 5 punti elenco, massimo due righe ciascuno," },
    { type: "esempi", text: "sullo stile «1789 — Presa della Bastiglia: il popolo insorge…»," },
    { type: "vincoli", text: "in italiano semplice e senza date inutili." },
  ];
  let anatActive = null;
  function renderAnatLegend() {
    $("peAnatLegend").innerHTML = Object.keys(TYPES).map((k) =>
      '<button type="button" class="pe-leg' + (anatActive === k ? " active" : "") + '" data-type="' + k + '" style="--c:' + TYPES[k].color + '">' +
      '<span class="pe-leg-dot"></span>' + esc(TYPES[k].label) + "</button>").join("");
  }
  function renderAnatomy() {
    $("peAnatomy").innerHTML = ANATOMY.map((p) =>
      '<span class="pe-part' + (anatActive === p.type ? " active" : (anatActive ? " dim" : "")) + '" data-type="' + p.type + '" style="--c:' + TYPES[p.type].color + '">' + esc(p.text) + "</span>").join(" ");
  }
  function renderAnatDetail() {
    if (!anatActive) { $("peAnatDetail").innerHTML = '<span class="pe-anat-hint">👆 Clicca una parte del prompt o un\'etichetta per scoprire a cosa serve.</span>'; return; }
    const t = TYPES[anatActive];
    $("peAnatDetail").innerHTML = '<span class="pe-anat-lbl" style="--c:' + t.color + '">' + esc(t.label) + "</span><p>" + esc(t.ex) + "</p>";
  }
  function setAnat(type) { anatActive = (anatActive === type ? null : type); renderAnatLegend(); renderAnatomy(); renderAnatDetail(); }
  $("peAnatLegend").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) setAnat(b.dataset.type); });
  $("peAnatomy").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) setAnat(b.dataset.type); });

  /* ============================================================
     3) COSTRUTTORE
     ============================================================ */
  const COMPONENTS = [
    { key: "ruolo", label: "Ruolo", req: false,
      ph: "un insegnante di storia paziente e chiaro",
      tip: "Di' all'IA «chi è»: un ruolo la fa rispondere con il taglio e le competenze giuste." },
    { key: "compito", label: "Compito", req: true,
      ph: "Spiega la Rivoluzione francese",
      tip: "L'azione precisa che vuoi, con un verbo chiaro: riassumi, scrivi, elenca, traduci, genera…" },
    { key: "contesto", label: "Contesto / pubblico", req: false, lead: "Contesto:",
      ph: "è per studenti di 3ª superiore che non l'hanno mai studiata",
      tip: "Per chi e perché serve: il pubblico e lo scopo cambiano completamente la risposta." },
    { key: "formato", label: "Formato dell'output", req: false, lead: "Formato:",
      ph: "un elenco di 5 punti, massimo 2 righe ciascuno",
      tip: "Come vuoi la risposta: elenco, tabella, JSON, numero di parole, lingua." },
    { key: "esempi", label: "Esempi (few-shot)", req: false, lead: "Esempio dello stile voluto:",
      ph: "«1789 — Presa della Bastiglia: il popolo insorge…»",
      tip: "Mostrare 1-2 esempi del risultato voluto guida moltissimo lo stile dell'output." },
    { key: "vincoli", label: "Vincoli", req: false, lead: "Vincoli:",
      ph: "in italiano semplice, senza tecnicismi, tono neutro",
      tip: "Cosa includere o evitare, limiti di lunghezza, lingua e tono: meno fraintendimenti." },
  ];
  const vals = {};

  function renderFields() {
    $("peFields").innerHTML = COMPONENTS.map((c) =>
      '<div class="pe-field" style="--c:' + TYPES[c.key].color + '">' +
      '<label for="pe_' + c.key + '">' + esc(c.label) + (c.req ? ' <span class="pe-req">obbligatorio</span>' : "") + "</label>" +
      '<input id="pe_' + c.key + '" type="text" data-k="' + c.key + '" autocomplete="off" placeholder="' + escAttr(c.ph) + '">' +
      '<p class="pe-tip">' + esc(c.tip) + "</p></div>"
    ).join("");
    $("peFields").querySelectorAll("input").forEach((inp) =>
      inp.addEventListener("input", () => { vals[inp.dataset.k] = inp.value; buildPrompt(); }));
  }

  function buildPrompt() {
    const lines = [];
    COMPONENTS.forEach((c) => {
      const v = (vals[c.key] || "").trim();
      if (!v) return;
      if (c.key === "ruolo") lines.push("Sei " + v + ".");
      else if (c.key === "compito") lines.push(v.charAt(0).toUpperCase() + v.slice(1) + ".");
      else lines.push(c.lead + " " + v + ".");
    });
    const txt = lines.join("\n");
    $("pePreview").textContent = txt || "(compila almeno il Compito per vedere il prompt)";

    const filled = COMPONENTS.filter((c) => (vals[c.key] || "").trim());
    const hasTask = !!(vals.compito || "").trim();
    let score = 0;
    if (hasTask) score += 40;
    score += filled.filter((c) => c.key !== "compito").length * 12;
    score = Math.min(100, score);
    const fill = $("peMeterFill"), lbl = $("peMeterLbl");
    fill.style.width = score + "%";
    fill.className = "pe-meter-fill " + (score < 40 ? "lv0" : score < 64 ? "lv1" : score < 88 ? "lv2" : "lv3");
    lbl.textContent = !hasTask ? "Manca il compito" : score < 64 ? "Essenziale" : score < 88 ? "Buono" : "Completo";
  }

  $("peCopy").addEventListener("click", () => {
    const t = $("pePreview").textContent;
    if (!t || t.charAt(0) === "(") return;
    navigator.clipboard && navigator.clipboard.writeText(t);
    const b = $("peCopy"); const old = b.textContent; b.textContent = "✓ Copiato"; setTimeout(() => (b.textContent = old), 1200);
  });

  /* ============================================================
     4) ANALIZZATORE (euristico)
     ============================================================ */
  const VERBS = ["riassum", "scriv", "genera", "crea", "elenc", "spieg", "traduc", "corregg", "analizz", "confront",
    "classific", "calcol", "progett", "descriv", "trasform", "miglior", "suggeris", "inventa", "racconta", "pianifica",
    "rispondi", "fornisci", "proponi", "indica", "mostra", "aiutami", "dammi", "redigi", "stila", "compon", "verifica",
    "ordina", "estrai", "riscriv", "semplific", "amplia", "continua", "completa", "valuta", "commenta", "schematizza",
    "risolvi", "trova", "cerca", "scegli", "organizza", "convert", "adatta", "sintetizza"];
  const vagueRe = /\b(qualcosa|carino|bello|buono|interessante|roba|cose|generico|ottimo|fico|decente|un po')\b/g;
  const RE = {
    ruolo: /\b(sei (un|uno|una|un')|agisci (come|da)|comportati come|nei panni di|fai finta di|immagina di essere|rispondi come|parla come|in qualità di|assumi il ruolo|vesti i panni|come un esperto)/,
    formato: /\b(elenc|punti|punto|lista|tabell|schema|colonn|json|yaml|csv|markdown|html|codice|paragraf|riga|righe|frase|frasi|parole|caratter|battute|formato|titolo|grassetto|in italiano|in inglese|in francese|in spagnolo|in tedesco|passo per passo|passagg|in \d|massimo \d|max \d|al massimo \d|almeno \d|\d+\s*(punti|parole|righe|frasi|passi|paragraf))/,
    contesto: /\b(per (un|una|uno|il|lo|la|i|gli|le|chi|dei|delle|degli|gente)|rivolto a|destinat|pubblico|target|lettor|studenti|aliev|principiant|bambin|ragazz|adult|espert|client|utent|azienda|scuola|classe|\d+\s*anni|terza|quarta|quinta|prima|seconda|superiore|medie|elementar|contesto|scopo|obiettivo|mi serve|ho bisogno|si tratta|sto (scrivendo|preparando|creando|facendo))/,
    vincoli: /\b(non |senza |solo |soltanto|evita|includ|escludi|deve |devono|vietat|limit|entro|al massimo|massimo|minimo|almeno|tono|stile|registro|formale|informale|professional|amichevole|semplice|tecnic|concis|dettagliat|breve|sintetic|neutro|chiar)/,
    esempi: /\b(esempi|esempio|ad esempio|per esempio|tipo:|modello:|schema:|come segue|ecco un esempio|input\s*:|output\s*:|few.?shot)/,
  };
  function analyze(text) {
    const t = text.trim();
    const low = " " + t.toLowerCase().replace(/\s+/g, " ") + " ";
    const has = (re) => re.test(low);
    const foundVague = low.match(vagueRe) || [];
    const checks = [
      { w: 20, core: true, ok: VERBS.some((v) => low.indexOf(v) !== -1), label: "Compito chiaro (un verbo d'azione)",
        sugg: "Inizia con un verbo concreto: «Riassumi…», «Scrivi…», «Spiega…», «Elenca…»." },
      { w: 18, core: true, ok: t.length >= 35 && foundVague.length === 0, label: "Specifico (niente parole vaghe)",
        sugg: foundVague.length ? "Evita parole vaghe come «" + foundVague[0].trim() + "»: di' esattamente cosa vuoi." : "Aggiungi dettagli concreti: numeri, nomi, criteri precisi." },
      { w: 16, core: true, ok: has(RE.formato), label: "Formato o lunghezza specificati",
        sugg: "Di' come vuoi la risposta: «in 5 punti», «in una tabella», «max 100 parole», «in italiano»." },
      { w: 16, core: true, ok: has(RE.contesto), label: "Contesto o pubblico indicato",
        sugg: "Spiega per chi/perché serve: «per studenti di prima superiore», «per un volantino»." },
      { w: 15, core: true, ok: has(RE.vincoli), label: "Vincoli (cosa fare o evitare, tono)",
        sugg: "Aggiungi limiti: «in italiano semplice», «senza tecnicismi», «tono formale», «max 3 frasi»." },
      { w: 10, core: false, ok: has(RE.ruolo), label: "Ruolo assegnato all'IA",
        sugg: "Dai un ruolo: «Sei un insegnante di…», «Agisci come un esperto di…»." },
      { w: 5, core: false, ok: has(RE.esempi), label: "Esempi forniti (few-shot)",
        sugg: "Mostra 1-2 esempi del risultato che vuoi: guidano molto lo stile dell'output." },
    ];
    const score = checks.filter((c) => c.ok).reduce((a, c) => a + c.w, 0);
    return { checks, score: Math.min(100, score) };
  }
  function renderReport() {
    const text = $("peInput").value;
    if (!text.trim()) {
      $("peReport").innerHTML = '<div class="pe-report-empty">Scrivi un prompt qui a sinistra: comparirà l\'analisi con i punti forti e i suggerimenti.</div>';
      return;
    }
    const r = analyze(text);
    const lvl = r.score < 50 ? "lv0" : r.score < 80 ? "lv1" : "lv2";
    const word = r.score < 50 ? "Da rinforzare" : r.score < 80 ? "Discreto" : "Forte";
    let h = '<div class="pe-score ' + lvl + '"><span class="pe-score-n">' + r.score + '</span><span class="pe-score-u">/100</span>' +
      '<span class="pe-score-t">' + word + "</span></div>";
    h += '<ul class="pe-checks">';
    r.checks.forEach((c) => {
      h += '<li class="pe-check ' + (c.ok ? "ok" : "no") + '"><span class="mk">' + (c.ok ? "✓" : "+") + "</span>" +
        "<span><b>" + esc(c.label) + "</b>" + (c.core ? "" : ' <em class="pe-bonus">bonus</em>') +
        (c.ok ? "" : '<small>' + esc(c.sugg) + "</small>") + "</span></li>";
    });
    h += "</ul>";
    $("peReport").innerHTML = h;
  }
  $("peInput").addEventListener("input", renderReport);

  // pulsanti "prova con…" che caricano un prompt nell'analizzatore
  const TRY = [
    { lbl: "un prompt debole", text: "scrivimi qualcosa sui cani" },
    { lbl: "un prompt forte", text: "Sei un veterinario. Scrivi 3 consigli pratici per chi adotta un cucciolo di labrador, in elenco puntato, massimo due righe ciascuno, in italiano semplice." },
  ];
  function renderTry() {
    $("peTry").innerHTML = '<span class="pe-try-lbl">Prova con:</span>' + TRY.map((t, i) =>
      '<button type="button" class="pe-trybtn" data-i="' + i + '">' + esc(t.lbl) + "</button>").join("");
  }
  $("peTry").addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    $("peInput").value = TRY[+b.dataset.i].text; renderReport(); $("peInput").focus();
  });

  /* ============================================================
     5) DEBOLE → FORTE (con ingredienti aggiunti)
     ============================================================ */
  const EXAMPLES = [
    { task: "Scrivere un'email", weak: "Scrivi un'email al prof.",
      strong: "Sei uno studente educato. Scrivi un'email al professore di matematica per chiedere un colloquio la prossima settimana. Tono formale, massimo 6 righe, con oggetto e firma «Mario Rossi, 3ª B».",
      adds: ["ruolo", "contesto", "formato", "vincoli"],
      why: "Ruolo, destinatario, scopo, tono, lunghezza e formato: l'IA ha tutto per centrare la risposta al primo colpo." },
    { task: "Riassumere un testo", weak: "Riassumi questo.",
      strong: "Riassumi il testo seguente in 5 punti elenco, massimo una riga ciascuno, in italiano semplice per uno studente di 1ª superiore. Testo: «…».",
      adds: ["formato", "contesto", "vincoli"],
      why: "Formato (5 punti), lunghezza, pubblico e lingua trasformano un riassunto qualunque in uno davvero utile." },
    { task: "Generare codice", weak: "Fammi un sito.",
      strong: "Sei uno sviluppatore web. Crea una pagina HTML+CSS in un solo file con un titolo, un form di contatto (nome, email, messaggio) e un pulsante. Codice commentato, senza JavaScript.",
      adds: ["ruolo", "formato", "vincoli"],
      why: "Tecnologie, contenuti, vincoli e formato evitano dieci domande di chiarimento e mille tentativi." },
    { task: "Studiare un argomento", weak: "Spiegami la fotosintesi.",
      strong: "Spiega la fotosintesi a un ragazzo di 14 anni usando un esempio di tutti i giorni, in massimo 4 frasi, senza usare termini tecnici che non spieghi.",
      adds: ["contesto", "esempi", "formato", "vincoli"],
      why: "Pubblico, esempio richiesto, lunghezza e vincolo sul linguaggio rendono la spiegazione adatta a chi legge." },
    { task: "Creare una tabella", weak: "Dammi info sui pianeti.",
      strong: "Crea una tabella dei pianeti del Sistema Solare con colonne: nome, distanza dal Sole (in UA), numero di lune. Ordina dal più vicino al più lontano, solo i dati, senza testo introduttivo.",
      adds: ["formato", "vincoli"],
      why: "Chiedere una struttura precisa (colonne, ordine, «solo i dati») ti dà un risultato pulito e riusabile." },
  ];
  function renderExamples() {
    $("peExamples").innerHTML = EXAMPLES.map((e) => {
      const chips = (e.adds || []).map((k) =>
        '<span class="pe-add" style="--c:' + TYPES[k].color + '">+ ' + esc(TYPES[k].label) + "</span>").join("");
      return '<div class="pe-ex">' +
        '<div class="pe-ex-task">' + esc(e.task) + "</div>" +
        '<div class="pe-ex-pair">' +
          '<div class="pe-ex-col weak"><span class="pe-ex-tag">✗ Debole</span><p>' + esc(e.weak) + "</p></div>" +
          '<div class="pe-ex-col strong"><span class="pe-ex-tag">✓ Forte</span><p>' + esc(e.strong) + "</p></div>" +
        "</div>" +
        '<div class="pe-ex-adds"><span class="pe-ex-adds-lbl">Aggiunti:</span>' + chips + "</div>" +
        '<p class="pe-ex-why"><b>Perché funziona:</b> ' + esc(e.why) + "</p></div>";
    }).join("");
  }

  /* ============================================================
     6) TECNICHE (accordion + ricerca)
     ============================================================ */
  const TECH = [
    { name: "Zero-shot", tag: "chiedi e basta",
      desc: "Chiedi direttamente, senza esempi. Funziona per compiti semplici e comuni che l'IA «conosce già». Es. <code>Traduci in inglese: «buongiorno»</code>." },
    { name: "Few-shot (con esempi)", tag: "mostra 1-3 esempi",
      desc: "Prima della richiesta vera mostri qualche coppia <b>input → output</b>: l'IA imita lo schema. Utilissimo quando vuoi un <b>formato</b> o uno <b>stile</b> preciso difficile da descrivere a parole. Es.: <code>felice → 🙂 / triste → 🙁 / stanco → ?</code>" },
    { name: "Assegna un ruolo", tag: "«Sei un…»",
      desc: "Dai un'identità all'IA: <code>Sei un correttore di bozze severo</code>. Cambia il <b>tono</b>, le <b>competenze</b> richiamate e le <b>priorità</b> della risposta." },
    { name: "Ragiona passo-passo", tag: "chain-of-thought",
      desc: "Aggiungi <code>ragiona passo per passo prima di rispondere</code>. Per problemi di <b>logica</b> o <b>matematica</b> spesso migliora la correttezza, perché l'IA «mostra il lavoro» invece di tirare a indovinare." },
    { name: "Specifica il formato", tag: "elenco, tabella, lunghezza",
      desc: "Indica esattamente la forma dell'output: <b>elenco</b>, <b>tabella</b>, <b>JSON</b>, numero di parole, lingua. Meno libertà = meno sorprese e risposte più riusabili." },
    { name: "Dai contesto e vincoli", tag: "pubblico, scopo, limiti",
      desc: "Spiega <b>per chi</b> e <b>perché</b> serve, e cosa <b>includere o evitare</b>. Più contesto utile fornisci, meno l'IA deve indovinare (e meno sbaglia bersaglio)." },
    { name: "Dalle un «out»", tag: "cosa fare se non sa",
      desc: "Di' all'IA come comportarsi nei casi dubbi: <code>se non sei sicuro, dillo invece di inventare</code>, oppure <code>se manca un dato, chiedimelo</code>. Riduce le risposte inventate." },
    { name: "Itera e raffina", tag: "il primo prompt non è mai perfetto",
      desc: "Leggi la risposta e correggi il tiro con richieste brevi: <code>più corto</code>, <code>con un esempio</code>, <code>tono più formale</code>. Il prompting è un dialogo, non un colpo solo." },
    { name: "Spezza i compiti complessi", tag: "un passo alla volta",
      desc: "Una richiesta enorme produce errori. <b>Suddividila</b> in passi più piccoli e affrontali uno per volta (prima la scaletta, poi ogni paragrafo): la qualità sale parecchio." },
    { name: "Attenzione alle «allucinazioni»", tag: "verifica sempre",
      desc: "L'IA può inventare fatti, citazioni o numeri con grande sicurezza. Chiedi le <b>fonti</b>, falle <b>verificare</b> i passaggi e non fidarti dei dati importanti senza controllarli tu." },
  ];
  function renderGuide() {
    $("peGuide").innerHTML = TECH.map((t) => {
      const s = (t.name + " " + t.tag + " " + t.desc).toLowerCase().replace(/<[^>]+>/g, "");
      return '<details class="guide-cmd" data-search="' + escAttr(s) + '">' +
        '<summary><span class="g-name">' + esc(t.name) + '</span><span class="g-syntax">' + esc(t.tag) + "</span></summary>" +
        '<div class="g-body"><p class="g-desc">' + t.desc + "</p></div></details>";
    }).join("");
  }
  $("peSearch").addEventListener("input", () => {
    const q = $("peSearch").value.trim().toLowerCase();
    let any = false;
    $("peGuide").querySelectorAll(".guide-cmd").forEach((c) => {
      const m = q === "" || c.dataset.search.indexOf(q) >= 0;
      c.hidden = !m; if (m) any = true; c.open = q !== "" && m;
    });
    $("peEmpty").hidden = any;
  });

  /* ============================================================
     7) ERRORI COMUNI + CASI REALI
     ============================================================ */
  const MISTAKES = [
    { bad: "«Scrivimi qualcosa di carino.»", fix: "Di' esattamente cosa: argomento, formato, lunghezza, tono.", why: "«Carino» non significa niente per l'IA: riempirà il vuoto a caso." },
    { bad: "Chiedere tutto in una frase gigante.", fix: "Spezza in passi: prima la scaletta, poi ogni parte.", why: "Le richieste enormi producono errori e omissioni." },
    { bad: "Dare per scontato il contesto.", fix: "Esplicita pubblico, scopo e vincoli.", why: "L'IA non sa chi sei né perché lo chiedi: deve indovinare." },
    { bad: "Fidarsi di numeri, date e fonti.", fix: "Verifica sempre: può inventarli con sicurezza.", why: "Sceglie parole plausibili, non vere (allucinazioni)." },
    { bad: "Accontentarsi della prima risposta.", fix: "Itera: «più corto», «con un esempio», «tono più formale».", why: "Il prompting è un dialogo, non un colpo solo." },
    { bad: "Incollare password o dati sensibili.", fix: "Non condividere segreti né dati personali altrui.", why: "Potrebbero essere conservati o usati per l'addestramento." },
  ];
  function renderMistakes() {
    $("peMistakes").innerHTML = MISTAKES.map((m) =>
      '<div class="pe-mis">' +
      '<div class="pe-mis-bad"><span class="pe-mis-x">✗</span>' + esc(m.bad) + "</div>" +
      '<div class="pe-mis-fix"><span class="pe-mis-v">✓</span>' + esc(m.fix) + "</div>" +
      '<p class="pe-mis-why">' + esc(m.why) + "</p></div>").join("");
  }
  const REAL = [
    { t: "Prompt di sistema vs tuo prompt", d: "Dietro ChatGPT c'è spesso un <b>prompt di sistema</b> nascosto («sei un assistente utile e onesto…») che guida il comportamento, prima ancora del tuo messaggio." },
    { t: "La «memoria» è limitata", d: "Il modello ricorda solo ciò che sta nella sua <b>context window</b> (la conversazione corrente + i documenti che incolli). Fuori da lì, non sa nulla di te." },
    { t: "Non sempre è aggiornato", d: "Molti modelli conoscono il mondo fino a una certa data e non navigano da soli: per fatti recenti servono strumenti di ricerca o verifica." },
    { t: "Stesso prompt, risposte diverse", d: "Per via del campionamento (la «temperatura»), lo stesso prompt può dare risposte un po' diverse ogni volta. Normale." },
  ];
  function renderReal() {
    $("peReal").innerHTML = '<h3 class="pe-real-h">Buono a sapersi (nel mondo reale)</h3>' +
      '<div class="pe-real-grid">' + REAL.map((r) =>
        '<div class="pe-real-card"><b>' + esc(r.t) + "</b><p>" + r.d + "</p></div>").join("") + "</div>";
  }

  /* ---------- Avvio ---------- */
  renderScenPick(); renderCompare();
  renderAnatLegend(); renderAnatomy(); renderAnatDetail();
  renderFields(); buildPrompt();
  renderTry(); renderReport();
  renderExamples(); renderGuide();
  renderMistakes(); renderReal();
})();
