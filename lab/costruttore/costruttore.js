/* ============================================================
   costruttore.js — Costruttore di conversioni
   Componi un numero attivando i blocchi dei pesi posizionali.
   Funziona Decimale→Base e Base→Decimale, basi 2/8/16. BigInt.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SYM = "0123456789ABCDEF";

  const DEFAULT_POS = { 2: 8, 8: 4, 16: 3 };   // posizioni iniziali (inversa)
  const MAX_POS     = { 2: 16, 8: 11, 16: 8 }; // posizioni massime
  const MAX_FWD     = { 2: 32, 8: 11, 16: 8 }; // cifre massime (diretta)

  /* ---------- Stato ---------- */
  let base = 2;
  let mode = "fwd";          // "fwd" = decimale→base, "rev" = base→decimale
  let digits = [];           // indice 0 = posizione meno significativa
  let target = 0n;           // obiettivo (modalità diretta)
  let targetOk = false;

  /* ---------- Elementi ---------- */
  const slotsEl = $("slots");
  const fwdBlock = $("fwdBlock"), revBlock = $("revBlock");
  const fwdBanner = $("fwdBanner");
  const targetEl = $("target");
  const posCountEl = $("posCount");
  const outputEl = $("output");

  /* ---------- Helper ---------- */
  const bb = () => BigInt(base);
  const weight = (i) => bb() ** BigInt(i);
  const sum = () => digits.reduce((a, d, i) => a + BigInt(d) * weight(i), 0n);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  function digitCount(v) {
    if (v <= 0n) return 1;
    let c = 0, t = v, b = bb();
    while (t > 0n) { t /= b; c++; }
    return c;
  }
  function digitsToString() {
    let s = "";
    for (let i = digits.length - 1; i >= 0; i--) s += SYM[digits[i]];
    return s;
  }
  function zeros(n) { return new Array(n).fill(0); }

  /* ---------- Ricostruzione struttura ---------- */
  function fwdRebuild() {
    const raw = targetEl.value.trim();
    targetEl.closest(".field").classList.remove("invalid");
    if (raw === "") { targetOk = false; digits = []; return; }
    if (!/^\d+$/.test(raw)) { targetOk = false; digits = []; targetEl.closest(".field").classList.add("invalid"); return; }
    const v = BigInt(raw);
    const positions = digitCount(v);
    if (positions > MAX_FWD[base]) {
      targetOk = false; digits = [];
      targetEl.closest(".field").classList.add("invalid");
      return;
    }
    target = v; targetOk = true;
    digits = zeros(positions);
  }
  function revReset() {
    digits = zeros(DEFAULT_POS[base]);
  }

  /* ---------- Disegno ---------- */
  function paint() {
    fwdBlock.hidden = mode !== "fwd";
    revBlock.hidden = mode !== "rev";
    document.querySelectorAll(".fwd-only").forEach((b) => (b.hidden = mode !== "fwd"));
    if (mode === "rev") posCountEl.textContent = String(digits.length);

    renderSlots();
    if (mode === "fwd") renderFwd(); else renderRev();
  }

  function renderSlots() {
    if (mode === "fwd" && !targetOk) {
      slotsEl.innerHTML = `<p class="out-hint" style="padding:1rem">Inserisci un numero decimale valido per generare i blocchi.</p>`;
      return;
    }
    let html = "";
    for (let i = digits.length - 1; i >= 0; i--) {
      const d = digits[i];
      const w = weight(i);
      const active = d > 0;
      const contrib = active ? `${d} × ${w} = ${BigInt(d) * w}` : "&nbsp;";
      html +=
        `<div class="slot${active ? " active" : ""}" data-i="${i}">` +
          `<span class="slot-exp">${base}<sup>${i}</sup></span>` +
          `<span class="slot-digit-wrap">` +
            `<button type="button" class="slot-nudge" data-dir="1" tabindex="-1" aria-label="aumenta cifra">▲</button>` +
            `<button type="button" class="slot-digit" aria-label="posizione ${i}, peso ${w}, cifra ${SYM[d]}">${SYM[d]}</button>` +
            `<button type="button" class="slot-nudge" data-dir="-1" tabindex="-1" aria-label="diminuisci cifra">▼</button>` +
          `</span>` +
          `<span class="slot-weight">${w}</span>` +
          `<span class="slot-contrib">${contrib}</span>` +
        `</div>`;
    }
    slotsEl.innerHTML = html;
  }

  function renderFwd() {
    if (!targetOk) {
      fwdBanner.className = "target-banner over";
      fwdBanner.innerHTML = `<span class="lbl">Numero non valido o troppo grande per la base ${base}.</span>`;
      outputEl.innerHTML = "";
      return;
    }
    const S = sum();
    const R = target - S;
    let cls = "target-banner";
    if (R === 0n) cls += " success"; else if (R < 0n) cls += " over";
    fwdBanner.className = cls;
    fwdBanner.innerHTML =
      `<span><span class="lbl">Obiettivo</span> <span class="big">${target}</span></span>` +
      `<span><span class="lbl">Somma attuale</span> <span class="big">${S}</span></span>` +
      `<span><span class="lbl">Rimanente da coprire</span> <span class="big rem-val">${R}</span></span>`;

    if (R === 0n) {
      const str = digitsToString();
      outputEl.innerHTML =
        `<span class="out-success-tag">✓ Conversione completata</span>` +
        `<div class="out-result"><span class="out-string">${str}<sub>${base}</sub></span></div>` +
        `<p class="out-hint">${target}<sub>10</sub> = ${str}<sub>${base}</sub> — la somma dei pesi attivati è esattamente ${target}.</p>`;
    } else if (R > 0n) {
      outputEl.innerHTML = `<p class="out-hint">Attiva i blocchi finché “Rimanente da coprire” arriva esattamente a <strong>0</strong>.</p>`;
    } else {
      outputEl.innerHTML = `<p class="out-hint">Hai superato l'obiettivo di <strong>${-R}</strong>: riduci qualche blocco.</p>`;
    }
  }

  function renderRev() {
    const S = sum();
    const str = digitsToString();
    const terms = [];
    for (let i = digits.length - 1; i >= 0; i--) {
      if (digits[i] > 0) terms.push(`<span class="term">${digits[i]} × ${weight(i)}</span>`);
    }
    const termsHtml = terms.length ? terms.join(` <span class="plus">+</span> `) : `<span class="term">0</span>`;
    outputEl.innerHTML =
      `<div class="out-sum">${termsHtml} <span class="plus">=</span> <strong>${S}</strong></div>` +
      `<div class="out-result">` +
        `<span class="out-string">${str}<sub>${base}</sub></span>` +
        `<span class="sub">in base 10 vale</span>` +
        `<span class="big">${S}</span>` +
      `</div>`;
  }

  /* ---------- Modifica cifre ---------- */
  function setDigit(i, value, refocus) {
    digits[i] = clamp(value, 0, base - 1);
    paint();
    if (refocus) {
      const el = slotsEl.querySelector(`.slot[data-i="${i}"] .slot-digit`);
      if (el) el.focus();
    }
  }

  /* ---------- Eventi: blocchi ---------- */
  slotsEl.addEventListener("click", (e) => {
    const slot = e.target.closest(".slot");
    if (!slot) return;
    const i = parseInt(slot.dataset.i, 10);
    const nudge = e.target.closest(".slot-nudge");
    if (nudge) {
      setDigit(i, digits[i] + parseInt(nudge.dataset.dir, 10), true);
    } else if (e.target.closest(".slot-digit")) {
      setDigit(i, (digits[i] + 1) % base, true); // clic = incrementa a ciclo
    }
  });

  slotsEl.addEventListener("keydown", (e) => {
    const digitBtn = e.target.closest(".slot-digit");
    if (!digitBtn) return;
    const i = parseInt(e.target.closest(".slot").dataset.i, 10);
    if (e.key === "ArrowUp") { e.preventDefault(); setDigit(i, digits[i] + 1, true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setDigit(i, digits[i] - 1, true); }
  });

  /* ---------- Eventi: controlli ---------- */
  $("modeSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]"); if (!btn) return;
    mode = btn.dataset.mode;
    setActive("modeSeg", btn);
    if (mode === "fwd") fwdRebuild(); else revReset();
    paint();
  });

  $("baseSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-base]"); if (!btn) return;
    base = parseInt(btn.dataset.base, 10);
    setActive("baseSeg", btn);
    if (mode === "fwd") fwdRebuild(); else revReset();
    paint();
  });

  targetEl.addEventListener("input", () => { fwdRebuild(); paint(); });

  $("posPlus").addEventListener("click", () => {
    if (digits.length < MAX_POS[base]) { digits.push(0); paint(); }
  });
  $("posMinus").addEventListener("click", () => {
    if (digits.length > 1) { digits.pop(); paint(); }
  });

  document.getElementById("actions").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "reset") { digits = digits.map(() => 0); paint(); }
    else if (act === "solve" && mode === "fwd" && targetOk) {
      for (let i = 0; i < digits.length; i++) digits[i] = Number((target / weight(i)) % bb());
      paint();
    } else if (act === "hint" && mode === "fwd" && targetOk) {
      const R = target - sum();
      if (R > 0n) {
        for (let i = digits.length - 1; i >= 0; i--) {
          if (weight(i) <= R && digits[i] < base - 1) { flash(i); break; }
        }
      }
    }
  });

  function flash(i) {
    const el = slotsEl.querySelector(`.slot[data-i="${i}"]`);
    if (!el) return;
    el.classList.remove("hint"); void el.offsetWidth; el.classList.add("hint");
    setTimeout(() => el.classList.remove("hint"), 2400);
  }

  function setActive(groupId, btn) {
    $(groupId).querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  /* ---------- Avvio ---------- */
  fwdRebuild();
  paint();
})();
