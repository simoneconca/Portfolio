/* ============================================================
   builder.js — Editor del diagramma di flusso (stile Flowgorithm)
   Si costruisce cliccando il «+» sulle linee di flusso: si sceglie
   il tipo di blocco e si compila un mini-dialog. I blocchi esistenti
   si modificano/eliminano cliccandoci sopra. Usa window.FC.
   ============================================================ */
(function () {
  "use strict";
  if (!window.FC) return;
  const $ = (id) => document.getElementById(id);

  let _id = 0;
  const nid = () => "u" + (++_id);
  // dopo ogni modifica: ridisegna (in modalità edit) e azzera un'eventuale esecuzione
  const afterChange = () => { if (window.FCExec) window.FCExec.reset(); else FC.render(); };

  /* tipi di blocco inseribili dal menu */
  const TYPES = {
    declare: { label: "Dichiarazione", make: () => ({ type: "declare", id: nid(), vars: "numero", vtype: "Intero" }) },
    assign: { label: "Assegnazione", make: () => ({ type: "assign", id: nid(), target: "numero", expr: "0" }) },
    input: { label: "Leggi · input", make: () => ({ type: "input", id: nid(), name: "numero" }) },
    output: { label: "Scrivi · output", make: () => ({ type: "output", id: nid(), expr: '"testo"' }) },
    if: { label: "Se · selezione", make: () => ({ type: "if", id: nid(), cond: "numero > 0", tBody: [], fBody: [] }) },
    while: { label: "Mentre · while", make: () => ({ type: "while", id: nid(), cond: "numero > 0", body: [] }) },
    do: { label: "Do-while", make: () => ({ type: "do", id: nid(), cond: "numero > 0", body: [] }) },
    for: { label: "Per · for", make: () => ({ type: "for", id: nid(), var: "i", from: "1", to: "10", body: [] }) },
  };
  const MENU_ORDER = ["declare", "assign", "input", "output", "if", "while", "do", "for"];

  function fieldsFor(node) {
    switch (node.type) {
      case "declare": return [{ k: "vars", label: "Nome variabile (o più, separate da virgola)", ph: "numero, media" }, { k: "vtype", label: "Tipo", sel: ["Intero", "Reale", "Stringa", "Booleano"] }];
      case "assign": return [{ k: "target", label: "Variabile" }, { k: "expr", label: "= espressione", ph: "numero * 2" }];
      case "input": return [{ k: "name", label: "Variabile in cui salvare" }];
      case "output": return [{ k: "expr", label: "Cosa scrivere", ph: '"Ciao " & nome' }];
      case "if": case "while": case "do": return [{ k: "cond", label: "Condizione (vera/falsa)", ph: "numero > 10" }];
      case "for": return [{ k: "var", label: "Contatore" }, { k: "from", label: "Da" }, { k: "to", label: "A" }];
    }
    return [];
  }
  const TITLES = { declare: "Dichiarazione", assign: "Assegnazione", input: "Leggi (input)", output: "Scrivi (output)", if: "Se (selezione)", while: "Mentre (while)", do: "Do-while", for: "Per (for)" };

  /* ---------- navigazione dell'AST ---------- */
  function childBodies(n) {
    if (n.type === "if") return [n.tBody, n.fBody];
    if (n.type === "while" || n.type === "for" || n.type === "do") return [n.body];
    return [];
  }
  function findParent(arr, id) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return { arr, idx: i };
      const subs = childBodies(arr[i]);
      for (const b of subs) { const r = findParent(b, id); if (r) return r; }
    }
    return null;
  }
  function findNode(id) { const r = findParent(FC.program, id); return r ? r.arr[r.idx] : null; }
  function findBody(owner, slot) {
    if (slot === "root") return FC.program;
    const n = findNode(owner); return n ? n[slot] : null;
  }

  /* ============================================================
     Menu «scegli blocco» (popover)
     ============================================================ */
  const menu = document.createElement("div");
  menu.className = "fc-menu"; menu.hidden = true;
  menu.innerHTML = '<div class="fc-menu-head">Inserisci un blocco</div>' +
    MENU_ORDER.map((t) => `<button type="button" class="fc-menu-item" data-type="${t}">${TYPES[t].label}</button>`).join("");
  document.body.appendChild(menu);
  let pendingLoc = null;

  function openMenu(x, y, loc) {
    pendingLoc = loc;
    menu.hidden = false;
    const w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.min(x, window.innerWidth - w - 10) + "px";
    menu.style.top = Math.min(y, window.innerHeight - h - 10) + "px";
  }
  function closeMenu() { menu.hidden = true; pendingLoc = null; }

  menu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]"); if (!b) return;
    const node = TYPES[b.dataset.type].make();
    const loc = pendingLoc; closeMenu();
    openDialog(node, true, loc);
  });

  /* ============================================================
     Dialog «compila/modifica blocco»
     ============================================================ */
  const overlay = document.createElement("div");
  overlay.className = "fc-modal-overlay"; overlay.hidden = true;
  document.body.appendChild(overlay);
  let dlgState = null;

  function openDialog(node, isNew, loc) {
    dlgState = { node, isNew, loc };
    const fields = fieldsFor(node);
    overlay.innerHTML =
      '<div class="fc-modal" role="dialog" aria-modal="true">' +
      '<div class="fc-modal-head">' + (isNew ? "Nuovo blocco · " : "Modifica · ") + TITLES[node.type] + "</div>" +
      '<div class="fc-modal-body">' +
      fields.map((f) => {
        const val = node[f.k] == null ? "" : node[f.k];
        if (f.sel) {
          return '<label class="fc-fld"><span>' + f.label + "</span><select data-k=\"" + f.k + "\">" +
            f.sel.map((o) => '<option' + (o === val ? " selected" : "") + ">" + o + "</option>").join("") + "</select></label>";
        }
        return '<label class="fc-fld"><span>' + f.label + '</span><input type="text" data-k="' + f.k + '" value="' + esc(val) + '" placeholder="' + (f.ph || "") + '" autocomplete="off" spellcheck="false"></label>';
      }).join("") +
      "</div>" +
      '<div class="fc-modal-foot">' +
      (isNew ? "" : '<button type="button" class="fc-del" data-act="del">Elimina</button>') +
      '<span class="fc-foot-sp"></span>' +
      '<button type="button" class="ghost-btn" data-act="cancel">Annulla</button>' +
      '<button type="button" class="fc-ok" data-act="ok">' + (isNew ? "Inserisci" : "Salva") + "</button>" +
      "</div></div>";
    overlay.hidden = false;
    const first = overlay.querySelector("input,select"); if (first) first.focus();
  }
  function closeDialog() { overlay.hidden = true; dlgState = null; }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) { closeDialog(); return; }
    const act = e.target.closest("[data-act]"); if (!act) return;
    const a = act.dataset.act;
    if (a === "cancel") { closeDialog(); return; }
    if (a === "del") {
      const r = findParent(FC.program, dlgState.node.id);
      if (r) r.arr.splice(r.idx, 1);
      closeDialog(); afterChange(); return;
    }
    if (a === "ok") {
      overlay.querySelectorAll("[data-k]").forEach((el) => { dlgState.node[el.dataset.k] = el.value.trim(); });
      if (dlgState.isNew) {
        const body = findBody(dlgState.loc.owner, dlgState.loc.slot);
        if (body) body.splice(dlgState.loc.index, 0, dlgState.node);
      }
      closeDialog(); afterChange();
    }
  });
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); overlay.querySelector('[data-act="ok"]').click(); }
    if (e.key === "Escape") closeDialog();
  });

  /* ============================================================
     Click sul canvas: «+» (inserisci) oppure blocco (modifica)
     ============================================================ */
  $("fcCanvas").addEventListener("click", (e) => {
    const p = e.target.closest(".fc-plus");
    if (p) {
      openMenu(e.clientX, e.clientY, { owner: p.dataset.owner, slot: p.dataset.slot, index: +p.dataset.index });
      e.stopPropagation(); return;
    }
    const g = e.target.closest(".fc-node");
    if (g && g.dataset.id) {
      const node = findNode(g.dataset.id);
      if (node && node.type !== "start" && node.type !== "end") openDialog(node, false, null);
    }
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest(".fc-plus")) closeMenu();
  });

  /* ============================================================
     Toolbar: Svuota · Esempi
     ============================================================ */
  const START = { type: "start", id: "s" }, END = { type: "end", id: "e" };
  const dec = (vars, t) => ({ type: "declare", id: nid(), vars, vtype: t });
  const asg = (target, expr) => ({ type: "assign", id: nid(), target, expr });
  const inp = (name) => ({ type: "input", id: nid(), name });
  const out = (expr) => ({ type: "output", id: nid(), expr });

  const EXAMPLES = {
    doppio: () => [START, dec("numero, risultato", "Intero"), inp("numero"), asg("risultato", "numero * 2"), out('"Il doppio è " & risultato'), END],
    tabellina: () => [START, dec("numero", "Intero"), inp("numero"),
      { type: "for", id: nid(), var: "i", from: "1", to: "10", body: [out('numero & " x " & i & " = " & (numero * i)')] }, END],
    maggiore: () => [START, dec("n, numero, maggiore", "Intero"), inp("n"), asg("maggiore", "0"),
      { type: "for", id: nid(), var: "i", from: "1", to: "n", body: [
        inp("numero"),
        { type: "if", id: nid(), cond: "numero > maggiore", tBody: [asg("maggiore", "numero")], fBody: [] },
      ] },
      out('"Il maggiore è " & maggiore'), END],
  };

  $("fcClear").addEventListener("click", () => { FC.program = [{ type: "start", id: "s" }, { type: "end", id: "e" }]; afterChange(); });
  $("fcExample").addEventListener("change", (e) => {
    const k = e.target.value; if (EXAMPLES[k]) FC.program = EXAMPLES[k]();
    e.target.value = ""; afterChange();
  });

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
})();
