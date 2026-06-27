/* ============================================================
   linguaggio.js — «Quale linguaggio?»
   Quiz a scelta multipla: dalle risposte calcola il linguaggio
   di programmazione più adatto al progetto e spiega il perché.
   Zero backend. Nessuna pretesa di verità assoluta: è una guida.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- I linguaggi ---------- */
  const LANGS = {
    python: { name: "Python", tag: "semplice e versatile", color: "#2f6690",
      blurb: "Linguaggio <b>semplice e leggibile</b>, ottimo per iniziare. È il re indiscusso di <b>analisi dati</b> e <b>Intelligenza Artificiale</b>, perfetto anche per automatizzare compiti e per il «dietro le quinte» dei siti." },
    js: { name: "JavaScript", tag: "il linguaggio del web", color: "#b7860b",
      blurb: "È il <b>linguaggio del web</b>: gira in ogni browser e dà vita alle pagine. Con Node.js si usa anche lato server. Indispensabile per chi costruisce siti e <b>web app</b>." },
    java: { name: "Java", tag: "robusto e multipiattaforma", color: "#c0512b",
      blurb: "<b>Robusto</b> e ordinato, «scrivi una volta, gira ovunque». Molto usato per software gestionali, grandi sistemi e (storicamente) app Android." },
    csharp: { name: "C#", tag: "desktop e videogiochi (Unity)", color: "#68499b",
      blurb: "Elegante e potente, di casa Microsoft. È il linguaggio di <b>Unity</b> per i <b>videogiochi</b> ed è ottimo per le <b>app desktop</b> con finestre." },
    cpp: { name: "C++", tag: "potenza e prestazioni", color: "#1f5fae",
      blurb: "<b>Velocissimo</b> e potente, dà il controllo sulla memoria. Usato dove le prestazioni contano: motori di gioco, grafica, software ad alte prestazioni." },
    c: { name: "C", tag: "vicino all'hardware", color: "#566069",
      blurb: "Il «nonno» dei linguaggi moderni, <b>vicinissimo all'hardware</b>. È lo standard per <b>microcontrollori</b>, sistemi operativi e dispositivi embedded." },
    php: { name: "PHP", tag: "il backend dei siti", color: "#566aa0",
      blurb: "Nato per il <b>web lato server</b>: gran parte dei siti del mondo (incluso WordPress) gira in PHP. Comodo per costruire la parte server di un sito." },
    kotlin: { name: "Kotlin", tag: "app Android moderne", color: "#9c3a83",
      blurb: "Il linguaggio <b>moderno per le app Android</b>: conciso e sicuro, pienamente compatibile con Java." },
    swift: { name: "Swift", tag: "app per iPhone e iPad", color: "#d9601f",
      blurb: "Il linguaggio di Apple per le <b>app iPhone, iPad e Mac</b>: moderno, veloce e leggibile." }
  };
  // ordine di preferenza in caso di pareggio (più generali/comuni prima)
  const PRIORITY = ["python", "js", "java", "csharp", "kotlin", "swift", "php", "cpp", "c"];

  /* ---------- Le domande ---------- */
  const QUESTIONS = [
    { q: "Che tipo di progetto vuoi realizzare?", opts: [
      { label: "Un sito o un'app che gira nel browser", s: { js: 3, php: 1, python: 1 }, why: "il tuo progetto vive nel <b>web</b>" },
      { label: "Un'app per smartphone", s: { kotlin: 3, swift: 3, js: 1 }, why: "vuoi un'<b>app per telefono</b>" },
      { label: "Un videogioco", s: { csharp: 3, cpp: 2 }, why: "stai facendo un <b>videogioco</b> (Unity usa C#, i motori AAA il C++)" },
      { label: "Un programma desktop con finestre", s: { csharp: 2, java: 2, python: 1, cpp: 1 }, why: "è un'<b>applicazione desktop</b>" },
      { label: "Analisi dati o Intelligenza Artificiale", s: { python: 4 }, why: "lavori con <b>dati e IA</b>, dove Python domina" },
      { label: "Qualcosa vicino all'hardware o ai microcontrollori", s: { c: 4, cpp: 2 }, why: "programmi <b>a basso livello / sull'hardware</b>" },
      { label: "Piccoli script per automatizzare compiti", s: { python: 3 }, why: "ti servono <b>script veloci</b> da scrivere" }
    ] },
    { q: "Quanta esperienza hai con la programmazione?", opts: [
      { label: "Sono alle prime armi", s: { python: 3, js: 1 }, why: "sei agli inizi e ti serve un linguaggio <b>semplice da imparare</b>" },
      { label: "Me la cavo", s: { java: 1, csharp: 1, js: 1 }, why: "" },
      { label: "Ho già esperienza", s: { cpp: 2, c: 1, java: 1 }, why: "hai esperienza e puoi gestire un linguaggio più <b>complesso e potente</b>" }
    ] },
    { q: "Quanto contano le prestazioni (velocità di esecuzione)?", opts: [
      { label: "Poco: conta più la semplicità", s: { python: 2, php: 1, js: 1 }, why: "per te <b>la semplicità conta più</b> della velocità pura" },
      { label: "Abbastanza", s: { java: 2, csharp: 2 }, why: "" },
      { label: "Sono fondamentali", s: { cpp: 3, c: 2 }, why: "hai bisogno della <b>massima velocità</b>" }
    ] },
    { q: "Dove deve girare il programma?", opts: [
      { label: "Nel browser web", s: { js: 4 }, why: "deve girare <b>nel browser</b>, territorio di JavaScript" },
      { label: "Su uno smartphone", s: { kotlin: 2, swift: 2 }, why: "gira su <b>smartphone</b>" },
      { label: "Su un PC (desktop)", s: { csharp: 2, java: 1, python: 1, cpp: 1 }, why: "gira su un <b>PC desktop</b>" },
      { label: "Su un server (dietro a un sito)", s: { python: 1, php: 2, java: 1, js: 1 }, why: "lavora <b>lato server</b>" },
      { label: "Su hardware o microcontrollori", s: { c: 4, cpp: 1 }, why: "gira <b>direttamente sull'hardware</b>" }
    ] },
    { q: "Cosa preferisci come priorità?", opts: [
      { label: "Imparare in fretta, con poche complicazioni", s: { python: 3 }, why: "vuoi <b>imparare in fretta</b>" },
      { label: "Un buon equilibrio tra potenza e facilità", s: { java: 2, csharp: 2, js: 1 }, why: "cerchi un <b>equilibrio</b> tra potenza e facilità" },
      { label: "Il massimo controllo, anche se è più difficile", s: { cpp: 3, c: 2 }, why: "vuoi il <b>massimo controllo</b> sulla macchina" }
    ] }
  ];

  /* ---------- Stato ---------- */
  const answers = new Array(QUESTIONS.length).fill(-1);
  let qi = 0, done = false;
  const root = document.getElementById("qlRoot");
  const KEYS = ["A", "B", "C", "D", "E", "F", "G"];

  function render() {
    if (done) return renderResult();
    const Q = QUESTIONS[qi];
    let h = '<div class="ql-progress-row"><span class="ql-qnum">Domanda ' + (qi + 1) + " di " + QUESTIONS.length + '</span></div>';
    h += '<div class="ql-progress"><div class="ql-progress-fill" style="width:' + ((qi) / QUESTIONS.length * 100) + '%"></div></div>';
    h += '<h2 class="ql-question">' + Q.q + "</h2>";
    h += '<div class="ql-options">';
    Q.opts.forEach((o, i) => {
      h += '<button class="ql-opt' + (answers[qi] === i ? " sel" : "") + '" type="button" data-opt="' + i + '"><span class="ql-opt-key">' + KEYS[i] + "</span><span>" + o.label + "</span></button>";
    });
    h += "</div>";
    h += '<div class="ql-nav"><button class="btn btn-ghost ql-back' + (qi > 0 ? " show" : "") + '" type="button" data-act="back">← Indietro</button><span class="ql-hint">Scegli un\'opzione per continuare</span></div>';
    root.innerHTML = h;
    root.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => choose(parseInt(b.dataset.opt, 10))));
    const back = root.querySelector('[data-act="back"]');
    if (back) back.addEventListener("click", () => { if (qi > 0) { qi--; render(); } });
  }

  function choose(i) {
    answers[qi] = i;
    if (qi < QUESTIONS.length - 1) { qi++; render(); }
    else { done = true; render(); }
  }

  /* ---------- Calcolo del risultato ---------- */
  function compute() {
    const score = {}; Object.keys(LANGS).forEach((k) => (score[k] = 0));
    answers.forEach((ai, qIdx) => { if (ai < 0) return; const s = QUESTIONS[qIdx].opts[ai].s; for (const k in s) score[k] += s[k]; });
    const ranked = Object.keys(LANGS).sort((a, b) => (score[b] - score[a]) || (PRIORITY.indexOf(a) - PRIORITY.indexOf(b)));
    const winner = ranked[0];
    // motivazioni: le ragioni delle risposte che hanno dato punti al vincitore
    const why = [];
    answers.forEach((ai, qIdx) => { if (ai < 0) return; const o = QUESTIONS[qIdx].opts[ai]; if (o.why && o.s[winner]) why.push(o.why); });
    return { score, ranked, winner, why };
  }

  function renderResult() {
    const r = compute(), L = LANGS[r.winner], maxS = r.score[r.ranked[0]] || 1;
    let h = '<div class="ql-result">';
    h += '<div class="ql-rec" style="background:' + L.color + '"><div class="ql-rec-kicker">Il linguaggio consigliato</div><div class="ql-rec-name">' + L.name + '</div><div class="ql-rec-tag">' + L.tag + "</div></div>";

    h += '<div class="ql-block"><h3>Cos\'è e a cosa serve</h3><p class="ql-blurb">' + L.blurb + "</p></div>";

    if (r.why.length) {
      h += '<div class="ql-block"><h3>Perché proprio per il tuo progetto</h3><ul class="ql-why">';
      // evita doppioni
      const seen = {};
      r.why.forEach((w) => { if (seen[w]) return; seen[w] = 1; h += "<li><span>Perché " + w + ".</span></li>"; });
      h += "</ul></div>";
    }

    // se ha vinto un linguaggio mobile, ricorda l'altro
    if (r.winner === "kotlin") h += '<div class="ql-note">Hai scelto un\'app per smartphone: <b>Kotlin</b> è la scelta per <b>Android</b>. Se invece punti a iPhone/iPad, il linguaggio giusto è <b>Swift</b>.</div>';
    if (r.winner === "swift") h += '<div class="ql-note">Hai scelto un\'app per smartphone: <b>Swift</b> è la scelta per <b>iPhone/iPad</b>. Se invece punti ad Android, il linguaggio giusto è <b>Kotlin</b>.</div>';

    // classifica (top 3 con punteggio > 0)
    const top = r.ranked.filter((k) => r.score[k] > 0).slice(0, 4);
    if (top.length > 1) {
      h += '<div class="ql-block"><h3>La classifica completa</h3><div class="ql-rank">';
      top.forEach((k) => {
        h += '<div class="ql-rank-row"><span class="ql-rank-name">' + LANGS[k].name + '</span><div class="ql-rank-bar"><div class="ql-rank-fill" style="width:' + (r.score[k] / maxS * 100) + "%;background:" + LANGS[k].color + '"></div></div><span class="ql-rank-score">' + r.score[k] + " pt</span></div>";
      });
      h += "</div></div>";
    }

    h += '<div class="ql-note"><b>Ricorda:</b> non esiste un linguaggio «giusto» in assoluto. Questo è un consiglio di partenza in base al tuo progetto — quasi tutto si può fare con quasi tutti i linguaggi, ma alcuni rendono certe cose molto più facili.</div>';
    h += '<div class="ql-result-actions"><button class="btn btn-primary" type="button" data-act="restart">↺ Rifai il quiz</button><a class="btn btn-ghost" href="../">← Altri strumenti</a></div>';
    h += "</div>";
    root.innerHTML = h;
    root.querySelector('[data-act="restart"]').addEventListener("click", () => { answers.fill(-1); qi = 0; done = false; render(); });
  }

  render();
})();
