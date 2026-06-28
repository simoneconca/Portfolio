/* ============================================================
   mem-paging.js — Paginazione: processi in frame NON contigui
   La RAM è divisa in frame uguali; ogni processo è spezzato in
   pagine sparse in frame qualsiasi. La tabella delle pagine mappa
   pagina logica → frame fisico. Traduzione: fisico = frame*dim + offset.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  if (!$("pgRam")) return;
  const hex = (n, p) => "0x" + (n >>> 0).toString(16).toUpperCase().padStart(p || 0, "0");
  const PAGE_BITS = 12, PAGE_SIZE = 1 << PAGE_BITS, N_FRAMES = 8;

  // processi: pagina logica -> frame fisico (volutamente sparse, non contigue)
  const PROCS = [
    { id: "so", name: "Sistema Operativo", cls: "so", table: [0, 1] },        // p0→f0, p1→f1
    { id: "a",  name: "Programma A",       cls: "a",  table: [3, 6, 2, 7] },  // p0→f3, p1→f6, p2→f2, p3→f7
    { id: "b",  name: "Programma B",       cls: "b",  table: [5, 4] }         // p0→f5, p1→f4
  ];
  const shortName = (p) => (p.id === "so" ? "S.O." : "Prog. " + p.id.toUpperCase());
  // proprietario di ogni frame fisico (per la mappa della RAM)
  const owner = new Array(N_FRAMES).fill(null);
  PROCS.forEach((pr) => pr.table.forEach((f, page) => { owner[f] = { proc: pr, page }; }));

  let cur = PROCS[1];

  $("pgProcSeg").innerHTML = PROCS.map((p) =>
    `<button type="button" class="seg-btn ${p.id === cur.id ? "active" : ""}" data-pgproc="${p.id}">${shortName(p)}</button>`).join("");
  $("pgExamples").innerHTML = [
    ["a", "1110"], ["a", "2ABC"], ["b", "004F"], ["a", "4000"]
  ].map(([pid, addr]) => `<button type="button" class="example-chip" data-pgex="${pid}:${addr}">${pid === "so" ? "S.O." : "Prog. " + pid.toUpperCase()} · 0x${addr}</button>`).join("");

  function renderTable(hitPage) {
    $("pgTableLabel").innerHTML = "Tabella delle pagine — <b>" + cur.name + "</b>";
    $("pgTable").innerHTML =
      '<div class="pt-head"><span>Pagina logica</span><span>Frame fisico</span><span>Base del frame</span></div>' +
      cur.table.map((f, p) =>
        `<div class="pt-row present${hitPage === p ? " hit" : ""}"><span>${p}</span><span class="frame">${f}</span><span>${hex(f << PAGE_BITS, 4)}</span></div>`
      ).join("");
  }
  function renderRam(hitFrame) {
    $("pgRam").innerHTML = owner.map((o, f) =>
      `<div class="pg-frame ${o ? "pf-" + o.proc.cls : "empty"}${hitFrame === f ? " hit" : ""}">` +
        `<div class="pf-addr">${hex(f << PAGE_BITS, 4)} · frame ${f}</div>` +
        `<div class="pf-who">${o ? shortName(o.proc) + " · pag. " + o.page : "libero"}</div></div>`
    ).join("");
  }
  function setResult(html, cls) { const e = $("pgResult"); e.className = "mem-result" + (cls ? " " + cls : ""); e.innerHTML = html; }
  function setSteps(steps) {
    $("pgSteps").innerHTML = steps.map((s, i) =>
      `<div class="trans-step ${s.fault ? "fault" : ""}"><span class="tn">${i + 1}.</span><span>${s.t}</span></div>`).join("");
  }

  function translate() {
    const raw = $("pgLog").value.trim().replace(/^0x/i, "");
    if (!/^[0-9a-f]+$/i.test(raw)) {
      $("pgBreak").innerHTML = ""; setResult("", "");
      setSteps([{ t: "Inserisci un indirizzo esadecimale valido (es. <b>1110</b>).", fault: true }]);
      renderTable(); renderRam(); return;
    }
    const addr = parseInt(raw, 16), page = addr >> PAGE_BITS, offset = addr & (PAGE_SIZE - 1);

    $("pgBreak").innerHTML =
      `<div class="addr-part"><div class="ap-label">Indirizzo logico</div><div class="ap-val">${hex(addr, 4)}</div><div class="ap-sub">${addr} dec</div></div>` +
      '<div class="addr-op">÷</div>' +
      `<div class="addr-part size"><div class="ap-label">Dimensione</div><div class="ap-val">${hex(PAGE_SIZE, 4)}</div><div class="ap-sub">${PAGE_SIZE} dec</div></div>` +
      '<div class="addr-op">=</div>' +
      `<div class="addr-part page"><div class="ap-label">N° pagina</div><div class="ap-val">${page}</div><div class="ap-sub">quoziente</div></div>` +
      '<div class="addr-op">resto</div>' +
      `<div class="addr-part offset"><div class="ap-label">Offset</div><div class="ap-val">${hex(offset, 3)}</div><div class="ap-sub">${offset} dec</div></div>`;

    const steps = [{ t: `Numero pagina = ${hex(addr, 4)} ÷ ${hex(PAGE_SIZE, 4)} = <b>${page}</b> · offset = resto = <b>${hex(offset, 3)}</b>.` }];

    if (page >= cur.table.length) {
      steps.push({ t: `<b>${cur.name}</b> ha solo ${cur.table.length} pagine (0…${cur.table.length - 1}): la pagina ${page} <b>non esiste</b>. La MMU blocca l'accesso (errore di protezione).`, fault: true });
      setSteps(steps);
      setResult('<span class="mr-lbl">Errore di protezione</span><div class="mr-big">indirizzo non valido</div>', "fault");
      renderTable(); renderRam(); return;
    }
    const frame = cur.table[page], phys = (frame << PAGE_BITS) | offset;
    steps.push({ t: `Tabella delle pagine di ${cur.name}: pagina <b>${page}</b> → <b>frame ${frame}</b> (base ${hex(frame << PAGE_BITS, 4)}).` });
    steps.push({ t: `Indirizzo fisico = frame × dimensione + offset = ${frame} × ${hex(PAGE_SIZE, 4)} + ${hex(offset, 3)} = <b>${hex(phys, 4)}</b>.` });
    setSteps(steps);
    setResult('<span class="mr-lbl">Indirizzo fisico nella RAM</span><div class="mr-big">' + hex(phys, 4) + "</div>", "ok");
    renderTable(page); renderRam(frame);
  }

  $("pgProcSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pgproc]"); if (!b) return;
    cur = PROCS.find((p) => p.id === b.dataset.pgproc);
    $("pgProcSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    translate();
  });
  $("pgGo").addEventListener("click", translate);
  $("pgLog").addEventListener("keydown", (e) => { if (e.key === "Enter") translate(); });
  $("pgExamples").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pgex]"); if (!b) return;
    const parts = b.dataset.pgex.split(":");
    cur = PROCS.find((p) => p.id === parts[0]);
    $("pgProcSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x.dataset.pgproc === parts[0]));
    $("pgLog").value = parts[1];
    translate();
  });

  translate();
})();
