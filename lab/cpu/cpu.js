/* ============================================================
   cpu.js — CPU & Assembly Visualizer
   Simulatore didattico a passi per due architetture:
   emu8086 (Intel x86, 16 bit) e MIPS (32 bit). Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ============================================================
     Definizione delle architetture
     ============================================================ */
  const ARCH = {
    emu8086: {
      title: "emu8086 · Intel x86 (16 bit)",
      comment: ";",
      bits: 16, mask: 0xFFFF, hexpad: 4,
      regs: ["AX", "BX", "CX", "DX", "SI", "DI", "BP", "SP"],
      flags: ["ZF", "SF", "CF", "OF"],
      pc: "IP",
      memCells: 8,
      reference: [
        ["MOV d, s", "copia s in d"],
        ["ADD d, s", "d = d + s"],
        ["SUB d, s", "d = d − s"],
        ["INC r / DEC r", "r = r ± 1"],
        ["MUL s", "AX = AX × s"],
        ["CMP a, b", "confronta (imposta i flag)"],
        ["JMP etic.", "salto incondizionato"],
        ["JE/JNE", "salta se uguale / diverso"],
        ["JG/JGE/JL/JLE", "salti con segno"],
        ["MOV r, [k]", "leggi dalla memoria"],
        ["MOV [k], r", "scrivi in memoria"],
        ["HLT", "ferma il programma"],
      ],
    },
    mips: {
      title: "MIPS (32 bit)",
      comment: "#",
      bits: 32, mask: 0xFFFFFFFF, hexpad: 8,
      regs: ["$zero", "$v0", "$a0", "$a1", "$t0", "$t1", "$t2", "$t3", "$s0", "$s1", "$s2", "$ra"],
      flags: [],
      pc: "PC",
      memCells: 8,
      reference: [
        ["li $d, n", "carica la costante n"],
        ["move $d, $s", "copia $s in $d"],
        ["add $d,$s,$t", "$d = $s + $t"],
        ["sub $d,$s,$t", "$d = $s − $t"],
        ["addi $d,$s,n", "$d = $s + n"],
        ["mul $d,$s,$t", "$d = $s × $t"],
        ["slt $d,$s,$t", "$d = ($s < $t) ? 1 : 0"],
        ["beq/bne", "salta se uguale / diverso"],
        ["j etic.", "salto incondizionato"],
        ["lw $t, n($b)", "leggi dalla memoria"],
        ["sw $t, n($b)", "scrivi in memoria"],
        ["$zero", "vale sempre 0"],
      ],
    },
  };

  /* ============================================================
     Programmi d'esempio
     ============================================================ */
  const EXAMPLES = {
    emu8086: [
      { label: "Somma 1..5", code:
"; somma i numeri da 1 a 5 in AX\n    MOV AX, 0      ; accumulatore\n    MOV CX, 5      ; contatore\nciclo:\n    ADD AX, CX     ; AX = AX + CX\n    DEC CX         ; CX = CX - 1\n    JNZ ciclo      ; ripeti finche' CX != 0\n    HLT" },
      { label: "Massimo tra due", code:
"; lascia in AX il maggiore tra AX e BX\n    MOV AX, 7\n    MOV BX, 12\n    CMP AX, BX\n    JGE fine       ; se AX >= BX, ok\n    MOV AX, BX     ; altrimenti AX = BX\nfine:\n    HLT" },
      { label: "Memoria", code:
"; salva e rileggi un valore in memoria\n    MOV AX, 25\n    MOV [0], AX    ; mem[0] = 25\n    MOV BX, [0]    ; BX = mem[0]\n    ADD BX, 5\n    MOV [1], BX    ; mem[1] = 30\n    HLT" },
    ],
    mips: [
      { label: "Somma 1..5", code:
"# somma i numeri da 1 a 5 in $t0\n    li $t0, 0          # accumulatore\n    li $t1, 5          # contatore\nciclo:\n    add $t0, $t0, $t1  # t0 = t0 + t1\n    addi $t1, $t1, -1  # t1 = t1 - 1\n    bne $t1, $zero, ciclo" },
      { label: "Massimo tra due", code:
"# lascia in $t0 il maggiore tra $t0 e $t1\n    li $t0, 7\n    li $t1, 12\n    slt $t2, $t0, $t1      # t2 = (t0 < t1)\n    beq $t2, $zero, fine   # se t0 >= t1, ok\n    move $t0, $t1          # altrimenti t0 = t1\nfine:" },
      { label: "Memoria", code:
"# salva e rileggi un valore in memoria\n    li $t0, 25\n    sw $t0, 0($zero)   # mem[0] = 25\n    lw $t1, 0($zero)   # t1 = mem[0]\n    addi $t1, $t1, 5\n    sw $t1, 4($zero)   # mem[1] = 30" },
    ],
  };

  /* ============================================================
     Stato
     ============================================================ */
  let arch = "emu8086";
  let A = ARCH[arch];
  let m = null;            // macchina
  let assembled = null;    // { program, labels }
  let dirty = true;        // l'editor è cambiato → riassemblare
  let runMode = false;     // true = mostra listing; false = textarea

  function freshMachine() {
    const regs = {};
    A.regs.forEach((r) => (regs[r] = 0));
    return { regs, flags: { ZF: 0, SF: 0, CF: 0, OF: 0 }, mem: new Array(A.memCells).fill(0),
             pc: 0, halted: false, steps: 0, error: null, changed: { regs: [], mem: [], flags: [] } };
  }

  /* ============================================================
     Parsing / assemblaggio
     ============================================================ */
  function assemble() {
    const src = $("editor").value;
    const cc = A.comment;
    const program = [], labels = {};
    src.split("\n").forEach((raw, i) => {
      let line = raw;
      const ci = line.indexOf(cc);
      if (ci >= 0) line = line.slice(0, ci);
      line = line.trim();
      if (!line) return;
      let lm;
      while ((lm = line.match(/^([A-Za-z_.$]\w*):\s*/))) {
        labels[lm[1].toLowerCase()] = program.length;
        line = line.slice(lm[0].length);
      }
      if (!line) return;
      const sp = line.search(/\s/);
      const op = (sp < 0 ? line : line.slice(0, sp)).toLowerCase();
      const rest = sp < 0 ? "" : line.slice(sp + 1).trim();
      const args = rest ? rest.split(",").map((a) => a.trim()) : [];
      program.push({ srcLine: i, op, args });
    });
    assembled = { program, labels };
    dirty = false;
  }

  /* ============================================================
     Lettura/scrittura operandi
     ============================================================ */
  function toSigned(v) {
    const mask = A.mask;
    v = v & mask;
    const sign = (mask >>> 1) + 1; // bit di segno
    return v >= sign ? v - (mask + 1) : v;
  }
  function wrap(v) { return ((v % (A.mask + 1)) + (A.mask + 1)) % (A.mask + 1); }

  function isReg(name) {
    const n = arch === "mips" ? name.toLowerCase() : name.toUpperCase();
    return A.regs.indexOf(n) >= 0;
  }
  function regName(name) { return arch === "mips" ? name.toLowerCase() : name.toUpperCase(); }

  function parseImm(s) {
    s = s.trim();
    let neg = 1;
    if (s[0] === "-") { neg = -1; s = s.slice(1); }
    let v;
    if (/^0x[0-9a-f]+$/i.test(s)) v = parseInt(s, 16);
    else if (/^[0-9a-f]+h$/i.test(s)) v = parseInt(s.slice(0, -1), 16);
    else if (/^[01]+b$/i.test(s)) v = parseInt(s.slice(0, -1), 2);
    else if (/^\d+$/.test(s)) v = parseInt(s, 10);
    else return null;
    return neg * v;
  }

  // legge un operando sorgente → numero (con segno)
  function readSrc(arg) {
    arg = arg.trim();
    if (isReg(arg)) return toSigned(m.regs[regName(arg)]);
    // memoria 8086: [k]
    let mm = arg.match(/^\[(.+)\]$/);
    if (mm) return toSigned(m.mem[memIndex(mm[1])] || 0);
    // memoria MIPS: off($base)
    mm = arg.match(/^(-?\w+)\(\$(\w+)\)$/);
    if (mm) return toSigned(m.mem[memIndexMips(mm[1], "$" + mm[2])] || 0);
    const imm = parseImm(arg);
    if (imm === null) throw new Error("operando non valido: " + arg);
    return imm;
  }

  // scrive in un operando destinazione
  function writeDst(arg, val) {
    arg = arg.trim();
    if (isReg(arg)) {
      const rn = regName(arg);
      if (arch === "mips" && rn === "$zero") return; // $zero è immutabile
      m.regs[rn] = wrap(val);
      m.changed.regs.push(rn);
      return;
    }
    let mm = arg.match(/^\[(.+)\]$/);
    if (mm) { const i = memIndex(mm[1]); m.mem[i] = wrap(val); m.changed.mem.push(i); return; }
    mm = arg.match(/^(-?\w+)\(\$(\w+)\)$/);
    if (mm) { const i = memIndexMips(mm[1], "$" + mm[2]); m.mem[i] = wrap(val); m.changed.mem.push(i); return; }
    throw new Error("destinazione non valida: " + arg);
  }

  function memIndex(expr) {
    expr = expr.trim();
    let idx;
    if (isReg(expr)) idx = m.regs[regName(expr)];
    else { const v = parseImm(expr); if (v === null) throw new Error("indirizzo non valido: " + expr); idx = v; }
    if (idx < 0 || idx >= A.memCells) throw new Error("indirizzo fuori dalla memoria: " + idx);
    return idx;
  }
  function memIndexMips(off, base) {
    const o = parseImm(off); if (o === null) throw new Error("offset non valido: " + off);
    const b = isReg(base) ? m.regs[regName(base)] : 0;
    const addr = b + o;
    if (addr % 4 !== 0) throw new Error("indirizzo non allineato a 4: " + addr);
    const idx = addr / 4;
    if (idx < 0 || idx >= A.memCells) throw new Error("indirizzo fuori dalla memoria: " + addr);
    return idx;
  }

  /* ============================================================
     Esecuzione di una istruzione
     ============================================================ */
  function setArithFlags(full, masked, dv, sv, kind) {
    m.flags.ZF = (masked === 0) ? 1 : 0;
    m.flags.SF = (masked & ((A.mask >>> 1) + 1)) ? 1 : 0;
    if (kind === "add") {
      m.flags.CF = full > A.mask ? 1 : 0;
      m.flags.OF = (((dv ^ masked) & (sv ^ masked)) & ((A.mask >>> 1) + 1)) ? 1 : 0;
    } else if (kind === "sub") {
      m.flags.CF = (wrap(dv) < wrap(sv)) ? 1 : 0;
      m.flags.OF = (((dv ^ sv) & (dv ^ masked)) & ((A.mask >>> 1) + 1)) ? 1 : 0;
    }
    ["ZF", "SF", "CF", "OF"].forEach((f) => m.changed.flags.push(f));
  }

  function step() {
    if (m.halted || m.error) return;
    if (m.pc < 0 || m.pc >= assembled.program.length) { m.halted = true; return; }
    m.changed = { regs: [], mem: [], flags: [] };
    const ins = assembled.program[m.pc];
    const op = ins.op, a = ins.args;
    let jumped = false;

    try {
      if (arch === "emu8086") jumped = exec8086(op, a);
      else jumped = execMips(op, a);
    } catch (e) {
      m.error = `Riga ${ins.srcLine + 1}: ${e.message}`;
      return;
    }
    m.steps++;
    if (!jumped) m.pc++;
    if (m.pc >= assembled.program.length) m.halted = true;
  }

  function jumpTo(label) {
    const t = assembled.labels[label.toLowerCase()];
    if (t === undefined) throw new Error("etichetta non trovata: " + label);
    m.pc = t;
    return true;
  }

  function exec8086(op, a) {
    const need = (n) => { if (a.length < n) throw new Error("argomenti mancanti per " + op.toUpperCase()); };
    switch (op) {
      case "mov": need(2); writeDst(a[0], readSrc(a[1])); return false;
      case "add": { need(2); const d = readSrc(a[0]), s = readSrc(a[1]); const full = wrap(d) + wrap(s); const r = full & A.mask; setArithFlags(full, r, wrap(d), wrap(s), "add"); writeDst(a[0], r); return false; }
      case "sub": { need(2); const d = readSrc(a[0]), s = readSrc(a[1]); const full = wrap(d) - wrap(s); const r = full & A.mask; setArithFlags(full, r, wrap(d), wrap(s), "sub"); writeDst(a[0], r); return false; }
      case "cmp": { need(2); const d = readSrc(a[0]), s = readSrc(a[1]); const full = wrap(d) - wrap(s); const r = full & A.mask; setArithFlags(full, r, wrap(d), wrap(s), "sub"); return false; }
      case "inc": { need(1); const d = wrap(readSrc(a[0])); const r = (d + 1) & A.mask; const cf = m.flags.CF; setArithFlags(d + 1, r, d, 1, "add"); m.flags.CF = cf; writeDst(a[0], r); return false; }
      case "dec": { need(1); const d = wrap(readSrc(a[0])); const r = (d - 1) & A.mask; const cf = m.flags.CF; setArithFlags(d - 1, r, d, 1, "sub"); m.flags.CF = cf; writeDst(a[0], r); return false; }
      case "mul": { need(1); const s = wrap(readSrc(a[0])); const r = (wrap(m.regs.AX) * s) & A.mask; m.regs.AX = r; m.changed.regs.push("AX"); return false; }
      case "and": { need(2); const r = (wrap(readSrc(a[0])) & wrap(readSrc(a[1]))) & A.mask; setArithFlags(r, r, 0, 0, "log"); writeDst(a[0], r); return false; }
      case "or":  { need(2); const r = (wrap(readSrc(a[0])) | wrap(readSrc(a[1]))) & A.mask; setArithFlags(r, r, 0, 0, "log"); writeDst(a[0], r); return false; }
      case "xor": { need(2); const r = (wrap(readSrc(a[0])) ^ wrap(readSrc(a[1]))) & A.mask; setArithFlags(r, r, 0, 0, "log"); writeDst(a[0], r); return false; }
      case "jmp": need(1); return jumpTo(a[0]);
      case "je": case "jz":   need(1); return m.flags.ZF ? jumpTo(a[0]) : false;
      case "jne": case "jnz": need(1); return !m.flags.ZF ? jumpTo(a[0]) : false;
      case "jg":  need(1); return (!m.flags.ZF && m.flags.SF === m.flags.OF) ? jumpTo(a[0]) : false;
      case "jge": need(1); return (m.flags.SF === m.flags.OF) ? jumpTo(a[0]) : false;
      case "jl":  need(1); return (m.flags.SF !== m.flags.OF) ? jumpTo(a[0]) : false;
      case "jle": need(1); return (m.flags.ZF || m.flags.SF !== m.flags.OF) ? jumpTo(a[0]) : false;
      case "nop": return false;
      case "hlt": m.halted = true; return false;
      default: throw new Error("istruzione sconosciuta: " + op.toUpperCase());
    }
  }

  function execMips(op, a) {
    const need = (n) => { if (a.length < n) throw new Error("argomenti mancanti per " + op); };
    const R = (x) => readSrc(x);
    switch (op) {
      case "li": need(2); writeDst(a[0], R(a[1])); return false;
      case "move": need(2); writeDst(a[0], R(a[1])); return false;
      case "add": need(3); writeDst(a[0], (R(a[1]) + R(a[2])) | 0); return false;
      case "sub": need(3); writeDst(a[0], (R(a[1]) - R(a[2])) | 0); return false;
      case "addi": need(3); writeDst(a[0], (R(a[1]) + R(a[2])) | 0); return false;
      case "mul": need(3); writeDst(a[0], Math.imul(R(a[1]), R(a[2]))); return false;
      case "and": need(3); writeDst(a[0], (R(a[1]) & R(a[2])) | 0); return false;
      case "or":  need(3); writeDst(a[0], (R(a[1]) | R(a[2])) | 0); return false;
      case "xor": need(3); writeDst(a[0], (R(a[1]) ^ R(a[2])) | 0); return false;
      case "slt": need(3); writeDst(a[0], R(a[1]) < R(a[2]) ? 1 : 0); return false;
      case "lw": need(2); writeDst(a[0], R(a[1])); return false;
      case "sw": need(2); { const v = R(a[0]); writeDst(a[1], v); } return false;
      case "beq": need(3); return R(a[0]) === R(a[1]) ? jumpTo(a[2]) : false;
      case "bne": need(3); return R(a[0]) !== R(a[1]) ? jumpTo(a[2]) : false;
      case "j": need(1); return jumpTo(a[0]);
      case "nop": return false;
      default: throw new Error("istruzione sconosciuta: " + op);
    }
  }

  /* ============================================================
     Rendering
     ============================================================ */
  function hex(v) { return "0x" + wrap(v).toString(16).toUpperCase().padStart(A.hexpad, "0"); }

  function renderListing() {
    const src = $("editor").value.split("\n");
    const curLine = (!m.halted && !m.error && assembled.program[m.pc]) ? assembled.program[m.pc].srcLine : -1;
    const cc = A.comment;
    let html = "";
    src.forEach((raw, i) => {
      const trimmed = raw.trim();
      let cls = "row";
      if (i === curLine) cls += " current";
      if (trimmed.startsWith(cc)) cls += " comment";
      else if (/^[A-Za-z_.$]\w*:/.test(trimmed)) cls += " label";
      html += `<div class="${cls}"><span class="ln">${i + 1}</span><span class="src">${esc(raw) || "&nbsp;"}</span></div>`;
    });
    $("listing").innerHTML = html;
  }

  function renderState() {
    // registri
    let rh = `<div class="reg pc"><span class="reg-name">${A.pc}</span><span class="reg-val">${m.halted ? "—" : m.pc}</span></div>`;
    rh += A.regs.map((r) => {
      const changed = m.changed.regs.indexOf(r) >= 0 ? " changed" : "";
      return `<div class="reg${changed}"><div class="reg-name">${esc(r)}</div>` +
        `<div class="reg-val">${toSigned(m.regs[r])}</div><div class="reg-hex">${hex(m.regs[r])}</div></div>`;
    }).join("");
    $("registers").innerHTML = rh;

    // flag
    if (A.flags.length) {
      $("flagsBlock").hidden = false;
      $("flags").innerHTML = A.flags.map((f) => {
        const on = m.flags[f] ? " on" : "";
        const ch = m.changed.flags.indexOf(f) >= 0 ? " changed" : "";
        return `<div class="flag${on}${ch}"><b>${f}</b><span class="v">${m.flags[f]}</span></div>`;
      }).join("");
    } else { $("flagsBlock").hidden = true; }

    // memoria
    $("memory").innerHTML = m.mem.map((v, i) => {
      const ch = m.changed.mem.indexOf(i) >= 0 ? " changed" : "";
      const addr = arch === "mips" ? i * 4 : i;
      return `<div class="mem-cell${ch}"><div class="mem-addr">[${addr}]</div><div class="mem-val">${v}</div></div>`;
    }).join("");
  }

  function setStatus(msg, kind) {
    const el = $("status");
    el.textContent = msg;
    el.className = "code-status" + (kind ? " " + kind : "");
  }

  function statusForState() {
    if (m.error) { setStatus(m.error, "err"); return; }
    if (m.halted) { setStatus(`Terminato in ${m.steps} passi`, "ok"); return; }
    const ins = assembled.program[m.pc];
    setStatus(`Riga ${ins.srcLine + 1} · prossima: ${$("editor").value.split("\n")[ins.srcLine].trim()}`, "");
  }

  /* ============================================================
     Comandi
     ============================================================ */
  function enterRunMode() {
    runMode = true;
    $("editor").hidden = true;
    $("listing").hidden = false;
    $("btnEdit").hidden = false;
  }
  function enterEditMode() {
    runMode = false;
    $("editor").hidden = false;
    $("listing").hidden = true;
    $("btnEdit").hidden = true;
    setStatus("Modifica il codice, poi premi Step o Esegui", "");
  }

  function ensureAssembled() {
    if (dirty || !assembled) { assemble(); m = freshMachine(); }
    if (!m) m = freshMachine();
  }

  function doStep() {
    ensureAssembled();
    enterRunMode();
    if (m.halted || m.error) { renderListing(); renderState(); statusForState(); return; }
    step();
    renderListing(); renderState(); statusForState();
  }

  function doRun() {
    ensureAssembled();
    enterRunMode();
    let guard = 0;
    while (!m.halted && !m.error && guard++ < 5000) step();
    if (guard >= 5000) m.error = "Troppi passi: forse un ciclo infinito.";
    renderListing(); renderState(); statusForState();
  }

  function doReset() {
    if (dirty || !assembled) assemble();
    m = freshMachine();
    if (runMode) { renderListing(); }
    renderState();
    setStatus("Reset · pronto dalla prima istruzione", "");
  }

  /* ============================================================
     Cambio architettura / esempi / riferimento
     ============================================================ */
  function renderExamples() {
    $("examples").innerHTML = EXAMPLES[arch].map((e, i) =>
      `<button type="button" class="example-chip" data-i="${i}">${esc(e.label)}</button>`).join("");
  }
  function renderReference() {
    $("refTitle").textContent = "Istruzioni · " + (arch === "mips" ? "MIPS" : "emu8086");
    $("reference").innerHTML = A.reference.map((r) =>
      `<div class="ref-item"><code>${esc(r[0])}</code><span>${esc(r[1])}</span></div>`).join("");
    $("archTitle").textContent = A.title;
  }

  function loadExample(i) {
    $("editor").value = EXAMPLES[arch][i].code;
    dirty = true;
    enterEditMode();
    m = freshMachine();
    renderState();
    setStatus("Esempio caricato · premi Step o Esegui", "");
  }

  function setArch(name) {
    arch = name; A = ARCH[arch];
    $("archSeg").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.arch === name));
    renderExamples();
    renderReference();
    loadExample(0);
  }

  /* ============================================================
     Eventi
     ============================================================ */
  $("archSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-arch]"); if (!b) return;
    setArch(b.dataset.arch);
  });
  $("examples").addEventListener("click", (e) => {
    const b = e.target.closest(".example-chip"); if (!b) return;
    loadExample(+b.dataset.i);
  });
  $("editor").addEventListener("input", () => { dirty = true; });
  $("editor").addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = e.target.selectionStart;
      e.target.value = e.target.value.slice(0, s) + "    " + e.target.value.slice(e.target.selectionEnd);
      e.target.selectionStart = e.target.selectionEnd = s + 4;
      dirty = true;
    }
  });
  $("btnStep").addEventListener("click", doStep);
  $("btnRun").addEventListener("click", doRun);
  $("btnReset").addEventListener("click", doReset);
  $("btnEdit").addEventListener("click", enterEditMode);

  /* ============================================================
     Avvio
     ============================================================ */
  setArch("emu8086");
})();
