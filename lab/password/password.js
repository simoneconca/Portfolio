/* ============================================================
   password.js — Quanto è forte la tua password?
   Stima entropia e tempo di «scasso» a forza bruta, con consigli.
   Tutto nel browser: niente viene inviato da nessuna parte.
   ============================================================ */
(function () {
  "use strict";

  const input = document.getElementById("pwInput");
  const toggle = document.getElementById("pwToggle");
  const fill = document.getElementById("pwFill");
  const rating = document.getElementById("pwRating");
  const ratingSub = document.getElementById("pwRatingSub");
  const statEntropy = document.getElementById("pwEntropy");
  const statCharset = document.getElementById("pwCharset");
  const statTime = document.getElementById("pwTime");
  const checks = document.getElementById("pwChecks");
  const warns = document.getElementById("pwWarns");

  // attaccante "offline veloce" (GPU): ~10 miliardi di tentativi al secondo
  const GUESSES_PER_SEC = 1e10;
  const COMMON = ["password", "123456", "123456789", "qwerty", "12345678", "111111", "1234567890",
    "abc123", "password1", "iloveyou", "admin", "letmein", "welcome", "monkey", "dragon", "ciao",
    "juventus", "napoli", "amore", "passw0rd", "qwertyuiop", "asdfgh", "000000", "superman"];

  function charsetSize(p) {
    let s = 0;
    if (/[a-z]/.test(p)) s += 26;
    if (/[A-Z]/.test(p)) s += 26;
    if (/[0-9]/.test(p)) s += 10;
    if (/[^a-zA-Z0-9]/.test(p)) s += 33; // simboli/spazi
    return s;
  }

  function hasSequence(p) {
    const low = p.toLowerCase();
    const seqs = "abcdefghijklmnopqrstuvwxyz0123456789qwertyuiopasdfghjklzxcvbnm";
    for (let i = 0; i + 3 <= low.length; i++) {
      const sub = low.slice(i, i + 4);
      if (seqs.indexOf(sub) !== -1) return true;
      // sequenza all'indietro
      if (seqs.indexOf(sub.split("").reverse().join("")) !== -1) return true;
    }
    return false;
  }
  function hasRepeat(p) { return /(.)\1\1/.test(p); } // 3+ caratteri uguali di fila
  // "notissima" SOLO se la password È una password comune (match esatto, o parola comune
  // + poche cifre finali su una password corta). NON se la contiene soltanto: una frase
  // lunga che contiene "amore" resta fortissima.
  function isCommon(p) {
    const low = p.toLowerCase().trim();
    if (COMMON.indexOf(low) !== -1) return true;
    const base = low.replace(/[0-9!?.\-_]+$/g, "");
    return low.length <= 12 && base.length >= 3 && COMMON.indexOf(base) !== -1;
  }
  // restituisce una parola comune contenuta (solo per un avviso, non declassa)
  function commonWordIn(p) { const low = p.toLowerCase(); return COMMON.find((c) => c.length >= 5 && low.indexOf(c) !== -1) || null; }

  function u(n, sing, plur) { return n + " " + (n === 1 ? sing : plur); }
  function fmtTime(seconds) {
    if (seconds < 1) return "meno di un secondo";
    const min = 60, h = 3600, d = 86400, y = 31557600;
    if (seconds < min) return u(Math.round(seconds), "secondo", "secondi");
    if (seconds < h) return u(Math.round(seconds / min), "minuto", "minuti");
    if (seconds < d) return u(Math.round(seconds / h), "ora", "ore");
    if (seconds < y) return u(Math.round(seconds / d), "giorno", "giorni");
    const years = seconds / y;
    if (years < 1000) return u(Math.round(years), "anno", "anni");
    if (years < 1e6) return Math.round(years / 1000) + " mila anni";
    if (years < 1e9) return u(Math.round(years / 1e6), "milione di anni", "milioni di anni");
    if (years < 1.4e10) return u(Math.round(years / 1e9), "miliardo di anni", "miliardi di anni");
    return "più dell'età dell'universo 🌌";
  }

  const LEVELS = [
    { name: "Debolissima", sub: "si scopre all'istante" },
    { name: "Debole", sub: "resiste poco" },
    { name: "Media", sub: "meglio rinforzarla" },
    { name: "Forte", sub: "buona" },
    { name: "Fortissima", sub: "ottima!" }
  ];

  function levelFromEntropy(e) {
    if (e < 28) return 0;
    if (e < 40) return 1;
    if (e < 60) return 2;
    if (e < 90) return 3;
    return 4;
  }

  function update() {
    const p = input.value;
    const len = p.length;
    const cs = charsetSize(p);
    const entropy = len ? +(len * Math.log2(cs || 1)).toFixed(1) : 0;

    // tempo medio = metà dello spazio delle combinazioni
    const combos = cs > 0 ? Math.pow(cs, len) : 0;
    const seconds = combos > 0 ? (combos / 2) / GUESSES_PER_SEC : 0;

    let lvl = len ? levelFromEntropy(entropy) : 0;
    // declassa se è comune o tutta una sequenza/ripetizione
    const common = len > 0 && isCommon(p);
    if (common) lvl = 0;

    const L = LEVELS[lvl];
    fill.className = "pw-meter-fill fill-lv" + lvl;
    fill.style.width = len ? ((lvl + 1) / 5 * 100) + "%" : "0%";
    rating.className = "pw-rating lv" + lvl;
    rating.textContent = len ? L.name : "—";
    ratingSub.textContent = len ? L.sub : "Scrivi una password per analizzarla";

    statEntropy.innerHTML = entropy + " <small>bit</small>";
    statCharset.innerHTML = (len ? cs : 0) + " <small>simboli possibili</small>";
    statTime.textContent = len ? (common ? "istantaneo (è nota)" : fmtTime(seconds)) : "—";

    // criteri
    const crit = [
      { ok: len >= 12, t: "Almeno 12 caratteri" + (len ? " (ne hai " + len + ")" : "") },
      { ok: /[a-z]/.test(p), t: "Lettere minuscole" },
      { ok: /[A-Z]/.test(p), t: "Lettere MAIUSCOLE" },
      { ok: /[0-9]/.test(p), t: "Numeri" },
      { ok: /[^a-zA-Z0-9]/.test(p), t: "Simboli (! ? @ # …)" }
    ];
    checks.innerHTML = crit.map((c) =>
      '<div class="pw-check ' + (c.ok ? "ok" : "no") + '"><span class="mk">' + (c.ok ? "✓" : "·") + "</span><span>" + c.t + "</span></div>"
    ).join("");

    // avvisi
    const w = [];
    if (common) w.push("È una <b>password notissima</b>: è tra le prime che un attaccante prova.");
    else if (len > 0 && len < 16 && commonWordIn(p)) w.push("Contiene la parola comune «<b>" + commonWordIn(p) + "</b>»: da sola indebolisce. In una frase lunga conta meno, ma evita parole troppo prevedibili.");
    if (len > 0 && hasSequence(p)) w.push("Contiene una <b>sequenza</b> (tipo <code>1234</code> o <code>abcd</code>): facile da indovinare.");
    if (len > 0 && hasRepeat(p)) w.push("Ha <b>caratteri ripetuti</b> di fila (tipo <code>aaaa</code>): aggiungono poca sicurezza.");
    if (len > 0 && len < 8) w.push("È <b>troppo corta</b>: ogni carattere in più rende la ricerca esponenzialmente più difficile.");
    warns.innerHTML = w.map((x) => '<div class="pw-warn">⚠️ ' + x + "</div>").join("");
  }

  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "nascondi" : "mostra";
  });
  input.addEventListener("input", update);

  update();
})();
