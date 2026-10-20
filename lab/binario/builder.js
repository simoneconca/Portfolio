/* ============================================================
   builder.js — Costruttore guidato di conversioni
   Decimale→Base: l'utente sceglie quante cifre servono (finché il
   massimo rappresentabile copre il numero), poi compone i blocchi.
   Base→Decimale: imposta le cifre e vede la somma pesata.
   Basi 2/8/16 + personalizzata (2–36). BigInt.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SYM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // cifre fino a base 36

  let base = 2;
  let mode = "fwd";           // "fwd" = decimale→base, "rev" = base→decimale
  let digits = [];            // indice 0 = meno significativo; valori 0..base-1
  let target = 0n, targetOk = false;
  let fwdPos = 1;             // quante cifre scelte (modalità diretta)

  const slotsEl = $("slots");
  const fwdBlock = $("fwdBlock"), revBlock = $("revBlock");
  const fwdBanner = $("fwdBanner"), fwdHelp = $("fwdHelp"), fwdCount = $("fwdCount");
  const targetEl = $("target");
  const posCountEl = $("posCount");
  const outputEl = $("output");
  const baseCustom = $("baseCustom"), baseCustomInput = $("baseCustomInput");

  const bb = () => BigInt(base);
  const weight = (i) => bb() ** BigInt(i);
  const sum = () => digits.reduce((a, d, i) => a + BigInt(d) * weight(i), 0n);
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const maxPos = () => Math.min(26, Math.max(1, Math.floor(Math.log(1e15) / Math.log(base))));
  const defaultRevPos = () => clamp(Math.ceil(Math.log(256) / Math.log(base)) || 1, 3, maxPos());
  const maxReprFwd = () => bb() ** BigInt(fwdPos) - 1n;
  function minPositions(v) { if (v <= 0n) return 1; let n = 0, p = 1n; const B = bb(); while (p <= v) { p *= B; n++; } return n; }
  const digitsToString = () => { let s = ""; for (let i = digits.length - 1; i >= 0; i--) s += SYM[digits[i]]; return s; };
  const zeros = (n) => new Array(n).fill(0);

  /* ---------- struttura ---------- */
  function fwdValidate() {
    const raw = targetEl.value.trim();
    targetEl.closest(".field").classList.remove("invalid");
    if (raw === "") { targetOk = false; target = 0n; return; }
    if (!/^\d+$/.test(raw)) { targetOk = false; target = 0n; targetEl.closest(".field").classList.add("invalid"); return; }
    target = BigInt(raw); targetOk = true;
  }
  function resizeFwd() { while (digits.length < fwdPos) digits.push(0); while (digits.length > fwdPos) digits.pop(); }
  function revReset() { digits = zeros(defaultRevPos()); }

  /* ---------- disegno ---------- */
  function paint() {
    fwdBlock.hidden = mode !== "fwd";
    revBlock.hidden = mode !== "rev";
    document.querySelectorAll(".fwd-only").forEach((b) => (b.hidden = mode !== "fwd"));
    if (mode === "rev") posCountEl.textContent = String(digits.length);
    if (mode === "fwd") fwdCount.textContent = String(fwdPos);
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
      const d = digits[i], w = weight(i), active = d > 0;
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
      fwdHelp.innerHTML = "";
      fwdBanner.className = "target-banner over";
      fwdBanner.innerHTML = `<span class="lbl">Scrivi un numero decimale valido.</span>`;
      outputEl.innerHTML = "";
      return;
    }
    const maxR = maxReprFwd(), enough = maxR >= target;
    fwdHelp.innerHTML = `con <b>${fwdPos}</b> cifre arrivi fino a ${base}<sup>${fwdPos}</sup>−1 = <b>${maxR}</b> ` +
      (enough ? `<span class="ph-ok">✓ bastano</span>` : `<span class="ph-no">✗ troppo poche</span>`);

    if (!enough) {
      fwdBanner.className = "target-banner over";
      fwdBanner.innerHTML =
        `<span><span class="lbl">Obiettivo</span> <span class="big">${target}</span></span>` +
        `<span><span class="lbl">Massimo con ${fwdPos} cifre</span> <span class="big">${maxR}</span></span>`;
      outputEl.innerHTML = fwdPos >= maxPos()
        ? `<p class="out-hint">Numero troppo grande per il costruttore in questa base: prova una base più alta o un numero più piccolo.</p>`
        : `<p class="out-hint">Con <strong>${fwdPos}</strong> cifre arrivi solo a <strong>${maxR}</strong>: premi <strong>+</strong> per <strong>aggiungere una cifra</strong> finché il massimo non raggiunge almeno ${target}.</p>`;
      return;
    }
    const S = sum(), R = target - S;
    let cls = "target-banner"; if (R === 0n) cls += " success"; else if (R < 0n) cls += " over";
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
    const S = sum(), str = digitsToString(), terms = [];
    for (let i = digits.length - 1; i >= 0; i--) if (digits[i] > 0) terms.push(`<span class="term">${digits[i]} × ${weight(i)}</span>`);
    const termsHtml = terms.length ? terms.join(` <span class="plus">+</span> `) : `<span class="term">0</span>`;
    outputEl.innerHTML =
      `<div class="out-sum">${termsHtml} <span class="plus">=</span> <strong>${S}</strong></div>` +
      `<div class="out-result">` +
        `<span class="out-string">${str}<sub>${base}</sub></span>` +
        `<span class="sub">in base 10 vale</span>` +
        `<span class="big">${S}</span>` +
      `</div>`;
  }

  function setDigit(i, v, refocus) {
    digits[i] = clamp(v, 0, base - 1);
    paint();
    if (refocus) { const el = slotsEl.querySelector(`.slot[data-i="${i}"] .slot-digit`); if (el) el.focus(); }
  }

  /* ---------- eventi ---------- */
  slotsEl.addEventListener("click", (e) => {
    const slot = e.target.closest(".slot"); if (!slot) return;
    const i = parseInt(slot.dataset.i, 10);
    const nudge = e.target.closest(".slot-nudge");
    if (nudge) setDigit(i, digits[i] + parseInt(nudge.dataset.dir, 10), true);
    else if (e.target.closest(".slot-digit")) setDigit(i, (digits[i] + 1) % base, true);
  });
  slotsEl.addEventListener("keydown", (e) => {
    const digitBtn = e.target.closest(".slot-digit"); if (!digitBtn) return;
    const i = parseInt(e.target.closest(".slot").dataset.i, 10);
    if (e.key === "ArrowUp") { e.preventDefault(); setDigit(i, digits[i] + 1, true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setDigit(i, digits[i] - 1, true); }
  });

  $("modeSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]"); if (!btn) return;
    mode = btn.dataset.mode; setActive("modeSeg", btn);
    if (mode === "fwd") { fwdValidate(); fwdPos = 1; resizeFwd(); } else revReset();
    paint();
  });

  $("baseSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-base]"); if (!btn) return;
    setActive("baseSeg", btn);
    if (btn.dataset.base === "custom") { baseCustom.hidden = false; base = clamp(parseInt(baseCustomInput.value, 10) || 2, 2, 36); }
    else { baseCustom.hidden = true; base = parseInt(btn.dataset.base, 10); }
    onBaseChange();
  });
  baseCustomInput.addEventListener("input", () => { base = clamp(parseInt(baseCustomInput.value, 10) || 2, 2, 36); onBaseChange(); });
  function onBaseChange() {
    if (mode === "fwd") { fwdPos = 1; resizeFwd(); } else revReset();
    digits = digits.map((d) => Math.min(d, base - 1));
    paint();
  }

  targetEl.addEventListener("input", () => { fwdValidate(); resizeFwd(); paint(); });

  $("fwdPlus").addEventListener("click", () => { if (fwdPos < maxPos()) { fwdPos++; resizeFwd(); paint(); } });
  $("fwdMinus").addEventListener("click", () => { if (fwdPos > 1) { fwdPos--; resizeFwd(); paint(); } });
  $("posPlus").addEventListener("click", () => { if (digits.length < maxPos()) { digits.push(0); paint(); } });
  $("posMinus").addEventListener("click", () => { if (digits.length > 1) { digits.pop(); paint(); } });

  $("actions").addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act; if (!act) return;
    if (act === "reset") { digits = digits.map(() => 0); paint(); }
    else if (act === "solve" && mode === "fwd" && targetOk) {
      fwdPos = clamp(minPositions(target), 1, maxPos()); resizeFwd();
      for (let i = 0; i < fwdPos; i++) digits[i] = Number((target / weight(i)) % bb());
      paint();
    } else if (act === "hint" && mode === "fwd" && targetOk) {
      if (maxReprFwd() < target) { flashEl($("fwdPlus")); return; }
      const R = target - sum();
      if (R > 0n) for (let i = digits.length - 1; i >= 0; i--) if (weight(i) <= R && digits[i] < base - 1) { flashSlot(i); break; }
    }
  });
  function flashSlot(i) { const el = slotsEl.querySelector(`.slot[data-i="${i}"]`); if (!el) return; el.classList.remove("hint"); void el.offsetWidth; el.classList.add("hint"); setTimeout(() => el.classList.remove("hint"), 2400); }
  function flashEl(el) { if (!el) return; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1500); }
  function setActive(groupId, btn) { $(groupId).querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active")); btn.classList.add("active"); }

  /* ---------- avvio ---------- */
  fwdValidate(); resizeFwd(); paint();
})();
