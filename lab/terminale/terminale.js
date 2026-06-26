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
  function file(name, content, mode, owner, group) {
    return { type: "file", name, content: content || "", mode: mode == null ? 0o644 : mode,
             owner: owner || "root", group: group || "root", mtime: now() };
  }
  function dir(name, children, mode, owner, group) {
    return { type: "dir", name, children: children || {}, mode: mode == null ? 0o755 : mode,
             owner: owner || "root", group: group || "root", mtime: now() };
  }

  let root, users, groups, userStack, history, histIdx, capture, viState;

  function buildSystem() {
    users = {
      root: { uid: 0, gid: 0, home: "/root", shell: "/bin/bash", pass: "root", groups: ["root"] },
      studente: { uid: 1000, gid: 1000, home: "/home/studente", shell: "/bin/bash", pass: "", groups: ["studente", "sudo"] },
    };
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
  function getNode(segs) {
    let node = root;
    for (const s of segs) {
      if (node.type !== "dir" || !node.children[s]) return null;
      node = node.children[s];
    }
    return node;
  }
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

  /* ============================================================
     4. Comandi
     ============================================================ */
  const RESULT = (out, err, code) => ({ out: out || "", err: err || "", code: code || 0 });

  function permString(node) {
    const t = node.type === "dir" ? "d" : "-";
    let s = "";
    for (let sh = 6; sh >= 0; sh -= 3) {
      const b = (node.mode >> sh) & 7;
      s += (b & 4 ? "r" : "-") + (b & 2 ? "w" : "-") + (b & 1 ? "x" : "-");
    }
    return t + s;
  }
  function sizeOf(node) { return node.type === "dir" ? 4096 : node.content.length; }

  const COMMANDS = {
    help() {
      return RESULT(
        "Comandi principali:\n" +
        "  Filesystem : pwd, ls [-l -a -r -t -S], cd, mkdir, touch, cp, mv, rm [-r], tree\n" +
        "  Testo      : echo, cat, head [-n N], tail [-n N],  >  >>  |\n" +
        "  Ricerca    : grep [-i -n -v] PATTERN file   (regex: ^ $ . [0-9] [^..] *)\n" +
        "  Editor     : vi FILE   (i inserisci, Esc, :w :q :wq :q!)\n" +
        "  Permessi   : chmod (u+x / 755), chown utente file\n" +
        "  Utenti     : su -, sudo, useradd -m, passwd, userdel -r, groupadd, usermod -aG, groups, whoami, id\n" +
        "  Sistema    : clear, date, hostname, shutdown, help\n");
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
      const targetSegs = resolve(paths[0] || ".", cwd);
      const node = getNode(targetSegs);
      if (!node) return RESULT("", `ls: ${paths[0]}: File o directory non esistente\n`, 1);

      let entries;
      if (node.type === "dir") {
        if (!perm(node).r) return RESULT("", `ls: ${paths[0] || "."}: Permesso negato\n`, 1);
        entries = Object.values(node.children);
        if (!flags.a) entries = entries.filter((e) => e.name[0] !== ".");
      } else entries = [node];

      if (flags.t) entries.sort((a, b) => b.mtime - a.mtime);
      else if (flags.S) entries.sort((a, b) => sizeOf(b) - sizeOf(a));
      else entries.sort((a, b) => a.name.localeCompare(b.name));
      if (flags.r) entries.reverse();

      if (flags.l) {
        let out = "";
        entries.forEach((e) => {
          const dt = new Date(e.mtime);
          const date = dt.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) +
            " " + dt.toTimeString().slice(0, 5);
          const nm = e.type === "dir" ? e.name + "/" : e.name;
          out += `${permString(e)} ${e.owner} ${e.group} ${String(sizeOf(e)).padStart(5)} ${date} ${nm}\n`;
        });
        return RESULT(out);
      }
      const names = entries.map((e) => e.type === "dir" ? e.name + "/" : e.name);
      return RESULT(names.join("  ") + (names.length ? "\n" : ""));
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
        parent.children[segs[segs.length - 1]] = dir(segs[segs.length - 1], {}, 0o755, u.name || curName(), curName());
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
        parent.children[segs[segs.length - 1]] = file(segs[segs.length - 1], "", 0o644, curName(), curName());
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
        const segs = resolve(a, cwd); const node = getNode(segs); const parent = parentOf(segs);
        if (!node) { err += `rm: ${a}: File o directory non esistente\n`; return; }
        if (node.type === "dir" && !rec) { err += `rm: ${a}: è una directory (usa rm -r)\n`; return; }
        if (!perm(parent).w) { err += `rm: ${a}: Permesso negato\n`; return; }
        delete parent.children[segs[segs.length - 1]];
        parent.mtime = now();
      });
      return RESULT("", err, err ? 1 : 0);
    },

    cp(args) {
      const a = args.filter((x) => x[0] !== "-");
      if (a.length < 2) return RESULT("", "cp: servono sorgente e destinazione\n", 1);
      const src = getNode(resolve(a[0], cwd));
      if (!src) return RESULT("", `cp: ${a[0]}: File o directory non esistente\n`, 1);
      if (src.type === "dir") return RESULT("", `cp: ${a[0]}: è una directory (non supportata)\n`, 1);
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
      const out = lines.filter((l) => re.test(l) !== !!flags.v)
        .map((l, i) => flags.n ? `${i + 1}:${l}` : l);
      return RESULT(out.length ? out.join("\n") + "\n" : "", err, 0);
    },

    chmod(args) {
      const a = args.filter((x) => x[0] !== "-" || /^[ugoa]/.test(x));
      if (a.length < 2) return RESULT("", "chmod: uso: chmod MODO file\n", 1);
      const mode = a[0]; const node = getNode(resolve(a[1], cwd));
      if (!node) return RESULT("", `chmod: ${a[1]}: File non esistente\n`, 1);
      if (!isRoot() && node.owner !== curName()) return RESULT("", `chmod: ${a[1]}: Operazione non permessa\n`, 1);
      if (/^[0-7]{3}$/.test(mode)) { node.mode = parseInt(mode, 8); return RESULT(); }
      const m = mode.match(/^([ugoa]+)([+\-=])([rwx]+)$/);
      if (!m) return RESULT("", `chmod: modo non valido: ${mode}\n`, 1);
      const who = m[1].includes("a") ? "ugo" : m[1];
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
        const kids = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));
        kids.forEach((k, i) => {
          const last = i === kids.length - 1;
          out += prefix + (last ? "└── " : "├── ") + k.name + (k.type === "dir" ? "/" : "") + "\n";
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
  };
  COMMANDS.vim = COMMANDS.vi;
  COMMANDS.ll = (a) => COMMANDS.ls(["-l", ...a]);

  // copia/sposta un nodo file in destinazione (dir o nuovo nome)
  function place(src, destPath, who) {
    const destSegs = resolve(destPath, cwd);
    let destNode = getNode(destSegs); let name = src.name; let parent;
    if (destNode && destNode.type === "dir") { parent = destNode; }
    else { parent = getNode(destSegs.slice(0, -1)); name = destSegs[destSegs.length - 1]; }
    if (!parent || parent.type !== "dir") return RESULT("", `${who}: destinazione non valida\n`, 1);
    if (!perm(parent).w) return RESULT("", `${who}: ${destPath}: Permesso negato\n`, 1);
    const copy = file(name, src.content, src.mode, curName(), curName());
    parent.children[name] = copy; parent.mtime = now();
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

  /* ============================================================
     5. Esecuzione di una riga
     ============================================================ */
  function runSimple(tokens) {
    const { args, redir } = extractRedirect(tokens);
    const cmd = args[0];
    if (!cmd) return RESULT();
    if (!COMMANDS[cmd]) return RESULT("", `${cmd}: comando non trovato\n`, 127);
    const res = COMMANDS[cmd](args.slice(1), "");
    if (redir) writeFile(redir.file, res.out, redir.append, res);
    return res;
  }

  function writeFile(path, content, append, res) {
    const segs = resolve(path, cwd); let node = getNode(segs); const parent = parentOf(segs);
    if (!parent || parent.type !== "dir") { res.err += `redirezione: percorso non valido\n`; return; }
    if (!node) {
      if (!perm(parent).w) { res.err += `redirezione: Permesso negato\n`; return; }
      node = parent.children[segs[segs.length - 1]] = file(segs[segs.length - 1], "", 0o644, curName(), curName());
    }
    if (!perm(node).w) { res.err += `redirezione: ${path}: Permesso negato\n`; return; }
    node.content = (append ? node.content : "") + content; node.mtime = now();
    res.out = ""; // l'output è finito nel file
  }

  function execLine(line) {
    const pipeline = splitPipes(line).filter((s) => s !== "");
    let stdin = "";
    let lastRes = RESULT();
    for (let i = 0; i < pipeline.length; i++) {
      const tokens = tokenize(pipeline[i]);
      const { args, redir } = extractRedirect(tokens);
      const cmd = args[0];
      if (!cmd) continue;
      if (!COMMANDS[cmd]) { print(`${cmd}: comando non trovato`, "err"); return; }
      const res = COMMANDS[cmd](args.slice(1), stdin);
      if (res.err) print(res.err, "err");
      const isLast = i === pipeline.length - 1;
      if (redir) { writeFile(redir.file, res.out, redir.append, res); if (res.err) print(res.err, "err"); }
      else if (isLast) { if (res.out) printOut(res.out); }
      else stdin = res.out;
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
  function submit(line) {
    echoCommand(line);
    if (line.trim() !== "") { history.push(line); histIdx = history.length; }

    // cat > file  /  cat >> file  (scrittura multilinea)
    const t = tokenize(line);
    const cr = extractRedirect(t);
    if (cr.args[0] === "cat" && cr.args.length === 1 && cr.redir) {
      capture = { file: cr.redir.file, append: cr.redir.append, buf: [] };
      promptEl.innerHTML = `<span class="ps-char">&gt; </span>`;
      print("(scrittura multilinea — premi Ctrl+D per salvare)", "muted");
      return;
    }

    // shutdown
    const res = handleSpecial(line);
    if (res === "shutdown") { print("Il sistema si sta spegnendo...", "muted"); lockTerminal(); renderTree(); return; }

    renderTree();
    refreshPrompt();
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
        Object.values(node.children).sort((a, b) => {
          if ((a.type === "dir") !== (b.type === "dir")) return a.type === "dir" ? -1 : 1;
          return a.name.localeCompare(b.name);
        }).forEach((k) => walk(k, segs.concat(k.name), depth + 1));
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
      if (!node) { if (!parent || !perm(parent).w) { flashEx("Permesso negato"); return false; } node = parent.children[s.segs[s.segs.length - 1]] = file(s.segs[s.segs.length - 1], "", 0o644, curName(), curName()); }
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
