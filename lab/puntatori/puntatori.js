/* ============================================================
   puntatori.js — Puntatori & memoria (C / C++)
   Esegue piccoli programmi passo-passo mostrando la memoria:
   celle con indirizzo e valore, e la «freccia» del puntatore.
   Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------- Modello di memoria ---------- */
  function M0() { return { slots: [], next: 0x1000, hot: null }; }
  const snap = (M) => ({ slots: JSON.parse(JSON.stringify(M.slots)), hot: M.hot });
  const find = (M, n) => M.slots.find((s) => s.name === n);
  function aInt(M, n, v) { M.slots.push({ name: n, type: "int", addr: M.next, val: v, ptr: false, points: null }); M.next += 4; M.hot = n; }
  function aArr(M, n, vals) { vals.forEach((v, i) => { M.slots.push({ name: n + "[" + i + "]", type: "int", addr: M.next, val: v, ptr: false, points: null }); M.next += 4; }); M.hot = n + "[0]"; }
  function aPtr(M, n, target) { M.slots.push({ name: n, type: "int*", addr: M.next, ptr: true, points: target || null }); M.next += 8; M.hot = n; }
  function setP(M, n, target) { find(M, n).points = target; M.hot = n; }
  function writeThru(M, ptr, v) { const p = find(M, ptr); const t = find(M, p.points); t.val = v; M.hot = t.name; }
  const rd = (M, n) => { M.hot = n; };

  /* ---------- Costruzione dei frame ---------- */
  function run(ops) {
    const M = M0();
    const frames = [{ line: null, desc: "", mem: snap(M), out: "" }];
    let out = "";
    ops.forEach((o) => { M.hot = null; o.do(M); if (o.out != null) out += o.out + "\n"; frames.push({ line: o.line, desc: o.desc, mem: snap(M), out }); });
    return frames;
  }

  /* ============================================================
     I sei esempi
     ============================================================ */
  const SCEN = {
    base: {
      title: "Indirizzo & puntatore",
      idea: "Una variabile vive in una cella di memoria, a un indirizzo. Un puntatore è una variabile che, invece di un numero, contiene un indirizzo: «punta» a un'altra cella.",
      key: "&x = «indirizzo di x» · *p = «valore nella cella puntata da p»",
      c: ['int x = 10;', 'int *p = &x;', 'printf("%d\\n", x);', 'printf("%p\\n", (void*)&x);', 'printf("%d\\n", *p);'],
      cpp: ['int x = 10;', 'int *p = &x;', 'cout << x << "\\n";', 'cout << &x << "\\n";', 'cout << *p << "\\n";'],
      ops: [
        { line: 0, desc: "Creo x = 10: occupa una cella di memoria, a un indirizzo preciso.", do: (M) => aInt(M, "x", 10) },
        { line: 1, desc: "int *p = &x: p è un puntatore e riceve l'indirizzo di x (&x). Ora p «punta» a x.", do: (M) => aPtr(M, "p", "x") },
        { line: 2, desc: "x vale 10: è il contenuto della sua cella.", out: "10", do: (M) => rd(M, "x") },
        { line: 3, desc: "&x è l'indirizzo della cella di x — esattamente ciò che è memorizzato dentro p.", out: "0x1000", do: (M) => rd(M, "x") },
        { line: 4, desc: "*p segue la freccia e legge il valore puntato: 10.", out: "10", do: (M) => { rd(M, find(M, "p").points); } },
      ],
    },
    modifica: {
      title: "Modificare tramite il puntatore",
      idea: "Dereferenziare (*p) non serve solo a leggere: puoi anche SCRIVERE nella cella puntata. Così cambi una variabile «da lontano», attraverso il puntatore.",
      key: "*p = 20 cambia la variabile puntata (x), non il puntatore p.",
      c: ['int x = 10;', 'int *p = &x;', '*p = 20;            // scrivo nella cella puntata', 'printf("%d\\n", x);  // 20'],
      cpp: ['int x = 10;', 'int *p = &x;', '*p = 20;          // scrivo nella cella puntata', 'cout << x << "\\n"; // 20'],
      ops: [
        { line: 0, desc: "x = 10.", do: (M) => aInt(M, "x", 10) },
        { line: 1, desc: "p punta a x.", do: (M) => aPtr(M, "p", "x") },
        { line: 2, desc: "*p = 20 scrive 20 nella cella puntata da p, cioè in x.", do: (M) => writeThru(M, "p", 20) },
        { line: 3, desc: "x ora vale 20: l'ho cambiata attraverso il puntatore, senza nominarla direttamente.", out: "20", do: (M) => rd(M, "x") },
      ],
    },
    sposta: {
      title: "Spostare il puntatore",
      idea: "Un puntatore può cambiare bersaglio: assegnandogli un nuovo indirizzo, la «freccia» si sposta su un'altra variabile. Da quel momento *p lavora su quella nuova cella.",
      key: "p = &y → ora *p legge e scrive su y, non più su x.",
      c: ['int x = 10;', 'int y = 7;', 'int *p = &x;   // p punta a x', 'p = &y;        // ora p punta a y', '*p = 99;       // cambio y, non x'],
      cpp: ['int x = 10;', 'int y = 7;', 'int *p = &x;   // p punta a x', 'p = &y;        // ora p punta a y', '*p = 99;       // cambio y, non x'],
      ops: [
        { line: 0, desc: "x = 10.", do: (M) => aInt(M, "x", 10) },
        { line: 1, desc: "y = 7.", do: (M) => aInt(M, "y", 7) },
        { line: 2, desc: "p punta a x.", do: (M) => aPtr(M, "p", "x") },
        { line: 3, desc: "p = &y: riassegno il puntatore. La freccia ora punta a y.", do: (M) => setP(M, "p", "y") },
        { line: 4, desc: "*p = 99 scrive in y (la cella puntata ora). x è rimasta 10.", do: (M) => writeThru(M, "p", 99) },
      ],
    },
    nullo: {
      title: "Il puntatore nullo",
      idea: "Un puntatore può non puntare a nulla: vale nullptr (C++) o NULL (C). Dereferenziare un puntatore nullo manda in crash il programma: per questo si controlla SEMPRE prima di usarlo.",
      key: "if (p != nullptr) { ... } prima di toccare *p.",
      c: ['int *p = NULL;       // non punta a niente', 'if (p != NULL) {     // controllo prima', '    *p = 5;', '}', '// usare *p senza controllo = crash!'],
      cpp: ['int *p = nullptr;    // non punta a niente', 'if (p != nullptr) {  // controllo prima', '    *p = 5;', '}', '// usare *p senza controllo = crash!'],
      ops: [
        { line: 0, desc: "p = nullptr: il puntatore non contiene l'indirizzo di nessuna cella.", do: (M) => aPtr(M, "p", null) },
        { line: 1, desc: "Controllo: p è diverso da nullo? No → NON entro nel corpo dell'if.", do: (M) => rd(M, "p") },
        { line: 4, desc: "Salto *p: dereferenziare un puntatore nullo sarebbe un errore. Controllare prima evita il crash.", do: (M) => rd(M, "p") },
      ],
    },
    array: {
      title: "Array e aritmetica dei puntatori",
      idea: "Il nome di un array è l'indirizzo del suo primo elemento. Su un puntatore l'aritmetica conta in elementi: p+1 salta alla cella successiva (di un intero), non di un byte.",
      key: "*(p+1) ≡ a[1] · p++ sposta il puntatore alla cella dopo.",
      c: ['int a[3] = {10, 20, 30};', 'int *p = a;        // p punta ad a[0]', '*p = 11;           // come a[0] = 11', '*(p + 1) = 22;     // come a[1] = 22', 'p++;               // p avanza di una cella'],
      cpp: ['int a[3] = {10, 20, 30};', 'int *p = a;        // p punta ad a[0]', '*p = 11;           // come a[0] = 11', '*(p + 1) = 22;     // come a[1] = 22', 'p++;               // p avanza di una cella'],
      ops: [
        { line: 0, desc: "L'array a ha 3 celle contigue: a[0]=10, a[1]=20, a[2]=30.", do: (M) => aArr(M, "a", [10, 20, 30]) },
        { line: 1, desc: "int *p = a: il nome dell'array è l'indirizzo del primo elemento, quindi p punta ad a[0].", do: (M) => aPtr(M, "p", "a[0]") },
        { line: 2, desc: "*p scrive nella cella puntata: a[0] diventa 11.", do: (M) => writeThru(M, "p", 11) },
        { line: 3, desc: "p+1 punta alla cella successiva (avanza di un intero): *(p+1) è a[1], che diventa 22.", do: (M) => { const c = find(M, "a[1]"); c.val = 22; M.hot = "a[1]"; } },
        { line: 4, desc: "p++ sposta il puntatore di una cella: ora p punta ad a[1].", do: (M) => setP(M, "p", "a[1]") },
      ],
    },
    swap: {
      title: "Scambio con i puntatori",
      idea: "Passando gli INDIRIZZI, una funzione può modificare le variabili di chi l'ha chiamata. È il vero motivo per cui i puntatori esistono: senza, swap riceverebbe solo copie e non cambierebbe nulla.",
      key: "swap(&x, &y) scambia davvero x e y nel main.",
      c: ['int x = 5, y = 9;', 'swap(&x, &y);    // passo gli INDIRIZZI', '', 'void swap(int *a, int *b) {', '    int t = *a;    // t = 5', '    *a = *b;       // x diventa 9', '    *b = t;        // y diventa 5', '}'],
      cpp: ['int x = 5, y = 9;', 'swap(&x, &y);    // passo gli INDIRIZZI', '', 'void swap(int *a, int *b) {', '    int t = *a;    // t = 5', '    *a = *b;       // x diventa 9', '    *b = t;        // y diventa 5', '}'],
      ops: [
        { line: 0, desc: "Nel main: x = 5 e y = 9.", do: (M) => { aInt(M, "x", 5); aInt(M, "y", 9); } },
        { line: 1, desc: "Chiamo swap passando &x e &y: gli INDIRIZZI di x e y, non i loro valori.", do: (M) => rd(M, "x") },
        { line: 3, desc: "Dentro swap: a riceve l'indirizzo di x, b quello di y. Ora a punta a x, b punta a y.", do: (M) => { aPtr(M, "a", "x"); aPtr(M, "b", "y"); } },
        { line: 4, desc: "t = *a: copio in t il valore puntato da a, cioè 5.", do: (M) => aInt(M, "t", 5) },
        { line: 5, desc: "*a = *b: scrivo in x il valore puntato da b (9). Ora x = 9.", do: (M) => { const b = find(M, "b"); writeThru(M, "a", find(M, b.points).val); } },
        { line: 6, desc: "*b = t: scrivo in y il vecchio valore salvato in t (5). Ora y = 5: scambio fatto!", do: (M) => { writeThru(M, "b", find(M, "t").val); } },
      ],
    },
  };

  /* ============================================================
     Stato + render
     ============================================================ */
  let scen = "base", lang = "c", frames = [], step = 0, timer = null;

  function rebuild() {
    stopAuto();
    frames = run(SCEN[scen].ops);
    step = 0;
    renderExplain();
    renderCode();
    render();
  }

  function renderExplain() {
    const s = SCEN[scen];
    $("explTitle").textContent = s.title;
    $("explIdea").textContent = s.idea;
    $("explKey").textContent = s.key;
  }

  const KW = /\b(int|void|char|float|double|return|if|else|for|while|struct|NULL|nullptr|printf|cout|sizeof)\b/g;
  function hl(text) {
    let code = text, cm = "";
    const i = text.indexOf("//");
    if (i >= 0) { code = text.slice(0, i); cm = text.slice(i); }
    let h = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(KW, '<span class="kw">$1</span>');
    if (cm) h += `<span class="cm">${cm.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
    return h;
  }
  function renderCode() {
    const lines = SCEN[scen][lang];
    $("code").innerHTML = lines.map((line, idx) =>
      `<div class="ln" data-line="${idx}"><span class="num">${idx + 1}</span><span class="src">${hl(line) || "&nbsp;"}</span></div>`).join("");
    highlightCode();
  }
  function highlightCode() {
    const cur = frames[step] ? frames[step].line : null;
    $("code").querySelectorAll(".ln").forEach((el) => el.classList.toggle("current", cur != null && +el.dataset.line === cur));
  }

  const hex = (n) => "0x" + n.toString(16).toUpperCase();

  function render() {
    const f = frames[step] || { mem: { slots: [], hot: null }, desc: "", out: "" };
    const slots = f.mem.slots;
    const memEl = $("mem");

    if (!slots.length) {
      memEl.innerHTML = `<p class="pt-mem-empty">La memoria è vuota. Premi <strong>Passo</strong>: ogni dichiarazione occuperà una cella.</p>`;
    } else {
      let rows = `<div class="pt-rows">`;
      slots.forEach((s) => {
        let value;
        if (s.ptr) value = s.points ? `<span class="pt-val">${hex(find2(slots, s.points).addr)}</span>` : `<span class="pt-val nul">nullptr</span>`;
        else value = `<span class="pt-val">${s.val}</span>`;
        rows += `<div class="pt-row ${f.mem.hot === s.name ? "hot" : ""}" data-name="${s.name}">
          <span class="pt-addr">${hex(s.addr)}</span>
          <div class="pt-box ${s.ptr ? "ptr" : ""}">
            <span class="pt-vname">${s.name}<i>${s.type}</i></span>${value}
          </div></div>`;
      });
      rows += `</div><svg class="pt-arrows" id="ptArrows"></svg>`;
      memEl.innerHTML = rows;
      drawArrows(slots);
    }

    highlightCode();
    $("stepDesc").innerHTML = f.desc ? `<strong>▸</strong> ${f.desc}` : "&nbsp;";
    const outWrap = $("outWrap");
    if (f.out) { outWrap.hidden = false; $("out").textContent = f.out.trimEnd(); } else outWrap.hidden = true;
    $("btnStep").disabled = step >= frames.length - 1;
  }
  const find2 = (slots, n) => slots.find((s) => s.name === n);

  function drawArrows(slots) {
    const svg = $("ptArrows"); if (!svg) return;
    const memEl = $("mem");
    const ptrs = slots.filter((s) => s.ptr && s.points);
    let paths = "";
    ptrs.forEach((s) => {
      const from = memEl.querySelector(`.pt-row[data-name="${cssEsc(s.name)}"] .pt-box`);
      const to = memEl.querySelector(`.pt-row[data-name="${cssEsc(s.points)}"] .pt-box`);
      if (!from || !to) return;
      const mr = memEl.getBoundingClientRect();
      const fr = from.getBoundingClientRect(), tr = to.getBoundingClientRect();
      const px = fr.right - mr.left, py = fr.top - mr.top + fr.height / 2;
      const tx = tr.right - mr.left, ty = tr.top - mr.top + tr.height / 2;
      const cx = Math.max(px, tx) + 26;
      paths += `<path d="M ${px} ${py} C ${cx} ${py}, ${cx} ${ty}, ${tx + 4} ${ty}" marker-end="url(#ptHead)"/>`;
    });
    svg.innerHTML = `<defs><marker id="ptHead" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L7 3 L0 6 z" fill="var(--accent)"/></marker></defs>${paths}`;
  }
  const cssEsc = (s) => s.replace(/[[\]]/g, "\\$&");

  /* ---------- Controlli esecuzione ---------- */
  function stepFwd() { if (step < frames.length - 1) { step++; render(); } else stopAuto(); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; $("btnAuto").textContent = "▶ Auto"; } }
  function toggleAuto() {
    if (timer) { stopAuto(); return; }
    if (step >= frames.length - 1) { step = 0; render(); }
    $("btnAuto").textContent = "⏸ Pausa";
    const delay = 820 - (+$("speed").value) * 65;
    timer = setInterval(() => { if (step < frames.length - 1) stepFwd(); else stopAuto(); }, delay);
  }

  /* ---------- Eventi ---------- */
  $("scenSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-scen]"); if (!b) return;
    scen = b.dataset.scen;
    $("scenSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    rebuild();
  });
  $("langSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    lang = b.dataset.lang;
    $("langSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    renderCode();
  });
  $("btnStep").addEventListener("click", () => { stopAuto(); stepFwd(); });
  $("btnAuto").addEventListener("click", toggleAuto);
  $("btnReset").addEventListener("click", () => { stopAuto(); step = 0; render(); });
  window.addEventListener("resize", () => { const f = frames[step]; if (f && f.mem.slots.length) drawArrows(f.mem.slots); });

  /* ---------- Avvio ---------- */
  rebuild();
})();
