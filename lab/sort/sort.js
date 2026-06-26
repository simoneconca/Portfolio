/* ============================================================
   sort.js — Visualizzatore di algoritmi di ordinamento
   Passo-passo sulle barre + codice in C, C++, Java, Python
   con la riga in esecuzione evidenziata. Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- Generatore di frame ---------- */
  function gen(src, fn) {
    const a = src.slice(); const frames = []; let comp = 0, mov = 0;
    const snap = (active, sorted, line, desc, pivot) =>
      frames.push({ a: a.slice(), active: active || [], sorted: (sorted || []).slice(),
                    line: line || null, desc: desc || "", pivot: pivot == null ? -1 : pivot, comp, mov });
    fn({ a, snap, cmp: () => comp++, move: () => mov++ });
    return frames;
  }

  function bubble(c) {
    const a = c.a, n = a.length, sorted = [];
    c.snap([], sorted, null, "Array di partenza");
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        c.cmp(); c.snap([j, j + 1], sorted, "compare", `Confronto a[${j}]=${a[j]} e a[${j + 1}]=${a[j + 1]}`);
        if (a[j] > a[j + 1]) { const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; c.move(); c.snap([j, j + 1], sorted, "swap", `${a[j + 1]} > ${a[j]}: li scambio`); }
      }
      sorted.push(n - 1 - i);
    }
    sorted.push(0); c.snap([], sorted, null, "Array ordinato");
  }

  function selection(c) {
    const a = c.a, n = a.length, sorted = [];
    c.snap([], sorted, null, "Array di partenza");
    for (let i = 0; i < n; i++) {
      let mi = i; c.snap([i], sorted, "min", `Cerco il minimo a partire da ${i}`);
      for (let j = i + 1; j < n; j++) {
        c.cmp(); c.snap([mi, j], sorted, "compare", `a[${j}]=${a[j]} < minimo (${a[mi]})?`);
        if (a[j] < a[mi]) { mi = j; c.snap([mi], sorted, "min", `Nuovo minimo: a[${mi}]=${a[mi]}`); }
      }
      if (mi !== i) { const t = a[i]; a[i] = a[mi]; a[mi] = t; c.move(); c.snap([i, mi], sorted, "swap", `Porto il minimo in posizione ${i}`); }
      sorted.push(i);
    }
    c.snap([], sorted, null, "Array ordinato");
  }

  function insertion(c) {
    const a = c.a, n = a.length; let sorted = [0];
    c.snap([], sorted, null, "Array di partenza");
    for (let i = 1; i < n; i++) {
      const key = a[i]; let j = i - 1;
      c.snap([i], sorted, "key", `Estraggo a[${i}]=${key}`);
      while (j >= 0 && a[j] > key) {
        c.cmp(); c.snap([j, j + 1], sorted, "compare", `a[${j}]=${a[j]} > ${key}`);
        a[j + 1] = a[j]; c.move(); c.snap([j, j + 1], sorted, "shift", `Sposto ${a[j]} a destra`);
        j--;
      }
      if (j >= 0) { c.cmp(); c.snap([j, j + 1], sorted, "compare", `a[${j}]=${a[j]} ≤ ${key}: mi fermo`); }
      a[j + 1] = key; c.move();
      sorted = []; for (let k = 0; k <= i; k++) sorted.push(k);
      c.snap([j + 1], sorted, "insert", `Inserisco ${key} in posizione ${j + 1}`);
    }
    c.snap([], sorted, null, "Array ordinato");
  }

  function merge(c) {
    const a = c.a, n = a.length;
    c.snap([], [], null, "Array di partenza");
    function mrg(l, m, r) {
      const L = a.slice(l, m + 1), R = a.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      while (i < L.length && j < R.length) {
        c.cmp(); c.snap([l + i, m + 1 + j], [], "compare", `Confronto ${L[i]} e ${R[j]}`);
        if (L[i] <= R[j]) a[k] = L[i++]; else a[k] = R[j++];
        c.move(); c.snap([k], [], "copy", `Scrivo ${a[k]} in posizione ${k}`); k++;
      }
      while (i < L.length) { a[k] = L[i++]; c.move(); c.snap([k], [], "copy", `Copio ${a[k]} in ${k}`); k++; }
      while (j < R.length) { a[k] = R[j++]; c.move(); c.snap([k], [], "copy", `Copio ${a[k]} in ${k}`); k++; }
    }
    (function ms(l, r) { if (l >= r) return; const m = (l + r) >> 1; ms(l, m); ms(m + 1, r); mrg(l, m, r); })(0, n - 1);
    const all = []; for (let k = 0; k < n; k++) all.push(k);
    c.snap([], all, null, "Array ordinato");
  }

  function quick(c) {
    const a = c.a, n = a.length, sorted = [];
    c.snap([], sorted, null, "Array di partenza");
    (function qs(lo, hi) {
      if (lo > hi) return;
      if (lo === hi) { sorted.push(lo); return; }
      const pivot = a[hi];
      c.snap([hi], sorted, "pivot", `Scelgo il pivot: a[${hi}]=${pivot}`, hi);
      let i = lo;
      for (let j = lo; j < hi; j++) {
        c.cmp(); c.snap([j], sorted, "compare", `a[${j}]=${a[j]} < pivot ${pivot}?`, hi);
        if (a[j] < pivot) { if (i !== j) { const t = a[i]; a[i] = a[j]; a[j] = t; c.move(); c.snap([i, j], sorted, "swap", `Sposto ${a[i]} a sinistra`, hi); } i++; }
      }
      if (i !== hi) { const t = a[i]; a[i] = a[hi]; a[hi] = t; c.move(); }
      c.snap([i], sorted, "swap", `Pivot ${pivot} al suo posto (${i})`, i);
      sorted.push(i);
      qs(lo, i - 1); qs(i + 1, hi);
    })(0, n - 1);
    const all = []; for (let k = 0; k < n; k++) all.push(k);
    c.snap([], all, null, "Array ordinato");
  }

  /* ---------- Codice nei 4 linguaggi (//@chiave = riga evidenziabile) ---------- */
  const ALGOS = {
    bubble: { name: "Bubble Sort", big: "O(n²)", gen: bubble,
      explain: {
        idea: "Confronta due elementi vicini e li scambia se sono nell'ordine sbagliato, ripetendo finché la lista è tutta in ordine.",
        how: "Scorre la lista da sinistra a destra confrontando ogni coppia di elementi vicini: se il primo è più grande del secondo, li scambia. A ogni passata il valore più grande \"galleggia\" fino in fondo, come una bolla, e la parte ordinata cresce da destra.",
        analogy: "Come sistemare una fila di persone per altezza guardando solo due vicini alla volta e facendoli cambiare posto quando sono invertiti.",
        note: "È il più facile da capire e da scrivere, ma anche il più lento: con tanti elementi fa moltissimi confronti."
      },
      code: {
      c: `void bubbleSort(int a[], int n) {
  for (int i = 0; i < n - 1; i++)
    for (int j = 0; j < n - 1 - i; j++)
      if (a[j] > a[j + 1]) {        //@compare
        int t = a[j];               //@swap
        a[j] = a[j + 1];
        a[j + 1] = t;
      }
}`,
      cpp: `void bubbleSort(vector<int>& a) {
  int n = a.size();
  for (int i = 0; i < n - 1; i++)
    for (int j = 0; j < n - 1 - i; j++)
      if (a[j] > a[j + 1])          //@compare
        swap(a[j], a[j + 1]);       //@swap
}`,
      java: `void bubbleSort(int[] a) {
  int n = a.length;
  for (int i = 0; i < n - 1; i++)
    for (int j = 0; j < n - 1 - i; j++)
      if (a[j] > a[j + 1]) {        //@compare
        int t = a[j];               //@swap
        a[j] = a[j + 1];
        a[j + 1] = t;
      }
}`,
      python: `def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:           #@compare
                a[j], a[j+1] = a[j+1], a[j]   #@swap` } },

    selection: { name: "Selection Sort", big: "O(n²)", gen: selection,
      explain: {
        idea: "Cerca ogni volta l'elemento più piccolo rimasto e lo porta al suo posto.",
        how: "Guarda tutta la parte non ancora ordinata e trova il minimo, poi lo scambia con il primo elemento di quella parte. Sposta l'inizio di una posizione e ripete: la parte ordinata cresce da sinistra.",
        analogy: "Come scegliere da un mazzo di carte ogni volta la più bassa e metterla in fila, una dopo l'altra.",
        note: "Fa pochissimi scambi (utile quando spostare gli elementi costa), ma controlla comunque sempre tanti elementi."
      },
      code: {
      c: `void selectionSort(int a[], int n) {
  for (int i = 0; i < n; i++) {
    int min = i;                    //@min
    for (int j = i + 1; j < n; j++)
      if (a[j] < a[min])            //@compare
        min = j;                    //@min
    int t = a[i]; a[i] = a[min]; a[min] = t;  //@swap
  }
}`,
      cpp: `void selectionSort(vector<int>& a) {
  int n = a.size();
  for (int i = 0; i < n; i++) {
    int mn = i;                     //@min
    for (int j = i + 1; j < n; j++)
      if (a[j] < a[mn])             //@compare
        mn = j;                     //@min
    swap(a[i], a[mn]);              //@swap
  }
}`,
      java: `void selectionSort(int[] a) {
  for (int i = 0; i < a.length; i++) {
    int min = i;                    //@min
    for (int j = i + 1; j < a.length; j++)
      if (a[j] < a[min])            //@compare
        min = j;                    //@min
    int t = a[i]; a[i] = a[min]; a[min] = t;  //@swap
  }
}`,
      python: `def selection_sort(a):
    for i in range(len(a)):
        mn = i                       #@min
        for j in range(i + 1, len(a)):
            if a[j] < a[mn]:         #@compare
                mn = j               #@min
        a[i], a[mn] = a[mn], a[i]    #@swap` } },

    insertion: { name: "Insertion Sort", big: "O(n²)", gen: insertion,
      explain: {
        idea: "Prende un elemento alla volta e lo infila nel punto giusto tra quelli già ordinati.",
        how: "Considera il primo elemento come già a posto. Prende il successivo (la \"chiave\"), lo confronta all'indietro con quelli già sistemati e li sposta di un posto a destra finché trova dove inserirlo.",
        analogy: "Proprio come si ordinano le carte da gioco in mano: ne peschi una e la inserisci al punto giusto tra quelle che hai già sistemato.",
        note: "Velocissimo se la lista è già quasi ordinata ed efficiente sulle liste piccole. Rallenta nel caso peggiore."
      },
      code: {
      c: `void insertionSort(int a[], int n) {
  for (int i = 1; i < n; i++) {
    int key = a[i], j = i - 1;      //@key
    while (j >= 0 && a[j] > key) {  //@compare
      a[j + 1] = a[j];              //@shift
      j--;
    }
    a[j + 1] = key;                 //@insert
  }
}`,
      cpp: `void insertionSort(vector<int>& a) {
  for (int i = 1; i < a.size(); i++) {
    int key = a[i], j = i - 1;      //@key
    while (j >= 0 && a[j] > key) {  //@compare
      a[j + 1] = a[j];              //@shift
      j--;
    }
    a[j + 1] = key;                 //@insert
  }
}`,
      java: `void insertionSort(int[] a) {
  for (int i = 1; i < a.length; i++) {
    int key = a[i], j = i - 1;      //@key
    while (j >= 0 && a[j] > key) {  //@compare
      a[j + 1] = a[j];              //@shift
      j--;
    }
    a[j + 1] = key;                 //@insert
  }
}`,
      python: `def insertion_sort(a):
    for i in range(1, len(a)):
        key, j = a[i], i - 1         #@key
        while j >= 0 and a[j] > key: #@compare
            a[j + 1] = a[j]          #@shift
            j -= 1
        a[j + 1] = key               #@insert` } },

    merge: { name: "Merge Sort", big: "O(n log n)", gen: merge,
      explain: {
        idea: "Divide la lista a metà, ordina le due metà e poi le fonde insieme già in ordine.",
        how: "Usa la strategia \"divide et impera\": continua a dividere la lista in due finché restano pezzetti da un solo elemento (già ordinati). Poi li fonde a coppie confrontando i primi elementi di ciascun pezzo, formando liste sempre più grandi e ordinate.",
        analogy: "Come unire due mazzi di carte già ordinati in uno solo: guardi la carta in cima a ciascun mazzo e prendi ogni volta la più piccola.",
        note: "Veloce e affidabile anche con molti dati. In cambio usa un po' di memoria in più per fondere le parti."
      },
      code: {
      c: `void merge(int a[], int l, int m, int r) {
  /* fonde a[l..m] e a[m+1..r] ordinati */
  int i = l, j = m + 1, k = 0, tmp[r - l + 1];
  while (i <= m && j <= r)
    if (a[i] <= a[j]) tmp[k++] = a[i++];  //@compare
    else              tmp[k++] = a[j++];  //@copy
  while (i <= m) tmp[k++] = a[i++];
  while (j <= r) tmp[k++] = a[j++];
  for (k = 0; k < r - l + 1; k++) a[l + k] = tmp[k];
}`,
      cpp: `void merge(vector<int>& a, int l, int m, int r) {
  vector<int> L(a.begin()+l, a.begin()+m+1);
  vector<int> R(a.begin()+m+1, a.begin()+r+1);
  int i = 0, j = 0, k = l;
  while (i < L.size() && j < R.size())
    if (L[i] <= R[j]) a[k++] = L[i++];    //@compare
    else              a[k++] = R[j++];    //@copy
  while (i < L.size()) a[k++] = L[i++];
  while (j < R.size()) a[k++] = R[j++];
}`,
      java: `void merge(int[] a, int l, int m, int r) {
  int[] L = Arrays.copyOfRange(a, l, m + 1);
  int[] R = Arrays.copyOfRange(a, m + 1, r + 1);
  int i = 0, j = 0, k = l;
  while (i < L.length && j < R.length)
    if (L[i] <= R[j]) a[k++] = L[i++];    //@compare
    else              a[k++] = R[j++];    //@copy
  while (i < L.length) a[k++] = L[i++];
  while (j < R.length) a[k++] = R[j++];
}`,
      python: `def merge(a, l, m, r):
    L, R = a[l:m+1], a[m+1:r+1]
    i = j = 0; k = l
    while i < len(L) and j < len(R):
        if L[i] <= R[j]:          #@compare
            a[k] = L[i]; i += 1
        else:
            a[k] = R[j]; j += 1   #@copy
        k += 1
    while i < len(L): a[k] = L[i]; i += 1; k += 1
    while j < len(R): a[k] = R[j]; j += 1; k += 1` } },

    quick: { name: "Quick Sort", big: "O(n log n)", gen: quick,
      explain: {
        idea: "Sceglie un elemento \"pivot\" e mette i più piccoli a sinistra e i più grandi a destra, poi ripete sulle due parti.",
        how: "Sceglie un pivot (qui l'ultimo elemento) e scorre la parte spostando a sinistra tutti i valori minori del pivot. Alla fine mette il pivot tra i minori e i maggiori: ora è al suo posto definitivo. Poi rifà lo stesso lavoro sulla parte sinistra e su quella destra.",
        analogy: "Come dividere i compagni in \"più bassi\" e \"più alti\" di una persona scelta, e poi rifare la stessa divisione dentro ciascun gruppo.",
        note: "In media molto veloce e ordina sul posto, senza liste extra. Può rallentare se il pivot viene scelto male."
      },
      code: {
      c: `int partition(int a[], int lo, int hi) {
  int pivot = a[hi], i = lo;        //@pivot
  for (int j = lo; j < hi; j++)
    if (a[j] < pivot) {             //@compare
      int t = a[i]; a[i] = a[j]; a[j] = t;  //@swap
      i++;
    }
  int t = a[i]; a[i] = a[hi]; a[hi] = t;    //@swap
  return i;
}`,
      cpp: `int partition(vector<int>& a, int lo, int hi) {
  int pivot = a[hi], i = lo;        //@pivot
  for (int j = lo; j < hi; j++)
    if (a[j] < pivot)               //@compare
      swap(a[i++], a[j]);           //@swap
  swap(a[i], a[hi]);                //@swap
  return i;
}`,
      java: `int partition(int[] a, int lo, int hi) {
  int pivot = a[hi], i = lo;        //@pivot
  for (int j = lo; j < hi; j++)
    if (a[j] < pivot) {             //@compare
      int t = a[i]; a[i] = a[j]; a[j] = t;  //@swap
      i++;
    }
  int t = a[i]; a[i] = a[hi]; a[hi] = t;    //@swap
  return i;
}`,
      python: `def partition(a, lo, hi):
    pivot, i = a[hi], lo             #@pivot
    for j in range(lo, hi):
        if a[j] < pivot:             #@compare
            a[i], a[j] = a[j], a[i]  #@swap
            i += 1
    a[i], a[hi] = a[hi], a[i]        #@swap
    return i` } },
  };

  /* ---------- Stato ---------- */
  let algo = "bubble", lang = "c", size = 12, values = [], frames = [], step = 0;
  let timer = null;

  function makeValues(n) {
    const v = []; for (let k = 1; k <= n; k++) v.push(Math.round(10 + 88 * (k / n)));
    for (let k = v.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [v[k], v[r]] = [v[r], v[k]]; }
    return v;
  }
  function rebuild(newValues) {
    stopAuto();
    if (newValues) values = newValues;
    frames = gen(values, ALGOS[algo].gen);
    step = 0; render(); renderExplain();
  }

  /* ---------- Spiegazione dell'algoritmo selezionato ---------- */
  function renderExplain() {
    const a = ALGOS[algo];
    if (!a.explain || !$("explainTitle")) return;
    $("explainTitle").textContent = a.name;
    $("explainBig").innerHTML = `Complessità <b>${esc(a.big)}</b>`;
    $("explainIdea").textContent = a.explain.idea;
    $("explainHow").textContent = a.explain.how;
    $("explainAnalogy").textContent = a.explain.analogy;
    $("explainNote").textContent = a.explain.note;
  }

  /* ---------- Render ---------- */
  const KW = /\b(for|while|if|else|elif|return|int|void|def|class|public|static|new|float|double|auto|vector|swap|range|len|and|or|not)\b/g;
  function hl(text) {
    let code = text, comment = "";
    const ci = text.search(/(\/\/|#)/);
    if (ci >= 0) { code = text.slice(0, ci); comment = text.slice(ci); }
    let h = esc(code).replace(KW, '<span class="kw">$1</span>');
    if (comment) h += `<span class="cm">${esc(comment)}</span>`;
    return h;
  }
  function parseCode(src) {
    return src.split("\n").map((line) => {
      const m = line.match(/\s*(?:\/\/|#)@(\w+)\s*$/);
      let key = null, text = line;
      if (m) { key = m[1]; text = line.slice(0, m.index).replace(/\s+$/, ""); }
      return { text, key };
    });
  }

  function renderBars(f) {
    const max = Math.max.apply(null, values);
    $("bars").innerHTML = f.a.map((v, i) => {
      let cls = "bar";
      if (i === f.pivot) cls += " pivot";
      else if (f.active.indexOf(i) >= 0) cls += (f.line === "swap" || f.line === "shift" || f.line === "copy") ? " swap" : " compare";
      else if (f.sorted.indexOf(i) >= 0) cls += " sorted";
      return `<div class="${cls}" style="height:${(v / max) * 100}%">${size <= 16 ? v : ""}</div>`;
    }).join("");
  }
  function renderCode() {
    const lines = parseCode(ALGOS[algo].code[lang]);
    const cur = frames[step] ? frames[step].line : null;
    $("code").innerHTML = lines.map((l, i) =>
      `<div class="ln ${l.key && l.key === cur ? "current" : ""}"><span class="num">${i + 1}</span><span class="src">${hl(l.text) || "&nbsp;"}</span></div>`
    ).join("");
    $("complexity").innerHTML = `Complessità: <b>${ALGOS[algo].big}</b>`;
  }
  function render() {
    const f = frames[step] || { a: values, active: [], sorted: [], pivot: -1, desc: "", comp: 0, mov: 0, line: null };
    renderBars(f);
    renderCode();
    $("sortDesc").innerHTML = f.desc ? `<span class="hl">▸</span> ${esc(f.desc)}` : "&nbsp;";
    const done = step >= frames.length - 1;
    $("sortCounters").innerHTML =
      `<span>Confronti: <b>${f.comp}</b></span><span>Spostamenti: <b>${f.mov}</b></span>` +
      `<span>Passo <b>${step}</b>/${frames.length - 1}</span>` +
      (done ? `<span class="done-tag">✓ completato</span>` : "");
    $("progressBar").style.width = (frames.length > 1 ? (step / (frames.length - 1)) * 100 : 0) + "%";
    $("btnStep").disabled = done;
  }

  /* ---------- Controlli ---------- */
  function stepFwd() { if (step < frames.length - 1) { step++; render(); } else stopAuto(); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; $("btnAuto").textContent = "▶ Auto"; $("btnAuto").classList.remove("on"); } }
  function toggleAuto() {
    if (timer) { stopAuto(); return; }
    if (step >= frames.length - 1) { step = 0; render(); }
    $("btnAuto").textContent = "⏸ Pausa"; $("btnAuto").classList.add("on");
    const delay = 620 - (+$("speed").value) * 56;
    timer = setInterval(() => { if (step < frames.length - 1) stepFwd(); else stopAuto(); }, delay);
  }

  $("algoSeg").innerHTML = Object.keys(ALGOS).map((k, i) =>
    `<button type="button" data-algo="${k}" class="seg-btn ${i === 0 ? "active" : ""}">${ALGOS[k].name.replace(" Sort", "")}</button>`).join("");
  $("algoSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-algo]"); if (!b) return;
    algo = b.dataset.algo;
    $("algoSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    rebuild();
  });
  $("langSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    lang = b.dataset.lang;
    $("langSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    renderCode();
  });
  $("sizeRange").addEventListener("input", (e) => { size = +e.target.value; $("sizeVal").textContent = size; rebuild(makeValues(size)); });
  $("shuffle").addEventListener("click", () => rebuild(makeValues(size)));
  $("btnStep").addEventListener("click", () => { stopAuto(); stepFwd(); });
  $("btnAuto").addEventListener("click", toggleAuto);
  $("btnReset").addEventListener("click", () => { stopAuto(); step = 0; render(); });

  /* ---------- Avvio ---------- */
  values = makeValues(size);
  rebuild();
})();
