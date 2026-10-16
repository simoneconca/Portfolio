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
     07 — Virgola mobile (IEEE 754, 32 bit)
     ============================================================ */
  function fmt(x) {
    if (!isFinite(x)) return String(x);
    if (x === 0) return "0";
    let s = x.toPrecision(9);
    if (s.indexOf("e") < 0 && s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }
  function renderFP() {
    const raw = $("fpNum").value.trim().replace(",", ".");
    const bitsEl = $("fpBits"), brk = $("fpBreak");
    if (raw === "" || raw === "-" || isNaN(Number(raw))) { bitsEl.innerHTML = ""; brk.innerHTML = `<p class="mini-hint err">Scrivi un numero con la virgola (es. 6.25 oppure -0.1).</p>`; return; }
    const num = Number(raw);
    const dv = new DataView(new ArrayBuffer(4));
    dv.setFloat32(0, num);
    const u = dv.getUint32(0), stored = dv.getFloat32(0);
    const bits = u.toString(2).padStart(32, "0");
    const sign = bits[0], expBits = bits.slice(1, 9), mantBits = bits.slice(9);
    const expVal = parseInt(expBits, 2), E = expVal - 127;

    let cells = "";
    for (let i = 0; i < 32; i++) {
      const cls = i === 0 ? "s" : i < 9 ? "e" : "m";
      cells += `<span class="fp-bit ${cls} ${bits[i] === "1" ? "on" : ""}">${bits[i]}</span>`;
      if (i === 0 || i === 8) cells += `<span class="fp-gap"></span>`;
    }
    bitsEl.innerHTML = cells;

    let mantFrac = 0;
    for (let k = 0; k < 23; k++) if (mantBits[k] === "1") mantFrac += Math.pow(2, -(k + 1));
    const mantissaValue = 1 + mantFrac;
    const signTxt = sign === "1" ? "1 → negativo (−)" : "0 → positivo (+)";

    let special = "";
    if (expVal === 0 && mantFrac === 0) special = "zero";
    else if (expVal === 255) special = mantBits.indexOf("1") >= 0 ? "NaN (non è un numero)" : "infinito";
    else if (expVal === 0) special = "denormale";

    let formula;
    if (special === "zero") formula = `Esponente e mantissa a zero → il valore è <b>0</b>.`;
    else if (special.indexOf("infinito") === 0 || special.indexOf("NaN") === 0) formula = `Caso speciale (esponente tutto a 1): <b>${special}</b>.`;
    else formula =
      `valore = (−1)<sup>${sign}</sup> × <b>${fmt(mantissaValue)}</b> × 2<sup>${E}</sup> = <b>${fmt(stored)}</b>`;

    brk.innerHTML =
      `<div class="fp-parts">` +
        `<div class="fp-part s"><span class="fp-plbl">segno · 1 bit</span><code>${sign}</code><span class="fp-pv">${signTxt}</span></div>` +
        `<div class="fp-part e"><span class="fp-plbl">esponente · 8 bit</span><code>${group(expBits)}</code><span class="fp-pv">= ${expVal}, poi ${expVal} − 127 = <b>${E}</b></span></div>` +
        `<div class="fp-part m"><span class="fp-plbl">mantissa · 23 bit</span><code>${group(mantBits)}</code><span class="fp-pv">= 1 + ${fmt(mantFrac)} = <b>${fmt(mantissaValue)}</b></span></div>` +
      `</div>` +
      `<div class="fp-formula">${formula}</div>` +
      (special === "" && stored !== num
        ? `<div class="fp-warn">⚠️ <b>${raw}</b> non è rappresentabile in modo <b>esatto</b> con 32 bit: il valore davvero memorizzato è <b>${fmt(stored)}</b>. È questo che, in tanti linguaggi, fa sì che <code>0.1 + 0.2 ≠ 0.3</code>.</div>`
        : "");
  }

  /* ============================================================
     Wiring
     ============================================================ */
  $("c2num").addEventListener("input", renderC2);
  $("c2Width").addEventListener("click", (e) => { const b = e.target.closest("[data-w]"); if (!b) return; c2W = +b.dataset.w; setActive("c2Width", b); renderC2(); });

  $("sumA").addEventListener("input", renderSum);
  $("sumB").addEventListener("input", renderSum);
  $("sumWidth").addEventListener("click", (e) => { const b = e.target.closest("[data-w]"); if (!b) return; sumW = +b.dataset.w; setActive("sumWidth", b); renderSum(); });

  $("fpNum").addEventListener("input", renderFP);
  $("fpPresets").addEventListener("click", (e) => { const b = e.target.closest("[data-n]"); if (!b) return; $("fpNum").value = b.dataset.n; renderFP(); });

  renderC2();
  renderSum();
  renderFP();
})();
