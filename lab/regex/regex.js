/* ============================================================
   regex.js — Espressioni regolari (regex)
   Tester dal vivo, esempi, ripasso dei simboli, sfide.
   Zero backend: tutto nel browser con il motore RegExp di JS.
   ============================================================ */
(function () {
  "use strict";

  var patternInput = document.getElementById("rxPattern");
  var fieldWrap = document.getElementById("rxFieldWrap");
  var flagsView = document.getElementById("rxFlagsView");
  var errorEl = document.getElementById("rxError");
  var textArea = document.getElementById("rxText");
  var outputEl = document.getElementById("rxOutput");
  var countEl = document.getElementById("rxCount");
  var matchesEl = document.getElementById("rxMatches");
  var examplesEl = document.getElementById("rxExamples");
  var cheatEl = document.getElementById("rxCheat");
  var chalsEl = document.getElementById("rxChals");

  var flags = { g: true, i: false, m: false, s: false };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function currentFlags() {
    return ["g", "i", "m", "s"].filter(function (f) { return flags[f]; }).join("");
  }

  /* ---------- Tester ---------- */
  function update() {
    var src = patternInput.value;
    flagsView.textContent = "/" + currentFlags();
    errorEl.textContent = "";
    fieldWrap.classList.remove("invalid");

    if (src === "") {
      outputEl.innerHTML = '<span class="rx-nohit">Scrivi una regex (o scegli un esempio) per vedere le corrispondenze…</span>';
      countEl.innerHTML = "";
      matchesEl.innerHTML = "";
      return;
    }
    var re;
    try {
      re = new RegExp(src, currentFlags());
    } catch (err) {
      fieldWrap.classList.add("invalid");
      errorEl.textContent = "Regex non valida: " + err.message;
      outputEl.innerHTML = "";
      countEl.innerHTML = "";
      matchesEl.innerHTML = "";
      return;
    }
    renderHighlight(re);
  }

  function renderHighlight(re) {
    var text = textArea.value;
    var global = re.flags.indexOf("g") !== -1;
    var iter = new RegExp(re.source, global ? re.flags : re.flags + "g");
    var out = "", last = 0, m, matches = [], guard = 0;

    while ((m = iter.exec(text)) !== null) {
      if (guard++ > 20000) break;
      if (m[0] === "") { iter.lastIndex++; if (!global) break; continue; }
      out += esc(text.slice(last, m.index));
      out += '<mark class="rx-hit">' + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
      matches.push(m);
      if (!global) break;
    }
    out += esc(text.slice(last));
    outputEl.innerHTML = out || '<span class="rx-nohit">(testo vuoto)</span>';

    if (matches.length === 0) {
      countEl.innerHTML = "nessuna corrispondenza";
      matchesEl.innerHTML = "";
      return;
    }
    var label = matches.length === 1 ? "corrispondenza" : "corrispondenze";
    var note = global ? "" : ' · <span style="color:var(--ink-faint)">solo la prima: attiva <b>g</b> per tutte</span>';
    countEl.innerHTML = "<strong>" + matches.length + "</strong> " + label + note;
    renderMatches(matches);
  }

  function renderMatches(matches) {
    var shown = matches.slice(0, 40);
    var html = shown.map(function (m, i) {
      var gr = [];
      for (var k = 1; k < m.length; k++) {
        gr.push('<span class="rx-group"><b>$' + k + "</b> " + (m[k] === undefined ? "—" : esc(m[k])) + "</span>");
      }
      if (m.groups) {
        for (var name in m.groups) {
          gr.push('<span class="rx-group"><b>' + esc(name) + "</b> " + (m.groups[name] === undefined ? "—" : esc(m.groups[name])) + "</span>");
        }
      }
      return '<div class="rx-match"><span class="rx-match-n">#' + (i + 1) + " · pos " + m.index +
        '</span><span class="rx-match-txt">' + (esc(m[0]) || "∅") + "</span>" +
        (gr.length ? '<span class="rx-groups">' + gr.join("") + "</span>" : "") + "</div>";
    }).join("");
    if (matches.length > 40) html += '<p class="rx-sublabel">…e altre ' + (matches.length - 40) + "</p>";
    matchesEl.innerHTML = html;
  }

  patternInput.addEventListener("input", update);
  textArea.addEventListener("input", update);

  document.querySelectorAll(".rx-flag").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.flag;
      flags[f] = !flags[f];
      b.classList.toggle("active", flags[f]);
      update();
    });
  });

  function setFlags(str) {
    ["g", "i", "m", "s"].forEach(function (f) {
      flags[f] = str.indexOf(f) !== -1;
      var btn = document.querySelector('.rx-flag[data-flag="' + f + '"]');
      if (btn) btn.classList.toggle("active", flags[f]);
    });
  }

  /* inserisce un pezzo di regex nel punto del cursore */
  function insertToken(ins, caretBack) {
    var s = patternInput.selectionStart, e = patternInput.selectionEnd;
    if (s == null) { s = e = patternInput.value.length; }
    patternInput.value = patternInput.value.slice(0, s) + ins + patternInput.value.slice(e);
    var pos = s + ins.length - (caretBack || 0);
    patternInput.focus();
    patternInput.setSelectionRange(pos, pos);
    update();
  }

  /* ---------- Esempi pronti ---------- */
  var EXAMPLES = [
    { id: "email", label: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+", flags: "gi",
      text: "Scrivimi a mario.rossi@example.com oppure a info@scuola.it.\nMa non a questo: nome (at) dominio." },
    { id: "tel", label: "Telefono", pattern: "(?:\\+39\\s?)?3\\d{2}[\\s.-]?\\d{6,7}", flags: "g",
      text: "Cellulare: +39 333 1234567 oppure 3391234567.\nIl fisso 02 1234567 non deve agganciarsi." },
    { id: "data", label: "Date (con gruppi)", pattern: "\\b(\\d{1,2})[/-](\\d{1,2})[/-](\\d{2,4})\\b", flags: "g",
      text: "Scadenze: 01/09/2026, 7-12-25 e 31/12/2026.\nOgni data si divide in giorno, mese e anno." },
    { id: "nomi", label: "Nomi propri", pattern: "\\b[A-Z][a-zà-ù]+", flags: "g",
      text: "Marco e Giulia vivono a Roma, ma Luca è di milano (occhio alla minuscola)." },
    { id: "url", label: "Link", pattern: "https?://[^\\s]+", flags: "g",
      text: "Vai su https://www.simoneconca.it e su https://neal.fun.\nNon su ftp://vecchio-server." },
    { id: "num", label: "Numeri", pattern: "-?\\d+(?:[.,]\\d+)?", flags: "g",
      text: "Totale 1234,50 €, saldo -3.2 e quantità 42 pezzi." }
  ];

  EXAMPLES.forEach(function (ex) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "rx-ex";
    b.textContent = ex.label;
    b.addEventListener("click", function () {
      patternInput.value = ex.pattern;
      textArea.value = ex.text;
      setFlags(ex.flags);
      update();
    });
    examplesEl.appendChild(b);
  });

  /* ---------- Ripasso dei simboli ---------- */
  var CHEAT = [
    { g: "Caratteri", items: [
      [".", "un carattere qualsiasi", "."],
      ["\\d", "una cifra (0-9)", "\\d"],
      ["\\D", "tutto tranne una cifra", "\\D"],
      ["\\w", "lettera, cifra o _", "\\w"],
      ["\\s", "spazio, tab o a-capo", "\\s"],
      ["\\.", "un punto «vero»", "\\."]
    ]},
    { g: "Classi", items: [
      ["[abc]", "una tra a, b, c", "[abc]"],
      ["[a-z]", "una lettera minuscola", "[a-z]"],
      ["[0-9]", "una cifra", "[0-9]"],
      ["[^…]", "qualsiasi tranne queste", "[^]", 1]
    ]},
    { g: "Quantificatori", items: [
      ["*", "zero o più volte", "*"],
      ["+", "una o più volte", "+"],
      ["?", "zero o una volta", "?"],
      ["{3}", "esattamente 3 volte", "{3}"],
      ["{2,4}", "da 2 a 4 volte", "{2,4}"],
      ["{2,}", "almeno 2 volte", "{2,}"]
    ]},
    { g: "Àncore", items: [
      ["^", "inizio della stringa", "^"],
      ["$", "fine della stringa", "$"],
      ["\\b", "confine di parola", "\\b"]
    ]},
    { g: "Gruppi", items: [
      ["( )", "gruppo di cattura", "()", 1],
      ["(?: )", "gruppo senza cattura", "(?:)", 1],
      ["a|b", "a oppure b", "|"]
    ]}
  ];

  cheatEl.innerHTML = CHEAT.map(function (group) {
    var tokens = group.items.map(function (it) {
      return '<button type="button" class="rx-token" data-ins="' + esc(it[2]) + '" data-back="' + (it[3] || 0) +
        '"><code>' + esc(it[0]) + "</code><small>" + esc(it[1]) + "</small></button>";
    }).join("");
    return '<div class="rx-cheat-group"><h3>' + esc(group.g) + '</h3><div class="rx-tokens">' + tokens + "</div></div>";
  }).join("");

  cheatEl.querySelectorAll(".rx-token").forEach(function (b) {
    b.addEventListener("click", function () {
      insertToken(b.dataset.ins, parseInt(b.dataset.back, 10) || 0);
    });
  });

  /* ---------- Sfide ---------- */
  var CHALS = [
    { title: "Solo numeri interi", task: "Accetta stringhe fatte solo di cifre.",
      yes: ["42", "2026", "7"], no: ["12a", "3.14", "-5"],
      sol: "^\\d+$", hint: "Àncora con ^ e $, e usa \\d." },
    { title: "Un indirizzo email", task: "Qualcosa, una @, un dominio, un punto e l'estensione.",
      yes: ["a@b.it", "mario.rossi@example.com", "info@scuola.edu"], no: ["a@b", "@b.it", "mario rossi@x.it"],
      sol: "^[\\w.]+@\\w+\\.[a-z]+$", hint: "…@…\\.… con ^ e $ attorno." },
    { title: "Orario HH:MM (24 ore)", task: "Ore da 00 a 23, minuti da 00 a 59.",
      yes: ["00:00", "09:30", "23:59"], no: ["24:00", "9:30", "12:60"],
      sol: "^([01]\\d|2[0-3]):[0-5]\\d$", hint: "Intervalli: 2[0-3] per le ore, [0-5]\\d per i minuti." },
    { title: "Un tag HTML di apertura", task: "< poi lettere (e magari un numero) poi >.",
      yes: ["<p>", "<div>", "<h1>"], no: ["<p", "p>", "</p>", "< p>"],
      sol: "^<[a-z]+\\d*>$", hint: "Comincia con < e finisci con >." }
  ];

  CHALS.forEach(function (chal, idx) {
    var card = document.createElement("div");
    card.className = "rx-chal";

    function caseRows(list) {
      return list.map(function (s) {
        return '<div class="rx-case"><span class="rx-dot">·</span><samp>' + esc(s) + "</samp></div>";
      }).join("");
    }

    card.innerHTML =
      '<div class="rx-chal-head"><span class="rx-chal-n">Sfida ' + (idx + 1) + '</span>' +
        '<span class="rx-chal-title">' + esc(chal.title) + "</span></div>" +
      '<p class="rx-chal-task">' + esc(chal.task) + "</p>" +
      '<div class="rx-chal-field"><span class="rx-slash">/</span>' +
        '<input type="text" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" ' +
        'aria-label="La tua regex per la sfida ' + (idx + 1) + '" placeholder="la tua regex…"><span class="rx-slash">/</span></div>' +
      '<div class="rx-cases">' +
        '<div class="rx-caseset"><span class="rx-caseset-lab">Accetta ✓</span>' + caseRows(chal.yes) + "</div>" +
        '<div class="rx-caseset"><span class="rx-caseset-lab">Rifiuta ✗</span>' + caseRows(chal.no) + "</div>" +
      "</div>" +
      '<div class="rx-chal-foot">' +
        '<span class="rx-chal-msg hidden">Risolto! 🎉</span>' +
        '<button type="button" class="ghost-btn rx-solbtn">Mostra una soluzione</button>' +
        '<span class="rx-sol" hidden>es. <code>' + esc(chal.sol) + "</code></span>" +
      "</div>";

    var input = card.querySelector(".rx-chal-field input");
    var sets = card.querySelectorAll(".rx-caseset");
    var yesRows = sets[0].querySelectorAll(".rx-case");
    var noRows = sets[1].querySelectorAll(".rx-case");
    var msg = card.querySelector(".rx-chal-msg");
    var solBtn = card.querySelector(".rx-solbtn");
    var solEl = card.querySelector(".rx-sol");

    function setCase(el, state) {
      el.classList.remove("ok", "bad");
      var dot = el.querySelector(".rx-dot");
      if (state === "ok") { el.classList.add("ok"); dot.textContent = "✓"; }
      else if (state === "bad") { el.classList.add("bad"); dot.textContent = "✗"; }
      else { dot.textContent = "·"; }
    }

    function check() {
      var re = null;
      if (input.value !== "") { try { re = new RegExp(input.value); } catch (e) { re = null; } }
      var allOk = input.value !== "" && re !== null;
      chal.yes.forEach(function (s, i) {
        if (!re) { setCase(yesRows[i], "neutral"); return; }
        var pass = re.test(s);
        setCase(yesRows[i], pass ? "ok" : "bad");
        if (!pass) allOk = false;
      });
      chal.no.forEach(function (s, i) {
        if (!re) { setCase(noRows[i], "neutral"); return; }
        var pass = !re.test(s);
        setCase(noRows[i], pass ? "ok" : "bad");
        if (!pass) allOk = false;
      });
      card.classList.toggle("solved", allOk);
      msg.classList.toggle("hidden", !allOk);
    }

    input.addEventListener("input", check);
    solBtn.addEventListener("click", function () {
      var showing = !solEl.hasAttribute("hidden");
      if (showing) { solEl.setAttribute("hidden", ""); solBtn.textContent = "Mostra una soluzione"; }
      else { solEl.removeAttribute("hidden"); solBtn.textContent = "Nascondi la soluzione"; }
    });

    chalsEl.appendChild(card);
  });

  /* ---------- Avvio ---------- */
  (function init() {
    var ex = EXAMPLES[0];
    patternInput.value = ex.pattern;
    textArea.value = ex.text;
    setFlags(ex.flags);
    update();
  })();
})();
