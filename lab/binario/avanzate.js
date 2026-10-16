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
     07 — Virgola mobile (IEEE 754, 32 bit) — tutorial passo passo
     ============================================================ */
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
  // riga dei 32 bit colorati (1 segno · 8 esponente · 23 mantissa)
  function fpBitsRow(bits) {
    let cells = "";
    for (let i = 0; i < 32; i++) {
      const cls = i === 0 ? "s" : i < 9 ? "e" : "m";
      cells += `<span class="fp-bit ${cls} ${bits[i] === "1" ? "on" : ""}">${bits[i]}</span>`;
      if (i === 0 || i === 8) cells += `<span class="fp-gap"></span>`;
    }
    return `<div class="fp-bits">${cells}</div>`;
  }

  function renderFP() {
    const raw = $("fpNum").value.trim().replace(",", ".");
    const tut = $("fpTutorial");
    if (raw === "" || raw === "-" || isNaN(Number(raw))) { tut.innerHTML = `<li class="fp-plain"><p class="mini-hint err">Scrivi un numero con la virgola (es. 6.25 oppure -0.1).</p></li>`; return; }
    const num = Number(raw);
    const dv = new DataView(new ArrayBuffer(4));
    dv.setFloat32(0, num);
    const u = dv.getUint32(0), stored = dv.getFloat32(0);
    const allBits = u.toString(2).padStart(32, "0");
    const expField = allBits.slice(1, 9), mantField = allBits.slice(9);
    const expVal = parseInt(expField, 2);
    const neg = num < 0, abs = Math.abs(num);

    // casi speciali
    if (num === 0) {
      tut.innerHTML = `<li class="fp-plain"><h4>Caso speciale: lo zero</h4><p>Lo zero si scrive con <b>tutti i bit a 0</b> — segno, esponente e mantissa.</p>${fpBitsRow("0".repeat(32))}</li>`;
      return;
    }
    if (!isFinite(stored)) {
      tut.innerHTML = `<li class="fp-plain"><h4>Troppo grande</h4><p>${fmt(num)} supera il massimo rappresentabile a 32 bit (~3,4 × 10³⁸): diventa <b>infinito</b> (esponente tutto a 1).</p>${fpBitsRow(allBits)}</li>`;
      return;
    }

    const steps = [];

    // 1 — segno
    steps.push(`<h4>Il segno</h4><p><b>${fmt(num)}</b> è ${neg ? "<b>negativo</b>" : "<b>positivo</b>"} → il bit di segno è <b>${neg ? 1 : 0}</b>. Da qui proseguiamo con il valore assoluto <b>${fmt(abs)}</b>.</p>`);

    // 2 — parte intera in binario
    const intPart = Math.floor(abs);
    const intBin = intPart.toString(2);
    steps.push(`<h4>La parte intera in binario</h4><p><b>${intPart}</b> in binario è <code>${intBin}</code>${intPart > 0 ? ` &nbsp;(= ${powSum(intPart)})` : ""}.</p>`);

    // 3 — parte frazionaria in binario (metodo: moltiplica per 2)
    let fracBits = "", terminated = true;
    let f = abs - intPart;
    if (f === 0) {
      steps.push(`<h4>La parte dopo la virgola</h4><p>Non c'è parte frazionaria: vale <b>0</b>.</p>`);
    } else {
      const rows = []; const MAXF = 16; const start = f;
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

    // 4 — unisci
    const combined = intPart >= 1 ? intBin + (fracBits ? "," + fracBits : "") : "0," + fracBits;
    steps.push(`<h4>Unisci le due parti</h4><p><b>${fmt(abs)}</b> in binario è <code>${combined}</code>.</p>`);

    // 5 — normalizza
    let E, mantAll;
    if (intPart >= 1) { E = intBin.length - 1; mantAll = intBin.slice(1) + fracBits; }
    else { const p = fracBits.indexOf("1"); E = -(p + 1); mantAll = fracBits.slice(p + 1); }
    const normShown = mantAll.slice(0, 12) + (mantAll.length > 12 ? "…" : "");
    const shift = Math.abs(E);
    steps.push(`<h4>Normalizza (notazione scientifica binaria)</h4>` +
      `<p>Sposta la virgola subito dopo il <b>primo 1</b>, così resta <code>1,…</code> moltiplicato per una potenza di 2:</p>` +
      `<div class="fp-norm"><code>1,${normShown} × 2<sup>${E}</sup></code></div>` +
      `<p>Hai spostato la virgola di <b>${shift}</b> ${shift === 1 ? "posizione" : "posizioni"} ${E >= 0 ? "a sinistra" : "a destra"}: l'<b>esponente</b> vale <b>${E}</b>.</p>`);

    // 6 — esponente con bias
    steps.push(`<h4>L'esponente con il bias (+127)</h4>` +
      `<p>Non si salva ${E} direttamente: si somma il <b>bias 127</b> (così anche gli esponenti negativi diventano positivi). <b>${E} + 127 = ${expVal}</b>, che a 8 bit è <code>${group(expField)}</code>.</p>`);

    // 7 — mantissa
    steps.push(`<h4>La mantissa (23 bit)</h4>` +
      `<p>Si tengono solo le cifre <b>dopo</b> la virgola della forma normalizzata. L'1 iniziale c'è sempre, quindi è <b>implicito</b> e non si memorizza. Completata a 23 bit:</p>` +
      `<div class="fp-norm"><code>${group(mantField)}</code></div>`);

    // 8 — assembla
    steps.push(`<h4>Assembla i 32 bit</h4>` +
      `<p>In fila: <span class="fp-k s">segno</span> + <span class="fp-k e">esponente</span> + <span class="fp-k m">mantissa</span>.</p>` +
      fpBitsRow(allBits) +
      `<div class="fp-result">Rimesso insieme: (−1)<sup>${neg ? 1 : 0}</sup> × 1,mantissa × 2<sup>${E}</sup> = <b>${fmt(stored)}</b></div>` +
      (stored !== num
        ? `<p class="fp-warn">⚠️ Il numero di partenza (${raw}) è stato <b>arrotondato</b>: il valore davvero salvato è <b>${fmt(stored)}</b>. È questo che, in tanti linguaggi, fa sì che <code>0.1 + 0.2 ≠ 0.3</code>.</p>`
        : `<p class="fp-exact">✓ ${fmt(num)} si rappresenta <b>esattamente</b> a 32 bit.</p>`));

    tut.innerHTML = steps.map((s) => `<li>${s}</li>`).join("");
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
