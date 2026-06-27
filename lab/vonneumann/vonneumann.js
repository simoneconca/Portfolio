/* ============================================================
   vonneumann.js — La macchina di von Neumann (lab per le prime)
   1) Componenti del PC: clic = funzione del componente + flusso dei dati
   2) Codifica dei file: testo (ASCII), immagini (RGB), suono (campionamento)
   Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ============================================================
     1. COMPONENTI — definizioni (a cosa serve ognuno)
     ============================================================ */
  const INFO = {
    input:  { ico: "⌨️", title: "Dispositivi di input", text: "Servono a <b>immettere</b> dati e istruzioni nel computer: tastiera, mouse, microfono, fotocamera… Sono il modo con cui <b>l'utente comunica</b> con il computer." },
    output: { ico: "🖥️", title: "Dispositivi di output", text: "<b>Mostrano</b> o restituiscono i risultati dell'elaborazione: monitor, stampante, casse… Sono il modo con cui <b>il computer comunica</b> con l'utente." },
    cpu:    { ico: "🧠", title: "CPU — il cervello", text: "La <b>CPU</b> (Central Processing Unit) è l'unità che <b>esegue le istruzioni</b> dei programmi. È fatta di tre parti: <b>Unità di Controllo (CU)</b>, <b>ALU</b> e <b>Registri</b>." },
    cu:     { ico: "🎛️", title: "Unità di Controllo (CU)", text: "Il “direttore d'orchestra”: <b>interpreta le istruzioni</b> del programma e <b>dirige il flusso dei dati</b> tra i vari componenti del computer." },
    alu:    { ico: "➗", title: "ALU — Unità Aritmetico-Logica", text: "Esegue i <b>calcoli matematici</b> (addizioni, sottrazioni…) e le <b>operazioni logiche</b> (confronti: maggiore, minore, uguale…)." },
    reg:    { ico: "⚡", title: "Registri", text: "Piccolissime memorie <b>velocissime</b> dentro la CPU. Conservano i dati e le istruzioni che la CPU sta usando <b>proprio in questo istante</b>." },
    mem:    { ico: "📥", title: "Memoria centrale", text: "Conserva <b>temporaneamente</b> i dati e le istruzioni dei programmi in esecuzione, con accesso rapido. È divisa in <b>RAM</b>, <b>ROM</b> e <b>Cache</b>." },
    ram:    { ico: "📝", title: "RAM — memoria di lavoro", text: "Qui stanno il sistema operativo, i programmi aperti e i dati in lavorazione. È <b>volatile</b>: quando spegni il computer, <b>si svuota</b>. “Random Access”: si legge qualsiasi dato in modo diretto e veloce." },
    rom:    { ico: "🔒", title: "ROM — memoria di avvio", text: "Memoria <b>non volatile</b> (non si cancella) con le istruzioni per accendere il PC: il <b>BIOS/UEFI</b>. All'avvio la CPU parte da qui, controlla l'hardware e carica il sistema operativo (<b>bootstrap</b>)." },
    cache:  { ico: "🚀", title: "Cache", text: "Memoria piccola e <b>ultra-veloce</b>, tra CPU e RAM. Tiene i dati usati <b>più spesso</b> per ridarli alla CPU quasi all'istante, migliorando le prestazioni." },
    bus:    { ico: "🔗", title: "Bus di sistema", text: "I “cavi” che collegano i componenti e fanno passare le informazioni. Tre tipi: <b>Data bus</b> (i dati veri e propri), <b>Address bus</b> (la posizione in memoria), <b>Control bus</b> (i comandi che coordinano tutto)." },
    mobo:   { ico: "🔲", title: "Scheda madre (Motherboard)", text: "Il <b>circuito principale</b> a cui si collegano tutti i componenti, permettendo loro di comunicare tra di loro." },
    storage:{ ico: "💽", title: "Memoria secondaria (HDD / SSD)", text: "Conserva i dati in modo <b>permanente</b>, anche a PC spento: sistema operativo, programmi e file. L'<b>HDD</b> usa dischi magnetici che girano (economico ma lento); l'<b>SSD</b> usa memorie flash senza parti in movimento (molto più veloce)." },
    gpu:    { ico: "🎮", title: "Scheda video (GPU)", text: "Elabora e produce le <b>immagini</b> da mostrare sullo schermo. È fondamentale per i <b>giochi</b> e i programmi di grafica." },
    psu:    { ico: "🔌", title: "Alimentatore (PSU)", text: "Converte la corrente elettrica della <b>presa a muro</b> in una forma adatta ad alimentare i componenti del computer." },
  };

  function showInfo(key) {
    const d = INFO[key]; if (!d) return;
    $("vnInfo").innerHTML =
      `<div class="vn-info-card">` +
      `<div class="vn-info-head"><span class="vn-ico-big">${d.ico}</span><h2>${d.title}</h2></div>` +
      `<p>${d.text}</p></div>`;
    document.querySelectorAll("[data-comp]").forEach((el) => el.classList.toggle("picked", el.dataset.comp === key));
  }

  document.querySelectorAll("[data-comp]").forEach((el) =>
    el.addEventListener("click", () => showInfo(el.dataset.comp)));

  /* ---------- Flusso dei dati (passo-passo) ---------- */
  const FLOW = [
    { on: ["rom", "cu", "bus"], t: "1. <b>Accensione</b>: la CPU esegue le prime istruzioni che trova nella <b>ROM</b> (il BIOS/UEFI), che controlla l'hardware." },
    { on: ["storage", "ram", "bus"], t: "2. <b>Bootstrap</b>: il <b>sistema operativo</b> viene caricato dalla <b>memoria secondaria</b> (HDD/SSD) nella <b>RAM</b>, passando dal bus. Ora il PC è pronto." },
    { on: ["input", "bus"], t: "3. Apri un programma: con un dispositivo di <b>input</b> (la tastiera) inserisci dati e comandi, che viaggiano sul <b>bus</b>." },
    { on: ["storage", "ram", "bus"], t: "4. Anche il <b>programma</b> che apri viene copiato dalla <b>memoria secondaria</b> alla <b>RAM</b>, pronto per essere eseguito." },
    { on: ["cu", "ram", "bus"], t: "5. La <b>CU</b> (unità di controllo) legge l'istruzione dalla RAM passando dal bus: capisce cosa fare." },
    { on: ["reg"], t: "6. I dati da elaborare vengono caricati nei <b>Registri</b>, dentro la CPU." },
    { on: ["alu"], t: "7. L'<b>ALU</b> esegue il calcolo richiesto (per esempio una somma)." },
    { on: ["ram", "bus"], t: "8. Il <b>risultato</b> torna nella RAM, sempre attraverso il bus." },
    { on: ["output", "bus"], t: "9. Infine un dispositivo di <b>output</b> (lo schermo) mostra il risultato all'utente. 🎉" },
  ];
  let fstep = -1, ftimer = null;

  function paintFlow() {
    document.querySelectorAll(".vn-diagram [data-comp]").forEach((el) => el.classList.remove("flowing"));
    if (fstep < 0) { $("flowDesc").innerHTML = "Premi <b>Passo</b> o <b>«Guarda il flusso»</b> per vedere come i dati attraversano i componenti."; return; }
    const s = FLOW[fstep];
    s.on.forEach((k) => document.querySelectorAll(`.vn-diagram [data-comp="${k}"]`).forEach((el) => el.classList.add("flowing")));
    $("flowDesc").innerHTML = `<span class="fd-n">▸</span> ${s.t}`;
  }
  function flowStep() {
    if (fstep >= FLOW.length - 1) { stopAuto(); return; }
    fstep++; paintFlow();
    if (fstep >= FLOW.length - 1) stopAuto();
  }
  function stopAuto() { if (ftimer) { clearInterval(ftimer); ftimer = null; $("flowAuto").textContent = "▶ Guarda il flusso"; $("flowAuto").classList.remove("on"); } }
  function flowReset() { stopAuto(); fstep = -1; paintFlow(); }
  function toggleAuto() {
    if (ftimer) { stopAuto(); return; }
    if (fstep >= FLOW.length - 1) { fstep = -1; paintFlow(); }
    $("flowAuto").textContent = "⏸ Pausa"; $("flowAuto").classList.add("on");
    ftimer = setInterval(() => { if (fstep < FLOW.length - 1) flowStep(); else stopAuto(); }, 1500);
  }
  $("flowStep").addEventListener("click", () => { stopAuto(); flowStep(); });
  $("flowAuto").addEventListener("click", toggleAuto);
  $("flowReset").addEventListener("click", flowReset);
  flowReset();

  /* ============================================================
     2. CODIFICA DEI FILE
     ============================================================ */
  function bin(n, len) { return (n >>> 0).toString(2).padStart(len, "0"); }

  /* ---------- Testo → ASCII ---------- */
  function renderText() {
    const s = $("txtIn").value || "";
    if (!s) { $("txtOut").innerHTML = `<p class="txt-hint">Scrivi qualcosa qui sopra.</p>`; return; }
    $("txtOut").innerHTML = [...s].map((ch) => {
      const code = ch.codePointAt(0);
      const over = code > 127;
      const shown = ch === " " ? "␣" : esc(ch);
      return `<div class="txt-cell ${over ? "over" : ""}">` +
        `<span class="tc-char">${shown}</span>` +
        `<span class="tc-dec">${code}</span>` +
        `<span class="tc-bin">${over ? "fuori ASCII" : bin(code, 8)}</span></div>`;
    }).join("");
  }
  $("txtIn").addEventListener("input", renderText);

  /* ---------- Immagini → RGB ---------- */
  function renderRGB() {
    const r = +$("rR").value, g = +$("rG").value, b = +$("rB").value;
    $("rRv").textContent = r; $("rGv").textContent = g; $("rBv").textContent = b;
    const sw = $("rgbSwatch");
    sw.style.background = `rgb(${r},${g},${b})`;
    sw.style.color = (r * 0.299 + g * 0.587 + b * 0.114) > 140 ? "#111" : "#fff";
    sw.textContent = `rgb(${r}, ${g}, ${b})`;
    $("rgbBits").innerHTML =
      `<div class="rb r"><span>R ${r}</span><code>${bin(r, 8)}</code></div>` +
      `<div class="rb g"><span>G ${g}</span><code>${bin(g, 8)}</code></div>` +
      `<div class="rb b"><span>B ${b}</span><code>${bin(b, 8)}</code></div>` +
      `<div class="rb tot"><span>1 pixel = 24 bit (3 byte)</span><code>${bin(r, 8)} ${bin(g, 8)} ${bin(b, 8)}</code></div>`;
  }
  ["rR", "rG", "rB"].forEach((id) => $(id).addEventListener("input", renderRGB));

  /* ---------- Suono → campionamento ---------- */
  function renderSound() {
    const n = +$("sndRate").value;
    $("sndRatev").textContent = n;
    const W = 600, H = 200, mid = H / 2, amp = 64, cycles = 2;
    const yAt = (x) => mid - amp * Math.sin((x / W) * cycles * 2 * Math.PI);
    let wave = "M0 " + yAt(0).toFixed(1);
    for (let x = 2; x <= W; x += 2) wave += " L" + x + " " + yAt(x).toFixed(1);
    let dots = "", recon = "";
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W, y = yAt(x);
      recon += (i === 0 ? "M" : " L") + x.toFixed(1) + " " + y.toFixed(1);
      dots += `<line x1="${x.toFixed(1)}" y1="${mid}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="snd-stick"/>` +
              `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="snd-dot"/>`;
    }
    $("sndWave").innerHTML =
      `<line x1="0" y1="${mid}" x2="${W}" y2="${mid}" class="snd-axis"/>` +
      `<path d="${wave}" class="snd-analog"/>` +
      `<path d="${recon}" class="snd-digital"/>` + dots;
    const q = n < 10 ? "bassa — il suono digitale è molto diverso dall'originale (distorto)"
            : n < 22 ? "media — si riconosce, ma si perdono i dettagli"
            : n < 44 ? "buona — molto fedele all'originale"
            : "alta — quasi identico all'originale (ma il file pesa di più)";
    $("sndQuality").innerHTML = `Qualità: <b>${q}</b>`;
  }
  $("sndRate").addEventListener("input", renderSound);

  /* ============================================================
     Cambio modalità e sotto-schede
     ============================================================ */
  $("modeSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]"); if (!b) return;
    $("modeSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    $("compMode").hidden = b.dataset.mode !== "comp";
    $("codMode").hidden = b.dataset.mode !== "cod";
  });
  $("codSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cod]"); if (!b) return;
    $("codSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    $("codTesto").hidden = b.dataset.cod !== "testo";
    $("codImg").hidden = b.dataset.cod !== "img";
    $("codSuono").hidden = b.dataset.cod !== "suono";
  });

  /* ---------- Avvio ---------- */
  renderText();
  renderRGB();
  renderSound();
})();
