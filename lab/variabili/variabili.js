/* ============================================================
   variabili.js — Capire le variabili (introduttivo)
   Un modulo indipendente per sezione. Nessuna dipendenza esterna.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var yEl = $("year"); if (yEl && !yEl.textContent) yEl.textContent = new Date().getFullYear();
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // Riconoscimento del tipo da un valore scritto
  function detectType(raw) {
    var v = raw.trim();
    if (v === "true" || v === "false") return { key: "bool", label: "booleano", cls: "t-bool", disp: v };
    if (/^-?\d+$/.test(v)) return { key: "int", label: "intero", cls: "t-int", disp: v };
    if (/^-?\d+[.,]\d+$/.test(v)) return { key: "real", label: "reale", cls: "t-real", disp: v };
    if (/^".*"$/.test(v)) return { key: "str", label: "testo (stringa)", cls: "t-str", disp: v };
    return { key: "str", label: "testo (stringa)", cls: "t-str", disp: '"' + v + '"' };
  }
  function boxHtml(name, dispVal, typeLabel, cls) {
    return '<div class="va-box"><span class="va-box-label">' + esc(name) + '</span>' +
      '<span class="va-box-val ' + cls + '">' + esc(dispVal) + '</span>' +
      '<span class="va-box-type">' + typeLabel + '</span></div>';
  }

  /* ========================================================
     1 · BOX CREATOR
     ======================================================== */
  (function creator() {
    var nameEl = $("vcName"), valEl = $("vcVal"), stage = $("vcStage"), note = $("vcNote"), btn = $("vcCreate");
    if (!stage) return;
    function create() {
      var name = nameEl.value.trim(), raw = valEl.value;
      if (!name) { note.innerHTML = "Scrivi prima un <strong>nome</strong> per la scatola."; return; }
      if (raw.trim() === "") { note.innerHTML = "Scrivi un <strong>valore</strong> da mettere nella scatola."; return; }
      var t = detectType(raw);
      stage.insertAdjacentHTML("beforeend", boxHtml(name, t.disp, "(" + t.label + ")", t.cls));
      while (stage.children.length > 6) stage.removeChild(stage.firstChild);
      note.innerHTML = "Creata la scatola <strong>" + esc(name) + "</strong> col valore <strong>" + esc(t.disp) +
        "</strong>. Il programma ha riconosciuto il tipo <strong>" + t.label + "</strong> dal valore.";
    }
    btn.addEventListener("click", create);
    valEl.addEventListener("keydown", function (e) { if (e.key === "Enter") create(); });
    nameEl.addEventListener("keydown", function (e) { if (e.key === "Enter") create(); });
    document.querySelectorAll(".vc-presets .va-chip").forEach(function (c) {
      c.addEventListener("click", function () { nameEl.value = c.dataset.n; valEl.value = c.dataset.v; create(); });
    });
    create();
  })();

  /* ========================================================
     2a · PERCHÉ (scheda Persona: dichiara poi riempi)
     ======================================================== */
  (function persona() {
    var card = $("peCard"); if (!card) return;
    var note = $("peNote"), stepEl = $("peStep");
    var fields = {}; card.querySelectorAll(".pe-fval").forEach(function (f) { fields[f.dataset.f] = f; });
    var DATA = [
      { step: "① Dichiarazione", vals: { nome: "", cognome: "", eta: "" },
        note: "Ho <strong>dichiarato</strong> i campi: le scatole <code>nome</code>, <code>cognome</code>, <code>eta</code> esistono ma sono ancora <strong>vuote</strong>. C'è lo schema, non ancora i dati." },
      { step: "② Assegnazione · Persona 1", vals: { nome: '"Anna"', cognome: '"Rossi"', eta: "15" },
        note: "Ho <strong>riempito</strong> gli stessi campi con i dati di Anna. La variabile «varia»: stessa scatola, un valore dentro." },
      { step: "② Assegnazione · Persona 2", vals: { nome: '"Luca"', cognome: '"Bianchi"', eta: "17" },
        note: "Stessi identici campi, <strong>persona diversa</strong>: cambio solo i valori, non lo schema. Ecco perché un programma risolve un <strong>tipo</strong> di problema, non un caso singolo." }
    ];
    function show(i) {
      var d = DATA[i]; stepEl.textContent = d.step;
      Object.keys(fields).forEach(function (k) { fields[k].textContent = d.vals[k]; });
      note.innerHTML = d.note;
      card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
      document.querySelectorAll(".pe-controls button").forEach(function (b) { b.classList.toggle("on", +b.dataset.p === i); });
    }
    document.querySelectorAll(".pe-controls button").forEach(function (b) { b.addEventListener("click", function () { show(+b.dataset.p); }); });
    show(0);
  })();

  /* ========================================================
     2b · PERCHÉ (spesa)
     ======================================================== */
  (function spesa() {
    var wrap = $("spInputs"); if (!wrap) return;
    var subEl = $("spSub"), totEl = $("spTotal"), fixedEl = $("spFixed"), fixedNote = $("spFixedNote");
    var inputs = {}; wrap.querySelectorAll("input[data-k]").forEach(function (i) { inputs[i.dataset.k] = i; });
    function num(k) { var v = parseFloat(inputs[k].value.replace(",", ".")); return isNaN(v) ? 0 : v; }
    function fmt(n) { return (Math.round(n * 100) / 100).toString().replace(".", ","); }
    var init = {}; Object.keys(inputs).forEach(function (k) { init[k] = num(k); });
    function fixedStr(src) {
      return "totale = (" + fmt(src.nm) + " × " + fmt(src.pm) + ") + (" + fmt(src.pp) + " × " + fmt(src.pp2) +
        ") + (" + fmt(src.ll) + " × " + fmt(src.pl) + ") = " + fmt(src.nm * src.pm + src.pp * src.pp2 + src.ll * src.pl);
    }
    fixedEl.textContent = fixedStr(init);
    function render() {
      var nm = num("nm"), pm = num("pm"), pp = num("pp"), pp2 = num("pp2"), ll = num("ll"), pl = num("pl");
      var tot = nm * pm + pp * pp2 + ll * pl;
      subEl.textContent = "= (" + fmt(nm) + " × " + fmt(pm) + ") + (" + fmt(pp) + " × " + fmt(pp2) + ") + (" + fmt(ll) + " × " + fmt(pl) + ")";
      totEl.textContent = fmt(tot);
      var changed = Object.keys(inputs).some(function (k) { return num(k) !== init[k]; });
      fixedEl.classList.toggle("stale", changed);
      fixedNote.innerHTML = changed
        ? "Hai cambiato un dato: questa formula coi numeri fissi è diventata <strong>sbagliata</strong> e andrebbe riscritta. La versione con le variabili, invece, è già giusta."
        : "Questa versione «funziona» una volta sola: appena cambi la spesa, va <strong>riscritta a mano</strong>. E le combinazioni possibili sono infinite.";
    }
    wrap.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", render); });
    render();
  })();

  /* ========================================================
     3 · REGOLE PER I NOMI
     ======================================================== */
  (function nomi() {
    var inp = $("nmInput"), out = $("nmVerdict"); if (!inp) return;
    function check(name) {
      if (!name) return { ok: false, msg: "Scrivi un nome." };
      if (/[^\x00-\x7F]/.test(name)) return { ok: false, msg: "contiene una lettera accentata o un simbolo non ammesso (es. à, è)" };
      if (/^[0-9]/.test(name)) return { ok: false, msg: "non può iniziare con una cifra" };
      if (/[^A-Za-z0-9_]/.test(name)) return { ok: false, msg: "contiene un carattere non ammesso (spazi, trattini o simboli)" };
      if (/^[A-Z]/.test(name)) {
        if (/^[A-Z][A-Z0-9_]*$/.test(name)) return { ok: true, msg: "valido — tutto maiuscolo: è il modo giusto di scrivere una COSTANTE" };
        return { ok: false, msg: "i nomi iniziano con la minuscola; le MAIUSCOLE si riservano alle costanti (es. PI_GRECO)" };
      }
      if (/_/.test(name) && /[A-Z]/.test(name)) return { ok: false, msg: "non mescolare gli stili: o minuscole_con_underscore (numero_studenti) o camelCase (numeroStudenti), non tutti e due" };
      return { ok: true, msg: "valido" };
    }
    function render() {
      var r = check(inp.value.trim());
      out.className = "nm-verdict " + (r.ok ? "ok" : "no");
      out.innerHTML = (r.ok ? "✓ " : "✗ ") + "<b>" + esc(inp.value.trim() || "—") + "</b> <span class='vsmall'>" + r.msg + "</span>";
    }
    inp.addEventListener("input", render);
    document.querySelectorAll(".nm-chips .va-chip").forEach(function (c) {
      c.addEventListener("click", function () { inp.value = c.textContent; render(); });
    });
    render();
  })();

  /* ========================================================
     4 · IL TIPO DECIDE COSA ENTRA
     ======================================================== */
  (function boxType() {
    var seg = $("btSeg"), valEl = $("btVal"), typeEl = $("btType"), box = valEl ? valEl.closest(".va-box") : null, msg = $("btMsg");
    if (!seg) return;
    var LABELS = { int: "Intero", real: "Reale", str: "Stringa", bool: "Booleano" };
    var type = "int";
    function valueKind(v) {
      if (/^".*"$/.test(v)) return "str";
      if (v === "true" || v === "false") return "bool";
      if (/^-?\d+$/.test(v)) return "int";
      if (/^-?\d+[.,]\d+$/.test(v)) return "real";
      return "str";
    }
    var KINDLABEL = { int: "un numero intero", real: "un numero decimale (reale)", str: "del testo (stringa)", bool: "un valore vero/falso (booleano)" };
    function accepts(t, k) { return t === "real" ? (k === "int" || k === "real") : t === k; }
    function tryVal(v) {
      var k = valueKind(v), ok = accepts(type, k);
      valEl.textContent = v; valEl.className = "va-box-val " + (ok ? "ok" : "no");
      if (!ok) { box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake"); }
      msg.className = "bt-msg " + (ok ? "ok" : "no");
      msg.innerHTML = ok
        ? "✓ <strong>" + esc(v) + "</strong> è compatibile col tipo <strong>" + LABELS[type] + "</strong>: <strong>accettato</strong>."
        : "✗ <strong>" + esc(v) + "</strong> è " + KINDLABEL[k] + ", ma la scatola è di tipo <strong>" + LABELS[type] + "</strong>: <strong>rifiutato</strong>.";
    }
    seg.querySelectorAll(".bt-seg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        seg.querySelectorAll(".bt-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); type = b.dataset.t;
        typeEl.textContent = "(" + LABELS[type] + ")"; valEl.textContent = "—"; valEl.className = "va-box-val";
        msg.className = "bt-msg"; msg.innerHTML = "Scatola di tipo <strong>" + LABELS[type] + "</strong>. Prova a inserire un valore qui sotto.";
      });
    });
    document.querySelectorAll(".bt-chips .va-chip").forEach(function (c) {
      c.addEventListener("click", function () { tryVal(c.dataset.v); });
    });
  })();

  /* ========================================================
     5a · DICHIARAZIONE / INIZIALIZZAZIONE / ASSEGNAZIONE
     ======================================================== */
  (function diia() {
    var box = $("diBox"), valEl = $("diVal"), oldEl = $("diOld"); if (!box) return;
    var STATES = [
      { val: "", old: "" },
      { val: '"Giacomo"', old: "" },
      { val: '"Patrick"', old: '"Giacomo"' }
    ];
    function show(i) {
      valEl.textContent = STATES[i].val; oldEl.textContent = STATES[i].old;
      box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
    }
    document.querySelectorAll(".di-step").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".di-step").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); show(+b.dataset.s);
      });
    });
    show(0);
  })();

  /* ========================================================
     5b · TRACCIATORE DI ASSEGNAZIONE
     ======================================================== */
  (function tracer() {
    var selEl = $("vrProgSel"), progEl = $("vrProg"), varsEl = $("vrVars"), explain = $("vrExplain"),
      stepBtn = $("vrStep"), resetBtn = $("vrReset");
    if (!progEl) return;
    var PROGRAMS = [
      {
        name: "Età e saluto",
        lines: ['eta = 14', 'eta = eta + 1', 'nome = "Anna"', 'saluto = "Ciao " + nome'],
        steps: [
          { v: "eta", val: "14", type: "intero", cls: "t-int", note: "Metto <strong>14</strong> nella scatola <code>eta</code>: nasce la variabile." },
          { v: "eta", val: "15", type: "intero", cls: "t-int", note: "Leggo il valore attuale di <code>eta</code> (14), aggiungo 1 e <strong>rimetto 15</strong> dentro eta. Il vecchio 14 è perso." },
          { v: "nome", val: '"Anna"', type: "testo", cls: "t-str", note: "Creo la variabile <code>nome</code> col testo <strong>\"Anna\"</strong>." },
          { v: "saluto", val: '"Ciao Anna"', type: "testo", cls: "t-str", note: "Con il testo <code>+</code> <strong>unisce</strong>: \"Ciao \" + \"Anna\" = <strong>\"Ciao Anna\"</strong>." }
        ]
      },
      {
        name: "Il conto in classe",
        lines: ['presenti = 0', 'presenti = presenti + 1', 'presenti = presenti + 1', 'assenti = 3', 'totale = presenti + assenti'],
        steps: [
          { v: "presenti", val: "0", type: "intero", cls: "t-int", note: "Parto da <strong>0</strong>: ancora nessun presente." },
          { v: "presenti", val: "1", type: "intero", cls: "t-int", note: "<code>presenti + 1</code> = 0 + 1 = <strong>1</strong>, rimesso in presenti." },
          { v: "presenti", val: "2", type: "intero", cls: "t-int", note: "Di nuovo <code>+1</code>: 1 + 1 = <strong>2</strong>. Così un programma conta." },
          { v: "assenti", val: "3", type: "intero", cls: "t-int", note: "Creo <code>assenti</code> e ci metto <strong>3</strong>." },
          { v: "totale", val: "5", type: "intero", cls: "t-int", note: "<code>presenti + assenti</code> = 2 + 3 = <strong>5</strong>." }
        ]
      },
      {
        name: "Tipi diversi",
        lines: ['prezzo = 2.5', 'promosso = true', 'promosso = false'],
        steps: [
          { v: "prezzo", val: "2,5", type: "reale", cls: "t-real", note: "Un numero con la virgola → tipo <strong>reale</strong>." },
          { v: "promosso", val: "true", type: "booleano", cls: "t-bool", note: "Solo vero/falso → tipo <strong>booleano</strong>. Per ora è <strong>true</strong>." },
          { v: "promosso", val: "false", type: "booleano", cls: "t-bool", note: "Una variabile tiene <strong>un valore per volta</strong>: <strong>false</strong> sostituisce true." }
        ]
      }
    ];
    var cur = 0, pc = 0, vars = {}, order = [];
    function loadProg(i) {
      cur = i; pc = 0; vars = {}; order = [];
      selEl.querySelectorAll(".vr-prog-btn").forEach(function (b, k) { b.classList.toggle("active", k === i); });
      progEl.innerHTML = PROGRAMS[i].lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("");
      renderVars(); mark();
      explain.innerHTML = "Premi <strong>Esegui la riga</strong> per eseguire la prima istruzione.";
      stepBtn.disabled = false;
    }
    function mark() {
      progEl.querySelectorAll("li").forEach(function (li, k) {
        li.classList.toggle("done", k < pc); li.classList.toggle("next", k === pc);
      });
    }
    function renderVars(flashVar) {
      if (!order.length) { varsEl.innerHTML = '<span class="vr-empty">— ancora nessuna variabile —</span>'; return; }
      varsEl.innerHTML = order.map(function (n) {
        var d = vars[n];
        return '<div class="va-box' + (n === flashVar ? " flash" : "") + '"><span class="va-box-label">' + n + '</span>' +
          '<span class="va-box-val ' + d.cls + '">' + esc(d.val) + '</span><span class="va-box-type">(' + d.type + ')</span></div>';
      }).join("");
    }
    function step() {
      var P = PROGRAMS[cur]; if (pc >= P.steps.length) return;
      var s = P.steps[pc];
      if (order.indexOf(s.v) < 0) order.push(s.v);
      vars[s.v] = { val: s.val, type: s.type, cls: s.cls };
      pc++; mark(); renderVars(s.v); explain.innerHTML = s.note;
      if (pc >= P.steps.length) { explain.innerHTML += "<br><strong>Fine del programma.</strong>"; stepBtn.disabled = true; }
    }
    selEl.innerHTML = PROGRAMS.map(function (p, i) { return '<button class="vr-prog-btn" type="button">' + p.name + "</button>"; }).join("");
    selEl.querySelectorAll(".vr-prog-btn").forEach(function (b, i) { b.addEventListener("click", function () { loadProg(i); }); });
    stepBtn.addEventListener("click", step);
    resetBtn.addEventListener("click", function () { loadProg(cur); });
    loadProg(0);
  })();

})();
