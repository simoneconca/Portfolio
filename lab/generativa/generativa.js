/* ============================================================
   generativa.js — Come funziona l'IA generativa (lezione guidata)
   Un modellino a n-grammi (tri-/bi-/unigramma) addestrato su un
   testo d'esempio, che gira nel browser. Mostra, passo per passo:
   1) tokenizzazione + vocabolario
   2) "training" = contare gli schemi (con evidenziazione nel testo)
   3) conte → probabilità
   4) generazione una parola alla volta (con contesto regolabile)
   5) la temperatura che rimodella le probabilità
   6) approfondimenti verso i veri LLM
   Niente reti neurali: è un «giocattolo» per capire l'idea.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const isPunc = (t) => /^[.,!?;:]$/.test(t);

  /* ---------- Corpus d'esempio (testo originale) ---------- */
  const CORPUS =
    "il gatto dorme sul divano. il gatto beve il latte. il gatto guarda dalla finestra. " +
    "il cane corre nel parco. il cane dorme sul tappeto. il cane gioca con la palla. " +
    "la bambina legge un libro. la bambina disegna un gatto. la bambina canta una canzone. " +
    "il bambino mangia una mela. la mela è rossa e dolce. il bambino gioca nel parco. " +
    "il sole splende nel cielo. il cielo è azzurro e sereno. la pioggia cade sul tetto. " +
    "il vento soffia tra gli alberi. la mamma prepara la cena. la cena è pronta sul tavolo. " +
    "il papà legge il giornale. la nonna racconta una storia. la storia è lunga e divertente. " +
    "il treno arriva alla stazione. il treno parte in orario. la nave attraversa il mare. " +
    "il mare è calmo e profondo. la barca galleggia sul mare. il pesce nuota nel mare. " +
    "il gabbiano vola nel cielo. il gabbiano canta sul molo. la rosa cresce nel giardino. " +
    "il giardino è pieno di fiori. la farfalla vola tra i fiori. la luna brilla nella notte. " +
    "la notte è scura e silenziosa. le stelle brillano nel cielo. il fuoco scalda la stanza. " +
    "la neve cade in inverno. la maestra spiega la lezione. lo studente impara la lezione. " +
    "il computer elabora i dati. il modello prevede la parola. il modello sceglie una parola. " +
    "la parola arriva dopo le altre parole. " +
    // frasi extra: danno una parola "dominante" ad alcuni inizi, così le probabilità non sono tutte uguali
    "il gatto dorme sul letto. il gatto dorme vicino al fuoco. il cane corre lungo il fiume. " +
    "la bambina legge una poesia. il bambino mangia una pera. il modello prevede il tempo.";

  const tokenize = (s) => (String(s).toLowerCase().match(/[a-zàèéìòùç]+|[.,!?;:]/g) || []);
  const SENTENCES = CORPUS.split(/(?<=\.)\s+/).filter(Boolean);

  /* ---------- "Addestramento": conta tri/bi/unigrammi ---------- */
  const TOK = tokenize(CORPUS);
  const tri = {}, bi = {}, uni = {};
  const vocabId = {}; let nextId = 1;
  const idOf = (t) => (vocabId[t] || (vocabId[t] = nextId++));
  TOK.forEach((t, i) => {
    idOf(t);
    uni[t] = (uni[t] || 0) + 1;
    if (i >= 1) { const k = TOK[i - 1]; (bi[k] || (bi[k] = {}))[t] = (bi[k][t] || 0) + 1; }
    if (i >= 2) { const k = TOK[i - 2] + " " + TOK[i - 1]; (tri[k] || (tri[k] = {}))[t] = (tri[k][t] || 0) + 1; }
  });

  // distribuzione del prossimo token (backoff tri → bi → uni). maxCtx limita il contesto
  function predict(seq, maxCtx) {
    maxCtx = maxCtx == null ? 2 : maxCtx;
    let counts = null, src = "unigramma", ctxUsed = [];
    if (maxCtx >= 2 && seq.length >= 2) { const a = seq[seq.length - 2], b = seq[seq.length - 1], k = a + " " + b; if (tri[k]) { counts = tri[k]; src = "trigramma"; ctxUsed = [a, b]; } }
    if (!counts && seq.length >= 1) { const b = seq[seq.length - 1]; if (bi[b]) { counts = bi[b]; src = "bigramma"; ctxUsed = [b]; } }
    if (!counts) { counts = uni; src = "unigramma"; ctxUsed = []; }
    const tot = Object.values(counts).reduce((a, b) => a + b, 0);
    const arr = Object.keys(counts).map((t) => ({ token: t, p: counts[t] / tot, c: counts[t] }));
    arr.sort((a, b) => b.p - a.p);
    return { arr, src, ctxUsed, tot };
  }

  // applica la temperatura ai top-k e rinormalizza
  function withTemp(arr, T, k) {
    const top = arr.slice(0, k).map((d) => ({ token: d.token, p: Math.pow(d.p, 1 / T), c: d.c }));
    const s = top.reduce((a, d) => a + d.p, 0) || 1;
    top.forEach((d) => (d.p = d.p / s));
    return top;
  }
  function sample(dist) {
    let r = Math.random(), acc = 0;
    for (const d of dist) { acc += d.p; if (r <= acc) return d.token; }
    return dist[dist.length - 1].token;
  }

  /* ============================================================
     1) TOKENIZZAZIONE + VOCABOLARIO
     ============================================================ */
  function renderTokens() {
    const toks = tokenize($("gaTokInput").value);
    $("gaTokens").innerHTML = toks.length
      ? toks.map((t) => '<span class="ga-tok"><span class="ga-tok-w">' + esc(t) + '</span><span class="ga-tok-id">#' + idOf(t) + "</span></span>").join("")
      : '<span class="ga-empty">scrivi qualcosa…</span>';
    const uniq = new Set(toks).size;
    $("gaTokCount").innerHTML = toks.length
      ? "<b>" + toks.length + "</b> token (" + uniq + " diversi). Ogni token è diventato un <b>numero</b>: è così che il modello «vede» il testo."
      : "";
  }
  $("gaTokInput").addEventListener("input", renderTokens);

  function renderVocab() {
    const words = Object.keys(uni).sort((a, b) => uni[b] - uni[a] || idOf(a) - idOf(b));
    $("gaVocab").innerHTML =
      '<p class="ga-vocab-cap"><b>' + words.length + " token diversi</b> nel vocabolario di questo modellino (ordinati per frequenza nel testo d'esempio):</p>" +
      '<div class="ga-vocab-grid">' + words.map((w) =>
        '<span class="ga-vchip"><span class="ga-vw">' + esc(w) + '</span><span class="ga-vid">#' + idOf(w) + '</span><span class="ga-vc">×' + uni[w] + "</span></span>").join("") + "</div>";
  }
  $("gaVocabBtn").addEventListener("click", () => {
    const box = $("gaVocab"), btn = $("gaVocabBtn"), open = box.hidden;
    if (open && !box.dataset.built) { renderVocab(); box.dataset.built = "1"; }
    box.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "✕ Nascondi il vocabolario" : "📖 Mostra il vocabolario del modello";
  });

  /* ============================================================
     2) + 3) CONTARE  e  PROBABILITÀ  (guidati da un contesto scelto)
     ============================================================ */
  const CTX_OPTIONS = ["il gatto", "il cane", "la bambina", "il bambino", "il modello"];
  let ctxChoice = "il gatto";

  function renderCtxPick() {
    $("gaCtxPick").innerHTML = CTX_OPTIONS.map((c) =>
      '<button type="button" class="ga-ctxbtn' + (c === ctxChoice ? " active" : "") + '" data-ctx="' + esc(c) + '">' + esc(c) + "…</button>").join("");
  }

  // evidenzia nel testo d'esempio le occorrenze del contesto e la parola dopo
  function renderCorpus() {
    const ctxTok = tokenize(ctxChoice), n = ctxTok.length;
    let html = "", shown = 0;
    SENTENCES.forEach((sent) => {
      const toks = tokenize(sent);
      // c'è il contesto in questa frase?
      let hit = false;
      for (let i = 0; i + n <= toks.length; i++) {
        if (ctxTok.every((w, j) => toks[i + j] === w)) { hit = true; break; }
      }
      if (!hit) return;
      shown++;
      let out = "";
      for (let i = 0; i < toks.length; i++) {
        const space = (i > 0 && !isPunc(toks[i])) ? " " : "";
        const isCtx = i + n <= toks.length && ctxTok.every((w, j) => toks[i + j] === w);
        if (isCtx) {
          for (let j = 0; j < n; j++) out += (j > 0 ? " " : "") + '<span class="gc-ctx">' + esc(toks[i + j]) + "</span>";
          const nx = toks[i + n];
          if (nx !== undefined) out += ' <span class="gc-next">' + esc(nx) + "</span>";
          i += n; // salta il contesto (il "next" verrà ristampato normalmente dopo)
          continue;
        }
        out += space + esc(toks[i]);
      }
      html += '<p class="gc-sent">' + out + "</p>";
    });
    $("gaCorpus").innerHTML = html || '<p class="ga-empty">nessuna occorrenza</p>';
    return shown;
  }

  function renderCounts() {
    const counts = tri[ctxChoice] || {};
    const items = Object.keys(counts).map((t) => ({ t, c: counts[t] })).sort((a, b) => b.c - a.c);
    const max = Math.max(1, ...items.map((i) => i.c));
    const tot = items.reduce((a, i) => a + i.c, 0);
    $("gaCounts").innerHTML = items.map((i) =>
      '<div class="ga-count"><span class="ga-count-tok">' + esc(i.t) + "</span>" +
      '<span class="ga-count-bar"><span style="width:' + Math.round((i.c / max) * 100) + '%"></span></span>' +
      '<span class="ga-count-n">×' + i.c + "</span></div>").join("");
    $("gaCountCap").innerHTML = "Nel testo, dopo «<b>" + esc(ctxChoice) + "</b>» sono arrivate <b>" + tot + "</b> parole in totale. Il modello tiene solo questo conteggio: non ricorda le frasi intere.";
    return { items, tot };
  }

  function renderProb() {
    const counts = tri[ctxChoice] || {};
    const items = Object.keys(counts).map((t) => ({ t, c: counts[t] })).sort((a, b) => b.c - a.c);
    const tot = items.reduce((a, i) => a + i.c, 0) || 1;
    $("gaProbCtx").innerHTML = "Inizio scelto: «<b>" + esc(ctxChoice) + "</b>» · totale occorrenze: <b>" + tot + "</b>";
    $("gaProb").innerHTML = items.map((i) => {
      const pct = Math.round((i.c / tot) * 100);
      return '<div class="ga-prob-row"><span class="ga-prob-tok">' + esc(i.t) + "</span>" +
        '<span class="ga-prob-calc">' + i.c + " / " + tot + "</span>" +
        '<span class="ga-prob-bar"><span style="width:' + Math.max(3, pct) + '%"></span></span>' +
        '<span class="ga-prob-pct">' + pct + "%</span></div>";
    }).join("");
    const top = items[0];
    $("gaProbNote").innerHTML = top
      ? "Dividendo ogni conteggio per il totale ottieni la <b>probabilità</b>. Qui la più probabile dopo «" + esc(ctxChoice) + "» è «<b>" + esc(top.t) + "</b>» (" + Math.round((top.c / tot) * 100) + "%). Sono esattamente i numeri che il generatore qui sotto userà per pescare."
      : "";
  }

  function setCtx(c) { ctxChoice = c; renderCtxPick(); renderCorpus(); renderCounts(); renderProb(); }
  $("gaCtxPick").addEventListener("click", (e) => { const b = e.target.closest("[data-ctx]"); if (b) setCtx(b.dataset.ctx); });

  /* ============================================================
     4) GENERATORE
     ============================================================ */
  const SEEDS = ["il gatto", "la bambina", "il modello", "il mare", "la notte"];
  let seq = tokenize("il gatto");
  let freshLen = seq.length, timer = null, ctxLen = 2;
  const T = () => +$("gaTemp").value / 100;

  function renderSeeds() {
    $("gaSeeds").innerHTML = SEEDS.map((s) =>
      '<button type="button" class="ga-seed" data-seed="' + s + '">' + esc(s) + "</button>").join("");
  }
  function renderOutput() {
    $("gaOutput").innerHTML = seq.map((t, i) =>
      '<span class="ga-w' + (i >= freshLen ? " fresh" : "") + '">' + (i > 0 && !isPunc(t) ? " " : "") + esc(t) + "</span>").join("");
  }
  function renderCands() {
    const { arr, src, ctxUsed } = predict(seq, ctxLen);
    const dist = withTemp(arr, T(), 6);
    const ctxTxt = ctxUsed.length ? "«…" + esc(ctxUsed.join(" ")) + "»" : "(nessuno)";
    $("gaCtx").innerHTML = "Contesto guardato: " + ctxTxt + " → usa il modello <b>" + src + "</b>";
    $("gaCands").innerHTML = dist.map((d) => {
      const pct = Math.round(d.p * 100);
      return '<button type="button" class="ga-cand" data-tok="' + esc(d.token) + '">' +
        '<span class="ga-cand-bar" style="width:' + Math.max(4, pct) + '%"></span>' +
        '<span class="ga-cand-tok">' + esc(d.token) + "</span>" +
        '<span class="ga-cand-p">' + pct + "%</span></button>";
    }).join("");
  }
  function render() { renderOutput(); renderCands(); $("gaTempV").textContent = T().toFixed(2); }

  function pick(token) { seq.push(token); freshLen = seq.length - 1; render(); }
  function step() { const { arr } = predict(seq, ctxLen); pick(sample(withTemp(arr, T(), 6))); return seq[seq.length - 1]; }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; $("gaGen").textContent = "▶ Genera frase"; }
  function genSentence() {
    if (timer) { stopAuto(); return; }
    $("gaGen").textContent = "⏸ Pausa";
    let n = 0;
    timer = setInterval(() => { const t = step(); if (/^[.!?]$/.test(t) || ++n > 22) stopAuto(); }, 420);
  }
  function reset(seed) { stopAuto(); seq = tokenize(seed || "il gatto"); freshLen = seq.length; render(); }

  $("gaSeeds").addEventListener("click", (e) => { const b = e.target.closest("[data-seed]"); if (b) reset(b.dataset.seed); });
  $("gaCands").addEventListener("click", (e) => { const b = e.target.closest("[data-tok]"); if (b) { stopAuto(); pick(b.dataset.tok); } });
  $("gaStep").addEventListener("click", () => { stopAuto(); step(); });
  $("gaGen").addEventListener("click", genSentence);
  $("gaReset").addEventListener("click", () => reset("il gatto"));
  $("gaTemp").addEventListener("input", () => { $("gaTempV").textContent = T().toFixed(2); renderCands(); });
  $("gaCtxLen").addEventListener("click", (e) => {
    const b = e.target.closest("[data-n]"); if (!b) return;
    ctxLen = +b.dataset.n;
    $("gaCtxLen").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    renderCands();
  });

  /* ============================================================
     5) TEMPERATURA (esempio dimostrativo, distribuzione fissa)
     ============================================================ */
  const TEMP_EX = [
    { token: "dorme", p: 0.46 }, { token: "gioca", p: 0.26 },
    { token: "corre", p: 0.16 }, { token: "salta", p: 0.08 }, { token: "vola", p: 0.04 },
  ];
  function renderTempDemo() {
    const Tv = +$("gaTempDemoS").value / 100;
    $("gaTempDemoV").textContent = Tv.toFixed(2);
    const re = TEMP_EX.map((d) => ({ token: d.token, p: Math.pow(d.p, 1 / Tv) }));
    const s = re.reduce((a, d) => a + d.p, 0) || 1;
    re.forEach((d) => (d.p = d.p / s));
    const max = Math.max.apply(null, re.map((d) => d.p));
    $("gaTempDemo").innerHTML = re.map((d) => {
      const pct = Math.round(d.p * 100);
      return '<div class="ga-td-row"><span class="ga-td-tok">' + d.token + "</span>" +
        '<span class="ga-td-bar"><span style="width:' + Math.round((d.p / max) * 100) + '%"></span></span>' +
        '<span class="ga-td-pct">' + pct + "%</span></div>";
    }).join("");
  }
  $("gaTempDemoS").addEventListener("input", renderTempDemo);

  /* ============================================================
     6) APPROFONDIMENTI
     ============================================================ */
  const GUIDE = [
    { name: "Non «capisce»: prevede", tag: "l'idea chiave",
      desc: "Un modello generativo non sa cosa siano un gatto o il mare. Ha solo imparato, da enormi quantità di testo, <b>quali parole tendono a seguire quali altre</b>. Generare = ripetere tante volte «qual è la parola più probabile adesso?» e sceglierne una. Tutto il resto (grammatica, «ragionamenti», stile) emerge da questo." },
    { name: "Quanto contesto: la context window", tag: "memoria del modello",
      desc: "Qui il modello guarda solo le ultime <b>1-2 parole</b>: per questo si perde in fretta. I veri LLM guardano <b>migliaia o milioni di token</b> insieme (la <i>context window</i>): ricordano l'inizio del discorso, le istruzioni che hai dato, il documento che hai incollato. Più contesto = risposte più coerenti e pertinenti." },
    { name: "Dentro c'è una rete neurale", tag: "non semplici conteggi",
      desc: "Questo giocattolo <b>conta</b> le frequenze. Un vero modello è una <b>rete neurale</b> con miliardi di <b>parametri</b> (numeri regolati durante l'addestramento). Invece di contare, impara rappresentazioni astratte delle parole e usa un meccanismo chiamato <b>attenzione</b> per decidere quali parole del contesto contano di più per predire la successiva." },
    { name: "Le parole diventano vettori", tag: "embedding",
      desc: "Nei modelli veri ogni token non è un solo numero, ma una <b>lista di numeri</b> (un <i>embedding</i>, es. centinaia di valori) che ne cattura il «significato». Parole simili (gatto, cane) finiscono vicine in questo spazio: è così che il modello coglie analogie che un semplice conteggio non vedrebbe." },
    { name: "Addestramento: una scala enorme", tag: "dati, tempo, energia",
      desc: "Imparare quei parametri richiede di «leggere» una fetta gigantesca di internet (migliaia di miliardi di parole), migliaia di schede grafiche per settimane e costi enormi. Per questo i grandi modelli li creano poche aziende. Poi un <b>fine-tuning</b> li rende utili e sicuri come assistenti." },
    { name: "Perché a volte «inventa»", tag: "allucinazioni",
      desc: "Siccome sceglie parole <b>plausibili</b> (non vere), può produrre frasi sensate e grammaticali ma <b>false</b>: nomi, date, citazioni o fonti inventate, dette con grande sicurezza. Non ha un «database della verità» da cui attingere. Per questo le risposte vanno sempre <b>verificate</b>, soprattutto numeri, fonti e fatti precisi." },
    { name: "Questo modellino vs ChatGPT", tag: "stessa idea, scala diversa",
      desc: "Uguale: prevedere il token successivo, una probabilità alla volta, con una «temperatura». Diverso: qui poche frasi e conteggi; là una rete neurale gigantesca, un contesto lunghissimo e una conoscenza vastissima del linguaggio. L'<b>intuizione</b> che hai costruito, però, è esattamente quella giusta." },
  ];
  $("gaGuide").innerHTML = GUIDE.map((g) =>
    '<details class="guide-cmd"><summary><span class="g-name">' + esc(g.name) + '</span><span class="g-syntax">' + esc(g.tag) + "</span></summary>" +
    '<div class="g-body"><p class="g-desc">' + g.desc + "</p></div></details>").join("");

  /* ---------- Avvio ---------- */
  renderTokens();
  setCtx("il gatto");
  renderSeeds(); render();
  renderTempDemo();
})();
