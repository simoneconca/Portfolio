/* ============================================================
   vonneumann.js — Macchina di Von Neumann (lab esplorativo)
   1) Clicca un componente -> scopri cosa fa (definizioni dal corso).
   2) "Guarda come funziona" -> demo animata del percorso dei dati.
   Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------- Spiegazioni dei componenti (linguaggio da 1ª) ---------- */
  const INFO = {
    input:   { emoji: "📥", name: "Dispositivi di Input", tag: "tu → computer",
      text: "Servono per <b>immettere dati e istruzioni</b> nel computer: è il modo in cui l'utente comunica con la macchina. Esempi: <b>tastiera</b>, <b>mouse</b>, microfono, webcam, scanner." },
    output:  { emoji: "📤", name: "Dispositivi di Output", tag: "computer → tu",
      text: "Mostrano o restituiscono i <b>risultati dell'elaborazione</b>: è il modo in cui il computer comunica con l'utente. Esempi: <b>schermo</b>, <b>stampante</b>, casse audio." },
    cpu:     { emoji: "🧠", name: "CPU — Central Processing Unit", tag: "il cervello",
      text: "È il <b>cervello del computer</b>: esegue le istruzioni dei programmi. È composta da tre parti che lavorano insieme: l'<b>Unità di Controllo (CU)</b>, l'<b>Unità Aritmetico-Logica (ALU)</b> e i <b>Registri</b>. Cliccale per scoprirle!" },
    cu:      { emoji: "🎛️", name: "CU — Unità di Controllo", tag: "il direttore",
      text: "<b>Interpreta le istruzioni</b> del programma e <b>dirige il flusso dei dati</b> tra le varie componenti del computer. È come il direttore d'orchestra: dice a ogni parte cosa fare e quando." },
    alu:     { emoji: "➗", name: "ALU — Unità Aritmetico-Logica", tag: "i calcoli",
      text: "Esegue le operazioni <b>matematiche</b> (addizioni, sottrazioni…) e <b>logiche</b> (confronti, es. «è più grande?»). È la parte che fa i veri e propri calcoli." },
    registri:{ emoji: "⚡", name: "Registri", tag: "memoria lampo",
      text: "Sono <b>piccole e velocissime aree di memoria</b> dentro la CPU. Conservano <b>temporaneamente</b> i dati e le istruzioni che la CPU sta elaborando in quel preciso istante." },
    memoria: { emoji: "💾", name: "Memoria centrale", tag: "i tre tipi",
      text: "È il luogo dove il computer memorizza <b>temporaneamente</b> i dati e le istruzioni dei programmi in esecuzione. È ad <b>accesso rapido</b> e si divide in tre tipi: <b>RAM</b>, <b>ROM</b> e <b>Cache</b>. Cliccali per scoprirli!" },
    ram:     { emoji: "🧮", name: "RAM — Random Access Memory", tag: "memoria di lavoro",
      text: "È la <b>memoria di lavoro</b>: contiene il sistema operativo, i programmi in esecuzione e i dati in elaborazione. È <b>volatile</b>: i dati si <b>perdono quando spegni</b> il computer. «Random Access» = accede a qualsiasi dato in modo diretto e velocissimo." },
    rom:     { emoji: "🔒", name: "ROM — Read Only Memory", tag: "l'avvio",
      text: "È una memoria <b>non volatile</b> (non si cancella) che contiene le istruzioni per l'<b>avvio</b> del computer — il <b>BIOS/UEFI</b>. All'accensione la CPU parte da qui: controlla l'hardware e <b>carica il sistema operativo</b> nella RAM (processo chiamato <b>bootstrap</b>)." },
    cache:   { emoji: "🚀", name: "Cache", tag: "ultra-veloce",
      text: "Una memoria <b>piccolissima e ultra-veloce</b>, posizionata tra la CPU e la RAM. Fa da «deposito» per i dati che la CPU usa <b>più spesso</b>, così li recupera quasi all'istante e tutto va più veloce." },
    busaddr: { emoji: "📍", name: "Bus indirizzi (Address Bus)", tag: "il «dove»",
      text: "Indica la <b>posizione in memoria</b> (l'indirizzo) da cui i dati devono essere <b>letti o scritti</b>. In pratica dice alla memoria QUALE cella serve." },
    busdata: { emoji: "📦", name: "Bus dati (Data Bus)", tag: "il «cosa»",
      text: "Si occupa del <b>trasferimento dei dati veri e propri</b> tra le componenti: le informazioni viaggiano avanti e indietro qui sopra." },
    busctrl: { emoji: "🚦", name: "Bus controllo (Control Bus)", tag: "i comandi",
      text: "Gestisce le <b>operazioni di controllo</b>, coordinando le attività di tutte le componenti: dice quando leggere, quando scrivere, chi deve agire." },
  };

  const INTRO = { emoji: "👆", name: "Esplora la macchina", tag: "inizia da qui",
    text: "I tre pezzi principali sono la <b>CPU</b>, la <b>memoria centrale</b> e il <b>bus di sistema</b>; ci sono poi i dispositivi di <b>input</b> e <b>output</b>. <b>Clicca un componente</b> qui sopra per scoprire cosa fa, oppure premi <b>« Guarda come funziona »</b> per vedere il percorso dei dati." };

  /* ---------- Demo: il percorso dei dati (somma 3 + 4) ---------- */
  const DEMO = [
    { narr: "L'utente digita i numeri con un <b>dispositivo di input</b> (la tastiera): i dati e il programma entrano nella <b>memoria</b> (RAM).",
      from: "compInput", to: "ram", value: "3 e 4", hi: ["compInput", "ram"], inv: "3 e 4" },
    { narr: "La <b>CPU</b> deve sapere cosa fare: chiede alla memoria la prossima istruzione indicando la cella sul <b>bus indirizzi</b>.",
      from: "cu", to: "ram", bus: "addr", value: "cella n.…", hi: ["cu", "ram"], inv: "3 e 4" },
    { narr: "La memoria invia l'istruzione alla CPU viaggiando sul <b>bus dati</b>: finisce nei <b>Registri</b>.",
      from: "ram", to: "registri", bus: "data", value: "SOMMA 3+4", hi: ["registri"], inv: "3 e 4" },
    { narr: "L'<b>Unità di Controllo (CU)</b> interpreta l'istruzione e, tramite il <b>bus controllo</b>, comanda le altre parti.",
      from: null, to: null, bus: "ctrl", hi: ["cu"], inv: "3 e 4" },
    { narr: "L'<b>ALU</b> esegue il calcolo vero e proprio: <b>3 + 4 = 7</b>, usando i <b>Registri</b> per i numeri.",
      from: "registri", to: "alu", value: "3 + 4", hi: ["alu", "registri"], inv: "3 e 4" },
    { narr: "Il risultato <b>7</b> esce dalla CPU e va a un <b>dispositivo di output</b> (lo schermo): ora lo vedi!",
      from: "alu", to: "compOutput", value: "7", hi: ["compOutput"], inv: "3 e 4", outv: "7" },
    { narr: "✓ Fatto! Hai visto il <b>percorso dei dati</b>: <b>Input → Memoria → CPU → Output</b>. È così che lavora un computer, milioni di volte al secondo.",
      from: null, to: null, done: true, inv: "3 e 4", outv: "7" },
  ];

  let demoStep = -1, timer = null;

  /* ---------- Rendering pannello info ---------- */
  function showInfo(key) {
    stopDemo();
    const c = INFO[key]; if (!c) return;
    clearHighlights();
    $("packet").hidden = true;
    document.querySelectorAll(".clickable").forEach((e) => e.classList.remove("info-active"));
    document.querySelectorAll('[data-info="' + key + '"]').forEach((e) => e.classList.add("info-active"));
    renderInfo(c, false);
  }
  function renderInfo(c, demo) {
    $("infoBox").className = "info-box" + (demo ? " demo" : "");
    $("infoBox").innerHTML =
      '<div class="ib-head"><span class="ib-emoji">' + (c.emoji || "") + '</span>' +
      '<span class="ib-name">' + c.name + '</span>' +
      (c.tag ? '<span class="ib-tag">' + c.tag + "</span>" : "") + "</div>" +
      '<div class="ib-text">' + c.text + "</div>" +
      (demo && demoStep >= 0 ? '<div class="step-count">Passo ' + (demoStep + 1) + " di " + DEMO.length + "</div>" : "");
  }

  function clearHighlights() {
    document.querySelectorAll(".active").forEach((e) => e.classList.remove("active"));
  }

  /* ---------- Demo player ---------- */
  function renderDemo() {
    const f = DEMO[demoStep];
    document.querySelectorAll(".clickable").forEach((e) => e.classList.remove("info-active"));
    clearHighlights();
    (f.hi || []).forEach((id) => { const e = $(id); if (e) e.classList.add("active"); });
    if (f.bus) $("bus" + (f.bus === "addr" ? "Addr" : f.bus === "data" ? "Data" : "Ctrl")).classList.add("active");

    // valori input/output
    $("inVal").textContent = f.inv || "tastiera, mouse…";
    const ov = $("outVal");
    if (f.outv) { ov.textContent = f.outv; ov.classList.add("has-val"); }
    else { ov.textContent = "schermo, stampante…"; ov.classList.remove("has-val"); }

    renderInfo({ emoji: f.done ? "✅" : "▶️", name: f.done ? "Percorso completato" : "Come funziona", tag: f.done ? "fine" : "demo", text: f.narr }, true);
    animatePacket(f);
    $("btnStep").textContent = demoStep >= DEMO.length - 1 ? "Fine" : "Passo";
  }
  function stepDemo() {
    if (demoStep >= DEMO.length - 1) { resetDemo(); return; }
    demoStep++; renderDemo();
  }
  function playDemo() {
    if (timer) { stopDemo(); return; }
    if (demoStep >= DEMO.length - 1) demoStep = -1;
    $("btnPlay").textContent = "⏸ Pausa";
    stepDemo();
    timer = setInterval(() => { if (demoStep < DEMO.length - 1) stepDemo(); else stopDemo(); }, 2600);
  }
  function stopDemo() {
    if (timer) { clearInterval(timer); timer = null; }
    $("btnPlay").textContent = "▶ Guarda come funziona";
  }
  function resetDemo() {
    stopDemo();
    demoStep = -1; clearHighlights();
    document.querySelectorAll(".clickable").forEach((e) => e.classList.remove("info-active"));
    $("packet").hidden = true;
    $("inVal").textContent = "tastiera, mouse…";
    $("outVal").textContent = "schermo, stampante…"; $("outVal").classList.remove("has-val");
    $("btnStep").textContent = "Passo";
    renderInfo(INTRO, false);
  }

  /* ---------- Pacchetto animato ---------- */
  function animatePacket(f) {
    const p = $("packet");
    if (!f.from || !f.to) { p.hidden = true; return; }
    const a = $(f.from), b = $(f.to), m = $("machine");
    if (!a || !b) { p.hidden = true; return; }
    const mr = m.getBoundingClientRect(), ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    p.hidden = false; p.textContent = f.value || "";
    p.style.transition = "none";
    p.style.left = (ar.left + ar.width / 2 - mr.left) + "px";
    p.style.top = (ar.top + ar.height / 2 - mr.top) + "px";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      p.style.transition = "left .7s var(--ease), top .7s var(--ease)";
      p.style.left = (br.left + br.width / 2 - mr.left) + "px";
      p.style.top = (br.top + br.height / 2 - mr.top) + "px";
    }));
  }

  /* ---------- Eventi ---------- */
  document.querySelectorAll("[data-info]").forEach((el) => {
    el.addEventListener("click", () => showInfo(el.dataset.info));
  });
  $("btnPlay").addEventListener("click", playDemo);
  $("btnStep").addEventListener("click", () => { stopDemo(); stepDemo(); });
  $("btnReset").addEventListener("click", resetDemo);
  window.addEventListener("resize", () => { if (timer === null && demoStep >= 0) animatePacket(DEMO[demoStep]); });

  /* ---------- Avvio ---------- */
  renderInfo(INTRO, false);
})();
