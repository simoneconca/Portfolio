/* ============================================================
   er.js — Modello E-R, editor concettuale
   Entità / Attributi / Associazioni collegabili, con validazione
   delle regole formali, cardinalità e schema logico relazionale
   generato dal vivo (entità→tabelle, associazioni→FK o ponte).
   Zero backend.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Stato ---------- */
  let nodes = [];   // { id, type:'entity'|'assoc'|'attr', x, y, name, key? }
  let links = [];   // { id, a, b, card? }  card solo per entità–associazione
  let pending = null;
  let idc = 0;
  let menuLink = null;

  const CARDS = ["(0,1)", "(1,1)", "(0,N)", "(1,N)"];

  const board = document.getElementById("board");
  const nodesLayer = document.getElementById("nodes");
  const labelsLayer = document.getElementById("labels");
  const linksSvg = document.getElementById("links");
  const cardMenu = document.getElementById("cardMenu");
  const msgEl = document.getElementById("msg");
  const boardHint = document.getElementById("boardHint");

  const SIZE = { entity: { w: 128, h: 52 }, assoc: { w: 138, h: 76 }, attr: { w: 110, h: 46 } };
  const sz = (n) => SIZE[n.type];
  const center = (n) => ({ x: n.x + sz(n).w / 2, y: n.y + sz(n).h / 2 });
  const byId = (id) => nodes.find((n) => n.id === id);
  const uid = (p) => p + (idc++);

  /* ============================================================
     Render
     ============================================================ */
  function render() {
    // nodi
    nodesLayer.innerHTML = nodes.map(nodeHtml).join("");
    fitCanvas();
    drawLinks();
    drawCardLabels();
    renderSchema();
    boardHint.style.opacity = nodes.length ? "0" : "1";
  }

  function nodeHtml(n) {
    const cls = "er-node t-" + n.type + (n.key ? " is-key" : "") +
                (pending === n.id ? " pending" : "") + (n._invalid ? " invalid" : "");
    const name = escapeHtml(n.name);
    let inner = "";
    if (n.type === "assoc") inner = `<div class="er-rhombus"></div><div class="er-shape"><span class="er-label">${name}</span></div>`;
    else inner = `<div class="er-shape"><span class="er-label">${name}</span></div>`;
    const keyBadge = n.type === "attr" ? `<span class="er-key" title="Segna come chiave primaria">PK</span>` : "";
    return `<div class="${cls}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px">
      ${inner}
      <span class="er-port" title="Collega">+</span>
      ${keyBadge}
      <button class="er-del" type="button" data-del="${n.id}" aria-label="Elimina">×</button>
    </div>`;
  }

  function fitCanvas() {
    const pad = 30;
    let maxX = 0, maxY = 0;
    nodes.forEach((n) => { maxX = Math.max(maxX, n.x + sz(n).w); maxY = Math.max(maxY, n.y + sz(n).h); });
    const cw = Math.max(board.clientWidth, Math.ceil(maxX + pad));
    const ch = Math.max(board.clientHeight, Math.ceil(maxY + pad));
    [nodesLayer, labelsLayer].forEach((el) => { el.style.width = cw + "px"; el.style.height = ch + "px"; });
    linksSvg.style.width = cw + "px"; linksSvg.style.height = ch + "px";
    linksSvg.setAttribute("viewBox", "0 0 " + cw + " " + ch);
  }

  function drawLinks() {
    linksSvg.innerHTML = links.map((l) => {
      const a = byId(l.a), b = byId(l.b);
      if (!a || !b) return "";
      const ca = center(a), cb = center(b);
      const co = `x1="${ca.x}" y1="${ca.y}" x2="${cb.x}" y2="${cb.y}"`;
      // linea «hit» trasparente e larga (facile da cliccare) + linea visibile sottile
      return `<line class="hit" data-link="${l.id}" ${co}/><line class="link${l._flash ? " flash" : ""}" ${co}/>`;
    }).join("");
  }

  function drawCardLabels() {
    labelsLayer.innerHTML = links.filter((l) => l.card != null).map((l) => {
      const a = byId(l.a), b = byId(l.b);
      if (!a || !b) return "";
      const ent = a.type === "entity" ? a : b;          // cardinalità = partecipazione dell'entità
      const other = ent === a ? b : a;
      const ce = center(ent), co = center(other);
      const x = ce.x + (co.x - ce.x) * 0.32;
      const y = ce.y + (co.y - ce.y) * 0.32;
      return `<span class="er-card" data-link="${l.id}" style="left:${x}px;top:${y}px">${l.card}</span>`;
    }).join("");
  }

  /* ============================================================
     Schema logico relazionale
     ============================================================ */
  const attrsOf = (id) => links.filter((l) => l.a === id || l.b === id)
    .map((l) => byId(l.a === id ? l.b : l.a)).filter((n) => n && n.type === "attr");

  function generateSchema() {
    const entities = nodes.filter((n) => n.type === "entity");
    const assocs = nodes.filter((n) => n.type === "assoc");
    const tablesById = {};
    const tables = [];
    const notes = [];

    entities.forEach((e) => {
      const eAttrs = attrsOf(e.id);
      const cols = eAttrs.map((a) => ({ name: a.name, pk: !!a.key, fk: false }));
      const t = { id: e.id, name: e.name, cols, entity: true, hasKey: eAttrs.some((a) => a.key) };
      tablesById[e.id] = t; tables.push(t);
    });

    const pkNames = (e) => attrsOf(e.id).filter((a) => a.key).map((a) => a.name);
    function fkCols(refEnt) {
      const keys = pkNames(refEnt);
      if (!keys.length) return [{ name: "id_" + refEnt.name, fk: true, ref: refEnt.name, noKeyRef: true }];
      return keys.map((k) => ({ name: k, fk: true, ref: refEnt.name }));
    }

    assocs.forEach((r) => {
      const rAttrs = attrsOf(r.id);
      const parts = links.filter((l) => {
        const other = l.a === r.id ? byId(l.b) : (l.b === r.id ? byId(l.a) : null);
        return other && other.type === "entity";
      }).map((l) => ({ ent: byId(l.a === r.id ? l.b : l.a), card: l.card || "(1,N)" }));

      if (parts.length !== 2) {
        if (parts.length > 0) notes.push(`L'associazione «${r.name}» collega ${parts.length} entità: per tradurla in tabelle ne servono 2.`);
        return;
      }
      const [p, q] = parts;
      const maxOf = (c) => (/N/.test(c) ? "N" : "1");
      const mp = maxOf(p.card), mq = maxOf(q.card);

      if (mp === "N" && mq === "N") {
        // N:M → tabella ponte con chiave composta
        const cols = [];
        fkCols(p.ent).forEach((c) => cols.push(Object.assign({}, c, { pk: true })));
        fkCols(q.ent).forEach((c) => cols.push(Object.assign({}, c, { pk: true })));
        rAttrs.forEach((a) => cols.push({ name: a.name, pk: !!a.key, fk: false }));
        tables.push({ id: r.id, name: r.name, cols, bridge: true });
      } else if (mp === "1" && mq === "1") {
        // 1:1 → FK su un lato
        const t = tablesById[p.ent.id];
        fkCols(q.ent).forEach((c) => t.cols.push(c));
        rAttrs.forEach((a) => t.cols.push({ name: a.name, fk: false }));
      } else {
        // 1:N → la FK va sul lato che partecipa al massimo 1 volta
        const oneSide = mp === "1" ? p : q;
        const manySide = mp === "1" ? q : p;
        const t = tablesById[oneSide.ent.id];
        fkCols(manySide.ent).forEach((c) => t.cols.push(c));
        rAttrs.forEach((a) => t.cols.push({ name: a.name, fk: false }));
      }
    });

    return { tables, notes };
  }

  function renderSchema() {
    const box = document.getElementById("schema");
    const { tables, notes } = generateSchema();
    if (!tables.length) {
      box.innerHTML = `<p class="er-schema-empty">Aggiungi un'entità con i suoi attributi per vedere comparire la prima tabella.</p>`;
      return;
    }
    let html = tables.map((t) => {
      const cols = t.cols.map((c) => {
        const nm = escapeHtml(c.name);
        if (c.fk) return `<span class="fk" title="${c.ref ? "→ " + escapeHtml(c.ref) : ""}">${c.pk ? `<span class="pk">${nm}*</span>` : nm + "*"}</span>`;
        if (c.pk) return `<span class="pk">${nm}</span>`;
        return nm;
      }).join(", ");
      let note = "";
      if (t.entity && !t.cols.length) note = `<span class="tnote">nessun attributo: aggiungine almeno uno.</span>`;
      else if (t.entity && !t.hasKey) note = `<span class="tnote">manca la chiave primaria: segna un attributo con «PK».</span>`;
      const ref = t.cols.some((c) => c.noKeyRef) ? `<span class="tnote">un'entità collegata non ha chiave primaria.</span>` : "";
      return `<div class="er-table${t.bridge ? " bridge" : ""}"><span class="tname">${escapeHtml(t.name)}</span>(${cols || "…"})${note}${ref}</div>`;
    }).join("");
    if (notes.length) html += notes.map((n) => `<div class="er-table" style="border-color:#e0533d"><span class="tnote" style="color:#e0533d">${escapeHtml(n)}</span></div>`).join("");
    box.innerHTML = html;
  }

  /* ============================================================
     Operazioni
     ============================================================ */
  function addNode(type) {
    const defName = { entity: "Entità", attr: "attributo", assoc: "associazione" }[type];
    const count = nodes.filter((n) => n.type === type).length + 1;
    const n = { id: uid("n"), type, x: 40 + Math.random() * 60, y: 40 + Math.random() * 60, name: defName + count };
    if (type === "attr") n.key = false;
    nodes.push(n);
    render();
  }

  function deleteNode(id) {
    nodes = nodes.filter((n) => n.id !== id);
    links = links.filter((l) => l.a !== id && l.b !== id);
    if (pending === id) pending = null;
    closeMenu();
    render();
  }

  function classifyPair(ta, tb) {
    if (ta === "entity" && tb === "entity") return { ok: false, msg: "Due entità non si collegano direttamente: serve un'associazione in mezzo." };
    if (ta === "assoc" && tb === "assoc") return { ok: false, msg: "Un'associazione non può collegarsi a un'altra associazione." };
    if (ta === "attr" && tb === "attr") return { ok: false, msg: "Un attributo può appartenere solo a un'entità o a un'associazione, non a un altro attributo." };
    return { ok: true };
  }

  function tryConnect(aId, bId) {
    if (aId === bId) { msg("Non puoi collegare un elemento a sé stesso.", "error"); return; }
    const a = byId(aId), b = byId(bId);
    if (!a || !b) return;
    if (links.some((l) => (l.a === aId && l.b === bId) || (l.a === bId && l.b === aId))) {
      msg("Questo collegamento esiste già.", "info"); return;
    }
    const v = classifyPair(a.type, b.type);
    if (!v.ok) { flashInvalid(aId, bId); msg("✗ " + v.msg, "error"); return; }

    const isPart = (a.type === "entity" && b.type === "assoc") || (a.type === "assoc" && b.type === "entity");
    const link = { id: uid("l"), a: aId, b: bId };
    if (isPart) link.card = "(1,N)";
    links.push(link);
    const names = a.type === "entity" || a.type === "assoc" ? `${a.name} — ${b.name}` : `${b.name} — ${a.name}`;
    msg(isPart ? `✓ Collegamento creato: ${names}. Clicca la cardinalità per cambiarla.` : `✓ Attributo collegato: ${names}.`, "ok");
    render();
  }

  function flashInvalid(aId, bId) {
    [aId, bId].forEach((id) => { const n = byId(id); if (n) n._invalid = true; });
    render();
    setTimeout(() => { [aId, bId].forEach((id) => { const n = byId(id); if (n) n._invalid = false; }); render(); }, 850);
  }

  function msg(text, type) {
    msgEl.textContent = text;
    msgEl.className = "er-msg " + (type || "info");
  }

  /* ============================================================
     Menu cardinalità
     ============================================================ */
  function openMenu(linkId, x, y) {
    const l = links.find((k) => k.id === linkId); if (!l) return;
    menuLink = linkId;
    cardMenu.innerHTML = CARDS.map((c) =>
      `<button type="button" data-card="${c}" class="${l.card === c ? "active" : ""}">${c}</button>`).join("");
    // fuori dal banco (che ha overflow:auto e taglierebbe il menu vicino ai bordi)
    if (cardMenu.parentElement !== document.body) document.body.appendChild(cardMenu);
    cardMenu.hidden = false;
    // coordinate viewport, mantenute dentro la finestra
    const mw = cardMenu.offsetWidth, mh = cardMenu.offsetHeight;
    cardMenu.style.left = Math.max(8, Math.min(x, window.innerWidth - mw - 8)) + "px";
    cardMenu.style.top = Math.max(8, Math.min(y, window.innerHeight - mh - 8)) + "px";
  }
  function closeMenu() { cardMenu.hidden = true; menuLink = null; }

  cardMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-card]"); if (!b) return;
    const l = links.find((k) => k.id === menuLink); if (l) l.card = b.dataset.card;
    closeMenu(); render();
    msg("Cardinalità aggiornata: lo schema logico si è ricalcolato.", "info");
  });

  /* ============================================================
     Interazione sul banco
     ============================================================ */
  let drag = null;

  board.addEventListener("pointerdown", (e) => {
    if (e.target.isContentEditable) return;             // sto rinominando
    const portEl = e.target.closest(".er-port");
    const keyEl = e.target.closest(".er-key");
    const delEl = e.target.closest(".er-del");
    const cardEl = e.target.closest(".er-card");
    const lineEl = e.target.closest("line.hit");
    const nodeEl = e.target.closest(".er-node");
    const inMenu = e.target.closest(".er-menu");

    if (inMenu) return;
    closeMenu();

    if (delEl) { e.preventDefault(); deleteNode(delEl.dataset.del); return; }
    if (keyEl && nodeEl) { e.preventDefault(); toggleKey(nodeEl.dataset.id); return; }
    if (cardEl) {
      e.preventDefault();
      const r = cardEl.getBoundingClientRect();
      openMenu(cardEl.dataset.link, r.left, r.bottom + 4);
      return;
    }
    if (portEl && nodeEl) {
      e.preventDefault();
      const id = nodeEl.dataset.id;
      if (pending === id) pending = null;
      else if (pending) { const src = pending; pending = null; tryConnect(src, id); }
      else { pending = id; msg("Ora clicca un altro elemento per collegarlo.", "info"); }
      render();
      return;
    }
    if (lineEl) { e.preventDefault(); links = links.filter((l) => l.id !== lineEl.dataset.link); render(); msg("Collegamento rimosso.", "info"); return; }

    if (!nodeEl) { if (pending) { pending = null; render(); } return; }

    // se ho un collegamento in sospeso, un tap (senza trascinare) sul corpo collega
    const n = byId(nodeEl.dataset.id);
    drag = { id: n.id, moved: false, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
    nodeEl.classList.add("dragging");
    nodeEl.setPointerCapture(e.pointerId);
  });

  board.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const n = byId(drag.id);
    n.x = Math.max(0, drag.ox + dx);
    n.y = Math.max(0, drag.oy + dy);
    const el = nodesLayer.querySelector(`.er-node[data-id="${n.id}"]`);
    if (el) { el.style.left = n.x + "px"; el.style.top = n.y + "px"; }
    fitCanvas(); drawLinks(); drawCardLabels();
  });

  board.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const el = nodesLayer.querySelector(`.er-node[data-id="${drag.id}"]`);
    if (el) el.classList.remove("dragging");
    if (!drag.moved) {
      // tap sul corpo: completa un collegamento in sospeso
      if (pending && pending !== drag.id) { const src = pending; pending = null; tryConnect(src, drag.id); }
    }
    drag = null;
  });

  // doppio clic: rinomina
  board.addEventListener("dblclick", (e) => {
    const label = e.target.closest(".er-label");
    const nodeEl = e.target.closest(".er-node");
    if (!label || !nodeEl) return;
    const id = nodeEl.dataset.id;
    label.setAttribute("contenteditable", "true");
    label.focus();
    document.getSelection().selectAllChildren(label);
    const commit = () => {
      label.removeAttribute("contenteditable");
      const n = byId(id);
      if (n) { const v = label.textContent.trim(); n.name = v || n.name; }
      label.removeEventListener("blur", commit);
      render();
    };
    label.addEventListener("blur", commit);
    label.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); label.blur(); }
      if (ev.key === "Escape") { label.textContent = byId(id).name; label.blur(); }
    });
  });

  function toggleKey(id) {
    const n = byId(id); if (!n || n.type !== "attr") return;
    n.key = !n.key;
    render();
    msg(n.key ? `«${n.name}» è ora chiave primaria.` : `«${n.name}» non è più chiave.`, "info");
  }

  /* ---------- Toolbar ---------- */
  document.querySelectorAll(".er-add").forEach((b) => b.addEventListener("click", () => addNode(b.dataset.add)));
  document.getElementById("clearBtn").addEventListener("click", () => {
    nodes = []; links = []; pending = null; closeMenu(); render(); msg("Banco svuotato.", "info");
  });
  document.getElementById("exampleBtn").addEventListener("click", loadExample);

  /* ---------- Resize ---------- */
  let rt = null;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(fitCanvas, 150); });

  /* ---------- Regole (promemoria) ---------- */
  document.getElementById("rules").innerHTML = [
    ["◇", "Un'<b>associazione</b> mette in relazione due entità."],
    ["▭", "Due <b>entità</b> non si collegano fra loro direttamente: in mezzo ci va sempre un'associazione."],
    ["⬭", "Un <b>attributo</b> appartiene a un'entità o a un'associazione, mai a un altro attributo."],
    ["PK", "Ogni entità dovrebbe avere almeno un attributo <b>chiave primaria</b> (badge «PK»)."],
    ["(m,M)", "La <b>cardinalità</b> si imposta sul collegamento entità–associazione: cliccala per cambiarla."],
  ].map(([ic, t]) => `<li><span class="ic">${ic}</span><span>${t}</span></li>`).join("");

  /* ---------- Esempio: Studenti N:M Corsi ---------- */
  function loadExample() {
    nodes = []; links = []; pending = null; idc = 0; closeMenu();
    const mk = (type, name, x, y, key) => { const n = { id: uid("n"), type, name, x, y }; if (type === "attr") n.key = !!key; nodes.push(n); return n; };
    const studente = mk("entity", "Studente", 70, 70);
    const matr = mk("attr", "Matricola", 30, 200, true);
    const nome = mk("attr", "Nome", 150, 210);
    const corso = mk("entity", "Corso", 600, 70);
    const codice = mk("attr", "Codice", 600, 200, true);
    const titolo = mk("attr", "Titolo", 720, 210);
    const iscr = mk("assoc", "Iscrizione", 330, 80);
    const voto = mk("attr", "Voto", 345, 210);
    const link = (a, b, card) => links.push({ id: uid("l"), a: a.id, b: b.id, card });
    link(matr, studente); link(nome, studente);
    link(codice, corso); link(titolo, corso);
    link(studente, iscr, "(0,N)"); link(corso, iscr, "(0,N)");
    link(voto, iscr);
    render();
    msg("Esempio caricato: Studenti e Corsi con associazione N:M. Prova a cambiare le cardinalità!", "info");
  }

  /* ---------- Avvio ---------- */
  loadExample();
})();
