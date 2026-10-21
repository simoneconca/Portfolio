/* ============================================================
   concorrenza.js — Processi e concorrenza
   Un modulo indipendente per sezione. Nessuna dipendenza esterna.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var yEl = $("year"); if (yEl && !yEl.textContent) yEl.textContent = new Date().getFullYear();

  /* ========================================================
     1 · CPU — Gantt multiprogrammazione
     ======================================================== */
  (function cpu() {
    var gantt = $("cpuGantt"), play = $("cpuPlay"), reset = $("cpuReset"), readout = $("cpuReadout");
    if (!gantt) return;
    var SCENES = {
      mono: {
        max: 20, time: 20, util: 60,
        rows: [
          { lbl: "P1", cells: [["cpu", 3], ["io", 4], ["cpu", 3], ["idle", 10]] },
          { lbl: "P2", cells: [["idle", 10], ["cpu", 3], ["io", 4], ["cpu", 3]] }
        ]
      },
      multi: {
        max: 13, time: 13, util: 92,
        rows: [
          { lbl: "P1", cells: [["cpu", 3], ["io", 4], ["cpu", 3], ["idle", 3]] },
          { lbl: "P2", cells: [["idle", 3], ["cpu", 3], ["io", 4], ["cpu", 3]] }
        ]
      }
    };
    var mode = "mono", timers = [], cellEls = [];
    function build() {
      clear();
      var sc = SCENES[mode];
      gantt.innerHTML = "";
      cellEls = [];
      sc.rows.forEach(function (row) {
        var track = document.createElement("div"); track.className = "cpu-track";
        var lbl = document.createElement("span"); lbl.className = "cpu-track-lbl"; lbl.textContent = row.lbl;
        var bar = document.createElement("div"); bar.className = "cpu-bar";
        var start = 0;
        row.cells.forEach(function (c) {
          var cell = document.createElement("div");
          cell.className = "cpu-cell " + c[0] + " off";
          cell.style.flexGrow = c[1];
          bar.appendChild(cell);
          if (c[0] !== "idle") cellEls.push({ el: cell, start: start });
          start += c[1];
        });
        track.appendChild(lbl); track.appendChild(bar); gantt.appendChild(track);
      });
      readout.textContent = "";
    }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function run() {
      build();
      var sc = SCENES[mode], UNIT = 150;
      cellEls.forEach(function (c) {
        timers.push(setTimeout(function () { c.el.classList.remove("off"); }, c.start * UNIT));
      });
      timers.push(setTimeout(function () {
        readout.textContent = "Tempo totale: " + sc.time + " unità · CPU usata " + sc.util + "%";
      }, sc.max * UNIT + 200));
    }
    gantt.parentNode.querySelectorAll(".cpu-seg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        gantt.parentNode.querySelectorAll(".cpu-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); mode = b.dataset.mode; build();
      });
    });
    play.addEventListener("click", run);
    reset.addEventListener("click", build);
    build();
  })();

  /* ========================================================
     2 · STATI DEL PROCESSO
     ======================================================== */
  (function stati() {
    var readySlots = $("stReadySlots"), runSlot = $("stRunSlot"), waitSlots = $("stWaitSlots"),
      explain = $("stExplain"), resetBtn = $("stReset");
    if (!readySlots) return;
    var counter = 0, ready = [], running = null, waiting = [], MAXP = 6;
    function chip(p) { return '<span class="st-proc">' + p + "</span>"; }
    function render() {
      readySlots.innerHTML = ready.map(chip).join("");
      runSlot.innerHTML = running ? chip(running) : "";
      waitSlots.innerHTML = waiting.map(chip).join("");
    }
    function say(h) { explain.innerHTML = h; }
    var EV = {
      new: function () {
        if (counter >= MAXP) { say("Troppi processi per la demo: <strong>termina</strong> o azzera prima di crearne altri."); return; }
        counter++; var p = "P" + counter; ready.push(p);
        say("<strong>" + p + "</strong> è stato <strong>creato</strong> (stato Nuovo) ed è subito entrato nella <strong>Ready List</strong>: ha tutto tranne la CPU.");
      },
      dispatch: function () {
        if (running) { say("La CPU è occupata da <strong>" + running + "</strong>: su una sola CPU, un processo per volta. Fai scadere il quanto o mandalo in I/O."); return; }
        if (!ready.length) { say("La Ready List è vuota: nessuno da mandare in esecuzione."); return; }
        running = ready.shift();
        say("<strong>Dispatch</strong>: lo scheduler sceglie <strong>" + running + "</strong> dalla Ready List e gli assegna la CPU → stato <strong>In esecuzione</strong>.");
      },
      timeout: function () {
        if (!running) { say("Nessun processo in esecuzione."); return; }
        var p = running; running = null; ready.push(p);
        say("<strong>Quanto scaduto</strong>: a <strong>" + p + "</strong> viene <em>revocata</em> la CPU. Non ha finito e non aspetta nulla, quindi torna in <strong>fondo</strong> alla Ready List.");
      },
      io: function () {
        if (!running) { say("Nessun processo in esecuzione da mettere in attesa."); return; }
        var p = running; running = null; waiting.push(p);
        say("<strong>" + p + "</strong> chiede una risorsa non disponibile (es. il disco): si <strong>sospende</strong> nella Waiting List. La CPU si libera per un altro.");
      },
      done: function () {
        if (!waiting.length) { say("Nessun processo sospeso in attesa di un evento."); return; }
        var p = waiting.shift(); ready.push(p);
        say("L'evento atteso da <strong>" + p + "</strong> è arrivato. Attenzione: <strong>non</strong> torna dritto in esecuzione, ma nella <strong>Ready List</strong>, in coda come tutti.");
      },
      exit: function () {
        if (!running) { say("Nessun processo in esecuzione da terminare."); return; }
        var p = running; running = null;
        say("<strong>" + p + "</strong> ha eseguito tutto il suo codice → stato <strong>Finito</strong>. Il sistema operativo chiude i file e libera la memoria.");
      }
    };
    document.querySelectorAll(".st-btn").forEach(function (b) {
      b.addEventListener("click", function () { EV[b.dataset.ev](); render(); });
    });
    resetBtn.addEventListener("click", function () {
      counter = 0; ready = []; running = null; waiting = []; render();
      say("Azzerato. Crea qualche processo e prova a eseguirli.");
    });
    render();
  })();

  /* ========================================================
     4 · RACE CONDITION
     ======================================================== */
  (function race() {
    var xEl = $("raceX"), log = $("raceLog"), reg1El = $("raceReg1"), reg2El = $("raceReg2"), resetBtn = $("raceReset");
    if (!xEl) return;
    var st;
    function init() {
      st = { x: 0, t: { 1: { reg: null, pc: 0 }, 2: { reg: null, pc: 0 } } };
      render(); log.className = "race-log";
      log.innerHTML = "Ogni thread fa +1: alla fine <strong>x dovrebbe valere 2</strong>. Avanza i due thread a turno — o tutto uno e poi l'altro — e vedi se perdi un aggiornamento.";
    }
    function render() {
      xEl.textContent = "x = " + st.x;
      [1, 2].forEach(function (n) {
        var t = st.t[n], reg = (n === 1 ? reg1El : reg2El);
        reg.textContent = t.reg === null ? "–" : t.reg;
        var steps = $("raceSteps" + n).querySelectorAll("li");
        steps.forEach(function (li, i) {
          li.classList.toggle("done", i < t.pc);
          li.classList.toggle("next", i === t.pc);
        });
        var btn = document.querySelector('.race-adv.t' + n);
        btn.disabled = t.pc >= 3;
      });
    }
    function advance(n) {
      var t = st.t[n]; if (t.pc >= 3) return;
      if (t.pc === 0) t.reg = st.x;              // load
      else if (t.pc === 1) t.reg = t.reg + 1;    // inc
      else { st.x = t.reg; flash(); }            // store
      t.pc++; render(); check();
    }
    function flash() { xEl.classList.remove("flash"); void xEl.offsetWidth; xEl.classList.add("flash"); }
    function check() {
      if (st.t[1].pc >= 3 && st.t[2].pc >= 3) {
        if (st.x === 2) { log.className = "race-log good"; log.innerHTML = "✓ <strong>x = 2</strong>, corretto! I due aggiornamenti sono andati entrambi a buon fine: nessuna sovrapposizione."; }
        else { log.className = "race-log bad"; log.innerHTML = "⚠ <strong>x = 1</strong>, ma dovrebbe essere 2! Un aggiornamento è andato <strong>perso</strong>: entrambi i thread hanno letto 0 prima che l'altro scrivesse. Questa è la race condition."; }
      }
    }
    document.querySelectorAll(".race-adv").forEach(function (b) {
      b.addEventListener("click", function () { advance(+b.dataset.th); });
    });
    resetBtn.addEventListener("click", init);
    function runSeq(seq) {
      init();
      var i = 0;
      (function nx() {
        if (i >= seq.length) return;
        advance(seq[i++]); setTimeout(nx, 650);
      })();
    }
    document.querySelector('[data-preset="good"]').addEventListener("click", function () { runSeq([1, 1, 1, 2, 2, 2]); });
    document.querySelector('[data-preset="bad"]').addEventListener("click", function () { runSeq([1, 2, 1, 1, 2, 2]); });
    init();
  })();

  /* ========================================================
     6 · SEMAFORI
     ======================================================== */
  (function semaforo() {
    var valEl = $("semVal"), csEl = $("semCS"), qEl = $("semQueue"), pWrap = $("semProcsP"),
      vWrap = $("semProcsV"), explain = $("semExplain"), resetBtn = $("semReset");
    if (!valEl) return;
    var PROCS = ["P1", "P2", "P3", "P4"], init = 1, S = 1, state = {};
    function reset0() { S = init; PROCS.forEach(function (p) { state[p] = "free"; }); render(); }
    function render() {
      valEl.textContent = S; valEl.classList.toggle("neg", S < 0);
      var cs = PROCS.filter(function (p) { return state[p] === "cs"; });
      var q = PROCS.filter(function (p) { return state[p] === "wait"; });
      csEl.innerHTML = cs.length ? cs.map(function (p) { return '<span class="sem-chip">' + p + "</span>"; }).join("") : '<span class="sem-empty">— sezione libera —</span>';
      qEl.innerHTML = q.length ? q.map(function (p) { return '<span class="sem-chip wait">' + p + "</span>"; }).join("") : '<span class="sem-empty">— nessuno in attesa —</span>';
      pWrap.innerHTML = PROCS.map(function (p) {
        return '<button class="sem-pbtn" data-p="' + p + '"' + (state[p] === "free" ? "" : " disabled") + ">P(" + p + ")</button>";
      }).join("");
      vWrap.innerHTML = PROCS.map(function (p) {
        return '<button class="sem-pbtn" data-v="' + p + '"' + (state[p] === "cs" ? "" : " disabled") + ">V(" + p + ")</button>";
      }).join("");
      pWrap.querySelectorAll("[data-p]").forEach(function (b) { b.addEventListener("click", function () { doP(b.dataset.p); }); });
      vWrap.querySelectorAll("[data-v]").forEach(function (b) { b.addEventListener("click", function () { doV(b.dataset.v); }); });
    }
    function doP(p) {
      if (state[p] !== "free") return;
      S--;
      if (S >= 0) { state[p] = "cs"; say("<strong>P(" + p + ")</strong>: S = " + S + " (≥ 0) → <strong>" + p + " entra</strong> nella sezione critica."); }
      else { state[p] = "wait"; say("<strong>P(" + p + ")</strong>: S = " + S + " (&lt; 0) → la risorsa è occupata, <strong>" + p + " si blocca</strong> in coda. |S| = " + (-S) + " è il numero di bloccati."); }
      render();
    }
    function doV(p) {
      if (state[p] !== "cs") return;
      state[p] = "free"; S++;
      var woken = null;
      if (S <= 0) { // c'era un bloccato
        var q = PROCS.filter(function (x) { return state[x] === "wait"; });
        if (q.length) { state[q[0]] = "cs"; woken = q[0]; }
      }
      say("<strong>V(" + p + ")</strong>: " + p + " esce, S = " + S + "." + (woken ? " C'era un processo in attesa → <strong>" + woken + " viene svegliato</strong> ed entra." : " Nessuno in attesa: il valore resta disponibile."));
      render();
    }
    function say(h) { explain.innerHTML = h; }
    document.querySelectorAll(".sem-seg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".sem-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); init = +b.dataset.init; reset0();
        say(init === 1 ? "Semaforo <strong>binario</strong> (mutex): un solo processo per volta nella sezione critica." : "Semaforo <strong>contatore</strong> con S = 3: fino a tre processi insieme (es. 3 copie di una risorsa).");
      });
    });
    resetBtn.addEventListener("click", reset0);
    reset0();
  })();

  /* ========================================================
     7 · PRODUTTORI-CONSUMATORI
     ======================================================== */
  (function prodcons() {
    var slotsEl = $("pcSlots"), emptyEl = $("pcEmpty"), fullEl = $("pcFull"), mutexEl = $("pcMutex"),
      log = $("pcLog"), prodFace = $("pcProdFace"), consFace = $("pcConsFace"),
      prodState = $("pcProdState"), consState = $("pcConsState");
    if (!slotsEl) return;
    var N = 5, items = 0, auto = null;
    function render() {
      var s = "";
      for (var i = 0; i < N; i++) s += '<div class="pc-slot' + (i < items ? " full" : "") + '">' + (i < items ? "📦" : "") + "</div>";
      slotsEl.innerHTML = s;
      emptyEl.textContent = N - items; fullEl.textContent = items; mutexEl.textContent = 1;
    }
    function pulse(face, stEl, txt, on) {
      face.classList.add("act"); setTimeout(function () { face.classList.remove("act"); }, 250);
      stEl.textContent = txt; stEl.classList.toggle("blocked", on);
    }
    function produce() {
      if (items >= N) { pulse(prodFace, prodState, "bloccato: buffer pieno", true); log.innerHTML = "🏭 <strong>Produttore bloccato</strong>: <code>vuoti = 0</code>, non c'è posto. <code>P(vuoti)</code> lo sospende finché un consumatore non libera uno slot."; return; }
      items++; pulse(prodFace, prodState, "ha prodotto", false); render();
      log.innerHTML = "🏭 Prodotto un oggetto: <code>P(vuoti)</code> (−1 posto), inserimento in mutua esclusione, <code>V(pieni)</code> (+1 da consumare).";
    }
    function consume() {
      if (items <= 0) { pulse(consFace, consState, "bloccato: buffer vuoto", true); log.innerHTML = "🛒 <strong>Consumatore bloccato</strong>: <code>pieni = 0</code>, niente da prendere. <code>P(pieni)</code> lo sospende finché un produttore non inserisce qualcosa."; return; }
      items--; pulse(consFace, consState, "ha consumato", false); render();
      log.innerHTML = "🛒 Consumato un oggetto: <code>P(pieni)</code> (−1 da consumare), prelievo in mutua esclusione, <code>V(vuoti)</code> (+1 posto libero).";
    }
    $("pcProduce").addEventListener("click", produce);
    $("pcConsume").addEventListener("click", consume);
    $("pcAuto").addEventListener("click", function () {
      if (auto) { clearInterval(auto); auto = null; this.textContent = "▶ Auto"; return; }
      this.textContent = "⏸ Pausa";
      auto = setInterval(function () { (Math.random() < 0.55 ? produce : consume)(); }, 900);
    });
    $("pcReset").addEventListener("click", function () {
      if (auto) { clearInterval(auto); auto = null; $("pcAuto").textContent = "▶ Auto"; }
      items = 0; render(); prodState.textContent = "pronto"; consState.textContent = "pronto";
      prodState.classList.remove("blocked"); consState.classList.remove("blocked");
      log.textContent = "Premi Produci finché il buffer si riempie: al sesto tentativo il produttore si blocca.";
    });
    render();
  })();

  /* ========================================================
     8 · LETTORI-SCRITTORI
     ======================================================== */
  (function lettori() {
    var resEl = $("rwResource"), stateEl = $("rwResState"), insideEl = $("rwInside"),
      qEl = $("rwQueue"), log = $("rwLog");
    if (!resEl) return;
    var readers = 0, writer = false, queue = [];
    function render() {
      resEl.classList.toggle("reading", readers > 0);
      resEl.classList.toggle("writing", writer);
      stateEl.textContent = writer ? "1 scrittore sta scrivendo" : readers > 0 ? (readers + (readers === 1 ? " lettore sta leggendo" : " lettori stanno leggendo")) : "libera";
      var chips = "";
      if (writer) chips = '<span class="rw-chip writer">✍ scrittore</span>';
      else for (var i = 0; i < readers; i++) chips += '<span class="rw-chip reader">📖</span>';
      insideEl.innerHTML = chips || '<span class="sem-empty">— vuota —</span>';
      qEl.innerHTML = queue.length ? queue.map(function (t) { return '<span class="rw-chip ' + t + ' wait">' + (t === "reader" ? "📖" : "✍") + "</span>"; }).join("") : '<span class="sem-empty">— nessuno —</span>';
    }
    function admit() {
      if (!writer && readers === 0) {
        if (queue.length && queue[0] === "writer") { writer = true; queue.shift(); }
        else while (queue.length && queue[0] === "reader") { readers++; queue.shift(); }
      } else if (readers > 0 && !writer) {
        while (queue.length && queue[0] === "reader") { readers++; queue.shift(); }
      }
    }
    $("rwAddR").addEventListener("click", function () {
      if (writer) { queue.push("reader"); log.innerHTML = "📖 Un lettore arriva ma c'è uno scrittore dentro: <strong>aspetta</strong> in coda."; }
      else { readers++; log.innerHTML = "📖 Un lettore <strong>entra</strong>. I lettori possono stare <strong>in molti insieme</strong>: leggono soltanto."; }
      render();
    });
    $("rwAddW").addEventListener("click", function () {
      if (writer || readers > 0) { queue.push("writer"); log.innerHTML = "✍ Uno scrittore arriva ma la stanza è occupata: <strong>aspetta</strong>. Lo scrittore vuole accesso <strong>esclusivo</strong>."; }
      else { writer = true; log.innerHTML = "✍ Uno scrittore <strong>entra da solo</strong>: nessun altro potrà leggere o scrivere finché non esce."; }
      render();
    });
    $("rwLeave").addEventListener("click", function () {
      if (writer) { writer = false; log.innerHTML = "✍ Lo scrittore <strong>esce</strong>. Ora possono entrare gli altri in attesa."; }
      else if (readers > 0) { readers--; log.innerHTML = readers > 0 ? "📖 Un lettore esce (ne restano " + readers + ")." : "📖 L'ultimo lettore esce: la risorsa si libera."; }
      else { log.textContent = "Non c'è nessuno dentro."; return; }
      admit(); render();
    });
    $("rwReset").addEventListener("click", function () {
      readers = 0; writer = false; queue = []; render();
      log.textContent = "Fai entrare 2–3 lettori insieme: convivono. Poi aggiungi uno scrittore: aspetta che la stanza si svuoti.";
    });
    render();
  })();

  /* ========================================================
     9 · FILOSOFI A CENA
     ======================================================== */
  (function filosofi() {
    var svg = $("phSvg"), statusEl = $("phStatus"), explain = $("phExplain");
    if (!svg) return;
    var SVGNS = "http://www.w3.org/2000/svg", NP = 5;
    var phil, forkOwner, strategy, timer = null, meals;
    // forchetta i è tra filosofo i e filosofo (i+1)%5
    // filosofo i: sinistra = fork[i], destra = fork[(i-1+5)%5]
    function L(i) { return i; }
    function R(i) { return (i - 1 + NP) % NP; }
    function order(i) { // ordine di presa delle forchette
      if (strategy === "asym" && i === NP - 1) return [R(i), L(i)]; // l'ultimo prende prima la destra
      return [L(i), R(i)];
    }
    function reset0(strat) {
      strategy = strat || "naive"; meals = 0;
      phil = []; for (var i = 0; i < NP; i++) phil.push({ st: "think", has: [] });
      forkOwner = []; for (var f = 0; f < NP; f++) forkOwner.push(null);
      stop(); draw();
      statusEl.innerHTML = "";
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function allLeft() {
      for (var i = 0; i < NP; i++) { phil[i].st = "hungry"; phil[i].has = []; forkOwner[i] = null; }
      for (i = 0; i < NP; i++) { var f = L(i); forkOwner[f] = i; phil[i].has = [f]; } // tutti prendono la sinistra
      draw(); detectDeadlock();
    }
    function detectDeadlock() {
      // ognuno tiene 1 forchetta e la successiva che gli serve è occupata
      var stuck = phil.every(function (p, i) {
        if (p.st === "eat" || p.st === "think") return false;
        var need = order(i).filter(function (f) { return p.has.indexOf(f) < 0; });
        return p.has.length >= 1 && need.length > 0 && need.every(function (f) { return forkOwner[f] !== null; });
      });
      if (stuck) {
        statusEl.innerHTML = '<span class="dl">⚠ DEADLOCK</span><br>Ogni filosofo tiene la forchetta sinistra e aspetta la destra, tenuta dal vicino. Attesa circolare: nessuno mangerà più.';
      }
      return stuck;
    }
    function tick() {
      // libera chi ha mangiato
      var progressed = false;
      for (var i = 0; i < NP; i++) {
        var p = phil[i];
        if (p.st === "eat") { // rilascia e torna a pensare
          p.has.forEach(function (f) { forkOwner[f] = null; }); p.has = []; p.st = "think"; progressed = true;
        }
      }
      // pensanti diventano affamati
      for (i = 0; i < NP; i++) if (phil[i].st === "think" && Math.random() < 0.9) phil[i].st = "hungry";
      // affamati provano a prendere forchette nell'ordine
      for (i = 0; i < NP; i++) {
        p = phil[i]; if (p.st !== "hungry") continue;
        var ord = order(i);
        for (var k = 0; k < ord.length; k++) {
          var f = ord[k];
          if (p.has.indexOf(f) >= 0) continue;
          if (forkOwner[f] === null) { forkOwner[f] = i; p.has.push(f); progressed = true; }
          break; // prova una forchetta per volta per tick (così si vede l'attesa)
        }
        if (p.has.length === 2) { p.st = "eat"; meals++; }
      }
      draw();
      if (strategy === "naive" && detectDeadlock()) { stop(); return; }
      if (strategy === "asym") statusEl.innerHTML = '<span class="ok">Nessuno stallo</span> · pasti serviti: <b>' + meals + "</b><br>Un filosofo prende prima la forchetta destra: la catena di attese si spezza e tutti riescono a mangiare a turno.";
    }
    function draw() {
      var cx = 180, cy = 180, Rt = 70, Rp = 135, Rf = 102;
      var h = "";
      h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Rt + '" fill="var(--bg-elev)" stroke="var(--line)" stroke-width="2"/>';
      h += '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central" font-size="11" font-family="var(--font-mono)" fill="var(--ink-faint)">tavolo</text>';
      // forchette (tra i e i+1): angolo medio
      for (var f = 0; f < NP; f++) {
        var a = (-90 + (f + 0.5) * 360 / NP) * Math.PI / 180;
        var fx = cx + Rf * Math.cos(a), fy = cy + Rf * Math.sin(a);
        var taken = forkOwner[f] !== null;
        h += '<g transform="translate(' + fx.toFixed(1) + ',' + fy.toFixed(1) + ') rotate(' + (f * 72 + 36) + ')">';
        h += '<rect x="-2.5" y="-11" width="5" height="22" rx="2" fill="' + (taken ? "var(--accent)" : "var(--line)") + '" stroke="var(--bg-sunk)"/></g>';
      }
      // filosofi
      var COL = { think: ["var(--bg-elev)", "var(--line)"], hungry: ["var(--accent-wash)", "var(--accent)"], eat: ["#2e9e5b", "#2e9e5b"] };
      for (var i = 0; i < NP; i++) {
        var ang = (-90 + i * 360 / NP) * Math.PI / 180;
        var px = cx + Rp * Math.cos(ang), py = cy + Rp * Math.sin(ang);
        var p = phil[i], c = COL[p.st] || COL.think;
        var label = p.st === "eat" ? "🍝" : p.st === "hungry" ? (p.has.length ? "✋" : "…") : "💭";
        h += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="24" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="2"/>';
        h += '<text x="' + px.toFixed(1) + '" y="' + (py - 3).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="15">' + label + "</text>";
        h += '<text x="' + px.toFixed(1) + '" y="' + (py + 11).toFixed(1) + '" text-anchor="middle" font-size="9" font-family="var(--font-mono)" fill="' + (p.st === "eat" ? "#fff" : "var(--ink-soft)") + '">F' + (i + 1) + "</text>";
      }
      svg.innerHTML = h;
    }
    $("phDeadlock").addEventListener("click", function () { reset0("naive"); explain.innerHTML = "Tutti affamati nello stesso istante prendono la forchetta <strong>sinistra</strong>. Guarda lo stallo."; allLeft(); });
    $("phSolve").addEventListener("click", function () {
      reset0("asym"); explain.innerHTML = "<strong>Soluzione asimmetrica</strong>: l'ultimo filosofo prende prima la forchetta <em>destra</em>. Nessun deadlock — lascia girare.";
      stop(); timer = setInterval(tick, 1100);
    });
    $("phStep").addEventListener("click", function () { if (strategy === "naive" && phil.some(function (p) { return p.has.length === 1; })) { detectDeadlock(); return; } tick(); });
    $("phReset").addEventListener("click", function () { reset0("naive"); explain.innerHTML = "Premi «tutti sinistra» per lo stallo, o «soluzione asimmetrica» per vederli mangiare a turno."; });
    reset0("naive");
  })();

  /* ========================================================
     10a · GRAFO DI HOLT
     ======================================================== */
  (function holt() {
    var svg = $("holtSvg"), presetsEl = $("holtPresets"), explain = $("holtExplain");
    if (!svg) return;
    var SVGNS = "http://www.w3.org/2000/svg";
    var PRESETS = [
      {
        name: "Riducibile", procs: ["P1", "P2", "P3"],
        res: [{ id: "R1", n: 1 }, { id: "R2", n: 1 }, { id: "R3", n: 1 }],
        alloc: [["R1", "P1"], ["R2", "P2"], ["R3", "P2"]],
        req: [["P3", "R1"], ["P1", "R2"]]
      },
      {
        name: "Stallo (ciclo)", procs: ["P1", "P2", "P3"],
        res: [{ id: "R1", n: 1 }, { id: "R2", n: 1 }, { id: "R3", n: 1 }],
        alloc: [["R1", "P1"], ["R2", "P2"], ["R3", "P3"]],
        req: [["P1", "R2"], ["P2", "R3"], ["P3", "R1"]]
      },
      {
        name: "Molteplicità > 1", procs: ["P1", "P2", "P3"],
        res: [{ id: "R1", n: 2 }, { id: "R2", n: 1 }, { id: "R3", n: 3 }],
        alloc: [["R1", "P1"], ["R1", "P2"], ["R2", "P2"], ["R3", "P3"], ["R3", "P1"]],
        req: [["P3", "R1"], ["P1", "R2"]]
      },
      {
        name: "Ciclo senza stallo", procs: ["P1", "P2", "P3"],
        res: [{ id: "R1", n: 2 }, { id: "R2", n: 1 }],
        alloc: [["R1", "P1"], ["R1", "P2"], ["R2", "P3"]],
        req: [["P1", "R2"], ["P3", "R1"]]
      }
    ];
    var cur, total, allocC, reqC, done, pos;
    function load(idx) {
      presetsEl.querySelectorAll(".holt-preset").forEach(function (b, i) { b.classList.toggle("active", i === idx); });
      cur = PRESETS[idx];
      total = {}; cur.res.forEach(function (r) { total[r.id] = r.n; });
      allocC = {}; reqC = {}; done = {};
      cur.procs.forEach(function (p) { reqC[p] = {}; cur.res.forEach(function (r) { reqC[p][r.id] = 0; }); });
      cur.res.forEach(function (r) { allocC[r.id] = {}; cur.procs.forEach(function (p) { allocC[r.id][p] = 0; }); });
      cur.alloc.forEach(function (e) { allocC[e[0]][e[1]]++; });
      cur.req.forEach(function (e) { reqC[e[0]][e[1]]++; });
      layout(); render();
      explain.className = "holt-explain";
      explain.innerHTML = "Scenario <strong>" + cur.name + "</strong> caricato. Gli archi <span style='color:#2e9e5b'>verdi</span> sono assegnazioni (risorsa→processo), quelli <span style='color:#d9772b'>arancioni tratteggiati</span> richieste (processo→risorsa). Premi <strong>Riduci di un passo</strong>.";
    }
    function layout() {
      pos = {};
      var py = 300 / (cur.procs.length + 1);
      cur.procs.forEach(function (p, i) { pos[p] = { x: 140, y: py * (i + 1), t: "p" }; });
      var ry = 300 / (cur.res.length + 1);
      cur.res.forEach(function (r, i) { pos[r.id] = { x: 380, y: ry * (i + 1), t: "r" }; });
    }
    function avail(res) {
      var a = total[res]; cur.procs.forEach(function (p) { a -= allocC[res][p]; }); return a;
    }
    function reducible(p) {
      if (done[p]) return false;
      return cur.res.every(function (r) { return reqC[p][r.id] <= avail(r.id); });
    }
    function edge(from, to, cls) {
      var a = pos[from], b = pos[to];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / len, uy = dy / len;
      var r1 = a.t === "p" ? 22 : 30, r2 = b.t === "p" ? 24 : 32;
      var x1 = a.x + ux * r1, y1 = a.y + uy * r1, x2 = b.x - ux * r2, y2 = b.y - uy * r2;
      return '<line class="holt-edge ' + cls + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" marker-end="url(#harr-' + cls + ')"/>';
    }
    function render(stuck) {
      var h = "";
      h += '<defs>';
      ["assign", "request", "cycle"].forEach(function (c) {
        var col = c === "assign" ? "#2e9e5b" : c === "cycle" ? "#c0392b" : "#d9772b";
        h += '<marker id="harr-' + c + '" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0 0L7 3L0 6z" fill="' + col + '"/></marker>';
      });
      h += "</defs>";
      // archi
      cur.procs.forEach(function (p) {
        cur.res.forEach(function (r) {
          if (reqC[p][r.id] > 0) h += edge(p, r.id, stuck ? "cycle" : "request");
          if (allocC[r.id][p] > 0) h += edge(r.id, p, done[p] ? "assign done" : "assign");
        });
      });
      // risorse
      cur.res.forEach(function (r) {
        var P = pos[r.id], used = total[r.id] - avail(r.id);
        h += '<g class="holt-res' + (done[r.id] ? "" : "") + '">';
        h += '<rect x="' + (P.x - 30) + '" y="' + (P.y - 20) + '" width="60" height="40" rx="6"/>';
        for (var k = 0; k < total[r.id]; k++) {
          var dotx = P.x - 30 + 14 + k * 16, doty = P.y - 7;
          if (total[r.id] > 3) { dotx = P.x - 30 + 10 + (k % 3) * 18; doty = P.y - 10 + Math.floor(k / 3) * 16; }
          h += '<circle class="holt-dot ' + (k < used ? "" : "free") + '" cx="' + dotx + '" cy="' + doty + '" r="4"/>';
        }
        h += '<text x="' + P.x + '" y="' + (P.y + 14) + '" text-anchor="middle">' + r.id + "</text></g>";
      });
      // processi
      cur.procs.forEach(function (p) {
        var P = pos[p];
        var cls = "holt-proc" + (done[p] ? " done" : reducible(p) ? " ready" : "");
        h += '<g class="' + cls + '"><circle cx="' + P.x + '" cy="' + P.y + '" r="22"/>';
        h += '<text x="' + P.x + '" y="' + P.y + '" text-anchor="middle" dominant-baseline="central">' + p + "</text></g>";
      });
      svg.innerHTML = h;
    }
    function step() {
      var p = cur.procs.find(reducible);
      if (p) {
        // termina p: libera le sue risorse, azzera richieste
        cur.res.forEach(function (r) { allocC[r.id][p] = 0; reqC[p][r.id] = 0; });
        done[p] = true; render();
        var remaining = cur.procs.filter(function (x) { return !done[x]; });
        explain.className = "holt-explain ok";
        if (!remaining.length) explain.innerHTML = "✓ <strong>Grafo completamente riducibile</strong>: tutti i processi hanno potuto terminare. <strong>Nessuno stallo</strong>.";
        else explain.innerHTML = "<strong>" + p + "</strong> aveva solo richieste soddisfatte (o nessuna): <strong>termina</strong> e libera le sue risorse. Continua a ridurre.";
      } else {
        var remaining = cur.procs.filter(function (x) { return !done[x]; });
        if (!remaining.length) { explain.className = "holt-explain ok"; explain.innerHTML = "✓ Tutti i processi sono già terminati: nessuno stallo."; return; }
        render(true);
        explain.className = "holt-explain dl";
        explain.innerHTML = "⚠ <strong>Nessun processo riducibile</strong>: " + remaining.join(", ") + " restano bloccati in <strong>attesa circolare</strong>. Il grafo <strong>non è completamente riducibile</strong> → <strong>deadlock</strong>.";
      }
    }
    presetsEl.innerHTML = PRESETS.map(function (p, i) { return '<button class="holt-preset" type="button">' + p.name + "</button>"; }).join("");
    presetsEl.querySelectorAll(".holt-preset").forEach(function (b, i) { b.addEventListener("click", function () { load(i); }); });
    $("holtStep").addEventListener("click", step);
    $("holtAuto").addEventListener("click", function () { var n = 0; (function go() { var before = Object.keys(done).length; step(); n++; if (cur.procs.find(reducible) && n < 20) setTimeout(go, 700); })(); });
    $("holtReset").addEventListener("click", function () { var idx = 0; presetsEl.querySelectorAll(".holt-preset").forEach(function (b, i) { if (b.classList.contains("active")) idx = i; }); load(idx); });
    load(0);
  })();

  /* ========================================================
     10b · ALGORITMO DEL BANCHIERE
     ======================================================== */
  (function banchiere() {
    var body = $("bankBody"), availEl = $("bankAvail"), verdict = $("bankVerdict");
    if (!body) return;
    var TOTAL = 10;
    var P0 = [{ id: "P1", has: 3, max: 7 }, { id: "P2", has: 2, max: 5 }, { id: "P3", has: 2, max: 9 }];
    var procs, done;
    function reset0() { procs = P0.map(function (p) { return { id: p.id, has: p.has, max: p.max }; }); done = {}; render(); verdict.className = "bank-verdict"; verdict.innerHTML = "Prova a concedere una richiesta: il banchiere la accetta solo se lo stato resta <b>sicuro</b>."; }
    function avail() { var a = TOTAL; procs.forEach(function (p) { if (!done[p.id]) a -= p.has; }); return a; }
    function safe(state, av) {
      var work = av, fin = {}, changed = true, remaining = state.filter(function (p) { return !done[p.id]; });
      while (changed) {
        changed = false;
        remaining.forEach(function (p) {
          if (!fin[p.id] && (p.max - p.has) <= work) { work += p.has; fin[p.id] = true; changed = true; }
        });
      }
      return remaining.every(function (p) { return fin[p.id]; });
    }
    function order(av) {
      var work = av, seq = [], fin = {}, remaining = procs.filter(function (p) { return !done[p.id]; }), changed = true;
      while (changed) { changed = false; remaining.forEach(function (p) { if (!fin[p.id] && (p.max - p.has) <= work) { work += p.has; fin[p.id] = true; seq.push(p.id); changed = true; } }); }
      return seq;
    }
    function render() {
      availEl.textContent = avail();
      body.innerHTML = procs.map(function (p) {
        var need = p.max - p.has, d = done[p.id];
        var btn = '<button class="bank-give" data-p="' + p.id + '"' + ((d || need === 0 || avail() === 0) ? " disabled" : "") + '>+1</button>';
        return '<tr class="' + (d ? "done" : "") + '"><td>' + p.id + "</td><td>" + p.has + "</td><td>" + p.max + "</td><td>" + (d ? "✓ finito" : need) + "</td><td>" + (d ? "—" : btn) + "</td></tr>";
      }).join("");
      body.querySelectorAll(".bank-give").forEach(function (b) { b.addEventListener("click", function () { give(b.dataset.p); }); });
    }
    function give(id) {
      var p = procs.find(function (x) { return x.id === id; });
      if (!p || done[id] || p.has >= p.max || avail() <= 0) return;
      // stato tentativo
      var trial = procs.map(function (x) { return { id: x.id, has: x.has + (x.id === id ? 1 : 0), max: x.max }; });
      var trialAvail = avail() - 1;
      if (safe(trial, trialAvail)) {
        p.has++;
        if (p.has === p.max) { // ha ottenuto tutto: finisce e rilascia
          done[id] = true;
          verdict.className = "bank-verdict safe";
          verdict.innerHTML = "✓ Concessa. <b>" + id + "</b> ha raggiunto il massimo, <b>termina</b> e restituisce le sue risorse. Sequenza sicura: <b>" + (order(avail()).join(" → ") || "—") + "</b>.";
        } else {
          verdict.className = "bank-verdict safe";
          verdict.innerHTML = "✓ Concessa 1 unità a <b>" + id + "</b>: lo stato resta <b>sicuro</b>. Esiste l'ordine di completamento <b>" + order(avail()).join(" → ") + "</b>.";
        }
      } else {
        verdict.className = "bank-verdict unsafe";
        verdict.innerHTML = "✗ <b>Negata</b>. Concederla porterebbe a uno stato <b>non sicuro</b>: nessun ordine garantirebbe a tutti di finire → rischio di <b>deadlock</b>. Il banchiere fa aspettare <b>" + id + "</b>.";
      }
      render();
    }
    $("bankReset").addEventListener("click", reset0);
    reset0();
  })();

})();
