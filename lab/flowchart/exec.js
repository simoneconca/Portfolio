/* ============================================================
   exec.js — Interprete del diagramma di flusso
   Valuta le espressioni (sintassi Flowgorithm: = == != < <= > >=,
   + - * / % ^, & per concatenare, and/or/not) ed esegue il
   diagramma passo-passo: evidenzia il blocco, aggiorna le variabili,
   stampa l'output e chiede l'input all'utente.
   ============================================================ */
(function () {
  "use strict";
  if (!window.FC) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ============================================================
     Valutatore di espressioni
     ============================================================ */
  function toStr(v) {
    if (typeof v === "boolean") return v ? "vero" : "falso";
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(6)));
    return String(v);
  }
  function num(v) {
    if (typeof v === "number") return v;
    if (typeof v === "boolean") throw new Error("Non posso fare calcoli con un valore vero/falso.");
    const n = Number(String(v).trim());
    if (v === "" || isNaN(n)) throw new Error("«" + v + "» non è un numero: operazione aritmetica non valida.");
    return n;
  }
  function toBool(v) {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    throw new Error("Qui serve una condizione vera/falsa.");
  }

  function tokenize(src) {
    const t = []; let i = 0; const n = src.length;
    const two = { "==": 1, "!=": 1, "<=": 1, ">=": 1, "&&": 1, "||": 1 };
    while (i < n) {
      const c = src[i];
      if (c === " " || c === "\t") { i++; continue; }
      if (c === '"') { let j = i + 1, s = ""; while (j < n && src[j] !== '"') { s += src[j]; j++; } if (src[j] !== '"') throw new Error("Virgolette non chiuse."); t.push({ t: "str", v: s }); i = j + 1; continue; }
      if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1]))) { let j = i, s = ""; while (j < n && /[0-9.]/.test(src[j])) { s += src[j]; j++; } t.push({ t: "num", v: parseFloat(s) }); i = j; continue; }
      if (/[A-Za-z_]/.test(c)) {
        let j = i, s = ""; while (j < n && /[A-Za-z0-9_]/.test(src[j])) { s += src[j]; j++; }
        const lo = s.toLowerCase(); i = j;
        if (lo === "and" || lo === "e") t.push({ t: "op", v: "and" });
        else if (lo === "or" || lo === "oppure") t.push({ t: "op", v: "or" });
        else if (lo === "not" || lo === "non") t.push({ t: "op", v: "not" });
        else if (lo === "mod") t.push({ t: "op", v: "%" });
        else if (lo === "true" || lo === "vero") t.push({ t: "bool", v: true });
        else if (lo === "false" || lo === "falso") t.push({ t: "bool", v: false });
        else t.push({ t: "id", v: s });
        continue;
      }
      const pair = src.substr(i, 2);
      if (two[pair]) { t.push({ t: "op", v: pair === "&&" ? "and" : pair === "||" ? "or" : pair }); i += 2; continue; }
      if (c === "(") { t.push({ t: "lp" }); i++; continue; }
      if (c === ")") { t.push({ t: "rp" }); i++; continue; }
      if (c === "=") { t.push({ t: "op", v: "==" }); i++; continue; }   // = come uguaglianza nelle condizioni
      if (c === "!") { t.push({ t: "op", v: "not" }); i++; continue; }
      if ("+-*/%^&<>".indexOf(c) !== -1) { t.push({ t: "op", v: c }); i++; continue; }
      throw new Error("Carattere non valido: «" + c + "».");
    }
    return t;
  }

  function evalExpr(src, scope) {
    const toks = tokenize(String(src)); let p = 0;
    const peek = () => toks[p];
    const isOp = (v) => peek() && peek().t === "op" && peek().v === v;
    const getVar = (name) => {
      const v = scope.v[name];
      if (!v) throw new Error("La variabile «" + name + "» non è stata dichiarata.");
      if (!v.init) throw new Error("La variabile «" + name + "» non ha ancora un valore.");
      return v.value;
    };
    function eq(a, b) { if (typeof a === typeof b) return a === b; return toStr(a) === toStr(b); }
    function cmp(op, a, b) {
      if (op === "==") return eq(a, b);
      if (op === "!=") return !eq(a, b);
      let x = a, y = b;
      if (typeof a === "number" || typeof b === "number") { x = num(a); y = num(b); }
      if (op === "<") return x < y; if (op === "<=") return x <= y;
      if (op === ">") return x > y; if (op === ">=") return x >= y;
    }
    function arith(op, a, b) {
      const x = num(a), y = num(b);
      if (op === "+") return x + y; if (op === "-") return x - y;
      if (op === "*") return x * y;
      if (op === "/") { if (y === 0) throw new Error("Divisione per zero."); return x / y; }
      if (op === "%") { if (y === 0) throw new Error("Modulo per zero."); return x % y; }
    }
    function pOr() { let a = pAnd(); while (isOp("or")) { p++; a = toBool(a) | toBool(pAnd()) ? true : false; } return a; }
    function pAnd() { let a = pNot(); while (isOp("and")) { p++; a = toBool(a) && toBool(pNot()); } return a; }
    function pNot() { if (isOp("not")) { p++; return !toBool(pNot()); } return pCmp(); }
    function pCmp() { let a = pCat(); const o = peek(); if (o && o.t === "op" && ["==", "!=", "<", "<=", ">", ">="].indexOf(o.v) !== -1) { p++; a = cmp(o.v, a, pCat()); } return a; }
    function pCat() { let a = pAdd(); while (isOp("&")) { p++; a = toStr(a) + toStr(pAdd()); } return a; }
    function pAdd() { let a = pMul(); while (isOp("+") || isOp("-")) { const o = peek().v; p++; a = arith(o, a, pMul()); } return a; }
    function pMul() { let a = pExp(); while (isOp("*") || isOp("/") || isOp("%")) { const o = peek().v; p++; a = arith(o, a, pExp()); } return a; }
    function pExp() { let a = pUn(); if (isOp("^")) { p++; a = Math.pow(num(a), num(pExp())); } return a; }
    function pUn() { if (isOp("-")) { p++; return -num(pUn()); } if (isOp("+")) { p++; return num(pUn()); } return pPrim(); }
    function pPrim() {
      const t = peek(); if (!t) throw new Error("Espressione incompleta.");
      if (t.t === "num" || t.t === "bool" || t.t === "str") { p++; return t.v; }
      if (t.t === "lp") { p++; const v = pOr(); if (!peek() || peek().t !== "rp") throw new Error("Manca una parentesi chiusa."); p++; return v; }
      if (t.t === "id") { p++; return getVar(t.v); }
      throw new Error("Errore di sintassi vicino a «" + (t.v || "") + "».");
    }
    const r = pOr();
    if (p < toks.length) throw new Error("Espressione non valida (token in più).");
    return r;
  }

  /* ============================================================
     Coercizione per tipo
     ============================================================ */
  function coerceAssign(v, type) {
    if (type === "Intero") return Math.trunc(num(v));
    if (type === "Reale") return num(v);
    if (type === "Booleano") return toBool(v);
    return toStr(v);   // Stringa
  }
  function coerceInput(raw, type) {
    if (type === "Intero") { const n = parseInt(raw, 10); if (isNaN(n)) throw new Error("Serve un numero intero."); return n; }
    if (type === "Reale") { const n = parseFloat(raw); if (isNaN(n)) throw new Error("Serve un numero."); return n; }
    if (type === "Booleano") return /^(vero|true|1|si|sì)$/i.test(String(raw).trim());
    return String(raw);
  }
  function inferType(v) { return typeof v === "boolean" ? "Booleano" : typeof v === "string" ? "Stringa" : Number.isInteger(v) ? "Intero" : "Reale"; }

  /* ============================================================
     Esecutore (generatore: un passo = un blocco)
     ============================================================ */
  function* execSeq(body, scope) { for (const n of body) yield* execNode(n, scope); }
  function* execNode(n, scope) {
    switch (n.type) {
      case "start": yield { node: n.id, desc: "Inizio del programma." }; break;
      case "end": yield { node: n.id, desc: "Fine del programma." }; break;
      case "declare": {
        const names = n.vars.split(",").map((s) => s.trim()).filter(Boolean);
        names.forEach((nm) => { scope.v[nm] = { type: n.vtype, value: null, init: false }; });
        yield { node: n.id, desc: "Dichiaro " + names.join(", ") + " (" + n.vtype + "): scatola vuota in memoria." };
        break;
      }
      case "assign": {
        const raw = evalExpr(n.expr, scope);
        const slot = scope.v[n.target];
        if (!slot) throw new Error("La variabile «" + n.target + "» non è stata dichiarata: aggiungi prima un blocco Dichiarazione.");
        slot.value = coerceAssign(raw, slot.type); slot.init = true;
        yield { node: n.id, changed: n.target, desc: n.target + " = " + toStr(slot.value) + "." };
        break;
      }
      case "output": {
        const v = evalExpr(n.expr, scope);
        scope.out.push(toStr(v));
        yield { node: n.id, fresh: scope.out.length - 1, desc: "Scrivo a schermo: " + toStr(v) };
        break;
      }
      case "input": {
        if (!scope.v[n.name]) throw new Error("La variabile «" + n.name + "» non è stata dichiarata: aggiungi prima un blocco Dichiarazione.");
        const type = scope.v[n.name].type;
        const raw = yield { node: n.id, needInput: { name: n.name, type } };
        const val = coerceInput(raw, type);
        scope.v[n.name].value = val; scope.v[n.name].init = true;
        yield { node: n.id, changed: n.name, desc: "Hai inserito " + toStr(val) + " → " + n.name + "." };
        break;
      }
      case "if": {
        const c = toBool(evalExpr(n.cond, scope));
        yield { node: n.id, cond: c, desc: "Controllo «" + n.cond + "»: " + (c ? "VERO → ramo destro." : "FALSO → ramo sinistro.") };
        yield* execSeq(c ? n.tBody : n.fBody, scope);
        break;
      }
      case "while": {
        while (true) {
          const c = toBool(evalExpr(n.cond, scope));
          yield { node: n.id, cond: c, desc: "Controllo «" + n.cond + "»: " + (c ? "VERO → eseguo il corpo." : "FALSO → esco.") };
          if (!c) break;
          yield* execSeq(n.body, scope);
        }
        break;
      }
      case "do": {
        while (true) {
          yield* execSeq(n.body, scope);
          const c = toBool(evalExpr(n.cond, scope));
          yield { node: n.id, cond: c, desc: "Controllo (dopo) «" + n.cond + "»: " + (c ? "VERO → ripeto." : "FALSO → esco.") };
          if (!c) break;
        }
        break;
      }
      case "for": {
        if (!scope.v[n.var]) throw new Error("Il contatore «" + n.var + "» non è stato dichiarato: aggiungi prima un blocco Dichiarazione (tipo Intero).");
        const from = Math.trunc(num(evalExpr(n.from, scope))), to = Math.trunc(num(evalExpr(n.to, scope)));
        scope.v[n.var].value = from; scope.v[n.var].init = true;
        while (true) {
          const cur = scope.v[n.var].value, c = cur <= to;
          yield { node: n.id, cond: c, changed: n.var, desc: "Contatore " + n.var + " = " + cur + " ≤ " + to + ": " + (c ? "Ripeti." : "Termina.") };
          if (!c) break;
          yield* execSeq(n.body, scope);
          scope.v[n.var].value = scope.v[n.var].value + 1;
        }
        break;
      }
    }
  }

  /* ============================================================
     Driver + UI
     ============================================================ */
  let gen = null, scope = null, auto = false, timer = null, steps = 0, awaiting = false, done = false;
  const LIMIT = 8000;

  function setClean() { $("fcCanvas").innerHTML = window.FC.renderAST(window.FC.program); }
  function highlight(id, cond) {
    $("fcCanvas").querySelectorAll(".fc-node").forEach((g) => {
      const on = g.dataset.id === id;
      g.classList.toggle("active", on);
      g.classList.toggle("cond-true", on && cond === true);
      g.classList.toggle("cond-false", on && cond === false);
    });
  }
  function renderVars(changed) {
    const names = Object.keys(scope.v);
    $("fcVars").innerHTML = names.length ? names.map((nm) => {
      const v = scope.v[nm];
      const val = v.init ? esc(toStr(v.value)) : '<i style="color:var(--ink-faint)">vuoto</i>';
      return '<div class="fc-var' + (nm === changed ? " changed" : "") + '"><span class="vn">' + esc(nm) + " <small>" + v.type + '</small></span><span class="vv">' + val + "</span></div>";
    }).join("") : '<span class="fc-empty">nessuna variabile</span>';
  }
  function renderOut(fresh) {
    $("fcOut").innerHTML = scope.out.length ? scope.out.map((l, i) =>
      '<div' + (i === fresh ? ' class="fresh"' : "") + ">" + esc(l) + "</div>").join("") : '<span class="fc-empty">— niente stampato —</span>';
  }
  function setDesc(html) { $("fcDesc").innerHTML = html; }

  function begin() {
    stopAuto();
    scope = { v: {}, out: [] }; steps = 0; done = false; awaiting = false;
    gen = execSeq(window.FC.program, scope);
    setClean();
    renderVars(); renderOut();
  }

  function advance(inputVal) {
    if (!gen) begin();
    if (++steps > LIMIT) { setDesc('<b style="color:#d2553c">Esecuzione interrotta: troppi passi (forse un ciclo infinito?).</b>'); stopAuto(); done = true; return "error"; }
    let r;
    try { r = gen.next(inputVal); }
    catch (err) { highlight(null); setDesc('<b style="color:#d2553c">⛔ ' + esc(err.message) + "</b>"); stopAuto(); done = true; gen = null; return "error"; }
    if (r.done) { highlight(null); setDesc("<b>✓ Esecuzione terminata.</b>"); stopAuto(); done = true; gen = null; return "done"; }
    const fr = r.value;
    if (fr.needInput) { promptInput(fr.needInput); return "input"; }
    highlight(fr.node, fr.cond);
    renderVars(fr.changed); renderOut(fr.fresh);
    if (fr.desc) setDesc("<b>▸</b> " + esc(fr.desc).replace(/&lt;b&gt;|&lt;\/b&gt;/g, ""));
    return "frame";
  }

  function promptInput(req) {
    awaiting = true;
    highlight(null);
    $("fcVars"); // mantieni stato
    setDesc('<div class="fc-inputrow"><span>Inserisci <b>' + esc(req.name) + "</b> <small>(" + req.type + ')</small></span>' +
      '<input type="text" id="fcInputBox" autocomplete="off" spellcheck="false"> ' +
      '<button type="button" class="fc-ok" id="fcInputOk">OK ↵</button></div>');
    const box = $("fcInputBox");
    box.focus();
    const submit = () => {
      const val = box.value;
      awaiting = false;
      const st = advance(val);
      if (auto && st === "frame") scheduleAuto();
    };
    $("fcInputOk").addEventListener("click", submit);
    box.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
  }

  function scheduleAuto() { timer = setTimeout(autoTick, 850); }
  function autoTick() {
    if (!auto) return;
    const st = advance(undefined);
    if (st === "frame") scheduleAuto();
    else if (st === "input") { /* aspetta input */ }
    else stopAuto();
  }
  function stopAuto() { auto = false; if (timer) { clearTimeout(timer); timer = null; } $("fcRun").textContent = "▶ Esegui"; }

  function doStep() {
    if (done) begin();
    if (awaiting) return;
    stopAuto();
    advance(undefined);
  }
  function doRun() {
    if (auto) { stopAuto(); return; }
    if (done || !gen) begin();
    if (awaiting) return;
    auto = true; $("fcRun").textContent = "⏸ Pausa";
    autoTick();
  }
  function doReset() {
    stopAuto(); gen = null; scope = null; done = false; awaiting = false;
    window.FC.render();   // ritorna in modalità modifica (con i «+»)
    $("fcVars").innerHTML = '<span class="fc-empty">nessuna variabile</span>';
    $("fcOut").innerHTML = '<span class="fc-empty">— niente stampato —</span>';
    setDesc("Premi <b>Esegui</b> o <b>Passo</b> per far partire il diagramma.");
  }

  $("fcStep").addEventListener("click", doStep);
  $("fcRun").addEventListener("click", doRun);
  $("fcReset").addEventListener("click", doReset);

  window.FCExec = { reset: doReset };
})();
