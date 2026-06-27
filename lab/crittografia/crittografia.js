/* ============================================================
   crittografia.js — Crittografia di base
   Cesare · Vigenère · chiave pubblica/privata (+ toy RSA) · hashing SHA-256.
   Nessuna libreria: l'hash usa window.crypto.subtle.
   ============================================================ */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  const A = 65; // 'A'

  /* ============================================================
     CESARE
     ============================================================ */
  function caesarShift(text, k) {
    let out = "";
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) out += String.fromCharCode((code - 65 + k + 26) % 26 + 65);
      else if (code >= 97 && code <= 122) out += String.fromCharCode((code - 97 + k + 26) % 26 + 97);
      else out += ch;
    }
    return out;
  }
  function renderCaesar() {
    const k = parseInt($("cesShift").value, 10);
    const decipher = $("cesDir").querySelector(".seg-btn.active").dataset.dir === "dec";
    const eff = decipher ? -k : k;
    $("cesShiftVal").textContent = "+" + k;
    $("cesOut").textContent = caesarShift($("cesIn").value, eff) || "—";

    // alfabeto mappato
    const row = $("cesAlpha");
    row.innerHTML = "";
    for (let i = 0; i < 26; i++) {
      const c = (i + eff + 26 * 4) % 26;
      const cell = document.createElement("div");
      cell.className = "cr-acell";
      cell.innerHTML = '<span class="p">' + String.fromCharCode(A + i) + '</span><span class="arr">▼</span><span class="c">' + String.fromCharCode(A + c) + "</span>";
      row.appendChild(cell);
    }
  }

  /* ============================================================
     VIGENÈRE
     ============================================================ */
  function vigenere(text, key, decipher) {
    const k = key.toUpperCase().replace(/[^A-Z]/g, "");
    if (!k.length) return { out: text, cols: [] };
    let out = "", ki = 0; const cols = [];
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const isLower = code >= 97 && code <= 122;
      if (isUpper || isLower) {
        const base = isUpper ? 65 : 97;
        const shift = k.charCodeAt(ki % k.length) - 65;
        const eff = decipher ? -shift : shift;
        const o = String.fromCharCode((code - base + eff + 26) % 26 + base);
        out += o;
        cols.push({ ch: ch, key: k[ki % k.length], shift: shift, o: o, alpha: true });
        ki++;
      } else {
        out += ch;
        cols.push({ ch: ch, key: "", shift: null, o: ch, alpha: false });
      }
    }
    return { out: out, cols: cols };
  }
  function renderVigenere() {
    const decipher = $("vigDir").querySelector(".seg-btn.active").dataset.dir === "dec";
    const r = vigenere($("vigIn").value, $("vigKey").value, decipher);
    $("vigOut").textContent = r.out || "—";
    const row = $("vigRow");
    row.innerHTML = "";
    r.cols.slice(0, 60).forEach(function (col) {
      const c = document.createElement("div");
      c.className = "cr-vcol" + (col.alpha ? " alpha" : "");
      if (col.alpha) c.innerHTML = "<b>" + escapeHtml(col.ch) + '</b><span class="k">' + col.key + "+" + col.shift + '</span><span class="o">' + escapeHtml(col.o) + "</span>";
      else c.innerHTML = "<b>" + escapeHtml(col.ch === " " ? "·" : col.ch) + "</b>";
      row.appendChild(c);
    });
  }

  /* ============================================================
     CHIAVE PUBBLICA / PRIVATA (metafora + toy RSA)
     ============================================================ */
  let isLocked = false;
  let plainMsg = "CIAO";
  function scramble(s) {
    // "cifratura" simbolica: sposta ogni lettera di +13 e mostra che è illeggibile
    return caesarShift(s, 13).split("").reverse().join("");
  }
  function renderKeys() {
    const lock = $("crLock"), msg = $("crLockMsg"), state = $("crLockState");
    if (isLocked) {
      lock.textContent = "🔒"; lock.style.transform = "scale(1)";
      msg.textContent = scramble(plainMsg);
      state.textContent = "Cifrato — leggibile solo con la chiave privata";
      state.className = "cr-lockstate locked";
    } else {
      lock.textContent = "🔓"; lock.style.transform = "scale(1.05)";
      msg.textContent = plainMsg;
      state.textContent = "In chiaro";
      state.className = "cr-lockstate open";
    }
  }

  // Toy RSA con numeri piccoli (solo didattico)
  function modpow(base, exp, mod) {
    let r = 1; base = base % mod;
    while (exp > 0) { if (exp & 1) r = (r * base) % mod; exp = Math.floor(exp / 2); base = (base * base) % mod; }
    return r;
  }
  const RSA = { p: 3, q: 11, e: 7 }; // n=33, φ=20, d=3
  function renderRsa() {
    const p = RSA.p, q = RSA.q, n = p * q, phi = (p - 1) * (q - 1), e = RSA.e;
    let d = 1; while ((d * e) % phi !== 1) d++;
    const m = parseInt($("rsaM").value, 10);
    $("rsaMval").textContent = m;
    const c = modpow(m, e, n);
    const dec = modpow(c, d, n);
    $("rsaChips").innerHTML =
      '<span class="cr-rsa-chip">p = <b>' + p + '</b></span>' +
      '<span class="cr-rsa-chip">q = <b>' + q + '</b></span>' +
      '<span class="cr-rsa-chip">n = p·q = <b>' + n + '</b></span>' +
      '<span class="cr-rsa-chip">φ(n) = <b>' + phi + '</b></span>' +
      '<span class="cr-rsa-chip">pubblica e = <b>' + e + '</b></span>' +
      '<span class="cr-rsa-chip">privata d = <b>' + d + '</b></span>';
    $("rsaFlow").innerHTML =
      "messaggio m = <span class='hl'>" + m + "</span><br>" +
      "cifro con la PUBBLICA:  c = m<sup>e</sup> mod n = " + m + "<sup>" + e + "</sup> mod " + n + " = <span class='hl'>" + c + "</span><br>" +
      "decifro con la PRIVATA: m = c<sup>d</sup> mod n = " + c + "<sup>" + d + "</sup> mod " + n + " = <span class='hl'>" + dec + "</span>";
  }

  /* ============================================================
     HASHING SHA-256 + EFFETTO VALANGA
     ============================================================ */
  async function sha256hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function hexDiffHtml(a, b) {
    let out = "";
    for (let i = 0; i < a.length; i++) {
      const same = a[i] === b[i];
      out += same ? a[i] : '<span class="diff">' + a[i] + "</span>";
    }
    return out;
  }
  function bitDiffPercent(a, b) {
    // confronta i 256 bit
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      diff += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
    }
    return Math.round((diff / 256) * 100);
  }
  async function renderHash() {
    if (!window.crypto || !crypto.subtle) {
      $("hashA").textContent = "crypto.subtle non disponibile in questo contesto.";
      return;
    }
    const a = await sha256hex($("hashInA").value);
    const b = await sha256hex($("hashInB").value);
    $("hashA").innerHTML = hexDiffHtml(a, b);
    $("hashB").innerHTML = hexDiffHtml(b, a);
    const pct = bitDiffPercent(a, b);
    $("avalNum").textContent = pct + "%";
    $("avalFill").style.width = pct + "%";
    const equal = $("hashInA").value === $("hashInB").value;
    $("avalCaption").innerHTML = equal
      ? "I due testi sono identici → hash identico."
      : "Cambiando il testo, circa <b>metà dei bit</b> dell'hash si ribalta: è l'<b>effetto valanga</b>.";
  }

  /* ============================================================
     WIRING
     ============================================================ */
  // segmented dir helper
  function wireSeg(segId, cb) {
    document.querySelectorAll("#" + segId + " .seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("#" + segId + " .seg-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active"); cb();
      });
    });
  }

  // modalità
  document.querySelectorAll("#crModeSeg .seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#crModeSeg .seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      const m = btn.dataset.mode;
      document.querySelectorAll(".cr-mode-panel").forEach(function (p) { p.hidden = p.dataset.mode !== m; });
    });
  });

  // Cesare
  $("cesIn").addEventListener("input", renderCaesar);
  $("cesShift").addEventListener("input", renderCaesar);
  wireSeg("cesDir", renderCaesar);

  // Vigenère
  $("vigIn").addEventListener("input", renderVigenere);
  $("vigKey").addEventListener("input", renderVigenere);
  wireSeg("vigDir", renderVigenere);

  // Chiavi
  $("btnLock").addEventListener("click", function () { isLocked = true; renderKeys(); });
  $("btnUnlock").addEventListener("click", function () { isLocked = false; renderKeys(); });
  $("crMsg").addEventListener("input", function () { plainMsg = $("crMsg").value || "CIAO"; renderKeys(); });
  $("rsaM").addEventListener("input", renderRsa);

  // Hash
  $("hashInA").addEventListener("input", renderHash);
  $("hashInB").addEventListener("input", renderHash);
  $("btnFlip").addEventListener("click", function () {
    // cambia un solo carattere del testo B rispetto ad A
    const a = $("hashInA").value || "ciao";
    const arr = a.split("");
    const i = arr.length ? arr.length - 1 : 0;
    const ch = arr[i] || "a";
    arr[i] = ch === "a" ? "b" : "a";
    $("hashInB").value = arr.join("");
    renderHash();
  });

  // init
  renderCaesar();
  renderVigenere();
  renderKeys();
  renderRsa();
  renderHash();
})();
