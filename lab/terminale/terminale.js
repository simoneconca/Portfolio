/* ============================================================
   terminale.js — Virtual Terminal
   Shell Linux simulata: filesystem in memoria, permessi, utenti,
   redirezione, pipe, grep/regex ed editor vi. Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const HOST = "lab";
  const now = () => Date.now();

  /* ============================================================
     1. Filesystem
     ============================================================ */
  let inoSeq = 10;               // contatore degli i-number (inode)
  let umaskVal = 0o022;          // maschera predefinita dei permessi
  const nextIno = () => (inoSeq += 1);
  // mode predefinito tenendo conto della umask (666 per i file, 777 per le dir)
  const fileMode = () => 0o666 & ~umaskVal;
  const dirMode = () => 0o777 & ~umaskVal;

  function file(name, content, mode, owner, group) {
    return { type: "file", name, content: content || "", mode: mode == null ? 0o644 : mode,
             owner: owner || "root", group: group || "root", mtime: now(), ino: nextIno(), links: 1 };
  }
  function dir(name, children, mode, owner, group) {
    return { type: "dir", name, children: children || {}, mode: mode == null ? 0o755 : mode,
             owner: owner || "root", group: group || "root", mtime: now(), ino: nextIno(), links: 1 };
  }
  // collegamento simbolico: punta a un percorso (stringa), ha un proprio inode
  function symlink(name, target, owner, group) {
    return { type: "link", name, target, mode: 0o777, owner: owner || "root",
             group: group || "root", mtime: now(), ino: nextIno(), links: 1 };
  }

  let root, users, groups, userStack, history, histIdx, capture, viState, processes;
  let outToPipe = false; // true quando l'output del comando va in una pipe (ls one-per-line)

  function buildSystem() {
    inoSeq = 10;
    umaskVal = 0o022;
    users = {
      root: { uid: 0, gid: 0, home: "/root", shell: "/bin/bash", pass: "root", groups: ["root"] },
      studente: { uid: 1000, gid: 1000, home: "/home/studente", shell: "/bin/bash", pass: "", groups: ["studente", "sudo"] },
    };
    // tabella dei processi simulata (per il comando ps)
    processes = [
      { pid: 1, ppid: 0, user: "root", tty: "?", time: "00:00:02", stime: "09:01", cmd: "/sbin/init" },
      { pid: 2, ppid: 0, user: "root", tty: "?", time: "00:00:00", stime: "09:01", cmd: "kthreadd" },
      { pid: 512, ppid: 1, user: "root", tty: "?", time: "00:00:01", stime: "09:01", cmd: "systemd-journald" },
      { pid: 890, ppid: 1, user: "root", tty: "?", time: "00:00:00", stime: "09:02", cmd: "/usr/sbin/sshd" },
      { pid: 2145, ppid: 890, user: "studente", tty: "pts/0", time: "00:00:00", stime: "09:15", cmd: "-bash" },
    ];
    groups = {
      root: { gid: 0, members: [] },
      sudo: { gid: 27, members: ["studente"] },
      studente: { gid: 1000, members: ["studente"] },
    };
    userStack = ["studente"];

    root = dir("", {
      bin: dir("bin", {}),
      etc: dir("etc", {
        passwd: file("passwd", "", 0o644),
        group: file("group", "", 0o644),
        hostname: file("hostname", HOST + "\n", 0o644),
      }),
      home: dir("home", {
        studente: dir("studente", {
          "benvenuto.txt": file("benvenuto.txt",
            "Benvenuto nel Virtual Terminal!\nProva: ls, pwd, cd documenti, cat note.txt\nScrivi 'help' per la lista dei comandi.\n", 0o644, "studente", "studente"),
          documenti: dir("documenti", {
            "note.txt": file("note.txt", "riga uno\nriga due\nriga tre\nroot non e' qui\n", 0o644, "studente", "studente"),
            "numeri.txt": file("numeri.txt", "10\n25\nabc\n7\nx9y\n", 0o644, "studente", "studente"),
            "nomi.txt": file("nomi.txt", "Marco\nAnna\nLuca\nBeatrice\nAnna\nDavide\n", 0o644, "studente", "studente"),
            "arch1.txt": file("arch1.txt", "abc\t123\nzxy\t23\nhjk\t567\nabc\t123\nqwe\t8\naaa\t111\n", 0o644, "studente", "studente"),
            "originale.txt": file("originale.txt", "Ciao mondo!\nseconda riga\nterza riga\n", 0o644, "studente", "studente"),
            "modificato.txt": file("modificato.txt", "Hello world!\nseconda riga\nquarta riga\n", 0o644, "studente", "studente"),
          }, 0o755, "studente", "studente"),
        }, 0o755, "studente", "studente"),
      }),
      root: dir("root", {}, 0o700, "root", "root"),
      tmp: dir("tmp", {}, 0o777),
      var: dir("var", { log: dir("log", {}) }),
    });
    syncEtc();
  }

  function syncEtc() {
    let pw = "";
    for (const n in users) { const u = users[n]; pw += `${n}:x:${u.uid}:${u.gid}::${u.home}:${u.shell}\n`; }
    root.children.etc.children.passwd.content = pw;
    let gr = "";
    for (const n in groups) { const g = groups[n]; gr += `${n}:x:${g.gid}:${g.members.join(",")}\n`; }
    root.children.etc.children.group.content = gr;
  }

  /* ---------- Utente corrente ---------- */
  const curName = () => userStack[userStack.length - 1];
  const curUser = () => users[curName()];
  const isRoot = () => curUser().uid === 0;
  function inGroup(u, gname) {
    return u.groups && u.groups.indexOf(gname) >= 0;
  }

  /* ---------- Percorsi ---------- */
  let cwd = ["home", "studente"]; // segmenti da root

  function resolve(input, baseSegs) {
    let segs;
    if (input == null || input === "") return baseSegs.slice();
    if (input[0] === "/") segs = [];
    else if (input[0] === "~") { segs = curUser().home.split("/").filter(Boolean); input = input.slice(1); }
    else segs = baseSegs.slice();
    input.split("/").forEach((p) => {
      if (p === "" || p === ".") return;
      if (p === "..") { if (segs.length) segs.pop(); }
      else segs.push(p);
    });
    return segs;
  }
  // follow: se true, un collegamento simbolico finale viene risolto nel suo bersaglio
  function getNode(segs, follow, depth) {
    if (follow === undefined) follow = true;
    depth = depth || 0;
    if (depth > 40) return null; // protezione da link circolari
    let node = root;
    const cur = []; // percorso assoluto del nodo corrente
    for (let i = 0; i < segs.length; i++) {
      if (node.type === "link") { // link intermedio: risolvilo e prosegui
        node = getNode(resolve(node.target, cur.slice(0, -1)), true, depth + 1);
        if (!node) return null;
      }
      const s = segs[i];
      if (node.type !== "dir" || !node.children[s]) return null;
      node = node.children[s];
      cur.push(s);
    }
    if (follow && node && node.type === "link") {
      node = getNode(resolve(node.target, cur.slice(0, -1)), true, depth + 1);
    }
    return node;
  }
  const lstat = (segs) => getNode(segs, false); // non seguire il link finale
  function parentOf(segs) { return getNode(segs.slice(0, -1)); }
  function pathStr(segs) { return "/" + segs.join("/"); }
  function displayPath(segs) {
    const p = pathStr(segs);
    const home = curUser().home;
    if (p === home) return "~";
    if (p.startsWith(home + "/")) return "~" + p.slice(home.length);
    return p === "/" ? "/" : p;
  }

  /* ---------- Permessi ---------- */
  function perm(node) {
    if (isRoot()) return { r: true, w: true, x: true };
    const u = curUser(); const me = curName();
    let shift;
    if (node.owner === me) shift = 6;
    else if (node.group && inGroup(u, node.group)) shift = 3;
    else shift = 0;
    const b = (node.mode >> shift) & 7;
    return { r: !!(b & 4), w: !!(b & 2), x: !!(b & 1) };
  }

  /* ============================================================
     2. Output del terminale
     ============================================================ */
  const screen = $("screen"), cmdEl = $("cmd"), promptEl = $("prompt");

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function printRaw(html, cls) {
    const div = document.createElement("div");
    div.className = "term-line" + (cls ? " " + cls : "");
    div.innerHTML = html;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }
  function print(text, cls) {
    const lines = String(text).split("\n");
    // togli l'ultima riga vuota dovuta al \n finale
    if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
    lines.forEach((l) => printRaw(esc(l) || "&nbsp;", cls));
  }
  function promptHTML() {
    const u = curUser();
    const cls = u.uid === 0 ? "ps-user root" : "ps-user";
    const ch = u.uid === 0 ? "#" : "$";
    return `<span class="${cls}">${curName()}</span><span class="ps-host">@${HOST}</span>:` +
           `<span class="ps-path">${esc(displayPath(cwd))}</span><span class="ps-char">${ch} </span>`;
  }
  function refreshPrompt() { promptEl.innerHTML = promptHTML(); }
  function echoCommand(line) { printRaw(`<span class="ps">${promptHTML()}</span>${esc(line)}`, "cmd"); }

  /* ============================================================
     3. Parser (pipe + redirezione + tokenizzazione)
     ============================================================ */
  function tokenize(str) {
    const out = []; let cur = "", q = null;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (q) { if (c === q) q = null; else cur += c; }
      else if (c === '"' || c === "'") q = c;
      else if (c === " " || c === "\t") { if (cur !== "") { out.push(cur); cur = ""; } }
      else cur += c;
    }
    if (cur !== "") out.push(cur);
    return out;
  }
  function splitPipes(str) {
    // divide su | non quotato
    const segs = []; let cur = "", q = null;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (q) { cur += c; if (c === q) q = null; }
      else if (c === '"' || c === "'") { cur += c; q = c; }
      else if (c === "|") { segs.push(cur); cur = ""; }
      else cur += c;
    }
    segs.push(cur);
    return segs.map((s) => s.trim());
  }
  function extractRedirect(tokens) {
    let redir = null;
    const args = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === ">" || tokens[i] === ">>") {
        redir = { append: tokens[i] === ">>", file: tokens[i + 1] }; i++;
      } else args.push(tokens[i]);
    }
    return { args, redir };
  }

  /* --- tokenizzazione che ricorda se un token era tra virgolette --- */
  function tokenizeQ(str) {
    const out = []; let cur = "", q = null, quoted = false, has = false;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (q) { if (c === q) q = null; else cur += c; }
      else if (c === '"' || c === "'") { q = c; quoted = true; has = true; }
      else if (c === " " || c === "\t") { if (has) { out.push({ v: cur, q: quoted }); cur = ""; quoted = false; has = false; } }
      else { cur += c; has = true; }
    }
    if (has) out.push({ v: cur, q: quoted });
    return out;
  }

  /* --- espansione delle parentesi graffe: {a,b,c} e {1..5}/{a..e} --- */
  function splitTopComma(body) {
    const out = []; let cur = "", depth = 0;
    for (const c of body) {
      if (c === "{") depth++; else if (c === "}") depth--;
      if (c === "," && depth === 0) { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur); return out;
  }
  function rangeExpand(a, b) {
    const out = [];
    if (/^-?\d+$/.test(a) && /^-?\d+$/.test(b)) {
      let x = +a, y = +b, step = x <= y ? 1 : -1;
      for (let i = x; ; i += step) { out.push(String(i)); if (i === y) break; }
    } else {
      let x = a.charCodeAt(0), y = b.charCodeAt(0), step = x <= y ? 1 : -1;
      for (let i = x; ; i += step) { out.push(String.fromCharCode(i)); if (i === y) break; }
    }
    return out;
  }
  function expandBraces(s) {
    const open = s.indexOf("{");
    if (open < 0) return [s];
    let depth = 0, close = -1;
    for (let i = open; i < s.length; i++) {
      if (s[i] === "{") depth++;
      else if (s[i] === "}") { depth--; if (depth === 0) { close = i; break; } }
    }
    if (close < 0) return [s];
    const pre = s.slice(0, open), body = s.slice(open + 1, close), post = s.slice(close + 1);
    const range = body.match(/^([A-Za-z])\.\.([A-Za-z])$/) || body.match(/^(-?\d+)\.\.(-?\d+)$/);
    let parts;
    if (range) parts = rangeExpand(range[1], range[2]);
    else if (body.indexOf(",") >= 0) parts = splitTopComma(body);
    else return expandBraces(post).map((x) => pre + "{" + body + "}" + x); // graffe letterali
    let out = [];
    parts.forEach((p) => { expandBraces(pre + p + post).forEach((x) => out.push(x)); });
    return out;
  }

  /* --- espansione dei caratteri jolly (glob): * ? [ ] --- */
  const hasGlob = (s) => /[*?\[]/.test(s);
  function globToRe(p) {
    let re = "^";
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (c === "*") re += "[^/]*";
      else if (c === "?") re += "[^/]";
      else if (c === "[") {
        let j = i + 1, cls = "[";
        if (p[j] === "!" || p[j] === "^") { cls += "^"; j++; }
        if (p[j] === "]") { cls += "\\]"; j++; }
        while (j < p.length && p[j] !== "]") { cls += "\\^$.|?*+(){}".indexOf(p[j]) >= 0 ? "\\" + p[j] : p[j]; j++; }
        cls += "]"; re += cls; i = j;
      } else re += c.replace(/[.+^${}()|\\]/g, "\\$&");
    }
    return new RegExp(re + "$");
  }
  function expandGlob(pattern) {
    if (!hasGlob(pattern)) return [pattern];
    const slash = pattern.lastIndexOf("/");
    const dirPart = slash >= 0 ? pattern.slice(0, slash + 1) : "";
    const base = slash >= 0 ? pattern.slice(slash + 1) : pattern;
    const dnode = getNode(resolve(dirPart || ".", cwd));
    if (!dnode || dnode.type !== "dir") return [pattern];
    let re; try { re = globToRe(base); } catch (e) { return [pattern]; }
    const matches = Object.keys(dnode.children)
      .filter((n) => (n[0] === "." ? base[0] === "." : true) && re.test(n))
      .sort();
    return matches.length ? matches.map((n) => dirPart + n) : [pattern];
  }

  /* --- analizza un segmento (un comando della pipeline): redirezioni + espansioni --- */
  function parseSegment(str) {
    const toks = tokenizeQ(str);
    let redir = null, errRedir = null, inFile = null;
    const argToks = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i]; let m;
      if (!t.q && (m = t.v.match(/^(>>|>&|&>|2>|>|<)(.*)$/))) {
        const op = m[1]; let f = m[2];
        if (f === "") { i++; f = toks[i] ? toks[i].v : ""; }
        if (op === ">") redir = { append: false, file: f };
        else if (op === ">>") redir = { append: true, file: f };
        else if (op === "<") inFile = f;
        else if (op === "2>") errRedir = { file: f };
        else redir = { append: false, file: f, both: true }; // >& oppure &>
      } else argToks.push(t);
    }
    const args = [];
    argToks.forEach((t) => {
      if (t.q) { args.push(t.v); return; } // token tra virgolette: nessuna espansione
      expandBraces(t.v).forEach((b) => expandGlob(b).forEach((g) => args.push(g)));
    });
    return { args, redir, errRedir, inFile };
  }

  /* ============================================================
     4. Comandi
     ============================================================ */
  const RESULT = (out, err, code) => ({ out: out || "", err: err || "", code: code || 0 });

  function permString(node) {
    const t = node.type === "dir" ? "d" : node.type === "link" ? "l" : "-";
    let s = "";
    for (let sh = 6; sh >= 0; sh -= 3) {
      const b = (node.mode >> sh) & 7;
      s += (b & 4 ? "r" : "-") + (b & 2 ? "w" : "-") + (b & 1 ? "x" : "-");
    }
    return t + s;
  }
  function sizeOf(node) {
    return node.type === "dir" ? 4096 : node.type === "link" ? node.target.length : node.content.length;
  }

  const COMMANDS = {
    help() {
      return RESULT(
        "Comandi principali:\n" +
        "  Filesystem : pwd, ls [-l -a -i -r -t -S], cd, mkdir, rmdir, touch, cp [-r], mv, rm [-r], tree\n" +
        "  Collegam.  : ln [-s] sorgente link   (hard link e link simbolici)\n" +
        "  Testo      : echo, cat, head, tail, more, sort [-n -r -u -k], wc [-l -w -c], cut [-c -f -d], diff\n" +
        "  Ricerca    : grep [-i -n -v -c] PATTERN,  find [percorso] -name NOME\n" +
        "  Redirez.   :  >  >>  <  2>  >&   |   tee [-a] file\n" +
        "  Jolly      : *  ?  [abc]  {a,b,c}  {1..5}   (espansi dalla shell)\n" +
        "  Processi   : ps [-e -f]   ·   comando &  (background)\n" +
        "  Editor     : vi FILE   (i inserisci, Esc, :w :q :wq :q!)\n" +
        "  Permessi   : chmod (u+x / 755), chown utente file, umask\n" +
        "  Utenti     : su -, sudo, useradd -m, passwd, userdel -r, groupadd, usermod -aG, groups, whoami, id\n" +
        "  Script     : crea un file con #!/bin/bash, poi  chmod +x  e  ./script.sh\n" +
        "  Scrivania  : date, cal, who, bc, banner\n" +
        "  Aiuto      : man COMANDO, history (!! e !n), clear, hostname, shutdown, help\n");
    },

    pwd() { return RESULT(pathStr(cwd) + "\n"); },

    whoami() { return RESULT(curName() + "\n"); },

    id() {
      const u = curUser();
      const gl = u.groups.map((g) => `${groups[g] ? groups[g].gid : "?"}(${g})`).join(",");
      return RESULT(`uid=${u.uid}(${u.name||curName()}) gid=${u.gid} gruppi=${gl}\n`);
    },

    hostname() { return RESULT(HOST + "\n"); },
    date() { return RESULT(new Date().toString() + "\n"); },
    clear() { screen.innerHTML = ""; return RESULT(); },

    echo(args) {
      let a = args.slice(); let nl = "\n";
      if (a[0] === "-n") { nl = ""; a = a.slice(1); }
      return RESULT(a.join(" ") + nl);
    },

    cd(args) {
      const target = args[0] || curUser().home;
      const segs = resolve(target, cwd);
      const node = getNode(segs);
      if (!node) return RESULT("", `cd: ${target}: File o directory non esistente\n`, 1);
      if (node.type !== "dir") return RESULT("", `cd: ${target}: Non è una directory\n`, 1);
      if (!perm(node).x) return RESULT("", `cd: ${target}: Permesso negato\n`, 1);
      cwd = segs;
      return RESULT();
    },

    ls(args) {
      const flags = {}; const paths = [];
      args.forEach((a) => { if (a[0] === "-" && a.length > 1) a.slice(1).split("").forEach((f) => flags[f] = true); else paths.push(a); });
      if (!paths.length) paths.push(".");
      const sep = (outToPipe || flags.i || flags.l) ? "\n" : "  ";

      const nameOf = (nm, node) => node.type === "dir" ? nm + "/" :
        node.type === "link" ? nm + " -> " + node.target : nm;
      const fmt = (nm, node) => {
        if (flags.l) {
          const dt = new Date(node.mtime);
          const date = dt.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) + " " + dt.toTimeString().slice(0, 5);
          const ino = flags.i ? String(node.ino).padStart(7) + " " : "";
          return `${ino}${permString(node)} ${node.links} ${node.owner} ${node.group} ${String(sizeOf(node)).padStart(5)} ${date} ${nameOf(nm, node)}`;
        }
        return (flags.i ? node.ino + " " : "") + nameOf(nm, node);
      };
      const sortPairs = (pairs) => {
        if (flags.t) pairs.sort((a, b) => b.node.mtime - a.node.mtime);
        else if (flags.S) pairs.sort((a, b) => sizeOf(b.node) - sizeOf(a.node));
        else pairs.sort((a, b) => a.name.localeCompare(b.name));
        if (flags.r) pairs.reverse();
        return pairs;
      };

      // separa gli argomenti in file (mostrati singolarmente) e directory (di cui si elenca il contenuto)
      const filePairs = []; const dirTargets = []; let err = "";
      paths.forEach((p) => {
        const node = lstat(resolve(p, cwd));
        if (!node) { err += `ls: ${p}: File o directory non esistente\n`; return; }
        if (node.type === "dir") dirTargets.push({ path: p, node });
        else filePairs.push({ name: p, node }); // mostra il percorso così come scritto
      });

      const blocks = [];
      if (filePairs.length) blocks.push(sortPairs(filePairs).map((fp) => fmt(fp.name, fp.node)).join(sep));
      const multi = dirTargets.length + (filePairs.length ? 1 : 0) > 1;
      dirTargets.forEach((dt) => {
        if (!perm(dt.node).r) { err += `ls: ${dt.path}: Permesso negato\n`; return; }
        let pairs = Object.keys(dt.node.children).map((k) => ({ name: k, node: dt.node.children[k] }));
        if (!flags.a) pairs = pairs.filter((pp) => pp.name[0] !== ".");
        const body = sortPairs(pairs).map((pp) => fmt(pp.name, pp.node)).join(sep);
        blocks.push((multi ? dt.path + ":\n" : "") + body);
      });

      const out = blocks.filter((b) => b !== "").join("\n\n");
      return RESULT(out ? out + "\n" : "", err, err ? 1 : 0);
    },

    mkdir(args) {
      if (!args.length) return RESULT("", "mkdir: manca l'operando\n", 1);
      let err = "";
      args.forEach((a) => {
        const segs = resolve(a, cwd); const parent = parentOf(segs);
        if (!parent || parent.type !== "dir") { err += `mkdir: ${a}: percorso non valido\n`; return; }
        if (parent.children[segs[segs.length - 1]]) { err += `mkdir: ${a}: File già esistente\n`; return; }
        if (!perm(parent).w) { err += `mkdir: ${a}: Permesso negato\n`; return; }
        const u = curUser();
        parent.children[segs[segs.length - 1]] = dir(segs[segs.length - 1], {}, dirMode(), u.name || curName(), curName());
        parent.mtime = now();
      });
      return RESULT("", err, err ? 1 : 0);
    },

    touch(args) {
      if (!args.length) return RESULT("", "touch: manca l'operando\n", 1);
      let err = "";
      args.forEach((a) => {
        const segs = resolve(a, cwd); const node = getNode(segs);
        if (node) { node.mtime = now(); return; }
        const parent = parentOf(segs);
        if (!parent || parent.type !== "dir") { err += `touch: ${a}: percorso non valido\n`; return; }
        if (!perm(parent).w) { err += `touch: ${a}: Permesso negato\n`; return; }
        parent.children[segs[segs.length - 1]] = file(segs[segs.length - 1], "", fileMode(), curName(), curName());
        parent.mtime = now();
      });
      return RESULT("", err, err ? 1 : 0);
    },

    rm(args) {
      const rec = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
      const targets = args.filter((a) => a[0] !== "-");
      if (!targets.length) return RESULT("", "rm: manca l'operando\n", 1);
      let err = "";
      targets.forEach((a) => {
        const segs = resolve(a, cwd); const node = lstat(segs); const parent = parentOf(segs);
        if (!node) { err += `rm: ${a}: File o directory non esistente\n`; return; }
        if (node.type === "dir" && !rec) { err += `rm: ${a}: è una directory (usa rm -r)\n`; return; }
        if (!perm(parent).w) { err += `rm: ${a}: Permesso negato\n`; return; }
        if (node.links > 1) node.links--; // hard link: scende il contatore, il file resta
        delete parent.children[segs[segs.length - 1]];
        parent.mtime = now();
      });
      return RESULT("", err, err ? 1 : 0);
    },

    cp(args) {
      const rec = args.some((x) => /^-[rR]/.test(x) || x === "-rf" || x === "-fr");
      const a = args.filter((x) => x[0] !== "-");
      if (a.length < 2) return RESULT("", "cp: servono sorgente e destinazione\n", 1);
      const src = getNode(resolve(a[0], cwd));
      if (!src) return RESULT("", `cp: ${a[0]}: File o directory non esistente\n`, 1);
      if (src.type === "dir" && !rec) return RESULT("", `cp: ${a[0]}: è una directory (usa cp -r)\n`, 1);
      if (!perm(src).r) return RESULT("", `cp: ${a[0]}: Permesso negato\n`, 1);
      return place(src, a[1], "cp");
    },

    mv(args) {
      const a = args.filter((x) => x[0] !== "-");
      if (a.length < 2) return RESULT("", "mv: servono sorgente e destinazione\n", 1);
      const segs = resolve(a[0], cwd); const src = getNode(segs); const parent = parentOf(segs);
      if (!src) return RESULT("", `mv: ${a[0]}: File o directory non esistente\n`, 1);
      if (!perm(parent).w) return RESULT("", `mv: ${a[0]}: Permesso negato\n`, 1);
      const res = place(src, a[1], "mv");
      if (res.code === 0) { delete parent.children[segs[segs.length - 1]]; parent.mtime = now(); }
      return res;
    },

    cat(args) {
      const files = args.filter((a) => a[0] !== "-");
      if (!files.length) return RESULT("", "", 0); // gestito a parte (cat > / stdin)
      let out = "", err = "";
      files.forEach((a) => {
        const node = getNode(resolve(a, cwd));
        if (!node) { err += `cat: ${a}: File o directory non esistente\n`; return; }
        if (node.type === "dir") { err += `cat: ${a}: è una directory\n`; return; }
        if (!perm(node).r) { err += `cat: ${a}: Permesso negato\n`; return; }
        out += node.content;
      });
      return RESULT(out, err, err ? 1 : 0);
    },

    head(args, stdin) { return headTail(args, stdin, true); },
    tail(args, stdin) { return headTail(args, stdin, false); },

    grep(args, stdin) {
      const flags = {}; const rest = [];
      args.forEach((a) => { if (a[0] === "-" && a.length > 1 && !/[0-9]/.test(a[1])) a.slice(1).split("").forEach((f) => flags[f] = true); else rest.push(a); });
      const pattern = rest.shift();
      if (pattern == null) return RESULT("", "grep: manca il pattern\n", 1);
      let re;
      try { re = new RegExp(pattern, flags.i ? "i" : ""); }
      catch (e) { return RESULT("", `grep: espressione regolare non valida: ${pattern}\n`, 1); }

      let text = "", err = "";
      if (rest.length) {
        rest.forEach((a) => {
          const node = getNode(resolve(a, cwd));
          if (!node || node.type === "dir") { err += `grep: ${a}: File non leggibile\n`; return; }
          text += node.content;
        });
      } else text = stdin || "";

      const lines = text.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      const out = []; let cnt = 0;
      lines.forEach((l, idx) => {
        if (re.test(l) !== !!flags.v) { cnt++; out.push(flags.n ? `${idx + 1}:${l}` : l); }
      });
      if (flags.c) return RESULT(cnt + "\n", err, 0);
      return RESULT(out.length ? out.join("\n") + "\n" : "", err, 0);
    },

    chmod(args) {
      const a = args.filter((x) => x[0] !== "-" || /^[ugoa]/.test(x));
      if (a.length < 2) return RESULT("", "chmod: uso: chmod MODO file\n", 1);
      const mode = a[0]; const node = getNode(resolve(a[1], cwd));
      if (!node) return RESULT("", `chmod: ${a[1]}: File non esistente\n`, 1);
      if (!isRoot() && node.owner !== curName()) return RESULT("", `chmod: ${a[1]}: Operazione non permessa\n`, 1);
      if (/^[0-7]{3}$/.test(mode)) { node.mode = parseInt(mode, 8); return RESULT(); }
      const m = mode.match(/^([ugoa]*)([+\-=])([rwx]+)$/);
      if (!m) return RESULT("", `chmod: modo non valido: ${mode}\n`, 1);
      const who = (m[1] === "" || m[1].includes("a")) ? "ugo" : m[1]; // senza chi = tutti
      const bits = (m[3].includes("r") ? 4 : 0) | (m[3].includes("w") ? 2 : 0) | (m[3].includes("x") ? 1 : 0);
      const shiftFor = (c) => c === "u" ? 6 : c === "g" ? 3 : 0;
      who.split("").forEach((c) => {
        const sh = shiftFor(c);
        if (m[2] === "+") node.mode |= bits << sh;
        else if (m[2] === "-") node.mode &= ~(bits << sh);
        else node.mode = (node.mode & ~(7 << sh)) | (bits << sh);
      });
      return RESULT();
    },

    chown(args) {
      const a = args.filter((x) => x[0] !== "-");
      if (a.length < 2) return RESULT("", "chown: uso: chown utente file\n", 1);
      if (!isRoot()) return RESULT("", "chown: Operazione non permessa (serve root)\n", 1);
      const owner = a[0].split(":")[0]; const grp = a[0].split(":")[1];
      const node = getNode(resolve(a[1], cwd));
      if (!node) return RESULT("", `chown: ${a[1]}: File non esistente\n`, 1);
      if (!users[owner]) return RESULT("", `chown: utente '${owner}' inesistente\n`, 1);
      node.owner = owner; if (grp) node.group = grp;
      return RESULT();
    },

    su(args) {
      const target = args.filter((x) => x[0] !== "-")[0] || "root";
      if (!users[target]) return RESULT("", `su: utente ${target} inesistente\n`, 1);
      userStack.push(target);
      cwd = users[target].home.split("/").filter(Boolean);
      return RESULT("", "", 0);
    },

    exit() {
      if (userStack.length > 1) { userStack.pop(); cwd = curUser().home.split("/").filter(Boolean); return RESULT(); }
      return RESULT("", "logout: questa è la shell iniziale.\n", 0);
    },

    sudo(args) {
      if (!args.length) return RESULT("", "uso: sudo COMANDO\n", 1);
      if (!isRoot() && !inGroup(curUser(), "sudo")) return RESULT("", `${curName()} non è nel file sudoers.\n`, 1);
      userStack.push("root");
      const res = runSimple(args);
      userStack.pop();
      return res;
    },

    useradd(args) {
      if (!isRoot()) return RESULT("", "useradd: Operazione non permessa (serve root)\n", 1);
      const a = []; let shell = "/bin/bash", home = null, mk = false;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-m") mk = true;
        else if (args[i] === "-s") shell = args[++i];
        else if (args[i] === "-d") home = args[++i];
        else a.push(args[i]);
      }
      const name = a[0];
      if (!name) return RESULT("", "useradd: manca il nome utente\n", 1);
      if (users[name]) return RESULT("", `useradd: l'utente '${name}' esiste già\n`, 1);
      const uid = Math.max(...Object.values(users).map((u) => u.uid), 1000) + 1;
      home = home || `/home/${name}`;
      users[name] = { uid, gid: uid, home, shell, pass: "", groups: [name] };
      groups[name] = { gid: uid, members: [name] };
      if (mk) {
        const seg = home.split("/").filter(Boolean); const parent = getNode(seg.slice(0, -1));
        if (parent) { parent.children[seg[seg.length - 1]] = dir(seg[seg.length - 1], {}, 0o755, name, name); }
      }
      syncEtc();
      return RESULT();
    },

    userdel(args) {
      if (!isRoot()) return RESULT("", "userdel: Operazione non permessa (serve root)\n", 1);
      const rec = args.includes("-r");
      const name = args.filter((x) => x[0] !== "-")[0];
      if (!users[name]) return RESULT("", `userdel: l'utente '${name}' non esiste\n`, 1);
      if (rec) {
        const seg = users[name].home.split("/").filter(Boolean); const parent = getNode(seg.slice(0, -1));
        if (parent) delete parent.children[seg[seg.length - 1]];
      }
      delete users[name]; delete groups[name];
      syncEtc();
      return RESULT();
    },

    passwd(args) {
      const target = args.filter((x) => x[0] !== "-")[0] || curName();
      if (target !== curName() && !isRoot()) return RESULT("", "passwd: Operazione non permessa\n", 1);
      if (!users[target]) return RESULT("", `passwd: utente '${target}' inesistente\n`, 1);
      users[target].pass = "***";
      return RESULT(`passwd: password aggiornata per ${target}\n`, "", 0);
    },

    groupadd(args) {
      if (!isRoot()) return RESULT("", "groupadd: serve root\n", 1);
      const name = args.filter((x) => x[0] !== "-")[0];
      if (!name) return RESULT("", "groupadd: manca il nome\n", 1);
      if (groups[name]) return RESULT("", `groupadd: il gruppo '${name}' esiste già\n`, 1);
      const gid = Math.max(...Object.values(groups).map((g) => g.gid), 1000) + 1;
      groups[name] = { gid, members: [] }; syncEtc();
      return RESULT();
    },

    groupdel(args) {
      if (!isRoot()) return RESULT("", "groupdel: serve root\n", 1);
      const name = args.filter((x) => x[0] !== "-")[0];
      if (!groups[name]) return RESULT("", `groupdel: il gruppo '${name}' non esiste\n`, 1);
      delete groups[name]; syncEtc();
      return RESULT();
    },

    usermod(args) {
      if (!isRoot()) return RESULT("", "usermod: serve root\n", 1);
      let append = false, gList = null; const a = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-aG" || args[i] === "-Ga") { append = true; gList = args[++i]; }
        else if (args[i] === "-G") { gList = args[++i]; }
        else a.push(args[i]);
      }
      const name = a[0];
      if (!users[name]) return RESULT("", `usermod: utente '${name}' inesistente\n`, 1);
      if (gList) {
        gList.split(",").forEach((g) => {
          if (!groups[g]) return;
          if (users[name].groups.indexOf(g) < 0) users[name].groups.push(g);
          if (groups[g].members.indexOf(name) < 0) groups[g].members.push(name);
        });
        syncEtc();
      }
      return RESULT();
    },

    groups(args) {
      const name = args[0] || curName();
      if (!users[name]) return RESULT("", `groups: utente '${name}' inesistente\n`, 1);
      return RESULT(name + " : " + users[name].groups.join(" ") + "\n");
    },

    tree() {
      let out = ".\n";
      (function walk(node, prefix) {
        const keys = Object.keys(node.children).sort((a, b) => a.localeCompare(b));
        keys.forEach((name, i) => {
          const k = node.children[name];
          const last = i === keys.length - 1;
          out += prefix + (last ? "└── " : "├── ") + name + (k.type === "dir" ? "/" : "") + "\n";
          if (k.type === "dir") walk(k, prefix + (last ? "    " : "│   "));
        });
      })(getNode(cwd), "");
      return RESULT(out);
    },

    shutdown() { return RESULT("", "", 0, true); },

    vi(args) {
      const name = args.filter((x) => x[0] !== "-")[0];
      if (!name) return RESULT("", "vi: manca il nome del file\n", 1);
      openVi(name);
      return RESULT();
    },

    /* ---------- directory ---------- */
    rmdir(args) {
      const targets = args.filter((a) => a[0] !== "-");
      if (!targets.length) return RESULT("", "rmdir: manca l'operando\n", 1);
      let err = "";
      targets.forEach((a) => {
        const segs = resolve(a, cwd); const node = lstat(segs); const parent = parentOf(segs);
        if (!node) { err += `rmdir: ${a}: File o directory non esistente\n`; return; }
        if (node.type !== "dir") { err += `rmdir: ${a}: Non è una directory\n`; return; }
        if (Object.keys(node.children).length) { err += `rmdir: ${a}: La directory non è vuota\n`; return; }
        if (!perm(parent).w) { err += `rmdir: ${a}: Permesso negato\n`; return; }
        delete parent.children[segs[segs.length - 1]]; parent.mtime = now();
      });
      return RESULT("", err, err ? 1 : 0);
    },

    /* ---------- processi ---------- */
    ps(args) {
      const flags = args.join("").replace(/-/g, "");
      const everyone = flags.indexOf("e") >= 0;
      const full = flags.indexOf("f") >= 0;
      let list = everyone ? processes.slice()
        : processes.filter((p) => p.tty === "pts/0");
      list = list.concat([{ pid: 2310, ppid: 2145, user: curName(), tty: "pts/0",
        time: "00:00:00", stime: new Date().toTimeString().slice(0, 5),
        cmd: full ? "ps " + args.join(" ") : "ps" }]);
      let out;
      if (full) {
        out = "UID        PID  PPID  C STIME TTY          TIME CMD\n";
        list.forEach((p) => {
          out += `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${String(p.ppid).padStart(5)}  0 ${p.stime} ${p.tty.padEnd(8)} ${p.time} ${p.cmd}\n`;
        });
      } else {
        out = "  PID TTY          TIME CMD\n";
        list.forEach((p) => {
          out += `${String(p.pid).padStart(5)} ${p.tty.padEnd(8)} ${p.time} ${p.cmd.replace(/^-/, "").split(" ")[0]}\n`;
        });
      }
      return RESULT(out);
    },

    /* ---------- collegamenti ---------- */
    ln(args) {
      const sym = args.includes("-s");
      const a = args.filter((x) => x[0] !== "-");
      if (!a.length) return RESULT("", "ln: manca l'operando\n", 1);
      const target = a[0];
      let linkName = a[1] || target.split("/").pop();
      const destSegs = resolve(linkName, cwd);
      const destNode = lstat(destSegs);
      let parent, name;
      if (destNode && destNode.type === "dir") { parent = destNode; name = target.split("/").pop(); }
      else { parent = parentOf(destSegs); name = destSegs[destSegs.length - 1]; }
      if (!parent || parent.type !== "dir") return RESULT("", "ln: destinazione non valida\n", 1);
      if (parent.children[name]) return RESULT("", `ln: ${name}: File già esistente\n`, 1);
      if (!perm(parent).w) return RESULT("", `ln: ${name}: Permesso negato\n`, 1);
      if (sym) {
        parent.children[name] = symlink(name, target, curName(), curName());
      } else {
        const srcNode = getNode(resolve(target, cwd));
        if (!srcNode) return RESULT("", `ln: ${target}: File o directory non esistente\n`, 1);
        if (srcNode.type === "dir") return RESULT("", `ln: ${target}: gli hard link alle directory non sono permessi\n`, 1);
        srcNode.links++;                 // stesso i-number: sale il contatore
        parent.children[name] = srcNode; // riferimento allo STESSO oggetto
      }
      parent.mtime = now();
      return RESULT();
    },
    unlink(args) { return COMMANDS.rm(args.filter((x) => x[0] !== "-")); },

    /* ---------- ricerca ---------- */
    find(args) {
      let start = "."; let namePat = null; let typeF = null; let gotStart = false;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-name") namePat = args[++i];
        else if (args[i] === "-type") typeF = args[++i];
        else if (args[i][0] !== "-" && !gotStart) { start = args[i]; gotStart = true; }
      }
      const startNode = getNode(resolve(start, cwd));
      if (!startNode) return RESULT("", `find: '${start}': File o directory non esistente\n`, 1);
      let re = null;
      if (namePat != null) { try { re = globToRe(namePat); } catch (e) { re = null; } }
      const base = start === "." ? "." : start.replace(/\/+$/, "");
      const lastSeg = (d) => d.split("/").filter(Boolean).pop() || d;
      let out = "";
      (function walk(node, disp) {
        const nm = lastSeg(disp);
        const typeOk = !typeF || (typeF === "d" ? node.type === "dir" : typeF === "f" ? node.type === "file" : true);
        if ((!re || re.test(nm)) && typeOk) out += disp + "\n";
        if (node.type === "dir") {
          Object.keys(node.children).sort((a, b) => a.localeCompare(b))
            .forEach((k) => walk(node.children[k], disp === "/" ? "/" + k : disp + "/" + k));
        }
      })(startNode, base);
      return RESULT(out);
    },

    /* ---------- elaborazione testo ---------- */
    sort(args, stdin) {
      let numeric = false, rev = false, uniq = false, keyField = null;
      const files = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-n") numeric = true;
        else if (a === "-r") rev = true;
        else if (a === "-u") uniq = true;
        else if (a === "-k") keyField = parseInt(args[++i], 10) - 1;
        else if (/^-k\d+$/.test(a)) keyField = parseInt(a.slice(2), 10) - 1;
        else if (/^\+\d+$/.test(a)) keyField = parseInt(a.slice(1), 10); // vecchia sintassi: +1 = 2° campo
        else if (a[0] !== "-" || a === "-") files.push(a);
      }
      let text, err = "";
      if (files.length) { const r = catFiles(files, "sort"); text = r.text; err = r.err; }
      else text = stdin || "";
      let lines = text.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      const keyOf = (l) => { if (keyField == null) return l; const f = l.split(/\s+|\t/).filter((x) => x !== ""); return f[keyField] !== undefined ? f[keyField] : ""; };
      lines.sort((a, b) => numeric ? ((parseFloat(keyOf(a)) || 0) - (parseFloat(keyOf(b)) || 0)) : keyOf(a).localeCompare(keyOf(b)));
      if (rev) lines.reverse();
      if (uniq) lines = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
      return RESULT(lines.length ? lines.join("\n") + "\n" : "", err, err ? 1 : 0);
    },

    wc(args, stdin) {
      let cL = false, cW = false, cC = false; const files = [];
      args.forEach((a) => { if (a === "-l") cL = true; else if (a === "-w") cW = true; else if (a === "-c") cC = true; else if (a[0] !== "-") files.push(a); });
      const showAll = !(cL || cW || cC);
      const count = (txt) => ({ lines: (txt.match(/\n/g) || []).length, words: (txt.match(/\S+/g) || []).length, chars: txt.length });
      const fmt = (c, label) => {
        const parts = [];
        if (showAll || cL) parts.push(String(c.lines).padStart(3));
        if (showAll || cW) parts.push(String(c.words).padStart(3));
        if (showAll || cC) parts.push(String(c.chars).padStart(3));
        return parts.join(" ") + (label ? " " + label : "");
      };
      if (!files.length) return RESULT(fmt(count(stdin || ""), "") + "\n");
      let out = "", err = ""; const tot = { lines: 0, words: 0, chars: 0 };
      files.forEach((a) => {
        const n = getNode(resolve(a, cwd));
        if (!n || n.type === "dir") { err += `wc: ${a}: non leggibile\n`; return; }
        const c = count(n.content); tot.lines += c.lines; tot.words += c.words; tot.chars += c.chars;
        out += fmt(c, a) + "\n";
      });
      if (files.length > 1) out += fmt(tot, "totale") + "\n";
      return RESULT(out, err, err ? 1 : 0);
    },

    cut(args, stdin) {
      let mode = null, list = null, delim = "\t"; const files = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-c") { mode = "c"; list = args[++i]; }
        else if (a.slice(0, 2) === "-c") { mode = "c"; list = a.slice(2); }
        else if (a === "-f") { mode = "f"; list = args[++i]; }
        else if (a.slice(0, 2) === "-f") { mode = "f"; list = a.slice(2); }
        else if (a === "-d") { delim = args[++i]; }
        else if (a.slice(0, 2) === "-d") { delim = a.slice(2); }
        else if (a[0] !== "-") files.push(a);
      }
      if (!mode || list == null) return RESULT("", "cut: specifica -c o -f con una lista (es. -f1,3)\n", 1);
      const ranges = list.split(",").map((part) => {
        const m = part.match(/^(\d+)?-(\d+)?$/);
        if (m) return { a: m[1] ? +m[1] : 1, b: m[2] ? +m[2] : Infinity };
        return { a: +part, b: +part };
      });
      const inRange = (i) => ranges.some((r) => i >= r.a && i <= r.b);
      const pick = (line) => {
        if (mode === "c") { let s = ""; for (let i = 1; i <= line.length; i++) if (inRange(i)) s += line[i - 1]; return s; }
        if (line.indexOf(delim) < 0) return line; // riga senza delimitatore: intera
        const fields = line.split(delim); const chosen = [];
        for (let i = 1; i <= fields.length; i++) if (inRange(i)) chosen.push(fields[i - 1]);
        return chosen.join(delim);
      };
      let text, err = "";
      if (files.length) { const r = catFiles(files, "cut"); text = r.text; err = r.err; }
      else text = stdin || "";
      const trailing = text.endsWith("\n");
      const lines = text.split("\n"); if (trailing) lines.pop();
      const out = lines.map(pick).join("\n");
      return RESULT(out !== "" || lines.length ? out + "\n" : "", err, err ? 1 : 0);
    },

    diff(args) {
      const files = args.filter((a) => a[0] !== "-");
      if (files.length < 2) return RESULT("", "diff: servono due file\n", 1);
      const n1 = getNode(resolve(files[0], cwd)), n2 = getNode(resolve(files[1], cwd));
      if (!n1 || n1.type === "dir") return RESULT("", `diff: ${files[0]}: non leggibile\n`, 1);
      if (!n2 || n2.type === "dir") return RESULT("", `diff: ${files[1]}: non leggibile\n`, 1);
      const out = lcsDiff(splitLines(n1.content), splitLines(n2.content));
      return RESULT(out, "", out ? 1 : 0);
    },

    more(args, stdin) {
      const files = args.filter((a) => a[0] !== "-");
      if (!files.length) return RESULT(stdin || "");
      const r = catFiles(files, "more"); return RESULT(r.text, r.err, r.err ? 1 : 0);
    },

    tee(args, stdin) {
      const append = args.includes("-a");
      const files = args.filter((a) => a[0] !== "-");
      let err = "";
      files.forEach((f) => { const e = writeInto(f, stdin || "", append); if (e) err += e; });
      return RESULT(stdin || "", err, err ? 1 : 0);
    },

    /* ---------- permessi: umask ---------- */
    umask(args) {
      const a = args.filter((x) => x[0] !== "-");
      if (!a.length) return RESULT(umaskVal.toString(8).padStart(4, "0") + "\n");
      if (!/^[0-7]{1,4}$/.test(a[0])) return RESULT("", `umask: ${a[0]}: valore non valido\n`, 1);
      umaskVal = parseInt(a[0], 8);
      return RESULT();
    },

    /* ---------- scrivania ---------- */
    cal(args) {
      const nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
      const today = new Date();
      if (nums.length >= 2) return RESULT(calMonth(nums[0], nums[1]));
      if (nums.length === 1) return RESULT(calYear(nums[0]));
      return RESULT(calMonth(today.getMonth() + 1, today.getFullYear()));
    },
    who() { return RESULT("studente pts/0        2024-01-13 09:15 (:0)\n"); },
    bc(args, stdin) {
      const useL = args.includes("-l");
      const text = stdin != null ? stdin : "";
      if (!text.trim()) return RESULT("", 'bc: usala con una pipe o con <  (es.  echo "3+4" | bc)\n', 1);
      let out = "";
      text.split("\n").forEach((ln) => {
        const t = ln.trim();
        if (t === "" || /^(quit|exit)$/.test(t)) return;
        try { let v = evalMath(t); if (!useL && typeof v === "number") v = Math.trunc(v); out += v + "\n"; }
        catch (e) { out += "(errore di sintassi)\n"; }
      });
      return RESULT(out);
    },
    banner(args) {
      const txt = args.filter((x) => x[0] !== "-").join(" ") || "";
      if (!txt) return RESULT("", "banner: manca il testo\n", 1);
      return RESULT(bannerText(txt));
    },

    /* ---------- manuale e cronologia ---------- */
    man(args) {
      const a = args.filter((x) => x[0] !== "-");
      if (!a.length) return RESULT("", "Cosa vuoi consultare? Prova:  man ls\n", 1);
      const page = manPage(a[0]);
      if (!page) return RESULT("", `Nessuna voce di manuale per ${a[0]}\n`, 1);
      return RESULT(page);
    },
    info(args) { return COMMANDS.man(args); },
    history() {
      let out = "";
      history.forEach((h, i) => { out += String(i + 1).padStart(5) + "  " + h + "\n"; });
      return RESULT(out);
    },
  };
  COMMANDS.vim = COMMANDS.vi;
  COMMANDS.ll = (a) => COMMANDS.ls(["-l", ...a]);
  COMMANDS.less = COMMANDS.more;

  // clona un nodo (ricorsivo per le directory)
  function cloneNode(src, newName) {
    if (src.type === "dir") {
      const d = dir(newName, {}, src.mode, curName(), curName());
      Object.values(src.children).forEach((c) => { d.children[c.name] = cloneNode(c, c.name); });
      return d;
    }
    if (src.type === "link") return symlink(newName, src.target, curName(), curName());
    return file(newName, src.content, src.mode, curName(), curName());
  }
  // copia/sposta un nodo in destinazione (dir esistente o nuovo nome)
  function place(src, destPath, who) {
    const destSegs = resolve(destPath, cwd);
    const destNode = getNode(destSegs); let name = src.name; let parent;
    if (destNode && destNode.type === "dir") { parent = destNode; }
    else { parent = getNode(destSegs.slice(0, -1)); name = destSegs[destSegs.length - 1]; }
    if (!parent || parent.type !== "dir") return RESULT("", `${who}: destinazione non valida\n`, 1);
    if (!perm(parent).w) return RESULT("", `${who}: ${destPath}: Permesso negato\n`, 1);
    parent.children[name] = cloneNode(src, name); parent.mtime = now();
    return RESULT();
  }

  function headTail(args, stdin, isHead) {
    let n = 10; const rest = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n") n = parseInt(args[++i], 10) || 10;
      else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1), 10);
      else if (args[i][0] !== "-") rest.push(args[i]);
    }
    let text = "";
    if (rest.length) {
      const node = getNode(resolve(rest[0], cwd));
      if (!node || node.type === "dir") return RESULT("", `${isHead ? "head" : "tail"}: ${rest[0]}: non leggibile\n`, 1);
      if (!perm(node).r) return RESULT("", `${isHead ? "head" : "tail"}: ${rest[0]}: Permesso negato\n`, 1);
      text = node.content;
    } else text = stdin || "";
    const lines = text.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    const out = isHead ? lines.slice(0, n) : lines.slice(-n);
    return RESULT(out.length ? out.join("\n") + "\n" : "");
  }

  // legge e concatena più file; ritorna {text, err}
  function catFiles(files, name) {
    let text = "", err = "";
    files.forEach((a) => {
      const n = getNode(resolve(a, cwd));
      if (!n || n.type === "dir") { err += `${name}: ${a}: File non leggibile\n`; return; }
      if (!perm(n).r) { err += `${name}: ${a}: Permesso negato\n`; return; }
      text += n.content;
    });
    return { text, err };
  }
  // spezza in righe eliminando l'eventuale riga vuota finale
  function splitLines(c) {
    const l = c.split("\n"); if (l.length && l[l.length - 1] === "") l.pop(); return l;
  }

  /* --- diff: confronto tra due file basato sulla LCS (sottosequenza comune) --- */
  function lcsDiff(A, B) {
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    // ricostruisci gli hunk (sequenze di cancellazioni/aggiunte)
    const hunks = []; let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && A[i] === B[j]) { i++; j++; continue; }
      const del = [], add = []; const a0 = i + 1, b0 = j + 1;
      while (i < n && (j >= m || dp[i + 1][j] >= dp[i][j + 1]) && !(j < m && A[i] === B[j])) { del.push(A[i]); i++; if (j < m && i < n && A[i] === B[j]) break; }
      while (j < m && !(i < n && A[i] === B[j])) { add.push(B[j]); j++; }
      hunks.push({ a0, a1: i, b0, b1: j, del, add });
    }
    let out = "";
    hunks.forEach((h) => {
      const aRange = h.del.length ? (h.a0 === h.a1 ? h.a0 : h.a0 + "," + h.a1) : h.a1;
      const bRange = h.add.length ? (h.b0 === h.b1 ? h.b0 : h.b0 + "," + h.b1) : h.b1;
      const op = h.del.length && h.add.length ? "c" : h.del.length ? "d" : "a";
      out += aRange + op + bRange + "\n";
      h.del.forEach((l) => out += "< " + l + "\n");
      if (h.del.length && h.add.length) out += "---\n";
      h.add.forEach((l) => out += "> " + l + "\n");
    });
    return out;
  }

  /* --- bc: valutatore di espressioni aritmetiche (+ - * / % ^ e parentesi) --- */
  function evalMath(expr) {
    let p = 0; const s = expr;
    const ws = () => { while (p < s.length && /\s/.test(s[p])) p++; };
    function parseExpr() { let v = parseTerm(); ws(); while (s[p] === "+" || s[p] === "-") { const op = s[p++]; const r = parseTerm(); v = op === "+" ? v + r : v - r; ws(); } return v; }
    function parseTerm() { let v = parsePow(); ws(); while (s[p] === "*" || s[p] === "/" || s[p] === "%") { const op = s[p++]; const r = parsePow(); v = op === "*" ? v * r : op === "/" ? v / r : v % r; ws(); } return v; }
    function parsePow() { const b = parseFactor(); ws(); if (s[p] === "^") { p++; return Math.pow(b, parsePow()); } return b; }
    function parseFactor() {
      ws();
      if (s[p] === "(") { p++; const v = parseExpr(); ws(); if (s[p] === ")") p++; return v; }
      if (s[p] === "-") { p++; return -parseFactor(); }
      if (s[p] === "+") { p++; return parseFactor(); }
      const m = s.slice(p).match(/^\d+(\.\d+)?/);
      if (!m) throw new Error("sintassi");
      p += m[0].length; return parseFloat(m[0]);
    }
    const val = parseExpr(); ws();
    if (p < s.length) throw new Error("sintassi");
    return val;
  }

  /* --- cal: calendario di un mese / anno --- */
  const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  function calMonth(m, y) {
    if (m < 1 || m > 12) return `cal: ${m}: mese non valido\n`;
    const first = new Date(y, m - 1, 1).getDay(); // 0 = domenica
    const days = new Date(y, m, 0).getDate();
    const title = MESI[m - 1] + " " + y;
    let out = title.padStart(Math.floor((20 + title.length) / 2)).padEnd(20) + "\n";
    out += "do lu ma me gi ve sa\n";
    let row = "   ".repeat(first), col = first;
    for (let d = 1; d <= days; d++) {
      row += String(d).padStart(2) + " "; col++;
      if (col === 7) { out += row.replace(/\s+$/, "") + "\n"; row = ""; col = 0; }
    }
    if (row.trim()) out += row.replace(/\s+$/, "") + "\n";
    return out;
  }
  function calYear(y) {
    let out = ("" + y).padStart(11) + "\n\n";
    for (let m = 1; m <= 12; m++) out += calMonth(m, y) + "\n";
    return out;
  }

  /* --- banner: testo a caratteri grandi (font 5 righe) --- */
  const BANNER_FONT = {
    "A": ["╭─╮", "│ │", "├─┤", "│ │", "╵ ╵"], "B": ["┬─╮", "├─┤", "├─┤", "├─┤", "┴─╯"],
    "C": ["╭─╮", "│  ", "│  ", "│  ", "╰─╯"], "D": ["┬─╮", "│ │", "│ │", "│ │", "┴─╯"],
    "E": ["┬──", "├─ ", "├─ ", "│  ", "┴──"], "F": ["┬──", "├─ ", "├─ ", "│  ", "╵  "],
    "G": ["╭─╮", "│  ", "│─┐", "│ │", "╰─╯"], "H": ["╷ ╷", "│ │", "├─┤", "│ │", "╵ ╵"],
    "I": ["┬", "│", "│", "│", "┴"], "J": ["──┬", "  │", "  │", "╷ │", "╰─╯"],
    "K": ["╷ ╱", "│╱ ", "├─╮", "│ │", "╵ ╵"], "L": ["╷  ", "│  ", "│  ", "│  ", "┴──"],
    "M": ["╷╷╷╷", "││││", "││││", "││││", "╵╵╵╵"], "N": ["╷ ╷", "│╲│", "│ │", "│ │", "╵ ╵"],
    "O": ["╭─╮", "│ │", "│ │", "│ │", "╰─╯"], "P": ["┬─╮", "│ │", "├─╯", "│  ", "╵  "],
    "Q": ["╭─╮", "│ │", "│ │", "│╲│", "╰─╲"], "R": ["┬─╮", "│ │", "├─╯", "│╲ ", "╵ ╲"],
    "S": ["╭─╮", "│  ", "╰─╮", "  │", "╰─╯"], "T": ["┬┬┬", " │ ", " │ ", " │ ", " ┴ "],
    "U": ["╷ ╷", "│ │", "│ │", "│ │", "╰─╯"], "V": ["╷ ╷", "│ │", "│ │", "╲ ╱", " ╳ "],
    "W": ["╷╷╷╷", "││││", "││││", "││││", "╰╯╰╯"], "X": ["╲ ╱", " ╳ ", " ╳ ", "╱ ╲", "╵ ╵"],
    "Y": ["╲ ╱", " ╳ ", " │ ", " │ ", " ┴ "], "Z": ["───", "  ╱", " ╱ ", "╱  ", "───"],
    "0": ["╭─╮", "│ │", "│ │", "│ │", "╰─╯"], "1": [" ┐", " │", " │", " │", " ┴"],
    "2": ["╭─╮", "  │", "╭─╯", "│  ", "╰──"], "3": ["╭─╮", "  │", " ─┤", "  │", "╰─╯"],
    "4": ["╷ ╷", "│ │", "╰─┤", "  │", "  ╵"], "5": ["┬──", "│  ", "╰─╮", "  │", "╰─╯"],
    "6": ["╭─╮", "│  ", "├─╮", "│ │", "╰─╯"], "7": ["───", "  │", " ╱ ", " │ ", " ╵ "],
    "8": ["╭─╮", "│ │", "├─┤", "│ │", "╰─╯"], "9": ["╭─╮", "│ │", "╰─┤", "  │", "╰─╯"],
    " ": ["  ", "  ", "  ", "  ", "  "], "!": ["│", "│", "│", " ", "·"], "?": ["╭─╮", "  │", " ╱ ", "   ", " · "],
    ".": [" ", " ", " ", " ", "·"], "-": ["  ", "  ", "──", "  ", "  "],
  };
  function bannerText(txt) {
    const chars = txt.toUpperCase().split("");
    const rows = ["", "", "", "", ""];
    chars.forEach((ch) => {
      const g = BANNER_FONT[ch] || BANNER_FONT["?"];
      for (let r = 0; r < 5; r++) rows[r] += (g[r] || "") + "  ";
    });
    return rows.join("\n") + "\n";
  }

  /* --- man: pagine di manuale sintetiche (generate dalla tabella) --- */
  const MANDATA = {
    ls: ["ls [opzioni] [percorso]", "Elenca il contenuto di una directory. -l formato lungo, -a anche i nascosti, -i gli i-number, -t per data, -S per dimensione, -r ordine inverso."],
    cd: ["cd [percorso]", "Cambia la directory corrente. Senza argomenti torna alla home."],
    pwd: ["pwd", "Stampa il percorso assoluto della directory corrente."],
    cp: ["cp [-r] sorgente destinazione", "Copia file (o directory, con -r)."],
    mv: ["mv sorgente destinazione", "Sposta o rinomina un file o una directory."],
    rm: ["rm [-r] [-f] nome", "Elimina file; -r per le directory. Non c'è cestino."],
    grep: ["grep [opzioni] PATTERN file", "Stampa le righe che corrispondono all'espressione regolare. -i, -n, -v, -c, -l."],
    find: ["find [percorso] -name NOME", "Cerca file e directory nell'albero a partire dal percorso."],
    sort: ["sort [-n -r -u] [-k N] file", "Ordina le righe di un file."],
    wc: ["wc [-l -w -c] file", "Conta righe, parole e caratteri."],
    cut: ["cut -c LISTA | -f LISTA [-d DELIM] file", "Estrae colonne (caratteri) o campi dalle righe."],
    chmod: ["chmod MODO file", "Cambia i permessi (simbolico u+x oppure ottale 755)."],
    ps: ["ps [-e -f]", "Mostra i processi. -e tutti, -f formato completo."],
    ln: ["ln [-s] sorgente link", "Crea un collegamento: hard link, oppure simbolico con -s."],
    umask: ["umask [valore]", "Mostra o imposta la maschera dei permessi predefiniti."],
    tee: ["comando | tee [-a] file", "Copia lo standard input su file E sullo schermo."],
    bc: ["... | bc [-l]", "Calcolatrice. Legge espressioni dall'input."],
    cal: ["cal [mese] [anno]", "Mostra il calendario."],
  };
  function manPage(name) {
    const d = MANDATA[name];
    if (d) {
      return `${name.toUpperCase()}(1)\n\nSINTASSI\n    ${d[0]}\n\nDESCRIZIONE\n    ${d[1]}\n\n(guida completa con esempi sotto il terminale)\n`;
    }
    if (COMMANDS[name]) return `${name.toUpperCase()}(1)\n\n    Comando disponibile. Consulta la guida dettagliata sotto il terminale.\n`;
    return null;
  }

  /* ============================================================
     5. Esecuzione di una riga
     ============================================================ */
  // dispatch di un comando: builtin, oppure script/eseguibile con percorso
  function runCommand(cmd, args, stdin) {
    if (cmd === "bash" || cmd === "sh") {
      if (!args.length) return RESULT("", `${cmd}: specifica uno script da eseguire\n`, 1);
      return runScriptPath(args[0], false);
    }
    if (cmd.indexOf("/") >= 0 || cmd.slice(0, 2) === "./") return runScriptPath(cmd, true);
    if (!COMMANDS[cmd]) return RESULT("", `${cmd}: comando non trovato\n`, 127);
    return COMMANDS[cmd](args, stdin);
  }

  // esegue uno script (#!/bin/bash): ogni riga diventa un comando
  function runScriptPath(path, needX) {
    const node = getNode(resolve(path, cwd));
    if (!node) return RESULT("", `bash: ${path}: File o directory non esistente\n`, 127);
    if (node.type === "dir") return RESULT("", `bash: ${path}: è una directory\n`, 126);
    if (needX && !perm(node).x) return RESULT("", `bash: ${path}: Permesso negato (manca x: usa chmod +x)\n`, 126);
    node.content.split("\n").forEach((ln) => {
      const t = ln.trim();
      if (t && t[0] !== "#") execLine(ln); // salta righe vuote, shebang e commenti
    });
    return RESULT();
  }

  function runSimple(tokens) { // usato come fallback; tokens = array di stringhe
    return runCommand(tokens[0], tokens.slice(1), "");
  }

  // scrive content dentro un file (redirezione). Ritorna una stringa d'errore (vuota se ok).
  function writeInto(path, content, append) {
    const segs = resolve(path, cwd); let node = getNode(segs); const parent = parentOf(segs);
    if (!parent || parent.type !== "dir") return `redirezione: ${path}: percorso non valido\n`;
    if (!node) {
      if (!perm(parent).w) return `redirezione: ${path}: Permesso negato\n`;
      node = parent.children[segs[segs.length - 1]] = file(segs[segs.length - 1], "", fileMode(), curName(), curName());
    }
    if (node.type === "dir") return `redirezione: ${path}: è una directory\n`;
    if (!perm(node).w) return `redirezione: ${path}: Permesso negato\n`;
    node.content = (append ? node.content : "") + content; node.mtime = now();
    return "";
  }
  // compat: vecchia firma usata da endCapture
  function writeFile(path, content, append, res) {
    const e = writeInto(path, content, append);
    if (e) res.err += e; res.out = "";
  }

  function execLine(line) {
    const pipeline = splitPipes(line).filter((s) => s !== "");
    let stdin = "";
    let lastRes = RESULT();
    for (let i = 0; i < pipeline.length; i++) {
      const { args, redir, errRedir, inFile } = parseSegment(pipeline[i]);
      const cmd = args[0];
      if (!cmd) continue;

      // input da file con <  (solo per il primo comando della pipeline)
      let input = stdin;
      if (inFile) {
        const n = getNode(resolve(inFile, cwd));
        if (!n || n.type === "dir") { print(`bash: ${inFile}: File non leggibile`, "err"); return lastRes; }
        input = n.content;
      }

      const isLast = i === pipeline.length - 1;
      outToPipe = !isLast || !!redir; // output verso pipe/file: elenco su una riga per volta
      const res = runCommand(cmd, args.slice(1), input);
      outToPipe = false;

      // destinazioni di stdout/stderr
      if (redir && redir.both) {
        const e = writeInto(redir.file, res.out + res.err, redir.append);
        res.out = ""; res.err = "";
        if (e) print(e, "err");
      } else {
        if (errRedir) { const e = writeInto(errRedir.file, res.err, false); res.err = ""; if (e) print(e, "err"); }
        if (redir) { const e = writeInto(redir.file, res.out, redir.append); res.out = ""; if (e) print(e, "err"); }
      }

      if (res.err) print(res.err, "err");
      if (!redir) {
        if (isLast) { if (res.out) printOut(res.out); }
        else stdin = res.out;
      }
      lastRes = res;
    }
    return lastRes;
  }

  // stampa con colore per dir/eseguibili (per ls semplice)
  function printOut(text) {
    const lines = String(text).split("\n");
    if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
    lines.forEach((l) => printRaw(esc(l) || "&nbsp;"));
  }

  /* ============================================================
     6. Input, history, cat-capture
     ============================================================ */
  // espansione della history:  !!  !n  !prefisso
  function expandHistory(line) {
    const t = line.trim();
    if (t === "!!") return history.length ? history[history.length - 1] : null;
    let m;
    if ((m = t.match(/^!(\d+)$/))) { const h = history[+m[1] - 1]; return h != null ? h : null; }
    if ((m = t.match(/^!([^\d\s!].*)$/))) {
      for (let i = history.length - 1; i >= 0; i--) if (history[i].indexOf(m[1]) === 0) return history[i];
      return null;
    }
    return line;
  }

  function submit(rawLine) {
    // espansione della history prima dell'eco (come in bash)
    let line = rawLine;
    if (rawLine.trim()[0] === "!") {
      const ex = expandHistory(rawLine);
      if (ex == null) { echoCommand(rawLine); print(`bash: ${rawLine.trim()}: evento non trovato`, "err"); refreshPrompt(); return; }
      line = ex;
    }

    echoCommand(line);
    if (line.trim() !== "") { history.push(line); histIdx = history.length; }

    // esecuzione in background:  comando &
    let bg = false;
    const trimmed = line.trimEnd();
    if (trimmed.endsWith("&") && !trimmed.endsWith("&&")) { bg = true; line = trimmed.slice(0, -1).trim(); }

    // cat > file  /  cat >> file  (scrittura multilinea)
    const cr = parseSegment(line);
    if (cr.args[0] === "cat" && cr.args.length === 1 && cr.redir) {
      capture = { file: cr.redir.file, append: cr.redir.append, buf: [] };
      promptEl.innerHTML = `<span class="ps-char">&gt; </span>`;
      print("(scrittura multilinea — premi Ctrl+D per salvare)", "muted");
      return;
    }

    if (bg) {
      const pid = spawnBg(line);
      print(`[1] ${pid}`, "muted");
      execLine(line);
      print(`[1]+  Terminato            ${line}`, "muted");
      renderTree(); refreshPrompt(); return;
    }

    // shutdown
    const res = handleSpecial(line);
    if (res === "shutdown") { print("Il sistema si sta spegnendo...", "muted"); lockTerminal(); renderTree(); return; }

    renderTree();
    refreshPrompt();
  }

  // registra un processo fittizio (per il comando ps) e ne restituisce il PID
  function spawnBg(line) {
    const pid = Math.max.apply(null, processes.map((p) => p.pid)) + Math.floor(Math.random() * 50 + 3);
    processes.push({ pid, ppid: 2145, user: curName(), tty: "pts/0", time: "00:00:00",
      stime: new Date().toTimeString().slice(0, 5), cmd: line });
    return pid;
  }

  // gestisce comandi con effetti speciali (shutdown) e poi l'esecuzione normale
  function handleSpecial(line) {
    const tokens = tokenize(line.trim());
    if (tokens[0] === "shutdown") { return "shutdown"; }
    execLine(line);
    return null;
  }

  function lockTerminal() {
    cmdEl.disabled = true; cmdEl.placeholder = "sistema spento — premi reset";
  }

  function endCapture(save) {
    if (save) {
      const content = capture.buf.join("\n") + (capture.buf.length ? "\n" : "");
      const res = RESULT();
      writeFile(capture.file, content, capture.append, res);
      if (res.err) print(res.err, "err");
    }
    capture = null;
    renderTree();
    refreshPrompt();
  }

  cmdEl.addEventListener("keydown", (e) => {
    if (capture) {
      if (e.key === "Enter") { e.preventDefault(); const v = cmdEl.value; printRaw(esc(v) || "&nbsp;"); capture.buf.push(v); cmdEl.value = ""; }
      else if ((e.ctrlKey && e.key.toLowerCase() === "d")) { e.preventDefault(); cmdEl.value = ""; endCapture(true); }
      return;
    }
    if (e.key === "Enter") {
      const line = cmdEl.value; cmdEl.value = "";
      submit(line);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; cmdEl.value = history[histIdx]; moveCaretEnd(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; cmdEl.value = history[histIdx]; }
      else { histIdx = history.length; cmdEl.value = ""; }
    } else if (e.key === "Tab") {
      e.preventDefault(); tabComplete();
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault(); screen.innerHTML = "";
    }
  });
  function moveCaretEnd() { setTimeout(() => cmdEl.setSelectionRange(cmdEl.value.length, cmdEl.value.length), 0); }

  function tabComplete() {
    const parts = cmdEl.value.split(" ");
    const frag = parts[parts.length - 1];
    const node = getNode(cwd);
    if (!node) return;
    const matches = Object.keys(node.children).filter((n) => n.startsWith(frag));
    if (matches.length === 1) {
      const m = node.children[matches[0]];
      parts[parts.length - 1] = matches[0] + (m.type === "dir" ? "/" : "");
      cmdEl.value = parts.join(" ");
    } else if (matches.length > 1) {
      printRaw(promptHTML() + esc(cmdEl.value), "cmd");
      print(matches.join("  "), "muted");
    }
  }

  // click su screen → focus input
  screen.addEventListener("click", () => { if (!cmdEl.disabled) cmdEl.focus(); });

  /* ============================================================
     7. Sidebar filesystem
     ============================================================ */
  function renderTree() {
    const tree = $("tree");
    let html = "";
    const cwdPath = pathStr(cwd);
    (function walk(node, segs, depth) {
      const isCwd = pathStr(segs) === cwdPath;
      const pad = depth * 12 + 8;
      if (node === root) {
        html += `<div class="fs-node dir ${isCwd ? "cwd" : ""}" data-path="/" style="padding-left:${pad}px"><span class="fs-ico">▸</span>/</div>`;
      } else {
        const ico = node.type === "dir" ? "▸" : "·";
        const cls = node.type === "dir" ? "dir" : "file";
        html += `<div class="fs-node ${cls} ${isCwd ? "cwd" : ""}" data-path="${esc(pathStr(segs))}" style="padding-left:${pad}px">` +
                `<span class="fs-ico">${ico}</span>${esc(node.name)}${node.type === "dir" ? "/" : ""}</div>`;
      }
      if (node.type === "dir") {
        Object.keys(node.children).sort((a, b) => {
          const na = node.children[a], nb = node.children[b];
          if ((na.type === "dir") !== (nb.type === "dir")) return na.type === "dir" ? -1 : 1;
          return a.localeCompare(b);
        }).forEach((name) => walk(node.children[name], segs.concat(name), depth + 1));
      }
    })(root, [], 0);
    tree.innerHTML = html;
    $("fsUser").textContent = curName();
    $("termTitle").textContent = curName() + "@" + HOST;
  }

  $("tree").addEventListener("click", (e) => {
    const n = e.target.closest(".fs-node.dir");
    if (!n) return;
    const segs = n.dataset.path === "/" ? [] : n.dataset.path.split("/").filter(Boolean);
    const node = getNode(segs);
    if (node && node.type === "dir" && perm(node).x) {
      echoCommand("cd " + (n.dataset.path));
      cwd = segs; renderTree(); refreshPrompt(); cmdEl.focus();
    }
  });

  /* ============================================================
     8. Editor vi
     ============================================================ */
  const viEl = $("vi");
  function openVi(name) {
    const segs = resolve(name, cwd); let node = getNode(segs);
    if (node && node.type === "dir") { print(`vi: ${name}: è una directory`, "err"); return; }
    const exists = !!node;
    const content = exists ? node.content : "";
    viState = {
      segs, name, lines: content === "" ? [""] : content.replace(/\n$/, "").split("\n"),
      r: 0, c: 0, mode: "normal", ex: "", pending: "", yank: "", dirty: false, exists,
    };
    viEl.hidden = false;
    $("viFile").textContent = name + (exists ? "" : " [Nuovo file]");
    renderVi();
    document.addEventListener("keydown", viKey, true);
  }
  function closeVi() {
    viEl.hidden = true;
    document.removeEventListener("keydown", viKey, true);
    viState = null;
    refreshPrompt(); cmdEl.focus();
  }
  function renderVi() {
    const s = viState;
    let html = "";
    s.lines.forEach((line, i) => {
      let text;
      if (i === s.r) {
        const col = Math.min(s.c, line.length);
        const before = esc(line.slice(0, col));
        const curCh = col < line.length ? esc(line[col]) : "&nbsp;";
        const after = esc(line.slice(col + 1));
        const curCls = s.mode === "insert" ? "vi-cursor insert" : "vi-cursor";
        text = before + `<span class="${curCls}">${curCh}</span>` + after;
      } else text = esc(line) || "&nbsp;";
      html += `<div class="vi-row"><span class="vi-gutter">${i + 1}</span><span class="vi-text">${text}</span></div>`;
    });
    $("viScreen").innerHTML = html;
    const modeEl = $("viMode");
    modeEl.className = "vi-mode" + (s.mode === "insert" ? " insert" : s.mode === "ex" ? " ex" : "");
    modeEl.textContent = s.mode === "insert" ? "-- INSERIMENTO --" : s.mode === "ex" ? "EX" : "NORMALE";
    $("viCmd").textContent = s.mode === "ex" ? ":" + s.ex : (s.dirty ? "[modificato]" : "");
  }

  function viKey(e) {
    const s = viState; if (!s) return;
    e.preventDefault(); e.stopPropagation();
    const line = s.lines[s.r];

    if (s.mode === "insert") {
      if (e.key === "Escape") { s.mode = "normal"; if (s.c > 0) s.c--; }
      else if (e.key === "Enter") {
        const rest = line.slice(s.c); s.lines[s.r] = line.slice(0, s.c);
        s.lines.splice(s.r + 1, 0, rest); s.r++; s.c = 0; s.dirty = true;
      } else if (e.key === "Backspace") {
        if (s.c > 0) { s.lines[s.r] = line.slice(0, s.c - 1) + line.slice(s.c); s.c--; }
        else if (s.r > 0) { const prev = s.lines[s.r - 1]; s.c = prev.length; s.lines[s.r - 1] = prev + line; s.lines.splice(s.r, 1); s.r--; }
        s.dirty = true;
      } else if (e.key.length === 1) {
        s.lines[s.r] = line.slice(0, s.c) + e.key + line.slice(s.c); s.c++; s.dirty = true;
      }
      return renderVi();
    }

    if (s.mode === "ex") {
      if (e.key === "Enter") { runEx(s.ex); s.ex = ""; if (s) s.mode = "normal"; }
      else if (e.key === "Escape") { s.ex = ""; s.mode = "normal"; }
      else if (e.key === "Backspace") { s.ex = s.ex.slice(0, -1); }
      else if (e.key.length === 1) s.ex += e.key;
      return viState && renderVi();
    }

    // modalità normale
    const k = e.key;
    if (s.pending === "d") { s.pending = ""; if (k === "d") { s.yank = s.lines[s.r]; s.lines.splice(s.r, 1); if (!s.lines.length) s.lines = [""]; if (s.r >= s.lines.length) s.r = s.lines.length - 1; s.dirty = true; } return renderVi(); }
    if (s.pending === "y") { s.pending = ""; if (k === "y") { s.yank = s.lines[s.r]; } return renderVi(); }
    if (s.pending === "c") { s.pending = ""; if (k === "w") { s.lines[s.r] = line.slice(0, s.c) + line.slice(s.c).replace(/^\S*/, ""); s.mode = "insert"; s.dirty = true; } return renderVi(); }
    if (s.pending === "g") { s.pending = ""; if (k === "g") { s.r = 0; s.c = 0; } return renderVi(); }

    if (k === "h" || k === "ArrowLeft") { if (s.c > 0) s.c--; }
    else if (k === "l" || k === "ArrowRight") { if (s.c < line.length) s.c++; }
    else if (k === "k" || k === "ArrowUp") { if (s.r > 0) { s.r--; s.c = Math.min(s.c, s.lines[s.r].length); } }
    else if (k === "j" || k === "ArrowDown") { if (s.r < s.lines.length - 1) { s.r++; s.c = Math.min(s.c, s.lines[s.r].length); } }
    else if (k === "0") s.c = 0;
    else if (k === "$") s.c = Math.max(0, line.length - 1);
    else if (k === "G") { s.r = s.lines.length - 1; s.c = 0; }
    else if (k === "i") s.mode = "insert";
    else if (k === "a") { if (line.length) s.c++; s.mode = "insert"; }
    else if (k === "A") { s.c = line.length; s.mode = "insert"; }
    else if (k === "o") { s.lines.splice(s.r + 1, 0, ""); s.r++; s.c = 0; s.mode = "insert"; s.dirty = true; }
    else if (k === "O") { s.lines.splice(s.r, 0, ""); s.c = 0; s.mode = "insert"; s.dirty = true; }
    else if (k === "x") { if (line.length) { s.lines[s.r] = line.slice(0, s.c) + line.slice(s.c + 1); if (s.c >= s.lines[s.r].length && s.c > 0) s.c--; s.dirty = true; } }
    else if (k === "p") { if (s.yank) { s.lines.splice(s.r + 1, 0, s.yank); s.r++; s.dirty = true; } }
    else if (k === "d" || k === "y" || k === "c" || k === "g") s.pending = k;
    else if (k === ":") { s.mode = "ex"; s.ex = ""; }
    renderVi();
  }

  function runEx(cmd) {
    const s = viState;
    const save = () => { let node = getNode(s.segs); const parent = parentOf(s.segs);
      const content = s.lines.join("\n") + "\n";
      if (!node) { if (!parent || !perm(parent).w) { flashEx("Permesso negato"); return false; } node = parent.children[s.segs[s.segs.length - 1]] = file(s.segs[s.segs.length - 1], "", fileMode(), curName(), curName()); }
      if (!perm(node).w) { flashEx("Permesso negato"); return false; }
      node.content = content; node.mtime = now(); s.dirty = false; return true;
    };
    if (cmd === "w") { if (save()) { print(`"${s.name}" salvato`, "muted"); renderTree(); } }
    else if (cmd === "q") { if (s.dirty) { flashEx("Modifiche non salvate! Usa :q! per forzare"); return; } closeVi(); }
    else if (cmd === "wq" || cmd === "x") { if (save()) { print(`"${s.name}" salvato`, "muted"); renderTree(); closeVi(); } }
    else if (cmd === "q!") { closeVi(); }
    else flashEx("comando :" + cmd + " non riconosciuto");
  }
  function flashEx(msg) { if (viState) { $("viCmd").textContent = msg; } }

  /* ============================================================
     9. Avvio
     ============================================================ */
  function boot() {
    buildSystem();
    cwd = ["home", "studente"];
    history = []; histIdx = 0; capture = null;
    screen.innerHTML = "";
    cmdEl.disabled = false; cmdEl.placeholder = "";
    print("Virtual Terminal — Lab di Simone Conca", "muted");
    print("Sistema simulato. Scrivi 'help' per i comandi, oppure clicca una cartella nell'albero a destra.", "muted");
    print("");
    refreshPrompt();
    renderTree();
    cmdEl.focus();
  }

  $("btnReset").addEventListener("click", () => { boot(); });
  $("btnHelp").addEventListener("click", () => { echoCommand("help"); print(COMMANDS.help().out); });

  // Hook usato dalla guida sotto al terminale: scrive un comando nell'input
  window.VT = {
    type(line) {
      if (cmdEl.disabled) boot();
      cmdEl.value = line;
      const term = document.querySelector(".terminal");
      if (term) term.scrollIntoView({ behavior: "smooth", block: "center" });
      cmdEl.focus();
    },
  };

  boot();
})();
