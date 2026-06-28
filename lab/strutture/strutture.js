/* ============================================================
   strutture.js — Visualizzatore di strutture dati
   Array · Lista concatenata · Tupla · Pila (LIFO) · Coda (FIFO) ·
   Dizionario · Set · Albero Binario di Ricerca.
   Inserimento, rimozione e ricerca animati, con costi (O) e codice
   in Python/Java/C++. Zero backend.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Stato ---------- */
  let mode = "array";
  let lang = "python";

  let arr = [];            // array
  let list = [];           // lista concatenata (stessa idea, reso con nodi+frecce)
  let tuple = [];          // tupla (immutabile)
  let stackArr = [];       // pila
  let queueArr = [];       // coda
  let dict = [];           // [{key, value}] (chiavi uniche, ordine d'inserimento)
  let setArr = [];         // insieme (valori unici)
  let bstRoot = null;      // albero
  let nodeSeq = 0;
  let busy = false;

  let hl = { visiting: new Set(), found: null, target: null, justadded: null }; // BST
  let mark = {};           // evidenziazione per le altre strutture

  const MAX = { array: 12, list: 10, tuple: 10, stack: 10, queue: 12, dict: 8, set: 12, bst: 40 };

  /* ---------- DOM ---------- */
  const stage = document.getElementById("stage");
  const valInput = document.getElementById("valInput");
  const auxInput = document.getElementById("auxInput");
  const auxGroup = document.getElementById("auxGroup");
  const auxLabel = document.getElementById("auxLabel");
  const valLabel = document.getElementById("valLabel");
  const btnInsert = document.getElementById("btnInsert");
  const btnRemove = document.getElementById("btnRemove");
  const btnSearch = document.getElementById("btnSearch");
  const btnRandom = document.getElementById("btnRandom");
  const btnClear = document.getElementById("btnClear");
  const statusEl = document.getElementById("status");
  const logEl = document.getElementById("log");
  const codeEl = document.getElementById("code");

  const sleep = (ms) => new Promise((r) => setTimeout(r, prefersReducedMotion ? 0 : ms));
  const val = () => valInput.value.trim();
  const aux = () => auxInput.value.trim();

  /* ============================================================
     Metadati per modalità: etichette pulsanti, campi visibili
     ============================================================ */
  const META = {
    array: { ins: "Inserisci", rem: "Rimuovi", search: "Cerca / Vai", auxShow: true, auxLabel: "Indice", searchShow: true, valLabel: "Valore", auxPh: "facolt.", valPh: "es. 42" },
    list:  { ins: "Inserisci", rem: "Rimuovi", search: "Cerca / Vai", auxShow: true, auxLabel: "Indice", searchShow: true, valLabel: "Valore", auxPh: "facolt.", valPh: "es. 7" },
    tuple: { ins: "Inserisci", rem: "Rimuovi", search: "Vai a indice", auxShow: true, auxLabel: "Indice", searchShow: true, valLabel: "Valore", auxPh: "es. 1", valPh: "—" },
    stack: { ins: "Push ▲", rem: "Pop ▼", auxShow: false, searchShow: false, valLabel: "Valore", valPh: "es. 42" },
    queue: { ins: "Enqueue ▸", rem: "Dequeue ▸", auxShow: false, searchShow: false, valLabel: "Valore", valPh: "es. 42" },
    dict:  { ins: "Inserisci", rem: "Rimuovi", search: "Cerca", auxShow: true, auxLabel: "Chiave", searchShow: true, valLabel: "Valore", auxPh: "es. mela", valPh: "es. 3" },
    set:   { ins: "Aggiungi", rem: "Rimuovi", search: "Contiene?", auxShow: false, searchShow: true, valLabel: "Valore", valPh: "es. 42" },
    bst:   { ins: "Inserisci +", rem: "Rimuovi −", search: "Cerca ⌕", auxShow: false, searchShow: true, valLabel: "Valore", valPh: "es. 42", numeric: true },
  };

  /* ============================================================
     Contenuti didattici
     ============================================================ */
  const EXPLAIN = {
    array: { title: "Array", big: "indicizzato",
      idea: "Una sequenza di celle in memoria, numerate da 0. Conosci la posizione (l'indice) e arrivi subito all'elemento.",
      how: "L'accesso per indice è diretto: a[3] è immediato. Inserire o togliere in mezzo invece costa, perché tutti gli elementi successivi vanno spostati.",
      analogy: "Una cassettiera con i cassetti numerati: vai dritto al cassetto giusto.",
      cost: "Accesso per indice O(1). Inserimento/rimozione in mezzo O(n) (spostamento). In fondo O(1)." },
    list: { title: "Lista concatenata", big: "a nodi",
      idea: "Ogni elemento è un nodo che contiene il valore e un puntatore al successivo. I nodi non sono contigui: sono legati da frecce.",
      how: "Per arrivare all'elemento i devi partire dalla testa e seguire la catena. Inserire in testa invece è immediato: basta spostare un puntatore.",
      analogy: "Una caccia al tesoro: ogni biglietto dice dove trovare il prossimo.",
      cost: "Inserimento/rimozione in testa O(1). Accesso per posizione O(n) (devi scorrere)." },
    tuple: { title: "Tupla", big: "immutabile",
      idea: "Come una sequenza ordinata, ma una volta creata NON si può modificare: niente aggiunte, rimozioni o cambi.",
      how: "Puoi leggere gli elementi per indice (t[1]), ma se provi a modificarla ottieni un errore. Per «cambiarla» devi crearne una nuova.",
      analogy: "Una ricevuta stampata: la leggi quante volte vuoi, ma non la riscrivi.",
      cost: "Accesso O(1). Immutabile: nessuna modifica possibile (più sicura e più leggera di una lista)." },
    stack: { title: "Pila — Stack", big: "LIFO",
      idea: "Aggiungi e togli sempre dalla stessa estremità, la cima. L'ultimo che entra è il primo a uscire — Last In, First Out.",
      how: "push() mette in cima, pop() toglie dalla cima. Non puoi toccare gli elementi sotto senza prima togliere quelli sopra.",
      analogy: "La catasta di piatti, o il tasto «Annulla»: l'ultima azione è la prima che annulli.",
      cost: "push, pop e top sono O(1): si lavora solo sulla cima." },
    queue: { title: "Coda — Queue", big: "FIFO",
      idea: "Entri da un capo (fondo) ed esci dall'altro (testa). Il primo che entra è il primo a uscire — First In, First Out.",
      how: "enqueue() aggiunge in fondo, dequeue() toglie dalla testa. Si entra da una parte e si esce dall'altra.",
      analogy: "La fila alla cassa o la coda di stampa: chi arriva prima è servito prima.",
      cost: "enqueue e dequeue sono O(1) tenendo i riferimenti a testa e fondo." },
    dict: { title: "Dizionario", big: "chiave→valore",
      idea: "Associa a ogni chiave (unica) un valore. Trovi il valore partendo dalla chiave, non dalla posizione.",
      how: "d[chiave] = valore inserisce o aggiorna; d[chiave] legge. La chiave fa da «indirizzo» grazie all'hashing, senza scorrere nulla.",
      analogy: "Il vocabolario: cerchi la parola (chiave) e leggi la definizione (valore).",
      cost: "Inserimento, accesso e rimozione O(1) in media (hashing)." },
    set: { title: "Set — Insieme", big: "valori unici",
      idea: "Una collezione di elementi distinti e senza ordine: i duplicati vengono ignorati.",
      how: "add() aggiunge solo se non c'è già; contains() verifica l'appartenenza. Niente posizioni, niente doppioni.",
      analogy: "Un sacchetto di figurine senza doppioni: o ce l'hai o non ce l'hai.",
      cost: "Aggiunta, rimozione e test di appartenenza O(1) in media." },
    bst: { title: "Albero Binario di Ricerca", big: "BST",
      idea: "Ogni nodo ha al massimo due figli: a sinistra solo valori più piccoli, a destra solo più grandi. Questo rende la ricerca velocissima.",
      how: "Per inserire o cercare parti dalla radice: se il valore è minore vai a sinistra, se maggiore a destra. Ti fermi quando lo trovi o trovi posto.",
      analogy: "Cercare sul vocabolario: apri a metà e scarti ogni volta metà delle pagine.",
      cost: "Inserimento, ricerca e rimozione O(log n) in media; O(n) nel caso peggiore (albero «storto»)." },
  };

  const CODE = {
    array: {
      python: `# Array / lista in Python
a = [10, 20, 30]
a.append(40)       # aggiungi in fondo   O(1)
a.insert(1, 15)    # inserisci a indice  O(n)
x = a[2]           # accesso per indice  O(1)
del a[0]           # rimuovi a indice    O(n)`,
      java: `// Array dinamico
ArrayList<Integer> a = new ArrayList<>();
a.add(40);         // aggiungi in fondo   O(1)
a.add(1, 15);      // inserisci a indice  O(n)
int x = a.get(2);  // accesso per indice  O(1)
a.remove(0);       // rimuovi a indice    O(n)`,
      cpp: `// Array dinamico
#include <vector>
std::vector<int> a = {10, 20, 30};
a.push_back(40);            // in fondo    O(1)
a.insert(a.begin()+1, 15);  // a indice    O(n)
int x = a[2];               // per indice  O(1)
a.erase(a.begin());         // a indice    O(n)`,
    },
    list: {
      python: `# Lista concatenata (nodi con puntatore)
class Nodo:
    def __init__(self, v):
        self.val = v
        self.next = None

testa = None
def inserisci_in_testa(v):   # O(1)
    global testa
    n = Nodo(v)
    n.next = testa
    testa = n`,
      java: `// Lista concatenata
class Nodo { int val; Nodo next; Nodo(int v){ val = v; } }

Nodo testa = null;
void inserisciInTesta(int v) {   // O(1)
    Nodo n = new Nodo(v);
    n.next = testa;
    testa = n;
}`,
      cpp: `// Lista concatenata
struct Nodo { int val; Nodo* next = nullptr; };

Nodo* testa = nullptr;
void inserisciInTesta(int v) {   // O(1)
    Nodo* n = new Nodo{v};
    n->next = testa;
    testa = n;
}`,
    },
    tuple: {
      python: `# Tupla: ORDINATA e IMMUTABILE
t = (10, 20, 30)
x = t[1]           # accesso per indice -> 20
len(t)             # quanti elementi
# t[1] = 99        # ERRORE: non si modifica`,
      java: `// Java non ha tuple native: classe immutabile
record Punto(int x, int y) {}    // campi fissi

Punto p = new Punto(10, 20);
int a = p.x();     // lettura -> 10
// p.x = 99;       // ERRORE: è immutabile`,
      cpp: `// Tupla immutabile
#include <tuple>
const std::tuple<int,int,int> t = {10, 20, 30};
int x = std::get<1>(t);   // accesso -> 20
// std::get<1>(t) = 99;   // ERRORE: è const`,
    },
    stack: {
      python: `# Pila (LIFO) con una lista
pila = []
pila.append(x)     # push: in cima
v = pila.pop()     # pop:  dalla cima
t = pila[-1]       # top:  guarda la cima`,
      java: `// Pila (LIFO)
Deque<Integer> pila = new ArrayDeque<>();
pila.push(x);          // in cima
int v = pila.pop();    // dalla cima
int t = pila.peek();   // guarda la cima`,
      cpp: `// Pila (LIFO)
#include <stack>
std::stack<int> pila;
pila.push(x);          // in cima
pila.pop();            // dalla cima
int t = pila.top();    // guarda la cima`,
    },
    queue: {
      python: `# Coda (FIFO)
from collections import deque
coda = deque()
coda.append(x)        # enqueue: in fondo
v = coda.popleft()    # dequeue: dalla testa`,
      java: `// Coda (FIFO)
Queue<Integer> coda = new LinkedList<>();
coda.add(x);           // enqueue: in fondo
int v = coda.poll();   // dequeue: dalla testa
int f = coda.peek();   // guarda la testa`,
      cpp: `// Coda (FIFO)
#include <queue>
std::queue<int> coda;
coda.push(x);          // enqueue: in fondo
coda.pop();            // dequeue: dalla testa
int f = coda.front();  // guarda la testa`,
    },
    dict: {
      python: `# Dizionario: chiave -> valore
d = {"mela": 3, "pera": 5}
d["uva"] = 8       # inserisci/aggiorna  O(1)
v = d["pera"]      # accesso per chiave  O(1)
del d["mela"]      # rimuovi per chiave  O(1)
"uva" in d         # la chiave esiste?`,
      java: `// Mappa: chiave -> valore
HashMap<String,Integer> d = new HashMap<>();
d.put("uva", 8);         // inserisci/aggiorna O(1)
int v = d.get("pera");   // accesso per chiave O(1)
d.remove("mela");        // rimuovi            O(1)
d.containsKey("uva");    // la chiave esiste?`,
      cpp: `// Mappa: chiave -> valore
#include <unordered_map>
std::unordered_map<std::string,int> d;
d["uva"] = 8;            // inserisci/aggiorna O(1)
int v = d["pera"];       // accesso per chiave O(1)
d.erase("mela");         // rimuovi            O(1)
d.count("uva");          // la chiave esiste?`,
    },
    set: {
      python: `# Insieme: elementi UNICI, senza ordine
s = {1, 2, 3}
s.add(4)        # i duplicati si ignorano  O(1)
s.discard(2)    # rimuovi                   O(1)
3 in s          # appartenenza             O(1)`,
      java: `// Insieme: elementi unici
HashSet<Integer> s = new HashSet<>();
s.add(4);            // i duplicati si ignorano O(1)
s.remove(2);         // rimuovi                 O(1)
s.contains(3);       // appartenenza            O(1)`,
      cpp: `// Insieme: elementi unici
#include <unordered_set>
std::unordered_set<int> s = {1, 2, 3};
s.insert(4);     // i duplicati si ignorano  O(1)
s.erase(2);      // rimuovi                   O(1)
s.count(3);      // appartenenza             O(1)`,
    },
    bst: {
      python: `# Albero Binario di Ricerca
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
    return r           # i duplicati si ignorano`,
      java: `// Albero Binario di Ricerca
class Nodo { int val; Nodo sx, dx; Nodo(int v){ val = v; } }

Nodo inserisci(Nodo r, int v) {
    if (r == null) return new Nodo(v);
    if (v < r.val)       r.sx = inserisci(r.sx, v);
    else if (v > r.val)  r.dx = inserisci(r.dx, v);
    return r;          // i duplicati si ignorano
}`,
      cpp: `// Albero Binario di Ricerca
struct Nodo { int val; Nodo *sx = nullptr, *dx = nullptr; };

Nodo* inserisci(Nodo* r, int v) {
    if (!r) return new Nodo{v};
    if (v < r->val)       r->sx = inserisci(r->sx, v);
    else if (v > r->val)  r->dx = inserisci(r->dx, v);
    return r;          // i duplicati si ignorano
}`,
    },
  };

  /* ============================================================
     Render
     ============================================================ */
  function render() {
    ({ array: renderArray, list: renderList, tuple: renderTuple, stack: renderStack,
       queue: renderQueue, dict: renderDict, set: renderSet, bst: renderBST }[mode])();
  }

  const emptyMsg = (t) => `<p class="sd-stack-empty">${t}</p>`;

  function renderArray() {
    if (!arr.length) { stage.innerHTML = `<div class="sd-array">${emptyMsg("Array vuoto.<br>Inserisci un valore.")}</div>`; return; }
    stage.innerHTML = `<div class="sd-array">` + arr.map((v, i) => {
      let c = "sd-cell"; if (mark.idx === i && mark.found) c += " found"; else if (mark.idx === i) c += " visiting"; if (mark.fresh === i) c += " fresh";
      return `<div class="sd-acell"><span class="sd-idx">${i}</span><div class="${c}">${escapeHtml(v)}</div></div>`;
    }).join("") + `</div>`;
  }

  function renderTuple() {
    if (!tuple.length) { stage.innerHTML = `<div class="sd-tuple">${emptyMsg("Tupla vuota.<br>Premi «Casuale» per crearne una.")}</div>`; return; }
    const cells = tuple.map((v, i) => {
      let c = "sd-cell ro"; if (mark.idx === i && mark.found) c += " found"; else if (mark.idx === i) c += " visiting";
      return `<div class="sd-acell"><span class="sd-idx">${i}</span><div class="${c}">${escapeHtml(v)}</div></div>`;
    }).join("");
    stage.innerHTML = `<div class="sd-tuple"><span class="sd-paren">(</span>${cells}<span class="sd-paren">)</span><span class="sd-lock" title="immutabile">🔒</span></div>`;
  }

  function renderList() {
    if (!list.length) { stage.innerHTML = `<div class="sd-list">${emptyMsg("Lista vuota.<br>Inserisci in testa.")}</div>`; return; }
    let html = `<div class="sd-list"><span class="sd-llabel">testa</span><span class="sd-arrow">→</span>`;
    list.forEach((v, i) => {
      let c = "sd-lnode"; if (mark.idx === i && mark.found) c += " found"; else if (mark.idx === i) c += " visiting"; if (mark.fresh === i) c += " fresh";
      html += `<div class="${c}"><span class="sd-lval">${escapeHtml(v)}</span><span class="sd-lnext">●</span></div><span class="sd-arrow">→</span>`;
    });
    html += `<span class="sd-null">NULL</span></div>`;
    stage.innerHTML = html;
  }

  function renderDict() {
    if (!dict.length) { stage.innerHTML = `<div class="sd-dict">${emptyMsg("Dizionario vuoto.<br>Inserisci una coppia chiave : valore.")}</div>`; return; }
    stage.innerHTML = `<div class="sd-dict">` + dict.map((p) => {
      let c = "sd-pair"; if (mark.key === p.key) c += mark.found ? " found" : " visiting"; if (mark.freshKey === p.key) c += " fresh";
      return `<div class="${c}"><span class="sd-key">"${escapeHtml(p.key)}"</span><span class="sd-colon">:</span><span class="sd-dval">${escapeHtml(p.value)}</span></div>`;
    }).join("") + `</div>`;
  }

  function renderSet() {
    if (!setArr.length) { stage.innerHTML = `<div class="sd-set">${emptyMsg("Insieme vuoto.<br>Aggiungi un valore.")}</div>`; return; }
    stage.innerHTML = `<div class="sd-set"><span class="sd-brace">{</span>` + setArr.map((v) => {
      let c = "sd-chip"; if (mark.found === v) c += " found"; if (mark.fresh === v) c += " fresh"; if (mark.dup === v) c += " dup";
      return `<span class="${c}">${escapeHtml(v)}</span>`;
    }).join("") + `<span class="sd-brace">}</span></div>`;
  }

  function renderStack() {
    if (!stackArr.length) { stage.innerHTML = `<div class="sd-stack">${emptyMsg("Pila vuota.<br>Premi <strong>Push</strong> per inserire in cima.")}<div class="sd-stack-base">▒ fondo ▒</div></div>`; return; }
    let cells = "";
    stackArr.forEach((v, i) => {
      const isTop = i === stackArr.length - 1;
      cells += `<div class="sd-cell ${isTop ? "top" : ""}">${escapeHtml(v)}${isTop ? '<span class="sd-ptr">◄ cima (top)</span>' : ""}</div>`;
    });
    stage.innerHTML = `<div class="sd-stack"><div class="sd-stack-base">▒ fondo ▒</div>${cells}</div>`;
  }

  function renderQueue() {
    if (!queueArr.length) { stage.innerHTML = `<div class="sd-queue">${emptyMsg("Coda vuota.<br>Premi <strong>Enqueue</strong> per inserire in fondo.")}</div>`; return; }
    let cells = "";
    queueArr.forEach((v, i) => {
      const isFront = i === 0, isRear = i === queueArr.length - 1;
      const ptr = isFront ? '<span class="sd-ptr front">testa (front)</span>' : isRear ? '<span class="sd-ptr">fondo (rear)</span>' : "";
      cells += `<div class="sd-cell ${isFront ? "front" : ""} ${isRear ? "rear" : ""}">${escapeHtml(v)}${ptr}</div>`;
    });
    stage.innerHTML = `<div class="sd-queue">${cells}</div>`;
  }

  /* ----- BST ----- */
  function layoutBST(root) {
    const pos = {}; let col = 0, maxDepth = 0;
    (function rec(n, d) { if (!n) return; rec(n.sx, d + 1); pos[n.id] = { col: col++, depth: d }; maxDepth = Math.max(maxDepth, d); rec(n.dx, d + 1); })(root, 0);
    return { pos, count: col, maxDepth };
  }
  function renderBST() {
    if (!bstRoot) { stage.innerHTML = `<div class="sd-bst">${emptyMsg("Albero vuoto.<br>Inserisci un numero per creare la radice.")}</div>`; return; }
    const { pos, count, maxDepth } = layoutBST(bstRoot);
    const xGap = 58, yGap = 70, pad = 34, r = 20;
    const w = Math.max(count * xGap, xGap) + pad * 2 - xGap + 2 * r;
    const h = (maxDepth + 1) * yGap + pad;
    const X = (n) => pad + r + pos[n.id].col * xGap;
    const Y = (n) => pad + pos[n.id].depth * yGap;
    let edges = "", circles = "";
    (function rec(n) {
      if (!n) return;
      [n.sx, n.dx].forEach((c) => { if (c) edges += `<line class="sd-edge" x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`; });
      let cls = "sd-node";
      if (hl.visiting.has(n.id)) cls += " visiting";
      if (hl.found === n.id) cls += " found";
      if (hl.target === n.id) cls += " target";
      if (hl.justadded === n.id) cls += " justadded";
      circles += `<g class="${cls}"><circle class="sd-node-circle" cx="${X(n)}" cy="${Y(n)}" r="${r}"/><text class="sd-node-text" x="${X(n)}" y="${Y(n)}">${n.val}</text></g>`;
      rec(n.sx); rec(n.dx);
    })(bstRoot);
    stage.innerHTML = `<div class="sd-bst"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${edges}${circles}</svg></div>`;
  }

  /* ============================================================
     Helpers
     ============================================================ */
  function setStatus(msg, warn) { statusEl.innerHTML = msg; statusEl.style.color = warn ? "#e0533d" : ""; }
  function addLog(text, type) {
    const e = logEl.querySelector(".sd-log-empty"); if (e) e.remove();
    const s = document.createElement("span"); s.className = type || ""; s.textContent = text;
    logEl.prepend(s); while (logEl.children.length > 24) logEl.lastChild.remove();
  }
  function needVal() { setStatus("Scrivi un valore nel campo «Valore».", true); }
  function full() { setStatus("Limite raggiunto per questa visualizzazione (max " + MAX[mode] + ").", true); }
  function clearInputs() { valInput.value = ""; auxInput.value = ""; valInput.focus(); }
  function readInt() { const v = val(); if (v === "") { setStatus("Scrivi un numero.", true); return null; } const n = parseInt(v, 10); if (Number.isNaN(n)) { setStatus("Per l'albero serve un numero intero.", true); return null; } return n; }

  /* ============================================================
     Operazioni — dispatch
     ============================================================ */
  async function doInsert() {
    if (busy) return;
    switch (mode) {
      case "array": return arrayInsert();
      case "list": return listInsert();
      case "tuple": return setStatus("🔒 Le tuple sono immutabili: non puoi aggiungere elementi. Crea una nuova tupla con «Casuale».", true);
      case "stack": return stackPush();
      case "queue": return queueEnqueue();
      case "dict": return dictSet();
      case "set": return setAdd();
      case "bst": { const v = readInt(); if (v !== null) await bstInsert(v); return; }
    }
  }
  async function doRemove() {
    if (busy) return;
    switch (mode) {
      case "array": return arrayRemove();
      case "list": return listRemove();
      case "tuple": return setStatus("🔒 Le tuple sono immutabili: non puoi togliere elementi.", true);
      case "stack": return stackPop();
      case "queue": return queueDequeue();
      case "dict": return dictRemove();
      case "set": return setRemove();
      case "bst": { const v = readInt(); if (v !== null) await bstRemove(v); return; }
    }
  }
  async function doSearch() {
    if (busy) return;
    switch (mode) {
      case "array": return arraySearch();
      case "list": return listSearch();
      case "tuple": return tupleAccess();
      case "dict": return dictSearch();
      case "set": return setContains();
      case "bst": { const v = readInt(); if (v !== null) await bstSearch(v); return; }
    }
  }

  /* ----- ARRAY ----- */
  function arrayInsert() {
    const v = val(); if (!v) return needVal();
    if (arr.length >= MAX.array) return full();
    const a = aux(); let i;
    if (a === "") i = arr.length; else { i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i > arr.length) return setStatus(`Indice non valido (0–${arr.length}).`, true); }
    arr.splice(i, 0, v); mark = { fresh: i }; render();
    setStatus(i === arr.length - 1 ? `<strong>append(${escapeHtml(v)})</strong> — aggiunto in fondo, O(1).` : `<strong>insert(${i}, ${escapeHtml(v)})</strong> — gli elementi dopo si spostano, O(n).`);
    addLog(`ins[${i}]=${v}`, "ins"); clearInputs();
  }
  function arrayRemove() {
    if (!arr.length) return setStatus("L'array è vuoto.", true);
    const a = aux(); let i;
    if (a === "") i = arr.length - 1; else { i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i >= arr.length) return setStatus(`Indice non valido (0–${arr.length - 1}).`, true); }
    const v = arr.splice(i, 1)[0]; mark = {}; render();
    setStatus(i === arr.length ? `<strong>rimosso l'ultimo → ${escapeHtml(v)}</strong> (O(1)).` : `<strong>rimosso a indice ${i} → ${escapeHtml(v)}</strong> — gli altri scalano, O(n).`);
    addLog(`del[${i}]`, "rem"); clearInputs();
  }
  async function arraySearch() {
    const a = aux();
    if (a !== "") {
      const i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i >= arr.length) return setStatus(`Indice non valido (0–${arr.length - 1}).`, true);
      busy = true; updateButtons(); mark = { idx: i, found: true }; render();
      setStatus(`<strong>a[${i}] = ${escapeHtml(arr[i])}</strong> — accesso diretto per indice, O(1).`);
      await sleep(900); mark = {}; render(); busy = false; updateButtons(); return;
    }
    const v = val(); if (!v) return setStatus("Scrivi un valore da cercare, oppure un indice.", true);
    busy = true; updateButtons();
    for (let i = 0; i < arr.length; i++) {
      mark = { idx: i }; render(); await sleep(320);
      if (String(arr[i]) === v) { mark = { idx: i, found: true }; render(); setStatus(`<strong>${escapeHtml(v)} trovato all'indice ${i}</strong> dopo ${i + 1} confronti (ricerca lineare, O(n)).`); addLog(`cerca ${v} ✓`); await sleep(800); mark = {}; render(); busy = false; updateButtons(); return; }
    }
    setStatus(`<strong>${escapeHtml(v)} non trovato</strong> (${arr.length} confronti, O(n)).`, true); addLog(`cerca ${v} ✗`); mark = {}; render(); busy = false; updateButtons();
  }

  /* ----- LISTA ----- */
  function listInsert() {
    const v = val(); if (!v) return needVal();
    if (list.length >= MAX.list) return full();
    const a = aux(); let i, head = false;
    if (a === "") { i = 0; head = true; } else { i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i > list.length) return setStatus(`Indice non valido (0–${list.length}).`, true); }
    list.splice(i, 0, v); mark = { fresh: i }; render();
    setStatus(head ? `<strong>inserisci in testa ${escapeHtml(v)}</strong> — basta spostare un puntatore, O(1).` : `<strong>inserisci ${escapeHtml(v)} in posizione ${i}</strong> — bisogna arrivarci scorrendo, O(n).`);
    addLog(`ins ${v}`, "ins"); clearInputs();
  }
  function listRemove() {
    if (!list.length) return setStatus("La lista è vuota.", true);
    const a = aux(); let i;
    if (a === "") i = 0; else { i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i >= list.length) return setStatus(`Indice non valido (0–${list.length - 1}).`, true); }
    const v = list.splice(i, 1)[0]; mark = {}; render();
    setStatus(i === 0 ? `<strong>rimuovi la testa → ${escapeHtml(v)}</strong> (O(1)).` : `<strong>rimuovi in posizione ${i} → ${escapeHtml(v)}</strong> (O(n)).`);
    addLog(`del ${i}`, "rem"); clearInputs();
  }
  async function listSearch() {
    if (!list.length) return setStatus("La lista è vuota.", true);
    const a = aux(); busy = true; updateButtons();
    if (a !== "") {
      const i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i >= list.length) { setStatus(`Indice non valido (0–${list.length - 1}).`, true); busy = false; updateButtons(); return; }
      for (let k = 0; k <= i; k++) { mark = { idx: k, found: k === i }; render(); await sleep(380); }
      setStatus(`<strong>elemento ${i} = ${escapeHtml(list[i])}</strong> — per arrivarci ho scorso ${i + 1} nodi: niente accesso diretto, O(n).`);
      await sleep(700); mark = {}; render(); busy = false; updateButtons(); return;
    }
    const v = val(); if (!v) { setStatus("Scrivi un valore da cercare, oppure un indice.", true); busy = false; updateButtons(); return; }
    for (let i = 0; i < list.length; i++) {
      mark = { idx: i }; render(); await sleep(360);
      if (String(list[i]) === v) { mark = { idx: i, found: true }; render(); setStatus(`<strong>${escapeHtml(v)} trovato dopo ${i + 1} nodi</strong> (O(n)).`); addLog(`cerca ${v} ✓`); await sleep(700); mark = {}; render(); busy = false; updateButtons(); return; }
    }
    setStatus(`<strong>${escapeHtml(v)} non presente</strong> (scorsi ${list.length} nodi).`, true); addLog(`cerca ${v} ✗`); mark = {}; render(); busy = false; updateButtons();
  }

  /* ----- TUPLA ----- */
  async function tupleAccess() {
    const a = aux(); if (a === "") return setStatus("Scrivi un indice per leggere t[i].", true);
    const i = parseInt(a, 10); if (Number.isNaN(i) || i < 0 || i >= tuple.length) return setStatus("Indice fuori dai limiti della tupla.", true);
    busy = true; updateButtons(); mark = { idx: i, found: true }; render();
    setStatus(`<strong>t[${i}] = ${escapeHtml(tuple[i])}</strong> — leggere si può (O(1)); modificare no.`);
    await sleep(900); mark = {}; render(); busy = false; updateButtons();
  }

  /* ----- PILA ----- */
  function stackPush() {
    const v = val(); if (!v) return needVal();
    if (stackArr.length >= MAX.stack) return full();
    stackArr.push(v); render();
    const top = stage.querySelector(".sd-stack .sd-cell.top"); if (top) top.classList.add("enter-top");
    setStatus(`<strong>push(${escapeHtml(v)})</strong> — l'elemento entra in cima.`); addLog(`push(${v})`, "ins"); clearInputs();
  }
  async function stackPop() {
    if (!stackArr.length) return setStatus("La pila è vuota: niente da togliere.", true);
    busy = true; updateButtons();
    const top = stage.querySelector(".sd-stack .sd-cell.top"); if (top) { top.classList.add("leave-top"); await sleep(300); }
    const v = stackArr.pop(); render();
    setStatus(`<strong>pop() → ${escapeHtml(v)}</strong> — esce l'ultimo entrato (LIFO).`); addLog(`pop() → ${v}`, "rem");
    busy = false; updateButtons();
  }

  /* ----- CODA ----- */
  function queueEnqueue() {
    const v = val(); if (!v) return needVal();
    if (queueArr.length >= MAX.queue) return full();
    queueArr.push(v); render();
    const rear = stage.querySelector(".sd-queue .sd-cell.rear"); if (rear) rear.classList.add("enter-right");
    setStatus(`<strong>enqueue(${escapeHtml(v)})</strong> — l'elemento entra in fondo.`); addLog(`enqueue(${v})`, "ins"); clearInputs();
  }
  async function queueDequeue() {
    if (!queueArr.length) return setStatus("La coda è vuota: niente da togliere.", true);
    busy = true; updateButtons();
    const front = stage.querySelector(".sd-queue .sd-cell.front"); if (front) { front.classList.add("leave-left"); await sleep(300); }
    const v = queueArr.shift(); render();
    setStatus(`<strong>dequeue() → ${escapeHtml(v)}</strong> — esce il primo entrato (FIFO).`); addLog(`dequeue() → ${v}`, "rem");
    busy = false; updateButtons();
  }

  /* ----- DIZIONARIO ----- */
  function dictSet() {
    const k = aux(); const v = val();
    if (!k) return setStatus("Scrivi la chiave nel campo «Chiave».", true);
    if (!v) return setStatus("Scrivi il valore nel campo «Valore».", true);
    const i = dict.findIndex((p) => p.key === k);
    if (i >= 0) { dict[i].value = v; mark = { key: k }; render(); setStatus(`<strong>d["${escapeHtml(k)}"] = ${escapeHtml(v)}</strong> — chiave già presente: valore aggiornato.`); }
    else { if (dict.length >= MAX.dict) return full(); dict.push({ key: k, value: v }); mark = { key: k, freshKey: k }; render(); setStatus(`<strong>d["${escapeHtml(k)}"] = ${escapeHtml(v)}</strong> — nuova coppia (O(1)).`); }
    addLog(`set ${k}`, "ins"); clearInputs();
  }
  function dictRemove() {
    const k = aux(); if (!k) return setStatus("Scrivi la chiave da rimuovere.", true);
    const i = dict.findIndex((p) => p.key === k); if (i < 0) return setStatus(`La chiave "${escapeHtml(k)}" non esiste.`, true);
    dict.splice(i, 1); mark = {}; render(); setStatus(`<strong>del d["${escapeHtml(k)}"]</strong> — coppia rimossa (O(1)).`); addLog(`del ${k}`, "rem"); clearInputs();
  }
  async function dictSearch() {
    const k = aux(); if (!k) return setStatus("Scrivi la chiave da cercare.", true);
    const p = dict.find((x) => x.key === k); busy = true; updateButtons();
    if (p) { mark = { key: k, found: true }; render(); setStatus(`<strong>d["${escapeHtml(k)}"] → ${escapeHtml(p.value)}</strong> — trovato subito via hashing (O(1)), senza scorrere.`); addLog(`get ${k} ✓`); }
    else { setStatus(`<strong>"${escapeHtml(k)}" non presente</strong>.`, true); addLog(`get ${k} ✗`); }
    await sleep(900); mark = {}; render(); busy = false; updateButtons();
  }

  /* ----- SET ----- */
  function setAdd() {
    const v = val(); if (!v) return needVal();
    if (setArr.includes(v)) { mark = { dup: v }; render(); setStatus(`<strong>${escapeHtml(v)} c'è già</strong>: in un insieme i duplicati si ignorano.`, true); setTimeout(() => { mark = {}; render(); }, 600); return; }
    if (setArr.length >= MAX.set) return full();
    setArr.push(v); mark = { fresh: v }; render(); setStatus(`<strong>add(${escapeHtml(v)})</strong> — aggiunto (O(1)).`); addLog(`add ${v}`, "ins"); clearInputs();
  }
  function setRemove() {
    const v = val(); if (!v) return setStatus("Scrivi il valore da rimuovere.", true);
    const i = setArr.indexOf(v); if (i < 0) return setStatus(`${escapeHtml(v)} non è nell'insieme.`, true);
    setArr.splice(i, 1); mark = {}; render(); setStatus(`<strong>discard(${escapeHtml(v)})</strong> — rimosso (O(1)).`); addLog(`del ${v}`, "rem"); clearInputs();
  }
  async function setContains() {
    const v = val(); if (!v) return setStatus("Scrivi il valore da verificare.", true);
    busy = true; updateButtons();
    if (setArr.includes(v)) { mark = { found: v }; render(); setStatus(`<strong>${escapeHtml(v)} ∈ insieme</strong> — appartenenza verificata in O(1).`); addLog(`${v} ∈ ✓`); }
    else { setStatus(`<strong>${escapeHtml(v)} ∉ insieme</strong> — non c'è.`, true); addLog(`${v} ∉ ✗`); }
    await sleep(800); mark = {}; render(); busy = false; updateButtons();
  }

  /* ----- BST ----- */
  function plainInsert(root, v) {
    if (!root) return { id: ++nodeSeq, val: v, sx: null, dx: null };
    if (v < root.val) root.sx = plainInsert(root.sx, v); else if (v > root.val) root.dx = plainInsert(root.dx, v);
    return root;
  }
  async function bstInsert(v) {
    busy = true; updateButtons(); hl = { visiting: new Set(), found: null, target: null, justadded: null };
    if (!bstRoot) { bstRoot = { id: ++nodeSeq, val: v, sx: null, dx: null }; render(); flashAdded(bstRoot.id); setStatus(`<strong>inserisci(${v})</strong> — è il primo nodo: diventa la radice.`); addLog(`inserisci(${v})`, "ins"); clearInputs(); busy = false; updateButtons(); return; }
    let node = bstRoot, steps = 0;
    while (true) {
      hl.visiting.add(node.id); render(); await sleep(420);
      if (v === node.val) { setStatus(`<strong>${v}</strong> è già presente: in un BST i duplicati si ignorano.`, true); hl.target = node.id; render(); await sleep(500); clearHl(); busy = false; updateButtons(); return; }
      const goLeft = v < node.val; steps++;
      if (goLeft && node.sx) { node = node.sx; continue; }
      if (!goLeft && node.dx) { node = node.dx; continue; }
      const fresh = { id: ++nodeSeq, val: v, sx: null, dx: null }; if (goLeft) node.sx = fresh; else node.dx = fresh;
      clearHl(); render(); flashAdded(fresh.id);
      setStatus(`<strong>inserisci(${v})</strong> — ${steps} confronti: ${v} ${goLeft ? "<" : ">"} ${node.val}, agganciato a ${goLeft ? "sinistra" : "destra"}.`);
      addLog(`inserisci(${v})`, "ins"); clearInputs(); busy = false; updateButtons(); return;
    }
  }
  async function bstSearch(v) {
    if (!bstRoot) return setStatus("L'albero è vuoto.", true);
    busy = true; updateButtons(); clearHl();
    let node = bstRoot, steps = 0;
    while (node) {
      hl.visiting.add(node.id); render(); await sleep(420); steps++;
      if (v === node.val) { hl.found = node.id; render(); setStatus(`<strong>cerca(${v}) ✓</strong> trovato in ${steps} confronti.`); addLog(`cerca(${v}) ✓`); await sleep(900); clearHl(); busy = false; updateButtons(); return; }
      node = v < node.val ? node.sx : node.dx;
    }
    setStatus(`<strong>cerca(${v}) ✗</strong> non presente (${steps} confronti).`, true); addLog(`cerca(${v}) ✗`); await sleep(700); clearHl(); busy = false; updateButtons();
  }
  async function bstRemove(v) {
    if (!bstRoot) return setStatus("L'albero è vuoto.", true);
    busy = true; updateButtons(); clearHl();
    let node = bstRoot, found = false;
    while (node) { hl.visiting.add(node.id); render(); await sleep(380); if (v === node.val) { found = true; hl.target = node.id; render(); await sleep(450); break; } node = v < node.val ? node.sx : node.dx; }
    if (!found) { setStatus(`<strong>rimuovi(${v})</strong> — valore non trovato.`, true); await sleep(500); clearHl(); busy = false; updateButtons(); return; }
    bstRoot = deleteNode(bstRoot, v); clearHl(); render();
    setStatus(`<strong>rimuovi(${v})</strong> — nodo eliminato, l'albero si riorganizza mantenendo l'ordine.`); addLog(`rimuovi(${v})`, "rem"); clearInputs(); busy = false; updateButtons();
  }
  function deleteNode(root, v) {
    if (!root) return null;
    if (v < root.val) root.sx = deleteNode(root.sx, v);
    else if (v > root.val) root.dx = deleteNode(root.dx, v);
    else { if (!root.sx) return root.dx; if (!root.dx) return root.sx; let s = root.dx; while (s.sx) s = s.sx; root.val = s.val; root.dx = deleteNode(root.dx, s.val); }
    return root;
  }
  function flashAdded(id) { hl.justadded = id; render(); setTimeout(() => { if (hl.justadded === id) { hl.justadded = null; render(); } }, 450); }
  function clearHl() { hl = { visiting: new Set(), found: null, target: null, justadded: null }; }

  /* ============================================================
     UI
     ============================================================ */
  function updateButtons() { [btnInsert, btnRemove, btnSearch, btnRandom, btnClear].forEach((b) => { b.disabled = busy; }); }

  function applyMode() {
    const m = META[mode], e = EXPLAIN[mode];
    document.getElementById("explainTitle").textContent = e.title;
    document.getElementById("explainBig").textContent = e.big;
    document.getElementById("explainIdea").textContent = e.idea;
    document.getElementById("explainHow").textContent = e.how;
    document.getElementById("explainAnalogy").textContent = e.analogy;
    document.getElementById("explainCost").textContent = e.cost;
    btnInsert.textContent = m.ins; btnRemove.textContent = m.rem;
    btnSearch.hidden = !m.searchShow; if (m.searchShow) btnSearch.textContent = m.search;
    auxGroup.hidden = !m.auxShow; if (m.auxShow) { auxLabel.textContent = m.auxLabel; auxInput.placeholder = m.auxPh || ""; }
    valLabel.textContent = m.valLabel; valInput.placeholder = m.valPh || "";
    mark = {}; clearHl(); applyCode(); render();
    setStatus(`<strong>${e.title}</strong> — ${e.big}. ${m.auxShow ? (mode === "dict" ? "Inserisci chiave e valore." : "Indice facoltativo per scegliere la posizione.") : "Inserisci un valore per provare."}`);
  }
  function applyCode() { codeEl.textContent = CODE[mode][lang]; }

  document.getElementById("modeSeg").addEventListener("click", (ev) => {
    const b = ev.target.closest(".seg-btn"); if (!b || busy) return;
    document.querySelectorAll("#modeSeg .seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    mode = b.dataset.mode; applyMode();
  });
  document.getElementById("langSeg").addEventListener("click", (ev) => {
    const b = ev.target.closest(".seg-btn"); if (!b) return;
    document.querySelectorAll("#langSeg .seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    lang = b.dataset.lang; applyCode();
  });

  btnInsert.addEventListener("click", doInsert);
  btnRemove.addEventListener("click", doRemove);
  btnSearch.addEventListener("click", doSearch);
  btnRandom.addEventListener("click", () => {
    if (busy) return;
    if (mode === "dict") { const ks = ["mela", "pera", "uva", "kiwi", "fico", "noce", "riso", "sale"]; auxInput.value = ks[Math.floor(Math.random() * ks.length)]; valInput.value = String(Math.floor(Math.random() * 9) + 1); return dictSet(); }
    if (mode === "tuple") { tuple = Array.from({ length: 4 }, () => String(Math.floor(Math.random() * 90) + 10)); mark = {}; render(); setStatus("Nuova tupla creata. È immutabile: prova a modificarla e guarda cosa succede!"); return; }
    valInput.value = String(Math.floor(Math.random() * 99) + 1); auxInput.value = ""; doInsert();
  });
  btnClear.addEventListener("click", () => {
    if (busy) return;
    arr = []; list = []; tuple = []; stackArr = []; queueArr = []; dict = []; setArr = []; bstRoot = null;
    mark = {}; clearHl(); logEl.innerHTML = '<span class="sd-log-empty">nessuna operazione</span>'; render();
    setStatus("Struttura svuotata.");
  });
  valInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doInsert(); });
  auxInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doInsert(); });

  /* ---------- Avvio: esempi precaricati ---------- */
  arr = ["10", "20", "30", "40"];
  list = ["7", "3", "9"];
  tuple = ["12", "25", "37"];
  stackArr = ["5", "12", "8"];
  queueArr = ["3", "7", "1"];
  dict = [{ key: "mela", value: "3" }, { key: "pera", value: "5" }];
  setArr = ["2", "4", "6"];
  [50, 30, 70, 20, 40, 60].forEach((v) => { bstRoot = plainInsert(bstRoot, v); });

  logEl.innerHTML = '<span class="sd-log-empty">nessuna operazione</span>';
  applyMode();
})();
