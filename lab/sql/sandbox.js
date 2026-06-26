/* ============================================================
   sandbox.js — Live SQL Sandbox
   SQLite reale nel browser via sql.js (WebAssembly).
   Database d'esempio "scuola": studenti, corsi, voti.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- Database d'esempio ---------- */
  const SCHEMA_SQL = `
    CREATE TABLE studenti (
      id INTEGER PRIMARY KEY,
      nome TEXT, cognome TEXT, classe TEXT, citta TEXT, eta INTEGER
    );
    CREATE TABLE corsi (
      id INTEGER PRIMARY KEY,
      nome TEXT, docente TEXT
    );
    CREATE TABLE voti (
      id INTEGER PRIMARY KEY,
      studente_id INTEGER, corso_id INTEGER, voto INTEGER, data TEXT
    );

    INSERT INTO studenti (id,nome,cognome,classe,citta,eta) VALUES
      (1,'Giulia','Bianchi','5A','Milano',19),
      (2,'Marco','Rossi','5A','Torino',18),
      (3,'Sofia','Russo','5B','Milano',19),
      (4,'Luca','Ferrari','4A','Bologna',17),
      (5,'Aurora','Esposito','5B','Napoli',18),
      (6,'Matteo','Romano','4A','Roma',17),
      (7,'Chiara','Colombo','5A','Milano',19),
      (8,'Lorenzo','Ricci','5B','Firenze',18);

    INSERT INTO corsi (id,nome,docente) VALUES
      (1,'Informatica','prof. Conti'),
      (2,'Matematica','prof. Greco'),
      (3,'Inglese','prof. Marini'),
      (4,'Sistemi e Reti','prof. De Luca'),
      (5,'Storia','prof. Fabbri');

    INSERT INTO voti (studente_id,corso_id,voto,data) VALUES
      (1,1,9,'2026-03-10'),(1,2,8,'2026-03-12'),(1,4,10,'2026-04-02'),
      (2,1,7,'2026-03-10'),(2,2,6,'2026-03-12'),(2,3,8,'2026-04-05'),
      (3,1,8,'2026-03-11'),(3,4,9,'2026-04-02'),(3,5,7,'2026-04-08'),
      (4,2,5,'2026-03-12'),(4,3,6,'2026-04-05'),(4,1,7,'2026-03-11'),
      (5,1,10,'2026-03-10'),(5,4,9,'2026-04-03'),(5,2,8,'2026-03-13'),
      (6,2,4,'2026-03-12'),(6,5,6,'2026-04-08'),(6,3,7,'2026-04-06'),
      (7,1,9,'2026-03-11'),(7,3,9,'2026-04-05'),(7,4,8,'2026-04-02'),
      (8,5,8,'2026-04-08'),(8,1,6,'2026-03-10'),(8,2,7,'2026-03-13');
  `;

  // colonne: [nome, tipo SQLite, tipo MySQL, nota chiave]
  const SCHEMA_INFO = [
    { table: "studenti", cols: [
      ["id","INTEGER","INT","PK"],["nome","TEXT","VARCHAR(30)"],["cognome","TEXT","VARCHAR(30)"],
      ["classe","TEXT","VARCHAR(5)"],["citta","TEXT","VARCHAR(40)"],["eta","INTEGER","INT"]] },
    { table: "corsi", cols: [
      ["id","INTEGER","INT","PK"],["nome","TEXT","VARCHAR(40)"],["docente","TEXT","VARCHAR(40)"]] },
    { table: "voti", cols: [
      ["id","INTEGER","INT","PK"],["studente_id","INTEGER","INT","→ studenti"],
      ["corso_id","INTEGER","INT","→ corsi"],["voto","INTEGER","INT"],["data","TEXT","DATE"]] },
  ];

  const EXAMPLES = [
    { label: "Tutti gli studenti", q: "SELECT * FROM studenti;" },
    { label: "Filtro · WHERE", q: "SELECT nome, cognome, classe\nFROM studenti\nWHERE classe = '5A';" },
    { label: "Ordinamento · ORDER BY", q: "SELECT nome, cognome, eta\nFROM studenti\nORDER BY eta DESC;" },
    { label: "Unione tabelle · JOIN", q: "SELECT s.cognome, c.nome AS corso, v.voto\nFROM voti v\nJOIN studenti s ON v.studente_id = s.id\nJOIN corsi c ON v.corso_id = c.id;" },
    { label: "Concatenazione testo", q: {
        mysql: "SELECT CONCAT(nome, ' ', cognome) AS nome_completo, classe\nFROM studenti;",
        sqlite: "SELECT nome || ' ' || cognome AS nome_completo, classe\nFROM studenti;" } },
    { label: "Media per studente · GROUP BY", q: "SELECT s.nome, s.cognome,\n       ROUND(AVG(v.voto), 2) AS media\nFROM voti v\nJOIN studenti s ON v.studente_id = s.id\nGROUP BY v.studente_id\nORDER BY media DESC;" },
    { label: "Conteggio · COUNT", q: "SELECT classe, COUNT(*) AS n_studenti\nFROM studenti\nGROUP BY classe;" },
    { label: "Migliori voti · LIMIT", q: "SELECT s.cognome, c.nome AS corso, v.voto\nFROM voti v\nJOIN studenti s ON v.studente_id = s.id\nJOIN corsi c ON v.corso_id = c.id\nORDER BY v.voto DESC\nLIMIT 5;" },
    { label: "Inserimento · INSERT", q: "INSERT INTO studenti (nome, cognome, classe, citta, eta)\nVALUES ('Mario', 'Rossi', '5A', 'Milano', 19);\n\nSELECT * FROM studenti WHERE cognome = 'Rossi';" },
  ];

  /* ---------- Elementi ---------- */
  const editor = $("sqlEditor"), result = $("result"), statusEl = $("status");
  const btnRun = $("btnRun"), btnReset = $("btnReset");

  let SQL = null, db = null, dialect = "mysql";

  const exampleQ = (e) => (typeof e.q === "string" ? e.q : e.q[dialect]);

  /* ---------- Adattamento MySQL → SQLite (il motore è SQLite) ---------- */
  function splitArgs(s) {
    const parts = []; let depth = 0, q = null, cur = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { cur += ch; if (ch === q) q = null; }
      else if (ch === "'" || ch === '"' || ch === "`") { q = ch; cur += ch; }
      else if (ch === "(") { depth++; cur += ch; }
      else if (ch === ")") { depth--; cur += ch; }
      else if (ch === "," && depth === 0) { parts.push(cur); cur = ""; }
      else cur += ch;
    }
    if (cur.trim() !== "") parts.push(cur);
    return parts;
  }
  function translateConcat(sql) {
    let out = sql, guard = 0;
    const re = /\bCONCAT\s*\(/i;
    let idx;
    while ((idx = out.search(re)) !== -1 && guard++ < 50) {
      const open = out.indexOf("(", idx);
      let depth = 0, q = null, end = -1;
      for (let i = open; i < out.length; i++) {
        const ch = out[i];
        if (q) { if (ch === q) q = null; }
        else if (ch === "'" || ch === '"' || ch === "`") q = ch;
        else if (ch === "(") depth++;
        else if (ch === ")") { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end === -1) break;
      const args = splitArgs(out.slice(open + 1, end)).map((a) => a.trim());
      out = out.slice(0, idx) + "(" + args.join(" || ") + ")" + out.slice(end + 1);
    }
    return out;
  }
  function normalizeMySQL(sql) {
    let s = translateConcat(sql);
    s = s.replace(/\bAUTO_INCREMENT\b/gi, "");
    s = s.replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')");
    s = s.replace(/\bCURDATE\s*\(\s*\)/gi, "date('now')");
    s = s.replace(/\bCURRENT_DATE\b/gi, "date('now')");
    s = s.replace(/\bYEAR\s*\(([^()]+)\)/gi, "CAST(strftime('%Y',$1) AS INTEGER)");
    s = s.replace(/\bMONTH\s*\(([^()]+)\)/gi, "CAST(strftime('%m',$1) AS INTEGER)");
    s = s.replace(/\bDAY\s*\(([^()]+)\)/gi, "CAST(strftime('%d',$1) AS INTEGER)");
    return s;
  }

  function setDialectNote() {
    const el = $("dialectNote");
    if (el) el.textContent = dialect === "mysql"
      ? "Sintassi MySQL · adattata al motore SQLite"
      : "Sintassi SQLite nativa";
  }

  /* ---------- Render schema + esempi ---------- */
  function renderSchema() {
    $("schema").innerHTML = SCHEMA_INFO.map((t) =>
      `<div class="schema-table">` +
        `<div class="schema-table-name" data-q="SELECT * FROM ${t.table};" title="SELECT * FROM ${t.table}">${esc(t.table)}<span>SELECT *</span></div>` +
        `<div class="schema-cols">` +
          t.cols.map((c) => {
            const type = dialect === "mysql" ? c[2] : c[1];
            return `<div class="schema-col"><span class="c-name">${esc(c[0])}</span>` +
              `<span class="c-type">${esc(type)}${c[3] ? ` <span class="c-key">${esc(c[3])}</span>` : ""}</span></div>`;
          }).join("") +
        `</div>` +
      `</div>`
    ).join("");

    $("examples").innerHTML = EXAMPLES.map((e, i) =>
      `<button type="button" class="example-chip" data-i="${i}">${esc(e.label)}</button>`
    ).join("");
  }

  /* ---------- Inizializzazione del database ---------- */
  function buildDb() {
    if (db) db.close();
    db = new SQL.Database();
    db.run(SCHEMA_SQL);
  }

  /* ---------- Esecuzione ---------- */
  function run() {
    if (!db) return;
    const raw = editor.value.trim();
    if (!raw) { setStatus("Scrivi una query.", "err"); return; }
    const sql = dialect === "mysql" ? normalizeMySQL(raw) : raw;

    let results;
    try {
      results = db.exec(sql);
    } catch (e) {
      result.innerHTML = `<div class="result-error">✗ Errore SQL\n${esc(e.message)}</div>`;
      setStatus("Errore nella query", "err");
      return;
    }

    if (results.length === 0) {
      const n = db.getRowsModified();
      result.innerHTML = `<div class="result-msg">✓ Comando eseguito correttamente.` +
        (n ? ` Righe modificate: <b>${n}</b>.` : "") + `</div>`;
      setStatus("Eseguito", "ok");
      renderSchema(); // eventuali modifiche allo schema
      return;
    }

    result.innerHTML = results.map((r) => renderTable(r)).join("");
    const rows = results.reduce((a, r) => a + r.values.length, 0);
    setStatus(`${rows} righe`, "ok");
  }

  function renderTable(r) {
    const head = r.columns.map((c) => `<th>${esc(c)}</th>`).join("");
    const body = r.values.map((row) =>
      "<tr>" + row.map((v) => {
        if (v === null) return `<td class="null">NULL</td>`;
        const cls = typeof v === "number" ? " class=\"num\"" : "";
        return `<td${cls}>${esc(v)}</td>`;
      }).join("") + "</tr>"
    ).join("");
    return `<div class="result-meta">${r.values.length} righe · ${r.columns.length} colonne</div>` +
      `<div class="table-wrap"><table class="result-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.className = "editor-status" + (kind ? " " + kind : "");
  }

  /* ---------- Eventi ---------- */
  editor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart, en = editor.selectionEnd;
      editor.value = editor.value.slice(0, s) + "  " + editor.value.slice(en);
      editor.selectionStart = editor.selectionEnd = s + 2;
    }
  });
  btnRun.addEventListener("click", run);
  btnReset.addEventListener("click", () => {
    buildDb(); renderSchema();
    result.innerHTML = `<div class="result-msg">✓ Database ripristinato ai dati originali.</div>`;
    setStatus("Database ripristinato", "ok");
  });

  $("examples").addEventListener("click", (e) => {
    const b = e.target.closest(".example-chip"); if (!b) return;
    editor.value = exampleQ(EXAMPLES[+b.dataset.i]);
    editor.focus(); run();
  });
  $("dialectSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-dialect]"); if (!b) return;
    dialect = b.dataset.dialect;
    $("dialectSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    renderSchema(); setDialectNote();
  });
  $("schema").addEventListener("click", (e) => {
    const n = e.target.closest(".schema-table-name"); if (!n) return;
    editor.value = n.dataset.q; run();
  });

  /* ---------- Avvio: carica sql.js (WASM) ---------- */
  setDialectNote();
  renderSchema();
  result.innerHTML = `<div class="result-empty">Premi <b>Esegui</b> per lanciare la query e vedere qui il risultato.</div>`;

  if (typeof initSqlJs !== "function") {
    setStatus("Motore SQL non disponibile", "err");
    result.innerHTML = `<div class="result-error">Impossibile caricare sql.js (vendor/sql-wasm.js).</div>`;
    return;
  }

  initSqlJs({ locateFile: (file) => "vendor/" + file })
    .then((sqlModule) => {
      SQL = sqlModule;
      buildDb();
      btnRun.disabled = false;
      setStatus("Pronto", "ok");
      run(); // mostra subito il risultato della query di default
    })
    .catch((err) => {
      setStatus("Errore di caricamento", "err");
      result.innerHTML = `<div class="result-error">Errore nel caricare il motore SQL:\n${esc(err.message || err)}</div>`;
    });
})();
