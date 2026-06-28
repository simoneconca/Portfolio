/* ============================================================
   learn.js — «Impara i blocchi»
   Per ogni blocco del diagramma di flusso: una mini-animazione
   passo-passo che mostra cosa succede davvero (RAM come tabella,
   input dell'utente, output a schermo, decisioni, cicli).
   Usa il motore di disegno di flowchart.js (window.FC.renderAST).
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const ADDR0 = 0x1A00;
  const addr = (i) => "0x" + (ADDR0 + i * 4).toString(16).toUpperCase();

  /* nodi di comodo per costruire i mini-diagrammi */
  const S = { type: "start", id: "s" }, E = { type: "end", id: "e" };
  const dec = (id, vars, t) => ({ type: "declare", id, vars, vtype: t });
  const asg = (id, target, expr) => ({ type: "assign", id, target, expr });
  const inp = (id, name) => ({ type: "input", id, name });
  const outp = (id, expr) => ({ type: "output", id, expr });

  /* ---------- AST per Selezione e Cicli (stampa i numeri da 1 a N) ---------- */
  const N = 4;
  const SEL_AST = [S, dec("d1", "numero", "Intero"), inp("i1", "numero"),
    { type: "if", id: "if1", cond: "numero > 10",
      tBody: [outp("ot", '"maggiore di 10"')], fBody: [outp("of", '"minore o uguale a 10"')] }, E];
  const WHILE_AST = [S, dec("di", "i", "Intero"), asg("a1", "i", "1"),
    { type: "while", id: "w", cond: "i <= " + N, body: [outp("ob", "i"), asg("ai", "i", "i + 1")] },
    outp("oe", '"Finito"'), E];
  const FOR_AST = [S, dec("di", "i", "Intero"),
    { type: "for", id: "w", var: "i", from: "1", to: "" + N, body: [outp("ob", "i")] },
    outp("oe", '"Finito"'), E];
  const DO_AST = [S, dec("di", "i", "Intero"), asg("a1", "i", "1"),
    { type: "do", id: "w", cond: "i <= " + N, body: [outp("ob", "i"), asg("ai", "i", "i + 1")] },
    outp("oe", '"Finito"'), E];

  function genSel(v) {
    const t = v > 10, ram = [{ name: "numero", type: "Intero", val: null }], f = [];
    f.push({ node: "s", ram: [], out: [], desc: "Partenza." });
    f.push({ node: "d1", ram: clone(ram), out: [], changed: "numero", desc: "Dichiaro numero (Intero)." });
    f.push({ node: "i1", ram: clone(ram), out: [], input: { active: true }, desc: "«Leggi numero»: il programma aspetta un valore dall'utente." });
    setVal(ram, "numero", v);
    f.push({ node: "i1", ram: clone(ram), out: [], changed: "numero", input: { value: v, done: true }, desc: "L'utente digita " + v + ": il valore entra in numero." });
    f.push({ node: "if1", ram: clone(ram), out: [], cond: t, desc: "Controllo «numero > 10»: " + v + " > 10 è " + (t ? "VERO" : "FALSO") + ". " + (t ? "Eseguo il ramo di destra (vero)." : "Eseguo il ramo di sinistra (falso).") });
    const msg = t ? "maggiore di 10" : "minore o uguale a 10";
    f.push({ node: t ? "ot" : "of", ram: clone(ram), out: [msg], fresh: 0, desc: "Stampo «" + msg + "». L'altro ramo viene saltato del tutto." });
    f.push({ node: "e", ram: clone(ram), out: [msg], desc: "Fine: si esegue sempre uno solo dei due rami." });
    return f;
  }

  function genWhile(n) {
    const ram = [{ name: "i", type: "Intero", val: null }], out = [], f = [];
    f.push({ node: "s", ram: [], out: [], desc: "Partenza." });
    f.push({ node: "di", ram: clone(ram), out: [], changed: "i", desc: "Dichiaro il contatore i (Intero)." });
    setVal(ram, "i", 1);
    f.push({ node: "a1", ram: clone(ram), out: [], changed: "i", desc: "Inizializzo i = 1 PRIMA del ciclo." });
    let i = 1;
    while (true) {
      const c = i <= n;
      f.push({ node: "w", ram: clone(ram), out: out.slice(), cond: c, desc: "Controllo all'inizio: i ≤ " + n + " → " + i + " ≤ " + n + " è " + (c ? "VERO: entro nel corpo." : "FALSO: esco dal ciclo.") });
      if (!c) break;
      out.push(i);
      f.push({ node: "ob", ram: clone(ram), out: out.slice(), fresh: out.length - 1, desc: "Stampo i = " + i + "." });
      i++; setVal(ram, "i", i);
      f.push({ node: "ai", ram: clone(ram), out: out.slice(), changed: "i", desc: "Aggiorno i = i + 1 → " + i + ", poi torno a controllare." });
    }
    f.push({ node: "oe", ram: clone(ram), out: out.concat(["Finito"]), fresh: out.length, desc: "Uscito dal ciclo, stampo «Finito»." });
    f.push({ node: "e", ram: clone(ram), out: out.concat(["Finito"]), desc: "Fine. Con i ≤ " + n + " ho stampato " + out.length + " numeri." });
    return f;
  }

  function genFor(n) {
    const ram = [{ name: "i", type: "Intero", val: null }], out = [], f = [];
    f.push({ node: "s", ram: [], out: [], desc: "Partenza." });
    f.push({ node: "di", ram: clone(ram), out: [], changed: "i", desc: "Dichiaro il contatore i (Intero)." });
    let i = 1; setVal(ram, "i", 1);
    while (true) {
      const c = i <= n;
      f.push({ node: "w", ram: clone(ram), out: out.slice(), cond: c, desc: "Il for inizializza/controlla il contatore: i = " + i + " ≤ " + n + " è " + (c ? "VERO → Ripeti (eseguo il corpo)." : "FALSO → Termina (esco).") });
      if (!c) break;
      out.push(i);
      f.push({ node: "ob", ram: clone(ram), out: out.slice(), fresh: out.length - 1, desc: "Stampo i = " + i + "." });
      i++; setVal(ram, "i", i);
    }
    f.push({ node: "oe", ram: clone(ram), out: out.concat(["Finito"]), fresh: out.length, desc: "Finito il conteggio, stampo «Finito»." });
    f.push({ node: "e", ram: clone(ram), out: out.concat(["Finito"]), desc: "Fine. Il for ha ripetuto " + out.length + " volte (numero noto in partenza)." });
    return f;
  }

  function genDo(n) {
    const ram = [{ name: "i", type: "Intero", val: null }], out = [], f = [];
    f.push({ node: "s", ram: [], out: [], desc: "Partenza." });
    f.push({ node: "di", ram: clone(ram), out: [], changed: "i", desc: "Dichiaro il contatore i (Intero)." });
    let i = 1; setVal(ram, "i", 1);
    f.push({ node: "a1", ram: clone(ram), out: [], changed: "i", desc: "Inizializzo i = 1." });
    while (true) {
      out.push(i);
      f.push({ node: "ob", ram: clone(ram), out: out.slice(), fresh: out.length - 1, desc: "Eseguo PRIMA il corpo: stampo i = " + i + "." });
      i++; setVal(ram, "i", i);
      f.push({ node: "ai", ram: clone(ram), out: out.slice(), changed: "i", desc: "Aggiorno i = i + 1 → " + i + "." });
      const c = i <= n;
      f.push({ node: "w", ram: clone(ram), out: out.slice(), cond: c, desc: "Controllo DOPO: i ≤ " + n + " → " + i + " ≤ " + n + " è " + (c ? "VERO: ripeto." : "FALSO: esco.") });
      if (!c) break;
    }
    f.push({ node: "oe", ram: clone(ram), out: out.concat(["Finito"]), fresh: out.length, desc: "Stampo «Finito». Il corpo è stato eseguito almeno una volta." });
    f.push({ node: "e", ram: clone(ram), out: out.concat(["Finito"]), desc: "Fine. Il do-while controlla DOPO: il corpo parte sempre almeno una volta." });
    return f;
  }

  /* ============================================================
     LEZIONI
     Ogni lezione: { ast, frames() }
     frame = { node, ram:[{name,type,val}], out:[...], input, desc, changed, fresh, cond }
     ============================================================ */
  const LESSONS = {
    dichiara: {
      title: "Dichiarazione",
      ast: [S, dec("d1", "numero", "Intero"), dec("d2", "media", "Reale"), dec("d3", "messaggio", "Stringa"), E],
      note: "<b>Dichiarare</b> una variabile significa chiedere al sistema operativo di <b>riservare in memoria (RAM) una «scatola»</b> con un nome e un tipo. Il tipo decide cosa può contenere e quanto spazio occupa: <b>Intero</b> (numeri interi), <b>Reale</b> (con la virgola), <b>Stringa</b> (testo), <b>Booleano</b> (vero/falso). Appena dichiarata la scatola è <b>vuota</b>: esiste, ma non contiene ancora nessun valore.",
      frames: function () {
        const ram = [];
        const f = [];
        f.push({ node: "s", ram: [], desc: "Il programma parte. La memoria non contiene ancora nessuna variabile." });
        ram.push({ name: "numero", type: "Intero", val: null });
        f.push({ node: "d1", ram: clone(ram), changed: "numero", desc: "«Dichiara numero: Intero» riserva in RAM una scatola di nome numero che può contenere un numero intero. È ancora vuota." });
        ram.push({ name: "media", type: "Reale", val: null });
        f.push({ node: "d2", ram: clone(ram), changed: "media", desc: "Aggiungo una scatola media di tipo Reale: conterrà un numero con la virgola. Anche questa parte vuota." });
        ram.push({ name: "messaggio", type: "Stringa", val: null });
        f.push({ node: "d3", ram: clone(ram), changed: "messaggio", desc: "Una scatola messaggio di tipo Stringa: conterrà del testo." });
        f.push({ node: "e", ram: clone(ram), desc: "Fine. Le tre variabili esistono in memoria ma sono ancora da riempire: dichiarare ≠ assegnare un valore." });
        return f;
      },
    },

    assegna: {
      title: "Assegnazione",
      ast: [S, dec("d1", "numero", "Intero"), asg("a1", "numero", "6"), dec("d2", "doppio", "Intero"), asg("a2", "doppio", "numero * 2"), E],
      note: "L'<b>assegnazione</b> mette un valore <b>dentro</b> una variabile già dichiarata, con la sintassi <code>variabile = espressione</code>. Il <code>=</code> non è «uguale» della matematica: vuol dire «<b>metti dentro</b>». A destra può esserci un valore fisso, un'altra variabile o un'operazione: il computer prima <b>calcola</b> il valore a destra, poi lo <b>copia</b> nella scatola a sinistra (sovrascrivendo ciò che c'era).",
      frames: function () {
        const ram = []; const f = [];
        f.push({ node: "s", ram: [], desc: "Partenza." });
        ram.push({ name: "numero", type: "Intero", val: null });
        f.push({ node: "d1", ram: clone(ram), changed: "numero", desc: "Dichiaro numero (Intero): scatola vuota." });
        setVal(ram, "numero", 6);
        f.push({ node: "a1", ram: clone(ram), changed: "numero", desc: "«numero = 6»: metto il valore 6 nella scatola numero. Prima era vuota, ora vale 6." });
        ram.push({ name: "doppio", type: "Intero", val: null });
        f.push({ node: "d2", ram: clone(ram), changed: "doppio", desc: "Dichiaro doppio (Intero): un'altra scatola vuota." });
        setVal(ram, "doppio", 12);
        f.push({ node: "a2", ram: clone(ram), changed: "doppio", desc: "«doppio = numero * 2»: il computer legge numero (vale 6), calcola 6 × 2 = 12 e mette 12 in doppio." });
        f.push({ node: "e", ram: clone(ram), desc: "Fine: numero = 6, doppio = 12." });
        return f;
      },
    },

    leggi: {
      title: "Leggi (input)",
      ast: [S, dec("d1", "eta", "Intero"), inp("i1", "eta"), outp("o1", '"Hai " & eta & " anni"'), E],
      note: "Il blocco di <b>input</b> (<code>Leggi variabile</code>) fa <b>fermare</b> il programma per <b>ricevere un dato dall'utente</b>: la persona digita un valore sulla tastiera e quel valore viene <b>salvato nella variabile</b> indicata. È il modo in cui un programma diventa interattivo invece di lavorare sempre sugli stessi numeri.",
      frames: function () {
        const ram = []; const f = [];
        f.push({ node: "s", ram: [], desc: "Partenza." });
        ram.push({ name: "eta", type: "Intero", val: null });
        f.push({ node: "d1", ram: clone(ram), changed: "eta", desc: "Dichiaro eta (Intero): scatola vuota, in attesa di un valore." });
        f.push({ node: "i1", ram: clone(ram), input: { active: true, value: null }, desc: "«Leggi eta»: il programma si ferma e aspetta. Sullo schermo compare una casella in cui l'utente può digitare." });
        setVal(ram, "eta", 16);
        f.push({ node: "i1", ram: clone(ram), changed: "eta", input: { value: 16, done: true }, desc: "L'utente digita 16 e preme Invio: il valore 16 entra nella scatola eta." });
        f.push({ node: "o1", ram: clone(ram), out: ["Hai 16 anni"], fresh: 0, desc: "Ora la variabile contiene un dato deciso dall'utente: «Hai 16 anni»." });
        f.push({ node: "e", ram: clone(ram), out: ["Hai 16 anni"], desc: "Fine." });
        return f;
      },
    },

    scrivi: {
      title: "Scrivi (output)",
      ast: [S, dec("d1", "nome", "Stringa"), asg("a1", "nome", '"Ada"'), outp("o1", "nome"), outp("o2", '"Ciao!"'), outp("o3", '"Utente: " & nome'), E],
      note: "Il blocco di <b>output</b> (<code>Scrivi …</code>) <b>mostra qualcosa all'utente</b> sullo schermo. Puoi scrivere: il <b>contenuto di una variabile</b> (<code>Scrivi nome</code>), un <b>testo fisso</b> tra virgolette (<code>Scrivi \"Ciao!\"</code>) oppure <b>più pezzi uniti dalla &amp;</b> (<code>Scrivi \"Utente: \" &amp; nome</code>): la <code>&amp;</code> «incolla» testo e valori in un'unica scritta.",
      frames: function () {
        const ram = []; const f = []; const out = [];
        f.push({ node: "s", ram: [], out: [], desc: "Partenza." });
        ram.push({ name: "nome", type: "Stringa", val: null });
        f.push({ node: "d1", ram: clone(ram), out: [], changed: "nome", desc: "Dichiaro nome (Stringa)." });
        setVal(ram, "nome", '"Ada"');
        f.push({ node: "a1", ram: clone(ram), out: [], changed: "nome", desc: "«nome = \"Ada\"»: metto il testo Ada nella variabile." });
        out.push("Ada");
        f.push({ node: "o1", ram: clone(ram), out: out.slice(), fresh: 0, desc: "«Scrivi nome»: stampa il contenuto della scatola, cioè Ada." });
        out.push("Ciao!");
        f.push({ node: "o2", ram: clone(ram), out: out.slice(), fresh: 1, desc: "«Scrivi \"Ciao!\"»: tra virgolette stampa il testo così com'è." });
        out.push("Utente: Ada");
        f.push({ node: "o3", ram: clone(ram), out: out.slice(), fresh: 2, desc: "«Scrivi \"Utente: \" & nome»: la & unisce il testo «Utente: » e il valore di nome → «Utente: Ada»." });
        f.push({ node: "e", ram: clone(ram), out: out.slice(), desc: "Fine." });
        return f;
      },
    },

    selezione: {
      title: "Selezione",
      note: "Il blocco di <b>controllo (Se… altrimenti)</b> serve per <b>prendere decisioni</b>. Contiene una <b>condizione</b> (un'espressione che può essere solo <b>vera</b> o <b>falsa</b>, es. <code>numero > 10</code>). Se la condizione è <b>vera</b> si esegue il ramo di <b>destra</b>, se è <b>falsa</b> il ramo di <b>sinistra</b>: viene eseguito <b>uno solo</b> dei due, mai entrambi. Prova le due varianti per vedere i due rami.",
      variants: [
        { key: "vero", label: "numero = 16 → vero", ast: SEL_AST, frames: () => genSel(16) },
        { key: "falso", label: "numero = 4 → falso", ast: SEL_AST, frames: () => genSel(4) },
      ],
    },

    cicli: {
      title: "Cicli",
      note: "Un <b>ciclo</b> ripete un blocco di istruzioni più volte, finché una condizione è soddisfatta (ogni ripetizione è un'<b>iterazione</b>). Esempio: «stampa i numeri da 1 a " + N + "». Il <b>mentre (while)</b> controlla la condizione <b>prima</b> (può non partire mai). Il <b>do-while</b> la controlla <b>dopo</b> (parte almeno una volta). Il <b>per (for)</b> si usa quando si conosce già il numero di ripetizioni: un <b>contatore</b> parte da un valore e avanza fino al limite.",
      variants: [
        { key: "mentre", label: "mentre · while", ast: WHILE_AST, frames: () => genWhile(N) },
        { key: "do", label: "do-while", ast: DO_AST, frames: () => genDo(N) },
        { key: "per", label: "per · for", ast: FOR_AST, frames: () => genFor(N) },
      ],
    },
  };

  function clone(ram) { return ram.map((v) => ({ name: v.name, type: v.type, val: v.val })); }
  function setVal(ram, name, v) { const r = ram.find((x) => x.name === name); if (r) r.val = v; }

  /* ============================================================
     Player di frame
     ============================================================ */
  let lessonKey = "dichiara", frames = [], step = 0, timer = null;
  const variantIdx = {};   // ricorda la variante scelta per lezione

  function load(key) {
    stopAuto();
    lessonKey = key; step = 0;
    const L = LESSONS[key];
    $("learnSeg").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.lesson === key));
    $("learnNote").innerHTML = L.note || "";
    if (L.variants) {
      if (variantIdx[key] == null) variantIdx[key] = 0;
      renderVariants(L.variants, key);
      applyVariant(L.variants[variantIdx[key]]);
    } else {
      $("learnVariants").innerHTML = "";
      applyVariant(L);
    }
  }

  function applyVariant(v) {
    step = 0;
    frames = v.frames();
    $("learnFlow").innerHTML = window.FC.renderAST(v.ast);
    render();
  }

  function renderVariants(variants, key) {
    $("learnVariants").innerHTML = variants.map((v, i) =>
      `<button type="button" class="fc-variant${i === variantIdx[key] ? " active" : ""}" data-vi="${i}">${v.label}</button>`).join("");
  }

  function render() {
    const f = frames[step] || {};
    // evidenzia blocco corrente
    $("learnFlow").querySelectorAll(".fc-node").forEach((g) => {
      const on = g.dataset.id === f.node;
      g.classList.toggle("active", on);
      g.classList.toggle("cond-true", on && f.cond === true);
      g.classList.toggle("cond-false", on && f.cond === false);
    });
    renderViz(f);
    $("learnDesc").innerHTML = f.desc ? "<b>▸</b> " + f.desc : "&nbsp;";
    $("learnStep").disabled = step >= frames.length - 1;
  }

  function renderViz(f) {
    const ram = f.ram || [];
    let html = '<span class="state-label">RAM · memoria centrale</span>';
    if (!ram.length) {
      html += '<div class="ram-empty">memoria vuota — nessuna variabile dichiarata</div>';
    } else {
      html += '<div class="ram-table"><div class="ram-head"><span>Indirizzo</span><span>Nome</span><span>Tipo</span><span>Valore</span></div>';
      html += ram.map((v, i) => {
        const ch = f.changed === v.name ? " changed" : "";
        const val = v.val == null
          ? '<span class="ram-void">vuoto</span>'
          : '<span class="ram-val">' + esc(stripq(v.val)) + "</span>";
        return '<div class="ram-row' + ch + '"><span class="ram-addr">' + addr(i) + "</span><span class=\"ram-name\">" + esc(v.name) + '</span><span class="ram-type">' + esc(v.type) + "</span><span>" + val + "</span></div>";
      }).join("") + "</div>";
    }
    // tastiera (input)
    if (f.input) {
      if (f.input.done) {
        html += '<div class="kbd-box done"><span class="kbd-cap">⌨ l\'utente ha digitato</span><span class="kbd-val">' + esc(String(f.input.value)) + "</span></div>";
      } else {
        html += '<div class="kbd-box wait"><span class="kbd-cap">⌨ il programma aspetta un valore…</span><span class="kbd-cursor">|</span></div>';
      }
    }
    // output (console)
    if (f.out !== undefined) {
      html += '<span class="state-label" style="margin-top:1rem">Schermo · output</span>';
      html += '<div class="screen-box">' + (f.out.length
        ? f.out.map((l, i) => '<div class="screen-line' + (i === f.fresh ? " fresh" : "") + '">' + esc(l) + "</div>").join("")
        : '<span class="screen-empty">— niente stampato —</span>') + "</div>";
    }
    $("learnViz").innerHTML = html;
  }
  function stripq(v) { return typeof v === "string" ? v.replace(/^"(.*)"$/, "$1") : v; }

  /* ---------- controlli ---------- */
  function stepFwd() { if (step < frames.length - 1) { step++; render(); } else stopAuto(); }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } $("learnAuto").textContent = "▶ Auto"; }
  function toggleAuto() {
    if (timer) { stopAuto(); return; }
    if (step >= frames.length - 1) { step = 0; render(); }
    $("learnAuto").textContent = "⏸ Pausa";
    timer = setInterval(() => { if (step < frames.length - 1) stepFwd(); else stopAuto(); }, 1400);
  }

  $("learnSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-lesson]"); if (b) load(b.dataset.lesson); });
  $("learnVariants").addEventListener("click", (e) => {
    const b = e.target.closest("[data-vi]"); if (!b) return;
    stopAuto();
    const L = LESSONS[lessonKey]; if (!L.variants) return;
    variantIdx[lessonKey] = +b.dataset.vi;
    $("learnVariants").querySelectorAll(".fc-variant").forEach((x) => x.classList.toggle("active", x === b));
    applyVariant(L.variants[variantIdx[lessonKey]]);
  });
  $("learnStep").addEventListener("click", () => { stopAuto(); stepFwd(); });
  $("learnAuto").addEventListener("click", toggleAuto);
  $("learnReset").addEventListener("click", () => { stopAuto(); step = 0; render(); });

  load("dichiara");
})();
