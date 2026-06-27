/* ============================================================
   mem-reloc.js — Memoria: indirizzo logico → fisico (rilocazione)
   Modello a settori contigui con Registro di rilocazione (Base):
   indirizzo fisico = indirizzo logico + base.  Zero dipendenze.
   Gestisce anche il sotto-selettore tra questa vista e la paginazione.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const hex = (n, p) => "0x" + (n >>> 0).toString(16).toUpperCase().padStart(p || 0, "0");

  /* --- Sotto-selettore: rilocazione ↔ paginazione --- */
  const subSeg = $("memSubSeg");
  if (subSeg) {
    subSeg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-memsub]"); if (!b) return;
      subSeg.querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
      $("memReloc").hidden = b.dataset.memsub !== "reloc";
      $("memPaging").hidden = b.dataset.memsub !== "paging";
    });
  }

  if (!$("ramBar")) return;

  /* --- Dati: RAM da 32 KB con quattro programmi caricati --- */
  const RAM_SIZE = 0x8000;
  const PROGS = [
    { id: "so", short: "S.O.",     name: "Sistema Operativo", base: 0x0000, size: 0x2000, cls: "so" },
    { id: "a",  short: "Prog. A",  name: "Programma A",       base: 0x2000, size: 0x1000, cls: "a" },
    { id: "b",  short: "Prog. B",  name: "Programma B",       base: 0x3000, size: 0x1800, cls: "b" },
    { id: "c",  short: "Prog. C",  name: "Programma C",       base: 0x5000, size: 0x1200, cls: "c" },
  ];
  let cur = PROGS[1], logVal = null, phys = null, valid = true;
  const pct = (v) => (v / RAM_SIZE) * 100;

  $("progSeg").innerHTML = PROGS.map((p) =>
    `<button type="button" class="seg-btn ${p.id === cur.id ? "active" : ""}" data-prog="${p.id}">${p.short}</button>`).join("");

  function renderRam() {
    const regions = PROGS.map((p) => {
      const sel = p.id === cur.id ? " sel" : "";
      return `<div class="ram-region ${p.cls}${sel}" style="top:${pct(p.base)}%;height:${pct(p.size)}%">` +
        `<span class="rr-name">${p.name}</span>` +
        `<span class="rr-range">${hex(p.base, 4)}–${hex(p.base + p.size - 1, 4)}</span></div>`;
    }).join("");
    const marker = (valid && phys != null)
      ? `<div class="ram-marker" style="top:${pct(phys)}%"><span class="rm-lbl">${hex(phys, 4)}</span></div>` : "";
    $("ramBar").innerHTML = `<div class="ram-track">${regions}${marker}</div>`;
  }

  function renderLogical() {
    const marker = (logVal != null && logVal < cur.size)
      ? `<div class="lbar-marker" style="top:${(logVal / cur.size) * 100}%"><span>${hex(logVal, 3)}</span></div>` : "";
    $("lbar").innerHTML =
      `<div class="lbar-track ${cur.cls}">` +
        `<span class="lbar-edge top">0x000</span>` +
        `<span class="lbar-edge bot">${hex(cur.size - 1, 3)}</span>` +
        marker +
      `</div>`;
  }

  function renderMMU() {
    $("mmuLog").textContent = logVal != null ? hex(logVal, 3) : "—";
    $("mmuBase").textContent = hex(cur.base, 4);
    $("mmuPhys").textContent = (valid && phys != null) ? hex(phys, 4) : (logVal != null ? "errore" : "—");
    $("mmuBox").classList.toggle("err", !valid);
  }

  function renderAll() { renderMMU(); renderLogical(); renderRam(); }

  function translate() {
    const raw = $("relocLog").value.trim().replace(/^0x/i, "");
    if (!/^[0-9a-f]+$/i.test(raw)) {
      $("relocHint").innerHTML = "Inserisci un indirizzo esadecimale valido (es. <b>0A5</b>).";
      $("relocHint").className = "reloc-hint err";
      return;
    }
    logVal = parseInt(raw, 16);
    if (logVal >= cur.size) {
      valid = false; phys = null;
      $("relocHint").innerHTML = `L'indirizzo logico ${hex(logVal, 3)} è <b>fuori</b> dal programma: ${cur.name} occupa solo da 0x000 a ${hex(cur.size - 1, 3)}. La MMU controlla il limite e <b>blocca l'accesso</b> (errore di protezione).`;
      $("relocHint").className = "reloc-hint err";
      renderAll();
      return;
    }
    valid = true; phys = cur.base + logVal;
    $("relocHint").innerHTML = `fisico = logico + base = ${hex(logVal, 3)} + ${hex(cur.base, 4)} = <b>${hex(phys, 4)}</b><br><span class="rh-dec">in decimale: ${logVal} + ${cur.base} = ${phys}</span>`;
    $("relocHint").className = "reloc-hint ok";
    renderAll();
  }

  $("progSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-prog]"); if (!b) return;
    cur = PROGS.find((p) => p.id === b.dataset.prog);
    $("progSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
    logVal = null; phys = null; valid = true;
    $("relocHint").textContent = ""; $("relocHint").className = "reloc-hint";
    renderAll();
  });
  $("relocGo").addEventListener("click", translate);
  $("relocLog").addEventListener("keydown", (e) => { if (e.key === "Enter") translate(); });

  // Avvio: mostra subito l'esempio col valore di default
  translate();
})();
