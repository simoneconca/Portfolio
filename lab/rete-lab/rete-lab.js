/* ============================================================
   rete-lab.js — «Costruisci la tua rete» — Milestone 1
   Topologia + livello 2: PC/Switch/Router, cavi (con rimozione),
   indirizzamento, ping nella STESSA subnet con ARP e tabella MAC,
   log passo-passo e diagnosi. Vanilla JS, SVG, zero backend.
   (Routing L3 / RIP / OSPF / wireless / DHCP: milestone successive.)
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const DW = 108, DH = 70;            // dimensioni box dispositivo
  const PORTS = { pc: 1, switch: 6, router: 4 };

  /* ---------- Stato ---------- */
  let devices = [];        // {id,type,name,x,y,ports:[],gateway?,macTable?}
  let links = [];          // {id, a:portId, b:portId}
  let idc = 0, macc = 0;
  let tool = "select";     // 'select' | 'cable' | 'ping'
  let selectedId = null;
  let cableFrom = null;    // device id sorgente del cavo
  let pingSrc = null;      // device id sorgente del ping
  let animating = false;
  let sideTab = "config";

  const uid = (p) => p + (++idc);
  function nextMac() {
    macc++;
    return "02:00:00:00:" + ((macc >> 8) & 255).toString(16).padStart(2, "0").toUpperCase() +
           ":" + (macc & 255).toString(16).padStart(2, "0").toUpperCase();
  }

  /* ---------- DOM ---------- */
  const svg = document.getElementById("rlStage");
  const gLinks = document.getElementById("rlLinks");
  const gDevices = document.getElementById("rlDevices");
  const gAnim = document.getElementById("rlAnim");
  const sideEl = document.getElementById("rlSide");
  const logEl = document.getElementById("rlLog");
  const bannerEl = document.getElementById("rlBanner");
  const statusEl = document.getElementById("rlStatus");
  const speedEl = document.getElementById("rlSpeed");

  /* ============================================================
     HELPER IP / SUBNET (32 bit unsigned)
     ============================================================ */
  function ipToInt(s) {
    const p = String(s).trim().split(".");
    if (p.length !== 4) return null;
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const v = parseInt(p[i], 10);
      if (isNaN(v) || v < 0 || v > 255 || !/^\d+$/.test(p[i].trim())) return null;
      n = ((n << 8) >>> 0) + v;
    }
    return n >>> 0;
  }
  function intToIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
  function cidrToMaskInt(c) { return c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0; }
  function parseMask(s) {
    s = String(s).trim();
    if (s.indexOf("/") === 0) s = s.slice(1);
    if (/^\d{1,2}$/.test(s)) { const c = parseInt(s, 10); return c >= 0 && c <= 32 ? cidrToMaskInt(c) : null; }
    const n = ipToInt(s);
    if (n === null) return null;
    // verifica che sia una maschera valida (1 contigui poi 0)
    const inv = (~n) >>> 0;
    if (((inv + 1) & inv) !== 0) return null;
    return n;
  }
  function maskToCidr(m) { let c = 0, x = m >>> 0; while (x & 0x80000000) { c++; x = (x << 1) >>> 0; } return c; }
  function sameSubnet(ipA, ipB, mask) { return ((ipA & mask) >>> 0) === ((ipB & mask) >>> 0); }

  /* ============================================================
     MODELLO
     ============================================================ */
  function makeDevice(type, x, y) {
    const n = PORTS[type];
    const ports = [];
    const base = type === "router" ? "eth" : type === "switch" ? "p" : "eth";
    for (let i = 0; i < n; i++) {
      ports.push({ id: uid("port"), name: base + i, mac: nextMac(), ip: null, mask: null, linkId: null });
    }
    const count = devices.filter((d) => d.type === type).length + 1;
    const nm = { pc: "PC", switch: "Switch", router: "Router" }[type] + count;
    const dev = { id: uid("dev"), type, name: nm, x, y, ports };
    if (type === "pc") dev.gateway = "";
    if (type === "switch") { dev.macTable = {}; ports.forEach((p) => { p.ip = null; p.mask = null; }); }
    if (type === "pc") { dev.arp = {}; }
    if (type === "router") { dev.arp = {}; }
    return dev;
  }
  const device = (id) => devices.find((d) => d.id === id);
  const portById = (id) => { for (const d of devices) { const p = d.ports.find((x) => x.id === id); if (p) return p; } return null; };
  const deviceOfPort = (id) => devices.find((d) => d.ports.some((p) => p.id === id));
  function freePort(dev) { return dev.ports.find((p) => !p.linkId); }
  function neighbors(devId) {
    const out = [];
    links.forEach((l) => {
      const da = deviceOfPort(l.a), db = deviceOfPort(l.b);
      if (da.id === devId) out.push({ dev: db, link: l, viaPort: l.a, toPort: l.b });
      else if (db.id === devId) out.push({ dev: da, link: l, viaPort: l.b, toPort: l.a });
    });
    return out;
  }
  function hostPortWithIp(ip) {
    for (const d of devices) {
      if (d.type === "switch") continue;
      for (const p of d.ports) { if (p.ip && ipToInt(p.ip) === ip) return { dev: d, port: p }; }
    }
    return null;
  }

  function addDevice(type) {
    const w = svg.clientWidth || 600, h = svg.clientHeight || 460;
    const k = devices.length;
    const x = Math.min(w - DW - 10, 40 + (k % 4) * 150);
    const y = Math.min(h - DH - 10, 40 + Math.floor(k / 4) * 110);
    const d = makeDevice(type, x, y);
    devices.push(d);
    selectedId = d.id;
    render(); renderSide();
  }
  function deleteDevice(id) {
    links = links.filter((l) => {
      const keep = deviceOfPort(l.a).id !== id && deviceOfPort(l.b).id !== id;
      if (!keep) { const pa = portById(l.a), pb = portById(l.b); if (pa) pa.linkId = null; if (pb) pb.linkId = null; }
      return keep;
    });
    devices = devices.filter((d) => d.id !== id);
    if (selectedId === id) selectedId = null;
    render(); renderSide();
  }
  function connect(aDevId, bDevId) {
    if (aDevId === bDevId) { setStatus("Non puoi collegare un dispositivo a sé stesso."); return; }
    const a = device(aDevId), b = device(bDevId);
    const pa = freePort(a), pb = freePort(b);
    if (!pa) { setStatus(a.name + " non ha porte libere."); return; }
    if (!pb) { setStatus(b.name + " non ha porte libere."); return; }
    // evita doppio cavo tra gli stessi due
    const dup = links.some((l) => { const da = deviceOfPort(l.a).id, db = deviceOfPort(l.b).id; return (da === aDevId && db === bDevId) || (da === bDevId && db === aDevId); });
    if (dup) { setStatus(a.name + " e " + b.name + " sono già collegati."); return; }
    const l = { id: uid("link"), a: pa.id, b: pb.id };
    pa.linkId = l.id; pb.linkId = l.id;
    links.push(l);
    setStatus("Collegati " + a.name + " (" + pa.name + ") ↔ " + b.name + " (" + pb.name + ").");
    render();
  }
  function removeLink(id) {
    const l = links.find((x) => x.id === id); if (!l) return;
    const pa = portById(l.a), pb = portById(l.b);
    if (pa) pa.linkId = null; if (pb) pb.linkId = null;
    links = links.filter((x) => x.id !== id);
    render();
  }

  /* ============================================================
     RENDER SVG
     ============================================================ */
  const center = (d) => ({ x: d.x + DW / 2, y: d.y + DH / 2 });
  function linkEndpoints(l) {
    const da = deviceOfPort(l.a), db = deviceOfPort(l.b);
    return { a: center(da), b: center(db) };
  }
  function pathD(l) { const e = linkEndpoints(l); return "M " + e.a.x + " " + e.a.y + " L " + e.b.x + " " + e.b.y; }

  function icon(type) {
    // disegnato in un riquadro ~ 30x24 centrato a x=DW/2, y=8
    const cx = DW / 2;
    if (type === "pc") {
      return '<g class="rl-dev-icon" transform="translate(' + (cx - 15) + ',8)">' +
        '<rect x="0" y="0" width="30" height="20" rx="2"/><path d="M11 24h8M9 24h12"/></g>';
    }
    if (type === "switch") {
      return '<g class="rl-dev-icon" transform="translate(' + (cx - 16) + ',10)">' +
        '<rect x="0" y="4" width="32" height="14" rx="2"/><path d="M5 18v3M12 18v3M19 18v3M26 18v3M6 11h7M19 8l3 3-3 3"/></g>';
    }
    // router: cerchio con 4 frecce
    return '<g class="rl-dev-icon" transform="translate(' + (cx - 14) + ',8)">' +
      '<circle cx="14" cy="12" r="11"/><path d="M14 3v6M14 21v-6M5 12h6M23 12h-6M9 7l3 3M19 17l-3-3"/></g>';
  }

  function render() {
    // ---- cavi (sotto i dispositivi) ----
    let lh = "";
    links.forEach((l) => {
      const d = pathD(l);
      lh += '<path class="rl-link-hit" data-link="' + l.id + '" d="' + d + '"/>';
      lh += '<path class="rl-link" data-link="' + l.id + '" d="' + d + '"/>';
    });
    gLinks.innerHTML = lh;

    // ---- dispositivi ----
    let dh = "";
    devices.forEach((d) => {
      const cls = "rl-dev" + (d.id === selectedId ? " sel" : "") + (d.id === pingSrc ? " pingsrc" : "");
      let ipLine = "";
      if (d.type === "pc") {
        const ip = d.ports[0].ip;
        ipLine = ip ? '<text class="rl-dev-ip" x="' + (DW / 2) + '" y="58">' + escapeHtml(ip) + "</text>"
                    : '<text class="rl-dev-ip none" x="' + (DW / 2) + '" y="58">(senza IP)</text>';
      } else if (d.type === "router") {
        const ips = d.ports.filter((p) => p.ip).map((p) => p.ip);
        ipLine = '<text class="rl-dev-ip" x="' + (DW / 2) + '" y="58">' + (ips.length ? escapeHtml(ips[0]) + (ips.length > 1 ? " +" + (ips.length - 1) : "") : "(no IP)") + "</text>";
      }
      dh += '<g class="' + cls + '" data-dev="' + d.id + '" transform="translate(' + d.x + "," + d.y + ')">' +
        '<rect class="rl-dev-box" x="0" y="0" width="' + DW + '" height="' + DH + '"/>' +
        icon(d.type) +
        '<text class="rl-dev-name" x="' + (DW / 2) + '" y="44">' + escapeHtml(d.name) + "</text>" +
        ipLine +
        (d.id === selectedId ? '<g class="rl-del" data-del="' + d.id + '" transform="translate(' + (DW - 4) + ',4)"><circle cx="0" cy="0" r="9"/><text x="0" y="0">×</text></g>' : "") +
        "</g>";
    });
    gDevices.innerHTML = dh;
  }

  function updateLinkPaths() {
    gLinks.querySelectorAll("[data-link]").forEach((p) => {
      const l = links.find((x) => x.id === p.dataset.link); if (l) p.setAttribute("d", pathD(l));
    });
  }

  /* ============================================================
     PANNELLO LATERALE
     ============================================================ */
  function setSideTab(t) { sideTab = t; renderSide(); }
  window.__rlSetTab = setSideTab;

  function renderSide() {
    const d = device(selectedId);
    if (!d) {
      sideEl.innerHTML = '<div class="panel"><div class="rl-side-empty"><div class="ico">🖧</div>' +
        "<p>Seleziona un dispositivo per configurarlo, oppure aggiungine uno dalla barra qui sopra.</p></div></div>";
      return;
    }
    let body = '<div class="panel">';
    body += '<div class="rl-panel-head"><h2>' + escapeHtml(d.name) + "</h2></div>";

    if (d.type === "pc") {
      const tabs = '<div class="rl-tabs"><button class="rl-tab ' + (sideTab === "config" ? "active" : "") + '" onclick="__rlSetTab(\'config\')">Config</button>' +
        '<button class="rl-tab ' + (sideTab === "arp" ? "active" : "") + '" onclick="__rlSetTab(\'arp\')">ARP</button></div>';
      body += tabs;
      if (sideTab === "arp") {
        body += arpTable(d);
      } else {
        const p = d.ports[0];
        body += field("Nome", "name", d.name);
        body += field("Indirizzo IP", "ip", p.ip || "", "es. 192.168.1.10");
        body += field("Subnet mask", "mask", p.mask || "", "es. 255.255.255.0 o /24");
        body += field("Gateway (per M2)", "gateway", d.gateway || "", "facoltativo");
        body += '<div class="rl-field"><label>Ping verso</label><input type="text" data-f="pingto" placeholder="IP di destinazione"><div class="err"></div></div>';
        body += '<button class="btn btn-primary" style="width:100%;justify-content:center" data-act="pingfield" type="button">Invia ping ▶</button>';
      }
    } else if (d.type === "switch") {
      body += '<p class="rl-dev-ip" style="text-align:left;color:var(--ink-soft);font-size:0.85rem;margin-bottom:0.8rem">Lo switch non ha indirizzo IP: lavora a livello 2 e impara da solo quali MAC stanno su quale porta.</p>';
      body += field("Nome", "name", d.name);
      body += '<p class="control-label" style="margin:0.6rem 0 0.4rem">Tabella MAC appresa</p>';
      body += macTable(d);
    } else if (d.type === "router") {
      body += '<p class="rl-dev-ip" style="text-align:left;color:var(--ink-soft);font-size:0.85rem;margin-bottom:0.8rem">Configura un IP per interfaccia. L\'instradamento tra reti diverse arriva nella Milestone 2.</p>';
      body += field("Nome", "name", d.name);
      d.ports.forEach((p, i) => {
        body += '<div class="rl-field-row"><div class="rl-field"><label>' + p.name + " — IP</label><input type=\"text\" data-f=\"rip\" data-port=\"" + p.id + "\" value=\"" + escapeAttr(p.ip || "") + "\"><div class=\"err\"></div></div>" +
          '<div class="rl-field"><label>mask</label><input type="text" data-f="rmask" data-port="' + p.id + '" value="' + escapeAttr(p.mask || "") + '"></div></div>';
      });
    }
    body += '<button class="ghost-btn rl-del-btn" data-act="delete" type="button">Elimina ' + escapeHtml(d.name) + "</button>";
    body += "</div>";
    sideEl.innerHTML = body;
    wireSide(d);
  }

  function field(label, f, val, ph) {
    return '<div class="rl-field"><label>' + escapeHtml(label) + '</label><input type="text" data-f="' + f + '" value="' +
      escapeAttr(val) + '"' + (ph ? ' placeholder="' + escapeAttr(ph) + '"' : "") + '><div class="err"></div></div>';
  }
  function arpTable(d) {
    const rows = Object.keys(d.arp || {});
    let t = '<table class="rl-table"><thead><tr><th>IP</th><th>MAC</th></tr></thead><tbody>';
    if (!rows.length) t += '<tr><td class="empty" colspan="2">Vuota — fai un ping per popolarla.</td></tr>';
    else rows.forEach((ip) => { t += "<tr><td>" + escapeHtml(ip) + "</td><td>" + escapeHtml(d.arp[ip]) + "</td></tr>"; });
    return t + "</tbody></table>";
  }
  function macTable(d) {
    const rows = Object.keys(d.macTable || {});
    let t = '<table class="rl-table"><thead><tr><th>MAC</th><th>Porta verso</th></tr></thead><tbody>';
    if (!rows.length) t += '<tr><td class="empty" colspan="2">Vuota — passa del traffico per popolarla.</td></tr>';
    else rows.forEach((m) => { t += "<tr><td>" + escapeHtml(m) + "</td><td>" + escapeHtml(d.macTable[m]) + "</td></tr>"; });
    return t + "</tbody></table>";
  }

  function wireSide(d) {
    sideEl.querySelectorAll("input[data-f]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const f = inp.dataset.f, v = inp.value;
        const errEl = inp.parentElement.querySelector(".err");
        inp.classList.remove("invalid");
        if (f === "name") { d.name = v || d.name; render(); }
        else if (f === "ip") { const ok = ipToInt(v) !== null || v === ""; if (!ok) { inp.classList.add("invalid"); errEl && (errEl.textContent = "IP non valido"); } else { errEl && (errEl.textContent = ""); d.ports[0].ip = v || null; render(); } }
        else if (f === "mask") { const ok = parseMask(v) !== null || v === ""; if (!ok) { inp.classList.add("invalid"); errEl && (errEl.textContent = "Maschera non valida"); } else { errEl && (errEl.textContent = ""); d.ports[0].mask = v || null; } }
        else if (f === "gateway") { d.gateway = v; }
        else if (f === "rip") { const p = portById(inp.dataset.port); const ok = ipToInt(v) !== null || v === ""; if (!ok) inp.classList.add("invalid"); else { p.ip = v || null; render(); } }
        else if (f === "rmask") { const p = portById(inp.dataset.port); const ok = parseMask(v) !== null || v === ""; if (!ok) inp.classList.add("invalid"); else p.mask = v || null; }
      });
    });
    const pingBtn = sideEl.querySelector('[data-act="pingfield"]');
    if (pingBtn) pingBtn.addEventListener("click", () => {
      const to = sideEl.querySelector('[data-f="pingto"]').value.trim();
      if (!to) { setStatus("Scrivi l'IP di destinazione."); return; }
      startPing(d.id, to);
    });
    const delBtn = sideEl.querySelector('[data-act="delete"]');
    if (delBtn) delBtn.addEventListener("click", () => deleteDevice(d.id));
  }

  /* ============================================================
     LOG / STATUS / BANNER
     ============================================================ */
  function setStatus(t) { statusEl.textContent = t || ""; }
  function clearLog() { logEl.innerHTML = ""; bannerEl.className = "rl-banner"; }
  function logStep(html, cls) {
    if (logEl.querySelector(".rl-log-empty")) logEl.innerHTML = "";
    const div = document.createElement("div");
    div.className = "step " + (cls || "");
    div.innerHTML = html;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function banner(text, ok) {
    bannerEl.className = "rl-banner show " + (ok ? "ok" : "err");
    bannerEl.innerHTML = text;
  }

  /* ============================================================
     MOTORE — PING livello 2 (stessa subnet)
     ============================================================ */
  function l2Path(srcId, dstId) {
    const q = [[srcId]]; const seen = {}; seen[srcId] = true;
    while (q.length) {
      const path = q.shift();
      const last = path[path.length - 1];
      if (last === dstId) return path;
      neighbors(last).forEach((nb) => {
        if (seen[nb.dev.id]) return;
        // si può attraversare solo uno switch (i PC/router fermano il dominio L2)
        if (nb.dev.id !== dstId && nb.dev.type !== "switch") return;
        seen[nb.dev.id] = true;
        q.push(path.concat(nb.dev.id));
      });
    }
    return null;
  }

  function startPing(srcId, dstIpStr) {
    if (animating) return;
    clearLog();
    pingSrc = null; render();
    const src = device(srcId);
    const sp = src.ports[0];
    const dstIp = ipToInt(dstIpStr);

    // --- validazioni / diagnosi ---
    if (!sp.ip || !sp.mask) { return fail(src.name + " non ha IP o subnet mask configurati. Impostali nel pannello a destra."); }
    if (dstIp === null) { return fail('"' + escapeHtml(dstIpStr) + "\" non è un indirizzo IP valido."); }
    const srcIp = ipToInt(sp.ip), mask = parseMask(sp.mask);
    if (dstIp === srcIp) { return fail("Stai pingando te stesso (" + sp.ip + "). Scegli un altro host."); }

    logStep('<span class="who">' + escapeHtml(src.name) + "</span> vuole pingare <b>" + escapeHtml(dstIpStr) + "</b>.");
    const inSubnet = sameSubnet(srcIp, dstIp, mask);
    logStep("Confronto con la mia maschera /" + maskToCidr(mask) + ": " + escapeHtml(sp.ip) + " e " + escapeHtml(dstIpStr) +
      (inSubnet ? " sono <b>nella stessa rete</b> → consegna diretta." : " sono su <b>reti diverse</b>."));

    if (!inSubnet) {
      return fail("La destinazione è su un'altra rete. Servirebbe un <b>router</b> e un <b>gateway</b>: l'instradamento tra reti arriva nella Milestone 2. Per ora prova due host nella stessa subnet.");
    }

    const dst = hostPortWithIp(dstIp);
    if (!dst) { return fail("Nessun dispositivo in rete ha l'indirizzo " + escapeHtml(dstIpStr) + ". Assegnalo a un PC e riprova."); }

    const path = l2Path(src.id, dst.dev.id);
    if (!path) { return fail("Non c'è un percorso a livello 2 tra " + escapeHtml(src.name) + " e " + escapeHtml(dst.dev.name) + ": controlla i <b>cavi</b> (e che in mezzo ci siano solo switch)."); }

    // --- ARP ---
    if (!src.arp[dstIpStr]) {
      logStep('<span class="who">' + escapeHtml(src.name) + '</span> non conosce il MAC di ' + escapeHtml(dstIpStr) + ".", "arp");
      logStep('<span class="who">ARP</span> richiesta in <b>broadcast</b>: «Chi ha ' + escapeHtml(dstIpStr) + "? Dillo a " + escapeHtml(sp.mac) + "»", "arp");
      learnAlong(path, src, sp.mac);
      const dp = dst.port;
      logStep('<span class="who">' + escapeHtml(dst.dev.name) + '</span> risponde: «' + escapeHtml(dstIpStr) + " sta a " + escapeHtml(dp.mac) + "» (ARP reply).", "arp");
      src.arp[dstIpStr] = dst.port.mac;
      dst.dev.arp = dst.dev.arp || {};
      dst.dev.arp[sp.ip] = sp.mac;
    } else {
      logStep("Il MAC di " + escapeHtml(dstIpStr) + " è già nella cache ARP.", "arp");
    }

    // --- inoltro ICMP echo, animato ---
    animating = true;
    const pts = path.map((id) => center(device(id)));
    logStep('<span class="who">' + escapeHtml(src.name) + "</span> invia il pacchetto <b>ICMP echo request</b> verso " + escapeHtml(dst.dev.name) + ".");
    highlightPath(path, true);
    animateAlong(pts, "", () => {
      // apprendimento MAC sugli switch nel percorso
      learnAlong(path, src, sp.mac);
      logStep('<span class="who">' + escapeHtml(dst.dev.name) + "</span> riceve l'echo request e invia l'<b>echo reply</b>.");
      // sulla risposta gli switch imparano anche il MAC di destinazione (lato opposto)
      learnAlong(path.slice().reverse(), dst.dev, dst.port.mac);
      animateAlong(pts.slice().reverse(), "reply", () => {
        highlightPath(path, false);
        animating = false;
        banner("✅ <b>Ping riuscito!</b> " + escapeHtml(src.name) + " ↔ " + escapeHtml(dst.dev.name) + " — " + (path.length - 1) + " salto/i a livello 2.", true);
        logStep('<span class="who">' + escapeHtml(src.name) + "</span> ha ricevuto la risposta. <b>Comunicazione riuscita.</b>");
        if (selectedId) renderSide();
      });
    });
  }

  function fail(msg) {
    animating = false;
    banner("❌ " + msg, false);
    logStep(msg, "fail");
    return null;
  }

  function learnAlong(path, src, srcMac) {
    // ogni switch nel percorso impara: srcMac sta dalla parte del nodo precedente
    for (let i = 0; i < path.length; i++) {
      const d = device(path[i]);
      if (d.type !== "switch") continue;
      const prev = device(path[i - 1]);
      if (prev) { d.macTable[srcMac] = prev.name; }
    }
  }

  function highlightPath(path, on) {
    const set = new Set();
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const l = links.find((x) => { const da = deviceOfPort(x.a).id, db = deviceOfPort(x.b).id; return (da === a && db === b) || (da === b && db === a); });
      if (l) set.add(l.id);
    }
    gLinks.querySelectorAll(".rl-link").forEach((p) => p.classList.toggle("active", on && set.has(p.dataset.link)));
  }

  function animateAlong(pts, cls, done) {
    if (pts.length < 2) { done && done(); return; }
    const dot = document.createElementNS(SVGNS, "circle");
    dot.setAttribute("class", "rl-packet " + cls);
    dot.setAttribute("r", "8");
    dot.setAttribute("cx", pts[0].x); dot.setAttribute("cy", pts[0].y);
    gAnim.appendChild(dot);
    const speed = parseInt(speedEl.value, 10) || 5;
    const segMs = Math.max(140, 700 - speed * 55);
    // timer (non requestAnimationFrame): scatta anche se la scheda è in background,
    // così il ping arriva sempre a completamento.
    let seg = 0, t0 = Date.now();
    const tick = setInterval(function () {
      const elapsed = Date.now() - t0;
      let p = elapsed / segMs;
      while (p >= 1 && seg < pts.length - 2) { seg++; t0 = Date.now(); p = 0; }
      if (seg >= pts.length - 2 && p >= 1) {
        clearInterval(tick);
        if (dot.parentNode) gAnim.removeChild(dot);
        done && done();
        return;
      }
      const a = pts[seg], b = pts[seg + 1], tt = Math.min(1, Math.max(0, p));
      dot.setAttribute("cx", a.x + (b.x - a.x) * tt);
      dot.setAttribute("cy", a.y + (b.y - a.y) * tt);
    }, 30);
  }

  /* ============================================================
     INTERAZIONE TELA
     ============================================================ */
  let drag = null;
  function svgPoint(e) { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  svg.addEventListener("pointerdown", (e) => {
    const delEl = e.target.closest(".rl-del");
    const linkEl = e.target.closest(".rl-link-hit, .rl-link");
    const devEl = e.target.closest(".rl-dev");

    if (delEl) { e.preventDefault(); deleteDevice(delEl.dataset.del); return; }
    if (devEl) {
      const id = devEl.dataset.dev;
      if (tool === "cable") { e.preventDefault(); handleCableClick(id); return; }
      if (tool === "ping") { e.preventDefault(); handlePingClick(id); return; }
      // select + drag
      selectedId = id; sideTab = "config"; renderSide(); render();
      const d = device(id);
      drag = { id, moved: false, sx: e.clientX, sy: e.clientY, ox: d.x, oy: d.y };
      const g = gDevices.querySelector('[data-dev="' + id + '"]');
      g && g.classList.add("dragging");
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      return;
    }
    if (linkEl) { e.preventDefault(); removeLink(linkEl.dataset.link); return; }
    // click su vuoto
    if (tool === "cable" && cableFrom) { cableFrom = null; setStatus("Cavo annullato."); render(); }
    if (selectedId) { selectedId = null; renderSide(); render(); }
  });

  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const d = device(drag.id);
    const w = svg.clientWidth, h = svg.clientHeight;
    d.x = Math.max(0, Math.min(w - DW, drag.ox + dx));
    d.y = Math.max(0, Math.min(h - DH, drag.oy + dy));
    const g = gDevices.querySelector('[data-dev="' + drag.id + '"]');
    if (g) g.setAttribute("transform", "translate(" + d.x + "," + d.y + ")");
    updateLinkPaths();
  });

  svg.addEventListener("pointerup", () => {
    if (drag) { const g = gDevices.querySelector('[data-dev="' + drag.id + '"]'); g && g.classList.remove("dragging"); drag = null; }
  });

  function handleCableClick(id) {
    if (!cableFrom) { cableFrom = id; setStatus("Cavo: ora clicca il secondo dispositivo (" + device(id).name + " selezionato)."); render(); }
    else { connect(cableFrom, id); cableFrom = null; }
  }
  function handlePingClick(id) {
    const d = device(id);
    if (d.type !== "pc") { setStatus("Il ping parte da un PC. Clicca un PC."); return; }
    if (!pingSrc) { pingSrc = id; setStatus("Ping: ora clicca il PC di destinazione."); render(); return; }
    const dst = device(id);
    const sp = device(pingSrc).ports[0];
    if (id === pingSrc) { pingSrc = null; setStatus("Ping annullato."); render(); return; }
    const dstIp = dst.ports[0].ip;
    if (!dstIp) { setStatus(dst.name + " non ha un IP. Assegnalo prima."); return; }
    const srcId = pingSrc; pingSrc = null; render();
    startPing(srcId, dstIp);
  }

  /* ============================================================
     TOOLBAR
     ============================================================ */
  function setTool(t) {
    tool = t; cableFrom = null; pingSrc = null;
    document.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === t));
    setStatus(t === "cable" ? "Modalità cavo: clicca due dispositivi per collegarli." :
              t === "ping" ? "Modalità ping: clicca il PC di partenza, poi quello di arrivo." :
              "Modalità seleziona: trascina i dispositivi, clicca un cavo per rimuoverlo.");
    render();
  }
  document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => addDevice(b.dataset.add)));
  document.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
  document.getElementById("rlReset").addEventListener("click", () => loadScenario(document.getElementById("rlScenario").value));
  document.getElementById("rlScenario").addEventListener("change", (e) => loadScenario(e.target.value));

  /* ============================================================
     SCENARI
     ============================================================ */
  function loadScenario(name) {
    devices = []; links = []; idc = 0; macc = 0; selectedId = null; cableFrom = null; pingSrc = null; animating = false;
    clearLog(); logEl.innerHTML = '<div class="rl-log-empty">Costruisci la rete e premi «Ping» (o usa il pulsante nel pannello di un PC). Qui comparirà la spiegazione passo-passo.</div>';
    setTool("select");

    if (name === "switch2pc") {
      const pc1 = spawn("pc", 60, 60, "192.168.1.10", "255.255.255.0");
      const sw = spawn("switch", 360, 180);
      const pc2 = spawn("pc", 60, 300, "192.168.1.20", "255.255.255.0");
      mkLink(pc1, sw); mkLink(pc2, sw);
    } else if (name === "direct") {
      const pc1 = spawn("pc", 80, 150, "10.0.0.1", "255.255.255.0");
      const pc2 = spawn("pc", 420, 150, "10.0.0.2", "255.255.255.0");
      mkLink(pc1, pc2);
    }
    // "empty": niente
    render(); renderSide();
  }
  function spawn(type, x, y, ip, mask) {
    const d = makeDevice(type, x, y);   // pushato subito: i nomi (PC1, PC2…) restano corretti
    devices.push(d);
    if (ip) { d.ports[0].ip = ip; d.ports[0].mask = mask; }
    return d;
  }
  function mkLink(a, b) { const pa = freePort(a), pb = freePort(b); const l = { id: uid("link"), a: pa.id, b: pb.id }; pa.linkId = l.id; pb.linkId = l.id; links.push(l); }

  /* ---------- Avvio ---------- */
  loadScenario("switch2pc");
})();
