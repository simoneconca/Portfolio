/* ============================================================
   cicli.js — I cicli: for, while, do-while
   Esegue «stampa i numeri da 1 a N» con i tre cicli, sincronizzando
   un diagramma di flusso (stile Flowgorithm) con il codice C/C++ e
   la pseudocodifica Flowgorithm. Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ============================================================
     Diagrammi di flusso (SVG) — pre-test (for/while) e post-test (do)
     Ogni nodo ha data-node: start | init | cond | print | update | end
     ============================================================ */
  const DEFS = `<defs>
    <marker id="fc-head" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">
      <path d="M0 0 L7 3 L0 6 z"/>
    </marker></defs>`;

  function shape(kind, id, cx, cy, w, h, label) {
    const x = cx - w / 2, y = cy - h / 2;
    let s;
    if (kind === "term") s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" class="fc-shape"/>`;
    else if (kind === "proc") s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="fc-shape"/>`;
    else if (kind === "io") { const k = 13; s = `<polygon points="${x + k},${y} ${x + w},${y} ${x + w - k},${y + h} ${x},${y + h}" class="fc-shape"/>`; }
    else s = `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" class="fc-shape"/>`; // dec
    return `<g class="fc-node" data-node="${id}">${s}<text x="${cx}" y="${cy}" class="fc-label">${label}</text></g>`;
  }
  const arr = (d) => `<path class="fc-arrow" d="${d}" marker-end="url(#fc-head)"/>`;

  function flowchartPre() {
    return `<svg viewBox="0 0 320 360" class="fc-svg" role="img" aria-label="Diagramma di flusso del ciclo">
      ${DEFS}
      ${arr("M130 41 V58")}
      ${arr("M130 97 V112")}
      ${arr("M130 179 V211")}
      ${arr("M130 251 V280")}
      ${arr("M70 300 H30 V146 H62")}
      ${arr("M197 146 H222")}
      <text class="fc-edge" x="146" y="200">vero</text>
      <text class="fc-edge" x="210" y="138">falso</text>
      ${shape("term", "start", 130, 24, 110, 34, "Inizio")}
      ${shape("proc", "init", 130, 78, 122, 38, "i ← 1")}
      ${shape("dec", "cond", 130, 146, 136, 66, "i ≤ N ?")}
      ${shape("io", "print", 130, 231, 122, 40, "stampa i")}
      ${shape("proc", "update", 130, 300, 122, 38, "i ← i + 1")}
      ${shape("term", "end", 264, 146, 84, 34, "Fine")}
    </svg>`;
  }
  function flowchartPost() {
    return `<svg viewBox="0 0 320 372" class="fc-svg" role="img" aria-label="Diagramma di flusso del ciclo">
      ${DEFS}
      ${arr("M130 41 V58")}
      ${arr("M130 97 V119")}
      ${arr("M130 161 V184")}
      ${arr("M130 223 V256")}
      ${arr("M62 290 H30 V140 H69")}
      ${arr("M197 290 H222")}
      <text class="fc-edge" x="44" y="210">vero</text>
      <text class="fc-edge" x="210" y="282">falso</text>
      ${shape("term", "start", 130, 24, 110, 34, "Inizio")}
      ${shape("proc", "init", 130, 78, 122, 38, "i ← 1")}
      ${shape("io", "print", 130, 140, 122, 40, "stampa i")}
      ${shape("proc", "update", 130, 204, 122, 38, "i ← i + 1")}
      ${shape("dec", "cond", 130, 290, 136, 66, "i ≤ N ?")}
      ${shape("term", "end", 264, 290, 84, 34, "Fine")}
    </svg>`;
  }

  /* ============================================================
     Contenuti per i tre cicli
     ============================================================ */
  const LOOPS = {
    for: {
      kind: "pre", name: "Ciclo for", big: "controllo PRIMA",
      idea: "Il for è il ciclo «contato»: in un colpo solo dichiari il punto di partenza, la condizione e come avanzare. È pensato per quando sai già quante volte ripetere.",
      how: "Nell'intestazione metti tre cose: inizializzazione (i = 1), condizione (i ≤ N) e aggiornamento (i++). Prima di ogni giro controlla la condizione; se è vera esegue il corpo, poi aggiorna e ricontrolla.",
      when: "Quando il numero di ripetizioni è noto: scorrere un vettore, ripetere N volte, contare da a a b.",
      warn: "È un while «compatto»: stesso comportamento, ma init, condizione e passo stanno tutti nell'intestazione. Con N = 0 il corpo non parte mai.",
      note: "Le tre parti dell'intestazione <b>for (i = 1; i &lt;= N; i++)</b> corrispondono ai blocchi <b>i ← 1</b>, <b>i ≤ N?</b> e <b>i ← i + 1</b> del diagramma: per questo si illumina sempre la stessa riga.",
    },
    while: {
      kind: "pre", name: "Ciclo while", big: "controllo PRIMA",
      idea: "Il while ripete il corpo finché una condizione resta vera, e la controlla all'inizio di ogni giro. Se la condizione è falsa già la prima volta, il corpo non viene eseguito nemmeno una volta.",
      how: "Prima inizializzi la variabile (i = 1). Poi: si controlla la condizione; se vera si esegue il corpo e si torna a controllare; se falsa si esce. L'aggiornamento (i++) lo scrivi tu dentro al corpo.",
      when: "Quando non sai in anticipo quante ripetizioni servono: leggere finché non arriva un valore, ritentare finché non riesce.",
      warn: "Devi ricordarti di aggiornare la variabile nel corpo, altrimenti la condizione resta sempre vera e il ciclo è infinito. Con N = 0 stampa zero numeri.",
      note: "Rispetto al for, qui <b>init</b>, <b>condizione</b> e <b>aggiornamento</b> sono su righe separate: si vede bene che il controllo avviene <b>prima</b> del corpo.",
    },
    do: {
      kind: "post", name: "Ciclo do-while", big: "controllo DOPO",
      idea: "Il do-while è come il while, ma controlla la condizione alla fine: esegue il corpo e solo dopo decide se ripetere. Per questo il corpo viene eseguito sempre almeno una volta.",
      how: "Inizializzi la variabile, poi esegui il corpo (stampa, aggiorna) e infine controlli la condizione: se è vera torni su a ripetere il corpo, se è falsa esci.",
      when: "Quando il corpo deve girare almeno una volta a prescindere: menu che si ripresentano, validazione di un input chiesto «almeno una volta».",
      warn: "Anche con N = 0 stampa un numero, perché controlla DOPO aver eseguito il corpo: è la differenza chiave con il while. Prova a impostare N = 0!",
      note: "La condizione <b>i ≤ N?</b> sta in fondo al diagramma e in fondo al codice (<b>while (i &lt;= N);</b>): il corpo gira, poi si controlla.",
    },
  };

  // Codice per ciclo + linguaggio, con mappa nodo → indice di riga
  const CODE = {
    for: {
      flowgorithm: { lines: ["For i = 1 To N", "    Output i", "Next i"],
        map: { init: 0, cond: 0, print: 1, update: 2 } },
      c: { lines: ["int i;", "for (i = 1; i <= N; i++)", "    printf(\"%d\\n\", i);"],
        map: { init: 1, cond: 1, print: 2, update: 1 } },
      cpp: { lines: ["int i;", "for (i = 1; i <= N; i++)", "    cout << i << endl;"],
        map: { init: 1, cond: 1, print: 2, update: 1 } },
    },
    while: {
      flowgorithm: { lines: ["i = 1", "While i <= N", "    Output i", "    i = i + 1", "End While"],
        map: { init: 0, cond: 1, print: 2, update: 3 } },
      c: { lines: ["int i = 1;", "while (i <= N) {", "    printf(\"%d\\n\", i);", "    i++;", "}"],
        map: { init: 0, cond: 1, print: 2, update: 3 } },
      cpp: { lines: ["int i = 1;", "while (i <= N) {", "    cout << i << endl;", "    i++;", "}"],
        map: { init: 0, cond: 1, print: 2, update: 3 } },
    },
    do: {
      flowgorithm: { lines: ["i = 1", "Do", "    Output i", "    i = i + 1", "While i <= N"],
        map: { init: 0, print: 2, update: 3, cond: 4 } },
      c: { lines: ["int i = 1;", "do {", "    printf(\"%d\\n\", i);", "    i++;", "} while (i <= N);"],
        map: { init: 0, print: 2, update: 3, cond: 4 } },
      cpp: { lines: ["int i = 1;", "do {", "    cout << i << endl;", "    i++;", "} while (i <= N);"],
        map: { init: 0, print: 2, update: 3, cond: 4 } },
    },
  };

  /* ============================================================
     Generazione dei passi
     ============================================================ */
  function genFrames(kind, N) {
    const frames = [];
    let i = null, out = [];
    const push = (node, desc, extra) => frames.push(Object.assign({ node, i, N, out: out.slice(), desc }, extra || {}));

    push("start", "Inizio del programma.");
    i = 1; push("init", "Inizializzo il contatore: i = 1.");

    if (kind === "pre") {
      while (true) {
        const c = i <= N;
        push("cond", `Controllo: i ≤ N → ${i} ≤ ${N} è ${c ? "VERO" : "FALSO"}.`, { cond: c });
        if (!c) break;
        out.push(i); push("print", `Stampo i = ${i}.`, { cond: true, fresh: out.length - 1 });
        i = i + 1; push("update", `Aggiorno: i diventa ${i}.`);
      }
    } else {
      while (true) {
        out.push(i); push("print", `Stampo i = ${i}.`, { fresh: out.length - 1 });
        i = i + 1; push("update", `Aggiorno: i diventa ${i}.`);
        const c = i <= N;
        push("cond", `Controllo: i ≤ N → ${i} ≤ ${N} è ${c ? "VERO" : "FALSO"}.`, { cond: c });
        if (!c) break;
      }
    }
    push("end", `Fine: ho stampato ${out.length} numer${out.length === 1 ? "o" : "i"}.`);
    return frames;
  }

  /* ============================================================
     Stato + render
     ============================================================ */
  let loop = "for", lang = "flowgorithm", N = 4, frames = [], step = 0, timer = null;

  function rebuild() {
    stopAuto();
    frames = genFrames(LOOPS[loop].kind, N);
    step = 0;
    $("flow").innerHTML = LOOPS[loop].kind === "pre" ? flowchartPre() : flowchartPost();
    renderExplain();
    renderCode();
    render();
  }

  function renderExplain() {
    const L = LOOPS[loop];
    $("explTitle").textContent = L.name;
    $("explBig").textContent = L.big;
    $("explIdea").textContent = L.idea;
    $("explHow").textContent = L.how;
    $("explWhen").textContent = L.when;
    $("explWarn").textContent = L.warn;
    $("codeNote").innerHTML = L.note;
  }

  const KW = /\b(for|while|do|int|return|printf|cout|endl|For|While|Do|End|Next|Output|To)\b/g;
  function hl(text) {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc.replace(KW, '<span class="kw">$1</span>');
  }
  function renderCode() {
    const c = CODE[loop][lang];
    $("code").innerHTML = c.lines.map((line, idx) =>
      `<div class="ln" data-line="${idx}"><span class="num">${idx + 1}</span><span class="src">${hl(line) || "&nbsp;"}</span></div>`
    ).join("");
    highlightCode();
  }
  function highlightCode() {
    const f = frames[step];
    const map = CODE[loop][lang].map;
    const cur = f ? map[f.node] : undefined;
    $("code").querySelectorAll(".ln").forEach((el) => {
      el.classList.toggle("current", cur != null && +el.dataset.line === cur);
    });
  }

  function render() {
    const f = frames[step] || { node: null, i: null, N: N, out: [], desc: "" };
    // diagramma
    $("flow").querySelectorAll(".fc-node").forEach((g) => {
      const on = g.dataset.node === f.node;
      g.classList.toggle("active", on);
      g.classList.toggle("cond-true", on && f.node === "cond" && f.cond === true);
      g.classList.toggle("cond-false", on && f.node === "cond" && f.cond === false);
    });
    // codice
    highlightCode();
    // variabili
    $("varI").textContent = f.i == null ? "—" : f.i;
    $("varN").textContent = f.N;
    $("varCount").textContent = f.out.length;
    // output
    if (!f.out.length) {
      $("output").innerHTML = '<span class="cl-output-empty">— niente stampato —</span>';
    } else {
      $("output").innerHTML = f.out.map((v, idx) =>
        `<span class="${idx === f.fresh ? "fresh" : ""}">${v}</span>`).join("");
    }
    // descrizione
    $("stepDesc").innerHTML = f.desc ? `<strong>▸</strong> ${f.desc}` : "&nbsp;";
    // controlli
    $("btnStep").disabled = step >= frames.length - 1;
  }

  /* ---------- Controlli esecuzione ---------- */
  function stepFwd() { if (step < frames.length - 1) { step++; render(); } else stopAuto(); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; $("btnAuto").textContent = "▶ Auto"; } }
  function toggleAuto() {
    if (timer) { stopAuto(); return; }
    if (step >= frames.length - 1) { step = 0; render(); }
    $("btnAuto").textContent = "⏸ Pausa";
    const delay = 720 - (+$("speed").value) * 60;
    timer = setInterval(() => { if (step < frames.length - 1) stepFwd(); else stopAuto(); }, delay);
  }

  /* ---------- Eventi ---------- */
  $("loopSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-loop]"); if (!b) return;
    loop = b.dataset.loop;
    $("loopSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    rebuild();
  });
  $("langSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    lang = b.dataset.lang;
    $("langSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    renderCode();
  });
  $("nRange").addEventListener("input", (e) => { N = +e.target.value; $("nVal").textContent = N; rebuild(); });
  $("btnStep").addEventListener("click", () => { stopAuto(); stepFwd(); });
  $("btnAuto").addEventListener("click", toggleAuto);
  $("btnReset").addEventListener("click", () => { stopAuto(); step = 0; render(); });

  /* ---------- Avvio ---------- */
  rebuild();
})();
