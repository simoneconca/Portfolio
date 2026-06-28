/* ============================================================
   generativa.js — Come funziona l'IA generativa
   Un modellino a n-grammi (tri-/bi-/unigramma) addestrato su un
   testo d'esempio originale, che gira nel browser. Mostra:
   1) tokenizzazione, 2) predizione del token successivo con le
   probabilità + temperatura, 3) generazione passo-passo.
   Niente reti neurali: è un «giocattolo» per capire l'idea.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
    "la parola arriva dopo le altre parole.";

  const tokenize = (s) => (String(s).toLowerCase().match(/[a-zàèéìòùç]+|[.,!?;:]/g) || []);

  /* ---------- Addestramento: conta tri/bi/unigrammi ---------- */
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

  // distribuzione del prossimo token dato il contesto (backoff tri → bi → uni)
  function predict(seq) {
    let counts = null, src = "unigramma";
    if (seq.length >= 2) { const k = seq[seq.length - 2] + " " + seq[seq.length - 1]; if (tri[k]) { counts = tri[k]; src = "trigramma"; } }
    if (!counts && seq.length >= 1) { const k = seq[seq.length - 1]; if (bi[k]) { counts = bi[k]; src = "bigramma"; } }
    if (!counts) counts = uni;
    const tot = Object.values(counts).reduce((a, b) => a + b, 0);
    const arr = Object.keys(counts).map((t) => ({ token: t, p: counts[t] / tot }));
    arr.sort((a, b) => b.p - a.p);
    return { arr, src };
  }

  // applica la temperatura ai top-k e rinormalizza
  function withTemp(arr, T, k) {
    const top = arr.slice(0, k).map((d) => ({ token: d.token, p: Math.pow(d.p, 1 / T) }));
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
     1) TOKENIZZAZIONE
     ============================================================ */
  function renderTokens() {
    const toks = tokenize($("gaTokInput").value);
    $("gaTokens").innerHTML = toks.length
      ? toks.map((t) => '<span class="ga-tok"><span class="ga-tok-w">' + esc(t) + '</span><span class="ga-tok-id">#' + idOf(t) + "</span></span>").join("")
      : '<span class="ga-empty">scrivi qualcosa…</span>';
    const uniq = new Set(toks).size;
    $("gaTokCount").innerHTML = toks.length
      ? "<b>" + toks.length + "</b> token (" + uniq + " diversi). Ogni token diventa un <b>numero</b>: è così che il modello «vede» il testo."
      : "";
  }
  $("gaTokInput").addEventListener("input", renderTokens);

  /* ============================================================
     2) GENERATORE
     ============================================================ */
  const SEEDS = ["il gatto", "la bambina", "il modello", "il mare", "la notte"];
  let seq = tokenize("il gatto");
  let freshLen = seq.length, timer = null;
  const T = () => +$("gaTemp").value / 100;

  function renderSeeds() {
    $("gaSeeds").innerHTML = SEEDS.map((s) =>
      '<button type="button" class="ga-seed" data-seed="' + s + '">' + esc(s) + "</button>").join("");
  }
  function joinSeq(arr) {
    return arr.map((t, i) => (i > 0 && !/^[.,!?;:]$/.test(t) ? " " : "") + t).join("");
  }
  function renderOutput() {
    $("gaOutput").innerHTML = seq.map((t, i) =>
      '<span class="ga-w' + (i >= freshLen ? " fresh" : "") + '">' + (i > 0 && !/^[.,!?;:]$/.test(t) ? " " : "") + esc(t) + "</span>").join("");
  }
  function renderCands() {
    const { arr, src } = predict(seq);
    const dist = withTemp(arr, T(), 6);
    $("gaCtx").innerHTML = "Contesto: «…" + esc(seq.slice(-2).join(" ")) + "» → modello <b>" + src + "</b>";
    $("gaCands").innerHTML = dist.map((d) => {
      const pct = Math.round(d.p * 100);
      return '<button type="button" class="ga-cand" data-tok="' + esc(d.token) + '">' +
        '<span class="ga-cand-bar" style="width:' + Math.max(4, pct) + '%"></span>' +
        '<span class="ga-cand-tok">' + esc(d.token) + "</span>" +
        '<span class="ga-cand-p">' + pct + "%</span></button>";
    }).join("");
  }
  function render() { renderOutput(); renderCands(); $("gaTempV").textContent = T().toFixed(2); }

  function pick(token) {
    seq.push(token); freshLen = seq.length - 1;
    render();
  }
  function step() {
    const { arr } = predict(seq);
    pick(sample(withTemp(arr, T(), 6)));
    return seq[seq.length - 1];
  }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; $("gaGen").textContent = "▶ Genera frase"; }
  function genSentence() {
    if (timer) { stopAuto(); return; }
    $("gaGen").textContent = "⏸ Pausa";
    let n = 0;
    timer = setInterval(() => {
      const t = step();
      if (/^[.!?]$/.test(t) || ++n > 22) stopAuto();
    }, 420);
  }
  function reset(seed) { stopAuto(); seq = tokenize(seed || "il gatto"); freshLen = seq.length; render(); }

  $("gaSeeds").addEventListener("click", (e) => { const b = e.target.closest("[data-seed]"); if (b) reset(b.dataset.seed); });
  $("gaCands").addEventListener("click", (e) => { const b = e.target.closest("[data-tok]"); if (b) { stopAuto(); pick(b.dataset.tok); } });
  $("gaStep").addEventListener("click", () => { stopAuto(); step(); });
  $("gaGen").addEventListener("click", genSentence);
  $("gaReset").addEventListener("click", () => reset("il gatto"));
  $("gaTemp").addEventListener("input", () => { $("gaTempV").textContent = T().toFixed(2); renderCands(); });

  /* ============================================================
     3) SPIEGAZIONI
     ============================================================ */
  const GUIDE = [
    { name: "Non «capisce»: prevede", tag: "l'idea chiave",
      desc: "Un modello generativo non sa cosa siano un gatto o il mare. Ha solo imparato, da tantissimo testo, <b>quali parole tendono a seguire quali altre</b>. Generare una frase = ripetere tante volte «qual è la parola più probabile adesso?» e sceglierne una." },
    { name: "Token e numeri", tag: "tokenizzazione",
      desc: "Il testo viene spezzato in <b>token</b> (qui: parole e punteggiatura; nei modelli veri spesso pezzi di parola) e ogni token diventa un <b>numero</b>. Il modello lavora solo con numeri, mai con le lettere." },
    { name: "La temperatura", tag: "quanto «osa»",
      desc: "Le probabilità si possono rendere più <b>nette</b> o più <b>piatte</b>. Temperatura <b>bassa</b> (es. 0,3): sceglie quasi sempre la parola più probabile → testo sicuro ma ripetitivo. Temperatura <b>alta</b> (es. 1,3): dà più chance anche alle parole rare → più creativo, ma rischia di deragliare." },
    { name: "Perché a volte «inventa»", tag: "allucinazioni",
      desc: "Siccome sceglie solo parole <b>plausibili</b> (non vere), può produrre frasi sensate e grammaticali ma <b>false</b>: nomi, date e citazioni inventate. Per questo le risposte di un'IA vanno sempre verificate." },
    { name: "Questo è un giocattolo", tag: "vs un vero LLM",
      desc: "Qui guardiamo solo le <b>ultime 1-2 parole</b> e contiamo le frequenze su poche frasi. Un vero modello come ChatGPT è una <b>rete neurale</b> con miliardi di parametri, considera <b>migliaia di token</b> di contesto insieme e ha letto una quantità enorme di testo: l'idea di fondo, però, è proprio questa." },
  ];
  $("gaGuide").innerHTML = GUIDE.map((g) =>
    '<details class="guide-cmd"><summary><span class="g-name">' + esc(g.name) + '</span><span class="g-syntax">' + esc(g.tag) + "</span></summary>" +
    '<div class="g-body"><p class="g-desc">' + g.desc + "</p></div></details>").join("");

  /* ---------- Avvio ---------- */
  renderTokens(); renderSeeds(); render();
})();
