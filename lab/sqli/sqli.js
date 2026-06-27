/* ============================================================
   sqli.js — SQL Injection Sandbox (laboratorio didattico)
   Esegue query REALI con sql.js (vendor condiviso con lab/sql/).
   Ambiente finto e locale: serve a capire come nasce la falla
   e — soprattutto — come la si chiude (query parametrizzate).
   ============================================================ */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  let SQL = null, db = null, ready = false;

  const SCHEMA = `
    CREATE TABLE utenti (id INTEGER PRIMARY KEY, username TEXT, password TEXT, ruolo TEXT);
    INSERT INTO utenti (id,username,password,ruolo) VALUES
      (1,'admin','S3gr3t0!2026','amministratore'),
      (2,'mrossi','ciao123','studente'),
      (3,'gverdi','primavera','docente');
  `;

  const userIn = $("siUser");
  const passIn = $("siPass");
  const queryEl = $("siQuery");
  const banner = $("siBanner");
  const resultEl = $("siResult");
  const loginBtn = $("siLogin");

  /* ---------- Costruzione query (modo VULNERABILE) ---------- */
  function rawQuery(u, p) {
    return "SELECT * FROM utenti WHERE username = '" + u + "' AND password = '" + p + "'";
  }

  // evidenzia parole chiave, stringhe e parti "iniettate"
  function highlightInput(s) {
    let h = escapeHtml(s);
    // token pericolosi
    h = h.replace(/(--|;|\bOR\b|\bUNION\b|\bSELECT\b|'|=)/gi, function (m) {
      return '<span class="si-danger">' + m + "</span>";
    });
    return '<span class="si-inj">' + h + "</span>";
  }
  function renderQuery() {
    const u = userIn.value, p = passIn.value;
    const secure = isSecure();
    if (secure) {
      queryEl.innerHTML =
        '<span class="si-kw">SELECT</span> * <span class="si-kw">FROM</span> utenti ' +
        '<span class="si-kw">WHERE</span> username = <span class="si-str">?</span> ' +
        '<span class="si-kw">AND</span> password = <span class="si-str">?</span>' +
        '<br><span style="color:var(--ink-faint)">-- parametri (trattati come DATI, non come codice):</span><br>' +
        '? = ' + highlightInput(u) + ' &nbsp; ? = ' + highlightInput(p);
    } else {
      queryEl.innerHTML =
        '<span class="si-kw">SELECT</span> * <span class="si-kw">FROM</span> utenti ' +
        '<span class="si-kw">WHERE</span> username = <span class="si-str">\'</span>' + highlightInput(u) +
        '<span class="si-str">\'</span> <span class="si-kw">AND</span> password = <span class="si-str">\'</span>' +
        highlightInput(p) + '<span class="si-str">\'</span>';
    }
  }

  function isSecure() {
    return document.querySelector("#siMode .seg-btn.active").dataset.mode === "secure";
  }

  /* ---------- Esecuzione ---------- */
  function runLogin() {
    if (!ready) return;
    const u = userIn.value, p = passIn.value;
    let rows = [], cols = [], error = null;
    try {
      if (isSecure()) {
        const stmt = db.prepare("SELECT * FROM utenti WHERE username = ? AND password = ?");
        stmt.bind([u, p]);
        while (stmt.step()) rows.push(stmt.getAsObject());
        cols = stmt.getColumnNames();
        stmt.free();
      } else {
        const res = db.exec(rawQuery(u, p));
        if (res.length) { cols = res[0].columns; rows = res[0].values.map(function (v) { const o = {}; cols.forEach(function (c, i) { o[c] = v[i]; }); return o; }); }
      }
    } catch (e) { error = e.message || String(e); }

    showResult(rows, cols, error, u, p);
  }

  function showResult(rows, cols, error, u, p) {
    if (error) {
      banner.className = "si-banner show deny";
      banner.innerHTML = "⚠️ <b>Errore SQL:</b> " + escapeHtml(error) + "<br>Anche un errore è un'informazione preziosa per chi attacca (rivela la struttura della query).";
      resultEl.innerHTML = "";
      return;
    }
    if (!rows.length) {
      banner.className = "si-banner show deny";
      banner.innerHTML = isSecure()
        ? "🔒 <b>Accesso negato.</b> Con la query parametrizzata l'input è solo un <b>dato</b>: nessun utente ha quel nome, quindi l'iniezione non funziona."
        : "❌ <b>Accesso negato.</b> Credenziali non valide. (Prova una delle sfide qui sotto…)";
      resultEl.innerHTML = "";
      return;
    }

    const first = rows[0];
    const injected = !isSecure() && (/('|--|\bor\b|\bunion\b)/i.test(u) || /('|--|\bor\b|\bunion\b)/i.test(p));
    const realLogin = rows.length === 1 && first.password === p && first.username === u;

    if (injected && !realLogin) {
      banner.className = "si-banner show win";
      banner.innerHTML = "💥 <b>Iniezione riuscita!</b> Sei entrato come <b>" + escapeHtml(String(first.username)) +
        "</b> (" + escapeHtml(String(first.ruolo)) + ") <b>senza conoscere la password</b>. Hai alterato la logica della query." +
        (rows.length > 1 ? " E hai estratto <b>" + rows.length + " righe</b> dal database." : "");
    } else {
      banner.className = "si-banner show ok";
      banner.innerHTML = "✅ <b>Accesso effettuato</b> come <b>" + escapeHtml(String(first.username)) + "</b> (" + escapeHtml(String(first.ruolo)) + ") con credenziali corrette.";
    }

    // tabella righe restituite (mostra l'eventuale leak)
    let html = '<div class="si-result-title">Righe restituite dal "server" (' + rows.length + ")</div>";
    html += '<div class="si-table-wrap"><table class="si-table"><thead><tr>';
    cols.forEach(function (c) { html += "<th>" + escapeHtml(c) + "</th>"; });
    html += "</tr></thead><tbody>";
    rows.forEach(function (r) {
      html += "<tr>";
      cols.forEach(function (c) {
        const leak = c === "password";
        html += '<td' + (leak ? ' class="leak"' : "") + ">" + escapeHtml(String(r[c])) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    resultEl.innerHTML = html;
  }

  /* ---------- Sfide ---------- */
  const CHALLENGES = {
    or:    { u: "admin' OR '1'='1", p: "", hint: "Classico <b>bypass con OR</b>: <code>' OR '1'='1</code> aggiunge una condizione SEMPRE vera. Per la precedenza, <code>username='admin' OR ('1'='1' AND password='…')</code> diventa vera grazie al solo username." },
    comment: { u: "admin'--", p: "qualsiasi", hint: "Il <b>commento</b> <code>--</code> «taglia via» tutto il resto della query: il controllo della password sparisce e resta solo <code>username='admin'</code>." },
    all:   { u: "' OR 1=1 --", p: "x", hint: "<b>Tautologia + commento</b>: <code>' OR 1=1 --</code> rende vera la WHERE per <b>tutte</b> le righe. Il «server» ti fa entrare con il primo utente: l'admin." },
    union: { u: "' UNION SELECT id, username, password, ruolo FROM utenti --", p: "x", hint: "<b>UNION-based</b>: attacchi la query per <b>leggere altri dati</b>. Qui estrai <b>tutte le password</b> in chiaro (guarda la colonna evidenziata). Funziona perché le colonne combaciano." }
  };

  /* ---------- Wiring ---------- */
  userIn.addEventListener("input", renderQuery);
  passIn.addEventListener("input", renderQuery);
  loginBtn.addEventListener("click", runLogin);
  passIn.addEventListener("keydown", function (e) { if (e.key === "Enter") runLogin(); });
  userIn.addEventListener("keydown", function (e) { if (e.key === "Enter") runLogin(); });

  document.querySelectorAll("#siMode .seg-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#siMode .seg-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderQuery();
      if (ready) runLogin();
    });
  });

  document.querySelectorAll("[data-challenge]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      const ch = CHALLENGES[chip.dataset.challenge];
      if (!ch) return;
      // le sfide si provano sul server vulnerabile
      document.querySelectorAll("#siMode .seg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.mode === "vuln"); });
      userIn.value = ch.u; passIn.value = ch.p;
      $("siHint").innerHTML = ch.hint;
      renderQuery();
      runLogin();
    });
  });

  /* ---------- Avvio sql.js ---------- */
  renderQuery();
  if (typeof initSqlJs !== "function") {
    banner.className = "si-banner show deny";
    banner.innerHTML = "Impossibile caricare il motore SQL (vendor/sql-wasm.js).";
    return;
  }
  loginBtn.disabled = true;
  resultEl.innerHTML = '<div class="si-loading">Carico il motore SQL nel browser…</div>';
  initSqlJs({ locateFile: function (f) { return "../sql/vendor/" + f; } })
    .then(function (mod) {
      SQL = mod; db = new SQL.Database(); db.run(SCHEMA);
      ready = true; loginBtn.disabled = false;
      resultEl.innerHTML = '<div class="si-empty">Premi <b>Accedi</b> o prova una sfida per vedere il risultato.</div>';
    })
    .catch(function (e) {
      resultEl.innerHTML = '<div class="si-empty">Errore nel caricamento del motore SQL: ' + escapeHtml(String(e)) + "</div>";
    });
})();
