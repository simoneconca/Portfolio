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

  // Tabella ASCII completa (0–127)
  const CTRL = ["NUL","SOH","STX","ETX","EOT","ENQ","ACK","BEL","BS","TAB","LF","VT","FF","CR","SO","SI",
                "DLE","DC1","DC2","DC3","DC4","NAK","SYN","ETB","CAN","EM","SUB","ESC","FS","GS","RS","US"];
  function buildAscii() {
    let html = "";
    for (let i = 0; i < 128; i++) {
      const ctrl = i < 32 || i === 127;
      let label;
      if (i < 32) label = CTRL[i];
      else if (i === 32) label = "␣";
      else if (i === 127) label = "DEL";
      else label = esc(String.fromCharCode(i));
      html += `<div class="ascii-cell${ctrl ? " ctrl" : ""}${i === 32 ? " space" : ""}">` +
        `<span class="ac-dec">${i}</span>` +
        `<span class="ac-char">${label}</span>` +
        `<span class="ac-bin">${bin(i, 8)}</span></div>`;
    }
    $("asciiTable").innerHTML = html;
  }
  $("asciiToggle").addEventListener("click", () => {
    const t = $("asciiTable"), btn = $("asciiToggle"), leg = $("asciiLegend");
    const opening = t.hidden;
    if (opening && !t.dataset.built) { buildAscii(); t.dataset.built = "1"; }
    t.hidden = !opening; leg.hidden = !opening;
    btn.setAttribute("aria-expanded", String(opening));
    btn.textContent = opening ? "✕ Nascondi la tabella ASCII completa" : "📋 Mostra la tabella ASCII completa (0–127)";
  });

  /* ---------- Immagini → RGB + esadecimale ---------- */
  const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
  const lumaDark = (r, g, b) => (r * 0.299 + g * 0.587 + b * 0.114) > 140;

  function renderRGB() {
    const r = +$("rR").value, g = +$("rG").value, b = +$("rB").value;
    $("rRv").textContent = r; $("rGv").textContent = g; $("rBv").textContent = b;
    const hx = "#" + hex2(r) + hex2(g) + hex2(b);
    const sw = $("rgbSwatch");
    sw.style.background = `rgb(${r},${g},${b})`;
    sw.style.color = lumaDark(r, g, b) ? "#111" : "#fff";
    sw.innerHTML = `<span class="sw-hex">${hx}</span><span class="sw-rgb">rgb(${r}, ${g}, ${b})</span>`;
    $("rgbBits").innerHTML =
      `<div class="rb r"><span>R ${r}</span><code>${bin(r, 8)}</code><em>${hex2(r)}</em></div>` +
      `<div class="rb g"><span>G ${g}</span><code>${bin(g, 8)}</code><em>${hex2(g)}</em></div>` +
      `<div class="rb b"><span>B ${b}</span><code>${bin(b, 8)}</code><em>${hex2(b)}</em></div>` +
      `<div class="rb tot"><span>24 bit = 3 byte</span><code>${bin(r, 8)} ${bin(g, 8)} ${bin(b, 8)}</code></div>` +
      `<div class="rb hex"><span>esadecimale</span><code class="hexcode">${hx}</code></div>`;
    $("hexExplain").innerHTML =
      `Ogni byte (8 bit) si accorcia in <b>2 cifre esadecimali</b>: ` +
      `<code>${bin(r, 8)}</code> = <b>${hex2(r)}</b>, e così per ogni canale. ` +
      `Uniti danno il colore <code class="hex-pill">${hx}</code> — lo stesso che usi nel codice HTML/CSS. ` +
      `<span class="hex-ff">FF = 255 (massimo), 00 = 0 (minimo).</span>`;
    // il colore scelto diventa il pennello della griglia
    brush = [r, g, b];
    const pb = $("pxBrush");
    if (pb) { pb.style.background = `rgb(${r},${g},${b})`; pb.title = hx; }
  }
  ["rR", "rG", "rB"].forEach((id) => $(id).addEventListener("input", renderRGB));

  /* ---------- Immagini → griglia di pixel ---------- */
  const GW = 16, GH = 16;           // dimensioni dell'immagine (pixel)
  let grid = [];                    // grid[y][x] = [r,g,b]
  let brush = [233, 30, 99];
  let cell = 18, showGrid = true, hoverCell = null;
  const SKY = [170, 214, 240];

  function newGrid(fill) {
    grid = [];
    for (let y = 0; y < GH; y++) { const row = []; for (let x = 0; x < GW; x++) row.push(fill.slice()); grid.push(row); }
  }
  function loadExample() {
    newGrid(SKY);
    const cx = 7.5, cy = 6;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < 1.7) grid[y][x] = [255, 193, 7];          // centro giallo
      else if (d < 3.4) grid[y][x] = [233, 30, 99];     // petali rosa
    }
    for (let y = 9; y <= 14; y++) { grid[y][7] = [76, 175, 80]; grid[y][8] = [76, 175, 80]; } // stelo
    grid[11][5] = [46, 125, 50]; grid[11][6] = [46, 125, 50];  // foglie
    grid[12][9] = [46, 125, 50]; grid[12][10] = [46, 125, 50];
    for (let x = 0; x < GW; x++) grid[15][x] = [76, 175, 80];  // erba
    paintGrid();
  }

  function drawCanvas(cv, c, withGrid) {
    const ctx = cv.getContext("2d");
    cv.width = GW * c; cv.height = GH * c;
    cv.style.width = (GW * c) + "px"; cv.style.height = (GH * c) + "px";
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const p = grid[y][x];
      ctx.fillStyle = `rgb(${p[0]},${p[1]},${p[2]})`;
      ctx.fillRect(x * c, y * c, c, c);
      if (withGrid && c >= 9) {
        ctx.strokeStyle = "rgba(0,0,0,0.14)"; ctx.lineWidth = 1;
        ctx.strokeRect(x * c + 0.5, y * c + 0.5, c - 1, c - 1);
      }
    }
    if (hoverCell && cv.id === "pxCanvas") {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.strokeRect(hoverCell[0] * c + 1, hoverCell[1] * c + 1, c - 2, c - 2);
      ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
      ctx.strokeRect(hoverCell[0] * c + 0.5, hoverCell[1] * c + 0.5, c - 1, c - 1);
    }
  }
  function paintGrid() {
    drawCanvas($("pxCanvas"), cell, showGrid);
    drawCanvas($("pxReal"), 3, false);     // anteprima a dimensione reale (3px/pixel)
    renderStats();
  }
  function renderStats() {
    const tot = GW * GH, bytes = tot * 3;
    const kb = (bytes / 1024).toFixed(2).replace(".", ",");
    $("pxStats").innerHTML =
      `<span class="px-stat"><b>${GW} × ${GH}</b> = ${tot} pixel</span>` +
      `<span class="px-stat"><b>24 bit</b> per pixel</span>` +
      `<span class="px-stat">peso grezzo: ${tot} × 3 byte = <b>${bytes} byte</b> (${kb} KB)</span>`;
  }

  function cellFromEvent(e) {
    const cv = $("pxCanvas"), rect = cv.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (cv.width / rect.width);
    const py = (e.clientY - rect.top) * (cv.height / rect.height);
    const x = Math.floor(px / cell), y = Math.floor(py / cell);
    if (x < 0 || x >= GW || y < 0 || y >= GH) return null;
    return [x, y];
  }
  function showReadout(x, y) {
    const p = grid[y][x];
    const hx = "#" + hex2(p[0]) + hex2(p[1]) + hex2(p[2]);
    $("pxReadout").innerHTML =
      `<span class="pr-pos">pixel (${x}, ${y})</span>` +
      `<span class="pr-sw" style="background:rgb(${p[0]},${p[1]},${p[2]})"></span>` +
      `<span class="pr-line"><b class="r">R ${p[0]}</b> <b class="g">G ${p[1]}</b> <b class="b">B ${p[2]}</b></span>` +
      `<span class="pr-hex">${hx}</span>` +
      `<span class="pr-bin">${bin(p[0], 8)} ${bin(p[1], 8)} ${bin(p[2], 8)}</span>`;
  }

  function wirePixelGrid() {
    const cv = $("pxCanvas");
    cv.addEventListener("mousemove", (e) => {
      const c = cellFromEvent(e); if (!c) return;
      hoverCell = c; showReadout(c[0], c[1]); paintGrid();
    });
    cv.addEventListener("mouseleave", () => { hoverCell = null; paintGrid(); });
    let painting = false;
    const paintAt = (e) => { const c = cellFromEvent(e); if (!c) return; grid[c[1]][c[0]] = brush.slice(); hoverCell = c; showReadout(c[0], c[1]); paintGrid(); };
    cv.addEventListener("mousedown", (e) => { painting = true; paintAt(e); });
    cv.addEventListener("mousemove", (e) => { if (painting) paintAt(e); });
    window.addEventListener("mouseup", () => { painting = false; });
    // tocco (mobile)
    cv.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.touches[0]; const c = cellFromEvent(t); if (c) { grid[c[1]][c[0]] = brush.slice(); showReadout(c[0], c[1]); paintGrid(); } }, { passive: false });

    $("pxZoom").addEventListener("input", () => { cell = +$("pxZoom").value; paintGrid(); });
    $("pxGrid").addEventListener("change", () => { showGrid = $("pxGrid").checked; paintGrid(); });
    $("pxExample").addEventListener("click", loadExample);
    $("pxClear").addEventListener("click", () => { newGrid([255, 255, 255]); hoverCell = null; $("pxReadout").textContent = "Passa sopra un pixel per vederne i valori…"; paintGrid(); });
  }

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
  wirePixelGrid();
  loadExample();
  renderRGB();
  renderSound();
})();
