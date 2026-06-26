/* ============================================================
   so.js — Sistemi Operativi
   1) Scheduler dei processi (Round-Robin, FIFO, LIFO)
   2) Memoria virtuale: MMU, paginazione, page fault, swap
   Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const hex = (n, pad) => "0x" + (n >>> 0).toString(16).toUpperCase().padStart(pad || 0, "0");

  /* ============================================================
     1. SCHEDULER DEI PROCESSI
     ============================================================ */
  let procs = [];          // definizione: {name, arrival, burst}
  let alg = "rr", quantum = 3;
  let sim = null;          // stato della simulazione

  const PROC_EX = {
    rrABC:   { alg: "rr", q: 3, list: [["A",0,11],["B",0,4],["C",0,7]] },
    fifoABC: { alg: "fifo", q: 3, list: [["A",0,4],["B",0,3],["C",0,2]] },
    arrivi:  { alg: "rr", q: 2, list: [["A",0,5],["B",2,3],["C",4,4]] },
  };

  function loadProcExample(key) {
    const e = PROC_EX[key];
    alg = e.alg; quantum = e.q;
    procs = e.list.map((p) => ({ name: p[0], arrival: p[1], burst: p[2] }));
    $("quantum").value = quantum;
    $("algSeg").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.alg === alg));
    $("quantumGroup").style.display = alg === "rr" ? "" : "none";
    renderProcTable();
    procReset();
  }

  function renderProcTable() {
    $("procTable").innerHTML = procs.map((p, i) =>
      `<div class="proc-row p${i}">` +
        `<span class="pname"><span class="pdot"></span>${esc(p.name)}</span>` +
        `<div class="field"><input type="number" min="0" max="50" value="${p.arrival}" data-i="${i}" data-k="arrival"></div>` +
        `<div class="field"><input type="number" min="1" max="50" value="${p.burst}" data-i="${i}" data-k="burst"></div>` +
        `<button class="rm" data-rm="${i}" title="Rimuovi" type="button">✕</button>` +
      `</div>`).join("");
  }

  function buildSim() {
    return {
      time: 0, running: null, qUsed: 0, gantt: [], queue: [], done: false,
      list: procs.map((p, i) => ({
        name: p.name, idx: i, arrival: +p.arrival, burst: +p.burst, remaining: +p.burst,
        state: "new", admitted: false, finish: null, firstStart: null,
      })),
    };
  }

  function admitArrivals(t) {
    sim.list.forEach((p) => {
      if (!p.admitted && p.arrival <= t) {
        p.admitted = true; p.state = "ready"; sim.queue.push(p.idx);
      }
    });
  }
  function dispatch() {
    if (!sim.queue.length) return;
    const idx = alg === "lifo" ? sim.queue.pop() : sim.queue.shift();
    sim.running = idx; sim.qUsed = 0;
    const p = sim.list[idx];
    p.state = "run";
    if (p.firstStart === null) p.firstStart = sim.time;
  }

  function tick() {
    if (sim.done) return;
    admitArrivals(sim.time);
    if (sim.running === null) dispatch();

    if (sim.running === null) {
      // nessun processo pronto: CPU inattiva
      if (sim.list.every((p) => p.state === "term")) { sim.done = true; return; }
      sim.gantt.push("idle"); sim.time++; return;
    }

    const p = sim.list[sim.running];
    p.remaining--; sim.qUsed++;
    sim.gantt.push(p.idx);
    sim.time++;
    admitArrivals(sim.time); // gli arrivi entrano in coda prima del processo prelazionato

    if (p.remaining === 0) {
      p.state = "term"; p.finish = sim.time; sim.running = null; sim.qUsed = 0;
      if (sim.list.every((x) => x.state === "term")) sim.done = true;
    } else if (alg === "rr" && sim.qUsed >= quantum) {
      p.state = "ready"; sim.queue.push(p.idx); sim.running = null; sim.qUsed = 0;
    }
  }

  function procReset() { sim = buildSim(); renderProc(); setProcStatus("Pronto · premi Avanza o Esegui tutto", ""); }
  function procStep() { if (sim.done) return; tick(); renderProc(); statusProc(); }
  function procRunAll() { let g = 0; while (!sim.done && g++ < 1000) tick(); renderProc(); statusProc(); }

  function statusProc() {
    if (sim.done) setProcStatus(`Completato al tempo ${sim.time}`, "ok");
    else { const r = sim.running !== null ? sim.list[sim.running].name : "—"; setProcStatus(`t = ${sim.time} · in CPU: ${r}`, ""); }
  }
  function setProcStatus(m, k) { const e = $("procStatus"); e.textContent = m; e.className = "code-status" + (k ? " " + k : ""); }

  function renderProc() {
    $("clock").textContent = sim.time;
    // CPU
    const core = $("cpuCore"), pr = $("cpuProc");
    if (sim.running !== null) {
      const p = sim.list[sim.running];
      core.className = "cpu-core busy p" + p.idx;
      pr.textContent = p.name; pr.className = "cpu-proc";
    } else { core.className = "cpu-core"; pr.textContent = sim.done ? "✓" : "—"; }

    // coda ready
    $("readyQueue").innerHTML = sim.queue.length
      ? sim.queue.map((i) => `<span class="queue-item p${i}">${esc(sim.list[i].name)}</span>`).join("")
      : `<span class="queue-empty">vuota</span>`;

    // gantt
    $("gantt").innerHTML = sim.gantt.map((g, t) => {
      if (g === "idle") return `<div class="gantt-cell idle">·${t % 5 === 0 ? `<span class="gt">${t}</span>` : ""}</div>`;
      return `<div class="gantt-cell p${g}">${esc(sim.list[g].name)}${t % 5 === 0 ? `<span class="gt">${t}</span>` : ""}</div>`;
    }).join("");

    // stati
    $("procStates").innerHTML = sim.list.map((p) => {
      const pct = Math.round((1 - p.remaining / p.burst) * 100);
      const b = p.state === "run" ? "run" : p.state === "ready" ? "ready" : p.state === "term" ? "term" : "new";
      const lbl = { run: "RUN", ready: "READY", term: "TERMINATO", new: "NEW" }[b];
      return `<div class="pstate p${p.idx}">` +
        `<span class="pdot"></span>` +
        `<div><div class="pn">${esc(p.name)} <span style="color:var(--ink-faint);font-weight:400">arr ${p.arrival} · ${p.burst}u</span></div>` +
        `<div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></div>` +
        `<span class="badge ${b}">${lbl}</span></div>`;
    }).join("");

    // metriche
    if (sim.done) {
      let tt = 0, tw = 0;
      sim.list.forEach((p) => { const turn = p.finish - p.arrival; tt += turn; tw += turn - p.burst; });
      const n = sim.list.length;
      $("procMetrics").innerHTML = sim.list.map((p) =>
        `<div>${esc(p.name)}: completamento <b>${p.finish}</b> · attesa <b>${(p.finish - p.arrival - p.burst)}</b></div>`
      ).join("") + `<div style="margin-top:0.4rem">Attesa media: <b>${(tw / n).toFixed(2)}</b> · Turnaround medio: <b>${(tt / n).toFixed(2)}</b></div>`;
    } else $("procMetrics").innerHTML = "";
  }

  /* ============================================================
     2. MEMORIA VIRTUALE (MMU + paginazione)
     ============================================================ */
  const PAGE_BITS = 12, PAGE_SIZE = 1 << PAGE_BITS; // 0x1000
  const N_PAGES = 6, N_FRAMES = 4;
  let policy = "fifo";
  let pageTable = [], frames = [], loadOrder = [], lru = 0;

  function memReset() {
    pageTable = [];
    for (let i = 0; i < N_PAGES; i++) pageTable.push({ present: false, frame: null, lastUse: 0 });
    frames = new Array(N_FRAMES).fill(null);
    loadOrder = [];
    // stato iniziale: pagine 0,1,3 in RAM; 2,4,5 su disco; frame 3 libero
    place(0, 0); place(1, 2); place(3, 1);
    renderMem(null, { steps: ["Stato iniziale: pagine 0, 1 e 3 in RAM. Pagine 2, 4, 5 sul disco (swap)."], result: null }, {});
    setMemStatus("Pronto · inserisci un indirizzo e premi Accedi", "");
  }
  function place(page, frame) {
    pageTable[page].present = true; pageTable[page].frame = frame; pageTable[page].lastUse = ++lru;
    frames[frame] = page; loadOrder.push(frame);
  }

  function pickVictim() {
    if (policy === "fifo") return loadOrder[0];           // frame caricato per primo
    // LRU: tra le pagine presenti, quella usata meno di recente
    let best = null, bestUse = Infinity;
    frames.forEach((pg, f) => { if (pg !== null && pageTable[pg].lastUse < bestUse) { bestUse = pageTable[pg].lastUse; best = f; } });
    return best;
  }

  function access(addr) {
    const changed = {};
    const steps = [];
    const page = addr >> PAGE_BITS, offset = addr & (PAGE_SIZE - 1);
    const info = { page, offset, addr };

    if (page >= N_PAGES) {
      steps.push({ t: "Pagina " + page + " non appartiene allo spazio del processo (max " + (N_PAGES - 1) + ").", fault: true });
      renderMem(info, { steps, result: { err: true } }, {});
      setMemStatus("Indirizzo non valido", "err");
      procStateMini("run");
      return;
    }

    steps.push({ t: `Numero pagina = indirizzo ÷ dimensione = ${addr} ÷ ${PAGE_SIZE} = <b>${page}</b>. Offset = resto = ${addr} mod ${PAGE_SIZE} = <b>${hex(offset, 3)}</b>.` });

    if (pageTable[page].present) {
      const frame = pageTable[page].frame;
      pageTable[page].lastUse = ++lru;
      const phys = (frame << PAGE_BITS) | offset;
      steps.push({ t: `Bit di presenza della pagina ${page} = <b>1</b>: è in RAM, frame <b>${frame}</b>.` });
      steps.push({ t: `Indirizzo fisico = frame × dimensione + offset = ${frame} × ${PAGE_SIZE} + ${offset} = <b>${hex(phys, 4)}</b>.` });
      procStateMini("run");
      renderMem(info, { steps, result: { phys, page } }, changed);
      setMemStatus("Tradotto · HIT", "ok");
      return;
    }

    // PAGE FAULT
    steps.push({ t: `Bit di presenza della pagina ${page} = <b>0</b> → <b>PAGE FAULT</b>: la pagina non è in RAM.`, fault: true });
    steps.push({ t: "Il processo passa nello stato <b>Wait</b>; interviene il gestore della memoria." });
    procStateMini("wait");

    let frame = frames.indexOf(null);
    if (frame === -1) {
      const victimFrame = pickVictim();
      const victimPage = frames[victimFrame];
      pageTable[victimPage].present = false; pageTable[victimPage].frame = null;
      frames[victimFrame] = null;
      loadOrder = loadOrder.filter((f) => f !== victimFrame);
      changed.swapOut = victimPage;
      steps.push({ t: `RAM piena → vittima (${policy.toUpperCase()}): <b>pagina ${victimPage}</b> nel frame ${victimFrame}, scaricata sul disco (swap-out).`, fault: true });
      frame = victimFrame;
    } else {
      steps.push({ t: `C'è un frame libero: il <b>frame ${frame}</b>.` });
    }

    place(page, frame);
    changed.swapIn = frame;
    steps.push({ t: `La pagina ${page} viene caricata dal disco nel frame ${frame} (swap-in); bit di presenza → 1.` });
    steps.push({ t: "Tabella aggiornata: il processo torna in <b>Ready</b> e riprende." });

    const phys = (frame << PAGE_BITS) | offset;
    steps.push({ t: `Indirizzo fisico = frame ${frame} × ${hex(PAGE_SIZE, 4)} + offset = <b>${hex(phys, 4)}</b>.` });
    procStateMini("ready");
    renderMem(info, { steps, result: { phys, page, fault: true } }, changed);
    setMemStatus("PAGE FAULT risolto", "err");
  }

  function procStateMini(state) {
    const states = [["new", "New"], ["ready", "Ready"], ["run", "Run"], ["wait", "Wait"], ["term", "Terminated"]];
    $("procStateMini").innerHTML = states.map(([k, l]) =>
      `<span class="st ${k} ${k === state ? "active" : ""}">${l}</span>`).join("");
  }

  function setMemStatus(m, k) { const e = $("memStatus"); e.textContent = m; e.className = "code-status" + (k ? " " + k : ""); }

  function renderMem(info, out, changed) {
    // scomposizione indirizzo
    if (info) {
      $("addrBreak").innerHTML =
        `<div class="addr-part"><div class="ap-label">Indirizzo logico</div><div class="ap-val">${hex(info.addr, 4)}</div><div class="ap-sub">${info.addr} dec</div></div>` +
        `<div class="addr-op">÷</div>` +
        `<div class="addr-part size"><div class="ap-label">Dimensione</div><div class="ap-val">${hex(PAGE_SIZE, 4)}</div><div class="ap-sub">${PAGE_SIZE} dec</div></div>` +
        `<div class="addr-op">=</div>` +
        `<div class="addr-part page"><div class="ap-label">N° pagina</div><div class="ap-val">${info.page}</div><div class="ap-sub">quoziente</div></div>` +
        `<div class="addr-op">resto</div>` +
        `<div class="addr-part offset"><div class="ap-label">Offset</div><div class="ap-val">${hex(info.offset, 3)}</div><div class="ap-sub">${info.offset} dec</div></div>`;
    }
    // passi
    $("transSteps").innerHTML = out.steps.map((s, i) =>
      `<div class="trans-step ${s.fault ? "fault" : ""}"><span class="tn">${i + 1}.</span><span>${s.t}</span></div>`).join("");

    // risultato
    const r = out.result;
    if (r && !r.err && r.phys != null) {
      $("memResult").className = "mem-result " + (r.fault ? "fault" : "ok");
      $("memResult").innerHTML = `<span class="mr-lbl">${r.fault ? "Risolto dopo page fault — " : ""}Indirizzo fisico</span><div class="mr-big">${hex(r.phys, 4)}</div>`;
    } else if (r && r.err) {
      $("memResult").className = "mem-result fault";
      $("memResult").innerHTML = `<span class="mr-lbl">Errore</span><div class="mr-big">Segmentation fault</div>`;
    } else { $("memResult").className = "mem-result"; $("memResult").innerHTML = ""; }

    // tabella delle pagine
    $("pageTable").innerHTML =
      `<div class="pt-head"><span>Pagina</span><span>Frame</span><span>Presente</span><span>Dove</span></div>` +
      pageTable.map((e, p) => {
        const hit = info && info.page === p ? " hit" : "";
        return `<div class="pt-row ${e.present ? "present" : ""}${hit}">` +
          `<span>${p}</span>` +
          `<span class="frame ${e.present ? "" : "none"}">${e.present ? e.frame : "—"}</span>` +
          `<span class="bit ${e.present ? "on" : "off"}">${e.present ? 1 : 0}</span>` +
          `<span>${e.present ? "RAM" : "disco"}</span></div>`;
      }).join("");

    // frame RAM
    $("ramFrames").innerHTML = frames.map((pg, f) => {
      let cls = "frame-cell " + (pg === null ? "empty" : "filled");
      if (changed.swapIn === f) cls += " changed";
      return `<div class="${cls}"><div class="fc-addr">${hex(f << PAGE_BITS, 4)} · frame ${f}</div>` +
        `<div class="fc-page">${pg === null ? "libero" : "pagina " + pg}</div></div>`;
    }).join("");

    // disco / swap
    const onDisk = [];
    for (let p = 0; p < N_PAGES; p++) if (!pageTable[p].present) onDisk.push(p);
    $("swapArea").innerHTML = onDisk.length
      ? onDisk.map((p) => `<span class="swap-page ${changed.swapOut === p ? "changed" : ""}">pagina ${p}</span>`).join("")
      : `<span class="swap-empty">nessuna pagina sul disco</span>`;
  }

  const MEM_EX = {
    hit:     { addrs: [0x0110] },
    fault:   { addrs: [0x2ABC] },
    replace: { addrs: [0x2ABC, 0x4500] },
    oob:     { addrs: [0x9000] },
  };
  function runMemExample(key) { memReset(); MEM_EX[key].addrs.forEach((a) => access(a)); }

  /* ============================================================
     Cambio modalità ed eventi
     ============================================================ */
  function setMode(mode) {
    $("modeSeg").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    $("procMode").hidden = mode !== "proc";
    $("memMode").hidden = mode !== "mem";
  }

  // --- eventi processi ---
  $("modeSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) setMode(b.dataset.mode); });
  $("algSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-alg]"); if (!b) return;
    alg = b.dataset.alg;
    $("algSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    $("quantumGroup").style.display = alg === "rr" ? "" : "none";
    procReset();
  });
  $("quantum").addEventListener("input", (e) => { quantum = Math.max(1, +e.target.value || 1); procReset(); });
  $("procTable").addEventListener("input", (e) => {
    const i = e.target.dataset.i, k = e.target.dataset.k; if (i === undefined) return;
    procs[+i][k] = Math.max(k === "burst" ? 1 : 0, +e.target.value || 0); procReset();
  });
  $("procTable").addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]"); if (!b) return;
    if (procs.length > 1) { procs.splice(+b.dataset.rm, 1); renumber(); renderProcTable(); procReset(); }
  });
  $("addProc").addEventListener("click", () => {
    if (procs.length >= 6) return;
    procs.push({ name: String.fromCharCode(65 + procs.length), arrival: 0, burst: 4 });
    renderProcTable(); procReset();
  });
  function renumber() { procs.forEach((p, i) => { p.name = String.fromCharCode(65 + i); }); }
  $("procStep").addEventListener("click", procStep);
  $("procRun").addEventListener("click", procRunAll);
  $("procReset").addEventListener("click", procReset);

  $("procExamples").innerHTML = [["rrABC", "Round-Robin (q=3)"], ["fifoABC", "FIFO"], ["arrivi", "Arrivi sfalsati"]]
    .map(([k, l]) => `<button type="button" class="example-chip" data-ex="${k}">${l}</button>`).join("");
  $("procExamples").addEventListener("click", (e) => { const b = e.target.closest("[data-ex]"); if (b) loadProcExample(b.dataset.ex); });

  // --- eventi memoria ---
  $("policySeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pol]"); if (!b) return;
    policy = b.dataset.pol;
    $("policySeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
  });
  $("memAccess").addEventListener("click", () => {
    const raw = $("logAddr").value.trim().replace(/^0x/i, "");
    if (!/^[0-9a-f]+$/i.test(raw)) { setMemStatus("Indirizzo esadecimale non valido", "err"); return; }
    access(parseInt(raw, 16) & 0xFFFF);
  });
  $("logAddr").addEventListener("keydown", (e) => { if (e.key === "Enter") $("memAccess").click(); });
  $("memReset").addEventListener("click", memReset);
  $("memExamples").innerHTML = [["hit", "Hit (in RAM)"], ["fault", "Page fault (frame libero)"], ["replace", "Page fault + rimpiazzo"], ["oob", "Fuori spazio"]]
    .map(([k, l]) => `<button type="button" class="example-chip" data-ex="${k}">${l}</button>`).join("");
  $("memExamples").addEventListener("click", (e) => { const b = e.target.closest("[data-ex]"); if (b) runMemExample(b.dataset.ex); });

  /* ---------- Avvio ---------- */
  loadProcExample("rrABC");
  memReset();
  procStateMini("run");
})();
