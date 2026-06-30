/* ============================================================
   flowchart.js — Diagrammi di flusso (stile Flowgorithm)
   M1: motore di disegno SVG ricorsivo.
   Forme: terminatore, rettangolo (dichiara/assegna), parallelogramma
   (leggi/scrivi), rombo (se/mentre), esagono (per).
   Frecce: If → Falso a sinistra, Vero a destra, ricongiunzione sotto.
   While/For → Vero/Ripeti a destra nel corpo, back-edge dal fondo su
   nel vertice basso; Falso/Termina a sinistra e prosegue giù.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SVGNS = "http://www.w3.org/2000/svg";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- costanti di layout ---------- */
  const CH = 7.7, PADX = 22, MINW = 118;   // stima larghezza testo monospace
  const PH = 46;          // altezza blocchi processo/io
  const TH = 40;          // altezza terminatore
  const DH = 58;          // altezza rombo
  const HH = 50;          // altezza esagono
  const GAP = 30;         // freccia verticale tra blocchi
  const BRGAP = 26;       // stacco sotto rombo/esagono prima dei rami
  const REJOIN = 26;      // stacco prima della ricongiunzione (if)
  const HGAP = 36;        // distacco orizzontale dei rami
  const BACK = 22;        // stacco del back-edge sotto il corpo

  const textW = (s) => Math.max(MINW, s.length * CH + PADX * 2);
  let EDIT = false;   // se true, il render aggiunge i punti di inserimento «+»

  /* ---------- etichette dei blocchi ---------- */
  function label(n) {
    switch (n.type) {
      case "start": return n.label || "Inizio";
      case "end": return n.label || "Fine";
      case "declare": return "Dichiara " + n.vars + ": " + n.vtype;
      case "assign": return n.target + " = " + n.expr;
      case "input": return "Leggi " + n.name;
      case "output": return "Scrivi " + n.expr;
      case "if": return n.cond;
      case "while": return n.cond;
      case "do": return n.cond;
      case "for": return n.var + " = " + n.from + " a " + n.to;
    }
    return "?";
  }

  /* ============================================================
     MISURA — calcola estensione sinistra/destra (lw/rw) e altezza
     ============================================================ */
  function measure(n) {
    switch (n.type) {
      case "start": case "end": {
        const w = Math.max(96, label(n).length * CH + 46);
        return (n._m = { w, lw: w / 2, rw: w / 2, h: TH });
      }
      case "declare": case "assign": {
        const w = textW(label(n));
        return (n._m = { w, lw: w / 2, rw: w / 2, h: PH });
      }
      case "input": case "output": {
        const w = textW(label(n)) + 22;
        return (n._m = { w, lw: w / 2, rw: w / 2, h: PH });
      }
      case "if": return measureIf(n);
      case "while": case "for": return measureLoop(n);
      case "do": return measureDo(n);
    }
  }

  function measureSeq(body) {
    let lw = 0, rw = 0, h = 0;
    body.forEach((c, i) => {
      const m = measure(c);
      lw = Math.max(lw, m.lw); rw = Math.max(rw, m.rw);
      h += (i > 0 ? GAP : 0) + m.h;
    });
    return { lw, rw, h };
  }

  function measureIf(n) {
    const dW = Math.max(120, label(n).length * CH + 62), dH = DH;
    const mt = measureSeq(n.tBody), mf = measureSeq(n.fBody);
    const lOff = dW / 2 + HGAP + mf.rw;   // colonna FALSO a sinistra
    const rOff = dW / 2 + HGAP + mt.lw;   // colonna VERO a destra
    const h = dH + BRGAP + Math.max(mt.h, mf.h, 24) + REJOIN;
    n._lay = { dW, dH, lOff, rOff, mt, mf };
    return (n._m = { lw: lOff + mf.lw + 14, rw: rOff + mt.rw + 14, h });
  }

  function measureLoop(n) {
    const sW = Math.max(120, label(n).length * CH + (n.type === "for" ? 78 : 62));
    const sH = n.type === "for" ? HH : DH;
    const mb = measureSeq(n.body);
    const rOff = sW / 2 + HGAP + mb.lw;   // corpo a destra
    const h = sH + BRGAP + Math.max(mb.h, 24) + BACK + 24;
    n._lay = { sW, sH, rOff, mb };
    return (n._m = { lw: sW / 2 + 30, rw: rOff + mb.rw + 16, h });
  }

  function measureDo(n) {
    const dW = Math.max(120, label(n).length * CH + 62), dH = DH;
    const mb = measureSeq(n.body);
    const bodyH = n.body.length ? mb.h : 30;   // stub se il corpo è vuoto
    const ch = Math.max(mb.lw, dW / 2) + 30;   // canale del back-edge a SINISTRA
    const h = GAP + bodyH + GAP + dH + 26;      // ingresso + corpo + freccia + rombo + uscita
    n._lay = { dW, dH, mb, ch };
    return (n._m = { lw: ch + 20, rw: Math.max(mb.rw, dW / 2) + 24, h });
  }

  /* ============================================================
     DISEGNO — produce gli elementi SVG in coordinate assolute
     ============================================================ */
  function shapeSVG(kind, cx, cy, w, h, txt, id) {
    const x = cx - w / 2, y = cy - h / 2;
    let s;
    if (kind === "term") s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" class="fc-shape fc-term"/>`;
    else if (kind === "proc") s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="fc-shape fc-proc"/>`;
    else if (kind === "io") { const k = 14; s = `<polygon points="${x + k},${y} ${x + w},${y} ${x + w - k},${y + h} ${x},${y + h}" class="fc-shape fc-io"/>`; }
    else if (kind === "dec") s = `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" class="fc-shape fc-dec"/>`;
    else { const k = 16; s = `<polygon points="${x + k},${y} ${x + w - k},${y} ${x + w},${cy} ${x + w - k},${y + h} ${x + k},${y + h} ${x},${cy}" class="fc-shape fc-for"/>`; }
    return `<g class="fc-node" data-id="${id || ""}">${s}<text x="${cx}" y="${cy}" class="fc-label">${esc(txt)}</text></g>`;
  }
  const vArr = (x, y1, y2) => `<path class="fc-arrow" d="M${x} ${y1} V${y2}" marker-end="url(#fcah)"/>`;
  const pathArr = (d, head) => `<path class="fc-arrow" d="${d}"${head === false ? "" : ' marker-end="url(#fcah)"'}/>`;
  const edgeLbl = (x, y, t) => `<text x="${x}" y="${y}" class="fc-elabel ${t === "vero" || t === "Ripeti" ? "t" : "f"}">${t}</text>`;
  const plus = (cx, cy, loc, idx) =>
    `<g class="fc-plus" data-owner="${loc.owner}" data-slot="${loc.slot}" data-index="${idx}">` +
    `<circle cx="${cx}" cy="${cy}" r="9"/>` +
    `<path d="M${cx - 4} ${cy} H${cx + 4} M${cx} ${cy - 4} V${cy + 4}"/></g>`;

  // placeNode: disegna n con bordo superiore a `top`, ingresso/uscita su (cx, …)
  function placeNode(n, cx, top, out) {
    const m = n._m || measure(n);
    switch (n.type) {
      case "start": case "end": {
        out.push(shapeSVG("term", cx, top + TH / 2, m.w, TH, label(n), n.id));
        return top + TH;
      }
      case "declare": case "assign": {
        out.push(shapeSVG("proc", cx, top + PH / 2, m.w, PH, label(n), n.id));
        return top + PH;
      }
      case "input": case "output": {
        out.push(shapeSVG("io", cx, top + PH / 2, m.w, PH, label(n), n.id));
        return top + PH;
      }
      case "if": return placeIf(n, cx, top, out);
      case "while": case "for": return placeLoop(n, cx, top, out);
      case "do": return placeDo(n, cx, top, out);
    }
  }

  function placeSeq(body, cx, top, out, loc) {
    loc = loc || { owner: "root", slot: "root", full: false };
    let y = top;
    if (EDIT && loc.full && !body.length) { out.push(plus(cx, top, loc, 0)); return top; }
    if (EDIT && loc.full && body.length) { out.push(plus(cx, top - 13, loc, 0)); }
    body.forEach((c, i) => {
      if (i > 0) {
        out.push(vArr(cx, y, y + GAP));
        if (EDIT) out.push(plus(cx, y + GAP / 2, loc, i));
        y += GAP;
      }
      y = placeNode(c, cx, y, out);
    });
    if (EDIT && loc.full && body.length) { out.push(plus(cx, y + 13, loc, body.length)); }
    return y;
  }

  function placeIf(n, cx, top, out) {
    const L = n._lay, dW = L.dW, dH = L.dH;
    const cy = top + dH / 2;
    const leftX = cx - L.lOff, rightX = cx + L.rOff;
    const branchTop = top + dH + BRGAP;
    // rami: Falso a sinistra, Vero a destra
    out.push(pathArr(`M${cx - dW / 2} ${cy} H${leftX} V${branchTop}`));
    out.push(pathArr(`M${cx + dW / 2} ${cy} H${rightX} V${branchTop}`));
    out.push(edgeLbl(cx - dW / 2 - 26, cy - 6, "falso"));
    out.push(edgeLbl(cx + dW / 2 + 6, cy - 6, "vero"));
    const lb = placeSeq(n.fBody, leftX, branchTop, out, { owner: n.id, slot: "fBody", full: true });
    const rb = placeSeq(n.tBody, rightX, branchTop, out, { owner: n.id, slot: "tBody", full: true });
    const rejoinY = Math.max(lb, rb) + REJOIN;
    // ricongiunzione
    out.push(pathArr(`M${leftX} ${lb} V${rejoinY} H${cx}`, false));
    out.push(pathArr(`M${rightX} ${rb} V${rejoinY} H${cx}`, false));
    out.push(`<circle cx="${cx}" cy="${rejoinY}" r="4" class="fc-join"/>`);
    // il rombo va disegnato per ultimo (sopra le frecce)
    out.push(shapeSVG("dec", cx, cy, dW, dH, label(n), n.id));
    return rejoinY;
  }

  function placeLoop(n, cx, top, out) {
    const L = n._lay, sW = L.sW, sH = L.sH;
    const cy = top + sH / 2;
    const rightX = cx + L.rOff;
    const bodyTop = top + sH + BRGAP;
    const isFor = n.type === "for";
    // Vero/Ripeti: vertice destro → destra → giù nel corpo
    out.push(pathArr(`M${cx + sW / 2} ${cy} H${rightX} V${bodyTop}`));
    out.push(edgeLbl(cx + sW / 2 + 6, cy - 6, isFor ? "Ripeti" : "vero"));
    const bb = placeSeq(n.body, rightX, bodyTop, out, { owner: n.id, slot: "body", full: true });
    // back-edge: fondo corpo → giù → sinistra → su nel vertice basso del rombo
    const backY = bb + BACK;
    out.push(pathArr(`M${rightX} ${bb} V${backY} H${cx} V${top + sH}`));
    // Falso/Termina: vertice sinistro → sinistra → giù → rientro al centro
    const leftX = cx - sW / 2 - 24;
    const exitY = backY + 26;
    out.push(pathArr(`M${cx - sW / 2} ${cy} H${leftX} V${exitY} H${cx}`, false));
    out.push(edgeLbl(cx - sW / 2 - 52, cy + 14, isFor ? "Termina" : "falso"));
    out.push(`<circle cx="${cx}" cy="${exitY}" r="4" class="fc-join"/>`);
    out.push(shapeSVG(isFor ? "for" : "dec", cx, cy, sW, sH, label(n), n.id));
    return exitY;
  }

  // do-while (post-test): il corpo viene PRIMA (sul filo centrale), il rombo è in FONDO.
  // «vero» (ripeti) risale a sinistra fino a sopra il corpo; «falso» (esci) prosegue dritto in basso.
  function placeDo(n, cx, top, out) {
    const L = n._lay, dW = L.dW, dH = L.dH;
    const bodyTop = top + GAP;
    out.push(vArr(cx, top, bodyTop));                       // ingresso nel corpo
    let bb;
    if (!n.body.length) {                                   // corpo vuoto: stub con un «+» ben dentro il ciclo
      bb = bodyTop + 30;
      out.push(pathArr(`M${cx} ${bodyTop} V${bb}`, false));
      if (EDIT) out.push(plus(cx, bodyTop + 15, { owner: n.id, slot: "body", full: true }, 0));
    } else {
      bb = placeSeq(n.body, cx, bodyTop, out, { owner: n.id, slot: "body", full: true });
    }
    const decTop = bb + GAP;
    out.push(vArr(cx, bb, decTop));
    const cy = decTop + dH / 2;
    const chX = cx - L.ch;
    // Vero (ripeti): vertice sinistro → sinistra → su → rientra in cima al corpo
    out.push(pathArr(`M${cx - dW / 2} ${cy} H${chX} V${bodyTop - 6} H${cx} V${bodyTop}`));
    out.push(edgeLbl(cx - dW / 2 - 30, cy - 6, "vero"));
    // Falso (esci): vertice basso → dritto in basso
    const exitY = decTop + dH + 26;
    out.push(pathArr(`M${cx} ${decTop + dH} V${exitY}`, false));
    out.push(edgeLbl(cx + 8, decTop + dH + 16, "falso"));
    out.push(shapeSVG("dec", cx, cy, dW, dH, label(n), n.id));
    return exitY;
  }

  /* ============================================================
     RENDER del programma completo
     ============================================================ */
  function renderAST(prog, opts) {
    EDIT = !!(opts && opts.edit);
    let LW = 0, RW = 0, H = 0;
    prog.forEach((c, i) => {
      const m = measure(c);
      LW = Math.max(LW, m.lw); RW = Math.max(RW, m.rw);
      H += (i > 0 ? GAP : 0) + m.h;
    });
    const margin = 26;
    const cx = LW + margin;
    const width = LW + RW + margin * 2;
    const height = H + margin * 2;
    const out = [];
    placeSeq(prog, cx, margin, out, { owner: "root", slot: "root", full: false });

    const svg =
      `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="fc-svg" xmlns="${SVGNS}">` +
      `<defs><marker id="fcah" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto">` +
      `<path d="M0 0 L7 3 L0 6 z" class="fc-arrowhead"/></marker></defs>` +
      out.join("") + `</svg>`;
    return svg;
  }

  function render() { $("fcCanvas").innerHTML = renderAST(program, { edit: true }); }

  /* ============================================================
     AST di esempio (M1: hardcoded per verifica)
     ============================================================ */
  function demo() {
    return [
      { type: "start", id: "s" },
      { type: "declare", id: "d1", vars: "numero, risultato, contatore", vtype: "Intero" },
      { type: "input", id: "i1", name: "numero" },
      { type: "assign", id: "a1", target: "risultato", expr: "numero * 2" },
      { type: "if", id: "if1", cond: "risultato > 10",
        tBody: [{ type: "output", id: "o1", expr: '"grande"' }],
        fBody: [{ type: "output", id: "o2", expr: '"piccolo"' }] },
      { type: "while", id: "w1", cond: "numero < 5",
        body: [{ type: "assign", id: "a2", target: "numero", expr: "numero + 1" }] },
      { type: "for", id: "f1", var: "contatore", from: "1", to: "3",
        body: [{ type: "output", id: "o3", expr: '"Giro " & contatore' }] },
      { type: "output", id: "o4", expr: '"Risultato: " & risultato' },
      { type: "end", id: "e" },
    ];
  }

  let program = demo();
  render();
  window.FC = {
    render: render, renderAST: renderAST, measure: measure,
    get program() { return program; }, set program(p) { program = p; render(); }
  };
})();
