/* ============================================================
   hardware.js — PC Assembly Lab
   Catalogo componenti + motore di compatibilità e diagnostica.
   Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- Catalogo (valori realistici) ---------- */
  const CAT = {
    cpu: [
      { id: "i512400f", name: "Intel Core i5-12400F", socket: "LGA1700", tdp: 65, tier: 6, price: 150, igpu: false },
      { id: "i714700k", name: "Intel Core i7-14700K", socket: "LGA1700", tdp: 125, tier: 9, price: 400, igpu: true },
      { id: "r55600", name: "AMD Ryzen 5 5600", socket: "AM4", tdp: 65, tier: 6, price: 130, igpu: false },
      { id: "r57600", name: "AMD Ryzen 5 7600", socket: "AM5", tdp: 65, tier: 7, price: 200, igpu: true },
      { id: "r77800", name: "AMD Ryzen 7 7800X3D", socket: "AM5", tdp: 120, tier: 10, price: 350, igpu: true },
    ],
    mobo: [
      { id: "b660m", name: "MSI B660M · mATX", socket: "LGA1700", ram: "DDR4", form: "mATX", price: 110 },
      { id: "z790", name: "ASUS Z790 · ATX", socket: "LGA1700", ram: "DDR5", form: "ATX", price: 220 },
      { id: "b550", name: "Gigabyte B550 · ATX", socket: "AM4", ram: "DDR4", form: "ATX", price: 100 },
      { id: "b650", name: "MSI B650 · ATX", socket: "AM5", ram: "DDR5", form: "ATX", price: 180 },
      { id: "b650i", name: "ASRock B650I · ITX", socket: "AM5", ram: "DDR5", form: "ITX", price: 210 },
    ],
    ram: [
      { id: "d4_16", name: "16 GB DDR4-3200", type: "DDR4", price: 40 },
      { id: "d4_32", name: "32 GB DDR4-3600", type: "DDR4", price: 80 },
      { id: "d5_16", name: "16 GB DDR5-6000", type: "DDR5", price: 65 },
      { id: "d5_32", name: "32 GB DDR5-6000", type: "DDR5", price: 115 },
    ],
    gpu: [
      { id: "igpu", name: "Nessuna (grafica integrata)", length: 0, tdp: 0, tier: 3, price: 0, integrated: true },
      { id: "rtx4060", name: "GeForce RTX 4060", length: 245, tdp: 115, tier: 6, price: 300 },
      { id: "rx7600", name: "Radeon RX 7600", length: 240, tdp: 165, tier: 6, price: 270 },
      { id: "rtx4070s", name: "GeForce RTX 4070 Super", length: 304, tdp: 220, tier: 8, price: 600 },
      { id: "rtx4080s", name: "GeForce RTX 4080 Super", length: 336, tdp: 320, tier: 10, price: 1000 },
    ],
    psu: [
      { id: "p450", name: "450 W · 80+ Bronze", watt: 450, price: 45 },
      { id: "p550", name: "550 W · 80+ Bronze", watt: 550, price: 60 },
      { id: "p650", name: "650 W · 80+ Gold", watt: 650, price: 85 },
      { id: "p850", name: "850 W · 80+ Gold", watt: 850, price: 130 },
      { id: "p1000", name: "1000 W · 80+ Platinum", watt: 1000, price: 190 },
    ],
    case_: [
      { id: "itx", name: "Mini-ITX", forms: ["ITX"], maxGpu: 280, price: 90 },
      { id: "matx", name: "Micro-ATX", forms: ["ITX", "mATX"], maxGpu: 320, price: 70 },
      { id: "mid", name: "ATX Mid Tower", forms: ["ITX", "mATX", "ATX"], maxGpu: 360, price: 100 },
      { id: "compact", name: "ATX Compatto", forms: ["ITX", "mATX", "ATX"], maxGpu: 295, price: 115 },
    ],
  };

  const TYPES = [
    { key: "cpu", label: "CPU", ico: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2 M6 6h12v12H6z M9 9h6v6H9z" },
    { key: "mobo", label: "Scheda madre", ico: "M3 3h18v18H3z M6 6h5v5H6z M14 7h3M14 10h3M7 17h10" },
    { key: "ram", label: "RAM", ico: "M3 7h18v8H3z M6 15v3M10 15v3M14 15v3M18 15v3 M6 10h2M10 10h2M14 10h2" },
    { key: "gpu", label: "Scheda video", ico: "M3 6h16v9H3z M7 18v-3M13 18v-3 M8 9a2 2 0 100 4 2 2 0 000-4 M14 9a2 2 0 100 4 2 2 0 000-4" },
    { key: "psu", label: "Alimentatore", ico: "M3 5h18v14H3z M7 9a3 3 0 100 6 3 3 0 000-6 M15 9h3M15 12h3" },
    { key: "case_", label: "Case", ico: "M6 3h12v18H6z M9 6h6M9 9h6 M9 18a1 1 0 102 0 1 1 0 00-2 0" },
  ];

  const PRESETS = {
    gaming: { cpu: "i714700k", mobo: "z790", ram: "d5_32", gpu: "rtx4080s", psu: "p850", case_: "mid" },
    economica: { cpu: "r55600", mobo: "b550", ram: "d4_16", gpu: "rtx4060", psu: "p550", case_: "mid" },
    ufficio: { cpu: "r57600", mobo: "b650", ram: "d5_16", gpu: "igpu", psu: "p450", case_: "compact" },
    problemi: { cpu: "r77800", mobo: "b660m", ram: "d5_16", gpu: "rtx4080s", psu: "p450", case_: "itx" },
  };

  let sel = {};

  const get = (type, id) => CAT[type].find((x) => x.id === id);
  const cur = (type) => get(type, sel[type]);

  /* ---------- Render configuratore ---------- */
  function renderConfig() {
    $("config").innerHTML = TYPES.map((t) =>
      `<div class="cfg-row" data-type="${t.key}">` +
        `<span class="cfg-label"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${t.ico}"/></svg>${t.label}</span>` +
        `<select class="cfg-select" data-type="${t.key}">` +
          CAT[t.key].map((c) => `<option value="${c.id}" ${c.id === sel[t.key] ? "selected" : ""}>${esc(c.name)}</option>`).join("") +
        `</select></div>`
    ).join("");
  }

  /* ---------- Motore di diagnostica ---------- */
  function diagnose() {
    const cpu = cur("cpu"), mobo = cur("mobo"), ram = cur("ram"), gpu = cur("gpu"), psu = cur("psu"), cs = cur("case_");
    const checks = [];
    const add = (ok, title, detail, warn) => checks.push({ ok, warn: !!warn, title, detail });

    // 1. socket CPU ↔ scheda madre
    add(cpu.socket === mobo.socket, "Socket CPU ↔ scheda madre",
      cpu.socket === mobo.socket ? `Entrambi ${cpu.socket}.` : `La CPU è ${cpu.socket}, la scheda madre è ${mobo.socket}: non si incastrano.`);

    // 2. tipo di RAM
    add(ram.type === mobo.ram, "Tipo di RAM ↔ scheda madre",
      ram.type === mobo.ram ? `La scheda madre supporta ${ram.type}.` : `Hai scelto ${ram.type}, ma la scheda madre vuole ${mobo.ram}.`);

    // 3. form factor scheda madre ↔ case
    add(cs.forms.indexOf(mobo.form) >= 0, "Scheda madre ↔ case",
      cs.forms.indexOf(mobo.form) >= 0 ? `Una ${mobo.form} entra in un case ${cs.name}.` : `Una scheda ${mobo.form} non entra in un case ${cs.name} (accetta: ${cs.forms.join(", ")}).`);

    // 4. lunghezza GPU ↔ case
    if (gpu.integrated) add(true, "Spazio per la GPU", "Grafica integrata: nessun ingombro.");
    else add(gpu.length <= cs.maxGpu, "Lunghezza GPU ↔ case",
      gpu.length <= cs.maxGpu ? `La GPU (${gpu.length} mm) entra (max ${cs.maxGpu} mm).` : `La GPU è lunga ${gpu.length} mm, ma il case arriva a ${cs.maxGpu} mm.`);

    // 5. la CPU senza iGPU ha bisogno di una scheda video
    if (gpu.integrated && !cpu.igpu)
      add(false, "Uscita video", `La ${cpu.name} non ha grafica integrata: senza scheda video il PC non mostra nulla.`);

    // 6. alimentazione
    const load = cpu.tdp + gpu.tdp + 70;            // resto del sistema ~70 W
    const recommended = Math.ceil((load * 1.6) / 50) * 50;
    add(psu.watt >= load * 1.3, "Alimentazione sufficiente",
      psu.watt >= load * 1.3
        ? `${psu.watt} W coprono il consumo stimato di ~${load} W.`
        : `Consumo stimato ~${load} W: ${psu.watt} W sono troppo pochi.`);
    if (psu.watt >= load * 1.3 && psu.watt > recommended + 250)
      add(true, "Alimentatore sovradimensionato", `${psu.watt} W per un sistema da ~${load} W: spesa eccessiva, ne basterebbero ${recommended} W.`, true);

    // ---------- bottleneck ----------
    let bottleneck = null;
    if (!gpu.integrated) {
      const d = gpu.tier - cpu.tier;
      if (d >= 3) bottleneck = { warn: true, t: "Collo di bottiglia: CPU", m: `La GPU è molto più potente della CPU: nei giochi la CPU la frena.` };
      else if (d <= -3) bottleneck = { warn: true, t: "Collo di bottiglia: GPU", m: `La CPU è molto più potente della GPU: per giocare meglio servirebbe una GPU più forte.` };
      else bottleneck = { warn: false, t: "Componenti bilanciati", m: `CPU e GPU sono di livello simile: nessun collo di bottiglia evidente.` };
    }

    render(checks, { load, recommended, psu, bottleneck }, { cpu, mobo, ram, gpu, psu, cs });
  }

  function render(checks, info, parts) {
    const fails = checks.filter((c) => !c.ok && !c.warn).length;
    const warns = checks.filter((c) => c.warn).length + (info.bottleneck && info.bottleneck.warn ? 1 : 0);

    // verdetto
    const v = $("verdict");
    if (fails > 0) { v.className = "verdict bad"; v.innerHTML = `<span class="v-ico">✗</span> ${fails} problem${fails > 1 ? "i" : "a"} da risolvere`; }
    else if (warns > 0) { v.className = "verdict ok"; v.innerHTML = `<span class="v-ico">✓</span> Compatibile, con qualche avviso`; }
    else { v.className = "verdict ok"; v.innerHTML = `<span class="v-ico">✓</span> Configurazione compatibile!`; }

    // evidenzia i select con errore
    document.querySelectorAll(".cfg-row").forEach((r) => r.classList.remove("bad"));

    // checks
    $("checks").innerHTML = checks.map((c) => {
      const cls = c.ok ? (c.warn ? "warn" : "pass") : "fail";
      const ico = c.ok ? (c.warn ? "!" : "✓") : "✗";
      return `<div class="check ${cls}"><span class="ci">${ico}</span><div><div class="ct"><b>${esc(c.title)}</b></div><div class="cd">${esc(c.detail)}</div></div></div>`;
    }).join("");

    // misuratori: alimentazione + bottleneck
    const pct = Math.min(100, Math.round((info.load / info.psu.watt) * 100));
    const fillCls = info.psu.watt < info.load * 1.3 ? "over" : info.psu.watt > info.recommended + 250 ? "warn" : "";
    let metersHtml =
      `<div class="meter"><div class="meter-head"><b>Consumo / alimentatore</b><span>~${info.load} W su ${info.psu.watt} W</span></div>` +
      `<div class="meter-track"><div class="meter-fill ${fillCls}" style="width:${pct}%"></div></div>` +
      `<div class="meter-note">Consigliato: <b>${info.recommended} W</b> (con margine).</div></div>`;
    if (info.bottleneck) {
      metersHtml += `<div class="meter"><div class="meter-head"><b>${esc(info.bottleneck.t)}</b></div>` +
        `<div class="meter-note" style="margin-top:0">${esc(info.bottleneck.m)}</div></div>`;
    }
    $("meters").innerHTML = metersHtml;

    // riepilogo + prezzo
    const order = [["cpu", "CPU"], ["mobo", "Scheda madre"], ["ram", "RAM"], ["gpu", "Scheda video"], ["psu", "Alimentatore"], ["cs", "Case"]];
    let total = 0;
    const rows = order.map(([k, l]) => { total += parts[k].price; return `<div class="sl"><span>${l}</span><b>${esc(parts[k].name)} · ${parts[k].price} €</b></div>`; }).join("");
    $("summary").innerHTML = `<span class="control-label" style="display:block;margin-bottom:0.6rem">Riepilogo build</span>` +
      `<div class="summary-list">${rows}</div>` +
      `<div class="summary-total"><span class="st-lbl">Totale</span><span class="st-val">${total} €</span></div>`;
  }

  /* ---------- Eventi ---------- */
  $("config").addEventListener("change", (e) => {
    const s = e.target.closest(".cfg-select"); if (!s) return;
    sel[s.dataset.type] = s.value; diagnose();
  });
  $("presets").innerHTML = [["gaming", "Gaming"], ["economica", "Economica"], ["ufficio", "Ufficio (iGPU)"], ["problemi", "Da correggere ⚠"]]
    .map(([k, l]) => `<button type="button" class="example-chip" data-p="${k}">${l}</button>`).join("");
  $("presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    sel = Object.assign({}, PRESETS[b.dataset.p]);
    renderConfig(); diagnose();
  });

  /* ---------- Avvio ---------- */
  sel = Object.assign({}, PRESETS.economica);
  renderConfig();
  diagnose();
})();
