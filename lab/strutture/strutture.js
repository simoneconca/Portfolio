/* ============================================================
   strutture.js — Visualizzatore di strutture dati
   Pila (LIFO) · Coda (FIFO) · Albero Binario di Ricerca.
   Inserimento e rimozione animati, percorso di ricerca nel BST,
   tabella di operazioni e codice in Python/Java/C++. Zero backend.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Stato ---------- */
  let mode = "stack";           // stack | queue | bst
  let lang = "python";
  let stackArr = [];
  let queueArr = [];
  let bstRoot = null;
  let nodeSeq = 0;
  let busy = false;
  let hl = { visiting: new Set(), found: null, target: null, justadded: null };

  const MAX = { stack: 10, queue: 12, bst: 40 };

  /* ---------- DOM ---------- */
  const stage = document.getElementById("stage");
  const valInput = document.getElementById("valInput");
  const btnInsert = document.getElementById("btnInsert");
  const btnRemove = document.getElementById("btnRemove");
  const btnSearch = document.getElementById("btnSearch");
  const btnRandom = document.getElementById("btnRandom");
  const btnClear = document.getElementById("btnClear");
  const statusEl = document.getElementById("status");
  const logEl = document.getElementById("log");
  const codeEl = document.getElementById("code");

  const sleep = (ms) => new Promise((r) => setTimeout(r, prefersReducedMotion ? 0 : ms));

  /* ============================================================
     Contenuti didattici
     ============================================================ */
  const EXPLAIN = {
    stack: {
      title: "Pila — Stack", big: "LIFO",
      idea: "Una pila funziona come una catasta di piatti: aggiungi e togli sempre dalla stessa estremità, la cima. L'ultimo che entra è il primo a uscire — Last In, First Out.",
      how: "push() mette un elemento in cima, pop() toglie quello in cima. Non puoi toccare gli elementi sotto senza prima togliere quelli sopra.",
      analogy: "La pila dei piatti, o il tasto «Annulla»: l'ultima azione fatta è la prima che annulli.",
      cost: "push, pop e top sono O(1): si lavora sempre e solo sulla cima, senza scorrere nulla.",
      ins: "Push ▲", rem: "Pop ▼",
    },
    queue: {
      title: "Coda — Queue", big: "FIFO",
      idea: "Una coda funziona come la fila alle poste: entri in fondo ed esci dalla testa. Il primo che entra è il primo a uscire — First In, First Out.",
      how: "enqueue() aggiunge in fondo (rear), dequeue() toglie dalla testa (front). I due capi sono distinti: si entra da una parte e si esce dall'altra.",
      analogy: "La fila alla cassa o la coda di stampa: chi arriva prima viene servito prima.",
      cost: "enqueue e dequeue sono O(1) se si tengono i riferimenti a testa e fondo (es. con una lista collegata o un deque).",
      ins: "Enqueue ▸", rem: "Dequeue ▸",
    },
    bst: {
      title: "Albero Binario di Ricerca", big: "BST",
      idea: "In un Albero Binario di Ricerca ogni nodo ha al massimo due figli, e vale una regola: a sinistra solo valori più piccoli, a destra solo più grandi. Questo rende la ricerca velocissima.",
      how: "Per inserire o cercare parti dalla radice e a ogni nodo scegli: se il valore è minore vai a sinistra, se è maggiore vai a destra. Ti fermi quando trovi il valore o uno spazio vuoto.",
      analogy: "Come cercare una parola sul vocabolario: apri a metà e capisci subito se andare avanti o indietro, scartando ogni volta metà delle pagine.",
      cost: "Inserimento, ricerca e rimozione sono O(log n) in media (albero bilanciato), ma O(n) nel caso peggiore (albero «storto», tutto da una parte).",
      ins: "Inserisci +", rem: "Rimuovi −",
    },
  };

  const CODE = {
    stack: {
      python:
`# Pila (LIFO) con una lista
pila = []

def push(x):        # inserisci in cima
    pila.append(x)

def pop():          # togli dalla cima
    if pila:
        return pila.pop()

def top():          # guarda la cima
    return pila[-1] if pila else None`,
      java:
`// Pila (LIFO)
Deque<Integer> pila = new ArrayDeque<>();

pila.push(x);          // inserisci in cima
int v = pila.pop();    // togli dalla cima
int t = pila.peek();   // guarda la cima`,
      cpp:
`// Pila (LIFO)
#include <stack>
std::stack<int> pila;

pila.push(x);          // inserisci in cima
pila.pop();            // togli dalla cima
int t = pila.top();    // guarda la cima`,
    },
    queue: {
      python:
`# Coda (FIFO)
from collections import deque
coda = deque()

def enqueue(x):     # entra in fondo
    coda.append(x)

def dequeue():      # esce dalla testa
    if coda:
        return coda.popleft()`,
      java:
`// Coda (FIFO)
Queue<Integer> coda = new LinkedList<>();

coda.add(x);           // entra in fondo
int v = coda.poll();   // esce dalla testa
int f = coda.peek();   // guarda la testa`,
      cpp:
`// Coda (FIFO)
#include <queue>
std::queue<int> coda;

coda.push(x);          // entra in fondo
coda.pop();            // esce dalla testa
int f = coda.front();  // guarda la testa`,
    },
    bst: {
      python:
`# Albero Binario di Ricerca
class Nodo:
    def __init__(self, v):
        self.val = v
        self.sx = self.dx = None

def inserisci(r, v):
    if r is None:
        return Nodo(v)
    if v < r.val:
        r.sx = inserisci(r.sx, v)
    elif v > r.val:
        r.dx = inserisci(r.dx, v)
    return r              # i duplicati si ignorano

def cerca(r, v):
    if r is None or r.val == v:
        return r
    if v < r.val:
        return cerca(r.sx, v)
    return cerca(r.dx, v)`,
      java:
`// Albero Binario di Ricerca
class Nodo { int val; Nodo sx, dx; Nodo(int v){ val = v; } }

Nodo inserisci(Nodo r, int v) {
    if (r == null) return new Nodo(v);
    if (v < r.val)       r.sx = inserisci(r.sx, v);
    else if (v > r.val)  r.dx = inserisci(r.dx, v);
    return r;            // i duplicati si ignorano
}

Nodo cerca(Nodo r, int v) {
    if (r == null || r.val == v) return r;
    return (v < r.val) ? cerca(r.sx, v) : cerca(r.dx, v);
}`,
      cpp:
`// Albero Binario di Ricerca
struct Nodo { int val; Nodo *sx = nullptr, *dx = nullptr; };

Nodo* inserisci(Nodo* r, int v) {
    if (!r) return new Nodo{v};
    if (v < r->val)       r->sx = inserisci(r->sx, v);
    else if (v > r->val)  r->dx = inserisci(r->dx, v);
    return r;            // i duplicati si ignorano
}

Nodo* cerca(Nodo* r, int v) {
    if (!r || r->val == v) return r;
    return (v < r->val) ? cerca(r->sx, v) : cerca(r->dx, v);
}`,
    },
  };

  /* ============================================================
     Render
     ============================================================ */
  function render() {
    if (mode === "stack") renderStack();
    else if (mode === "queue") renderQueue();
    else renderBST();
  }

  function cell(val, extra) {
    return `<div class="sd-cell ${extra || ""}">${val}</div>`;
  }

  function renderStack() {
    if (!stackArr.length) {
      stage.innerHTML = `<div class="sd-stack"><p class="sd-stack-empty">Pila vuota.<br>Premi <strong>Push</strong> per inserire in cima.</p><div class="sd-stack-base">▒ fondo ▒</div></div>`;
      return;
    }
    let cells = "";
    // column-reverse: il primo nel DOM finisce in basso → base prima, poi dal più vecchio al più nuovo
    stackArr.forEach((v, i) => {
      const isTop = i === stackArr.length - 1;
      cells += `<div class="sd-cell ${isTop ? "top" : ""}">${v}${isTop ? '<span class="sd-ptr">◄ cima (top)</span>' : ""}</div>`;
    });
    stage.innerHTML = `<div class="sd-stack"><div class="sd-stack-base">▒ fondo ▒</div>${cells}</div>`;
  }

  function renderQueue() {
    if (!queueArr.length) {
      stage.innerHTML = `<div class="sd-queue"><p class="sd-queue-empty">Coda vuota.<br>Premi <strong>Enqueue</strong> per inserire in fondo.</p></div>`;
      return;
    }
    let cells = "";
    queueArr.forEach((v, i) => {
      const isFront = i === 0, isRear = i === queueArr.length - 1;
      const ptr = isFront ? '<span class="sd-ptr front">testa (front)</span>'
                : isRear ? '<span class="sd-ptr">fondo (rear)</span>' : "";
      cells += `<div class="sd-cell ${isFront ? "front" : ""} ${isRear ? "rear" : ""}">${v}${ptr}</div>`;
    });
    stage.innerHTML = `<div class="sd-queue">${cells}</div>`;
  }

  /* ----- BST ----- */
  function layoutBST(root) {
    const pos = {};
    let col = 0, maxDepth = 0;
    (function rec(n, d) {
      if (!n) return;
      rec(n.sx, d + 1);
      pos[n.id] = { col: col++, depth: d };
      maxDepth = Math.max(maxDepth, d);
      rec(n.dx, d + 1);
    })(root, 0);
    return { pos, count: col, maxDepth };
  }

  function renderBST() {
    if (!bstRoot) {
      stage.innerHTML = `<div class="sd-bst"><p class="sd-bst-empty">Albero vuoto.<br>Inserisci un numero per creare la radice.</p></div>`;
      return;
    }
    const { pos, count, maxDepth } = layoutBST(bstRoot);
    const xGap = 58, yGap = 70, pad = 34, r = 20;
    const w = Math.max(count * xGap, xGap) + pad * 2 - xGap + 2 * r;
    const h = (maxDepth + 1) * yGap + pad;
    const X = (n) => pad + r + pos[n.id].col * xGap;
    const Y = (n) => pad + pos[n.id].depth * yGap;

    let edges = "", circles = "";
    (function rec(n) {
      if (!n) return;
      [n.sx, n.dx].forEach((c) => {
        if (c) edges += `<line class="sd-edge" x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`;
      });
      let cls = "sd-node";
      if (hl.visiting.has(n.id)) cls += " visiting";
      if (hl.found === n.id) cls += " found";
      if (hl.target === n.id) cls += " target";
      if (hl.justadded === n.id) cls += " justadded";
      circles += `<g class="${cls}"><circle class="sd-node-circle" cx="${X(n)}" cy="${Y(n)}" r="${r}"/>` +
                 `<text class="sd-node-text" x="${X(n)}" y="${Y(n)}">${n.val}</text></g>`;
      rec(n.sx); rec(n.dx);
    })(bstRoot);

    stage.innerHTML = `<div class="sd-bst"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${edges}${circles}</svg></div>`;
  }

  /* ============================================================
     Operazioni
     ============================================================ */
  function readVal(required) {
    const raw = valInput.value.trim();
    if (raw === "") { if (required) setStatus("Scrivi un numero nel campo «Valore».", true); return null; }
    const v = parseInt(raw, 10);
    if (Number.isNaN(v)) { setStatus("Il valore dev'essere un numero intero.", true); return null; }
    return v;
  }

  function setStatus(msg, warn) {
    statusEl.innerHTML = msg;
    statusEl.style.color = warn ? "#e0533d" : "";
  }

  function addLog(text, type) {
    const empty = logEl.querySelector(".sd-log-empty");
    if (empty) empty.remove();
    const s = document.createElement("span");
    s.className = type || "";
    s.textContent = text;
    logEl.prepend(s);
    while (logEl.children.length > 24) logEl.lastChild.remove();
  }

  async function doInsert() {
    if (busy) return;
    const v = readVal(true);
    if (v === null) return;

    if (mode === "stack") {
      if (stackArr.length >= MAX.stack) { setStatus("Pila piena per questa visualizzazione (max " + MAX.stack + ").", true); return; }
      stackArr.push(v);
      render();
      const top = stage.querySelector(".sd-stack .sd-cell.top");
      if (top) top.classList.add("enter-top");
      setStatus(`<strong>push(${v})</strong> — l'elemento entra in cima.`);
      addLog(`push(${v})`, "ins");
    } else if (mode === "queue") {
      if (queueArr.length >= MAX.queue) { setStatus("Coda piena per questa visualizzazione (max " + MAX.queue + ").", true); return; }
      queueArr.push(v);
      render();
      const rear = stage.querySelector(".sd-queue .sd-cell.rear");
      if (rear) rear.classList.add("enter-right");
      setStatus(`<strong>enqueue(${v})</strong> — l'elemento entra in fondo.`);
      addLog(`enqueue(${v})`, "ins");
    } else {
      await bstInsert(v);
    }
    valInput.value = "";
    valInput.focus();
  }

  async function doRemove() {
    if (busy) return;

    if (mode === "stack") {
      if (!stackArr.length) { setStatus("La pila è vuota: niente da togliere.", true); return; }
      busy = true; updateButtons();
      const top = stage.querySelector(".sd-stack .sd-cell.top");
      if (top) { top.classList.add("leave-top"); await sleep(300); }
      const v = stackArr.pop();
      render();
      setStatus(`<strong>pop() → ${v}</strong> — esce l'ultimo entrato (LIFO).`);
      addLog(`pop() → ${v}`, "rem");
      busy = false; updateButtons();
    } else if (mode === "queue") {
      if (!queueArr.length) { setStatus("La coda è vuota: niente da togliere.", true); return; }
      busy = true; updateButtons();
      const front = stage.querySelector(".sd-queue .sd-cell.front");
      if (front) { front.classList.add("leave-left"); await sleep(300); }
      const v = queueArr.shift();
      render();
      setStatus(`<strong>dequeue() → ${v}</strong> — esce il primo entrato (FIFO).`);
      addLog(`dequeue() → ${v}`, "rem");
      busy = false; updateButtons();
    } else {
      const v = readVal(true);
      if (v !== null) await bstRemove(v);
    }
  }

  /* ----- BST: insert con percorso evidenziato ----- */
  async function bstInsert(v) {
    busy = true; updateButtons();
    hl = { visiting: new Set(), found: null, target: null, justadded: null };

    if (!bstRoot) {
      bstRoot = { id: ++nodeSeq, val: v, sx: null, dx: null };
      render();
      flashAdded(bstRoot.id);
      setStatus(`<strong>inserisci(${v})</strong> — è il primo nodo: diventa la radice.`);
      addLog(`inserisci(${v})`, "ins");
      valInput.value = ""; busy = false; updateButtons(); return;
    }

    let node = bstRoot, steps = 0;
    while (true) {
      hl.visiting.add(node.id); render(); await sleep(420);
      if (v === node.val) {
        setStatus(`<strong>${v}</strong> è già presente: in un BST i duplicati si ignorano.`, true);
        hl.target = node.id; render(); await sleep(500);
        clearHl(); busy = false; updateButtons(); return;
      }
      const goLeft = v < node.val;
      steps++;
      if (goLeft && node.sx) { node = node.sx; continue; }
      if (!goLeft && node.dx) { node = node.dx; continue; }
      // spazio libero: aggancia
      const fresh = { id: ++nodeSeq, val: v, sx: null, dx: null };
      if (goLeft) node.sx = fresh; else node.dx = fresh;
      clearHl();
      render();
      flashAdded(fresh.id);
      setStatus(`<strong>inserisci(${v})</strong> — ${steps} confronti: ${v} ${goLeft ? "<" : ">"} ${node.val}, agganciato a ${goLeft ? "sinistra" : "destra"}.`);
      addLog(`inserisci(${v})`, "ins");
      valInput.value = ""; busy = false; updateButtons(); return;
    }
  }

  async function bstSearch(v) {
    if (busy || !bstRoot) { if (!bstRoot) setStatus("L'albero è vuoto.", true); return; }
    busy = true; updateButtons();
    clearHl();
    let node = bstRoot, steps = 0;
    while (node) {
      hl.visiting.add(node.id); render(); await sleep(420);
      steps++;
      if (v === node.val) {
        hl.found = node.id; render();
        setStatus(`<strong>cerca(${v}) ✓</strong> trovato in ${steps} confronti.`);
        addLog(`cerca(${v}) ✓`);
        await sleep(900); clearHl(); busy = false; updateButtons(); return;
      }
      node = v < node.val ? node.sx : node.dx;
    }
    setStatus(`<strong>cerca(${v}) ✗</strong> non presente (${steps} confronti).`, true);
    addLog(`cerca(${v}) ✗`);
    await sleep(700); clearHl(); busy = false; updateButtons();
  }

  async function bstRemove(v) {
    if (busy) return;
    if (!bstRoot) { setStatus("L'albero è vuoto.", true); return; }
    busy = true; updateButtons();
    clearHl();
    // evidenzia il percorso fino al nodo
    let node = bstRoot, found = false;
    while (node) {
      hl.visiting.add(node.id); render(); await sleep(380);
      if (v === node.val) { found = true; hl.target = node.id; render(); await sleep(450); break; }
      node = v < node.val ? node.sx : node.dx;
    }
    if (!found) {
      setStatus(`<strong>rimuovi(${v})</strong> — valore non trovato.`, true);
      await sleep(500); clearHl(); busy = false; updateButtons(); return;
    }
    bstRoot = deleteNode(bstRoot, v);
    clearHl();
    render();
    setStatus(`<strong>rimuovi(${v})</strong> — nodo eliminato, l'albero si riorganizza mantenendo l'ordine.`);
    addLog(`rimuovi(${v})`, "rem");
    valInput.value = ""; busy = false; updateButtons();
  }

  function deleteNode(root, v) {
    if (!root) return null;
    if (v < root.val) root.sx = deleteNode(root.sx, v);
    else if (v > root.val) root.dx = deleteNode(root.dx, v);
    else {
      if (!root.sx) return root.dx;
      if (!root.dx) return root.sx;
      let succ = root.dx;            // successore in-order = minimo del sottoalbero destro
      while (succ.sx) succ = succ.sx;
      root.val = succ.val;
      root.dx = deleteNode(root.dx, succ.val);
    }
    return root;
  }

  function flashAdded(id) {
    hl.justadded = id; render();
    setTimeout(() => { if (hl.justadded === id) { hl.justadded = null; render(); } }, 450);
  }
  function clearHl() { hl = { visiting: new Set(), found: null, target: null, justadded: null }; }

  /* ============================================================
     UI
     ============================================================ */
  function updateButtons() {
    [btnInsert, btnRemove, btnSearch, btnRandom, btnClear].forEach((b) => { b.disabled = busy; });
  }

  function applyMode() {
    const e = EXPLAIN[mode];
    document.getElementById("explainTitle").textContent = e.title;
    document.getElementById("explainBig").textContent = e.big;
    document.getElementById("explainIdea").textContent = e.idea;
    document.getElementById("explainHow").textContent = e.how;
    document.getElementById("explainAnalogy").textContent = e.analogy;
    document.getElementById("explainCost").textContent = e.cost;
    btnInsert.textContent = e.ins;
    btnRemove.textContent = e.rem;
    btnSearch.hidden = mode !== "bst";
    applyCode();
    clearHl();
    render();
    setStatus(mode === "bst" ? "Inserisci dei numeri e guarda l'albero crescere ordinato." :
              mode === "queue" ? "Enqueue aggiunge in fondo, Dequeue toglie dalla testa." :
              "Push aggiunge in cima, Pop toglie dalla cima.");
  }

  function applyCode() { codeEl.textContent = CODE[mode][lang]; }

  // mode seg
  document.getElementById("modeSeg").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".seg-btn"); if (!btn || busy) return;
    document.querySelectorAll("#modeSeg .seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
    applyMode();
  });
  // lang seg
  document.getElementById("langSeg").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".seg-btn"); if (!btn) return;
    document.querySelectorAll("#langSeg .seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    lang = btn.dataset.lang;
    applyCode();
  });

  btnInsert.addEventListener("click", doInsert);
  btnRemove.addEventListener("click", doRemove);
  btnSearch.addEventListener("click", () => { const v = readVal(true); if (v !== null) bstSearch(v); });
  btnRandom.addEventListener("click", () => {
    if (busy) return;
    valInput.value = String(Math.floor(Math.random() * 99) + 1);
    doInsert();
  });
  btnClear.addEventListener("click", () => {
    if (busy) return;
    stackArr = []; queueArr = []; bstRoot = null; clearHl();
    logEl.innerHTML = '<span class="sd-log-empty">nessuna operazione</span>';
    render();
    setStatus("Struttura svuotata.");
  });
  valInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doInsert(); });

  /* ---------- Avvio ---------- */
  logEl.innerHTML = '<span class="sd-log-empty">nessuna operazione</span>';
  applyMode();
  // popola la pila con un piccolo esempio iniziale
  stackArr = [5, 12, 8];
  render();
  setStatus("Push aggiunge in cima, Pop toglie dalla cima.");
})();
