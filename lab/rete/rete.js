/* ============================================================
   rete.js — TCP/IP Packet Voyager
   Incapsulamento/decapsulamento a passi, guidato dallo scroll
   (stile scrollytelling) e dai pulsanti. Sincronizza OSI e TCP/IP.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const N = 8; // passi 0..8

  /* ---------- Dati (valori reali e fittizi coerenti) ---------- */
  const NET = {
    host: "www.example.com",
    ipSrc: "192.168.1.10",
    ipDst: "93.184.216.34",
    macSrc: "A4:5E:60:C1:2D:0A",
    macDst: "3C:22:FB:8F:11:E9",
    portSrc: 49152,
  };
  let msg = "Ciao";
  let proto = "https"; // https | http
  const portDst = () => (proto === "https" ? 443 : 80);
  const protoName = () => (proto === "https" ? "HTTPS" : "HTTP");

  /* ---------- Stato ---------- */
  let step = 0;

  /* ---------- Definizione livelli del pacchetto ----------
     ogni livello: presente in [add..strip], evidenziato in add/strip */
  const LAYERS = {
    eth: { add: 3, strip: 5 },
    ip:  { add: 2, strip: 6 },
    tcp: { add: 1, strip: 7 },
    data:{ add: 0, strip: 99 },
  };
  function layerOn(l) { return step >= LAYERS[l].add && step <= LAYERS[l].strip; }

  // livello "attivo" (in lavorazione) per ciascun passo → chiave app/tcp/ip/eth/phy
  const ACTIVE = ["app", "tcp", "ip", "eth", "phy", "eth", "ip", "tcp", "app"];

  /* ---------- Elementi ---------- */
  const els = {};
  ["f-macd","f-macs","f-ips","f-ipd","f-ports","f-portd","f-payload","dataTag",
   "clientMsg","serverMsg","lblClientIp","lblServerIp","travel","dossier","progress",
   "btnPrev","btnNext","packet","bits"].forEach((id) => els[id] = $(id));

  // converte una stringa nei suoi bit ASCII (per il livello fisico)
  function toBits(s) {
    return (s || "").slice(0, 4).split("").map((ch) =>
      ch.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
  }

  /* ---------- Riempi i valori statici ---------- */
  function fillValues() {
    els["f-macd"].textContent = NET.macDst;
    els["f-macs"].textContent = NET.macSrc;
    els["f-ips"].textContent = NET.ipSrc;
    els["f-ipd"].textContent = NET.ipDst;
    els["f-ports"].textContent = NET.portSrc;
    els["f-portd"].textContent = portDst();
    els["f-payload"].textContent = msg || "(vuoto)";
    els["dataTag"].textContent = protoName() + " · Dati applicativi";
    els["clientMsg"].textContent = msg || "…";
    els["lblClientIp"].textContent = NET.ipSrc;
    els["lblServerIp"].textContent = NET.ipDst;
  }

  /* ---------- Dossier per passo ---------- */
  function dossier() {
    const f = (rows) => rows.map((r) => `<div class="df"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("");
    const P = portDst();
    const D = {
      0: { layer: "app", phase: "Discesa · Livello Applicazione",
           title: protoName() + " — i dati nascono qui",
           fields: [["Protocollo", protoName()], ["Host", NET.host], ["Messaggio", msg || "(vuoto)"]],
           proto: "HTTP · HTTPS · DNS · FTP · SMTP · SSH",
           note: "Il messaggio è un <b>blocco di dati puro</b>. Ora scende nella pila: ogni livello gli aggiungerà la propria intestazione." },
      1: { layer: "tcp", phase: "Discesa · Livello Trasporto",
           title: "TCP avvolge i dati",
           fields: [["Porta sorgente", NET.portSrc], ["Porta destinazione", P], ["N° sequenza", "1001"], ["Flag", "PSH, ACK"]],
           proto: "TCP · UDP",
           note: "L'header <b>TCP</b> aggiunge le <b>porte</b>: la porta destinazione <b>" + P + "</b> dice a quale applicazione del server consegnare. L'unità ora si chiama <b>segmento</b>." },
      2: { layer: "ip", phase: "Discesa · Livello Rete",
           title: "IP aggiunge gli indirizzi",
           fields: [["IP sorgente", NET.ipSrc], ["IP destinazione", NET.ipDst], ["TTL", "64"], ["Protocollo", "6 (TCP)"], ["Versione", "IPv4"]],
           proto: "IP · ICMP · ARP",
           note: "L'header <b>IP</b> aggiunge gli <b>indirizzi logici</b>: dove si trovano i due computer in Internet. Ora è un <b>pacchetto</b>." },
      3: { layer: "eth", phase: "Discesa · Accesso alla rete",
           title: "Ethernet incornicia tutto",
           fields: [["MAC destinazione", NET.macDst], ["MAC sorgente", NET.macSrc], ["EtherType", "0x0800 (IPv4)"], ["Coda", "FCS (checksum)"]],
           proto: "Ethernet · Wi-Fi 802.11 · PPP",
           note: "Il <b>frame Ethernet</b> aggiunge gli <b>indirizzi fisici (MAC)</b> per il primo salto, più una coda di controllo (FCS). Il pacchetto è pronto: premi <b>Invia</b>." },
      4: { layer: "phy", phase: "Transito · Livello Fisico (OSI 1)",
           title: "Dal frame ai bit: la trasmissione",
           fields: [["Unità (PDU)", "bit"], ["Mezzo", "rame (UTP) · fibra · radio"], ["Segnale", "tensione · luce · onde"], ["«" + (msg || "?")[0] + "» in ASCII", toBits((msg || "?")[0])]],
           proto: "Livello Fisico: cavo UTP/RJ45 · fibra ottica · Wi-Fi · segnali",
           note: "Qui non si aggiunge nessun header: il <b>livello fisico</b> prende il frame e lo trasforma in una <b>sequenza di bit</b> (0 e 1), poi in <b>segnali</b> fisici — impulsi di tensione sul rame, lampi di luce nella fibra, onde radio nel Wi-Fi — che viaggiano sul mezzo fino al server. Definisce cavi, connettori, voltaggi e velocità (es. 1 Gbps). Premi <b>Step Su</b> per farlo ricomporre in frame al server." },
      5: { layer: "eth", phase: "Salita · Accesso alla rete",
           title: "Il server apre Ethernet",
           fields: [["MAC destinazione", NET.macDst], ["È il mio MAC?", "Sì ✓"]],
           proto: "Ethernet",
           note: "Il server controlla il <b>MAC destinazione</b>: corrisponde alla sua scheda di rete. Verifica la FCS, <b>rimuove il frame Ethernet</b> e passa il contenuto al livello superiore." },
      6: { layer: "ip", phase: "Salita · Livello Rete",
           title: "Il server apre IP",
           fields: [["IP destinazione", NET.ipDst], ["È il mio IP?", "Sì ✓"]],
           proto: "IP",
           note: "Controlla l'<b>IP destinazione</b>: è suo. <b>Rimuove l'header IP</b> e consegna il segmento al livello Trasporto." },
      7: { layer: "tcp", phase: "Salita · Livello Trasporto",
           title: "Il server apre TCP",
           fields: [["Porta destinazione", P], ["Consegna a", protoName()]],
           proto: "TCP",
           note: "Legge la <b>porta " + P + "</b> → i dati vanno all'applicazione <b>" + protoName() + "</b>. <b>Rimuove l'header TCP</b>: restano solo i dati originali." },
      8: { layer: "app", phase: "Consegna · Livello Applicazione",
           title: "Messaggio consegnato",
           fields: [["Protocollo", protoName()], ["Mittente", NET.ipSrc], ["Dati ricevuti", msg || "(vuoto)"]],
           proto: "HTTP · HTTPS",
           note: "L'applicazione del server legge i <b>dati originali</b>: «<b>" + (msg || "") + "</b>». Incapsulamento e decapsulamento completati!" },
    }[step];

    els.dossier.style.setProperty("--lc",
      D.layer ? `var(--c-${D.layer === "app" ? "app" : D.layer})` : "var(--accent)");
    els.dossier.innerHTML =
      `<div class="dossier-phase">${D.phase}</div>` +
      `<div class="dossier-title">${D.title}</div>` +
      `<div class="dossier-fields">${f(D.fields)}</div>` +
      `<div class="dossier-proto">Protocolli: <b>${D.proto}</b></div>` +
      `<div class="dossier-note">${D.note}</div>`;
  }

  /* ---------- Render completo del passo ---------- */
  function render() {
    // pacchetto: on/off + active
    const act = ACTIVE[step];
    [["eth","eth"],["ip","ip"],["tcp","tcp"],["data","app"]].forEach(([l, key]) => {
      const node = els.packet.querySelector(`.lyr[data-l="${l}"]`);
      node.classList.toggle("off", !layerOn(l));
      node.classList.toggle("active", act === key && layerOn(l));
    });

    // evidenzia rail + tabella di confronto (data-also: l'Accesso copre L2 + L1)
    document.querySelectorAll(".rail-row, .osi, .proto, .tcp-box").forEach((e) => {
      e.classList.toggle("active", e.dataset.layer === act || e.dataset.also === act);
    });

    // scena: PC attivi + transito
    const atServer = step >= 5;
    document.getElementById("pcClient").classList.toggle("active", step <= 3);
    document.getElementById("pcServer").classList.toggle("active", step >= 5);
    els.clientMsg.classList.add("show");
    els.serverMsg.textContent = step >= 8 ? (msg || "") : "";
    els.serverMsg.classList.toggle("show", step >= 8);

    // pacchetto in transito
    els.travel.classList.toggle("show", step >= 3 && step <= 5);
    els.travel.style.left = step <= 3 ? "8%" : "92%";
    els.travel.classList.toggle("moving", step === 4);

    // livello fisico: bit che scorrono sul cavo
    if (els.bits) {
      els.bits.textContent = toBits(msg) || "0 1 0 1";
      els.bits.classList.toggle("show", step === 4);
    }

    // dossier + progresso + controlli
    dossier();
    renderProgress();
    renderControls();
  }

  function renderProgress() {
    const phase = step <= 3 ? "Incapsulamento (discesa)" : step === 4 ? "Transito · Livello Fisico" : "Decapsulamento (salita)";
    let bars = "";
    for (let i = 1; i <= N; i++) bars += `<i class="${i <= step ? "done" : ""}"></i>`;
    els.progress.innerHTML = `Passo <b>${step}</b> / ${N} — ${phase}<div class="bar">${bars}</div>`;
  }

  function renderControls() {
    els["btnPrev"].disabled = step === 0;
    const next = els["btnNext"];
    if (step < 3) next.textContent = "Scendi ↓";
    else if (step === 3) next.textContent = "Invia ▶";
    else if (step === 4) next.textContent = "Apri · Step Su ↑";
    else if (step < 8) next.textContent = "Step Su ↑";
    else next.textContent = "Ricomincia ⟲";
  }

  /* ---------- Navigazione tra i passi ---------- */
  function goto(s, fromButton) {
    s = Math.max(0, Math.min(N, s));
    if (s === step && !fromButton) return;
    step = s;
    render();
    if (fromButton) scrollToStep(s);
  }
  function next() { if (step >= N) { goto(0, true); } else goto(step + 1, true); }
  function prev() { goto(step - 1, true); }

  /* ---------- Scrollytelling ---------- */
  const wrap = $("voyager"), stage = $("stage");
  let startY = 0, total = 0, stepPx = 300, syncing = false;
  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

  function layout() {
    // Su telefono lo scrollytelling è disattivato: scena in flusso normale,
    // si avanza solo con i pulsanti (niente spazi vuoti di scroll).
    if (isMobile()) { wrap.style.height = ""; total = 0; return; }
    stepPx = Math.max(200, Math.round(window.innerHeight * 0.52));
    const sh = stage.offsetHeight;
    wrap.style.height = (sh + N * stepPx) + "px";
    total = N * stepPx;
    startY = wrap.offsetTop - 74;
  }
  function onScroll() {
    if (syncing || total <= 0) return;
    const p = (window.scrollY - startY) / total;
    const s = Math.max(0, Math.min(N, Math.round(p * N)));
    if (s !== step) { step = s; render(); }
  }
  function scrollToStep(s) {
    if (total <= 0) return; // mobile: niente scroll, solo render
    syncing = true;
    const target = startY + (s / N) * total + 2;
    window.scrollTo({ top: target, behavior: "smooth" });
    setTimeout(() => { syncing = false; }, 520);
  }

  /* ---------- Eventi ---------- */
  $("msg").addEventListener("input", (e) => { msg = e.target.value; fillValues(); render(); });
  $("protoSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-proto]"); if (!b) return;
    proto = b.dataset.proto;
    $("protoSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    fillValues(); render();
  });
  els["btnNext"].addEventListener("click", next);
  els["btnPrev"].addEventListener("click", prev);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { layout(); });

  /* ---------- Avvio ---------- */
  fillValues();
  render();
  // layout dopo che i font/elementi sono pronti
  if (document.readyState === "complete") layout();
  else window.addEventListener("load", layout);
  setTimeout(layout, 300);
})();
