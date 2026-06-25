/* ============================================================
   binario.js — Binary & Base Analyzer
   Logica interamente in BigInt: precisione esatta fino a 64 bit.
   Nessuna dipendenza esterna.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ---------- Stato ---------- */
  let W = 8;            // larghezza in bit
  let signed = false;   // interpretazione con segno (complemento a due)
  let bits = 0n;        // pattern di bit, sempre in [0, 2^W - 1]

  /* ---------- Elementi ---------- */
  const fields = { dec: $("inDec"), bin: $("inBin"), oct: $("inOct"), hex: $("inHex") };
  const bitField = $("bitField");
  const decompEl = $("decomp");
  const rangeInfo = $("rangeInfo");
  const bwRows = $("bwRows");
  const bwResult = $("bwResult");
  const opA = $("opA"), opB = $("opB"), opSelect = $("opSelect"), opBWrap = $("opBWrap");

  /* ---------- Helper numerici ---------- */
  const Wn = () => BigInt(W);
  const mask = () => (1n << Wn()) - 1n;
  const signBit = () => 1n << (Wn() - 1n);
  const modulus = () => 1n << Wn();

  function signedValue(b) {
    return (signed && (b & signBit())) ? b - modulus() : b;
  }

  function setBits(b, skipId) {
    bits = ((b % modulus()) + modulus()) % modulus(); // normalizza in [0, 2^W)
    render(skipId);
  }

  /* ---------- Render principale ---------- */
  function render(skipId) {
    const binStr = bits.toString(2);
    const values = {
      dec: signedValue(bits).toString(),
      bin: binStr,
      oct: bits.toString(8),
      hex: bits.toString(16).toUpperCase(),
    };
    for (const k in fields) {
      const el = fields[k];
      el.closest(".field").classList.remove("invalid");
      clearErr(k);
      if (el.id !== skipId) el.value = values[k];
    }
    renderRange();
    renderBits();
    renderDecomp();
    renderBitwise();
  }

  function renderRange() {
    const max = signed ? signBit() - 1n : mask();
    const min = signed ? -signBit() : 0n;
    rangeInfo.innerHTML =
      `Range a <strong>${W} bit</strong> ${signed ? "con segno" : "senza segno"}: ` +
      `<strong>${min}</strong> … <strong>${max}</strong>`;
  }

  /* ---------- Visualizzatore di bit ---------- */
  function renderBits() {
    let html = "";
    for (let i = W - 1; i >= 0; i--) {
      const on = (bits >> BigInt(i)) & 1n;
      const isSign = signed && i === W - 1;
      if (i !== W - 1 && (i + 1) % 4 === 0) {
        // chiudi il nibble precedente e aprine uno nuovo
        html += `</div><div class="nibble">`;
      } else if (i === W - 1) {
        html += `<div class="nibble">`;
      }
      html +=
        `<button type="button" class="bit${on ? " on" : ""}${isSign ? " sign" : ""}" ` +
        `data-i="${i}" aria-pressed="${on ? "true" : "false"}" ` +
        `aria-label="bit ${i}, peso 2 alla ${i}${isSign ? ", bit di segno" : ""}, valore ${on}">` +
        `<span class="bit-box">${on}</span>` +
        `<span class="bit-weight">2<sup>${i}</sup></span>` +
        `<span class="bit-index">b${i}</span>` +
        `</button>`;
    }
    html += `</div>`;
    bitField.innerHTML = html;
  }

  /* ---------- Decomposizione ---------- */
  function renderDecomp() {
    if (bits === 0n) {
      decompEl.innerHTML = `<span class="eq">0</span> — tutti i bit sono a zero.`;
      return;
    }
    const terms = [];
    for (let i = W - 1; i >= 0; i--) {
      if ((bits >> BigInt(i)) & 1n) terms.push(2n ** BigInt(i));
    }
    const sum = terms.reduce((a, b) => a + b, 0n);
    let html = terms.map((t) => `<span class="term">${t}</span>`).join(" + ") +
               ` = <span class="eq">${sum}</span>`;
    if (signed && (bits & signBit())) {
      const sd = sum - modulus();
      html += `<span class="note">Il bit di segno è 1 → complemento a due: ` +
              `${sum} − 2<sup>${W}</sup> (${modulus()}) = <span class="eq">${sd}</span></span>`;
    }
    decompEl.innerHTML = html;
  }

  /* ---------- Input convertitore ---------- */
  const patterns = {
    bin: /^[01]+$/, oct: /^[0-7]+$/, hex: /^[0-9a-fA-F]+$/,
  };
  function decPattern() { return signed ? /^-?\d+$/ : /^\d+$/; }

  function onConvInput(base) {
    const el = fields[base];
    const raw = el.value.trim();
    const fieldBox = el.closest(".field");
    clearErr(base);
    fieldBox.classList.remove("invalid");

    if (raw === "" || raw === "-") { setBits(0n, el.id); return; }

    const re = base === "dec" ? decPattern() : patterns[base];
    if (!re.test(raw)) {
      fieldBox.classList.add("invalid");
      const hint = base === "dec"
        ? (signed ? "solo cifre 0-9 (e − per i negativi)" : "solo cifre 0-9 — i negativi servono la modalità con segno")
        : base === "bin" ? "solo 0 e 1"
        : base === "oct" ? "solo cifre 0-7"
        : "solo 0-9 e A-F";
      setErr(base, hint);
      return;
    }

    let v;
    try {
      v = base === "dec" ? BigInt(raw)
        : base === "bin" ? BigInt("0b" + raw)
        : base === "oct" ? BigInt("0o" + raw)
        : BigInt("0x" + raw);
    } catch (e) { fieldBox.classList.add("invalid"); setErr(base, "numero non valido"); return; }

    // Avviso di fuori-range (il valore viene comunque troncato a W bit)
    const overflow = base === "dec"
      ? (signed ? (v > signBit() - 1n || v < -signBit()) : (v > mask() || v < 0n))
      : (v > mask());
    setBits(v, el.id);
    if (overflow) { fieldBox.classList.add("invalid"); setErr(base, `fuori range: troncato a ${W} bit`); }
  }

  function setErr(base, msg) {
    const span = document.querySelector(`.field-err[data-for="in${cap(base)}"]`);
    if (span) span.textContent = msg;
  }
  function clearErr(base) {
    const span = document.querySelector(`.field-err[data-for="in${cap(base)}"]`);
    if (span) span.textContent = "";
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- Operazioni bit a bit ---------- */
  function parseOperand(el) {
    const raw = el.value.trim();
    el.closest(".field").classList.remove("invalid");
    if (raw === "" || raw === "-") return 0n;
    if (!/^-?\d+$/.test(raw)) { el.closest(".field").classList.add("invalid"); return null; }
    return ((BigInt(raw) % modulus()) + modulus()) % modulus();
  }

  function renderBitwise() {
    const op = opSelect.value;
    const unary = op === "not";
    opBWrap.classList.toggle("hidden", unary);

    const a = parseOperand(opA);
    const b = unary ? 0n : parseOperand(opB);
    if (a === null || b === null) { bwRows.innerHTML = ""; bwResult.innerHTML = `<span>—</span>`; return; }

    let r;
    switch (op) {
      case "and": r = a & b; break;
      case "or":  r = a | b; break;
      case "xor": r = a ^ b; break;
      case "not": r = ~a; break;
      case "shl": r = a << clampShift(b); break;
      case "shr": r = a >> clampShift(b); break;
      default: r = a;
    }
    r = ((r % modulus()) + modulus()) % modulus();

    let rows = bitRow("A", a);
    if (!unary) rows += bitRow(op === "shl" || op === "shr" ? "B*" : "B", b);
    rows += bitRow(symbol(op), r, true);
    bwRows.innerHTML = rows;

    bwResult.innerHTML =
      `<span><b>${signedValue(r)}</b><span class="k">decimale</span></span>` +
      `<span><b>0b${r.toString(2).padStart(W, "0")}</b><span class="k">binario</span></span>` +
      `<span><b>0x${r.toString(16).toUpperCase()}</b><span class="k">esadecimale</span></span>`;
  }

  function clampShift(b) { return b < 0n ? 0n : (b > Wn() ? Wn() : b); }

  function symbol(op) {
    return { and: "AND", or: "OR", xor: "XOR", not: "~A", shl: "«", shr: "»" }[op] || "=";
  }

  function bitRow(tag, val, isResult) {
    let cells = "";
    for (let i = W - 1; i >= 0; i--) {
      const on = (val >> BigInt(i)) & 1n;
      if (i !== W - 1 && (i + 1) % 4 === 0) cells += `<span class="bw-gap"></span>`;
      cells += `<span class="bw-bit${on ? " on" : ""}">${on}</span>`;
    }
    return `<div class="bw-line${isResult ? " result" : ""}"><span class="bw-tag">${tag}</span><span class="bw-bits">${cells}</span></div>`;
  }

  /* ---------- Eventi ---------- */
  for (const base in fields) {
    fields[base].addEventListener("input", () => onConvInput(base));
  }

  bitField.addEventListener("click", (e) => {
    const btn = e.target.closest(".bit");
    if (!btn) return;
    const i = BigInt(btn.dataset.i);
    setBits(bits ^ (1n << i));
  });

  document.querySelector(".stepper").addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (!act) return;
    if (act === "inc") setBits(bits + 1n);
    else if (act === "dec") setBits(bits - 1n);
    else if (act === "shl") setBits(bits << 1n);
    else if (act === "shr") setBits(bits >> 1n);
    else if (act === "not") setBits(~bits);
    else if (act === "clear") setBits(0n);
  });

  $("widthSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-width]");
    if (!btn) return;
    W = parseInt(btn.dataset.width, 10);
    setActive("widthSeg", btn);
    setBits(bits); // ri-normalizza alla nuova larghezza
  });

  $("signSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sign]");
    if (!btn) return;
    signed = btn.dataset.sign === "signed";
    setActive("signSeg", btn);
    render();
  });

  [opA, opB].forEach((el) => el.addEventListener("input", renderBitwise));
  opSelect.addEventListener("change", renderBitwise);

  function setActive(groupId, btn) {
    $(groupId).querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  /* ---------- Avvio ---------- */
  render();
})();
