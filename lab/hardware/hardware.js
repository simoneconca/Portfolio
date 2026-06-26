/* ============================================================
   hardware.js — PC Assembly Lab (percorso guidato, approfondito)
   8 componenti, un passo alla volta, con spiegazione dei termini
   tecnici (core, GHz, VRAM, TDP, MHz, NVMe...). Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------- Catalogo ---------- */
  const CPU = [
    { id: "i513400", emoji: "🔵", name: "Intel Core i5-13400", tag: "Equilibrata", socket: "LGA1700", tdp: 65, tier: 6, price: 200,
      desc: "Ottima per studio, ufficio e gioco leggero. Ha la grafica integrata.",
      specs: [["Core / Thread", "10 core · 16 thread"], ["Frequenza", "2,5 → 4,6 GHz"], ["Socket", "LGA1700"], ["Consumo (TDP)", "65 W"]] },
    { id: "r57600", emoji: "🔴", name: "AMD Ryzen 5 7600", tag: "Equilibrata", socket: "AM5", tdp: 65, tier: 7, price: 230,
      desc: "Moderna e parca nei consumi, con grafica integrata.",
      specs: [["Core / Thread", "6 core · 12 thread"], ["Frequenza", "3,8 → 5,1 GHz"], ["Socket", "AM5"], ["Consumo (TDP)", "65 W"]] },
    { id: "r77800", emoji: "🔴", name: "AMD Ryzen 7 7800X3D", tag: "Potente", socket: "AM5", tdp: 120, tier: 10, price: 350,
      desc: "Tra le migliori per i giochi; scalda di più e va raffreddata bene.",
      specs: [["Core / Thread", "8 core · 16 thread"], ["Frequenza", "4,2 → 5,0 GHz"], ["Socket", "AM5"], ["Consumo (TDP)", "120 W"]] },
  ];
  const MOBO = [
    { id: "b660", emoji: "🟩", name: "MSI B660M", socket: "LGA1700", ram: "DDR4", m2: 2, form: "mATX", price: 110,
      desc: "Compatta ed economica per CPU Intel.",
      specs: [["Socket", "LGA1700"], ["Chipset", "B660"], ["Memorie", "DDR4"], ["Slot M.2", "2"], ["Formato", "mATX"]] },
    { id: "b760", emoji: "🟩", name: "ASUS B760 ATX", socket: "LGA1700", ram: "DDR5", m2: 3, form: "ATX", price: 190,
      desc: "Più grande e moderna, con memorie DDR5.",
      specs: [["Socket", "LGA1700"], ["Chipset", "B760"], ["Memorie", "DDR5"], ["Slot M.2", "3"], ["Formato", "ATX"]] },
    { id: "a620", emoji: "🟥", name: "ASRock A620M", socket: "AM5", ram: "DDR5", m2: 2, form: "mATX", price: 120,
      desc: "Compatta per AMD, ottimo rapporto qualità/prezzo.",
      specs: [["Socket", "AM5"], ["Chipset", "A620"], ["Memorie", "DDR5"], ["Slot M.2", "2"], ["Formato", "mATX"]] },
    { id: "b650", emoji: "🟥", name: "MSI B650 ATX", socket: "AM5", ram: "DDR5", m2: 3, form: "ATX", price: 180,
      desc: "Grande ed espandibile per AMD.",
      specs: [["Socket", "AM5"], ["Chipset", "B650"], ["Memorie", "DDR5"], ["Slot M.2", "3"], ["Formato", "ATX"]] },
  ];
  const RAM = [
    { id: "d4_16", emoji: "🟦", name: "16 GB DDR4", type: "DDR4", price: 40, desc: "Abbastanza per studio e giochi normali.",
      specs: [["Tipo", "DDR4"], ["Capacità", "16 GB (2×8)"], ["Velocità", "3200 MHz"]] },
    { id: "d4_32", emoji: "🟦", name: "32 GB DDR4", type: "DDR4", price: 80, desc: "Tanta, per montaggio e tanti programmi insieme.",
      specs: [["Tipo", "DDR4"], ["Capacità", "32 GB (2×16)"], ["Velocità", "3600 MHz"]] },
    { id: "d5_16", emoji: "🟪", name: "16 GB DDR5", type: "DDR5", price: 60, desc: "Più veloce, abbastanza per quasi tutto.",
      specs: [["Tipo", "DDR5"], ["Capacità", "16 GB (2×8)"], ["Velocità", "6000 MHz"]] },
    { id: "d5_32", emoji: "🟪", name: "32 GB DDR5", type: "DDR5", price: 110, desc: "Veloce e abbondante, a prova di futuro.",
      specs: [["Tipo", "DDR5"], ["Capacità", "32 GB (2×16)"], ["Velocità", "6000 MHz"]] },
  ];
  const STORAGE = [
    { id: "hdd1", emoji: "💽", name: "Hard Disk 1 TB", price: 40, desc: "Tanto spazio a poco prezzo, ma lento: meglio per archiviare.",
      specs: [["Tecnologia", "HDD (meccanico)"], ["Capacità", "1 TB"], ["Lettura", "~150 MB/s"]] },
    { id: "sata500", emoji: "📀", name: "SSD SATA 500 GB", price: 45, desc: "Veloce e accessibile, ottimo per il sistema.",
      specs: [["Tecnologia", "SSD SATA"], ["Capacità", "500 GB"], ["Lettura", "~550 MB/s"]] },
    { id: "nvme1", emoji: "⚡", name: "SSD NVMe 1 TB", tag: "veloce", price: 75, desc: "Su slot M.2: velocissimo, il PC si avvia in pochi secondi.",
      specs: [["Tecnologia", "SSD NVMe (M.2)"], ["Capacità", "1 TB"], ["Lettura", "~3500 MB/s"]] },
    { id: "nvme2", emoji: "⚡", name: "SSD NVMe 2 TB", tag: "veloce", price: 140, desc: "Velocissimo e capiente: per giochi e progetti grandi.",
      specs: [["Tecnologia", "SSD NVMe (M.2)"], ["Capacità", "2 TB"], ["Lettura", "~7000 MB/s"]] },
  ];
  const GPU = [
    { id: "igpu", emoji: "✅", name: "Grafica integrata", tag: "gratis", length: 0, tdp: 0, tier: 3, price: 0, integrated: true,
      desc: "È già dentro la CPU: gratis, perfetta per studio e navigazione.",
      specs: [["Memoria video", "usa la RAM"], ["Consumo", "0 W"], ["Ingombro", "nessuno"]] },
    { id: "rtx4060", emoji: "🎮", name: "GeForce RTX 4060", length: 245, tdp: 115, tier: 6, price: 300,
      desc: "Buona per giocare in Full HD (1080p).",
      specs: [["Memoria (VRAM)", "8 GB"], ["Consumo", "115 W"], ["Lunghezza", "245 mm"]] },
    { id: "rx7800", emoji: "🎮", name: "Radeon RX 7800 XT", length: 267, tdp: 263, tier: 8, price: 500,
      desc: "Tanta memoria video, ottima per 1440p.",
      specs: [["Memoria (VRAM)", "16 GB"], ["Consumo", "263 W"], ["Lunghezza", "267 mm"]] },
    { id: "rtx4070s", emoji: "🎮", name: "GeForce RTX 4070 Super", tag: "potente", length: 285, tdp: 220, tier: 9, price: 600,
      desc: "Per giocare alla grande, anche in 1440p e oltre.",
      specs: [["Memoria (VRAM)", "12 GB"], ["Consumo", "220 W"], ["Lunghezza", "285 mm"]] },
  ];
  const COOLER = [
    { id: "stock", emoji: "🌀", name: "Dissipatore in dotazione", maxTdp: 65, height: 55, price: 0,
      desc: "Quello incluso con la CPU: gratis, va bene per le CPU non troppo calde.",
      specs: [["Tipo", "ad aria"], ["Raffredda fino a", "65 W"], ["Altezza", "55 mm"]] },
    { id: "tower", emoji: "🗼", name: "Dissipatore a torre", maxTdp: 200, height: 160, price: 40,
      desc: "Una grande ventola: silenzioso e tiene fresca la CPU.",
      specs: [["Tipo", "ad aria"], ["Raffredda fino a", "200 W"], ["Altezza", "160 mm"]] },
    { id: "aio", emoji: "💧", name: "Raffreddamento a liquido (AIO 240)", maxTdp: 300, height: 35, price: 95,
      desc: "Liquido in un circuito chiuso: per le CPU più potenti e calde.",
      specs: [["Tipo", "a liquido (AIO)"], ["Raffredda fino a", "300 W"], ["Radiatore", "240 mm"]] },
  ];
  const PSU = [
    { id: "p450", emoji: "🔌", name: "Alimentatore 450 W", watt: 450, price: 45, desc: "Per PC senza scheda video, a basso consumo.",
      specs: [["Potenza", "450 W"], ["Efficienza", "80+ Bronze"]] },
    { id: "p550", emoji: "🔌", name: "Alimentatore 550 W", watt: 550, price: 60, desc: "Una buona via di mezzo.",
      specs: [["Potenza", "550 W"], ["Efficienza", "80+ Bronze"]] },
    { id: "p650", emoji: "🔌", name: "Alimentatore 650 W", watt: 650, price: 85, desc: "Con margine per una scheda video di fascia media.",
      specs: [["Potenza", "650 W"], ["Efficienza", "80+ Gold"]] },
    { id: "p850", emoji: "🔌", name: "Alimentatore 850 W", watt: 850, price: 130, desc: "Tanta energia, per i PC più potenti.",
      specs: [["Potenza", "850 W"], ["Efficienza", "80+ Gold"]] },
  ];
  const CASE = [
    { id: "small", emoji: "📦", name: "Case piccolo (Micro)", forms: ["ITX", "mATX"], maxGpu: 300, maxCooler: 162, price: 70,
      desc: "Occupa poco spazio; accetta schede madri fino a mATX.",
      specs: [["Schede madri", "ITX, mATX"], ["GPU max", "300 mm"], ["Dissipatore max", "162 mm"]] },
    { id: "mid", emoji: "📦", name: "Case medio (ATX)", forms: ["ITX", "mATX", "ATX"], maxGpu: 360, maxCooler: 170, price: 100,
      desc: "Il più comune: c'è posto per tutto ed è facile da montare.",
      specs: [["Schede madri", "ITX, mATX, ATX"], ["GPU max", "360 mm"], ["Dissipatore max", "170 mm"]] },
    { id: "big", emoji: "📦", name: "Case grande (Full)", forms: ["ITX", "mATX", "ATX"], maxGpu: 420, maxCooler: 185, price: 150,
      desc: "Spazioso e arieggiato, per i PC più potenti.",
      specs: [["Schede madri", "ITX, mATX, ATX"], ["GPU max", "420 mm"], ["Dissipatore max", "185 mm"]] },
  ];

  const power = (b) => b.cpu.tdp + (b.gpu ? b.gpu.tdp : 0) + 80;
  const suggestedW = (b) => Math.ceil((power(b) * 1.5) / 50) * 50;

  /* ---------- Passi ---------- */
  const STEPS = [
    { key: "cpu", emoji: "🧠", title: "La CPU — il cervello", type: "CPU",
      intro: () => "La <b>CPU</b> è il cervello del computer. Due cose contano: i <b>core</b> (nuclei) sono quanti compiti può svolgere <b>in parallelo</b> — più core, più cose insieme; la <b>frequenza</b> in <b>GHz</b> (gigahertz) dice quante operazioni al secondo fa ogni core — più GHz, più è veloce. I <b>thread</b> sono i compiti virtuali (spesso il doppio dei core). Il <b>socket</b> è la forma dell'attacco con la scheda madre.",
      options: () => CPU,
      callout: (c) => `Hai scelto una CPU con socket <b>${c.socket}</b> e consumo <b>${c.tdp} W</b>. Ricorda il socket: la scheda madre dovrà avere lo stesso!` },

    { key: "mobo", emoji: "🛠️", title: "La scheda madre — la base", type: "Scheda madre",
      intro: (b) => `La <b>scheda madre</b> collega tutto. Il <b>socket</b> deve combaciare con la CPU (la tua è <b>${b.cpu.socket}</b>). Il <b>chipset</b> decide le funzioni disponibili; supporta un solo tipo di RAM (<b>DDR4</b> o <b>DDR5</b>); gli slot <b>M.2</b> ospitano gli SSD veloci; il <b>formato</b> (ATX, mATX) è la dimensione, che dovrà entrare nel case.`,
      options: (b) => MOBO.filter((m) => m.socket === b.cpu.socket),
      callout: (c) => `Questa scheda usa memorie <b>${c.ram}</b> ed è formato <b>${c.form}</b>: la RAM dovrà essere ${c.ram} e il case dovrà accettare una ${c.form}.` },

    { key: "ram", emoji: "💾", title: "La RAM — la memoria di lavoro", type: "RAM",
      intro: (b) => `La <b>RAM</b> è la memoria di lavoro (sparisce a PC spento). Contano la <b>capacità</b> in GB (più GB = più programmi aperti insieme) e la <b>velocità</b> in <b>MHz</b> (più alta = più scorrevole). Il <b>tipo</b> deve essere quello della scheda madre: <b>${b.mobo.ram}</b>.`,
      options: (b) => RAM.filter((r) => r.type === b.mobo.ram),
      callout: (c) => `${c.specs[1][1]} di RAM ${c.type}: ottimo. Ne hai abbastanza per lavorare comodamente.` },

    { key: "storage", emoji: "🗄️", title: "L'archiviazione — dove salvi i file", type: "Archiviazione",
      intro: () => "Qui restano i tuoi file e i programmi anche a PC spento. Un <b>HDD</b> (disco meccanico) costa poco e ha tanto spazio, ma è <b>lento</b>. Un <b>SSD</b> è molto più veloce; gli <b>SSD NVMe</b> (sullo slot M.2) sono i più rapidi (migliaia di <b>MB/s</b>). Conta la <b>capacità</b> e la <b>velocità di lettura</b>.",
      options: () => STORAGE,
      callout: (c) => `${c.specs[0][1]}, ${c.specs[2][1]}: ${/NVMe/.test(c.specs[0][1]) ? "il sistema sarà velocissimo!" : "una buona scelta."}` },

    { key: "gpu", emoji: "🎮", title: "La scheda video", type: "Scheda video",
      intro: () => "La <b>scheda video (GPU)</b> disegna le immagini: fondamentale per i <b>giochi</b> e il montaggio video. Conta la <b>memoria video (VRAM)</b> in GB (serve per texture e alte risoluzioni) e il <b>consumo</b> in W. La tua CPU ha già una grafica integrata: per studio e navigazione basta quella.",
      options: () => GPU,
      callout: (c) => c.integrated ? "Userai la grafica già dentro la CPU: risparmi e consumi pochissimo." : `Con <b>${c.specs[0][1]}</b> di memoria video giochi bene. Attenzione: consuma <b>${c.tdp} W</b>, ne terremo conto per l'alimentatore.` },

    { key: "cooler", emoji: "❄️", title: "Il dissipatore — il raffreddamento", type: "Dissipatore",
      intro: (b) => `La CPU scalda: il <b>dissipatore</b> la tiene fresca, altrimenti rallenta o si spegne. Deve riuscire a smaltire il calore della CPU (il suo <b>TDP</b>, qui <b>${b.cpu.tdp} W</b>). Può essere ad <b>aria</b> (una ventola) o a <b>liquido</b> (AIO) per le CPU più calde. Ti mostro solo quelli adatti:`,
      options: (b) => COOLER.filter((c) => c.maxTdp >= b.cpu.tdp),
      callout: (c) => `Bene: questo dissipatore smaltisce fino a <b>${c.maxTdp} W</b>, più che sufficiente per la tua CPU.` },

    { key: "psu", emoji: "🔌", title: "L'alimentatore — l'energia", type: "Alimentatore",
      intro: (b) => `L'<b>alimentatore</b> dà energia a tutto. Contano la <b>potenza</b> in W (deve bastare per tutti i componenti) e l'<b>efficienza</b> (80+ Bronze, Gold…): più alta, meno energia sprecata e meno calore. Il tuo PC consuma circa <b>${power(b)} W</b>, quindi serve almeno <b>${suggestedW(b)} W</b> (un margine è sempre utile).`,
      options: (b) => PSU.filter((p) => p.watt >= suggestedW(b)),
      callout: (c) => `<b>${c.watt} W</b> con efficienza ${c.specs[1][1]}: energia sufficiente e con margine.` },

    { key: "case", emoji: "📦", title: "Il case — la scatola", type: "Case",
      intro: (b) => `Il <b>case</b> contiene e protegge tutto, e fa circolare l'aria. Deve accettare il formato della scheda madre (<b>${b.mobo.form}</b>), essere lungo abbastanza per la scheda video (${b.gpu.integrated ? "qui nessun problema" : "<b>" + b.gpu.length + " mm</b>"}) e alto per il dissipatore (<b>${b.cooler.height} mm</b>). Ti mostro quelli in cui tutto entra:`,
      options: (b) => CASE.filter((c) => c.forms.indexOf(b.mobo.form) >= 0 && c.maxGpu >= (b.gpu ? b.gpu.length : 0) && c.maxCooler >= b.cooler.height),
      callout: () => "Tutto entra! Hai finito di scegliere i pezzi. 🎉" },
  ];

  /* ---------- Stato ---------- */
  let step = 0, build = {}, finished = false;

  /* ---------- Render ---------- */
  function renderSteps() {
    $("stepsBar").innerHTML = STEPS.map((s, i) => {
      const cls = finished || i < step ? "done" : i === step ? "active" : "";
      const mark = (finished || i < step) ? "✓" : (i + 1);
      return `<span class="step-pill ${cls}"><span class="sn">${mark}</span>${s.type}</span>`;
    }).join("");
  }

  function specsHtml(o) {
    return `<div class="opt-specs">` + o.specs.map((sp) => `<div class="osp"><span>${sp[0]}</span><b>${sp[1]}</b></div>`).join("") + `</div>`;
  }

  function renderWizard() {
    if (finished) return renderFinale();
    const s = STEPS[step];
    const opts = s.options(build);
    const chosen = build[s.key];
    $("wizard").innerHTML =
      `<div class="wiz-head"><span class="wiz-emoji">${s.emoji}</span><h2 class="wiz-title">${step + 1}. ${s.title}</h2></div>` +
      `<p class="wiz-intro">${s.intro(build)}</p>` +
      `<div class="opt-grid">` + opts.map((o) =>
        `<button type="button" class="opt-card ${chosen && chosen.id === o.id ? "selected" : ""}" data-id="${o.id}">` +
          `<div class="opt-top"><span class="opt-emoji">${o.emoji}</span><span class="opt-name">${o.name}</span>` +
          (o.tag ? `<span class="opt-tag ${o.tag.toLowerCase()}">${o.tag}</span>` : "") + `</div>` +
          `<div class="opt-desc">${o.desc}</div>` +
          specsHtml(o) +
          `<div class="opt-price">${o.price === 0 ? "incluso / gratis" : o.price + " €"}</div>` +
        `</button>`).join("") + `</div>` +
      (chosen ? `<div class="callout"><span class="co-ico">💡</span><div>${s.callout(chosen)}</div></div>` : "") +
      `<div class="wiz-nav">` +
        (step > 0 ? `<button type="button" class="back" id="wizBack">← Indietro</button>` : "") +
        `<button type="button" class="run-btn next" id="wizNext" ${chosen ? "" : "disabled"}>${step === STEPS.length - 1 ? "Vedi il risultato 🎉" : "Avanti →"}</button>` +
      `</div>`;
  }

  function renderFinale() {
    $("wizard").innerHTML =
      `<div class="finale">` +
      `<div class="big-emoji">🎉</div>` +
      `<h2>Complimenti, il tuo PC è pronto!</h2>` +
      `<p>Hai scelto 8 componenti facendo attenzione che si incastrassero. Ecco le regole d'oro che hai imparato:</p>` +
      `<div class="recap">` +
        `<div class="recap-item"><span class="ri">✓</span><div>Il <b>socket</b> della CPU (${build.cpu.socket}) deve combaciare con la scheda madre.</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>Più <b>core</b> e più <b>GHz</b> = CPU più veloce; i <b>thread</b> sono i compiti virtuali.</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>La <b>RAM</b> deve essere del tipo giusto (${build.ram.type}); più <b>GB</b> = più cose insieme.</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>Un <b>SSD NVMe</b> è molto più veloce di un <b>HDD</b>.</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>Il <b>dissipatore</b> deve smaltire il calore (TDP) della CPU.</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>L'<b>alimentatore</b> deve dare abbastanza <b>Watt</b> (~${power(build)} W di consumo).</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>Il <b>case</b> deve avere spazio per scheda madre, GPU e dissipatore.</div></div>` +
      `</div>` +
      `<button type="button" class="run-btn" id="restart">↻ Ricomincia</button>` +
      `</div>`;
  }

  function renderBuild() {
    $("buildList").innerHTML = STEPS.map((s, i) => {
      const c = build[s.key];
      const cls = "build-item" + (c ? "" : " empty") + (i === step && !finished ? " current" : "");
      return `<div class="${cls}"><span class="bi-emoji">${c ? c.emoji : "·"}</span>` +
        `<div><div class="bi-type">${s.type}</div><div class="bi-name">${c ? c.name : "da scegliere"}</div></div>` +
        `<span class="bi-price">${c ? (c.price === 0 ? "—" : c.price + " €") : ""}</span></div>`;
    }).join("");
    let total = 0, done = 0;
    STEPS.forEach((s) => { if (build[s.key]) { total += build[s.key].price; done++; } });
    $("buildTotal").innerHTML = `<span class="bt-lbl">Totale (${done}/${STEPS.length} pezzi)</span><span class="bt-val">${total} €</span>`;
  }

  function renderAll() { renderSteps(); renderWizard(); renderBuild(); }

  /* ---------- Eventi ---------- */
  $("wizard").addEventListener("click", (e) => {
    const card = e.target.closest(".opt-card");
    if (card) {
      const s = STEPS[step];
      build[s.key] = s.options(build).find((x) => x.id === card.dataset.id);
      for (let i = step + 1; i < STEPS.length; i++) delete build[STEPS[i].key];
      renderAll();
      return;
    }
    if (e.target.closest("#wizNext")) { if (build[STEPS[step].key]) { if (step === STEPS.length - 1) finished = true; else step++; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); } }
    else if (e.target.closest("#wizBack")) { if (step > 0) { step--; renderAll(); } }
    else if (e.target.closest("#restart")) { step = 0; build = {}; finished = false; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  renderAll();
})();
