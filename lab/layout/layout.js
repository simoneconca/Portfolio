/* ============================================================
   layout.js — Box Model, Flexbox & Grid Playground
   Tre modalità; l'anteprima riflette i controlli dal vivo e
   il CSS generato corrisponde all'anteprima.
   ============================================================ */
(function () {
  "use strict";

  let mode = "box";
  let itemCount = 4;

  const stage = document.getElementById("lyStage");
  const totSize = document.getElementById("lyTotSize");
  const codeEl = document.getElementById("lyCode");
  const tipEl = document.getElementById("lyTip");

  // ---------- util ----------
  function $(id) { return document.getElementById(id); }
  function val(id) { return $(id).value; }
  function num(id) { return parseInt($(id).value, 10); }
  function css(sel, decls) {
    let s = '<span class="sel">' + sel + "</span> {\n";
    decls.forEach(function (d) { s += '  <span class="prop">' + d[0] + '</span>: <span class="val">' + d[1] + "</span>;\n"; });
    s += "}";
    return s;
  }
  function setCode(html) { codeEl.innerHTML = html; }

  // ---------- BOX MODEL ----------
  function renderBox() {
    const w = num("bmW"), h = num("bmH"), pad = num("bmPad"), bd = num("bmBd"), mar = num("bmMar");
    const sizing = document.querySelector('#bmSizing .seg-btn.active').dataset.sizing;
    $("bmWval").textContent = w; $("bmHval").textContent = h;
    $("bmPadval").textContent = pad; $("bmBdval").textContent = bd; $("bmMarval").textContent = mar;

    let contentW, contentH, borderBoxW, borderBoxH;
    if (sizing === "border-box") {
      borderBoxW = w; borderBoxH = h;
      contentW = Math.max(0, w - 2 * (pad + bd));
      contentH = Math.max(0, h - 2 * (pad + bd));
    } else {
      contentW = w; contentH = h;
      borderBoxW = w + 2 * (pad + bd);
      borderBoxH = h + 2 * (pad + bd);
    }
    const totW = borderBoxW + 2 * mar, totH = borderBoxH + 2 * mar;

    stage.classList.remove("is-container");
    stage.innerHTML =
      '<div class="ly-bm-margin" style="padding:' + mar + 'px"><span class="ly-bm-tag">margin</span>' +
        '<div class="ly-bm-border" style="padding:' + bd + 'px"><span class="ly-bm-tag">border</span>' +
          '<div class="ly-bm-padding" style="padding:' + pad + 'px"><span class="ly-bm-tag">padding</span>' +
            '<div class="ly-bm-content" style="width:' + contentW + 'px;height:' + contentH + 'px">' +
              '<span class="ly-bm-cval">' + contentW + '×' + contentH + '</span>' +
            '</div></div></div></div>';

    totSize.innerHTML = 'Spazio occupato in pagina (margine incluso): <b>' + totW + ' × ' + totH + ' px</b> · ' +
      'scatola (border-box): ' + borderBoxW + ' × ' + borderBoxH + ' px';

    setCode(css(".scatola", [
      ["box-sizing", sizing],
      ["width", w + "px"],
      ["height", h + "px"],
      ["padding", pad + "px"],
      ["border", bd + "px solid"],
      ["margin", mar + "px"]
    ]));

    tipEl.innerHTML = sizing === "border-box"
      ? "<b>border-box</b>: <code>width</code> include già padding e bordo, quindi il contenuto si stringe per far spazio. È il modello più comodo nei layout reali."
      : "<b>content-box</b> (predefinito): <code>width</code> è solo il <b>contenuto</b>; padding e bordo si <i>sommano</i>, ingrandendo la scatola. Per questo 200px possono occuparne molti di più.";
  }

  // ---------- ITEMS (flex/grid) ----------
  function itemsHtml() {
    let s = "";
    for (let i = 1; i <= itemCount; i++) s += '<div class="ly-box">' + i + "</div>";
    return s;
  }

  // ---------- FLEXBOX ----------
  function renderFlex() {
    const dir = val("fxDir"), jc = val("fxJustify"), ai = val("fxAlign"), wrap = val("fxWrap");
    const gap = num("fxGap");
    $("fxGapval").textContent = gap;
    stage.classList.add("is-container");
    stage.innerHTML = '<div class="ly-flexstage" id="lyFlexStage">' + itemsHtml() + "</div>";
    const fs = $("lyFlexStage");
    fs.style.flexDirection = dir;
    fs.style.justifyContent = jc;
    fs.style.alignItems = ai;
    fs.style.flexWrap = wrap;
    fs.style.gap = gap + "px";
    totSize.innerHTML = "L'asse <b>principale</b> segue <code>flex-direction</code>; <code>justify-content</code> distribuisce lungo di esso, <code>align-items</code> sull'asse opposto.";

    setCode(css(".contenitore", [
      ["display", "flex"],
      ["flex-direction", dir],
      ["justify-content", jc],
      ["align-items", ai],
      ["flex-wrap", wrap],
      ["gap", gap + "px"]
    ]));
    tipEl.innerHTML = "<b>Flexbox</b> dispone gli elementi in <b>una direzione</b> (riga o colonna). Ideale per barre di navigazione, toolbar e allineamenti monodimensionali.";
  }

  // ---------- GRID ----------
  function renderGrid() {
    const cols = val("gdCols"), rows = val("gdRows"), ji = val("gdJustify"), ai = val("gdAlign");
    const gap = num("gdGap");
    $("gdGapval").textContent = gap;
    stage.classList.add("is-container");
    stage.innerHTML = '<div class="ly-gridstage" id="lyGridStage">' + itemsHtml() + "</div>";
    const gs = $("lyGridStage");
    gs.style.gridTemplateColumns = cols;
    gs.style.gridTemplateRows = rows;
    gs.style.justifyItems = ji;
    gs.style.alignItems = ai;
    gs.style.gap = gap + "px";
    totSize.innerHTML = "Con <b>Grid</b> definisci <b>colonne e righe</b> insieme: <code>1fr</code> è «una frazione» dello spazio disponibile, <code>repeat(3,1fr)</code> = tre colonne uguali.";

    setCode(css(".contenitore", [
      ["display", "grid"],
      ["grid-template-columns", cols],
      ["grid-template-rows", rows],
      ["gap", gap + "px"],
      ["justify-items", ji],
      ["align-items", ai]
    ]));
    tipEl.innerHTML = "<b>Grid</b> è <b>bidimensionale</b> (righe + colonne contemporaneamente). Perfetta per gallerie, dashboard e l'impalcatura generale di una pagina.";
  }

  // ---------- dispatch ----------
  function render() {
    if (mode === "box") renderBox();
    else if (mode === "flex") renderFlex();
    else renderGrid();
  }

  // ---------- wiring ----------
  document.querySelectorAll("#lyModeSeg .seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#lyModeSeg .seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      mode = btn.dataset.mode;
      document.querySelectorAll(".ly-mode-panel").forEach(function (p) { p.hidden = p.dataset.mode !== mode; });
      render();
    });
  });

  // box-sizing segmented
  document.querySelectorAll("#bmSizing .seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#bmSizing .seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active"); render();
    });
  });

  // tutti gli input chiamano render
  document.querySelectorAll(".ly-ctrls input, .ly-ctrls select").forEach(function (el) {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  // add/remove item
  document.querySelectorAll("[data-items]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const delta = parseInt(btn.dataset.items, 10);
      itemCount = Math.max(1, Math.min(12, itemCount + delta));
      document.querySelectorAll(".ly-count").forEach(function (c) { c.textContent = itemCount + " item"; });
      render();
    });
  });

  // copia CSS
  document.getElementById("lyCopy").addEventListener("click", function () {
    const btn = this;
    const text = codeEl.textContent;
    const done = function () { btn.classList.add("done"); btn.textContent = "Copiato ✓"; setTimeout(function () { btn.classList.remove("done"); btn.textContent = "Copia CSS"; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  });

  render();
})();
