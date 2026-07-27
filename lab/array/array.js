/* ============================================================
   array.js — Capire gli array (1D → 4D)
   Visualizzazione grafica + codice in C, C++, Java, Python
   che si aggiornano con le dimensioni scelte. Tutto nel browser.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const NAME = "voti";

  /* config per numero di dimensioni: etichette dei "cursori", massimo, default */
  const CFG = {
    1: { labels: ["Elementi"], max: [12], def: [6] },
    2: { labels: ["Righe", "Colonne"], max: [6, 8], def: [3, 4] },
    3: { labels: ["Piani", "Righe", "Colonne"], max: [4, 5, 6], def: [2, 3, 4] },
    4: { labels: ["Gruppi", "Piani", "Righe", "Colonne"], max: [3, 3, 4, 5], def: [2, 2, 3, 3] },
  };
  const INTRO = {
    1: "Un array <b>monodimensionale</b> è una <b>fila</b> di caselle numerate da 0. Ogni casella si raggiunge con <b>un solo</b> indice: <code>" + NAME + "[2]</code> è la terza.",
    2: "Un array <b>bidimensionale</b> è una <b>tabella</b> con righe e colonne. Servono <b>due</b> indici: <code>" + NAME + "[riga][colonna]</code>.",
    3: "Un array <b>tridimensionale</b> è una <b>pila di tabelle</b> (i «piani»). Servono <b>tre</b> indici: <code>" + NAME + "[piano][riga][colonna]</code>.",
    4: "Un array a <b>quattro dimensioni</b> è un <b>gruppo di pile</b> di tabelle. Servono <b>quattro</b> indici: <code>" + NAME + "[gruppo][piano][riga][colonna]</code>. Oltre la 4ª non si disegna più tanto facilmente… ma l'idea non cambia: si aggiunge un indice!",
  };

  let dim = 1, sizes = CFG[1].def.slice(), sel = null, lang = "c";
  const LETTERS = ["i", "j", "k", "l"];

  const prod = () => sizes.reduce((a, b) => a * b, 1);
  // posizione in memoria (row-major): l'ultimo indice scorre più in fretta
  const linear = (coords) => coords.reduce((acc, c, a) => acc * sizes[a] + c, 0);

  /* ---------- Cursori delle dimensioni ---------- */
  function renderSizes() {
    const c = CFG[dim];
    $("arSizes").innerHTML = c.labels.map((lab, a) =>
      '<div class="ar-size"><span class="ar-size-lbl">' + lab + "</span>" +
      '<div class="ar-stepper"><button type="button" class="ar-step" data-a="' + a + '" data-d="-1">−</button>' +
      '<b id="szv' + a + '">' + sizes[a] + "</b>" +
      '<button type="button" class="ar-step" data-a="' + a + '" data-d="1">+</button></div></div>'
    ).join("") + '<div class="ar-total">Totale: <b>' + sizes.join(" × ") + " = " + prod() + "</b> elementi</div>";
  }

  /* ---------- Visualizzazione ---------- */
  function cell(coords) {
    const on = sel && sel.length === coords.length && sel.every((v, a) => v === coords[a]);
    return '<button type="button" class="ar-cell' + (on ? " sel" : "") + '" data-c="' + coords.join(",") + '">' + linear(coords) + "</button>";
  }
  function grid2D(prefix, r, c) {
    let h = '<div class="ar-2d" style="grid-template-columns:repeat(' + c + ',minmax(0,auto))">';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) h += cell(prefix.concat([i, j]));
    return h + "</div>";
  }
  function renderViz() {
    let h = "";
    if (dim === 1) {
      h = '<div class="ar-1d">' + range(sizes[0]).map((i) =>
        '<div class="ar-1dcell">' + cell([i]) + '<span class="ar-idx">' + i + "</span></div>").join("") + "</div>";
    } else if (dim === 2) {
      h = grid2D([], sizes[0], sizes[1]);
    } else if (dim === 3) {
      h = '<div class="ar-slices">' + range(sizes[0]).map((k) =>
        '<div class="ar-slice"><div class="ar-slice-lbl">piano ' + k + "</div>" + grid2D([k], sizes[1], sizes[2]) + "</div>").join("") + "</div>";
    } else {
      h = '<div class="ar-groups">' + range(sizes[0]).map((g) =>
        '<div class="ar-group"><div class="ar-group-lbl">gruppo ' + g + '</div><div class="ar-slices">' +
        range(sizes[1]).map((k) => '<div class="ar-slice"><div class="ar-slice-lbl">piano ' + k + "</div>" + grid2D([g, k], sizes[2], sizes[3]) + "</div>").join("") +
        "</div></div>").join("") + "</div>";
    }
    $("arViz").innerHTML = h;
  }

  function renderDetail() {
    if (!sel) {
      $("arDetail").innerHTML = '<span class="ar-hint">👆 Clicca una casella per vedere i suoi indici e come raggiungerla nel codice.</span>';
      return;
    }
    const idx = sel.map((c) => "[" + c + "]").join("");
    const lin = linear(sel);
    $("arDetail").innerHTML =
      "Hai scelto l'elemento <code>" + NAME + idx + "</code>. Per leggerlo o cambiarlo scrivi proprio <code>" + NAME + idx +
      "</code>. In memoria è l'elemento <b>n° " + lin + "</b> (si conta da 0).";
  }

  /* ---------- Codice per i 4 linguaggi ---------- */
  function pyList(d) { return d.length === 1 ? "[0] * " + d[0] : "[" + pyList(d.slice(1)) + " for _ in range(" + d[0] + ")]"; }
  function cLoops(body, pad) {
    let s = "";
    for (let a = 0; a < dim; a++) s += pad.repeat(a) + "for (int " + LETTERS[a] + " = 0; " + LETTERS[a] + " < " + sizes[a] + "; " + LETTERS[a] + "++)\n";
    return s + pad.repeat(dim) + body;
  }
  function pyLoops(body) {
    let s = "";
    for (let a = 0; a < dim; a++) s += "    ".repeat(a) + "for " + LETTERS[a] + " in range(" + sizes[a] + "):\n";
    return s + "    ".repeat(dim) + body;
  }

  function genCode() {
    const br = sizes.map((x) => "[" + x + "]").join("");        // [3][4]
    const acc = LETTERS.slice(0, dim).map((v) => "[" + v + "]").join("");
    const selIdx = (sel || sizes.map(() => 0)).map((c) => "[" + c + "]").join("");
    const head = "// Array a " + dim + "D — " + sizes.join(" × ") + "  (" + prod() + " elementi)\n";

    if (lang === "c") {
      return head +
        "int " + NAME + br + ";                 // dichiarazione\n\n" +
        NAME + selIdx + " = 7;              // scrivi un valore\n" +
        "int x = " + NAME + selIdx + ";          // leggi quel valore\n\n" +
        "// scorri TUTTI gli elementi con " + dim + " cicli annidati:\n" +
        cLoops('printf("%d ", ' + NAME + acc + ");", "  ");
    }
    if (lang === "cpp") {
      let decl = "int " + NAME + br + ";                 // array classico (come in C)\n";
      if (dim === 1) decl += "// oppure dinamico: std::vector<int> " + NAME + "(" + sizes[0] + ");\n";
      else if (dim === 2) decl += "// oppure dinamico: std::vector<std::vector<int>> " + NAME + "(" + sizes[0] + ", std::vector<int>(" + sizes[1] + "));\n";
      else decl += "// per dimensioni dinamiche: std::vector annidati\n";
      return head + decl + "\n" +
        NAME + selIdx + " = 7;              // scrivi\n" +
        "int x = " + NAME + selIdx + ";          // leggi\n\n" +
        "// scorri tutti gli elementi:\n" +
        cLoops("std::cout << " + NAME + acc + ' << " ";', "  ");
    }
    if (lang === "java") {
      return head +
        "int" + "[]".repeat(dim) + " " + NAME + " = new int" + br + ";   // dichiarazione\n\n" +
        NAME + selIdx + " = 7;              // scrivi\n" +
        "int x = " + NAME + selIdx + ";          // leggi\n\n" +
        "// scorri tutti gli elementi:\n" +
        cLoops("System.out.print(" + NAME + acc + ' + " ");', "  ");
    }
    // python
    return "# Array a " + dim + "D — " + sizes.join(" × ") + "  (" + prod() + " elementi)\n" +
      NAME + " = " + pyList(sizes) + "\n\n" +
      NAME + selIdx + " = 7            # scrivi\n" +
      "x = " + NAME + selIdx + "        # leggi\n\n" +
      "# scorri tutti gli elementi:\n" +
      pyLoops("print(" + NAME + acc + ', end=" ")');
  }
  function renderCode() { $("arCode").textContent = genCode(); }

  /* ---------- Render totale ---------- */
  function renderAll() {
    $("arIntro").innerHTML = INTRO[dim];
    renderSizes(); renderViz(); renderDetail(); renderCode();
  }

  /* ---------- Eventi ---------- */
  $("dimSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dim]"); if (!b) return;
    dim = +b.dataset.dim; sizes = CFG[dim].def.slice(); sel = null;
    $("dimSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    renderAll();
  });
  $("langSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]"); if (!b) return;
    lang = b.dataset.lang;
    $("langSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    renderCode();
  });
  $("arSizes").addEventListener("click", (e) => {
    const b = e.target.closest(".ar-step"); if (!b) return;
    const a = +b.dataset.a, d = +b.dataset.d;
    const v = Math.max(1, Math.min(CFG[dim].max[a], sizes[a] + d));
    if (v === sizes[a]) return;
    sizes[a] = v; sel = null; renderAll();
  });
  $("arViz").addEventListener("click", (e) => {
    const c = e.target.closest(".ar-cell"); if (!c) return;
    sel = c.dataset.c.split(",").map(Number);
    renderViz(); renderDetail(); renderCode();
  });

  renderAll();
})();
