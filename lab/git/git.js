/* ============================================================
   git.js — Git Visual Sandbox
   Modello in memoria (NESSUN git reale): commit, branch, HEAD.
   Terminale simulato a sinistra, grafo SVG a corsie a destra.
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const LANE_COLORS = ["#2c45ff", "#d9772b", "#3fae6b", "#b5468f", "#1f9ab0", "#c0392b", "#7a52d6"];
  const ROW = 62, LANE_W = 46, NODE_R = 13, PAD_X = 30, PAD_TOP = 30, MSG_X = 22;

  // ---- DOM ----
  const termEl = document.getElementById("gvTerm");
  const inputEl = document.getElementById("gvInput");
  const svgWrap = document.getElementById("gvGraph");
  const explainEl = document.getElementById("gvExplain");
  const refsEl = document.getElementById("gvRefs");

  // ---- Stato del repo ----
  let repo, idCounter, history, histPos;

  function reset(initialized) {
    repo = {
      initialized: !!initialized,
      commits: {},            // id -> {id, parents:[], msg, seq}
      branches: {},           // name -> commitId|null
      head: null,             // {type:'branch',ref} | {type:'commit',ref}
      seq: 0
    };
    idCounter = 0;
    if (initialized) {
      repo.branches["main"] = null;
      repo.head = { type: "branch", ref: "main" };
    }
  }

  function genId() {
    idCounter++;
    return ((idCounter * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 7);
  }

  // ---- Risoluzione HEAD ----
  function headCommitId() {
    if (!repo.head) return null;
    if (repo.head.type === "commit") return repo.head.ref;
    return repo.branches[repo.head.ref]; // può essere null (branch "non nato")
  }
  function currentBranchName() {
    return repo.head && repo.head.type === "branch" ? repo.head.ref : null;
  }

  // ---- Terminale ----
  function print(text, cls) {
    const line = document.createElement("div");
    line.className = "gv-line " + (cls || "out");
    if (cls === "cmd") {
      line.innerHTML = '<span class="gv-prompt">' + promptStr() + "</span> " + escapeHtml(text);
    } else {
      line.textContent = text;
    }
    termEl.appendChild(line);
    termEl.scrollTop = termEl.scrollHeight;
  }
  function promptStr() {
    const b = currentBranchName();
    const tag = repo.initialized ? (b ? b : "detached") : "—";
    return "git:(" + tag + ")";
  }
  function setExplain(html) { explainEl.innerHTML = html; }

  // ---- Comandi ----
  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    print(cmd, "cmd");
    history.push(cmd); histPos = history.length;

    const tokens = tokenize(cmd);
    if (tokens[0] === "clear") { termEl.innerHTML = ""; return; }
    if (tokens[0] === "help") { return doHelp(); }
    if (tokens[0] !== "git") { print("Comando non riconosciuto. Scrivi comandi che iniziano con 'git' (o 'help').", "err"); return; }

    const sub = tokens[1];
    if (!repo.initialized && sub !== "init") {
      print("fatal: not a git repository — esegui prima 'git init'.", "err");
      return;
    }

    switch (sub) {
      case "init": return doInit();
      case "commit": return doCommit(tokens, cmd);
      case "branch": return doBranch(tokens);
      case "checkout": return doCheckout(tokens);
      case "switch": return doSwitch(tokens);
      case "merge": return doMerge(tokens);
      case "log": return doLog();
      case "status": return doStatus();
      case "reset": return doReset(tokens);
      default: print("git: '" + (sub || "") + "' non è un comando supportato in questo sandbox.", "err");
    }
  }

  function tokenize(s) {
    const out = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let m;
    while ((m = re.exec(s)) !== null) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
    return out;
  }

  function doInit() {
    if (repo.initialized) { print("Repository già inizializzato (lo reimposto).", "note"); }
    reset(true);
    print("Inizializzato repository Git vuoto. Branch corrente: main.", "ok");
    setExplain("<b>git init</b> crea un repository vuoto. C'è già un ramo <b>main</b>, ma è «non nato»: punterà a un commit solo dopo il primo <b>git commit</b>.");
    render();
  }

  function doCommit(tokens, raw) {
    let msg = null;
    const mi = tokens.indexOf("-m");
    if (mi !== -1 && tokens[mi + 1] !== undefined) msg = tokens[mi + 1];
    if (msg === null) msg = "commit " + (repo.seq + 1);

    const parentId = headCommitId();
    const id = genId();
    repo.seq++;
    repo.commits[id] = { id: id, parents: parentId ? [parentId] : [], msg: msg, seq: repo.seq };

    const b = currentBranchName();
    if (b) repo.branches[b] = id;
    else repo.head = { type: "commit", ref: id }; // detached: HEAD avanza sul nuovo commit

    print("[" + (b || "HEAD detached") + " " + id + "] " + msg, "ok");
    setExplain("Nuovo commit <b>" + id + "</b> creato" + (parentId ? " sopra <b>" + parentId + "</b>" : " (primo commit, nessun genitore)") +
      ". HEAD" + (b ? " e il ramo <b>" + b + "</b> avanzano" : " (detached) avanza") + " sul nuovo commit.");
    render();
  }

  function doBranch(tokens) {
    const name = tokens[2];
    if (!name) {
      // lista
      const names = Object.keys(repo.branches);
      if (!names.length) { print("Nessun ramo ancora (serve almeno un commit).", "note"); return; }
      names.forEach(function (n) {
        const star = currentBranchName() === n ? "* " : "  ";
        print(star + n, currentBranchName() === n ? "ok" : "out");
      });
      return;
    }
    if (repo.branches.hasOwnProperty(name)) { print("fatal: il ramo '" + name + "' esiste già.", "err"); return; }
    const target = headCommitId();
    if (!target) { print("fatal: serve almeno un commit prima di creare un ramo.", "err"); return; }
    repo.branches[name] = target;
    print("Creato ramo '" + name + "' su " + target + ".", "ok");
    setExplain("<b>git branch " + escapeHtml(name) + "</b> crea un nuovo puntatore che parte dal commit corrente <b>" + target + "</b>. HEAD non si è mosso: sei ancora su <b>" + (currentBranchName() || "?") + "</b>.");
    render();
  }

  function doCheckout(tokens) {
    if (tokens[2] === "-b") { return createAndSwitch(tokens[3]); }
    return switchTo(tokens[2]);
  }
  function doSwitch(tokens) {
    if (tokens[2] === "-c") { return createAndSwitch(tokens[3]); }
    return switchTo(tokens[2]);
  }
  function createAndSwitch(name) {
    if (!name) { print("fatal: indica il nome del nuovo ramo.", "err"); return; }
    if (repo.branches.hasOwnProperty(name)) { print("fatal: il ramo '" + name + "' esiste già.", "err"); return; }
    const target = headCommitId();
    if (!target) { print("fatal: serve almeno un commit prima di creare un ramo.", "err"); return; }
    repo.branches[name] = target;
    repo.head = { type: "branch", ref: name };
    print("Passato a un nuovo ramo '" + name + "'.", "ok");
    setExplain("<b>checkout -b " + escapeHtml(name) + "</b> = crea il ramo <b>" + escapeHtml(name) + "</b> e ci sposta HEAD sopra. Ora i commit avanzeranno su questo ramo.");
    render();
  }
  function switchTo(name) {
    if (!name) { print("fatal: indica il ramo (o il commit) di destinazione.", "err"); return; }
    if (repo.branches.hasOwnProperty(name)) {
      repo.head = { type: "branch", ref: name };
      print("Passato al ramo '" + name + "'.", "ok");
      setExplain("HEAD ora punta al ramo <b>" + escapeHtml(name) + "</b>. <b>HEAD</b> è semplicemente «dove sto lavorando»: spostarlo non cambia i commit, cambia solo il punto di vista.");
    } else if (repo.commits[name]) {
      repo.head = { type: "commit", ref: name };
      print("Nota: HEAD ora è 'detached' sul commit " + name + ".", "ok");
      setExplain("Hai fatto checkout di un <b>commit</b> diretto: HEAD è <b>detached</b> (staccato da ogni ramo). I nuovi commit non apparterranno a nessun ramo finché non ne crei uno.");
    } else {
      print("error: il riferimento '" + name + "' non esiste (né ramo né commit).", "err");
      return;
    }
    render();
  }

  function doMerge(tokens) {
    const name = tokens[2];
    if (!name) { print("fatal: indica il ramo da unire.", "err"); return; }
    if (!repo.branches.hasOwnProperty(name)) { print("merge: '" + name + "' non è un ramo.", "err"); return; }
    const cur = currentBranchName();
    if (!cur) { print("fatal: sei in stato detached, spostati su un ramo per fare merge.", "err"); return; }
    if (cur === name) { print("Già aggiornato (non puoi unire un ramo con sé stesso).", "note"); return; }

    const ours = repo.branches[cur];
    const theirs = repo.branches[name];
    if (!theirs) { print("merge: il ramo '" + name + "' non ha commit.", "err"); return; }
    if (!ours) { // ramo corrente non nato: fast-forward totale
      repo.branches[cur] = theirs;
      print("Fast-forward: '" + cur + "' ora punta a " + theirs + ".", "ok");
      render(); return;
    }
    // Già contenuto? (theirs è antenato di ours) -> up to date
    if (isAncestor(theirs, ours)) { print("Già aggiornato.", "note"); return; }
    // Fast-forward? (ours è antenato di theirs)
    if (isAncestor(ours, theirs)) {
      repo.branches[cur] = theirs;
      print("Fast-forward: '" + cur + "' avanza fino a " + theirs + " (nessun commit di merge).", "ok");
      setExplain("<b>Fast-forward</b>: <b>" + escapeHtml(cur) + "</b> era indietro e in linea retta rispetto a <b>" + escapeHtml(name) + "</b>, quindi git ha semplicemente spostato avanti il puntatore. Niente commit di merge.");
      render(); return;
    }
    // Merge a tre vie: nuovo commit con DUE genitori
    const id = genId();
    repo.seq++;
    repo.commits[id] = { id: id, parents: [ours, theirs], msg: "Merge branch '" + name + "' into " + cur, seq: repo.seq };
    repo.branches[cur] = id;
    print("Merge made by the 'recursive' strategy. [" + cur + " " + id + "]", "ok");
    setExplain("<b>Merge</b>: i rami erano divergenti, quindi git crea un <b>commit di merge</b> <b>" + id + "</b> con <b>due genitori</b> — la punta di <b>" + escapeHtml(cur) + "</b> e quella di <b>" + escapeHtml(name) + "</b>. Le due linee si riuniscono.");
    render();
  }

  function isAncestor(aId, bId) {
    // a è antenato di b?
    if (!aId || !bId) return false;
    const seen = {}; const stack = [bId];
    while (stack.length) {
      const cur = stack.pop();
      if (cur === aId) return true;
      if (seen[cur]) continue; seen[cur] = true;
      const c = repo.commits[cur];
      if (c) c.parents.forEach(function (p) { stack.push(p); });
    }
    return false;
  }

  function doLog() {
    const start = headCommitId();
    if (!start) { print("Nessun commit ancora.", "note"); return; }
    // ordina per seq decrescente raggiungibili da HEAD
    const seen = {}; const list = []; const stack = [start];
    while (stack.length) {
      const id = stack.pop();
      if (seen[id]) continue; seen[id] = true;
      const c = repo.commits[id]; if (!c) continue;
      list.push(c); c.parents.forEach(function (p) { stack.push(p); });
    }
    list.sort(function (a, b) { return b.seq - a.seq; });
    list.forEach(function (c) {
      const refs = branchesAt(c.id);
      const head = headCommitId() === c.id ? " (HEAD" + (currentBranchName() ? " -> " + currentBranchName() : "") + ")" : "";
      print("* " + c.id + head + (refs.length ? " [" + refs.join(", ") + "]" : "") + "  " + c.msg, "out");
    });
  }

  function branchesAt(id) {
    return Object.keys(repo.branches).filter(function (n) { return repo.branches[n] === id; });
  }

  function doStatus() {
    const b = currentBranchName();
    if (b) {
      print("Sul ramo " + b, "out");
      if (!repo.branches[b]) print("Ancora nessun commit", "note");
    } else {
      print("HEAD distaccato su " + headCommitId(), "out");
    }
    print("niente da committare, area di lavoro pulita (sandbox: i file non esistono)", "note");
  }

  function doReset(tokens) {
    // supporto minimo: git reset --hard <ref>
    const hard = tokens.indexOf("--hard") !== -1;
    const ref = tokens.filter(function (t, i) { return i >= 2 && t.indexOf("-") !== 0; })[0];
    const cur = currentBranchName();
    if (!cur) { print("reset: serve essere su un ramo.", "err"); return; }
    let targetId = null;
    if (!ref) { print("reset: indica un commit di destinazione (es. git reset --hard <id>).", "err"); return; }
    if (repo.branches[ref]) targetId = repo.branches[ref];
    else if (repo.commits[ref]) targetId = ref;
    if (!targetId) { print("reset: riferimento '" + ref + "' non trovato.", "err"); return; }
    repo.branches[cur] = targetId;
    print("HEAD ora a " + targetId + (hard ? " (--hard)" : ""), "ok");
    setExplain("<b>git reset</b> sposta il puntatore del ramo <b>" + escapeHtml(cur) + "</b> a un altro commit. I commit «scavalcati» restano nel grafo finché qualcosa li raggiunge.");
    render();
  }

  function doHelp() {
    [
      "Comandi supportati (sandbox didattico, nessun file reale):",
      "  git init",
      "  git commit -m \"messaggio\"",
      "  git branch [nome]",
      "  git checkout <ramo> | git checkout -b <nuovo>",
      "  git switch <ramo>   | git switch -c <nuovo>",
      "  git merge <ramo>",
      "  git log",
      "  git status",
      "  git reset --hard <ref>",
      "  clear · help"
    ].forEach(function (l) { print(l, "note"); });
  }

  /* ============================================================
     LAYOUT a corsie + RENDER SVG
     ============================================================ */
  function computeLayout() {
    const commits = Object.keys(repo.commits).map(function (k) { return repo.commits[k]; });
    commits.sort(function (a, b) { return a.seq - b.seq; }); // dal più vecchio
    const lanes = []; // lanes[k] = id del commit che "occupa" la punta della corsia k
    const pos = {};   // id -> {lane, row}
    commits.forEach(function (c, row) {
      const p0 = c.parents[0];
      let lane = -1;
      // continua la corsia del primo genitore, se libera lì
      for (let k = 0; k < lanes.length; k++) { if (lanes[k] === p0) { lane = k; break; } }
      if (lane === -1) {
        for (let k = 0; k < lanes.length; k++) { if (lanes[k] === null) { lane = k; break; } }
        if (lane === -1) { lane = lanes.length; lanes.push(null); }
      }
      lanes[lane] = c.id;
      // merge: libera la corsia del secondo genitore
      if (c.parents[1]) {
        for (let k = 0; k < lanes.length; k++) { if (lanes[k] === c.parents[1]) lanes[k] = null; }
      }
      pos[c.id] = { lane: lane, row: row };
    });
    return { commits: commits, pos: pos, laneCount: lanes.length };
  }

  function render() {
    refreshRefs();
    const commits = Object.keys(repo.commits);
    if (!commits.length) {
      svgWrap.innerHTML = '<div class="gv-empty">Il grafo è vuoto.<br>Esegui <b>git commit -m "primo"</b> per creare il primo nodo.</div>';
      return;
    }
    const L = computeLayout();
    const n = L.commits.length;
    const maxRow = n - 1;
    const height = PAD_TOP * 2 + maxRow * ROW;
    const width = Math.max(svgWrap.clientWidth || 360, PAD_X + (L.laneCount) * LANE_W + 230);

    const xOf = function (lane) { return PAD_X + lane * LANE_W; };
    const yOf = function (row) { return PAD_TOP + (maxRow - row) * ROW; }; // row alto = recente in alto

    const head = headCommitId();
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "gv-svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);

    // archi (figlio -> genitore)
    L.commits.forEach(function (c) {
      const cp = L.pos[c.id];
      c.parents.forEach(function (pid) {
        const pp = L.pos[pid]; if (!pp) return;
        const x1 = xOf(cp.lane), y1 = yOf(cp.row), x2 = xOf(pp.lane), y2 = yOf(pp.row);
        const path = document.createElementNS(SVGNS, "path");
        let d;
        if (x1 === x2) { d = "M" + x1 + " " + y1 + " L" + x2 + " " + y2; }
        else { const my = (y1 + y2) / 2; d = "M" + x1 + " " + y1 + " C" + x1 + " " + my + " " + x2 + " " + my + " " + x2 + " " + y2; }
        path.setAttribute("d", d);
        path.setAttribute("class", "gv-edge");
        path.setAttribute("stroke", LANE_COLORS[pp.lane % LANE_COLORS.length]);
        svg.appendChild(path);
      });
    });

    // nodi
    L.commits.forEach(function (c) {
      const cp = L.pos[c.id];
      const x = xOf(cp.lane), y = yOf(cp.row);
      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "gv-node" + (head === c.id ? " head" : ""));
      const color = LANE_COLORS[cp.lane % LANE_COLORS.length];

      if (head === c.id) {
        const ring = document.createElementNS(SVGNS, "circle");
        ring.setAttribute("class", "gv-headring");
        ring.setAttribute("cx", x); ring.setAttribute("cy", y); ring.setAttribute("r", NODE_R + 5);
        g.appendChild(ring);
      }
      const circ = document.createElementNS(SVGNS, "circle");
      circ.setAttribute("cx", x); circ.setAttribute("cy", y); circ.setAttribute("r", NODE_R);
      circ.setAttribute("fill", color);
      g.appendChild(circ);

      const idt = document.createElementNS(SVGNS, "text");
      idt.setAttribute("class", "gv-id"); idt.setAttribute("x", x + NODE_R + MSG_X - 14); idt.setAttribute("y", y);
      idt.textContent = c.id.slice(0, 5);
      // posiziona id e messaggio dopo eventuali etichette di ramo
      const refs = branchesAt(c.id);
      let labelX = x + NODE_R + 10;
      refs.forEach(function (name) {
        const isHeadBranch = currentBranchName() === name;
        const tw = name.length * 7 + 16;
        const pill = document.createElementNS(SVGNS, "rect");
        pill.setAttribute("class", "gv-bpill");
        pill.setAttribute("x", labelX); pill.setAttribute("y", y - 9);
        pill.setAttribute("width", tw); pill.setAttribute("height", 18); pill.setAttribute("rx", 5);
        pill.setAttribute("fill", isHeadBranch ? color : "none");
        pill.setAttribute("stroke", color); pill.setAttribute("stroke-width", "1.5");
        g.appendChild(pill);
        const t = document.createElementNS(SVGNS, "text");
        t.setAttribute("class", "gv-blabel"); t.setAttribute("x", labelX + 8); t.setAttribute("y", y + 1);
        t.setAttribute("fill", isHeadBranch ? "#fff" : color);
        t.textContent = name;
        g.appendChild(t);
        labelX += tw + 6;
      });
      // tag HEAD se detached su questo commit
      if (head === c.id && !currentBranchName()) {
        const tw = 34;
        const pill = document.createElementNS(SVGNS, "rect");
        pill.setAttribute("x", labelX); pill.setAttribute("y", y - 9); pill.setAttribute("width", tw); pill.setAttribute("height", 18); pill.setAttribute("rx", 5);
        pill.setAttribute("fill", "var(--ink)");
        g.appendChild(pill);
        const t = document.createElementNS(SVGNS, "text");
        t.setAttribute("class", "gv-blabel"); t.setAttribute("x", labelX + 6); t.setAttribute("y", y + 1); t.setAttribute("fill", "var(--bg)");
        t.textContent = "HEAD"; g.appendChild(t);
        labelX += tw + 6;
      }
      // messaggio del commit
      const msg = document.createElementNS(SVGNS, "text");
      msg.setAttribute("class", "gv-msg"); msg.setAttribute("x", labelX + 2); msg.setAttribute("y", y);
      const short = c.msg.length > 22 ? c.msg.slice(0, 21) + "…" : c.msg;
      msg.textContent = c.id.slice(0, 5) + "  " + short;
      g.appendChild(msg);

      svg.appendChild(g);
    });

    svgWrap.innerHTML = "";
    svgWrap.appendChild(svg);
  }

  function refreshRefs() {
    const parts = [];
    const head = headCommitId();
    const b = currentBranchName();
    parts.push('<span class="gv-ref head">HEAD → <b>' + (b ? escapeHtml(b) : "(detached) " + (head ? head.slice(0, 5) : "—")) + "</b></span>");
    Object.keys(repo.branches).forEach(function (n) {
      const id = repo.branches[n];
      parts.push('<span class="gv-ref"><b>' + escapeHtml(n) + "</b> → " + (id ? id.slice(0, 5) : "∅") + "</span>");
    });
    refsEl.innerHTML = parts.join("");
  }

  /* ---------- Input handlers ---------- */
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      const v = inputEl.value; inputEl.value = "";
      run(v);
    } else if (e.key === "ArrowUp") {
      if (histPos > 0) { histPos--; inputEl.value = history[histPos] || ""; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (histPos < history.length) { histPos++; inputEl.value = history[histPos] || ""; }
      e.preventDefault();
    }
  });
  document.querySelector(".gv-term-panel").addEventListener("click", function () { inputEl.focus(); });

  document.querySelectorAll("[data-cmd]").forEach(function (chip) {
    chip.addEventListener("click", function () { run(chip.dataset.cmd); inputEl.focus(); });
  });

  document.getElementById("gvResetBtn").addEventListener("click", function () {
    termEl.innerHTML = ""; history = []; histPos = 0;
    reset(true);
    print("Sandbox reimpostato. Repository su 'main', nessun commit.", "note");
    setExplain("Pronto. Prova <b>git commit -m \"primo\"</b>, poi crea un ramo e fai un <b>merge</b> per vedere il grafo riunirsi.");
    render();
  });

  document.getElementById("gvDemoBtn").addEventListener("click", function () {
    [
      'git commit -m "primo commit"',
      'git commit -m "homepage"',
      'git checkout -b feature',
      'git commit -m "nuova funzione"',
      'git commit -m "rifinitura"',
      'git checkout main',
      'git commit -m "fix urgente"',
      'git merge feature'
    ].forEach(run);
  });

  // ---- API per la guida (guida.js): scrive un comando nell'input ----
  window.GV = { type: function (cmd) { inputEl.value = cmd; inputEl.focus(); } };

  // ---- Avvio ----
  history = []; histPos = 0;
  reset(true);
  print("Benvenuto nel Git Visual Sandbox. Scrivi 'help' per i comandi.", "note");
  print("Suggerimento: parti con  git commit -m \"primo\"", "note");
  setExplain("Pronto. Ogni comando che digiti modifica il <b>grafo</b> qui a fianco: i commit sono cerchi, i rami sono etichette colorate, <b>HEAD</b> è il cerchio col contorno tratteggiato.");
  render();
  inputEl.focus();
})();
