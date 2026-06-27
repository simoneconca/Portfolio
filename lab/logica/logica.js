/* ============================================================
   logica.js — Logic Gate Simulator
   Logica booleana & circuiti.

   Modello unico: un grafo di nodi (interruttori, porte, lampadina)
   collegati da fili. Da quel grafo si ricava sia l'espressione
   (!A && B) sia la tabella di verità. Scrivendo un'espressione si
   genera lo stesso grafo, con layout automatico. Zero backend.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Configurazione porte ---------- */
  // numero di ingressi per tipo di nodo
  const ARITY = { in: 0, not: 1, and: 2, or: 2, xor: 2, out: 1 };
  const OP_SYM = { and: "&&", or: "||", xor: "^" };
  // precedenza per la parentesizzazione dell'espressione
  const PREC = { atom: 5, not: 4, and: 3, xor: 2, or: 1 };

  const VAR_NAMES = ["A", "B", "C", "D"];

  /* ---------- Stato ---------- */
  let nodes = [];          // { id, type, x, y, label?, value? }
  let wires = [];          // { id, from, to, toPort }
  let pending = null;      // id del nodo sorgente in attesa di collegamento
  let idCounter = 0;
  let suppressExpr = false; // evita loop quando aggiorno il campo da codice

  const board = document.getElementById("board");
  const nodesLayer = document.getElementById("nodes");
  const wiresSvg = document.getElementById("wires");
  const exprInput = document.getElementById("exprInput");
  const exprErr = document.getElementById("exprErr");
  const drawBtn = document.getElementById("drawBtn");
  const clearBtn = document.getElementById("clearBtn");
  const truthTable = document.getElementById("truth");
  const boardHint = document.getElementById("boardHint");

  const GATE_W = 92, GATE_H = 56;

  /* ---------- Helpers ---------- */
  const uid = (p) => p + (idCounter++);
  const byId = (id) => nodes.find((n) => n.id === id);
  const wireToPort = (id, port) => wires.find((w) => w.to === id && w.toPort === port);
  const srcOfPort = (id, port) => { const w = wireToPort(id, port); return w ? w.from : null; };

  function nodeSize(n) {
    if (n.type === "out") return { w: 76, h: 76 };
    if (n.type === "in") return { w: 84, h: 64 };
    return { w: GATE_W, h: GATE_H };
  }

  function clearAll() {
    nodes = []; wires = []; pending = null; idCounter = 0;
  }

  /* ============================================================
     1) ESPRESSIONE  ->  GRAFO  (parser + layout)
     ============================================================ */
  function tokenize(s) {
    const toks = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "&" && s[i + 1] === "&") { toks.push({ t: "and" }); i += 2; continue; }
      if (c === "|" && s[i + 1] === "|") { toks.push({ t: "or" }); i += 2; continue; }
      if (c === "&" || c === "·" || c === "*") { toks.push({ t: "and" }); i++; continue; }
      if (c === "|" || c === "+") { toks.push({ t: "or" }); i++; continue; }
      if (c === "^") { toks.push({ t: "xor" }); i++; continue; }
      if (c === "!" || c === "~") { toks.push({ t: "not" }); i++; continue; }
      if (c === "(") { toks.push({ t: "lp" }); i++; continue; }
      if (c === ")") { toks.push({ t: "rp" }); i++; continue; }
      if (/[A-Za-z]/.test(c)) {
        let name = "";
        while (i < s.length && /[A-Za-z]/.test(s[i])) name += s[i++];
        toks.push({ t: "var", name: name.toUpperCase() });
        continue;
      }
      throw new Error('Carattere non valido: "' + c + '"');
    }
    return toks;
  }

  // Grammatica a precedenza:  or -> xor -> and -> not -> atom
  function parse(s) {
    const toks = tokenize(s);
    let p = 0;
    const peek = () => toks[p];
    const eat = (t) => {
      if (!toks[p] || toks[p].t !== t) throw new Error("Sintassi non valida");
      return toks[p++];
    };

    function parseOr() {
      let node = parseXor();
      while (peek() && peek().t === "or") { p++; node = { type: "or", l: node, r: parseXor() }; }
      return node;
    }
    function parseXor() {
      let node = parseAnd();
      while (peek() && peek().t === "xor") { p++; node = { type: "xor", l: node, r: parseAnd() }; }
      return node;
    }
    function parseAnd() {
      let node = parseNot();
      while (peek() && peek().t === "and") { p++; node = { type: "and", l: node, r: parseNot() }; }
      return node;
    }
    function parseNot() {
      if (peek() && peek().t === "not") { p++; return { type: "not", arg: parseNot() }; }
      return parseAtom();
    }
    function parseAtom() {
      const tk = peek();
      if (!tk) throw new Error("Espressione incompleta");
      if (tk.t === "lp") { p++; const e = parseOr(); eat("rp"); return e; }
      if (tk.t === "var") {
        p++;
        if (VAR_NAMES.indexOf(tk.name) === -1) throw new Error('Usa solo le variabili A, B, C, D (trovato "' + tk.name + '")');
        return { type: "var", name: tk.name };
      }
      throw new Error("Atteso una variabile o (");
    }

    const ast = parseOr();
    if (p !== toks.length) throw new Error("Sintassi non valida");
    return ast;
  }

  // Costruisce nodi + fili dall'AST e calcola il layout
  function buildFromAst(ast) {
    clearAll();
    const inputsMap = {};

    function getInput(name) {
      if (!inputsMap[name]) {
        const n = { id: uid("n"), type: "in", x: 0, y: 0, label: name, value: false };
        nodes.push(n);
        inputsMap[name] = n;
      }
      return inputsMap[name];
    }
    function wire(from, to, port) {
      wires.push({ id: uid("w"), from: from.id, to: to.id, toPort: port });
    }
    function build(node) {
      if (node.type === "var") return getInput(node.name);
      if (node.type === "not") {
        const child = build(node.arg);
        const g = { id: uid("n"), type: "not", x: 0, y: 0 };
        nodes.push(g); wire(child, g, 0); return g;
      }
      // binarie
      const l = build(node.l), r = build(node.r);
      const g = { id: uid("n"), type: node.type, x: 0, y: 0 };
      nodes.push(g); wire(l, g, 0); wire(r, g, 1); return g;
    }

    const root = build(ast);
    const out = { id: uid("n"), type: "out", x: 0, y: 0 };
    nodes.push(out);
    wire(root, out, 0);

    layout();
  }

  // Layout a colonne per profondità
  function layout() {
    const pad = 28;
    const colW = 132, rowH = 78;

    // profondità (longest path dagli input)
    const depthMemo = {};
    function depth(id) {
      if (depthMemo[id] != null) return depthMemo[id];
      const n = byId(id);
      let d = 0;
      if (n.type !== "in") {
        for (let port = 0; port < ARITY[n.type]; port++) {
          const s = srcOfPort(id, port);
          if (s != null) d = Math.max(d, depth(s) + 1);
        }
      }
      return (depthMemo[id] = d);
    }
    nodes.forEach((n) => depth(n.id));
    const maxDepth = Math.max(0, ...nodes.map((n) => depthMemo[n.id]));

    // y: gli input in colonna, gli altri = media delle sorgenti
    const inputs = nodes.filter((n) => n.type === "in");
    inputs.forEach((n, i) => { n._row = i; });

    const yMemo = {};
    function yOf(id) {
      if (yMemo[id] != null) return yMemo[id];
      const n = byId(id);
      if (n.type === "in") return (yMemo[id] = n._row);
      let sum = 0, cnt = 0;
      for (let port = 0; port < ARITY[n.type]; port++) {
        const s = srcOfPort(id, port);
        if (s != null) { sum += yOf(s); cnt++; }
      }
      return (yMemo[id] = cnt ? sum / cnt : 0);
    }
    nodes.forEach((n) => yOf(n.id));

    nodes.forEach((n) => {
      const d = n.type === "out" ? maxDepth + 1 : depthMemo[n.id];
      n.x = pad + d * colW;
      n.y = pad + yOf(n.id) * rowH;
    });
  }

  /* ============================================================
     2) GRAFO  ->  ESPRESSIONE
     ============================================================ */
  function exprFromGraph() {
    const out = nodes.find((n) => n.type === "out");
    if (!out) return { text: "", complete: false };
    let complete = true;

    function walk(id) {
      if (id == null) { complete = false; return { s: "?", prec: PREC.atom }; }
      const n = byId(id);
      if (n.type === "in") return { s: n.label, prec: PREC.atom };
      if (n.type === "not") {
        const c = walk(srcOfPort(id, 0));
        const inner = c.prec < PREC.not ? "(" + c.s + ")" : c.s;
        return { s: "!" + inner, prec: PREC.not };
      }
      // binarie
      const a = walk(srcOfPort(id, 0));
      const b = walk(srcOfPort(id, 1));
      const prec = PREC[n.type];
      const wrap = (x) => (x.prec < prec ? "(" + x.s + ")" : x.s);
      return { s: wrap(a) + " " + OP_SYM[n.type] + " " + wrap(b), prec };
    }

    const root = srcOfPort(out.id, 0);
    if (root == null) return { text: "", complete: false };
    const r = walk(root);
    return { text: r.s, complete };
  }

  /* ============================================================
     3) VALUTAZIONE  (per lampadine e tabella di verità)
     ============================================================ */
  // Valuta tutti i nodi dati i valori degli input. Ritorna mappa id->bool|null
  function evaluate(inputValues) {
    const memo = {};
    function val(id) {
      if (id == null) return null;
      if (memo[id] !== undefined) return memo[id];
      const n = byId(id);
      let r = null;
      if (n.type === "in") {
        r = inputValues ? !!inputValues[n.label] : !!n.value;
      } else if (n.type === "not") {
        const a = val(srcOfPort(id, 0));
        r = a == null ? null : !a;
      } else if (n.type === "out") {
        r = val(srcOfPort(id, 0));
      } else {
        const a = val(srcOfPort(id, 0));
        const b = val(srcOfPort(id, 1));
        if (a == null || b == null) r = null;
        else if (n.type === "and") r = a && b;
        else if (n.type === "or") r = a || b;
        else if (n.type === "xor") r = a !== b;
      }
      memo[id] = r;
      return r;
    }
    nodes.forEach((n) => val(n.id));
    return memo;
  }

  function usedVars() {
    return nodes.filter((n) => n.type === "in").map((n) => n.label)
      .filter((v, i, a) => a.indexOf(v) === i).sort();
  }

  /* ============================================================
     4) RENDER
     ============================================================ */
  function portPos(n, kind, port) {
    const s = nodeSize(n);
    if (kind === "out") return { x: n.x + s.w, y: n.y + s.h / 2 };
    // ingressi a sinistra
    const ar = ARITY[n.type];
    if (ar <= 1) return { x: n.x, y: n.y + s.h / 2 };
    const frac = port === 0 ? 0.3 : 0.7;
    return { x: n.x, y: n.y + s.h * frac };
  }

  function gateInner(n) {
    if (n.type === "in") {
      return `<span class="lg-in-name">${n.label}</span>
              <span class="lg-switch" aria-hidden="true"></span>
              <span class="lg-in-val">${n.value ? "1 · vero" : "0 · falso"}</span>`;
    }
    if (n.type === "out") {
      return `<span class="lg-bulb" aria-hidden="true">💡</span>
              <span class="lg-out-lbl">uscita</span>`;
    }
    const sub = { not: "NOT · !", and: "AND · &&", or: "OR · ||", xor: "XOR · ^" }[n.type];
    const sym = { not: "!", and: "&&", or: "||", xor: "^" }[n.type];
    return `<span class="lg-gate-sym">${sym}</span><span class="lg-gate-sub">${sub}</span>`;
  }

  function render() {
    // valori correnti dei nodi (interruttori live)
    const memo = evaluate(null);

    // ---- nodi ----
    nodesLayer.innerHTML = "";
    nodes.forEach((n) => {
      const on = memo[n.id] === true;
      const el = document.createElement("div");
      el.className = "lg-node t-" + n.type + (on ? " on" : "");
      el.dataset.id = n.id;
      el.style.left = n.x + "px";
      el.style.top = n.y + "px";

      const gate = document.createElement("div");
      gate.className = "lg-gate";
      gate.innerHTML = gateInner(n);
      el.appendChild(gate);

      // porte d'ingresso
      const ar = ARITY[n.type];
      for (let port = 0; port < ar; port++) {
        const pp = portPos(n, "in", port);
        const dot = document.createElement("div");
        dot.className = "lg-port in";
        const connected = !!wireToPort(n.id, port);
        if (connected && srcOfPort(n.id, port) && memo[srcOfPort(n.id, port)] === true) dot.classList.add("on");
        dot.style.top = (pp.y - n.y - 7) + "px";
        dot.dataset.port = port;
        dot.dataset.kind = "in";
        el.appendChild(dot);
      }
      // porta d'uscita (tutti tranne out)
      if (n.type !== "out") {
        const dot = document.createElement("div");
        dot.className = "lg-port out" + (pending === n.id ? " pending" : "") + (on ? " on" : "");
        dot.dataset.kind = "out";
        el.appendChild(dot);
      }

      // elimina
      const del = document.createElement("button");
      del.className = "lg-del";
      del.type = "button";
      del.textContent = "×";
      del.setAttribute("aria-label", "Elimina");
      del.dataset.del = n.id;
      el.appendChild(del);

      nodesLayer.appendChild(el);
    });

    drawWires(memo);
    updateExprField();
    renderTruth();
    boardHint.style.opacity = nodes.length ? "0" : "1";
  }

  function drawWires(memo, temp) {
    let svg = "";
    wires.forEach((w) => {
      const from = byId(w.from), to = byId(w.to);
      if (!from || !to) return;
      const a = portPos(from, "out");
      const b = portPos(to, "in", w.toPort);
      const on = memo[w.from] === true;
      svg += `<path class="wire${on ? " on" : ""}" data-wire="${w.id}" d="${curve(a, b)}"/>`;
    });
    if (temp) svg += `<path class="temp" d="${curve(temp.a, temp.b)}"/>`;
    wiresSvg.innerHTML = svg;
  }

  function curve(a, b) {
    const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }

  function updateExprField() {
    const { text } = exprFromGraph();
    suppressExpr = true;
    if (document.activeElement !== exprInput) exprInput.value = text;
    suppressExpr = false;
  }

  function renderTruth() {
    const vars = usedVars();
    const out = nodes.find((n) => n.type === "out");
    const connected = out && srcOfPort(out.id, 0) != null;

    if (!vars.length || !connected) {
      truthTable.innerHTML = `<tbody><tr><td class="lg-truth-empty">${
        !vars.length ? "Aggiungi almeno un interruttore." : "Collega l'uscita alla lampadina per vedere la tabella."
      }</td></tr></tbody>`;
      return;
    }

    const n = vars.length;
    const rows = 1 << n;
    // valori attuali per evidenziare la riga attiva
    const cur = {};
    vars.forEach((v) => { cur[v] = !!byId(nodes.find((x) => x.type === "in" && x.label === v).id).value; });

    let head = "<thead><tr>";
    vars.forEach((v) => { head += `<th>${v}</th>`; });
    head += `<th class="out-col">f</th></tr></thead>`;

    let body = "<tbody>";
    for (let r = 0; r < rows; r++) {
      const assign = {};
      let active = true;
      vars.forEach((v, i) => {
        const bit = (r >> (n - 1 - i)) & 1;
        assign[v] = !!bit;
        if (cur[v] !== !!bit) active = false;
      });
      const memo = evaluate(assign);
      const res = memo[out.id];
      body += `<tr class="${active ? "active" : ""}">`;
      vars.forEach((v) => {
        const bit = assign[v] ? 1 : 0;
        body += `<td class="bit-${bit}">${bit}</td>`;
      });
      const rv = res == null ? "?" : (res ? 1 : 0);
      body += `<td class="out-col bit-${rv}">${rv}</td></tr>`;
    }
    body += "</tbody>";
    truthTable.innerHTML = head + body;
  }

  /* ============================================================
     5) INTERAZIONE
     ============================================================ */
  // aggiungi nodo
  function addNode(type) {
    let label;
    if (type === "in") {
      const used = usedVars();
      label = VAR_NAMES.find((v) => used.indexOf(v) === -1);
      if (!label) { flashErr("Massimo 4 interruttori (A–D)."); return; }
    }
    // un solo output: se ne aggiungo già esiste, riusa
    if (type === "out" && nodes.some((n) => n.type === "out")) return;
    const x = 40 + Math.random() * 60;
    const y = 40 + Math.random() * 60;
    const n = { id: uid("n"), type, x, y };
    if (type === "in") { n.label = label; n.value = false; }
    nodes.push(n);
    render();
  }

  function ensureOutput() {
    if (!nodes.some((n) => n.type === "out")) {
      nodes.push({ id: uid("n"), type: "out", x: board.clientWidth - 130, y: 40 });
    }
  }

  function deleteNode(id) {
    nodes = nodes.filter((n) => n.id !== id);
    wires = wires.filter((w) => w.from !== id && w.to !== id);
    if (pending === id) pending = null;
    render();
  }

  function deleteWire(id) {
    wires = wires.filter((w) => w.id !== id);
    render();
  }

  // collegamento: clic su porta out -> clic su porta in
  function clickPort(nodeEl, dot) {
    const id = nodeEl.dataset.id;
    if (dot.dataset.kind === "out") {
      pending = pending === id ? null : id;
      render();
      return;
    }
    // porta di ingresso
    if (!pending) return;
    const port = parseInt(dot.dataset.port, 10);
    if (pending === id) { pending = null; render(); return; }
    if (createsCycle(pending, id)) { flashErr("Quel collegamento creerebbe un anello."); pending = null; render(); return; }
    // sostituisci eventuale filo già presente su quella porta
    wires = wires.filter((w) => !(w.to === id && w.toPort === port));
    wires.push({ id: uid("w"), from: pending, to: id, toPort: port });
    pending = null;
    render();
  }

  // verifica che collegare from->to non crei un ciclo (to non deve raggiungere from)
  function createsCycle(from, to) {
    if (from === to) return true;
    const stack = [to];
    const seen = {};
    while (stack.length) {
      const cur = stack.pop();
      if (cur === from) return true;
      if (seen[cur]) continue;
      seen[cur] = true;
      wires.filter((w) => w.from === cur).forEach((w) => stack.push(w.to));
    }
    return false;
  }

  function flashErr(msg) {
    exprErr.textContent = msg;
    clearTimeout(flashErr._t);
    flashErr._t = setTimeout(() => { if (exprErr.textContent === msg) exprErr.textContent = ""; }, 2600);
  }

  /* ---------- Drag dei nodi ---------- */
  let drag = null;
  board.addEventListener("pointerdown", (e) => {
    const portEl = e.target.closest(".lg-port");
    const delEl = e.target.closest(".lg-del");
    const wireEl = e.target.closest("path.wire");
    const nodeEl = e.target.closest(".lg-node");

    if (delEl) { e.preventDefault(); deleteNode(delEl.dataset.del); return; }
    if (portEl && nodeEl) { e.preventDefault(); clickPort(nodeEl, portEl); return; }
    if (wireEl) { e.preventDefault(); deleteWire(wireEl.dataset.wire); return; }
    if (!nodeEl) { if (pending) { pending = null; render(); } return; }

    const n = byId(nodeEl.dataset.id);
    drag = {
      id: n.id, moved: false,
      sx: e.clientX, sy: e.clientY,
      ox: n.x, oy: n.y,
    };
    nodeEl.classList.add("dragging");
    nodeEl.setPointerCapture(e.pointerId);
  });

  board.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const n = byId(drag.id);
    const s = nodeSize(n);
    n.x = clamp(drag.ox + dx, 0, board.clientWidth - s.w);
    n.y = clamp(drag.oy + dy, 0, board.clientHeight - s.h);
    const el = nodesLayer.querySelector(`.lg-node[data-id="${n.id}"]`);
    if (el) { el.style.left = n.x + "px"; el.style.top = n.y + "px"; }
    drawWires(evaluate(null));
  });

  board.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const el = nodesLayer.querySelector(`.lg-node[data-id="${drag.id}"]`);
    el && el.classList.remove("dragging");
    const n = byId(drag.id);
    // clic "secco" su un interruttore => toggle
    if (!drag.moved && n && n.type === "in" &&
        !e.target.closest(".lg-port") && !e.target.closest(".lg-del")) {
      n.value = !n.value;
      render();
    }
    drag = null;
  });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Toolbar ---------- */
  document.querySelectorAll(".lg-add").forEach((btn) => {
    btn.addEventListener("click", () => { exprErr.textContent = ""; ensureOutput(); addNode(btn.dataset.add); });
  });
  clearBtn.addEventListener("click", () => { clearAll(); ensureOutput(); render(); exprErr.textContent = ""; });

  /* ---------- Campo espressione ---------- */
  function drawFromExpr() {
    const txt = exprInput.value.trim();
    if (!txt) { exprErr.textContent = "Scrivi un'espressione, es. !A && B"; return; }
    try {
      const ast = parse(txt);
      buildFromAst(ast);
      exprErr.textContent = "";
      render();
    } catch (err) {
      exprErr.textContent = err.message;
    }
  }
  drawBtn.addEventListener("click", drawFromExpr);
  exprInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); drawFromExpr(); } });
  exprInput.addEventListener("input", () => { if (!suppressExpr) exprErr.textContent = ""; });

  /* ---------- Esempi ---------- */
  const EXAMPLES = [
    { label: "AND", expr: "A && B" },
    { label: "OR", expr: "A || B" },
    { label: "NOT", expr: "!A" },
    { label: "XOR", expr: "A ^ B" },
    { label: "!A && B", expr: "!A && B" },
    { label: "Maggioranza", expr: "(A && B) || (A && C) || (B && C)" },
    { label: "Implicazione", expr: "!A || B" },
  ];
  const exSeg = document.getElementById("exSeg");
  EXAMPLES.forEach((ex, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "seg-btn" + (i === 4 ? " active" : "");
    b.textContent = ex.label;
    b.addEventListener("click", () => {
      exSeg.querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      exprInput.value = ex.expr;
      drawFromExpr();
    });
    exSeg.appendChild(b);
  });

  /* ---------- Legenda porte ---------- */
  const LEGEND = [
    { name: "NOT", op: "!A", desc: "Inverte: vero diventa falso e viceversa. L'uscita è 1 solo se l'ingresso è 0." },
    { name: "AND", op: "A && B", desc: "Uscita 1 solo se entrambi gli ingressi sono 1. Basta uno 0 per spegnere tutto." },
    { name: "OR", op: "A || B", desc: "Uscita 1 se almeno un ingresso è 1. È 0 solo quando sono entrambi 0." },
    { name: "XOR", op: "A ^ B", desc: "Uscita 1 se gli ingressi sono diversi tra loro. Uguali → 0, diversi → 1." },
  ];
  const legendEl = document.getElementById("gatesLegend");
  legendEl.innerHTML = LEGEND.map((g) =>
    `<li><span class="lg-leg-name">${g.name}</span><span class="lg-leg-op"><code>${g.op}</code></span>
     <span class="lg-leg-desc">${g.desc}</span></li>`
  ).join("");

  /* ---------- Avvio: esempio !A && B ---------- */
  exprInput.value = "!A && B";
  buildFromAst(parse("!A && B"));
  render();
})();
