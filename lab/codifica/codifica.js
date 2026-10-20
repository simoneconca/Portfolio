/* ============================================================
   codifica.js — Codifica dei file
   Intro: cos'è codifica/decodifica (andata e ritorno col codice ASCII)
   Poi: testo (ASCII + Unicode), immagini (RGB, pixel, grigi),
   suono (campionamento), video (fotogrammi), compressione (RLE + JPG).
   Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const bin = (n, len) => (n >>> 0).toString(2).padStart(len, "0");

  /* ============================================================
     Intro — codifica / decodifica (andata e ritorno)
     ============================================================ */
  function renderCodec() {
    const s = $("codecIn").value || "";
    const chars = [...s].filter((c) => c.codePointAt(0) <= 255);
    const wrong = $("codecWrong").checked;
    const show = (c) => (c === " " ? "␣" : esc(c));
    $("codecHuman").innerHTML = chars.length
      ? chars.map((c) => `<span class="cx-ch">${show(c)}</span>`).join("")
      : '<span class="txt-hint">scrivi una parola…</span>';
    $("codecBits").innerHTML = chars.map((c) => `<span class="cx-byte">${bin(c.codePointAt(0), 8)}</span>`).join("");
    $("codecBack").innerHTML = chars.map((c) => {
      const code = c.codePointAt(0);
      const d = wrong ? String.fromCharCode(((code - 32 + 5) % 95) + 32) : String.fromCharCode(code);
      return `<span class="cx-ch${wrong ? " wrong" : ""}">${show(d)}</span>`;
    }).join("");
  }
  $("codecIn").addEventListener("input", renderCodec);
  $("codecWrong").addEventListener("change", renderCodec);

  /* ============================================================
     Testo → ASCII
     ============================================================ */
  function renderText() {
    const s = $("txtIn").value || "";
    if (!s) { $("txtOut").innerHTML = `<p class="txt-hint">Scrivi qualcosa qui sopra.</p>`; return; }
    $("txtOut").innerHTML = [...s].map((ch) => {
      const code = ch.codePointAt(0);
      const over = code > 127;
      const shown = ch === " " ? "␣" : esc(ch);
      return `<div class="txt-cell ${over ? "over" : ""}">` +
        `<span class="tc-char">${shown}</span>` +
        `<span class="tc-dec">${code}</span>` +
        `<span class="tc-bin">${over ? "fuori ASCII" : bin(code, 8)}</span></div>`;
    }).join("");
  }
  $("txtIn").addEventListener("input", renderText);

  const CTRL = ["NUL","SOH","STX","ETX","EOT","ENQ","ACK","BEL","BS","TAB","LF","VT","FF","CR","SO","SI",
                "DLE","DC1","DC2","DC3","DC4","NAK","SYN","ETB","CAN","EM","SUB","ESC","FS","GS","RS","US"];
  function buildAscii() {
    let html = "";
    for (let i = 0; i < 128; i++) {
      const ctrl = i < 32 || i === 127;
      let label;
      if (i < 32) label = CTRL[i];
      else if (i === 32) label = "␣";
      else if (i === 127) label = "DEL";
      else label = esc(String.fromCharCode(i));
      html += `<div class="ascii-cell${ctrl ? " ctrl" : ""}${i === 32 ? " space" : ""}">` +
        `<span class="ac-dec">${i}</span>` +
        `<span class="ac-char">${label}</span>` +
        `<span class="ac-bin">${bin(i, 8)}</span></div>`;
    }
    $("asciiTable").innerHTML = html;
  }
  $("asciiToggle").addEventListener("click", () => {
    const t = $("asciiTable"), btn = $("asciiToggle"), leg = $("asciiLegend");
    const opening = t.hidden;
    if (opening && !t.dataset.built) { buildAscii(); t.dataset.built = "1"; }
    t.hidden = !opening; leg.hidden = !opening;
    btn.setAttribute("aria-expanded", String(opening));
    btn.textContent = opening ? "✕ Nascondi la tabella ASCII completa" : "📋 Mostra la tabella ASCII completa (0–127)";
  });

  /* ---------- Testo → Unicode / UTF-8 ---------- */
  function renderUnicode() {
    const s = $("uniIn").value || "";
    const chars = [...s];
    if (!chars.length) { $("uniOut").innerHTML = `<p class="txt-hint">Scrivi un carattere qui sopra.</p>`; return; }
    const enc = new TextEncoder();
    $("uniOut").innerHTML = chars.map((ch) => {
      const cp = ch.codePointAt(0);
      const u = "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
      const bytes = [...enc.encode(ch)];
      const nb = bytes.length;
      const hexB = bytes.map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join(" ");
      const binB = bytes.map((x) => (x >>> 0).toString(2).padStart(8, "0")).join(" ");
      return `<div class="uni-cell b${nb}">` +
        `<span class="uc-char">${esc(ch)}</span>` +
        `<span class="uc-cp">${u}</span>` +
        `<span class="uc-nb">${nb} byte</span>` +
        `<span class="uc-hex">${hexB}</span>` +
        `<span class="uc-bin">${binB}</span></div>`;
    }).join("");
  }
  $("uniIn").addEventListener("input", renderUnicode);
  $("uniExamples").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ch]"); if (!b) return;
    $("uniIn").value = b.dataset.ch; renderUnicode();
  });

  /* ============================================================
     Immagini → RGB + esadecimale
     ============================================================ */
  const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");
  const lumaDark = (r, g, b) => (r * 0.299 + g * 0.587 + b * 0.114) > 140;

  function renderRGB() {
    const r = +$("rR").value, g = +$("rG").value, b = +$("rB").value;
    $("rRv").textContent = r; $("rGv").textContent = g; $("rBv").textContent = b;
    const hx = "#" + hex2(r) + hex2(g) + hex2(b);
    const sw = $("rgbSwatch");
    sw.style.background = `rgb(${r},${g},${b})`;
    sw.style.color = lumaDark(r, g, b) ? "#111" : "#fff";
    sw.innerHTML = `<span class="sw-hex">${hx}</span><span class="sw-rgb">rgb(${r}, ${g}, ${b})</span>`;
    $("rgbBits").innerHTML =
      `<div class="rb r"><span>R ${r}</span><code>${bin(r, 8)}</code><em>${hex2(r)}</em></div>` +
      `<div class="rb g"><span>G ${g}</span><code>${bin(g, 8)}</code><em>${hex2(g)}</em></div>` +
      `<div class="rb b"><span>B ${b}</span><code>${bin(b, 8)}</code><em>${hex2(b)}</em></div>` +
      `<div class="rb tot"><span>24 bit = 3 byte</span><code>${bin(r, 8)} ${bin(g, 8)} ${bin(b, 8)}</code></div>` +
      `<div class="rb hex"><span>esadecimale</span><code class="hexcode">${hx}</code></div>`;
    $("hexExplain").innerHTML =
      `Ogni byte (8 bit) si accorcia in <b>2 cifre esadecimali</b>: ` +
      `<code>${bin(r, 8)}</code> = <b>${hex2(r)}</b>, e così per ogni canale. ` +
      `Uniti danno il colore <code class="hex-pill">${hx}</code> — lo stesso che usi nel codice HTML/CSS. ` +
      `<span class="hex-ff">FF = 255 (massimo), 00 = 0 (minimo).</span>`;
    brush = [r, g, b];
    const pb = $("pxBrush");
    if (pb) { pb.style.background = `rgb(${r},${g},${b})`; pb.title = hx; }
  }
  ["rR", "rG", "rB"].forEach((id) => $(id).addEventListener("input", renderRGB));

  /* ---------- Immagini → griglia di pixel ---------- */
  const GW = 16, GH = 16;
  let grid = [];
  let brush = [233, 30, 99];
  let cell = 18, showGrid = true, hoverCell = null;
  const SKY = [170, 214, 240];

  function newGrid(fill) {
    grid = [];
    for (let y = 0; y < GH; y++) { const row = []; for (let x = 0; x < GW; x++) row.push(fill.slice()); grid.push(row); }
  }
  function loadExample() {
    newGrid(SKY);
    const cx = 7.5, cy = 6;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < 1.7) grid[y][x] = [255, 193, 7];
      else if (d < 3.4) grid[y][x] = [233, 30, 99];
    }
    for (let y = 9; y <= 14; y++) { grid[y][7] = [76, 175, 80]; grid[y][8] = [76, 175, 80]; }
    grid[11][5] = [46, 125, 50]; grid[11][6] = [46, 125, 50];
    grid[12][9] = [46, 125, 50]; grid[12][10] = [46, 125, 50];
    for (let x = 0; x < GW; x++) grid[15][x] = [76, 175, 80];
    paintGrid();
  }

  function drawCanvas(cv, c, withGrid) {
    const ctx = cv.getContext("2d");
    cv.width = GW * c; cv.height = GH * c;
    cv.style.width = (GW * c) + "px"; cv.style.height = (GH * c) + "px";
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const p = grid[y][x];
      ctx.fillStyle = `rgb(${p[0]},${p[1]},${p[2]})`;
      ctx.fillRect(x * c, y * c, c, c);
      if (withGrid && c >= 9) {
        ctx.strokeStyle = "rgba(0,0,0,0.14)"; ctx.lineWidth = 1;
        ctx.strokeRect(x * c + 0.5, y * c + 0.5, c - 1, c - 1);
      }
    }
    if (hoverCell && cv.id === "pxCanvas") {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.strokeRect(hoverCell[0] * c + 1, hoverCell[1] * c + 1, c - 2, c - 2);
      ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
      ctx.strokeRect(hoverCell[0] * c + 0.5, hoverCell[1] * c + 0.5, c - 1, c - 1);
    }
  }
  function paintGrid() {
    drawCanvas($("pxCanvas"), cell, showGrid);
    drawCanvas($("pxReal"), 3, false);
    renderStats();
  }
  function renderStats() {
    const tot = GW * GH, bytes = tot * 3;
    const kb = (bytes / 1024).toFixed(2).replace(".", ",");
    $("pxStats").innerHTML =
      `<span class="px-stat"><b>${GW} × ${GH}</b> = ${tot} pixel</span>` +
      `<span class="px-stat"><b>24 bit</b> per pixel (colore)</span>` +
      `<span class="px-stat">peso grezzo: ${tot} × 3 byte = <b>${bytes} byte</b> (${kb} KB)</span>`;
  }
  function cellFromEvent(e) {
    const cv = $("pxCanvas"), rect = cv.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (cv.width / rect.width);
    const py = (e.clientY - rect.top) * (cv.height / rect.height);
    const x = Math.floor(px / cell), y = Math.floor(py / cell);
    if (x < 0 || x >= GW || y < 0 || y >= GH) return null;
    return [x, y];
  }
  function showReadout(x, y) {
    const p = grid[y][x];
    const hx = "#" + hex2(p[0]) + hex2(p[1]) + hex2(p[2]);
    $("pxReadout").innerHTML =
      `<span class="pr-pos">pixel (${x}, ${y})</span>` +
      `<span class="pr-sw" style="background:rgb(${p[0]},${p[1]},${p[2]})"></span>` +
      `<span class="pr-line"><b class="r">R ${p[0]}</b> <b class="g">G ${p[1]}</b> <b class="b">B ${p[2]}</b></span>` +
      `<span class="pr-hex">${hx}</span>` +
      `<span class="pr-bin">${bin(p[0], 8)} ${bin(p[1], 8)} ${bin(p[2], 8)}</span>`;
  }
  function buildGrayRamp() {
    const el = $("grayRamp"); if (!el) return;
    let h = "";
    for (let i = 0; i <= 10; i++) { const v = Math.round(i * 25.5); h += `<span style="background:rgb(${v},${v},${v})"></span>`; }
    el.innerHTML = h;
  }

  /* ---------- Scala di grigi ---------- */
  function renderGray() {
    const v = +$("grayVal").value;
    $("grayValV").textContent = v;
    const sw = $("graySwatch");
    sw.style.background = `rgb(${v},${v},${v})`;
    sw.style.color = v > 140 ? "#111" : "#fff";
    sw.textContent = v + " / 255";
    $("grayBits").innerHTML =
      `<div class="gl-row"><span>decimale</span><code>${v}</code></div>` +
      `<div class="gl-row"><span>binario · 1 byte</span><code>${bin(v, 8)}</code></div>` +
      `<div class="gl-row"><span>esadecimale</span><code>${hex2(v)}</code></div>`;
  }
  function wireGray() { buildGrayRamp(); $("grayVal").addEventListener("input", renderGray); renderGray(); }

  function wirePixelGrid() {
    const cv = $("pxCanvas");
    cv.addEventListener("mousemove", (e) => {
      const c = cellFromEvent(e); if (!c) return;
      hoverCell = c; showReadout(c[0], c[1]); paintGrid();
    });
    cv.addEventListener("mouseleave", () => { hoverCell = null; paintGrid(); });
    let painting = false;
    const paintAt = (e) => { const c = cellFromEvent(e); if (!c) return; grid[c[1]][c[0]] = brush.slice(); hoverCell = c; showReadout(c[0], c[1]); paintGrid(); };
    cv.addEventListener("mousedown", (e) => { painting = true; paintAt(e); });
    cv.addEventListener("mousemove", (e) => { if (painting) paintAt(e); });
    window.addEventListener("mouseup", () => { painting = false; });
    cv.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.touches[0]; const c = cellFromEvent(t); if (c) { grid[c[1]][c[0]] = brush.slice(); showReadout(c[0], c[1]); paintGrid(); } }, { passive: false });

    $("pxZoom").addEventListener("input", () => { cell = +$("pxZoom").value; paintGrid(); });
    $("pxGrid").addEventListener("change", () => { showGrid = $("pxGrid").checked; paintGrid(); });
    $("pxExample").addEventListener("click", loadExample);
    $("pxClear").addEventListener("click", () => { newGrid([255, 255, 255]); hoverCell = null; $("pxReadout").textContent = "Passa sopra un pixel per vederne i valori…"; paintGrid(); });
  }

  /* ---------- helper: byte leggibili ---------- */
  function fmtBytes(n) {
    const u = ["byte", "KB", "MB", "GB", "TB"]; let i = 0, v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(v < 10 && i > 0 ? 1 : 0).replace(".", ",") + " " + u[i];
  }

  /* ============================================================
     Video → fotogrammi
     ============================================================ */
  let vidTimer = null, vidFrame = 0, vidFps = 8;
  const VIDLEN = 48;
  function drawVidFrame() {
    const cv = $("vidCanvas"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
    ctx.fillStyle = "#0e1726"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1b2b45"; ctx.fillRect(0, H - 16, W, 16);
    const t = vidFrame / VIDLEN;
    const x = 22 + (W - 44) * t;
    const bounce = Math.abs(Math.sin(t * Math.PI * 3));
    const y = H - 22 - (H - 64) * bounce;
    ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fillStyle = "#e6a15a"; ctx.fill();
    ctx.fillStyle = "rgba(230,161,90,0.25)"; ctx.beginPath(); ctx.ellipse(x, H - 14, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    $("vidFrame").textContent = "fotogramma " + (vidFrame + 1) + " / " + VIDLEN;
  }
  function vidTick() { vidFrame = (vidFrame + 1) % VIDLEN; drawVidFrame(); }
  function vidStop() { if (vidTimer) { clearInterval(vidTimer); vidTimer = null; } const b = $("vidPlay"); if (b) { b.textContent = "▶ Avvia"; b.classList.remove("on"); } }
  function vidPlay() {
    if (vidTimer) { vidStop(); return; }
    $("vidPlay").textContent = "⏸ Pausa"; $("vidPlay").classList.add("on");
    vidTimer = setInterval(vidTick, 1000 / vidFps);
  }
  function wireVideo() {
    $("vidPlay").addEventListener("click", vidPlay);
    $("vidFps").addEventListener("input", () => {
      vidFps = +$("vidFps").value; $("vidFpsV").textContent = vidFps;
      if (vidTimer) { clearInterval(vidTimer); vidTimer = setInterval(vidTick, 1000 / vidFps); }
    });
    const calc = () => {
      const [w, h] = $("vcRes").value.split("x").map(Number);
      const fps = +$("vcFps").value, dur = +$("vcDur").value;
      $("vcDurV").textContent = dur + " s";
      const perFrame = w * h * 3, frames = fps * dur, raw = perFrame * frames, comp = raw / 200;
      $("vidResult").innerHTML =
        `<div class="vr-line">1 fotogramma = ${w}×${h}×3 byte = <b>${fmtBytes(perFrame)}</b></div>` +
        `<div class="vr-line">${fps} fps × ${dur} s = <b>${frames} fotogrammi</b></div>` +
        `<div class="vr-big">grezzo: <b>${fmtBytes(raw)}</b></div>` +
        `<div class="vr-note">con la compressione video (~200×) ≈ <b>${fmtBytes(comp)}</b></div>`;
    };
    ["vcRes", "vcFps", "vcDur"].forEach((id) => $(id).addEventListener("input", calc));
    calc(); drawVidFrame();
  }

  /* ============================================================
     Compressione: RLE (lossless) + JPG (lossy)
     ============================================================ */
  const RLE_COLORS = { R: [224, 83, 61], G: [63, 174, 107], B: [44, 111, 224], Y: [240, 193, 7], W: [232, 232, 232] };
  let rleData = [];
  function drawRle() {
    $("rleRow").innerHTML = rleData.map((k) => { const c = RLE_COLORS[k]; return `<span style="background:rgb(${c[0]},${c[1]},${c[2]})"></span>`; }).join("");
    const runs = []; let i = 0;
    while (i < rleData.length) { let j = i; while (j < rleData.length && rleData[j] === rleData[i]) j++; runs.push([j - i, rleData[i]]); i = j; }
    const rleStr = runs.map((r) => r[0] + "×" + r[1]).join("  ");
    const orig = rleData.length, comp = runs.length * 2;
    const ratio = (orig / comp).toFixed(2).replace(".", ",");
    $("rleOut").innerHTML =
      `<div class="rle-line"><span class="rle-lbl">originale</span><code>${rleData.join(" ")}</code><em>${orig} simboli</em></div>` +
      `<div class="rle-line"><span class="rle-lbl">RLE</span><code>${rleStr}</code><em>${comp} simboli</em></div>` +
      `<div class="rle-ratio">` + (comp < orig
        ? `compressione <b>${ratio}×</b> — e riespandendo si riottiene l'originale identico ✓`
        : `qui l'RLE <b>non conviene</b> (${comp} ≥ ${orig}): senza ripetizioni non c'è nulla da accorciare`) + `</div>`;
  }
  function rleOrdinata() { rleData = "RRRRRRRRGGGGGBBBBWWWWWWYY".split(""); drawRle(); }
  function rleCasuale() { const k = "RGBYW".split(""); rleData = Array.from({ length: 24 }, () => k[Math.floor(Math.random() * 5)]); drawRle(); }

  function buildJpgSource() {
    const cv = $("jpgSrc"), ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#2c6fe0"); g.addColorStop(0.5, "#e0a53d"); g.addColorStop(1, "#c2415a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(18 + i * 26, 34 + (i % 2) * 48, 13, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#0e1726"; ctx.font = "bold 30px monospace"; ctx.fillText("JPG", 44, 86);
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 46; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(img, 0, 0);
  }
  function dataUrlBytes(url) {
    const b64 = url.slice(url.indexOf(",") + 1);
    const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    return Math.floor(b64.length * 3 / 4) - pad;
  }
  function renderJpg() {
    const q = +$("jpgQ").value; $("jpgQV").textContent = q + "%";
    const src = $("jpgSrc");
    const jpg = src.toDataURL("image/jpeg", q / 100), png = src.toDataURL("image/png");
    $("jpgImg").src = jpg;
    const jb = dataUrlBytes(jpg), pb = dataUrlBytes(png);
    $("jpgStats").innerHTML =
      `<div class="js-row">JPG @ ${q}%: <b>${fmtBytes(jb)}</b></div>` +
      `<div class="js-row js-png">PNG (lossless): ${fmtBytes(pb)}</div>` +
      `<div class="js-save">≈ <b>${(pb / jb).toFixed(1).replace(".", ",")}×</b> più piccolo del PNG senza perdita</div>`;
    $("jpgCap").textContent = q >= 80 ? "qualità alta — difetti quasi invisibili"
      : q >= 40 ? "qualità media — iniziano i difetti" : "qualità bassa — blocchi e aloni ben visibili";
  }
  function wireCompression() {
    rleOrdinata();
    $("rleOrdinata").addEventListener("click", rleOrdinata);
    $("rleCasuale").addEventListener("click", rleCasuale);
    buildJpgSource();
    $("jpgQ").addEventListener("input", renderJpg);
    renderJpg();
  }

  /* ============================================================
     Suono → campionamento
     ============================================================ */
  function renderSound() {
    const n = +$("sndRate").value;
    $("sndRatev").textContent = n;
    const W = 600, H = 200, mid = H / 2, amp = 64, cycles = 2;
    const yAt = (x) => mid - amp * Math.sin((x / W) * cycles * 2 * Math.PI);
    let wave = "M0 " + yAt(0).toFixed(1);
    for (let x = 2; x <= W; x += 2) wave += " L" + x + " " + yAt(x).toFixed(1);
    let dots = "", recon = "";
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W, y = yAt(x);
      recon += (i === 0 ? "M" : " L") + x.toFixed(1) + " " + y.toFixed(1);
      dots += `<line x1="${x.toFixed(1)}" y1="${mid}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="snd-stick"/>` +
              `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" class="snd-dot"/>`;
    }
    $("sndWave").innerHTML =
      `<line x1="0" y1="${mid}" x2="${W}" y2="${mid}" class="snd-axis"/>` +
      `<path d="${wave}" class="snd-analog"/>` +
      `<path d="${recon}" class="snd-digital"/>` + dots;
    const q = n < 10 ? "bassa — il suono digitale è molto diverso dall'originale (distorto)"
            : n < 22 ? "media — si riconosce, ma si perdono i dettagli"
            : n < 44 ? "buona — molto fedele all'originale"
            : "alta — quasi identico all'originale (ma il file pesa di più)";
    $("sndQuality").innerHTML = `Qualità: <b>${q}</b>`;
  }
  $("sndRate").addEventListener("input", renderSound);

  /* ============================================================
     Sotto-schede (tipo di file)
     ============================================================ */
  const codPanes = document.querySelectorAll(".cod-pane");
  $("codSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cod]"); if (!b) return;
    $("codSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    codPanes.forEach((p) => p.hidden = p.dataset.cod !== b.dataset.cod);
    if (b.dataset.cod !== "video") vidStop();
  });

  /* ---------- Avvio ---------- */
  renderCodec();
  renderText();
  renderUnicode();
  wirePixelGrid();
  wireGray();
  loadExample();
  renderRGB();
  wireVideo();
  wireCompression();
  renderSound();
})();
