/* ============================================================
   avanzate.js — Binary & Base Analyzer (sezioni avanzate)
   05 Complemento a due · 06 Somma binaria · 07 Virgola mobile (IEEE 754)
   BigInt per l'esattezza. Nessuna dipendenza esterna.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const setActive = (groupId, btn) => {
    $(groupId).querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  };
  // raggruppa una stringa di bit in nibble separati da spazio
  const group = (s) => { let o = ""; for (let i = 0; i < s.length; i++) { if (i > 0 && (s.length - i) % 4 === 0) o += " "; o += s[i]; } return o; };

  /* ============================================================
     05 — Complemento a due (passo per passo)
     ============================================================ */
  let c2W = 8;
  function c2Cells(str, sign) {
    const n = str.length; let out = "";
    for (let idx = 0; idx < n; idx++) {
      const i = n - 1 - idx;
      if (idx > 0 && i % 4 === 3) out += `<span class="c2-sep"></span>`;
      const isSign = sign && idx === 0;
      out += `<span class="c2-bit ${str[idx] === "1" ? "on" : ""}${isSign ? " sign" : ""}">${str[idx]}</span>`;
    }
    return out;
  }
  function renderC2() {
    const raw = $("c2num").value.trim(), steps = $("c2steps");
    if (raw === "" || raw === "-") { steps.innerHTML = `<p class="mini-hint">Scrivi un numero intero (anche negativo).</p>`; return; }
    if (!/^-?\d+$/.test(raw)) { steps.innerHTML = `<p class="mini-hint err">Solo cifre 0-9 (e − davanti per i negativi).</p>`; return; }
    const W = c2W, mod = 1n << BigInt(W), signBit = 1n << BigInt(W - 1);
    const n = BigInt(raw), min = -signBit, max = signBit - 1n;
    if (n < min || n > max) { steps.innerHTML = `<p class="mini-hint err">A <b>${W} bit con segno</b> puoi rappresentare da <b>${min}</b> a <b>${max}</b>: <b>${n}</b> è fuori range.</p>`; return; }
    const pat = ((n % mod) + mod) % mod, patStr = pat.toString(2).padStart(W, "0");
    if (n >= 0) {
      steps.innerHTML =
        `<div class="c2-step"><span class="c2-lbl"><b>${n}</b> è positivo (o zero) → si scrive direttamente in binario, con il bit di segno a <b>0</b>.</span><div class="c2-bits">${c2Cells(patStr, true)}</div></div>` +
        `<div class="c2-final"><b>${n}</b> a ${W} bit = <code>${group(patStr)}</code> · bit di segno <b>0</b> = positivo.</div>`;
      return;
    }
    const abs = -n;
    const absStr = (abs % mod).toString(2).padStart(W, "0");
    const invStr = absStr.split("").map((c) => (c === "1" ? "0" : "1")).join("");
    const sumVal = BigInt("0b" + patStr);
    steps.innerHTML =
      `<div class="c2-step"><span class="c2-lbl"><b>1.</b> Scrivi il valore assoluto <b>${abs}</b> in binario a ${W} bit.</span><div class="c2-bits">${c2Cells(absStr)}</div></div>` +
      `<div class="c2-step"><span class="c2-lbl"><b>2.</b> Inverti <b>tutti</b> i bit (complemento a <i>uno</i>): ogni 0 diventa 1 e viceversa.</span><div class="c2-bits">${c2Cells(invStr)}</div></div>` +
      `<div class="c2-step"><span class="c2-lbl"><b>3.</b> Aggiungi <b>1</b>: ottieni il complemento a <i>due</i>.</span><div class="c2-bits">${c2Cells(patStr, true)}</div></div>` +
      `<div class="c2-final"><b>${n}</b> a ${W} bit = <code>${group(patStr)}</code> · bit di segno <b>1</b> = negativo. ` +
      `Verifica: ${sumVal} − 2<sup>${W}</sup> (${mod}) = <b>${n}</b>.</div>`;
  }

  /* ============================================================
     06 — Somma binaria (con riporto)
     ============================================================ */
  let sumW = 8;
  function sumRow(tag, chars, cls, lead) {
    const n = chars.length;
    let cells = `<span class="sum-cell lead ${lead === "1" ? "on" : ""}">${lead || ""}</span>`;
    for (let idx = 0; idx < n; idx++) {
      const i = n - 1 - idx;
      if (idx > 0 && i % 4 === 3) cells += `<span class="sum-gap"></span>`;
      const ch = chars[idx];
      cells += `<span class="sum-cell ${ch === "1" ? "on" : ""}${ch === "·" ? " dot" : ""}">${ch}</span>`;
    }
    return `<div class="sum-row ${cls || ""}"><span class="sum-tag">${tag}</span><span class="sum-cells">${cells}</span></div>`;
  }
  function renderSum() {
    const rawA = $("sumA").value.trim(), rawB = $("sumB").value.trim();
    const work = $("sumWork"), check = $("sumCheck");
    if (!/^\d+$/.test(rawA) || !/^\d+$/.test(rawB)) { work.innerHTML = `<p class="mini-hint err">Inserisci due numeri interi positivi.</p>`; check.innerHTML = ""; return; }
    const W = sumW, mod = 1n << BigInt(W), max = mod - 1n;
    const A = BigInt(rawA), B = BigInt(rawB);
    if (A > max || B > max) { work.innerHTML = `<p class="mini-hint err">A <b>${W} bit</b> ogni numero arriva al massimo a <b>${max}</b>: riduci gli addendi o passa a 16 bit.</p>`; check.innerHTML = ""; return; }
    const aStr = A.toString(2).padStart(W, "0"), bStr = B.toString(2).padStart(W, "0");
    const carries = new Array(W + 1).fill(0), res = new Array(W).fill(0);
    for (let i = 0; i < W; i++) {
      const ai = Number((A >> BigInt(i)) & 1n), bi = Number((B >> BigInt(i)) & 1n);
      const s = ai + bi + carries[i]; res[i] = s & 1; carries[i + 1] = s >> 1;
    }
    const carryOut = carries[W];
    // riga dei riporti: sopra la colonna i mettiamo il riporto che ENTRA (carries[i])
    const carryChars = [];
    for (let idx = 0; idx < W; idx++) { const i = W - 1 - idx; carryChars.push(carries[i] ? "1" : "·"); }
    const resStr = res.slice().reverse().join("");
    work.innerHTML =
      sumRow("riporti", carryChars, "carry", carryOut ? "1" : "") +
      sumRow("A", aStr.split("")) +
      sumRow("+ B", bStr.split(""), "plus") +
      sumRow("=", resStr.split(""), "result", carryOut ? "1" : "");
    const sumVal = A + B, over = carryOut === 1;
    check.innerHTML =
      `In decimale: <b>${rawA} + ${rawB} = ${sumVal}</b>. ` +
      (over
        ? `⚠️ Il risultato <b>non entra</b> in ${W} bit: c'è un <b>riporto finale</b> (overflow). Troncato a ${W} bit varrebbe <b>${(A + B) % mod}</b>.`
        : `Entra in ${W} bit ✓`);
  }

  /* ============================================================
     07 — Virgola mobile (IEEE 754, 32 bit) — esplorabile + tutorial
     ============================================================ */
  let fpBits = "0".repeat(32);  // stato autorevole: 32 bit
  let fpNum = 0;                // numero da scomporre nel tutorial
  let fpOriginal = "0";         // etichetta "numero di partenza"
  let fpRounded = false;        // il valore digitato è stato arrotondato?
  const fpDv = new DataView(new ArrayBuffer(4));
  const bitsToStored = () => { fpDv.setUint32(0, parseInt(fpBits, 2)); return fpDv.getFloat32(0); };
  function numStr(x) {
    if (!isFinite(x)) return String(x);
    if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x);
    let s = x.toPrecision(8);
    if (s.indexOf("e") < 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }

  function fmt(x) {
    if (!isFinite(x)) return String(x);
    if (x === 0) return "0";
    let s = x.toPrecision(9);
    if (s.indexOf("e") < 0 && s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s.replace(".", ",");
  }
  // numero decimale leggibile per i passaggi della frazione
  const fmtFrac = (x) => (Math.round(x * 1e6) / 1e6).toString().replace(".", ",");
  // scomposizione in potenze di 2 di un intero positivo (6 → "4 + 2")
  function powSum(n) {
    const t = []; let b = n, i = 0;
    while (b > 0) { if (b % 2 === 1) t.unshift(Math.pow(2, i)); b = Math.floor(b / 2); i++; }
    return t.join(" + ");
  }
  // celle dei 32 bit (1 segno · 8 esponente · 23 mantissa); clickable = esplorabili
  function fpCells(bits, clickable) {
    let cells = "";
    for (let i = 0; i < 32; i++) {
      const cls = i === 0 ? "s" : i < 9 ? "e" : "m";
      const attrs = clickable ? ` data-i="${i}" role="button" tabindex="0" aria-label="bit ${i}, valore ${bits[i]}"` : "";
      cells += `<span class="fp-bit ${cls} ${bits[i] === "1" ? "on" : ""}"${attrs}>${bits[i]}</span>`;
      if (i === 0 || i === 8) cells += `<span class="fp-gap"></span>`;
    }
    return cells;
  }
  const fpBitsRow = (bits) => `<div class="fp-bits">${fpCells(bits, false)}</div>`;

  // lettura live della scomposizione (dai bit correnti)
  function fpLiveHtml() {
    const sign = fpBits[0], expF = fpBits.slice(1, 9), mantF = fpBits.slice(9);
    const expVal = parseInt(expF, 2), E = expVal - 127;
    let frac = 0; for (let k = 0; k < 23; k++) if (mantF[k] === "1") frac += Math.pow(2, -(k + 1));
    const mantVal = 1 + frac, stored = bitsToStored();
    let tag = "";
    if (expVal === 0 && frac === 0) tag = "zero";
    else if (expVal === 255) tag = mantF.indexOf("1") >= 0 ? "NaN" : "∞";
    else if (expVal === 0) tag = "denormale";
    return `<div class="fp-live-fields">` +
      `<div class="fp-lf s"><span>segno</span><b>${sign}</b><em>${sign === "1" ? "negativo −" : "positivo +"}</em></div>` +
      `<div class="fp-lf e"><span>esponente</span><b>${expVal}</b><em>${expVal} − 127 = ${E}</em></div>` +
      `<div class="fp-lf m"><span>mantissa</span><b>${fmt(mantVal)}</b><em>1 + ${fmt(frac)}</em></div>` +
      `</div>` +
      `<div class="fp-live-val">(−1)<sup>${sign}</sup> × ${fmt(mantVal)} × 2<sup>${E}</sup> = <b>${fmt(stored)}</b>${tag ? ` <span class="fp-tag">${tag}</span>` : ""}</div>`;
  }

  // tutorial passo passo: scompone fpNum, usando fpBits per i campi esatti
  function renderTutorial() {
    const tut = $("fpTutorial"), num = fpNum, stored = bitsToStored();
    const expField = fpBits.slice(1, 9), mantField = fpBits.slice(9), expVal = parseInt(expField, 2);
    const neg = num < 0, abs = Math.abs(num);
    if (num === 0) { tut.innerHTML = `<li class="fp-plain"><h4>Caso speciale: lo zero</h4><p>Lo zero si scrive con <b>tutti i bit a 0</b> — segno, esponente e mantissa.</p>${fpBitsRow(fpBits)}</li>`; return; }
    if (!isFinite(num)) { tut.innerHTML = `<li class="fp-plain"><h4>Infinito</h4><p>L'esponente è <b>tutto a 1</b> e la mantissa a 0 → il valore è <b>infinito</b> (${neg ? "−∞" : "+∞"}).</p>${fpBitsRow(fpBits)}</li>`; return; }

    const steps = [];
    steps.push(`<h4>Il segno</h4><p><b>${fmt(num)}</b> è ${neg ? "<b>negativo</b>" : "<b>positivo</b>"} → il bit di segno è <b>${neg ? 1 : 0}</b>. Da qui proseguiamo con il valore assoluto <b>${fmt(abs)}</b>.</p>`);

    const intPart = Math.floor(abs), intBin = intPart.toString(2);
    steps.push(`<h4>La parte intera in binario</h4><p><b>${intPart}</b> in binario è <code>${intBin}</code>${intPart > 0 ? ` &nbsp;(= ${powSum(intPart)})` : ""}.</p>`);

    let fracBits = "", terminated = true, f = abs - intPart;
    if (f === 0) {
      steps.push(`<h4>La parte dopo la virgola</h4><p>Non c'è parte frazionaria: vale <b>0</b>.</p>`);
    } else {
      const rows = [], MAXF = 16, start = f;
      for (let k = 0; k < MAXF; k++) {
        const prod = f * 2, bit = prod >= 1 ? 1 : 0;
        rows.push(`<div class="fp-frac-row"><span>${fmtFrac(f)} × 2 = ${fmtFrac(prod)}</span><b>${bit}</b></div>`);
        fracBits += bit; f = prod - bit;
        if (f === 0) { terminated = true; break; }
        if (k === MAXF - 1) terminated = false;
      }
      steps.push(`<h4>La parte dopo la virgola (moltiplica per 2)</h4>` +
        `<p>Moltiplichi la frazione per 2: la <b>parte intera</b> del risultato è il bit successivo, poi continui con quello che resta dopo la virgola.</p>` +
        `<div class="fp-frac">${rows.join("")}</div>` +
        (terminated
          ? `<p>La sequenza finisce: <b>${fmtFrac(start)}</b> = <code>0,${fracBits}</code> in binario.</p>`
          : `<p class="fp-periodic">La sequenza <b>non finisce</b> (è periodica). Ecco perché <b>${fmt(abs)}</b> non si può scrivere in modo esatto: a un certo punto va <b>arrotondata</b>.</p>`));
    }

    const combined = intPart >= 1 ? intBin + (fracBits ? "," + fracBits : "") : "0," + fracBits;
    steps.push(`<h4>Unisci le due parti</h4><p><b>${fmt(abs)}</b> in binario è <code>${combined}</code>.</p>`);

    let E, mantAll;
    if (intPart >= 1) { E = intBin.length - 1; mantAll = intBin.slice(1) + fracBits; }
    else { const p = fracBits.indexOf("1"); E = -(p + 1); mantAll = fracBits.slice(p + 1); }
    const normShown = mantAll.slice(0, 12) + (mantAll.length > 12 ? "…" : ""), shift = Math.abs(E);
    steps.push(`<h4>Normalizza (notazione scientifica binaria)</h4>` +
      `<p>Sposta la virgola subito dopo il <b>primo 1</b>, così resta <code>1,…</code> moltiplicato per una potenza di 2:</p>` +
      `<div class="fp-norm"><code>1,${normShown} × 2<sup>${E}</sup></code></div>` +
      `<p>Hai spostato la virgola di <b>${shift}</b> ${shift === 1 ? "posizione" : "posizioni"} ${E >= 0 ? "a sinistra" : "a destra"}: l'<b>esponente</b> vale <b>${E}</b>.</p>`);

    steps.push(`<h4>L'esponente con il bias (+127)</h4>` +
      `<p>Non si salva ${E} direttamente: si somma il <b>bias 127</b>, così anche gli esponenti negativi diventano positivi e si possono confrontare facilmente. <b>${E} + 127 = ${expVal}</b>, che a 8 bit è <code>${group(expField)}</code>. (I valori 0 e 255 sono riservati ai casi speciali, perciò l'esponente reale va da −126 a +127.)</p>`);

    steps.push(`<h4>La mantissa (23 bit)</h4>` +
      `<p>Si tengono solo le cifre <b>dopo</b> la virgola della forma normalizzata. L'1 iniziale c'è sempre, quindi è <b>implicito</b> e non si memorizza: è un bit «gratis» di precisione. Completata a 23 bit:</p>` +
      `<div class="fp-norm"><code>${group(mantField)}</code></div>`);

    steps.push(`<h4>Assembla i 32 bit</h4>` +
      `<p>In fila: <span class="fp-k s">segno</span> + <span class="fp-k e">esponente</span> + <span class="fp-k m">mantissa</span>.</p>` +
      fpBitsRow(fpBits) +
      `<div class="fp-result">Rimesso insieme: (−1)<sup>${neg ? 1 : 0}</sup> × 1,mantissa × 2<sup>${E}</sup> = <b>${fmt(stored)}</b></div>` +
      (fpRounded
        ? `<p class="fp-warn">⚠️ Il numero di partenza (${fpOriginal}) è stato <b>arrotondato</b>: il valore davvero salvato è <b>${fmt(stored)}</b>. È questo che, in tanti linguaggi, fa sì che <code>0.1 + 0.2 ≠ 0.3</code>.</p>`
        : `<p class="fp-exact">✓ ${fmt(stored)} si rappresenta <b>esattamente</b> a 32 bit.</p>`));

    tut.innerHTML = steps.map((s) => `<li>${s}</li>`).join("");
  }

  function renderFPAll() {
    $("fpBits").innerHTML = fpCells(fpBits, true);
    $("fpLive").innerHTML = fpLiveHtml();
    renderTutorial();
  }
  // dopo una modifica diretta dei bit: il numero diventa il valore esatto di quei bit
  function afterBits() {
    const stored = bitsToStored();
    fpNum = stored; fpOriginal = numStr(stored); fpRounded = false;
    $("fpNum").value = numStr(stored);
    renderFPAll();
  }
  function fpFromInput() {
    const raw = $("fpNum").value.trim().replace(",", ".");
    if (raw === "" || raw === "-" || isNaN(Number(raw))) {
      fpBits = "0".repeat(32);
      $("fpBits").innerHTML = fpCells(fpBits, true);
      $("fpLive").innerHTML = "";
      $("fpTutorial").innerHTML = `<li class="fp-plain"><p class="mini-hint err">Scrivi un numero con la virgola (es. 6.25 oppure -0.1).</p></li>`;
      return;
    }
    const num = Number(raw);
    fpDv.setFloat32(0, num); fpBits = fpDv.getUint32(0).toString(2).padStart(32, "0");
    fpNum = num; fpOriginal = raw; fpRounded = fpDv.getFloat32(0) !== num;
    renderFPAll();
  }

  /* ============================================================
     Wiring
     ============================================================ */
  $("c2num").addEventListener("input", renderC2);
  $("c2Width").addEventListener("click", (e) => { const b = e.target.closest("[data-w]"); if (!b) return; c2W = +b.dataset.w; setActive("c2Width", b); renderC2(); });

  $("sumA").addEventListener("input", renderSum);
  $("sumB").addEventListener("input", renderSum);
  $("sumWidth").addEventListener("click", (e) => { const b = e.target.closest("[data-w]"); if (!b) return; sumW = +b.dataset.w; setActive("sumWidth", b); renderSum(); });

  $("fpNum").addEventListener("input", fpFromInput);
  $("fpPresets").addEventListener("click", (e) => { const b = e.target.closest("[data-n]"); if (!b) return; $("fpNum").value = b.dataset.n; fpFromInput(); });
  function flipFpBit(i) { fpBits = fpBits.slice(0, i) + (fpBits[i] === "1" ? "0" : "1") + fpBits.slice(i + 1); afterBits(); }
  $("fpBits").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) flipFpBit(+b.dataset.i); });
  $("fpBits").addEventListener("keydown", (e) => { if (e.key !== "Enter" && e.key !== " ") return; const b = e.target.closest("[data-i]"); if (b) { e.preventDefault(); flipFpBit(+b.dataset.i); } });
  const setFpExp = (d) => { const v = Math.max(0, Math.min(255, parseInt(fpBits.slice(1, 9), 2) + d)); fpBits = fpBits[0] + v.toString(2).padStart(8, "0") + fpBits.slice(9); afterBits(); };
  $("fpExpDown").addEventListener("click", () => setFpExp(-1));
  $("fpExpUp").addEventListener("click", () => setFpExp(1));
  $("fpFlipSign").addEventListener("click", () => { fpBits = (fpBits[0] === "1" ? "0" : "1") + fpBits.slice(1); afterBits(); });
  $("fpZeroMant").addEventListener("click", () => { fpBits = fpBits.slice(0, 9) + "0".repeat(23); afterBits(); });

  renderC2();
  renderSum();
  fpFromInput();
})();
