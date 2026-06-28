/* ============================================================
   prompt.js — Prompt Engineering
   1) Costruttore di prompt a componenti (con barra di completezza)
   2) Analizzatore euristico del prompt scritto dall'utente
   3) Esempi debole → forte
   4) Accordion di tecniche, con ricerca
   Tutto nel browser: nessuna IA, nessun invio.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

  /* ============================================================
     1) COSTRUTTORE
     ============================================================ */
  const COMPONENTS = [
    { key: "ruolo", label: "Ruolo", req: false, lead: "Sei",
      ph: "un insegnante di storia paziente e chiaro",
      tip: "Di' all'IA «chi è»: un ruolo la fa rispondere con il taglio e le competenze giuste." },
    { key: "compito", label: "Compito", req: true, lead: "",
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
      '<div class="pe-field">' +
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

    // completezza: il compito vale molto, gli altri si sommano
    const filled = COMPONENTS.filter((c) => (vals[c.key] || "").trim());
    const hasTask = !!(vals.compito || "").trim();
    let score = 0;
    if (hasTask) score += 40;
    score += filled.filter((c) => c.key !== "compito").length * 12; // 5 opzionali × 12 = 60
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
     2) ANALIZZATORE (euristico)
     ============================================================ */
  // verbi d'azione (radici): se compaiono nel testo, c'è un compito chiaro
  const VERBS = ["riassum", "scriv", "genera", "crea", "elenc", "spieg", "traduc", "corregg", "analizz", "confront",
    "classific", "calcol", "progett", "descriv", "trasform", "miglior", "suggeris", "inventa", "racconta", "pianifica",
    "rispondi", "fornisci", "proponi", "indica", "mostra", "aiutami", "dammi", "redigi", "stila", "compon", "verifica",
    "ordina", "estrai", "riscriv", "semplific", "amplia", "continua", "completa", "valuta", "commenta", "schematizza",
    "risolvi", "trova", "cerca", "scegli", "organizza", "convert", "adatta", "sintetizza"];
  const vagueRe = /\b(qualcosa|carino|bello|buono|interessante|roba|cose|generico|ottimo|fico|decente|un po')\b/g;

  // niente confine finale \b: così le radici (principiant, elenc, destinat…) matchano anche le forme flesse
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
    // peso: gli essenziali bastano per un voto alto; ruolo ed esempi sono bonus
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

  /* ============================================================
     3) DEBOLE → FORTE
     ============================================================ */
  const EXAMPLES = [
    { task: "Scrivere un'email", weak: "Scrivi un'email al prof.",
      strong: "Sei uno studente educato. Scrivi un'email al professore di matematica per chiedere un colloquio la prossima settimana. Tono formale, massimo 6 righe, con oggetto e firma «Mario Rossi, 3ª B».",
      why: "Ruolo, destinatario, scopo, tono, lunghezza e formato: l'IA ha tutto per centrare la risposta al primo colpo." },
    { task: "Riassumere un testo", weak: "Riassumi questo.",
      strong: "Riassumi il testo seguente in 5 punti elenco, massimo una riga ciascuno, in italiano semplice per uno studente di 1ª superiore. Testo: «…».",
      why: "Formato (5 punti), lunghezza, pubblico e lingua trasformano un riassunto qualunque in uno davvero utile." },
    { task: "Generare codice", weak: "Fammi un sito.",
      strong: "Sei uno sviluppatore web. Crea una pagina HTML+CSS in un solo file con un titolo, un form di contatto (nome, email, messaggio) e un pulsante. Codice commentato, senza JavaScript.",
      why: "Tecnologie, contenuti, vincoli e formato evitano dieci domande di chiarimento e mille tentativi." },
    { task: "Studiare un argomento", weak: "Spiegami la fotosintesi.",
      strong: "Spiega la fotosintesi a un ragazzo di 14 anni usando un esempio di tutti i giorni, in massimo 4 frasi, senza usare termini tecnici che non spieghi.",
      why: "Pubblico, esempio richiesto, lunghezza e vincolo sul linguaggio rendono la spiegazione adatta a chi legge." },
  ];
  function renderExamples() {
    $("peExamples").innerHTML = EXAMPLES.map((e, i) =>
      '<div class="pe-ex">' +
      '<div class="pe-ex-task">' + esc(e.task) + "</div>" +
      '<div class="pe-ex-pair">' +
        '<div class="pe-ex-col weak"><span class="pe-ex-tag">✗ Debole</span><p>' + esc(e.weak) + "</p></div>" +
        '<div class="pe-ex-col strong"><span class="pe-ex-tag">✓ Forte</span><p>' + esc(e.strong) + "</p></div>" +
      "</div>" +
      '<p class="pe-ex-why"><b>Perché funziona:</b> ' + esc(e.why) + "</p></div>"
    ).join("");
  }

  /* ============================================================
     4) TECNICHE (accordion + ricerca)
     ============================================================ */
  const TECH = [
    { name: "Zero-shot", tag: "chiedi e basta",
      desc: "Chiedi direttamente, senza esempi. Funziona per compiti semplici e comuni che l'IA «conosce già». Es. <code>Traduci in inglese: «buongiorno»</code>." },
    { name: "Few-shot (con esempi)", tag: "mostra 1-3 esempi",
      desc: "Prima della richiesta vera mostri qualche coppia <b>input → output</b>: l'IA imita lo schema. Utilissimo quando vuoi un <b>formato</b> o uno <b>stile</b> preciso difficile da descrivere a parole." },
    { name: "Assegna un ruolo", tag: "«Sei un…»",
      desc: "Dai un'identità all'IA: <code>Sei un correttore di bozze severo</code>. Cambia il <b>tono</b>, le <b>competenze</b> richiamate e le <b>priorità</b> della risposta." },
    { name: "Ragiona passo-passo", tag: "chain-of-thought",
      desc: "Aggiungi <code>ragiona passo per passo prima di rispondere</code>. Per problemi di <b>logica</b> o <b>matematica</b> spesso migliora la correttezza, perché l'IA «mostra il lavoro» invece di tirare a indovinare." },
    { name: "Specifica il formato", tag: "elenco, tabella, lunghezza",
      desc: "Indica esattamente la forma dell'output: <b>elenco</b>, <b>tabella</b>, <b>JSON</b>, numero di parole, lingua. Meno libertà = meno sorprese e risposte più riusabili." },
    { name: "Dai contesto e vincoli", tag: "pubblico, scopo, limiti",
      desc: "Spiega <b>per chi</b> e <b>perché</b> serve, e cosa <b>includere o evitare</b>. Più contesto utile fornisci, meno l'IA deve indovinare (e meno sbaglia bersaglio)." },
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

  /* ---------- Avvio ---------- */
  renderFields(); buildPrompt();
  renderReport(); renderExamples(); renderGuide();
})();
