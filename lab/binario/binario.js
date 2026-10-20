/* ============================================================
   binario.js — Binary & Base Analyzer
   02) Convertitore tra le 4 basi con i calcoli mostrati (BigInt, nessun limite di bit)
   03) Operazioni bit a bit (larghezza propria)
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const SYM = "0123456789ABCDEF";
  const symOf = (r) => SYM[Number(r)];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ============================================================
     02 — Convertitore (BigInt, senza limiti di bit)
     ============================================================ */
  let value = 13n;
  const fields = { dec: $("inDec"), bin: $("inBin"), oct: $("inOct"), hex: $("inHex") };
  const patterns = { dec: /^\d+$/, bin: /^[01]+$/, oct: /^[0-7]+$/, hex: /^[0-9a-fA-F]+$/ };
  const prefix = { bin: "0b", oct: "0o", hex: "0x" };

  function setErr(b, m) { const s = document.querySelector(`.field-err[data-for="in${cap(b)}"]`); if (s) s.textContent = m; }
  function clearErr(b) { const s = document.querySelector(`.field-err[data-for="in${cap(b)}"]`); if (s) s.textContent = ""; }
  const hintFor = (b) => b === "dec" ? "solo cifre 0-9" : b === "bin" ? "solo 0 e 1" : b === "oct" ? "solo cifre 0-7" : "solo 0-9 e A-F";

  function setValue(v, skipId) {
    value = v < 0n ? 0n : v;
    const vals = { dec: value.toString(10), bin: value.toString(2), oct: value.toString(8), hex: value.toString(16).toUpperCase() };
    for (const k in fields) {
      const el = fields[k]; clearErr(k); el.closest(".field").classList.remove("invalid");
      if (el.id !== skipId) el.value = vals[k];
    }
    renderCalc();
  }
  function onConvInput(base) {
    const el = fields[base], raw = el.value.trim(), box = el.closest(".field");
    clearErr(base); box.classList.remove("invalid");
    if (raw === "") { setValue(0n, el.id); return; }
    if (!patterns[base].test(raw)) { box.classList.add("invalid"); setErr(base, hintFor(base)); return; }
    let v;
    try { v = base === "dec" ? BigInt(raw) : BigInt(prefix[base] + raw.toLowerCase()); }
    catch (e) { box.classList.add("invalid"); setErr(base, "numero non valido"); return; }
    setValue(v, el.id);
  }
  for (const b in fields) fields[b].addEventListener("input", () => onConvInput(b));

  /* ---------- I calcoli delle 4 conversioni ---------- */
  function divSteps(v, b) {
    const B = BigInt(b), rows = [], digits = [];
    let x = v;
    while (x > 0n) { const q = x / B, r = x % B; rows.push({ x, q, r }); digits.unshift(symOf(r)); x = q; }
    return { rows, digits: digits.join("") || "0" };
  }
  function blockHtml(title, sub, result, body) {
    return `<div class="cc-block"><div class="cc-head"><span class="cc-title">${title}</span>` +
      `<span class="cc-sub">${sub}</span><span class="cc-res"><code>${result}</code></span></div>${body}</div>`;
  }
  function divBlock(title, sub, b) {
    if (value === 0n) return blockHtml(title, sub, "0", `<p class="cc-note">0 vale <code>0</code> in ogni base.</p>`);
    const { rows, digits } = divSteps(value, b);
    const rowsH = rows.map((r) =>
      `<div class="cc-div"><span>${r.x} ÷ ${b} = ${r.q}</span><b>resto ${r.r}${(b === 16 && r.r > 9n) ? " → " + symOf(r.r) : ""}</b></div>`).join("");
    return blockHtml(title, sub, digits,
      `<div class="cc-divs">${rowsH}</div>` +
      `<p class="cc-read">Leggi i resti <b>dal basso verso l'alto</b> → <code>${digits}</code></p>`);
  }
  function decBlock() {
    const bin = value.toString(2), n = bin.length, terms = [], active = [];
    for (let i = 0; i < n; i++) {
      const bit = bin[i], w = 2n ** BigInt(n - 1 - i);
      terms.push(`<span class="cc-t ${bit === "1" ? "on" : "off"}">${bit}·2<sup>${n - 1 - i}</sup></span>`);
      if (bit === "1") active.push(w.toString());
    }
    return blockHtml("In decimale", "base 10 · somma dei pesi", value.toString(10),
      `<p class="cc-sum">${bin}<sub>2</sub> = ${terms.join(" + ")}</p>` +
      `<p class="cc-sum">= ${active.length ? active.join(" + ") : "0"} = <b>${value.toString(10)}</b></p>`);
  }
  function renderCalc() {
    $("convCalc").innerHTML =
      decBlock() +
      divBlock("In binario", "base 2 · divisioni per 2", 2) +
      divBlock("In ottale", "base 8 · divisioni per 8", 8) +
      divBlock("In esadecimale", "base 16 · divisioni per 16", 16);
  }

  /* ============================================================
     03 — Operazioni bit a bit (larghezza propria)
     ============================================================ */
  let W = 8;
  const bwRows = $("bwRows"), bwResult = $("bwResult");
  const opA = $("opA"), opB = $("opB"), opSelect = $("opSelect"), opBWrap = $("opBWrap");
  const Wn = () => BigInt(W);
  const modulus = () => 1n << Wn();

  function parseOperand(el) {
    const raw = el.value.trim(); el.closest(".field").classList.remove("invalid");
    if (raw === "") return 0n;
    if (!/^\d+$/.test(raw)) { el.closest(".field").classList.add("invalid"); return null; }
    return ((BigInt(raw) % modulus()) + modulus()) % modulus();
  }
  const clampShift = (b) => b < 0n ? 0n : (b > Wn() ? Wn() : b);
  const symbol = (op) => ({ and: "AND", or: "OR", xor: "XOR", not: "~A", shl: "«", shr: "»" }[op] || "=");
  function bitRow(tag, val, isResult) {
    let cells = "";
    for (let i = W - 1; i >= 0; i--) {
      const on = (val >> BigInt(i)) & 1n;
      if (i !== W - 1 && (i + 1) % 4 === 0) cells += `<span class="bw-gap"></span>`;
      cells += `<span class="bw-bit${on ? " on" : ""}">${on}</span>`;
    }
    return `<div class="bw-line${isResult ? " result" : ""}"><span class="bw-tag">${tag}</span><span class="bw-bits">${cells}</span></div>`;
  }
  function renderBitwise() {
    const op = opSelect.value, unary = op === "not";
    opBWrap.classList.toggle("hidden", unary);
    const a = parseOperand(opA), b = unary ? 0n : parseOperand(opB);
    if (a === null || b === null) { bwRows.innerHTML = ""; bwResult.innerHTML = `<span>—</span>`; return; }
    let r;
    switch (op) {
      case "and": r = a & b; break; case "or": r = a | b; break; case "xor": r = a ^ b; break;
      case "not": r = ~a; break; case "shl": r = a << clampShift(b); break; case "shr": r = a >> clampShift(b); break;
      default: r = a;
    }
    r = ((r % modulus()) + modulus()) % modulus();
    let rows = bitRow("A", a);
    if (!unary) rows += bitRow(op === "shl" || op === "shr" ? "B*" : "B", b);
    rows += bitRow(symbol(op), r, true);
    bwRows.innerHTML = rows;
    bwResult.innerHTML =
      `<span><b>${r.toString()}</b><span class="k">decimale</span></span>` +
      `<span><b>0b${r.toString(2).padStart(W, "0")}</b><span class="k">binario</span></span>` +
      `<span><b>0x${r.toString(16).toUpperCase()}</b><span class="k">esadecimale</span></span>`;
  }
  [opA, opB].forEach((el) => el.addEventListener("input", renderBitwise));
  opSelect.addEventListener("change", renderBitwise);
  $("widthSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-width]"); if (!btn) return;
    W = parseInt(btn.dataset.width, 10);
    $("widthSeg").querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderBitwise();
  });

  /* ---------- Avvio ---------- */
  onConvInput("dec");
  renderBitwise();
})();
