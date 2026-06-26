/* ============================================================
   vonneumann.js — Macchina di Von Neumann
   Simula il ciclo fetch-decode-execute di un piccolo programma e
   anima il percorso dei dati (pacchetto sui bus). Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // Programma fisso: legge 2 numeri, li somma, mostra il risultato.
  // La memoria contiene istruzioni (0–5) E dati (cella 6): è il cuore
  // dell'idea di Von Neumann (programma e dati nella stessa memoria).
  const PROGRAM = [
    { type: "instr", text: "IN" },        // 0: input → ACC
    { type: "instr", text: "STORE 6" },   // 1: ACC → memoria[6]
    { type: "instr", text: "IN" },        // 2: input → ACC
    { type: "instr", text: "ADD 6" },     // 3: ACC = ACC + memoria[6]
    { type: "instr", text: "OUT" },       // 4: ACC → output
    { type: "instr", text: "HLT" },       // 5: stop
    { type: "data", value: 0 },           // 6: dato
  ];

  let frames = [], step = 0, timer = null;

  /* ---------- Generazione dei micro-passi ---------- */
  function build(inputs) {
    const mem = PROGRAM.map((c) => Object.assign({}, c));
    let PC = 0, IR = "—", MAR = "—", MDR = "—", ACC = 0, inIdx = 0;
    const out = [];
    const fr = [];
    const snap = (o) => fr.push(Object.assign({
      PC, IR, MAR, MDR, ACC, mem: mem.map((c) => Object.assign({}, c)), out: out.slice(),
      inNext: inputs[inIdx] != null ? inputs[inIdx] : null,
    }, o));

    snap({ desc: "Il programma è già in <b>memoria</b> insieme ai dati. Premi <b>Passo</b> per iniziare il ciclo.", phase: "—", from: null, to: null });

    let guard = 0;
    let halted = false;
    while (!halted && guard++ < 60) {
      // ---- FETCH ----
      MAR = PC;
      snap({ desc: `<span class="ph">FETCH</span> Il <b>Program Counter</b> (PC=${PC}) indica la prossima istruzione: va nel <b>MAR</b>.`, phase: "fetch", from: "regPC", to: "regMAR", value: PC, hi: ["regMAR"] });
      snap({ desc: `<span class="ph">FETCH</span> L'indirizzo nel MAR viaggia sul <b>bus indirizzi</b> verso la memoria.`, phase: "fetch", from: "regMAR", to: "mem-" + MAR, bus: "addr", value: MAR, hi: ["mem-" + MAR] });
      MDR = mem[MAR].text;
      snap({ desc: `<span class="ph">FETCH</span> La memoria mette l'istruzione sul <b>bus dati</b> → <b>MDR</b>.`, phase: "fetch", from: "mem-" + MAR, to: "regMDR", bus: "data", value: MDR, hi: ["regMDR"] });
      IR = MDR;
      snap({ desc: `<span class="ph">FETCH</span> L'istruzione passa nel registro istruzioni <b>IR</b>.`, phase: "fetch", from: "regMDR", to: "regIR", value: IR, hi: ["regIR"] });
      PC = PC + 1;
      snap({ desc: `<span class="ph">FETCH</span> Il PC avanza: punterà alla prossima istruzione (PC=${PC}).`, phase: "fetch", from: "regPC", to: "regPC", value: PC, hi: ["regPC"] });

      // ---- DECODE ----
      const parts = IR.split(" ");
      const op = parts[0], arg = parts[1] != null ? +parts[1] : null;
      snap({ desc: `<span class="ph">DECODE</span> L'<b>unità di controllo</b> riconosce l'istruzione: «<b>${op}</b>»${arg != null ? " sulla cella " + arg : ""}.`, phase: "decode", from: null, to: null, hi: ["cu", "regIR"] });

      // ---- EXECUTE ----
      if (op === "IN") {
        const v = inputs[inIdx] != null ? inputs[inIdx] : 0; inIdx++;
        ACC = v;
        snap({ desc: `<span class="ph">EXECUTE</span> Il dispositivo di <b>Input</b> invia il numero <b>${v}</b> alla CPU → <b>ACC</b>.`, phase: "execute", from: "compInput", to: "regACC", value: v, hi: ["compInput", "regACC"] });
      } else if (op === "OUT") {
        out.push(ACC);
        snap({ desc: `<span class="ph">EXECUTE</span> Il valore dell'<b>ACC</b> (${ACC}) va al dispositivo di <b>Output</b>.`, phase: "execute", from: "regACC", to: "compOutput", value: ACC, hi: ["compOutput", "regACC"] });
      } else if (op === "STORE") {
        MAR = arg;
        snap({ desc: `<span class="ph">EXECUTE</span> L'indirizzo <b>${arg}</b> (dall'IR) va nel <b>MAR</b>.`, phase: "execute", from: "regIR", to: "regMAR", value: arg, hi: ["regMAR"] });
        MDR = ACC;
        snap({ desc: `<span class="ph">EXECUTE</span> Il valore dell'ACC (${ACC}) va nel <b>MDR</b>.`, phase: "execute", from: "regACC", to: "regMDR", value: ACC, hi: ["regMDR"] });
        mem[arg] = { type: "data", value: ACC };
        snap({ desc: `<span class="ph">EXECUTE</span> Il MDR scrive il valore in <b>memoria[${arg}]</b> tramite il bus dati.`, phase: "execute", from: "regMDR", to: "mem-" + arg, bus: "data", value: ACC, hi: ["mem-" + arg] });
      } else if (op === "ADD") {
        MAR = arg;
        snap({ desc: `<span class="ph">EXECUTE</span> L'indirizzo <b>${arg}</b> va nel <b>MAR</b>.`, phase: "execute", from: "regIR", to: "regMAR", value: arg, hi: ["regMAR"] });
        MDR = mem[arg].value;
        snap({ desc: `<span class="ph">EXECUTE</span> La <b>memoria[${arg}]</b> (${MDR}) viaggia sul bus dati → <b>MDR</b>.`, phase: "execute", from: "mem-" + arg, to: "regMDR", bus: "data", value: MDR, hi: ["regMDR"] });
        const res = ACC + MDR;
        snap({ desc: `<span class="ph">EXECUTE</span> L'<b>ALU</b> somma ACC (${ACC}) e MDR (${MDR}) = <b>${res}</b>.`, phase: "execute", from: "regMDR", to: "alu", value: ACC + " + " + MDR, hi: ["alu", "regACC"] });
        ACC = res;
        snap({ desc: `<span class="ph">EXECUTE</span> Il risultato (<b>${res}</b>) torna nell'<b>ACC</b>.`, phase: "execute", from: "alu", to: "regACC", value: res, hi: ["regACC"] });
      } else if (op === "HLT") {
        halted = true;
        snap({ desc: `<span class="ph">HALT</span> La macchina si ferma. In <b>output</b>: ${out.join(", ") || "—"}. ✓`, phase: "stop", from: null, to: null, done: true });
      }
    }
    return fr;
  }

  /* ---------- Rendering ---------- */
  function renderMem(f) {
    $("memCells").innerHTML = f.mem.map((c, i) => {
      const isData = c.type === "data";
      const cls = "mem-cell " + (isData ? "data" : "instr") + (i === f.PC && !f.done ? " pc" : "");
      const content = isData ? c.value : c.text;
      return `<div class="mem-cell ${isData ? "data" : "instr"}${i === f.PC && !f.done ? " pc" : ""}" id="mem-${i}"><span class="ma">[${i}]</span><span class="mc">${content}</span></div>`;
    }).join("");
  }
  function render() {
    const f = frames[step];
    $("vPC").textContent = f.PC; $("vIR").textContent = f.IR; $("vMAR").textContent = f.MAR;
    $("vMDR").textContent = f.MDR; $("vACC").textContent = f.ACC;
    $("inVal").textContent = f.done ? "—" : (f.inNext != null ? f.inNext : "—");
    $("outVal").textContent = f.out.length ? f.out.join(", ") : "—";
    renderMem(f);

    // fasi badge
    const ph = $("phase");
    ph.className = "phase-badge" + (f.phase && f.phase !== "—" ? " " + (f.phase === "stop" ? "stop" : f.phase) : "");
    ph.textContent = { fetch: "FETCH", decode: "DECODE", execute: "EXECUTE", stop: "STOP" }[f.phase] || "pronto";

    // evidenzia componenti
    document.querySelectorAll(".comp, .reg, .cu, .alu, .lane").forEach((e) => e.classList.remove("active"));
    (f.hi || []).forEach((id) => { const e = $(id); if (e) e.classList.add("active"); });
    if (f.bus) $("bus" + (f.bus === "addr" ? "Addr" : "Data")).classList.add("active");

    $("desc").innerHTML = f.desc;
    $("btnStep").disabled = step >= frames.length - 1;

    animatePacket(f);
  }

  function animatePacket(f) {
    const p = $("packet");
    if (!f.from || !f.to || f.from === f.to) { p.hidden = true; return; }
    const a = $(f.from), b = $(f.to), m = $("machine");
    if (!a || !b) { p.hidden = true; return; }
    const mr = m.getBoundingClientRect(), ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    p.hidden = false; p.textContent = f.value;
    p.style.transition = "none";
    p.style.left = (ar.left + ar.width / 2 - mr.left) + "px";
    p.style.top = (ar.top + ar.height / 2 - mr.top) + "px";
    p.style.opacity = "1";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      p.style.transition = "left .55s var(--ease), top .55s var(--ease)";
      p.style.left = (br.left + br.width / 2 - mr.left) + "px";
      p.style.top = (br.top + br.height / 2 - mr.top) + "px";
    }));
  }

  /* ---------- Controlli ---------- */
  function rebuild() {
    stopAuto();
    const a = Math.max(0, Math.min(99, +$("in1").value || 0));
    const b = Math.max(0, Math.min(99, +$("in2").value || 0));
    frames = build([a, b]); step = 0; render();
  }
  function stepFwd() { if (step < frames.length - 1) { step++; render(); } else stopAuto(); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; $("btnAuto").textContent = "▶ Auto"; } }
  function toggleAuto() {
    if (timer) { stopAuto(); return; }
    if (step >= frames.length - 1) { step = 0; render(); }
    $("btnAuto").textContent = "⏸ Pausa";
    const delay = 1500 - (+$("speed").value) * 110; // 1390 → 400 ms
    timer = setInterval(() => { if (step < frames.length - 1) stepFwd(); else stopAuto(); }, delay);
  }

  $("btnStep").addEventListener("click", () => { stopAuto(); stepFwd(); });
  $("btnAuto").addEventListener("click", toggleAuto);
  $("btnReset").addEventListener("click", () => { stopAuto(); step = 0; render(); });
  $("in1").addEventListener("input", rebuild);
  $("in2").addEventListener("input", rebuild);
  window.addEventListener("resize", () => { if (frames[step]) animatePacket(frames[step]); });

  /* ---------- Avvio ---------- */
  rebuild();
})();
