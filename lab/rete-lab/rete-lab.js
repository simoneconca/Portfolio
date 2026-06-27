/* ============================================================
   rete-lab.js — «Costruisci la tua rete» — Milestone 1 + 2
   Topologia + livello 2 (ARP, switch/MAC) e routing statico L3
   (router che instradano tra reti diverse: gateway, tabella di
   routing con rotte connesse e statiche, longest-prefix, TTL).
   Vanilla JS, SVG, zero backend. (RIP/OSPF/wireless/DHCP: dopo.)
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const DW = 108, DH = 70, CANVAS_W = 1100, CANVAS_H = 700;
  const PORTS = { pc: 1, switch: 6, router: 4, ap: 8, wpc: 1, server: 2 };
  const ROLE_LABEL = { dhcp: "DHCP", firewall: "Firewall", web: "Web/DNS", vpn: "VPN" };
  const WIFI_RANGE = 280; // raggio (px) entro cui un dispositivo wireless si associa a un AP

  /* ---------- Stato ---------- */
  let devices = [], links = [], idc = 0, macc = 0;
  let tool = "select", selectedId = null, cableFrom = null, pingSrc = null;
  let animating = false, sideTab = "config";

  const uid = (p) => p + (++idc);
  function nextMac() {
    macc++;
    return "02:00:00:00:" + ((macc >> 8) & 255).toString(16).padStart(2, "0").toUpperCase() +
           ":" + (macc & 255).toString(16).padStart(2, "0").toUpperCase();
  }

  /* ---------- DOM ---------- */
  const svg = document.getElementById("rlStage");
  const stageWrap = svg.parentElement; // contenitore scrollabile (per il pan)
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
      if (!/^\d+$/.test(p[i].trim())) return null;
      const v = parseInt(p[i], 10);
      if (isNaN(v) || v < 0 || v > 255) return null;
      n = ((n << 8) >>> 0) + v;
    }
    return n >>> 0;
  }
  function intToIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."); }
  function cidrToMaskInt(c) { return c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0; }
  function parseMask(s) {
    s = String(s).trim(); if (s.indexOf("/") === 0) s = s.slice(1);
    if (/^\d{1,2}$/.test(s)) { const c = parseInt(s, 10); return c >= 0 && c <= 32 ? cidrToMaskInt(c) : null; }
    const n = ipToInt(s); if (n === null) return null;
    const inv = (~n) >>> 0; if (((inv + 1) & inv) !== 0) return null;
    return n;
  }
  function maskToCidr(m) { let c = 0, x = m >>> 0; while (x & 0x80000000) { c++; x = (x << 1) >>> 0; } return c; }
  function sameSubnet(a, b, m) { return ((a & m) >>> 0) === ((b & m) >>> 0); }

  /* ============================================================
     MODELLO
     ============================================================ */
  function makeDevice(type, x, y) {
    const n = PORTS[type], ports = [];
    const base = type === "switch" || type === "ap" ? "p" : type === "wpc" ? "wlan" : "eth";
    for (let i = 0; i < n; i++) ports.push({ id: uid("port"), name: base + i, mac: nextMac(), ip: null, mask: null, linkId: null });
    const count = devices.filter((d) => d.type === type).length + 1;
    const nm = { pc: "PC", switch: "Switch", router: "Router", ap: "AP", wpc: "Laptop", server: "Server" }[type] + count;
    const dev = { id: uid("dev"), type, name: nm, x, y, ports };
    if (type === "pc" || type === "wpc") { dev.gateway = ""; dev.arp = {}; dev.ipMode = "manual"; }
    if (type === "switch" || type === "ap") dev.macTable = {};
    if (type === "router") { dev.arp = {}; dev.staticRoutes = []; dev.routingMode = "static"; }
    if (type === "server") { dev.arp = {}; dev.macTable = {}; dev.role = "dhcp"; dev.poolStart = ""; dev.poolEnd = ""; dev.gateway = ""; dev.leases = {}; dev.fwBlock = []; }
    return dev;
  }
  const device = (id) => devices.find((d) => d.id === id);
  const portById = (id) => { for (const d of devices) { const p = d.ports.find((x) => x.id === id); if (p) return p; } return null; };
  const deviceOfPort = (id) => devices.find((d) => d.ports.some((p) => p.id === id));
  const freePort = (dev) => dev.ports.find((p) => !p.linkId);
  function otherEnd(port) { const l = links.find((x) => x.id === port.linkId); if (!l) return null; return deviceOfPort(l.a === port.id ? l.b : l.a); }
  function neighbors(devId) {
    const out = [];
    links.forEach((l) => { const da = deviceOfPort(l.a), db = deviceOfPort(l.b); if (da.id === devId) out.push({ dev: db }); else if (db.id === devId) out.push({ dev: da }); });
    return out;
  }
  // dispositivi che fanno da "ponte" a livello 2 (transito): switch, access point e firewall in linea
  const isTransit = (dev) => dev.type === "switch" || dev.type === "ap" || (dev.type === "server" && dev.role === "firewall");
  const ownsIp = (dev, ipInt) => dev.ports.some((p) => p.ip && ipToInt(p.ip) === ipInt);
  const portWithIpOn = (dev, ipInt) => dev.ports.find((p) => p.ip && ipToInt(p.ip) === ipInt);
  function hostPortWithIp(ip) {
    for (const d of devices) { if (isTransit(d)) continue; for (const p of d.ports) if (p.ip && ipToInt(p.ip) === ip) return { dev: d, port: p }; }
    return null;
  }

  function addDevice(type) {
    const k = devices.length, vx = stageWrap.scrollLeft, vy = stageWrap.scrollTop;
    // nuovo dispositivo vicino all'angolo in alto a sinistra della vista corrente (a cascata)
    const x = Math.max(0, Math.min(CANVAS_W - DW, vx + 30 + (k % 6) * 34));
    const y = Math.max(0, Math.min(CANVAS_H - DH, vy + 30 + (k % 6) * 30));
    const d = makeDevice(type, x, y);
    devices.push(d); selectedId = d.id; sideTab = "config"; render(); renderSide();
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
  function connect(aId, bId) {
    if (aId === bId) { setStatus("Non puoi collegare un dispositivo a sé stesso."); return; }
    const a = device(aId), b = device(bId), pa = freePort(a), pb = freePort(b);
    if (!pa) { setStatus(a.name + " non ha porte libere."); return; }
    if (!pb) { setStatus(b.name + " non ha porte libere."); return; }
    if (links.some((l) => { const da = deviceOfPort(l.a).id, db = deviceOfPort(l.b).id; return (da === aId && db === bId) || (da === bId && db === aId); })) { setStatus(a.name + " e " + b.name + " sono già collegati."); return; }
    const l = { id: uid("link"), a: pa.id, b: pb.id }; pa.linkId = l.id; pb.linkId = l.id; links.push(l);
    setStatus("Collegati " + a.name + " (" + pa.name + ") ↔ " + b.name + " (" + pb.name + ").");
    render();
  }
  function removeLinkRaw(id) {
    const l = links.find((x) => x.id === id); if (!l) return;
    const pa = portById(l.a), pb = portById(l.b); if (pa) pa.linkId = null; if (pb) pb.linkId = null;
    links = links.filter((x) => x.id !== id);
  }
  function removeLink(id) { removeLinkRaw(id); render(); }

  // i dispositivi wireless (Laptop) si associano automaticamente all'AP più vicino entro il raggio
  function updateWireless() {
    const aps = devices.filter((d) => d.type === "ap");
    devices.filter((d) => d.type === "wpc").forEach((wpc) => {
      const port = wpc.ports[0];
      const curLink = links.find((l) => l.wireless && (l.a === port.id || l.b === port.id));
      let best = null, bestD = Infinity; const wc = center(wpc);
      aps.forEach((ap) => { const ac = center(ap), dd = Math.hypot(ac.x - wc.x, ac.y - wc.y); if (dd < bestD) { bestD = dd; best = ap; } });
      if (!best || bestD > WIFI_RANGE) { if (curLink) removeLinkRaw(curLink.id); return; }
      if (curLink) { const other = deviceOfPort(curLink.a === port.id ? curLink.b : curLink.a); if (other === best) return; removeLinkRaw(curLink.id); }
      const apPort = freePort(best); if (!apPort) return;
      const l = { id: uid("link"), a: port.id, b: apPort.id, wireless: true }; port.linkId = l.id; apPort.linkId = l.id; links.push(l);
    });
  }

  /* ============================================================
     RENDER SVG
     ============================================================ */
  const center = (d) => ({ x: d.x + DW / 2, y: d.y + DH / 2 });
  function pathD(l) { const a = center(deviceOfPort(l.a)), b = center(deviceOfPort(l.b)); return "M " + a.x + " " + a.y + " L " + b.x + " " + b.y; }

  function icon(type) {
    const cx = DW / 2, g = (inner, tx, ty) => '<g class="rl-dev-icon" transform="translate(' + (cx + tx) + "," + ty + ')">' + inner + "</g>";
    if (type === "pc") return g('<rect x="0" y="0" width="30" height="20" rx="2"/><path d="M11 24h8M9 24h12"/>', -15, 8);
    if (type === "switch") return g('<rect x="0" y="4" width="32" height="14" rx="2"/><path d="M5 18v3M12 18v3M19 18v3M26 18v3M6 11h7M19 8l3 3-3 3"/>', -16, 10);
    if (type === "router") return g('<circle cx="14" cy="12" r="11"/><path d="M14 3v6M14 21v-6M5 12h6M23 12h-6M9 7l3 3M19 17l-3-3"/>', -14, 8);
    if (type === "ap") return g('<rect x="6" y="15" width="16" height="9" rx="2"/><path d="M14 15V9M9 8.5a7 7 0 0 1 10 0M11.5 6a3.4 3.4 0 0 1 5 0"/>', -14, 3);
    if (type === "wpc") return g('<rect x="2" y="11" width="24" height="13" rx="1.5"/><path d="M0 26h28M14 11V8M10.6 7a5 5 0 0 1 6.8 0M12.6 9a2.4 2.4 0 0 1 2.8 0"/>', -14, 5);
    return g('<rect x="3" y="2" width="22" height="9" rx="1.5"/><rect x="3" y="13" width="22" height="9" rx="1.5"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>', -14, 8);
  }

  function render() {
    updateWireless(); // i dispositivi wireless si (dis)associano all'AP più vicino nel raggio
    let lh = "";
    links.forEach((l) => { const d = pathD(l); const wc = l.wireless ? " wireless" : ""; lh += '<path class="rl-link-hit" data-link="' + l.id + '" d="' + d + '"/><path class="rl-link' + wc + '" data-link="' + l.id + '" d="' + d + '"/>'; });
    gLinks.innerHTML = lh;

    let dh = "";
    devices.forEach((d) => {
      const cls = "rl-dev" + (d.id === selectedId ? " sel" : "") + (d.id === pingSrc ? " pingsrc" : "");
      let ipLine = "";
      if (d.type === "pc" || d.type === "wpc") {
        const ip = d.ports[0].ip;
        ipLine = ip ? '<text class="rl-dev-ip" x="' + (DW / 2) + '" y="58">' + escapeHtml(ip) + "</text>" : '<text class="rl-dev-ip none" x="' + (DW / 2) + '" y="58">(senza IP)</text>';
      } else if (d.type === "server") {
        const ip = d.ports[0].ip, lbl = ROLE_LABEL[d.role] || "Server";
        ipLine = '<text class="rl-dev-ip" x="' + (DW / 2) + '" y="58">' + escapeHtml(lbl) + (ip ? " · " + escapeHtml(ip) : "") + "</text>";
      } else if (d.type === "router") {
        const ips = d.ports.filter((p) => p.ip).map((p) => p.ip);
        ipLine = '<text class="rl-dev-ip" x="' + (DW / 2) + '" y="58">' + (ips.length ? escapeHtml(ips[0]) + (ips.length > 1 ? " +" + (ips.length - 1) : "") : "(no IP)") + "</text>";
      }
      dh += '<g class="' + cls + '" data-dev="' + d.id + '" transform="translate(' + d.x + "," + d.y + ')">' +
        '<rect class="rl-dev-box" x="0" y="0" width="' + DW + '" height="' + DH + '"/>' + icon(d.type) +
        '<text class="rl-dev-name" x="' + (DW / 2) + '" y="44">' + escapeHtml(d.name) + "</text>" + ipLine +
        (d.id === selectedId ? '<g class="rl-del" data-del="' + d.id + '" transform="translate(' + (DW - 4) + ',4)"><circle cx="0" cy="0" r="9"/><text x="0" y="0">×</text></g>' : "") + "</g>";
    });
    gDevices.innerHTML = dh;
  }
  function updateLinkPaths() { gLinks.querySelectorAll("[data-link]").forEach((p) => { const l = links.find((x) => x.id === p.dataset.link); if (l) p.setAttribute("d", pathD(l)); }); }

  /* ============================================================
     PANNELLO LATERALE
     ============================================================ */
  function setSideTab(t) { sideTab = t; renderSide(); }
  window.__rlSetTab = setSideTab;

  function renderSide() {
    const d = device(selectedId);
    if (!d) { sideEl.innerHTML = '<div class="panel"><div class="rl-side-empty"><div class="ico">🖧</div><p>Seleziona un dispositivo per configurarlo, oppure aggiungine uno dalla barra qui sopra.</p></div></div>'; return; }
    let body = '<div class="panel"><div class="rl-panel-head"><h2>' + escapeHtml(d.name) + "</h2></div>";

    if (d.type === "pc" || d.type === "wpc") {
      body += tabsHtml([["config", "Config"], ["arp", "ARP"]]);
      if (sideTab === "arp") body += arpTable(d);
      else {
        const p = d.ports[0];
        body += field("Nome", "name", d.name);
        body += '<div class="rl-tabs" style="margin-bottom:0.6rem"><button class="rl-tab ' + (d.ipMode !== "dhcp" ? "active" : "") + '" data-ipmode="manual">IP manuale</button><button class="rl-tab ' + (d.ipMode === "dhcp" ? "active" : "") + '" data-ipmode="dhcp">DHCP</button></div>';
        if (d.ipMode === "dhcp") {
          body += '<div class="rl-field"><label>Indirizzo IP (assegnato dal DHCP)</label><input type="text" value="' + escapeAttr(p.ip || "") + '" placeholder="non ancora assegnato" disabled><div class="err"></div></div>';
          body += '<button class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:0.8rem" data-act="dhcp" type="button">📡 Richiedi indirizzo (DHCP)</button>';
        } else {
          body += field("Indirizzo IP", "ip", p.ip || "", "es. 192.168.1.10");
          body += field("Subnet mask", "mask", p.mask || "", "es. 255.255.255.0 o /24");
          body += field("Gateway", "gateway", d.gateway || "", "es. 192.168.1.1");
        }
        body += '<div class="rl-field"><label>Ping verso</label><input type="text" data-f="pingto" placeholder="IP di destinazione"><div class="err"></div></div>';
        body += '<button class="btn btn-primary" style="width:100%;justify-content:center" data-act="pingfield" type="button">Invia ping ▶</button>';
      }
    } else if (d.type === "ap") {
      body += '<p style="color:var(--ink-soft);font-size:0.85rem;margin-bottom:0.8rem">L\'<b>Access Point</b> collega i dispositivi <b>wireless</b> alla rete cablata (lavora a livello 2). Avvicina un <b>Laptop</b> per associarlo: comparirà un collegamento tratteggiato.</p>';
      body += field("Nome", "name", d.name);
      body += '<p class="control-label" style="margin:0.6rem 0 0.4rem">Tabella MAC appresa</p>' + macTable(d);
    } else if (d.type === "server") {
      const p = d.ports[0];
      body += field("Nome", "name", d.name);
      body += '<div class="rl-field"><label>Funzione del server</label><select class="rl-select" data-f="role" style="width:100%"><option value="dhcp"' + (d.role === "dhcp" ? " selected" : "") + ">DHCP</option><option value=\"firewall\"" + (d.role === "firewall" ? " selected" : "") + ">Firewall</option><option value=\"web\"" + (d.role === "web" ? " selected" : "") + ">Web / DNS</option><option value=\"vpn\"" + (d.role === "vpn" ? " selected" : "") + ">VPN</option></select></div>";
      if (d.role !== "firewall") body += '<div class="rl-field-row"><div class="rl-field"><label>IP del server</label><input type="text" data-f="dip" value="' + escapeAttr(p.ip || "") + '"><div class="err"></div></div><div class="rl-field"><label>mask</label><input type="text" data-f="dmask" value="' + escapeAttr(p.mask || "") + '"></div></div>';
      if (d.role === "dhcp") {
        body += '<p style="color:var(--ink-soft);font-size:0.82rem;margin:0.2rem 0 0.6rem">Assegna automaticamente IP, maschera e gateway agli host in modalità DHCP (ciclo DORA).</p>';
        body += '<p class="control-label" style="margin:0.4rem 0 0.4rem">Pool di indirizzi</p>';
        body += '<div class="rl-field-row"><div class="rl-field"><label>da</label><input type="text" data-f="dpoolstart" value="' + escapeAttr(d.poolStart || "") + '" placeholder="192.168.0.100"></div><div class="rl-field"><label>a</label><input type="text" data-f="dpoolend" value="' + escapeAttr(d.poolEnd || "") + '" placeholder="192.168.0.150"></div></div>';
        body += field("Gateway da assegnare", "dgw", d.gateway || "", "es. 192.168.0.1");
      } else if (d.role === "firewall") {
        body += '<p style="color:var(--ink-soft);font-size:0.82rem;line-height:1.5;margin:0.2rem 0 0.6rem">Il <b>firewall</b> va messo <b>in linea</b> tra due parti della rete (come uno switch, con due cavi): controlla il traffico che lo attraversa e <b>blocca</b> i pacchetti da/verso gli IP nella lista.</p>';
        body += '<p class="control-label" style="margin:0.4rem 0 0.4rem">Regole — IP bloccati</p>';
        body += '<table class="rl-table"><tbody>' + (d.fwBlock.length ? d.fwBlock.map((ip, i) => '<tr><td>blocca ' + escapeHtml(ip) + '</td><td style="text-align:right"><span data-fwrm="' + i + '" style="color:#c0392b;cursor:pointer">×</span></td></tr>').join("") : '<tr><td class="empty">Nessuna regola (consenti tutto).</td></tr>') + "</tbody></table>";
        body += '<div class="rl-field" style="margin-top:0.6rem"><label>Blocca IP</label><input type="text" data-f="fwip" placeholder="es. 192.168.0.10"><div class="err" data-fwerr></div></div>';
        body += '<button class="ghost-btn" data-act="fwadd" type="button">＋ Aggiungi regola</button>';
      } else {
        body += '<p style="color:var(--ink-soft);font-size:0.82rem;line-height:1.5;margin:0.2rem 0 0.6rem">' + (d.role === "web" ? "Un <b>server Web/DNS</b> è un host con un indirizzo fisso: gli altri dispositivi lo raggiungono col ping (e nella realtà con HTTP o le query DNS)." : "Una <b>VPN</b> crea un «tunnel» cifrato per collegare in sicurezza reti o utenti remoti attraverso Internet. Qui è rappresentata come endpoint con un indirizzo: la simulazione del tunnel arriverà più avanti.") + "</p>";
      }
    } else if (d.type === "switch") {
      body += '<p style="color:var(--ink-soft);font-size:0.85rem;margin-bottom:0.8rem">Lo switch lavora a livello 2: non ha IP e impara da solo quali MAC stanno su quale porta.</p>';
      body += field("Nome", "name", d.name);
      body += '<p class="control-label" style="margin:0.6rem 0 0.4rem">Tabella MAC appresa</p>' + macTable(d);
    } else if (d.type === "router") {
      if (sideTab === "arp") sideTab = "config";
      body += tabsHtml([["config", "Interfacce"], ["routing", "Routing"]]);
      if (sideTab === "routing") {
        const mode = d.routingMode || "static";
        body += '<div class="rl-tabs" style="margin-bottom:0.8rem">' +
          '<button class="rl-tab ' + (mode === "static" ? "active" : "") + '" data-mode="static">Statico</button>' +
          '<button class="rl-tab ' + (mode === "rip" ? "active" : "") + '" data-mode="rip">RIP</button>' +
          '<button class="rl-tab ' + (mode === "ospf" ? "active" : "") + '" data-mode="ospf">OSPF</button></div>';
        body += '<p class="control-label" style="margin:0 0 0.4rem">Tabella di routing</p>' + routingTable(d);
        if (mode === "rip") {
          body += '<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.8rem" data-act="converge" type="button">▶ Fai convergere RIP</button>';
          body += '<p style="color:var(--ink-soft);font-size:0.82rem;line-height:1.5;margin-top:0.6rem">Con <b>RIP</b> i router si scambiano le tabelle e imparano le reti da soli (metrica = numero di <b>salti</b>). Premi il pulsante e guarda i round nel log.</p>';
        } else if (mode === "ospf") {
          body += '<button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:0.8rem" data-act="ospf" type="button">▶ Calcola OSPF (Dijkstra)</button>';
          body += '<p style="color:var(--ink-soft);font-size:0.82rem;line-height:1.5;margin-top:0.6rem">Con <b>OSPF</b> ogni router conosce l\'intera mappa della rete (<b>database link-state</b>) e calcola i percorsi a <b>costo minimo</b> con Dijkstra (costo 1 per collegamento). Guarda il database e il calcolo nel log.</p>';
        } else {
          body += '<p class="control-label" style="margin:1rem 0 0.4rem">Aggiungi rotta statica</p>';
          body += '<div class="rl-route-form"><div class="rl-field-row"><div class="rl-field"><label>Rete dest.</label><input type="text" data-f="snet" placeholder="10.0.2.0"></div><div class="rl-field"><label>Mask</label><input type="text" data-f="smask" placeholder="/24"></div></div>' +
            '<div class="rl-field"><label>Next hop</label><input type="text" data-f="snh" placeholder="10.0.1.2"></div>' +
            '<button class="ghost-btn" data-act="addroute" type="button">＋ Aggiungi rotta</button><div class="err" data-routeerr></div></div>';
        }
      } else {
        body += field("Nome", "name", d.name);
        body += '<p class="control-label" style="margin:0.6rem 0 0.4rem">Interfacce</p>';
        d.ports.forEach((p) => {
          const connected = p.linkId ? "" : " (scollegata)";
          body += '<div class="rl-field-row"><div class="rl-field"><label>' + p.name + " — IP" + connected + '</label><input type="text" data-f="rip" data-port="' + p.id + '" value="' + escapeAttr(p.ip || "") + '"><div class="err"></div></div>' +
            '<div class="rl-field"><label>mask</label><input type="text" data-f="rmask" data-port="' + p.id + '" value="' + escapeAttr(p.mask || "") + '"></div></div>';
        });
      }
    }
    body += '<button class="ghost-btn rl-del-btn" data-act="delete" type="button">Elimina ' + escapeHtml(d.name) + "</button></div>";
    sideEl.innerHTML = body;
    wireSide(d);
  }

  function tabsHtml(tabs) {
    return '<div class="rl-tabs">' + tabs.map((t) => '<button class="rl-tab ' + (sideTab === t[0] ? "active" : "") + '" onclick="__rlSetTab(\'' + t[0] + '\')">' + t[1] + "</button>").join("") + "</div>";
  }
  function field(label, f, val, ph) {
    return '<div class="rl-field"><label>' + escapeHtml(label) + '</label><input type="text" data-f="' + f + '" value="' + escapeAttr(val) + '"' + (ph ? ' placeholder="' + escapeAttr(ph) + '"' : "") + '><div class="err"></div></div>';
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
  function routingTable(d) {
    const routes = routesOf(d), showM = d.routingMode === "rip" || d.routingMode === "ospf", cols = showM ? 4 : 3;
    const mh = d.routingMode === "ospf" ? "Costo" : "M";
    let t = '<table class="rl-table"><thead><tr><th>Destinazione</th><th>Tipo</th>' + (showM ? "<th>" + mh + "</th>" : "") + "<th>Via</th></tr></thead><tbody>";
    if (!routes.length) t += '<tr><td class="empty" colspan="' + cols + '">Nessuna rotta — configura le interfacce.</td></tr>';
    else routes.forEach((r) => {
      const via = r.type === "connected" ? (r.port ? r.port.name : "—") : escapeHtml(r.nextHop);
      const rm = r.type === "static" ? ' <span data-rmroute="' + r.idx + '" style="color:#c0392b;cursor:pointer">×</span>' : "";
      const typeLbl = r.type === "connected" ? "connessa" : r.type === "rip" ? "RIP" : r.type === "ospf" ? "OSPF" : "statica";
      t += "<tr><td>" + intToIp(r.net) + "/" + r.cidr + "</td><td>" + typeLbl + "</td>" + (showM ? "<td>" + (r.metric != null ? r.metric : "") + "</td>" : "") + "<td>" + via + rm + "</td></tr>";
    });
    return t + "</tbody></table>";
  }

  function wireSide(d) {
    sideEl.querySelectorAll("input[data-f]").forEach((inp) => {
      inp.addEventListener("input", () => {
        const f = inp.dataset.f, v = inp.value, errEl = inp.parentElement.querySelector(".err");
        inp.classList.remove("invalid");
        const setErr = (m) => { inp.classList.add("invalid"); if (errEl) errEl.textContent = m; };
        const okErr = () => { if (errEl) errEl.textContent = ""; };
        if (f === "name") { d.name = v || d.name; render(); }
        else if (f === "ip") { if (v !== "" && ipToInt(v) === null) setErr("IP non valido"); else { okErr(); d.ports[0].ip = v || null; render(); } }
        else if (f === "mask") { if (v !== "" && parseMask(v) === null) setErr("Maschera non valida"); else { okErr(); d.ports[0].mask = v || null; } }
        else if (f === "gateway") { d.gateway = v; }
        else if (f === "rip") { const p = portById(inp.dataset.port); if (v !== "" && ipToInt(v) === null) setErr("IP non valido"); else { okErr(); p.ip = v || null; render(); } }
        else if (f === "rmask") { const p = portById(inp.dataset.port); if (v !== "" && parseMask(v) === null) setErr("Maschera non valida"); else { okErr(); p.mask = v || null; } }
        else if (f === "dip") { if (v !== "" && ipToInt(v) === null) setErr("IP non valido"); else { okErr(); d.ports[0].ip = v || null; render(); } }
        else if (f === "dmask") { if (v !== "" && parseMask(v) === null) setErr("Maschera non valida"); else { okErr(); d.ports[0].mask = v || null; } }
        else if (f === "dpoolstart") { d.poolStart = v; }
        else if (f === "dpoolend") { d.poolEnd = v; }
        else if (f === "dgw") { d.gateway = v; }
      });
    });
    const pingBtn = sideEl.querySelector('[data-act="pingfield"]');
    if (pingBtn) pingBtn.addEventListener("click", () => { const to = sideEl.querySelector('[data-f="pingto"]').value.trim(); if (!to) { setStatus("Scrivi l'IP di destinazione."); return; } startPing(d.id, to); });
    const addRoute = sideEl.querySelector('[data-act="addroute"]');
    if (addRoute) addRoute.addEventListener("click", () => {
      const net = sideEl.querySelector('[data-f="snet"]').value.trim();
      const mask = sideEl.querySelector('[data-f="smask"]').value.trim();
      const nh = sideEl.querySelector('[data-f="snh"]').value.trim();
      const errEl = sideEl.querySelector("[data-routeerr]");
      if (ipToInt(net) === null || parseMask(mask) === null || ipToInt(nh) === null) { errEl.textContent = "Compila rete, mask e next hop con valori validi."; return; }
      d.staticRoutes.push({ net, mask, nextHop: nh }); renderSide();
    });
    sideEl.querySelectorAll("[data-rmroute]").forEach((el) => el.addEventListener("click", () => { d.staticRoutes.splice(parseInt(el.dataset.rmroute, 10), 1); renderSide(); }));
    sideEl.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { d.routingMode = b.dataset.mode; if (d.routingMode !== "rip") d.ripTable = null; if (d.routingMode !== "ospf") d.ospfTable = null; renderSide(); }));
    const conv = sideEl.querySelector('[data-act="converge"]');
    if (conv) conv.addEventListener("click", () => runRip(true));
    const osp = sideEl.querySelector('[data-act="ospf"]');
    if (osp) osp.addEventListener("click", () => runOspf(true));
    sideEl.querySelectorAll("[data-ipmode]").forEach((b) => b.addEventListener("click", () => { d.ipMode = b.dataset.ipmode; if (d.ipMode === "dhcp") { d.ports[0].ip = null; d.ports[0].mask = null; } render(); renderSide(); }));
    const dhcpBtn = sideEl.querySelector('[data-act="dhcp"]');
    if (dhcpBtn) dhcpBtn.addEventListener("click", () => startDhcp(d.id));
    const roleSel = sideEl.querySelector('[data-f="role"]');
    if (roleSel) roleSel.addEventListener("change", () => { d.role = roleSel.value; render(); renderSide(); });
    const fwAdd = sideEl.querySelector('[data-act="fwadd"]');
    if (fwAdd) fwAdd.addEventListener("click", () => { const ip = sideEl.querySelector('[data-f="fwip"]').value.trim(); if (ipToInt(ip) === null) { sideEl.querySelector("[data-fwerr]").textContent = "Inserisci un IP valido."; return; } d.fwBlock.push(ip); renderSide(); });
    sideEl.querySelectorAll("[data-fwrm]").forEach((el) => el.addEventListener("click", () => { d.fwBlock.splice(parseInt(el.dataset.fwrm, 10), 1); renderSide(); }));
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
    const div = document.createElement("div"); div.className = "step " + (cls || ""); div.innerHTML = html;
    logEl.appendChild(div); logEl.scrollTop = logEl.scrollHeight;
  }
  function banner(text, ok) { bannerEl.className = "rl-banner show " + (ok ? "ok" : "err"); bannerEl.innerHTML = text; }

  /* ============================================================
     ROUTING — tabella e match
     ============================================================ */
  function connectedRoutes(router) {
    const routes = [];
    router.ports.forEach((p) => { if (p.ip && p.mask) { const m = parseMask(p.mask); routes.push({ net: (ipToInt(p.ip) & m) >>> 0, mask: m, cidr: maskToCidr(m), metric: 0, type: "connected", port: p }); } });
    return routes;
  }
  function routesOf(router) {
    if (router.routingMode === "rip") {
      if (router.ripTable && router.ripTable.length)
        return router.ripTable.map((e) => ({ net: e.net, mask: e.mask, cidr: e.cidr, metric: e.metric, type: e.nextHop ? "rip" : "connected", nextHop: e.nextHop, port: portById(e.exitPortId) }));
      return connectedRoutes(router); // RIP non ancora convergiuto: solo connesse
    }
    if (router.routingMode === "ospf") {
      if (router.ospfTable && router.ospfTable.length)
        return router.ospfTable.map((e) => ({ net: e.net, mask: e.mask, cidr: e.cidr, metric: e.cost, type: e.nextHop ? "ospf" : "connected", nextHop: e.nextHop, port: portById(e.exitPortId) }));
      return connectedRoutes(router);
    }
    const routes = connectedRoutes(router);
    (router.staticRoutes || []).forEach((r, i) => { const m = parseMask(r.mask), net = ipToInt(r.net); if (m === null || net === null) return; routes.push({ net: (net & m) >>> 0, mask: m, cidr: maskToCidr(m), type: "static", nextHop: r.nextHop, idx: i }); });
    return routes;
  }
  function matchRoute(router, dstIp) {
    let best = null;
    routesOf(router).forEach((r) => { if (((dstIp & r.mask) >>> 0) === r.net && (!best || r.cidr > best.cidr)) best = r; });
    return best;
  }
  function portForNextHop(router, nhIp) { return router.ports.find((p) => p.ip && p.mask && sameSubnet(ipToInt(p.ip), nhIp, parseMask(p.mask))); }

  /* ---------- RIP (distance-vector) ---------- */
  // vicini RIP: router che condividono una subnet con una nostra interfaccia (raggiungibili a L2)
  function ripNeighbors(router) {
    const out = [];
    router.ports.forEach((portR) => {
      if (!portR.ip || !portR.mask) return;
      const m = parseMask(portR.mask), netR = (ipToInt(portR.ip) & m) >>> 0;
      devices.forEach((nb) => {
        if (nb === router || nb.type !== "router") return;
        nb.ports.forEach((portN) => {
          if (!portN.ip || !portN.mask) return;
          const mN = parseMask(portN.mask);
          if (mN !== m || ((ipToInt(portN.ip) & mN) >>> 0) !== netR) return;
          if (l2PathFromPort(portR, ipToInt(portN.ip))) out.push({ neighbor: nb, portR, portN });
        });
      });
    });
    return out;
  }
  // fa convergere il RIP su tutti i router in modalità rip (round discreti, split-horizon).
  function runRip(verbose) {
    const rips = devices.filter((d) => d.type === "router" && d.routingMode === "rip");
    if (!rips.length) { if (verbose) { clearLog(); logStep("Nessun router in modalità RIP: attiva RIP su almeno un router.", "fail"); } return; }
    rips.forEach((r) => {
      r.ripTable = [];
      r.ports.forEach((p) => { if (p.ip && p.mask) { const m = parseMask(p.mask); r.ripTable.push({ net: (ipToInt(p.ip) & m) >>> 0, mask: m, cidr: maskToCidr(m), metric: 0, nextHop: null, exitPortId: p.id }); } });
    });
    if (verbose) { clearLog(); logStep('<span class="who">RIP</span> parte: ogni router conosce solo le sue reti <b>connesse</b> (metric 0). Ora si scambiano le tabelle, un salto per round.'); }
    let round = 0, changed = true;
    while (changed && round < 16) {
      changed = false; round++;
      const snap = rips.map((r) => ({ r, table: r.ripTable.map((x) => Object.assign({}, x)) }));
      const learned = [];
      rips.forEach((r) => {
        ripNeighbors(r).forEach(({ neighbor, portR, portN }) => {
          if (neighbor.routingMode !== "rip") return;
          const nTable = (snap.find((s) => s.r === neighbor) || {}).table || [];
          nTable.forEach((adv) => {
            if (adv.exitPortId === portN.id) return;        // split-horizon
            const cm = adv.metric + 1; if (cm >= 16) return; // 16 = infinito
            const ex = r.ripTable.find((x) => x.net === adv.net && x.mask === adv.mask);
            if (!ex) { r.ripTable.push({ net: adv.net, mask: adv.mask, cidr: adv.cidr, metric: cm, nextHop: portN.ip, exitPortId: portR.id }); changed = true; learned.push(r.name + " impara " + intToIp(adv.net) + "/" + adv.cidr + " da " + neighbor.name + " (metric " + cm + ")"); }
            else if (ex.metric > cm) { ex.metric = cm; ex.nextHop = portN.ip; ex.exitPortId = portR.id; changed = true; learned.push(r.name + " migliora " + intToIp(adv.net) + "/" + adv.cidr + " via " + neighbor.name + " (metric " + cm + ")"); }
          });
        });
      });
      if (verbose && learned.length) logStep('<span class="who">Round ' + round + '</span>: ' + learned.map(escapeHtml).join("; ") + ".");
    }
    if (verbose) logStep('<span class="who">RIP</span> ha <b>convergiuto</b> in ' + round + " round: ogni router ora conosce tutte le reti. Prova un ping!");
    if (selectedId) renderSide();
  }

  /* ---------- OSPF (link-state + Dijkstra) ---------- */
  function netKeyOfPort(p) { if (!p.ip || !p.mask) return null; const m = parseMask(p.mask); if (m === null) return null; return ((ipToInt(p.ip) & m) >>> 0) + "/" + maskToCidr(m); }
  // costruisce il database link-state e calcola, per ogni router OSPF, le rotte a costo minimo (Dijkstra).
  function runOspf(verbose) {
    const routers = devices.filter((d) => d.type === "router" && d.routingMode === "ospf");
    if (!routers.length) { if (verbose) { clearLog(); logStep("Nessun router in modalità OSPF: attiva OSPF su almeno un router.", "fail"); } return; }
    const COST = 1;
    // nodi-rete per COMPONENTI L2: stessa subnet E davvero raggiungibili a livello 2
    // (così togliendo un cavo i router non risultano più adiacenti e il percorso si ricalcola).
    const ifaces = [];
    routers.forEach((r) => r.ports.forEach((p) => { if (p.ip && p.mask) ifaces.push({ router: r, port: p, key: netKeyOfPort(p) }); }));
    const netNodes = [], usedI = {}, portNode = {};
    ifaces.forEach((it, i) => {
      if (usedI[i]) return; usedI[i] = 1;
      const members = [{ router: it.router, port: it.port }];
      for (let j = i + 1; j < ifaces.length; j++) {
        if (usedI[j] || ifaces[j].key !== it.key) continue;
        if (l2PathFromPort(it.port, ipToInt(ifaces[j].port.ip))) { usedI[j] = 1; members.push({ router: ifaces[j].router, port: ifaces[j].port }); }
      }
      const m = parseMask(it.port.mask), idx = netNodes.length;
      members.forEach((mem) => { portNode[mem.port.id] = idx; });
      netNodes.push({ net: (ipToInt(it.port.ip) & m) >>> 0, mask: m, cidr: maskToCidr(m), members });
    });

    if (verbose) {
      clearLog();
      logStep('<span class="who">OSPF</span> ogni router annuncia i suoi collegamenti (LSA): si forma il <b>database link-state</b> condiviso, uguale per tutti.');
      routers.forEach((r) => { const list = r.ports.filter((p) => p.ip && p.mask).map((p) => { const m = parseMask(p.mask); return intToIp((ipToInt(p.ip) & m) >>> 0) + "/" + maskToCidr(m); }); logStep('<span class="who">' + escapeHtml(r.name) + "</span> annuncia le reti " + list.map(escapeHtml).join(", ") + " (costo " + COST + " per interfaccia)."); });
    }

    routers.forEach((src) => {
      const dist = {}, prev = {}, start = "R" + src.id; dist[start] = 0;
      const pq = [[0, start]];
      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]); const top = pq.shift(), d = top[0], u = top[1];
        if (d > dist[u]) continue;
        const edges = [];
        if (u.charAt(0) === "R") { const rr = device(u.slice(1)); rr.ports.forEach((p) => { if (portNode[p.id] != null) edges.push(["N" + portNode[p.id], COST]); }); }
        else { const nn = netNodes[+u.slice(1)]; if (nn) nn.members.forEach((mem) => edges.push(["R" + mem.router.id, 0])); }
        edges.forEach((e) => { const nd = d + e[1]; if (dist[e[0]] == null || nd < dist[e[0]]) { dist[e[0]] = nd; prev[e[0]] = u; pq.push([nd, e[0]]); } });
      }
      src.ospfTable = [];
      netNodes.forEach((nn, idx) => {
        const nid = "N" + idx; if (dist[nid] == null) return;
        const own = nn.members.find((mem) => mem.router === src);
        if (own) { src.ospfTable.push({ net: nn.net, mask: nn.mask, cidr: nn.cidr, cost: COST, nextHop: null, exitPortId: own.port.id }); return; }
        const path = []; let cur = nid; while (cur != null) { path.unshift(cur); cur = prev[cur]; }
        const n1 = path[1], r2 = path[2]; if (!n1 || !r2) return;
        const node1 = netNodes[+n1.slice(1)], r2dev = device(r2.slice(1));
        const exitMem = node1.members.find((mem) => mem.router === src), nextMem = node1.members.find((mem) => mem.router === r2dev);
        if (!exitMem || !nextMem) return;
        src.ospfTable.push({ net: nn.net, mask: nn.mask, cidr: nn.cidr, cost: dist[nid], nextHop: nextMem.port.ip, exitPortId: exitMem.port.id });
      });
    });

    if (verbose) {
      logStep('<span class="who">Dijkstra</span> ogni router calcola le rotte a <b>costo minimo</b>. Rotte di ' + escapeHtml(routers[0].name) + ":");
      (routers[0].ospfTable || []).forEach((e) => logStep("• " + intToIp(e.net) + "/" + e.cidr + " — costo " + e.cost + (e.nextHop ? " via " + escapeHtml(e.nextHop) : " (connessa)")));
      logStep('<span class="who">OSPF</span> pronto: viene sempre scelto il percorso a costo minore. Prova un ping!');
    }
    if (selectedId) renderSide();
  }

  /* ============================================================
     LIVELLO 2 — consegna del frame su un segmento
     ============================================================ */
  // percorso (lista di device id) dalla porta di partenza fino al device che possiede targetIp,
  // attraversando solo switch. Null se non raggiungibile.
  function l2PathFromPort(startPort, targetIp) {
    const startDev = deviceOfPort(startPort.id);
    if (!startPort.linkId) return null;
    const first = otherEnd(startPort); if (!first) return null;
    const q = [[startDev.id, first.id]], seen = {}; seen[startDev.id] = 1; seen[first.id] = 1;
    while (q.length) {
      const path = q.shift(), last = device(path[path.length - 1]);
      if (!isTransit(last)) { if (ownsIp(last, targetIp)) return path; continue; }
      neighbors(last.id).forEach((nb) => { if (seen[nb.dev.id]) return; seen[nb.dev.id] = 1; q.push(path.concat(nb.dev.id)); });
    }
    return null;
  }

  /* ============================================================
     MOTORE — PING (L2 stessa rete + routing L3)
     ============================================================ */
  function startPing(srcId, dstIpStr) {
    if (animating) return;
    clearLog(); pingSrc = null; render();
    const src = device(srcId), sp = src.ports[0], dstIp = ipToInt(dstIpStr);
    if (!sp.ip || !sp.mask) return fail(src.name + " non ha IP o subnet mask configurati.");
    if (dstIp === null) return fail('"' + escapeHtml(dstIpStr) + "\" non è un indirizzo IP valido.");
    const srcIp = ipToInt(sp.ip), mask = parseMask(sp.mask);
    if (dstIp === srcIp) return fail("Stai pingando te stesso (" + escapeHtml(sp.ip) + ").");
    const finalOwner = hostPortWithIp(dstIp);
    if (!finalOwner) return fail("Nessun dispositivo in rete ha l'indirizzo " + escapeHtml(dstIpStr) + ".");

    logStep('<span class="who">' + escapeHtml(src.name) + "</span> vuole pingare <b>" + escapeHtml(dstIpStr) + "</b>.");
    const inSub = sameSubnet(srcIp, dstIp, mask);
    logStep("Maschera /" + maskToCidr(mask) + ": " + escapeHtml(sp.ip) + " e " + escapeHtml(dstIpStr) + (inSub ? " → <b>stessa rete</b>, consegna diretta." : " → <b>reti diverse</b>: serve il gateway."));

    let exitPort = sp, targetIp, senderMac = sp.mac;
    if (inSub) targetIp = dstIp;
    else {
      if (!src.gateway) return fail(src.name + " è su un'altra rete ma non ha un <b>gateway predefinito</b> impostato.");
      const gw = ipToInt(src.gateway);
      if (gw === null) return fail("Il gateway di " + src.name + " non è un IP valido.");
      if (!sameSubnet(srcIp, gw, mask)) return fail("Il gateway " + escapeHtml(src.gateway) + " non è nella stessa rete di " + src.name + ".");
      targetIp = gw;
      logStep('<span class="who">' + escapeHtml(src.name) + "</span> manda il pacchetto al gateway <b>" + escapeHtml(src.gateway) + "</b>.");
    }

    const segs = []; let ttl = 64, guard = 0;
    while (true) {
      if (++guard > 16) return fail("Troppi salti: forse c'è un anello di instradamento.");
      const l2 = l2PathFromPort(exitPort, targetIp);
      if (!l2) return fail("Non c'è un percorso a livello 2 verso <b>" + intToIp(targetIp) + "</b>: controlla i <b>cavi</b> (o che il gateway sia raggiungibile).");
      const arrived = device(l2[l2.length - 1]), ownerPort = portWithIpOn(arrived, targetIp), sender = deviceOfPort(exitPort.id);
      logStep('<span class="who">ARP</span> ' + escapeHtml(sender.name) + ": «Chi ha " + intToIp(targetIp) + "?» → " + escapeHtml(arrived.name) + " (" + escapeHtml(ownerPort ? ownerPort.mac : "?") + ").", "arp");
      sender.arp = sender.arp || {}; if (ownerPort) sender.arp[intToIp(targetIp)] = ownerPort.mac;
      segs.push({ path: l2, mac: senderMac });
      if (arrived === finalOwner.dev && ownsIp(arrived, dstIp)) break;
      if (arrived.type !== "router") return fail("Il pacchetto è arrivato a " + escapeHtml(arrived.name) + ", che non è la destinazione e non sa instradare.");
      ttl--; if (ttl <= 0) return fail("TTL scaduto: il pacchetto ha fatto troppi salti.");
      const route = matchRoute(arrived, dstIp);
      if (!route) return fail("Il router <b>" + escapeHtml(arrived.name) + "</b> non ha una <b>rotta</b> verso " + escapeHtml(dstIpStr) + ". Aggiungi una rotta statica o controlla gli indirizzi.");
      let np, ntip, viaTxt;
      if (route.type === "connected") { np = route.port; ntip = dstIp; viaTxt = "rete connessa su " + np.name; }
      else if (route.type === "rip" || route.type === "ospf") { np = route.port; if (!np) return fail("Rotta " + route.type.toUpperCase() + " senza interfaccia d'uscita valida su " + escapeHtml(arrived.name) + "."); ntip = ipToInt(route.nextHop); viaTxt = route.type.toUpperCase() + " next hop " + route.nextHop + " (" + np.name + ", costo " + route.metric + ")"; }
      else { np = portForNextHop(arrived, ipToInt(route.nextHop)); if (!np) return fail("Il router " + escapeHtml(arrived.name) + " ha una rotta con next hop " + escapeHtml(route.nextHop) + " non raggiungibile."); ntip = ipToInt(route.nextHop); viaTxt = "next hop " + route.nextHop + " (" + np.name + ")"; }
      logStep('<span class="who">' + escapeHtml(arrived.name) + "</span> consulta la tabella → rotta <b>" + intToIp(route.net) + "/" + route.cidr + "</b> via " + viaTxt + ". TTL=" + ttl + ".");
      exitPort = np; targetIp = ntip; senderMac = np.mac;
    }

    // percorso completo
    const fullIds = [];
    segs.forEach((s, i) => s.path.forEach((id, j) => { if (i > 0 && j === 0) return; fullIds.push(id); }));

    // controllo FIREWALL: un server-firewall in linea può bloccare il traffico
    const sIpStr = sp.ip, dIpStr = dstIpStr;
    for (const id of fullIds) {
      const dv = device(id);
      if (dv.type === "server" && dv.role === "firewall" && dv.fwBlock && dv.fwBlock.length) {
        const hit = dv.fwBlock.indexOf(sIpStr) !== -1 ? sIpStr : (dv.fwBlock.indexOf(dIpStr) !== -1 ? dIpStr : null);
        if (hit) return fail("🔥 Il firewall <b>" + escapeHtml(dv.name) + "</b> ha <b>bloccato</b> il traffico: c'è una regola che blocca l'IP " + escapeHtml(hit) + ".");
      }
    }

    // animazione del percorso completo
    animating = true;
    const pts = fullIds.map((id) => center(device(id)));
    segs.forEach((s) => learnAlong(s.path, s.mac));
    highlightPath(fullIds, true);
    logStep('<span class="who">' + escapeHtml(src.name) + "</span> invia l'<b>echo request</b> verso " + escapeHtml(finalOwner.dev.name) + ".");
    animateAlong(pts, "", () => {
      logStep('<span class="who">' + escapeHtml(finalOwner.dev.name) + "</span> riceve e rispedisce l'<b>echo reply</b> indietro.");
      animateAlong(pts.slice().reverse(), "reply", () => {
        highlightPath(fullIds, false); animating = false;
        const routers = fullIds.filter((id) => device(id).type === "router").length;
        banner("✅ <b>Ping riuscito!</b> " + escapeHtml(src.name) + " ↔ " + escapeHtml(finalOwner.dev.name) + (routers ? " — attraverso " + routers + " router" : " — stessa rete") + ".", true);
        logStep('<span class="who">' + escapeHtml(src.name) + "</span> ha ricevuto la risposta. <b>Comunicazione riuscita.</b>");
        if (selectedId) renderSide();
      });
    });
  }

  function fail(msg) { animating = false; banner("❌ " + msg, false); logStep(msg, "fail"); return null; }

  function learnAlong(path, mac) {
    for (let i = 0; i < path.length; i++) { const d = device(path[i]); if (!isTransit(d) || !d.macTable) continue; const prev = device(path[i - 1]); if (prev) d.macTable[mac] = prev.name; }
  }
  function highlightPath(ids, on) {
    const set = new Set();
    for (let i = 0; i < ids.length - 1; i++) {
      const a = ids[i], b = ids[i + 1];
      const l = links.find((x) => { const da = deviceOfPort(x.a).id, db = deviceOfPort(x.b).id; return (da === a && db === b) || (da === b && db === a); });
      if (l) set.add(l.id);
    }
    gLinks.querySelectorAll(".rl-link").forEach((p) => p.classList.toggle("active", on && set.has(p.dataset.link)));
  }
  function animateAlong(pts, cls, done) {
    if (pts.length < 2) { done && done(); return; }
    const dot = document.createElementNS(SVGNS, "circle");
    dot.setAttribute("class", "rl-packet " + cls); dot.setAttribute("r", "8");
    dot.setAttribute("cx", pts[0].x); dot.setAttribute("cy", pts[0].y);
    gAnim.appendChild(dot);
    const speed = parseInt(speedEl.value, 10) || 5, segMs = Math.max(140, 700 - speed * 55);
    let seg = 0, t0 = Date.now();
    const tick = setInterval(function () {
      let p = (Date.now() - t0) / segMs;
      while (p >= 1 && seg < pts.length - 2) { seg++; t0 = Date.now(); p = 0; }
      if (seg >= pts.length - 2 && p >= 1) { clearInterval(tick); if (dot.parentNode) gAnim.removeChild(dot); done && done(); return; }
      const a = pts[seg], b = pts[seg + 1], tt = Math.min(1, Math.max(0, p));
      dot.setAttribute("cx", a.x + (b.x - a.x) * tt); dot.setAttribute("cy", a.y + (b.y - a.y) * tt);
    }, 30);
  }

  /* ============================================================
     DHCP — assegnazione automatica indirizzi (ciclo DORA)
     ============================================================ */
  // percorso L2 dalla porta fino al primo dispositivo del tipo dato (broadcast attraverso switch/AP)
  function l2PathTo(startPort, matchFn) {
    const startDev = deviceOfPort(startPort.id); if (!startPort.linkId) return null;
    const first = otherEnd(startPort); if (!first) return null;
    const q = [[startDev.id, first.id]], seen = {}; seen[startDev.id] = 1; seen[first.id] = 1;
    while (q.length) {
      const path = q.shift(), last = device(path[path.length - 1]);
      if (matchFn(last)) return path;
      if (!isTransit(last)) continue;
      neighbors(last.id).forEach((nb) => { if (seen[nb.dev.id]) return; seen[nb.dev.id] = 1; q.push(path.concat(nb.dev.id)); });
    }
    return null;
  }
  function dhcpOffer(server) {
    const start = ipToInt(server.poolStart), end = ipToInt(server.poolEnd);
    for (let n = start; n <= end; n++) { const ipStr = intToIp(n); if (devices.some((d) => d.ports.some((p) => p.ip === ipStr))) continue; if (server.leases && server.leases[ipStr]) continue; return ipStr; }
    return null;
  }
  function startDhcp(hostId) {
    if (animating) return;
    clearLog();
    const host = device(hostId), port = host.ports[0];
    const path = l2PathTo(port, (d) => d.type === "server" && d.role === "dhcp");
    if (!path) return fail("Nessun <b>server DHCP</b> raggiungibile da " + escapeHtml(host.name) + " su questa rete (controlla i collegamenti / l'associazione Wi-Fi).");
    const server = device(path[path.length - 1]);
    if (ipToInt(server.poolStart) === null || ipToInt(server.poolEnd) === null) return fail("Il server DHCP " + escapeHtml(server.name) + " non ha un pool di indirizzi valido.");
    const offered = dhcpOffer(server);
    if (!offered) return fail("Il pool del server DHCP è esaurito.");
    const mask = server.ports[0].mask || "255.255.255.0";
    logStep('<span class="who">' + escapeHtml(host.name) + "</span> non ha un IP → invia <b>DHCP Discover</b> in broadcast: «C'è un server DHCP in ascolto?»", "arp");
    logStep('<span class="who">' + escapeHtml(server.name) + "</span> risponde con <b>DHCP Offer</b>: propone " + offered + " / " + mask + (server.gateway ? ", gateway " + escapeHtml(server.gateway) : "") + ".", "arp");
    logStep('<span class="who">' + escapeHtml(host.name) + "</span> invia <b>DHCP Request</b>: «Accetto " + offered + "».", "arp");
    logStep('<span class="who">' + escapeHtml(server.name) + "</span> conferma con <b>DHCP Ack</b>: indirizzo assegnato.", "arp");
    server.leases[offered] = host.name;
    port.ip = offered; port.mask = mask; if (server.gateway) host.gateway = server.gateway;
    animating = true;
    const pts = path.map((id) => center(device(id)));
    animateAlong(pts, "", () => animateAlong(pts.slice().reverse(), "reply", () => {
      animating = false;
      banner("✅ <b>" + escapeHtml(host.name) + "</b> ha ricevuto via DHCP l'indirizzo <b>" + offered + "</b> / " + mask + (host.gateway ? " (gateway " + escapeHtml(host.gateway) + ")" : "") + ". Ora puoi pingare.", true);
      render(); if (selectedId) renderSide();
    }));
  }

  /* ============================================================
     INTERAZIONE TELA
     ============================================================ */
  let drag = null, pan = null;
  svg.addEventListener("pointerdown", (e) => {
    const delEl = e.target.closest(".rl-del"), linkEl = e.target.closest(".rl-link-hit, .rl-link"), devEl = e.target.closest(".rl-dev");
    if (delEl) { e.preventDefault(); deleteDevice(delEl.dataset.del); return; }
    if (devEl) {
      const id = devEl.dataset.dev;
      if (tool === "cable") { e.preventDefault(); handleCableClick(id); return; }
      if (tool === "ping") { e.preventDefault(); handlePingClick(id); return; }
      selectedId = id; sideTab = (sideTab === "arp" || sideTab === "routing") ? sideTab : "config"; renderSide(); render();
      const d = device(id);
      drag = { id, moved: false, sx: e.clientX, sy: e.clientY, ox: d.x, oy: d.y };
      const g = gDevices.querySelector('[data-dev="' + id + '"]'); if (g) g.classList.add("dragging");
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      return;
    }
    if (linkEl) { e.preventDefault(); removeLink(linkEl.dataset.link); return; }
    // sfondo vuoto: deseleziona e avvia il PAN (trascina lo sfondo per spostare la vista)
    if (tool === "cable" && cableFrom) { cableFrom = null; setStatus("Cavo annullato."); render(); }
    if (selectedId) { selectedId = null; renderSide(); render(); }
    pan = { sx: e.clientX, sy: e.clientY, sl: stageWrap.scrollLeft, st: stageWrap.scrollTop };
    svg.classList.add("panning");
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener("pointermove", (e) => {
    if (pan) { stageWrap.scrollLeft = pan.sl - (e.clientX - pan.sx); stageWrap.scrollTop = pan.st - (e.clientY - pan.sy); return; }
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const d = device(drag.id);
    d.x = Math.max(0, Math.min(CANVAS_W - DW, drag.ox + dx)); d.y = Math.max(0, Math.min(CANVAS_H - DH, drag.oy + dy));
    const g = gDevices.querySelector('[data-dev="' + drag.id + '"]'); if (g) g.setAttribute("transform", "translate(" + d.x + "," + d.y + ")");
    updateLinkPaths();
  });
  svg.addEventListener("pointerup", () => {
    if (pan) { pan = null; svg.classList.remove("panning"); }
    if (drag) { const moved = drag.moved; const g = gDevices.querySelector('[data-dev="' + drag.id + '"]'); if (g) g.classList.remove("dragging"); drag = null; if (moved) render(); }
  });

  function handleCableClick(id) {
    if (!cableFrom) { cableFrom = id; setStatus("Cavo: ora clicca il secondo dispositivo (" + device(id).name + " selezionato)."); render(); }
    else { connect(cableFrom, id); cableFrom = null; }
  }
  function handlePingClick(id) {
    const d = device(id);
    if (d.type !== "pc" && d.type !== "wpc") { setStatus("Il ping parte da un PC o un Laptop. Cliccane uno."); return; }
    if (!pingSrc) { pingSrc = id; setStatus("Ping: ora clicca il PC di destinazione."); render(); return; }
    if (id === pingSrc) { pingSrc = null; setStatus("Ping annullato."); render(); return; }
    const dst = device(id), dstIp = dst.ports[0].ip;
    if (!dstIp) { setStatus(dst.name + " non ha un IP. Assegnalo prima."); return; }
    const srcId = pingSrc; pingSrc = null; render(); startPing(srcId, dstIp);
  }

  /* ============================================================
     TOOLBAR
     ============================================================ */
  function setTool(t) {
    tool = t; cableFrom = null; pingSrc = null;
    document.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === t));
    setStatus(t === "cable" ? "Modalità cavo: clicca due dispositivi per collegarli." : t === "ping" ? "Modalità ping: clicca il PC di partenza, poi quello di arrivo." : "Modalità seleziona: trascina i dispositivi, clicca un cavo per rimuoverlo.");
    render();
  }
  document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => addDevice(b.dataset.add)));
  document.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));
  document.getElementById("rlReset").addEventListener("click", () => loadScenario(document.getElementById("rlScenario").value));
  document.getElementById("rlScenario").addEventListener("change", (e) => loadScenario(e.target.value));

  /* ============================================================
     SCENARI
     ============================================================ */
  function spawn(type, x, y) { const d = makeDevice(type, x, y); devices.push(d); return d; }
  function mkLink(a, b) { const pa = freePort(a), pb = freePort(b); const l = { id: uid("link"), a: pa.id, b: pb.id }; pa.linkId = l.id; pb.linkId = l.id; links.push(l); }
  function setIp(dev, i, ip, mask) { dev.ports[i].ip = ip; dev.ports[i].mask = mask; }

  function loadScenario(name) {
    devices = []; links = []; idc = 0; macc = 0; selectedId = null; cableFrom = null; pingSrc = null; animating = false;
    clearLog(); logEl.innerHTML = '<div class="rl-log-empty">Costruisci la rete e premi «Ping» (o usa il pulsante nel pannello di un PC). Qui comparirà la spiegazione passo-passo.</div>';
    setTool("select");

    if (name === "switch2pc") {
      const pc1 = spawn("pc", 60, 60); setIp(pc1, 0, "192.168.1.10", "255.255.255.0");
      const sw = spawn("switch", 360, 180);
      const pc2 = spawn("pc", 60, 300); setIp(pc2, 0, "192.168.1.20", "255.255.255.0");
      mkLink(pc1, sw); mkLink(pc2, sw);
    } else if (name === "direct") {
      const pc1 = spawn("pc", 80, 150); setIp(pc1, 0, "10.0.0.1", "255.255.255.0");
      const pc2 = spawn("pc", 420, 150); setIp(pc2, 0, "10.0.0.2", "255.255.255.0");
      mkLink(pc1, pc2);
    } else if (name === "router1") {
      const pc1 = spawn("pc", 40, 40); setIp(pc1, 0, "192.168.1.10", "255.255.255.0"); pc1.gateway = "192.168.1.1";
      const sw1 = spawn("switch", 230, 50);
      const r1 = spawn("router", 430, 150); setIp(r1, 0, "192.168.1.1", "255.255.255.0"); setIp(r1, 1, "192.168.2.1", "255.255.255.0");
      const sw2 = spawn("switch", 230, 320);
      const pc2 = spawn("pc", 40, 320); setIp(pc2, 0, "192.168.2.10", "255.255.255.0"); pc2.gateway = "192.168.2.1";
      mkLink(pc1, sw1); mkLink(sw1, r1); mkLink(pc2, sw2); mkLink(sw2, r1);
    } else if (name === "router2") {
      const pc1 = spawn("pc", 30, 150); setIp(pc1, 0, "10.0.0.10", "255.255.255.0"); pc1.gateway = "10.0.0.1";
      const r1 = spawn("router", 210, 150); setIp(r1, 0, "10.0.0.1", "255.255.255.0"); setIp(r1, 1, "10.0.1.1", "255.255.255.0");
      r1.staticRoutes = [{ net: "10.0.2.0", mask: "255.255.255.0", nextHop: "10.0.1.2" }];
      const r2 = spawn("router", 400, 150); setIp(r2, 0, "10.0.1.2", "255.255.255.0"); setIp(r2, 1, "10.0.2.1", "255.255.255.0");
      r2.staticRoutes = [{ net: "10.0.0.0", mask: "255.255.255.0", nextHop: "10.0.1.1" }];
      const pc2 = spawn("pc", 580, 150); setIp(pc2, 0, "10.0.2.10", "255.255.255.0"); pc2.gateway = "10.0.2.1";
      mkLink(pc1, r1); mkLink(r1, r2); mkLink(r2, pc2);
    } else if (name === "rip3") {
      const pc1 = spawn("pc", 20, 250); setIp(pc1, 0, "10.1.0.10", "255.255.255.0"); pc1.gateway = "10.1.0.1";
      const r1 = spawn("router", 170, 140); setIp(r1, 0, "10.1.0.1", "255.255.255.0"); setIp(r1, 1, "10.1.12.1", "255.255.255.0"); r1.routingMode = "rip";
      const r2 = spawn("router", 330, 140); setIp(r2, 0, "10.1.12.2", "255.255.255.0"); setIp(r2, 1, "10.1.23.2", "255.255.255.0"); r2.routingMode = "rip";
      const r3 = spawn("router", 490, 140); setIp(r3, 0, "10.1.23.3", "255.255.255.0"); setIp(r3, 1, "10.1.3.1", "255.255.255.0"); r3.routingMode = "rip";
      const pc2 = spawn("pc", 640, 250); setIp(pc2, 0, "10.1.3.10", "255.255.255.0"); pc2.gateway = "10.1.3.1";
      mkLink(pc1, r1); mkLink(r1, r2); mkLink(r2, r3); mkLink(r3, pc2);
      runRip(false); // converge in silenzio: funziona subito. Apri un router → Routing per vedere le rotte RIP, o premi «Fai convergere RIP» per rivedere i round.
    } else if (name === "ospf3") {
      // triangolo R1-R2-R3 (percorso alternativo): OSPF sceglie il costo minimo
      const pc1 = spawn("pc", 30, 60); setIp(pc1, 0, "10.2.1.10", "255.255.255.0"); pc1.gateway = "10.2.1.1";
      const r1 = spawn("router", 210, 60); setIp(r1, 0, "10.2.1.1", "255.255.255.0"); setIp(r1, 1, "10.2.12.1", "255.255.255.0"); setIp(r1, 2, "10.2.13.1", "255.255.255.0"); r1.routingMode = "ospf";
      const r2 = spawn("router", 430, 230); setIp(r2, 0, "10.2.12.2", "255.255.255.0"); setIp(r2, 1, "10.2.23.2", "255.255.255.0"); r2.routingMode = "ospf";
      const r3 = spawn("router", 210, 380); setIp(r3, 0, "10.2.23.3", "255.255.255.0"); setIp(r3, 1, "10.2.13.3", "255.255.255.0"); setIp(r3, 2, "10.2.3.1", "255.255.255.0"); r3.routingMode = "ospf";
      const pc2 = spawn("pc", 30, 380); setIp(pc2, 0, "10.2.3.10", "255.255.255.0"); pc2.gateway = "10.2.3.1";
      mkLink(pc1, r1); mkLink(r1, r2); mkLink(r2, r3); mkLink(r1, r3); mkLink(r3, pc2);
      runOspf(false); // calcola in silenzio: PC1↔PC2 passa per il percorso diretto R1-R3 (costo 2), non via R2 (costo 3).
    } else if (name === "wifi") {
      const pc1 = spawn("pc", 40, 50); setIp(pc1, 0, "192.168.0.10", "255.255.255.0"); pc1.gateway = "192.168.0.1";
      const sw = spawn("switch", 250, 60);
      const srv = spawn("server", 40, 290); srv.role = "dhcp"; setIp(srv, 0, "192.168.0.2", "255.255.255.0"); srv.poolStart = "192.168.0.100"; srv.poolEnd = "192.168.0.150"; srv.gateway = "192.168.0.1";
      const ap = spawn("ap", 280, 290);
      const lap = spawn("wpc", 500, 290); lap.ipMode = "dhcp";
      mkLink(pc1, sw); mkLink(srv, sw); mkLink(ap, sw);
      // il Laptop si associa da solo all'AP; poi: aprilo → «Richiedi indirizzo (DHCP)» → ping a 192.168.0.10
    } else if (name === "firewall") {
      const pc1 = spawn("pc", 40, 120); setIp(pc1, 0, "192.168.5.10", "255.255.255.0");
      const fw = spawn("server", 240, 120); fw.role = "firewall"; fw.fwBlock = ["192.168.5.20"];
      const sw = spawn("switch", 440, 130);
      const pc2 = spawn("pc", 640, 120); setIp(pc2, 0, "192.168.5.20", "255.255.255.0");
      mkLink(pc1, fw); mkLink(fw, sw); mkLink(pc2, sw);
      // il firewall è in linea e blocca 192.168.5.20: il ping PC1→PC2 fallisce. Apri il Firewall e togli la regola per farlo passare.
    }
    render(); renderSide();
  }

  loadScenario("switch2pc");
})();
