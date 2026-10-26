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
    { id: "i313100", emoji: "🔵", name: "Intel Core i3-13100", tag: "Economica", socket: "LGA1700", tdp: 60, tier: 4, price: 130, igpu: true,
      desc: "Economica ma scattante per studio, ufficio e navigazione.",
      specs: [["Core / Thread", "4 core · 8 thread"], ["Frequenza", "3,4 → 4,5 GHz"], ["Socket", "LGA1700"], ["Grafica integrata", "sì"], ["Consumo (TDP)", "60 W"]] },
    { id: "i513400", emoji: "🔵", name: "Intel Core i5-13400", tag: "Equilibrata", socket: "LGA1700", tdp: 65, tier: 6, price: 180, igpu: true,
      desc: "Ottima per studio, ufficio e gioco leggero. Ha la grafica integrata.",
      specs: [["Core / Thread", "10 core · 16 thread"], ["Frequenza", "2,5 → 4,6 GHz"], ["Socket", "LGA1700"], ["Grafica integrata", "sì"], ["Consumo (TDP)", "65 W"]] },
    { id: "i714700k", emoji: "🔵", name: "Intel Core i7-14700K", tag: "Potente", socket: "LGA1700", tdp: 125, tier: 9, price: 400, igpu: true,
      desc: "Tanti core per giochi e lavori pesanti; va raffreddata bene.",
      specs: [["Core / Thread", "20 core · 28 thread"], ["Frequenza", "3,4 → 5,6 GHz"], ["Socket", "LGA1700"], ["Grafica integrata", "sì"], ["Consumo (TDP)", "125 W"]] },
    { id: "r55600", emoji: "🔴", name: "AMD Ryzen 5 5600", tag: "Economica", socket: "AM4", tdp: 65, tier: 5, price: 130, igpu: false,
      desc: "Piattaforma AM4, più datata ed economica. Niente grafica integrata: servirà una scheda video.",
      specs: [["Core / Thread", "6 core · 12 thread"], ["Frequenza", "3,5 → 4,4 GHz"], ["Socket", "AM4"], ["Grafica integrata", "no"], ["Consumo (TDP)", "65 W"]] },
    { id: "r57600", emoji: "🔴", name: "AMD Ryzen 5 7600", tag: "Equilibrata", socket: "AM5", tdp: 65, tier: 7, price: 230, igpu: true,
      desc: "Moderna e parca nei consumi, con grafica integrata.",
      specs: [["Core / Thread", "6 core · 12 thread"], ["Frequenza", "3,8 → 5,1 GHz"], ["Socket", "AM5"], ["Grafica integrata", "sì"], ["Consumo (TDP)", "65 W"]] },
    { id: "r77700", emoji: "🔴", name: "AMD Ryzen 7 7700", tag: "Potente", socket: "AM5", tdp: 65, tier: 8, price: 300, igpu: true,
      desc: "Otto core efficienti: ottima per gioco e produttività.",
      specs: [["Core / Thread", "8 core · 16 thread"], ["Frequenza", "3,8 → 5,3 GHz"], ["Socket", "AM5"], ["Grafica integrata", "sì"], ["Consumo (TDP)", "65 W"]] },
    { id: "r77800", emoji: "🔴", name: "AMD Ryzen 7 7800X3D", tag: "Top gaming", socket: "AM5", tdp: 120, tier: 10, price: 350, igpu: true,
      desc: "Tra le migliori per i giochi; scalda di più e va raffreddata bene.",
      specs: [["Core / Thread", "8 core · 16 thread"], ["Frequenza", "4,2 → 5,0 GHz"], ["Socket", "AM5"], ["Grafica integrata", "sì"], ["Consumo (TDP)", "120 W"]] },
  ];
  const MOBO = [
    { id: "b660", emoji: "🟩", name: "MSI B660M", socket: "LGA1700", ram: "DDR4", m2: 2, form: "mATX", price: 110,
      desc: "Compatta ed economica per CPU Intel, con memorie DDR4.",
      specs: [["Socket", "LGA1700"], ["Chipset", "B660"], ["Memorie", "DDR4"], ["Slot M.2", "2"], ["Formato", "mATX"]] },
    { id: "b760", emoji: "🟩", name: "ASUS B760 ATX", socket: "LGA1700", ram: "DDR5", m2: 3, form: "ATX", price: 170,
      desc: "Più grande e moderna, con memorie DDR5.",
      specs: [["Socket", "LGA1700"], ["Chipset", "B760"], ["Memorie", "DDR5"], ["Slot M.2", "3"], ["Formato", "ATX"]] },
    { id: "z790", emoji: "🟩", name: "ASUS Z790 (Premium)", socket: "LGA1700", ram: "DDR5", m2: 4, form: "ATX", price: 300,
      desc: "Top di gamma Intel: tante porte e 4 slot M.2.",
      specs: [["Socket", "LGA1700"], ["Chipset", "Z790"], ["Memorie", "DDR5"], ["Slot M.2", "4"], ["Formato", "ATX"]] },
    { id: "a620", emoji: "🟥", name: "ASRock A620M", socket: "AM5", ram: "DDR5", m2: 2, form: "mATX", price: 120,
      desc: "Compatta per AMD, ottimo rapporto qualità/prezzo.",
      specs: [["Socket", "AM5"], ["Chipset", "A620"], ["Memorie", "DDR5"], ["Slot M.2", "2"], ["Formato", "mATX"]] },
    { id: "b650", emoji: "🟥", name: "MSI B650 ATX", socket: "AM5", ram: "DDR5", m2: 3, form: "ATX", price: 180,
      desc: "Grande ed espandibile per AMD.",
      specs: [["Socket", "AM5"], ["Chipset", "B650"], ["Memorie", "DDR5"], ["Slot M.2", "3"], ["Formato", "ATX"]] },
    { id: "x670e", emoji: "🟥", name: "Gigabyte X670E (Premium)", socket: "AM5", ram: "DDR5", m2: 4, form: "ATX", price: 320,
      desc: "Top di gamma AMD per chi vuole il massimo.",
      specs: [["Socket", "AM5"], ["Chipset", "X670E"], ["Memorie", "DDR5"], ["Slot M.2", "4"], ["Formato", "ATX"]] },
    { id: "b550m", emoji: "🟧", name: "Gigabyte B550M", socket: "AM4", ram: "DDR4", m2: 2, form: "mATX", price: 90,
      desc: "Economica per piattaforma AM4 (DDR4).",
      specs: [["Socket", "AM4"], ["Chipset", "B550"], ["Memorie", "DDR4"], ["Slot M.2", "2"], ["Formato", "mATX"]] },
    { id: "b550", emoji: "🟧", name: "ASUS B550 ATX", socket: "AM4", ram: "DDR4", m2: 2, form: "ATX", price: 130,
      desc: "Più grande, sempre per AM4 e DDR4.",
      specs: [["Socket", "AM4"], ["Chipset", "B550"], ["Memorie", "DDR4"], ["Slot M.2", "2"], ["Formato", "ATX"]] },
  ];
  const RAM = [
    { id: "d4_8", emoji: "🟦", name: "8 GB DDR4", type: "DDR4", price: 25, desc: "Il minimo per partire; va bene per attività leggere.",
      specs: [["Tipo", "DDR4"], ["Capacità", "8 GB (2×4)"], ["Velocità", "3200 MHz"]] },
    { id: "d4_16", emoji: "🟦", name: "16 GB DDR4", type: "DDR4", price: 40, desc: "Abbastanza per studio e giochi normali.",
      specs: [["Tipo", "DDR4"], ["Capacità", "16 GB (2×8)"], ["Velocità", "3200 MHz"]] },
    { id: "d4_32", emoji: "🟦", name: "32 GB DDR4", type: "DDR4", price: 80, desc: "Tanta, per montaggio e molti programmi insieme.",
      specs: [["Tipo", "DDR4"], ["Capacità", "32 GB (2×16)"], ["Velocità", "3600 MHz"]] },
    { id: "d5_16", emoji: "🟪", name: "16 GB DDR5", type: "DDR5", price: 60, desc: "Più veloce, abbastanza per quasi tutto.",
      specs: [["Tipo", "DDR5"], ["Capacità", "16 GB (2×8)"], ["Velocità", "6000 MHz"]] },
    { id: "d5_32", emoji: "🟪", name: "32 GB DDR5", type: "DDR5", price: 110, desc: "Veloce e abbondante, a prova di futuro.",
      specs: [["Tipo", "DDR5"], ["Capacità", "32 GB (2×16)"], ["Velocità", "6000 MHz"]] },
    { id: "d5_64", emoji: "🟪", name: "64 GB DDR5", type: "DDR5", price: 220, desc: "Tantissima: per montaggio video 4K e lavori pesanti.",
      specs: [["Tipo", "DDR5"], ["Capacità", "64 GB (2×32)"], ["Velocità", "6000 MHz"]] },
  ];
  const STORAGE = [
    { id: "hdd1", emoji: "💽", name: "Hard Disk 1 TB", price: 40, desc: "Tanto spazio a poco prezzo, ma lento: meglio per archiviare.",
      specs: [["Tecnologia", "HDD (meccanico)"], ["Capacità", "1 TB"], ["Lettura", "~150 MB/s"]] },
    { id: "hdd2", emoji: "💽", name: "Hard Disk 2 TB", price: 60, desc: "Ancora più spazio per foto, film e backup.",
      specs: [["Tecnologia", "HDD (meccanico)"], ["Capacità", "2 TB"], ["Lettura", "~180 MB/s"]] },
    { id: "sata500", emoji: "📀", name: "SSD SATA 500 GB", price: 45, desc: "Veloce e accessibile, ottimo per il sistema.",
      specs: [["Tecnologia", "SSD SATA"], ["Capacità", "500 GB"], ["Lettura", "~550 MB/s"]] },
    { id: "sata1", emoji: "📀", name: "SSD SATA 1 TB", price: 70, desc: "Veloce e capiente per sistema e programmi.",
      specs: [["Tecnologia", "SSD SATA"], ["Capacità", "1 TB"], ["Lettura", "~560 MB/s"]] },
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
    { id: "rtx4060ti", emoji: "🎮", name: "GeForce RTX 4060 Ti", length: 280, tdp: 160, tier: 7, price: 420,
      desc: "Un gradino sopra, sempre per il Full HD spinto.",
      specs: [["Memoria (VRAM)", "8 GB"], ["Consumo", "160 W"], ["Lunghezza", "280 mm"]] },
    { id: "rx7600", emoji: "🎮", name: "Radeon RX 7600", length: 240, tdp: 165, tier: 6, price: 270,
      desc: "Alternativa AMD economica per il 1080p.",
      specs: [["Memoria (VRAM)", "8 GB"], ["Consumo", "165 W"], ["Lunghezza", "240 mm"]] },
    { id: "rx7800", emoji: "🎮", name: "Radeon RX 7800 XT", length: 267, tdp: 263, tier: 8, price: 500,
      desc: "Tanta memoria video, ottima per il 1440p.",
      specs: [["Memoria (VRAM)", "16 GB"], ["Consumo", "263 W"], ["Lunghezza", "267 mm"]] },
    { id: "rtx4070s", emoji: "🎮", name: "GeForce RTX 4070 Super", tag: "potente", length: 285, tdp: 220, tier: 9, price: 600,
      desc: "Per giocare alla grande, anche in 1440p e oltre.",
      specs: [["Memoria (VRAM)", "12 GB"], ["Consumo", "220 W"], ["Lunghezza", "285 mm"]] },
    { id: "rtx4080s", emoji: "🎮", name: "GeForce RTX 4080 Super", tag: "top", length: 310, tdp: 320, tier: 10, price: 1000,
      desc: "Fascia altissima: gioco in 4K senza compromessi.",
      specs: [["Memoria (VRAM)", "16 GB"], ["Consumo", "320 W"], ["Lunghezza", "310 mm"]] },
  ];
  const COOLER = [
    { id: "stock", emoji: "🌀", name: "Dissipatore in dotazione", maxTdp: 65, height: 55, price: 0,
      desc: "Quello incluso con la CPU: gratis, va bene per le CPU non troppo calde.",
      specs: [["Tipo", "ad aria"], ["Raffredda fino a", "65 W"], ["Altezza", "55 mm"]] },
    { id: "lowprofile", emoji: "🍃", name: "Dissipatore basso (low-profile)", maxTdp: 95, height: 70, price: 30,
      desc: "Basso e silenzioso, perfetto per i case piccoli.",
      specs: [["Tipo", "ad aria"], ["Raffredda fino a", "95 W"], ["Altezza", "70 mm"]] },
    { id: "tower", emoji: "🗼", name: "Dissipatore a torre", maxTdp: 200, height: 160, price: 40,
      desc: "Una grande ventola: silenzioso e tiene fresca la CPU.",
      specs: [["Tipo", "ad aria"], ["Raffredda fino a", "200 W"], ["Altezza", "160 mm"]] },
    { id: "aio240", emoji: "💧", name: "Liquido AIO 240 mm", maxTdp: 280, height: 35, price: 95,
      desc: "Liquido in circuito chiuso: per le CPU calde.",
      specs: [["Tipo", "a liquido (AIO)"], ["Raffredda fino a", "280 W"], ["Radiatore", "240 mm"]] },
    { id: "aio360", emoji: "💧", name: "Liquido AIO 360 mm", maxTdp: 360, height: 38, price: 140,
      desc: "Il massimo del raffreddamento, per le CPU più potenti.",
      specs: [["Tipo", "a liquido (AIO)"], ["Raffredda fino a", "360 W"], ["Radiatore", "360 mm"]] },
  ];
  const PSU = [
    { id: "p450", emoji: "🔌", name: "Alimentatore 450 W", watt: 450, price: 45, desc: "Per PC senza scheda video, a basso consumo.",
      specs: [["Potenza", "450 W"], ["Efficienza", "80+ Bronze"]] },
    { id: "p550", emoji: "🔌", name: "Alimentatore 550 W", watt: 550, price: 60, desc: "Una buona via di mezzo.",
      specs: [["Potenza", "550 W"], ["Efficienza", "80+ Bronze"]] },
    { id: "p650", emoji: "🔌", name: "Alimentatore 650 W", watt: 650, price: 85, desc: "Con margine per una scheda video di fascia media.",
      specs: [["Potenza", "650 W"], ["Efficienza", "80+ Gold"]] },
    { id: "p750", emoji: "🔌", name: "Alimentatore 750 W", watt: 750, price: 105, desc: "Per schede video potenti, con un buon margine.",
      specs: [["Potenza", "750 W"], ["Efficienza", "80+ Gold"]] },
    { id: "p850", emoji: "🔌", name: "Alimentatore 850 W", watt: 850, price: 130, desc: "Tanta energia, per i PC più potenti.",
      specs: [["Potenza", "850 W"], ["Efficienza", "80+ Gold"]] },
    { id: "p1000", emoji: "🔌", name: "Alimentatore 1000 W", watt: 1000, price: 190, desc: "Per le configurazioni estreme.",
      specs: [["Potenza", "1000 W"], ["Efficienza", "80+ Platinum"]] },
  ];
  const CASE = [
    { id: "small", emoji: "📦", name: "Case piccolo (Micro)", forms: ["ITX", "mATX"], maxGpu: 300, maxCooler: 120, price: 70,
      desc: "Occupa pochissimo; accetta schede madri fino a mATX.",
      specs: [["Schede madri", "ITX, mATX"], ["GPU max", "300 mm"], ["Dissipatore max", "120 mm"]] },
    { id: "airflow", emoji: "📦", name: "Case arieggiato (mATX)", forms: ["ITX", "mATX"], maxGpu: 330, maxCooler: 165, price: 85,
      desc: "Compatto ma con tanta aria fresca per i componenti.",
      specs: [["Schede madri", "ITX, mATX"], ["GPU max", "330 mm"], ["Dissipatore max", "165 mm"]] },
    { id: "mid", emoji: "📦", name: "Case medio (ATX)", forms: ["ITX", "mATX", "ATX"], maxGpu: 360, maxCooler: 170, price: 100,
      desc: "Il più comune: c'è posto per tutto ed è facile da montare.",
      specs: [["Schede madri", "ITX, mATX, ATX"], ["GPU max", "360 mm"], ["Dissipatore max", "170 mm"]] },
    { id: "glass", emoji: "📦", name: "Case con vetro (ATX)", forms: ["ITX", "mATX", "ATX"], maxGpu: 380, maxCooler: 175, price: 130,
      desc: "Pannello in vetro per mostrare i componenti e le luci.",
      specs: [["Schede madri", "ITX, mATX, ATX"], ["GPU max", "380 mm"], ["Dissipatore max", "175 mm"]] },
    { id: "big", emoji: "📦", name: "Case grande (Full)", forms: ["ITX", "mATX", "ATX"], maxGpu: 420, maxCooler: 185, price: 150,
      desc: "Spazioso e arieggiato, per i PC più potenti.",
      specs: [["Schede madri", "ITX, mATX, ATX"], ["GPU max", "420 mm"], ["Dissipatore max", "185 mm"]] },
  ];

  const power = (b) => b.cpu.tdp + (b.gpu ? b.gpu.tdp : 0) + 80;
  const suggestedW = (b) => Math.ceil((power(b) * 1.5) / 50) * 50;

  /* ---------- Passi ----------
     options(): mostra SEMPRE tutti i componenti.
     compat(o, b): null se è compatibile, altrimenti il motivo dell'errore. */
  const STEPS = [
    { key: "cpu", emoji: "🧠", title: "La CPU — il cervello", type: "CPU",
      intro: () => "La <b>CPU</b> è il cervello del computer. Due cose contano: i <b>core</b> (nuclei) sono quanti compiti può svolgere <b>in parallelo</b> — più core, più cose insieme; la <b>frequenza</b> in <b>GHz</b> (gigahertz) dice quante operazioni al secondo fa ogni core — più GHz, più è veloce. I <b>thread</b> sono i compiti virtuali (spesso il doppio dei core). Il <b>socket</b> è la forma dell'attacco con la scheda madre. Alcune CPU hanno la <b>grafica integrata</b>, altre no.",
      options: () => CPU,
      compat: () => null,
      callout: (c) => `Hai scelto una CPU con socket <b>${c.socket}</b> e consumo <b>${c.tdp} W</b>${c.igpu ? "" : ", <b>senza</b> grafica integrata (servirà una scheda video)"}. Ricorda il socket: la scheda madre dovrà avere lo stesso!` },

    { key: "mobo", emoji: "🛠️", title: "La scheda madre — la base", type: "Scheda madre",
      intro: (b) => `La <b>scheda madre</b> collega tutto. Il <b>socket</b> deve combaciare con la CPU (la tua è <b>${b.cpu.socket}</b>). Il <b>chipset</b> decide le funzioni disponibili; supporta un solo tipo di RAM (<b>DDR4</b> o <b>DDR5</b>); gli slot <b>M.2</b> ospitano gli SSD veloci; il <b>formato</b> (ATX, mATX) è la dimensione, che dovrà entrare nel case. <b>Attenzione al socket</b>: deve essere lo stesso della CPU, o non si incastrano.`,
      options: () => MOBO,
      compat: (m, b) => m.socket === b.cpu.socket ? null : `il socket di questa scheda è <b>${m.socket}</b>, ma la tua CPU usa il socket <b>${b.cpu.socket}</b>: la CPU non ci entra fisicamente.`,
      callout: (c) => `Questa scheda usa memorie <b>${c.ram}</b> ed è formato <b>${c.form}</b>: la RAM dovrà essere ${c.ram} e il case dovrà accettare una ${c.form}.` },

    { key: "ram", emoji: "💾", title: "La RAM — la memoria di lavoro", type: "RAM",
      intro: (b) => `La <b>RAM</b> è la memoria di lavoro (sparisce a PC spento). Contano la <b>capacità</b> in GB (più GB = più programmi aperti insieme) e la <b>velocità</b> in <b>MHz</b> (più alta = più scorrevole). Il <b>tipo</b> deve essere quello della scheda madre: <b>${b.mobo.ram}</b>.`,
      options: () => RAM,
      compat: (r, b) => r.type === b.mobo.ram ? null : `questa RAM è <b>${r.type}</b>, ma la tua scheda madre accetta solo <b>${b.mobo.ram}</b>: gli slot sono diversi, non entra.`,
      callout: (c) => `${c.specs[1][1]} di RAM ${c.type}: ottimo.` },

    { key: "storage", emoji: "🗄️", title: "L'archiviazione — dove salvi i file", type: "Archiviazione",
      intro: () => "Qui restano i tuoi file e i programmi anche a PC spento. Un <b>HDD</b> (disco meccanico) costa poco e ha tanto spazio, ma è <b>lento</b>. Un <b>SSD</b> è molto più veloce; gli <b>SSD NVMe</b> (sullo slot M.2) sono i più rapidi (migliaia di <b>MB/s</b>). Conta la <b>capacità</b> e la <b>velocità di lettura</b>.",
      options: () => STORAGE,
      compat: () => null,
      callout: (c) => `${c.specs[0][1]}, ${c.specs[2][1]}: ${/NVMe/.test(c.specs[0][1]) ? "il sistema sarà velocissimo!" : "una buona scelta."}` },

    { key: "gpu", emoji: "🎮", title: "La scheda video", type: "Scheda video",
      intro: (b) => `La <b>scheda video (GPU)</b> disegna le immagini: fondamentale per i <b>giochi</b> e il montaggio video. Conta la <b>memoria video (VRAM)</b> in GB e il <b>consumo</b> in W. ${b.cpu.igpu ? "La tua CPU ha già una grafica integrata: per studio e navigazione basta quella." : "<b>La tua CPU non ha grafica integrata</b>: qui devi per forza scegliere una scheda video, altrimenti il PC non mostra immagini."}`,
      options: () => GPU,
      compat: (g, b) => (g.integrated && !b.cpu.igpu) ? `la tua CPU <b>non</b> ha grafica integrata, quindi questa opzione non esiste: senza una scheda video vera il PC non mostrerebbe nulla.` : null,
      callout: (c) => c.integrated ? "Userai la grafica già dentro la CPU: risparmi e consumi pochissimo." : `Con <b>${c.specs[0][1]}</b> di memoria video giochi bene. Attenzione: consuma <b>${c.tdp} W</b>, ne terremo conto per l'alimentatore.` },

    { key: "cooler", emoji: "❄️", title: "Il dissipatore — il raffreddamento", type: "Dissipatore",
      intro: (b) => `La CPU scalda: il <b>dissipatore</b> la tiene fresca, altrimenti rallenta o si spegne. Deve smaltire il calore della CPU (il suo <b>TDP</b>, qui <b>${b.cpu.tdp} W</b>). Ad <b>aria</b> (una ventola) o a <b>liquido</b> (AIO) per le CPU più calde. <b>Controlla</b> che regga almeno il calore (TDP) della tua CPU.`,
      options: () => COOLER,
      compat: (c, b) => c.maxTdp >= b.cpu.tdp ? null : `raffredda fino a <b>${c.maxTdp} W</b>, ma la tua CPU ne produce <b>${b.cpu.tdp} W</b>: non riuscirebbe a smaltire il calore e la CPU si surriscalderebbe.`,
      callout: (c) => `Bene: questo dissipatore smaltisce fino a <b>${c.maxTdp} W</b>, sufficiente per la tua CPU.` },

    { key: "psu", emoji: "🔌", title: "L'alimentatore — l'energia", type: "Alimentatore",
      intro: (b) => `L'<b>alimentatore</b> dà energia a tutto. Contano la <b>potenza</b> in W (deve bastare per tutti i componenti) e l'<b>efficienza</b> (80+ Bronze, Gold…): più alta, meno energia sprecata. Il tuo PC consuma circa <b>${power(b)} W</b>, quindi serve almeno <b>${suggestedW(b)} W</b> (un margine è sempre utile). <b>Scegli abbastanza Watt</b>: se è troppo debole il PC diventa instabile.`,
      options: () => PSU,
      compat: (p, b) => p.watt >= suggestedW(b) ? null : `dà solo <b>${p.watt} W</b>, ma il tuo PC consuma circa <b>${power(b)} W</b> e servono almeno <b>${suggestedW(b)} W</b> di margine: rischi spegnimenti o instabilità.`,
      callout: (c) => `<b>${c.watt} W</b> con efficienza ${c.specs[1][1]}: energia sufficiente e con margine.` },

    { key: "case", emoji: "📦", title: "Il case — la scatola", type: "Case",
      intro: (b) => `Il <b>case</b> contiene e protegge tutto, e fa circolare l'aria. Deve accettare il formato della scheda madre (<b>${b.mobo.form}</b>), essere lungo abbastanza per la scheda video (${b.gpu.integrated ? "qui nessun problema" : "<b>" + b.gpu.length + " mm</b>"}) e alto per il dissipatore (<b>${b.cooler.height} mm</b>). <b>Controlla</b> che scheda madre, scheda video e dissipatore ci stiano dentro.`,
      options: () => CASE,
      compat: (c, b) => {
        if (c.forms.indexOf(b.mobo.form) < 0) return `non accetta schede madri formato <b>${b.mobo.form}</b> (solo ${c.forms.join(", ")}): la scheda madre non ci sta.`;
        if (!b.gpu.integrated && c.maxGpu < b.gpu.length) return `accetta schede video lunghe al massimo <b>${c.maxGpu} mm</b>, ma la tua è lunga <b>${b.gpu.length} mm</b>: non ci entra.`;
        if (c.maxCooler < b.cooler.height) return `accetta dissipatori alti al massimo <b>${c.maxCooler} mm</b>, ma il tuo è alto <b>${b.cooler.height} mm</b>: il pannello non si chiude.`;
        return null;
      },
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
    const opts = s.options(build);               // mostriamo TUTTE le opzioni
    const chosen = build[s.key];
    const compatOf = (o) => (s.compat ? s.compat(o, build) : null);
    const chosenReason = chosen ? compatOf(chosen) : null;

    // nessun «marchio» anticipato sulle card: il motivo si scopre SOLO scegliendo
    let calloutHtml = "";
    if (chosen && chosenReason) {
      calloutHtml = `<div class="callout warn"><span class="co-ico">⚠️</span><div><b>Questa scelta non funziona:</b> ${chosenReason}<br>Prova a sceglierne un'altra per andare avanti.</div></div>`;
    } else if (chosen) {
      calloutHtml = `<div class="callout"><span class="co-ico">💡</span><div>${s.callout(chosen)}</div></div>`;
    }

    $("wizard").innerHTML =
      `<div class="wiz-head"><span class="wiz-emoji">${s.emoji}</span><h2 class="wiz-title">${step + 1}. ${s.title}</h2></div>` +
      `<p class="wiz-intro">${s.intro(build)}</p>` +
      `<div class="opt-grid">` + opts.map((o) =>
        `<button type="button" class="opt-card ${chosen && chosen.id === o.id ? "selected" : ""}" data-id="${o.id}">` +
          `<div class="opt-top"><span class="opt-emoji">${o.emoji}</span><span class="opt-name">${o.name}</span>` +
          (o.tag ? `<span class="opt-tag ${o.tag.toLowerCase().replace(/\s/g, "")}">${o.tag}</span>` : "") + `</div>` +
          `<div class="opt-desc">${o.desc}</div>` +
          specsHtml(o) +
          `<div class="opt-price">${o.price === 0 ? "incluso / gratis" : o.price + " €"}</div>` +
        `</button>`
      ).join("") + `</div>` +
      calloutHtml +
      `<div class="wiz-nav">` +
        (step > 0 ? `<button type="button" class="back" id="wizBack">← Indietro</button>` : "") +
        `<button type="button" class="run-btn next" id="wizNext" ${chosen && !chosenReason ? "" : "disabled"}>${step === STEPS.length - 1 ? "Vedi il risultato 🎉" : "Avanti →"}</button>` +
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

  /* ============================================================
     MONTAGGIO — guida al montaggio fisico, passo per passo
     (si adatta ai pezzi scelti nella sezione 1)
     ============================================================ */
  const hasK = (k) => !!build[k];
  const cpuTxt = () => hasK("cpu") ? "la tua CPU <b>" + build.cpu.name + "</b> (socket <b>" + build.cpu.socket + "</b>)" : "la CPU";
  const coolTxt = () => hasK("cooler") ? "il dissipatore <b>" + build.cooler.name + "</b>" : "il dissipatore";
  const ramTxt = () => hasK("ram") ? " La tua RAM è di tipo <b>" + build.ram.type + "</b>." : "";
  const moboForm = () => hasK("mobo") ? "<b>" + build.mobo.form + "</b>" : "della scheda madre";
  const psuTxt = () => hasK("psu") ? "l'alimentatore <b>" + build.psu.watt + " W</b>" : "l'alimentatore";
  const isNvme = () => hasK("storage") && /NVMe/i.test(build.storage.name);
  const hasGpu = () => hasK("gpu") && !build.gpu.integrated;
  const gpuTxt = () => hasK("gpu") ? "<b>" + build.gpu.name + "</b>" : "la scheda video";

  const AINFO = {
    cpu: { title: "Processore (CPU)", tag: "Il motore dei calcoli", where: "Nel socket, la cornice metallica al centro-alto della scheda.",
      what: "È il componente che macina i calcoli: ogni istruzione dei programmi passa di qui. Lo si incastra nel socket, dove centinaia di minuscoli contatti lo collegano al resto della scheda.",
      tips: ["Prendilo per i bordi, mai dai contatti: le dita lasciano un velo di grasso che disturba il contatto elettrico.", "Un angolo è segnato (una piccola freccia): falla combaciare con l'angolo uguale del socket. Si monta in un verso solo.", "Si appoggia, non si preme: scivola in sede con il suo peso. Poi chiudi la levetta di bloccaggio."],
      fun: "In un battito di ciglia la CPU ha già eseguito centinaia di milioni di istruzioni: dentro corrono segnali a miliardi di impulsi al secondo." },
    paste: { title: "Pasta termica", tag: "Il ponte per il calore", where: "Un puntino al centro del processore, prima del dissipatore.",
      what: "Una pasta grigia che riempie i micro-vuoti fra CPU e dissipatore. Senza, fra i due resterebbe un velo d'aria che fa da isolante e blocca il passaggio del calore.",
      tips: ["Ne basta pochissima: una goccia grande come una lenticchia al centro. La pressione del dissipatore la spalma da sola.", "Metterne troppa non raffredda di più, anzi fa pasticcio e può colare sui contatti.", "Se la rifai, pulisci la vecchia con un panno e un po' di alcol isopropilico."],
      fun: "La pasta termica non raffredda: serve solo a far «scorrere» meglio il calore. È fatta apposta per condurre il calore ma non l'elettricità." },
    cooler: { title: "Dissipatore", tag: "Chi porta via il calore", where: "Appoggiato sul processore, agganciato ai fori del socket.",
      what: "La CPU trasforma energia in calore senza sosta. Il dissipatore lo raccoglie con un blocco di metallo e la ventola lo spinge fuori dal case.",
      tips: ["Se il dissipatore è nuovo, controlla che la base non abbia una pellicola di plastica: va tolta.", "Avvita a poco a poco e in diagonale (una vite, poi quella opposta): la pressione resta uniforme.", "Infila lo spinotto della ventola nell'header CPU_FAN, così la scheda ne legge i giri e la regola."],
      fun: "Le CPU hanno una valvola di sicurezza: oltre una certa temperatura rallentano da sole (si chiama throttling) per non bruciarsi." },
    ram: { title: "Memoria RAM", tag: "Il banco da lavoro", where: "Negli slot stretti e lunghi, in verticale a fianco della CPU.",
      what: "Ci appoggia i dati che sta usando in questo momento — il documento aperto, la scheda del browser, il gioco in corso. Leggere qui è molto più rapido che dal disco, ma a PC spento si svuota.",
      tips: ["Sblocca le alette dello slot prima di inserire il banco.", "La fessura tra i contatti non è centrata: combacia con lo slot in un verso soltanto, quindi non va forzata.", "Spingi dritto ai due capi insieme finché le alette risalgono e scattano."],
      fun: "DDR sta per «double data rate»: la memoria trasferisce dati due volte per ogni ciclo di clock, in andata e in ritorno." },
    ram2: { title: "Secondo modulo RAM", tag: "Due banchi, doppia corsia", where: "Nell'altro slot della coppia consigliata dal manuale.",
      what: "Montando due banchi uguali, la CPU li legge in parallelo: è come aprire una seconda corsia, e la memoria rende di più.",
      tips: ["Per il dual channel servono gli slot giusti: quasi sempre il 2° e il 4° partendo dalla CPU.", "Due moduli identici vanno d'accordo meglio: stessa capacità e stessa velocità.", "La serigrafia sulla scheda indica quali slot riempire per primi."],
      fun: "Con un solo banco il PC funziona lo stesso, ma nei giochi e nei programmi pesanti il doppio canale fa guadagnare parecchio." },
    ssd: { title: "SSD M.2 NVMe", tag: "La memoria permanente veloce", where: "Nello slottino M.2, lungo e sottile, in genere sotto la CPU.",
      what: "Conserva sistema, programmi e file anche a corrente staccata. Non ha dischi che girano, sono chip: silenzioso e rapidissimo ad aprire tutto.",
      tips: ["Entra inclinato, poi lo abbassi e lo blocchi con una vitina (o una clip che fa click).", "Quella vite è piccolissima: appena la sveti, mettila al sicuro.", "Molte schede hanno una piastrina metallica sopra l'M.2: toglie la pellicola dal cuscinetto che smaltisce il calore."],
      fun: "«NVMe» è il linguaggio con cui l'SSD parla direttamente con la CPU: salta le vecchie regole dei dischi, ed è questo che lo rende così veloce." },
    ssd2: { title: "Secondo SSD NVMe", tag: "Un altro disco veloce", where: "Nel secondo slot M.2 della scheda.",
      what: "Molte schede hanno più slot M.2: un secondo SSD serve a separare le cose — spesso il sistema su un disco, giochi e progetti sull'altro. Più ordine e, a volte, più velocità.",
      tips: ["Il primo slot M.2 è di solito il più veloce: è collegato direttamente alla CPU. Metti lì il disco che usi di più.", "Alcuni slot M.2 «rubano» linee alla SATA o alla scheda video: il manuale lo dice.", "Si fissa con la vitina o la clip, come il primo."],
      fun: "In un solo PC puoi mettere più SSD NVMe: il limite è solo il numero di slot M.2 sulla scheda madre." },
    drive: { title: "Disco / SSD SATA", tag: "Lo spazio in più, a poco", where: "A una porta SATA, in basso sul bordo della scheda.",
      what: "Un'unità capiente dove parcheggiare foto, video e backup. Più lenta dell'M.2, ma costa poco per ogni gigabyte.",
      tips: ["Vuole due cavi diversi: uno sottile per i dati (verso la scheda), uno più largo per la corrente (dall'alimentatore).", "Gli spinotti SATA hanno una tacca a forma di L: niente verso sbagliato.", "Fissalo bene nel case: se vibra, con gli anni si rovina prima."],
      fun: "Dentro un hard disk un braccetto vola sui piatti a una distanza minuscola: in proporzione, come un aereo che sfiorasse il suolo a pochi millimetri." },
    gpu: { title: "Scheda video (GPU)", tag: "Il reparto grafica", where: "Nello slot PCIe più lungo, quello rinforzato in metallo.",
      what: "Calcola e disegna le immagini, soprattutto la grafica 3D dei giochi e il montaggio video. È quasi un piccolo computer a parte, con chip e memoria propri.",
      tips: ["Prima togli, dietro al case, le linguette metalliche all'altezza dello slot.", "Spingila dritta finché il gancetto dello slot scatta, poi fissala al case con le viti.", "Dalle corrente coi cavi PCIe dell'alimentatore, e collega il monitor a lei, non alla scheda madre."],
      fun: "La GPU fa tanti conti semplici tutti insieme; la CPU pochi conti ma complicati. Per questo le schede video oggi servono anche all'intelligenza artificiale." },
    pwr24: { title: "Cavo 24 pin", tag: "La spina principale", where: "Sul bordo lungo della scheda, in uno zoccolo rettangolare.",
      what: "Il connettore più grosso dell'alimentatore: porta le tensioni di base alla scheda madre e a ciò che le sta attorno.",
      tips: ["Ha un gancetto su un lato e si innesta in un verso solo: accompagnalo finché fa clic.", "È rigido: premi deciso ma dritto, senza piegare la scheda.", "Fai correre il cavo dietro al pannello del case, così davanti resta pulito e l'aria passa meglio."],
      fun: "L'alimentatore prende i 230 volt della presa e li abbassa a 12, 5 e 3,3 volt: tensioni stabili e innocue, adatte all'elettronica." },
    pwrcpu: { title: "Cavo CPU 8 pin (EPS)", tag: "La spinta per la CPU", where: "In alto a sinistra, vicino al socket.",
      what: "Un connettore dedicato che dà al processore la corrente in più che chiede quando spinge al massimo.",
      tips: ["È il cavo che tutti dimenticano: senza, spesso il PC resta spento e sembra «morto».", "Si innesta in un verso solo, fino al clic.", "Non confonderlo col connettore PCIe della scheda video: spinotti simili, posti diversi."],
      fun: "Si chiama EPS ed è separato dal 24 pin apposta: la CPU, sotto sforzo, può chiedere di colpo molta più corrente." },
    fans: { title: "Ventole del case", tag: "L'aria che circola", where: "A un header SYS_FAN sulla scheda.",
      what: "Le ventole del case fanno entrare aria fresca e buttano fuori quella calda, così tutti i componenti restano a temperatura, non solo la CPU.",
      tips: ["Di solito davanti e in basso si fa entrare aria, dietro e in alto la si butta fuori.", "Collega ogni ventola a un header SYS_FAN: la scheda ne regola i giri a seconda della temperatura.", "Spingere dentro un filo d'aria in più di quella che esce tiene lontana la polvere."],
      fun: "Conta più l'orientamento che il numero: poche ventole ben disposte raffreddano meglio di tante messe a caso." },
    fpanel: { title: "Pannello frontale", tag: "I pulsanti del case", where: "Ai pin F_PANEL, in basso sulla scheda.",
      what: "Sono i cavetti che collegano alla scheda il tasto di accensione, il reset, i LED e le porte USB e audio del davanti del case.",
      tips: ["Sono piccolissimi e vanno su pin precisi: qui il manuale della scheda è indispensabile.", "Il tasto d'accensione (PWR_SW) è quello che fa partire tutto: se il PC non si avvia, spesso l'errore è qui.", "I LED hanno un verso (+ e −): se non si accendono, prova a girare lo spinotto."],
      fun: "Il tasto d'accensione non «dà corrente»: dice solo alla scheda di avviarsi. La corrente arriva sempre dall'alimentatore." },
    psu: { title: "Alimentatore (PSU)", tag: "L'energia di tutto", where: "Nella sua culla in fondo al case; da qui partono tutti i cavi.",
      what: "Prende i 230 V della presa e li trasforma nelle tensioni che servono ai componenti: +12V, +5V, +3,3V. È la sorgente di ogni cavo di alimentazione del PC.",
      tips: ["Si fissa con quattro viti sul retro del case.", "La ventola va rivolta verso una griglia (di solito in basso), così prende aria fresca da fuori.", "Se è modulare, attacca solo i cavi che ti servono: meno grovigli, più aria."],
      fun: "Dentro c'è un piccolo alimentatore a commutazione: abbassa la tensione migliaia di volte al secondo, per questo è leggero e non scalda come un vecchio trasformatore." },
    pwrpcie: { title: "Cavo PCIe (alimentazione GPU)", tag: "La spinta per la scheda video", where: "Dal PSU al connettore sul bordo superiore della scheda video.",
      what: "Le schede video potenti consumano più di quanto lo slot PCIe possa dare da solo: questo cavo porta la corrente in più direttamente dall'alimentatore alla GPU.",
      tips: ["Spingi fino al clic: un connettore inserito a metà scalda e fa spegnere il PC sotto sforzo.", "Usa i cavi dell'alimentatore, non adattatori improvvisati.", "Le schede recentissime usano un connettore 12VHPWR: stesso scopo, forma diversa."],
      fun: "Una scheda video di fascia alta può chiedere da sola più corrente di tutto il resto del PC messo insieme." },
    pwrsata: { title: "Cavo di alimentazione SATA", tag: "Corrente al disco", where: "Dal PSU allo spinotto piatto del disco o SSD SATA.",
      what: "Un disco SATA vuole due cavi: uno sottile per i dati (verso la scheda) e questo, più largo, per la corrente dall'alimentatore.",
      tips: ["Lo spinotto ha una tacca a L: entra in un verso solo.", "Un cavo del PSU ha più spinotti in fila: con lo stesso puoi alimentare più dischi.", "Senza questo cavo il disco non gira e il PC non lo vede proprio."],
      fun: "SSD e hard disk SATA usano lo stesso identico spinotto di corrente: cambia la velocità, non l'alimentazione." }
  };

  const AICON = {
    cpu: '<svg viewBox="0 0 46 30" aria-hidden="true"><g fill="#8a9298"><rect x="7" y="9" width="5" height="1.6"/><rect x="7" y="14" width="5" height="1.6"/><rect x="7" y="19" width="5" height="1.6"/><rect x="34" y="9" width="5" height="1.6"/><rect x="34" y="14" width="5" height="1.6"/><rect x="34" y="19" width="5" height="1.6"/></g><rect x="12" y="4" width="22" height="22" rx="2" fill="#aab3b9"/><rect x="15" y="7" width="16" height="16" rx="1.5" fill="#d2d8db"/><polygon points="14,24 14,21 17,24" fill="#e0b54f"/></svg>',
    cooler: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="9" y="2" width="28" height="26" rx="4" fill="#3a444b"/><circle cx="23" cy="15" r="11.5" fill="#161c20"/><g stroke="#5a666e" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M23 15V5"/><path d="M23 15l8.5 5"/><path d="M23 15l-8.5 5"/></g><circle cx="23" cy="15" r="3" fill="#2d363c"/></svg>',
    ram: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="4" y="8" width="38" height="15" rx="1.5" fill="#2f6b4a"/><rect x="4" y="8" width="38" height="3" rx="1.5" fill="#6b82ff"/><rect x="8" y="13" width="30" height="6" rx="1" fill="#d7ded4"/><g fill="#e0b54f"><rect x="6" y="20.5" width="16" height="2.5"/><rect x="24" y="20.5" width="16" height="2.5"/></g></svg>',
    ssd: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="5" y="10" width="36" height="10" rx="1" fill="#0f5a3b"/><rect x="5" y="11" width="4" height="8" fill="#e0b54f"/><rect x="12" y="8" width="8" height="14" rx="1" fill="#141414"/><rect x="22" y="12" width="17" height="6" rx="1" fill="#e9e4d7"/></svg>',
    drive: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="9" y="4" width="28" height="22" rx="2" fill="#aab3b8"/><circle cx="23" cy="14" r="8.5" fill="#d2d8db" stroke="#8a9298"/><circle cx="23" cy="14" r="2.3" fill="#8a9298"/><path d="M33 23 26 16" stroke="#3b4248" stroke-width="2.4" stroke-linecap="round"/></svg>',
    gpu: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="3" y="8" width="39" height="15" rx="2" fill="#2b333a"/><circle cx="15" cy="15.5" r="6" fill="#121619"/><circle cx="30" cy="15.5" r="6" fill="#121619"/><g stroke="#5a666e" stroke-width="1.6" stroke-linecap="round"><path d="M15 15.5V10"/><path d="M30 15.5V10"/></g><rect x="12" y="23" width="22" height="3" fill="#e0b54f"/></svg>',
    cable: '<svg viewBox="0 0 46 30" aria-hidden="true"><g stroke="#8a9298" stroke-width="2" stroke-linecap="round"><path d="M6 10h10M6 15h10M6 20h10"/></g><rect x="16" y="6" width="13" height="18" rx="2" fill="#2a2f34"/><g stroke="#e0b54f" stroke-width="2" stroke-linecap="round"><path d="M29 10h11M29 15h11M29 20h11"/></g></svg>',
    paste: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="5" y="9" width="4" height="12" rx="1" fill="#8a9298"/><rect x="9" y="11" width="22" height="8" rx="1.5" fill="#d7ded4" stroke="#9aa6ad" stroke-width=".6"/><rect x="31" y="12.5" width="6" height="5" fill="#aab3b9"/><path d="M37 15h6" stroke="#8a9298" stroke-width="1.6" stroke-linecap="round"/><circle cx="43.4" cy="15" r="1.6" fill="#cdd4d8"/></svg>',
    fan: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="9" y="1" width="28" height="28" rx="3" fill="#2f3840"/><circle cx="23" cy="15" r="12" fill="#12171b"/><g stroke="#5a666e" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M23 15V4"/><path d="M23 15l9.5 5.5"/><path d="M23 15l-9.5 5.5"/></g><circle cx="23" cy="15" r="3" fill="#2d363c"/></svg>',
    fpanel: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="8" y="9" width="30" height="12" rx="1.5" fill="#2a2f34"/><g fill="#e0b54f"><rect x="11" y="12" width="2.5" height="6"/><rect x="16" y="12" width="2.5" height="6"/><rect x="21" y="12" width="2.5" height="6"/><rect x="26" y="12" width="2.5" height="6"/><rect x="31" y="12" width="2.5" height="6"/></g></svg>',
    psu: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="5" y="6" width="27" height="20" rx="2" fill="#2a2f34" stroke="#4a545b" stroke-width=".6"/><circle cx="18" cy="16" r="7.5" fill="#12171b"/><g stroke="#5a666e" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M18 16V8.5"/><path d="M18 16l6.5 3.8"/><path d="M18 16l-6.5 3.8"/></g><circle cx="18" cy="16" r="2" fill="#2d363c"/><g stroke="#e0b54f" stroke-width="2" stroke-linecap="round"><path d="M32 11h9M32 16h9M32 21h9"/></g></svg>'
  };

  function aPieces() {
    const nvme = hasK("storage") && /NVMe/i.test(build.storage.name);
    const integrated = hasK("gpu") && build.gpu.integrated;
    const showGpu = !integrated;
    const list = [];
    // DIFFICILE: l'alimentatore si installa come unità, e i cavi partono da lì
    if (hardMode) list.push({ id: "psu", label: "Alimentatore (PSU)", sub: hasK("psu") ? build.psu.watt + " W" : "Energia", icon: "psu", tray: "R", accepts: ["psu"],
      hint: "L'alimentatore va nella sua culla, in fondo al case (la striscia in basso)." });
    list.push(
      { id: "cpu", label: "Processore", sub: hasK("cpu") ? build.cpu.name : "CPU", icon: "cpu", tray: "L", accepts: ["socket"],
        hint: "Il processore va nel socket: il quadrato con i contatti, in alto al centro." },
      { id: "paste", label: "Pasta termica", sub: "Una goccia sulla CPU", icon: "paste", tray: "L", accepts: ["socket"], requires: "cpu",
        requiresMsg: "Prima la CPU! La pasta termica va messa <b>sopra il processore</b>.",
        hint: "La pasta termica va al centro del processore, già nel socket." },
      { id: "cooler", label: "Dissipatore", sub: hasK("cooler") ? build.cooler.name : "Raffreddamento", icon: "cooler", tray: "L", accepts: ["socket"], requires: "paste",
        requiresMsg: "Prima la <b>pasta termica</b> sulla CPU, poi il dissipatore sopra.",
        hint: "Il dissipatore va sopra il processore, al centro del socket." },
      { id: "ram1", label: "RAM · modulo 1", sub: hasK("ram") ? build.ram.type : "Memoria", icon: "ram", tray: "L", group: "ram", accepts: ["dimm2", "dimm4"],
        hint: "La RAM va negli slot lunghi e verticali, a destra del processore." },
      { id: "ram2", label: "RAM · modulo 2", sub: hasK("ram") ? build.ram.type : "Memoria", icon: "ram", tray: "L", group: "ram", accepts: ["dimm2", "dimm4"],
        hint: "La RAM va negli slot lunghi e verticali, a destra del processore." },
      { id: "storage", label: nvme ? (hardMode ? "SSD M.2 (1°)" : "SSD M.2") : "Disco / SSD SATA", sub: hasK("storage") ? build.storage.name : "Archivio", icon: nvme ? "ssd" : "drive", tray: "R", accepts: [nvme ? "m2" : "sata"], nvme,
        hint: nvme ? "L'SSD M.2 va nello slot M.2, sotto il processore." : "Il disco si collega (cavo dati) a una porta SATA, in basso sul bordo destro." }
    );
    if (hardMode) list.push({ id: "ssd2", label: "2° SSD NVMe", sub: "Disco extra", icon: "ssd", tray: "R", accepts: [nvme ? "m2b" : "m2"],
      hint: nvme ? "Il secondo SSD va nell'altro slot M.2 (M.2_2), più in basso sulla scheda." : "Questo SSD M.2 va nello slot M.2_1, sotto il processore." });
    if (showGpu) list.push({ id: "gpu", label: "Scheda video", sub: (hasK("gpu") && !build.gpu.integrated) ? build.gpu.name : "GPU dedicata", icon: "gpu", tray: "R", accepts: ["pcie"],
      hint: "La scheda video va nello slot lungo con il rinforzo (PCIe x16)." });
    list.push({ id: "pwr24", label: "Cavo ATX 24 pin", sub: "Alimenta la scheda", icon: "cable", tray: "R", accepts: ["atx24"], requiresAll: hardMode ? ["psu"] : null,
      requiresMsg: "Prima installa l'<b>alimentatore</b>: i cavi di corrente partono da lì.",
      hint: "Il cavo grande a 24 pin va sul bordo destro della scheda." });
    list.push({ id: "pwrcpu", label: "Cavo CPU 8 pin (EPS)", sub: "Alimenta la CPU", icon: "cable", tray: "R", accepts: ["eps"], requiresAll: hardMode ? ["psu"] : null,
      requiresMsg: "Prima installa l'<b>alimentatore</b>: i cavi di corrente partono da lì.",
      hint: "Il cavo CPU a 8 pin va in alto a sinistra, vicino al processore." });
    if (hardMode && showGpu) list.push({ id: "pwrpcie", label: "Cavo PCIe (GPU)", sub: "Corrente alla scheda video", icon: "cable", tray: "R", accepts: ["gpupwr"], requiresAll: ["psu", "gpu"],
      requiresMsg: "Serve prima l'<b>alimentatore</b> <u>e</u> la <b>scheda video</b> montata.",
      hint: "Il cavo PCIe va sul connettore in cima alla scheda video." });
    if (hardMode && !nvme) list.push({ id: "pwrsata", label: "Cavo SATA (corrente)", sub: "Corrente al disco", icon: "cable", tray: "R", accepts: ["satapwr"], requiresAll: ["psu", "storage"],
      requiresMsg: "Serve prima l'<b>alimentatore</b> <u>e</u> il <b>disco</b> collegato ai dati.",
      hint: "Il cavo di corrente SATA va sullo spinotto del disco." });
    list.push({ id: "fans", label: "Ventole del case", sub: "Flusso d'aria", icon: "fan", tray: "R", accepts: ["sysfan"],
      hint: "Le ventole si collegano a un header SYS_FAN sulla scheda." });
    list.push({ id: "fpanel", label: "Pannello frontale", sub: "Accensione, LED, USB", icon: "fpanel", tray: "R", accepts: ["fpanel"],
      hint: "I cavetti del frontale vanno sui pin F_PANEL, in basso sulla scheda." });
    return list;
  }

  const ZN = {
    socket: [110, 38, 68, 62], eps: [62, -3, 36, 17],
    dimm1: [190, 12, 12, 144], dimm2: [202, 12, 12, 144], dimm3: [214, 12, 12, 144], dimm4: [226, 12, 12, 144],
    m2: [60, 106, 102, 28], pcie: [16, 150, 124, 19], atx24: [272, 50, 24, 62], sata: [266, 178, 32, 46],
    sysfan: [14, 120, 26, 16], fpanel: [222, 216, 36, 20],
    psu: [10, 248, 150, 24], gpupwr: [138, 137, 26, 12], satapwr: [250, 150, 32, 13],
    m2b: [20, 180, 110, 13]
  };
  let hardMode = false;   // componenti: Base (false) / Avanzato (true)
  let guidedMode = false; // modalità: Fai da solo (false) / Guidata (true)

  function boardSVG() {
    const sock = hasK("cpu") ? build.cpu.socket : "SOCKET";
    const extraZones = ["psu", "gpupwr", "satapwr", "m2b"];
    const zoneRects = Object.keys(ZN).filter((k) => hardMode || extraZones.indexOf(k) < 0).map((k) => {
      const z = ZN[k];
      return '<rect class="hwa-zone" data-zone="' + k + '" x="' + z[0] + '" y="' + z[1] + '" width="' + z[2] + '" height="' + z[3] + '" tabindex="0" role="button" aria-label="' + k + '"/>';
    }).join("");
    return '' +
    '<svg id="hwaBoard" viewBox="0 0 300 ' + (hardMode ? 276 : 240) + '" role="img" aria-label="Scheda madre vista dall\'alto">' +
      '<defs>' +
        '<pattern id="hwaPins" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="#243441"/><circle cx="1" cy="1" r=".42" fill="#a7b6c0"/></pattern>' +
        '<pattern id="hwaFins" width="10" height="3.2" patternUnits="userSpaceOnUse"><rect width="10" height="3.2" fill="#3a4e5c"/><rect width="10" height="1.5" fill="#54707f"/></pattern>' +
        '<pattern id="hwaDots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".5" fill="#163041"/></pattern>' +
      '</defs>' +
      '<rect x="2" y="2" width="296" height="236" rx="6" fill="#0e2733"/>' +
      '<rect x="2" y="2" width="296" height="236" rx="6" fill="url(#hwaDots)"/>' +
      '<path d="M150 55H165L172 48V30 M118 98V108H74V116 M218 100H248V150H276 M60 140V170H150 M120 214H180V208" stroke="#1b3744" stroke-width=".7" fill="none"/>' +
      '<g fill="#b39d62"><circle cx="172" cy="24" r="2.8"/><circle cx="290" cy="10" r="2.8"/><circle cx="12" cy="150" r="2.8"/><circle cx="172" cy="232" r="2.8"/><circle cx="290" cy="150" r="2.8"/><circle cx="12" cy="232" r="2.8"/></g>' +
      '<g fill="#0c1b22"><circle cx="172" cy="24" r="1.4"/><circle cx="290" cy="10" r="1.4"/><circle cx="12" cy="150" r="1.4"/><circle cx="172" cy="232" r="1.4"/><circle cx="290" cy="150" r="1.4"/><circle cx="12" cy="232" r="1.4"/></g>' +
      '<rect x="6" y="12" width="22" height="92" rx="2" fill="#2b3d48" stroke="#41586680" stroke-width=".6"/><path d="M10 20 26 30 M10 40 26 50 M10 60 26 70 M10 80 26 90" stroke="#415866" stroke-width="1"/><text class="silk" transform="translate(16 108) rotate(-90)">REAR I/O</text>' +
      '<rect x="40" y="14" width="64" height="12" rx="1.5" fill="url(#hwaFins)" stroke="#5a6b74" stroke-width=".4"/>' +
      '<rect x="66" y="0" width="22" height="8" fill="#141414" stroke="#3a3a3a" stroke-width=".3"/><text class="silk" x="90" y="6">CPU 8-pin</text>' +
      '<text class="silk" x="144" y="40" text-anchor="middle">' + sock + '</text>' +
      '<rect x="118" y="44" width="52" height="52" rx="1.5" fill="#8d969c" stroke="#b5bcc0" stroke-width=".4"/><rect x="123" y="49" width="42" height="42" rx=".8" fill="#262a2c"/><rect x="125" y="51" width="38" height="38" fill="url(#hwaPins)"/><polygon points="119.5,95 119.5,90 124.5,95" fill="#e0b54f"/>' +
      '<rect x="150" y="2" width="8" height="4" fill="#e9e4de"/><text class="silk" x="149" y="11">CPU_FAN</text>' +
      '<g>' + ["A1", "A2", "B1", "B2"].map(function (lab, i) {
        var x = 191 + i * 12, c = (i % 2) ? "#55616a" : "#2e353a";
        return '<rect x="' + x + '" y="14" width="9" height="140" rx=".6" fill="' + c + '"/><rect x="' + (x + 2) + '" y="16" width="1.5" height="60" fill="#0b0b0b"/><rect x="' + (x + 2) + '" y="80" width="1.5" height="62" fill="#0b0b0b"/>';
      }).join("") + '<text class="silk" x="215" y="162" text-anchor="middle">DDR DIMM</text></g>' +
      '<text class="silk" x="64" y="113">' + (hardMode ? "M.2_1" : "M.2") + ' · SSD</text><rect x="62" y="116" width="96" height="12" rx=".6" fill="none" stroke="#cdd8dc80" stroke-width=".5" stroke-dasharray="2 1.5"/><circle cx="155" cy="122" r="1.7" fill="#b39d62"/>' +
      (hardMode ? '<text class="silk" x="22" y="177">M.2_2 · SSD</text><rect x="20" y="180" width="108" height="12" rx=".6" fill="none" stroke="#cdd8dc80" stroke-width=".5" stroke-dasharray="2 1.5"/><circle cx="124" cy="186" r="1.7" fill="#b39d62"/>' : "") +
      '<text class="silk" x="24" y="151">PCIEX16_1</text><rect x="24" y="153" width="96" height="7" rx=".6" fill="#3b4349" stroke="#aab3b8" stroke-width=".6"/><rect x="25.5" y="155.6" width="16" height="1.4" fill="#0b0b0b"/><rect x="43.5" y="155.6" width="74" height="1.4" fill="#0b0b0b"/><rect x="120" y="152" width="5" height="9" rx=".5" fill="#5c666c"/>' +
      '<rect x="278" y="54" width="10" height="52" fill="url(#hwaPins)" stroke="#3a3a3a" stroke-width=".3"/><text class="silk" transform="translate(276 106) rotate(-90)">ATX 24-pin</text>' +
      '<g id="hwaSata">' + [170, 181, 192, 203].map(function (y) { return '<rect x="282" y="' + y + '" width="13" height="9" rx=".6" fill="#3a3f43"/><path d="M284 ' + (y + 2.2) + 'h9v2h-6v3h-3z" fill="#0b0b0b"/>'; }).join("") + '</g><text class="silk" x="296" y="166" text-anchor="end">SATA</text>' +
      '<rect x="150" y="170" width="54" height="42" rx="3" fill="url(#hwaFins)" stroke="#5a6b74" stroke-width=".4"/><rect x="161" y="180" width="32" height="22" rx="1.5" fill="#46535b"/><text x="177" y="193" text-anchor="middle" font-family="Fraunces, serif" font-weight="600" font-size="5" fill="#8794a0">SC Z-1</text><text x="177" y="198.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.2" fill="#8794a0">CHIPSET</text>' +
      '<circle class="hwa-led" cx="262" cy="230" r="2"/><text class="silk" x="266" y="231.5">PWR</text>' +
      '<rect x="20" y="124" width="11" height="6" fill="url(#hwaPins)" stroke="#3a3a3a" stroke-width=".3"/><text class="silk" x="18" y="122">SYS_FAN</text>' +
      '<rect x="228" y="224" width="22" height="7" fill="url(#hwaPins)" stroke="#3a3a3a" stroke-width=".3"/><text class="silk" x="228" y="222">F_PANEL</text>' +
      '<text class="silk big" x="40" y="212">ATX · 305 × 244 mm</text>' +
      (hardMode ?
        // --- extra della modalità difficile: connettori e culla dell'alimentatore ---
        '<text class="silk" x="151" y="134" text-anchor="middle">PCIe → GPU</text>' +
        '<text class="silk" x="266" y="148" text-anchor="middle">SATA pwr</text>' +
        '<rect x="4" y="242" width="292" height="30" rx="4" fill="#0a1a22" stroke="#163041" stroke-width=".8"/>' +
        '<rect x="4" y="242" width="292" height="30" rx="4" fill="url(#hwaDots)"/>' +
        '<rect x="10" y="247" width="150" height="21" rx="2" fill="none" stroke="#cdd8dc55" stroke-width=".7" stroke-dasharray="2.4 1.6"/>' +
        '<text class="silk" x="86" y="245">CULLA ALIMENTATORE (PSU)</text>'
      : "") +
      '<g id="hwaOverlays">' +
        '<g class="hwa-ov" id="ov-cpu" style="display:none"><rect x="120" y="46" width="48" height="48" rx="1" fill="#2f6b3a"/><rect x="123" y="49" width="42" height="42" rx="3" fill="#cdd4d8"/><text x="144" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="#79838a">CPU</text><polygon points="121,92 121,88 125,92" fill="#e0b54f"/><rect x="117" y="43" width="54" height="54" rx="1" fill="none" stroke="#9aa3a8" stroke-width="2.2"/></g>' +
        '<g class="hwa-ov" id="ov-paste" style="display:none"><circle cx="144" cy="70" r="4.6" fill="#c7ced3"/><circle cx="144" cy="70" r="4.6" fill="none" stroke="#8a9298" stroke-width=".4"/></g>' +
        '<g class="hwa-ov" id="ov-cooler" style="display:none"><rect x="106" y="36" width="76" height="68" rx="5" fill="#252b30" stroke="#4d565d" stroke-width=".6"/><circle cx="144" cy="70" r="31" fill="#0f1317"/><g class="hwa-fan" transform="translate(144 70)"><g stroke="#4a555d" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M0 0V-26"/><path d="M0 0L22.5 13"/><path d="M0 0L-22.5 13"/></g></g><circle cx="144" cy="70" r="8" fill="#2c343a"/><circle cx="144" cy="70" r="8" fill="none" stroke="#6b82ff" stroke-width="1.4"/></g>' +
        '<g class="hwa-ov" id="ov-dimm2" style="display:none"><rect x="201.5" y="12" width="10" height="142" rx="1" fill="#2a3037" stroke="#4f5860" stroke-width=".4"/><rect x="203" y="13" width="7" height="140" rx=".6" fill="#353e46"/><rect x="205" y="15" width="2.4" height="138" fill="#6b82ff"/></g>' +
        '<g class="hwa-ov" id="ov-dimm4" style="display:none"><rect x="225.5" y="12" width="10" height="142" rx="1" fill="#2a3037" stroke="#4f5860" stroke-width=".4"/><rect x="227" y="13" width="7" height="140" rx=".6" fill="#353e46"/><rect x="229" y="15" width="2.4" height="138" fill="#6b82ff"/></g>' +
        '<g class="hwa-ov" id="ov-ssd" style="display:none"><rect x="62" y="116.5" width="94" height="11" rx="1" fill="#0f5a3b"/><rect x="66" y="119" width="8" height="7" rx=".6" fill="#121212"/><rect x="78" y="118" width="64" height="8" rx="1" fill="#e9e4d7"/><text x="110" y="124" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.2" font-weight="700" fill="#333">SSD NVMe</text><circle cx="155" cy="122" r="2.2" fill="#c3cacd" stroke="#7a8287" stroke-width=".4"/></g>' +
        (hardMode ? '<g class="hwa-ov" id="ov-ssd-b" style="display:none"><rect x="20" y="180.5" width="106" height="11" rx="1" fill="#0f5a3b"/><rect x="24" y="183" width="8" height="7" rx=".6" fill="#121212"/><rect x="36" y="182" width="74" height="8" rx="1" fill="#e9e4d7"/><text x="73" y="188" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.2" font-weight="700" fill="#333">SSD NVMe 2</text><circle cx="124" cy="186" r="2.2" fill="#c3cacd" stroke="#7a8287" stroke-width=".4"/></g>' : "") +
        '<g class="hwa-ov" id="ov-sata" style="display:none"><path d="M288 174 C300 173 300 185 300 190" stroke="#c23b2f" stroke-width="2.4" fill="none"/><rect x="280" y="169" width="18" height="11" rx="1" fill="#c23b2f"/><rect x="282" y="171.5" width="2" height="6" fill="#8c231b"/></g>' +
        '<g class="hwa-ov" id="ov-gpu" style="display:none"><rect x="12" y="148" width="6" height="18" fill="#aab3b8"/><rect x="18" y="146" width="210" height="22" rx="2.5" fill="#22272c" stroke="#40484f" stroke-width=".6"/><circle cx="60" cy="157" r="9" fill="#111518"/><circle cx="92" cy="157" r="9" fill="#111518"/><rect x="28" y="147" width="150" height="1.6" fill="#6b82ff"/><text x="150" y="160" text-anchor="middle" font-family="Fraunces, serif" font-weight="600" font-size="6" fill="#59646c">GPU</text></g>' +
        '<g class="hwa-ov" id="ov-pwr24" style="display:none"><path d="M292 60 C305 60 305 54 300 50" stroke="#e0b54f" stroke-width="1.6" fill="none"/><rect x="275" y="52" width="14" height="56" rx="1" fill="#141414" stroke="#3a3a3a" stroke-width=".4"/><rect x="284" y="76" width="4" height="8" rx=".5" fill="#2a2a2a"/></g>' +
        '<g class="hwa-ov" id="ov-pwrcpu" style="display:none"><path d="M60 2 C48 2 44 -6 40 -10" stroke="#e0b54f" stroke-width="1.6" fill="none"/><rect x="63" y="-2" width="24" height="12" rx="1" fill="#141414" stroke="#3a3a3a" stroke-width=".4"/></g>' +
        '<g class="hwa-ov" id="ov-fans" style="display:none"><path d="M26 124 C26 112 20 108 12 108" stroke="#4a555d" stroke-width="1.4" fill="none"/><rect x="19" y="122" width="13" height="7" rx="1" fill="#2a2f34"/></g>' +
        '<g class="hwa-ov" id="ov-fpanel" style="display:none"><path d="M240 224 C240 216 246 212 252 210" stroke="#4a555d" stroke-width="1.2" fill="none"/><rect x="226" y="222" width="26" height="10" rx="1" fill="#2a2f34"/><rect x="229" y="225" width="2.2" height="4" fill="#5dff9c"/><rect x="233" y="225" width="2.2" height="4" fill="#ff6a5c"/><rect x="240" y="225" width="6" height="4" rx="1" fill="#3a7bdb"/></g>' +
        (hardMode ?
          '<g class="hwa-ov" id="ov-psu" style="display:none"><rect x="10" y="247" width="150" height="21" rx="2" fill="#20262b" stroke="#454f56" stroke-width=".7"/><circle cx="29" cy="257.5" r="8.6" fill="#10151a"/><g stroke="#4a555d" stroke-width="1.5" stroke-linecap="round" fill="none"><path d="M29 257.5V250"/><path d="M29 257.5l6.6 3.9"/><path d="M29 257.5l-6.6 3.9"/></g><circle cx="29" cy="257.5" r="2.3" fill="#2d363c"/><text x="99" y="259" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.6" font-weight="700" fill="#7a858c">PSU</text><g class="pcbl" stroke="#e0b54f" stroke-width="1" opacity=".6" fill="none"><path d="M160 251 C205 250 230 220 285 112"/><path d="M160 258 C120 258 90 60 80 6"/></g></g>' +
          '<g class="hwa-ov" id="ov-pwrpcie" style="display:none"><rect x="138" y="138" width="24" height="11" rx="1" fill="#141414" stroke="#3a3a3a" stroke-width=".4"/><g fill="#e0b54f"><rect x="141" y="140.5" width="2" height="6"/><rect x="145" y="140.5" width="2" height="6"/><rect x="149" y="140.5" width="2" height="6"/><rect x="153" y="140.5" width="2" height="6"/></g><path class="pcbl" d="M162 143 C210 143 240 210 160 252" stroke="#e0b54f" stroke-width="1.5" fill="none" opacity=".85"/></g>' +
          '<g class="hwa-ov" id="ov-pwrsata" style="display:none"><rect x="252" y="151" width="24" height="11" rx="1" fill="#141414" stroke="#3a3a3a" stroke-width=".4"/><rect x="254" y="153" width="3" height="7" fill="#2a2a2a"/><path class="pcbl" d="M276 156 C292 156 294 210 160 254" stroke="#e0b54f" stroke-width="1.5" fill="none" opacity=".85"/></g>'
        : "") +
      '</g>' +
      '<g id="hwaZones">' + zoneRects + '</g>' +
    '</svg>';
  }

  function cardHTML(p) {
    return '<button type="button" class="hwa-card" data-id="' + p.id + '" aria-label="' + p.label + ', ' + p.sub + '">' +
      AICON[p.icon] + '<span class="hwa-c-name">' + p.label + '</span><span class="hwa-c-sub">' + p.sub + '</span><span class="hwa-c-done">Montato</span></button>';
  }

  let A = null;

  function renderAssembly() {
    A = { placed: {}, slot: {}, errors: 0, hints: 0, selected: null, complete: false, hard: hardMode, guided: guidedMode, tidied: false, pieces: aPieces(), start: Date.now() };
    const L = A.pieces.filter((p) => p.tray === "L"), R = A.pieces.filter((p) => p.tray === "R");
    $("asm").innerHTML =
      '<div class="hwa-wrap">' +
        '<div class="hwa-top">' +
          '<div><h2 class="wiz-title">Monta il PC</h2><p class="hwa-sub"><b>Componenti</b>: Base (l\'essenziale) o Avanzato (il PC completo, alimentatore e tutti i cavi). <b>Modalità</b>: Fai da solo (scopri tu dove va ogni pezzo) o Guidata (ti guido passo per passo).</p></div>' +
          '<div class="hwa-stats">' +
            '<div class="seg hwa-asmmode" id="aCompSeg" role="group" aria-label="Componenti">' +
              '<button type="button" class="seg-btn ' + (!A.hard ? "active" : "") + '" data-c="0">Base</button>' +
              '<button type="button" class="seg-btn ' + (A.hard ? "active" : "") + '" data-c="1">Avanzato</button>' +
            '</div>' +
            '<div class="seg hwa-asmmode" id="aModeSeg" role="group" aria-label="Modalità">' +
              '<button type="button" class="seg-btn ' + (!A.guided ? "active" : "") + '" data-m="0">🧩 Fai da solo</button>' +
              '<button type="button" class="seg-btn ' + (A.guided ? "active" : "") + '" data-m="1">🧭 Guidata</button>' +
            '</div>' +
            '<div class="hwa-stat"><small>Montati</small><b id="aPieces">0/' + A.pieces.length + '</b></div>' +
            '<button type="button" class="ghost-btn" id="aHint">Aiuto</button>' +
            '<button type="button" class="ghost-btn" id="aReset">Ricomincia</button></div>' +
        '</div>' +
        '<div class="hwa-guide" id="aGuide"></div>' +
        '<div class="hwa-bench">' +
          '<div class="hwa-tray"><h3>Vassoio A</h3><div class="hwa-cards" id="aTrayL">' + L.map(cardHTML).join("") + '</div></div>' +
          '<div class="hwa-board-col"><div class="hwa-boardwrap" id="aWrap">' +
            '<div class="hwa-toast" id="aToast" role="status"></div>' + boardSVG() +
            '<button class="hwa-power" id="aPower" type="button" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v8"/><path d="M6.3 7.5a8 8 0 1 0 11.4 0"/></svg>Accendi il PC</button>' +
            '<div class="hwa-boot" id="aBoot" hidden></div></div>' +
            '<p class="hwa-help"><b>Trascina</b> un componente sul punto giusto, o <b>toccalo</b> e poi tocca dove va.</p></div>' +
          '<div class="hwa-tray"><h3>Vassoio B</h3><div class="hwa-cards" id="aTrayR">' + R.map(cardHTML).join("") + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="hwa-modal" id="aModal" hidden><div class="hwa-sheet" id="aSheet" role="dialog" aria-modal="true" aria-labelledby="aSheetT"></div></div>' +
      '<div class="hwa-modal" id="aCpuModal" hidden><div class="hwa-sheet" id="aCpuSheet" role="dialog" aria-modal="true"></div></div>';
    wireAssembly();
  }

  function fmtA(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }

  let aToastT;
  function toastA(msg, kind) {
    const t = $("aToast"); t.innerHTML = msg; t.className = "hwa-toast show " + kind;
    clearTimeout(aToastT); aToastT = setTimeout(() => { t.className = "hwa-toast " + kind; }, kind === "bad" ? 4200 : 2800);
  }

  function selectA(id) {
    A.selected = id;
    document.querySelectorAll(".hwa-card").forEach((c) => c.classList.toggle("sel", c.dataset.id === id));
    const b = $("hwaBoard"); if (b) b.classList.toggle("selecting", !!id);
  }
  function nextLabel() { return (A.pieces.find((p) => p.id === activePieceId()) || {}).label || "il prossimo pezzo"; }
  function toggleSelectA(id) {
    if (A.placed[id] || A.complete) return;
    if (A.guided && activePieceId() !== id) { toastA("Modalità guidata: monta prima <b>" + nextLabel() + "</b>.", "info"); return; }
    if (A.selected === id) { selectA(null); return; }
    selectA(id);
    toastA((A.pieces.find((p) => p.id === id).label) + ": ora tocca il punto della scheda dove va.", "info");
  }

  function zoneAt(x, y) {
    let best = null, bd = 18;
    document.querySelectorAll(".hwa-zone").forEach((z) => {
      const r = z.getBoundingClientRect();
      const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom), d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = z.dataset.zone; }
    });
    return best;
  }
  function hotZone(zone) { document.querySelectorAll(".hwa-zone").forEach((z) => z.classList.toggle("hot", z.dataset.zone === zone)); }

  function failA(id, msg) {
    toastA(msg, "bad");
    A.errors++;
    const c = document.querySelector('.hwa-card[data-id="' + id + '"]');
    c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  }

  function activePieceId() {
    for (let i = 0; i < A.pieces.length; i++) if (!A.placed[A.pieces[i].id]) return A.pieces[i].id;
    return null;
  }

  function tryPlaceA(id, zone) {
    const p = A.pieces.find((x) => x.id === id);
    if (!p || A.placed[id] || A.complete || !zone) return;
    if (A.guided && activePieceId() !== id) return failA(id, "Modalità <b>guidata</b>: ora tocca montare <b>" + nextLabel() + "</b>.");
    if (p.requires && !A.placed[p.requires]) return failA(id, p.requiresMsg);
    if (p.requiresAll) { for (let i = 0; i < p.requiresAll.length; i++) { if (!A.placed[p.requiresAll[i]]) return failA(id, p.requiresMsg); } }
    if (p.group === "ram") {
      if (zone === "dimm1" || zone === "dimm3") return failA(id, "Entrerebbe, ma con due moduli il manuale consiglia gli slot <b>alternati</b> (il 2° e il 4°) per il <b>dual channel</b>.");
      if (A.slot[zone]) return failA(id, "Questo slot è già occupato: usa l'altro slot consigliato.", false);
    }
    if (p.accepts.indexOf(zone) >= 0) { if (id === "cpu") return openCpuModal(); return placeA(id, zone, p); }
    failA(id, "Non va qui. " + p.hint);
  }

  function placeA(id, zone, p) {
    A.placed[id] = zone;
    let ovId;
    if (p.group === "ram") { A.slot[zone] = id; ovId = "ov-" + zone; }
    else if (id === "storage") ovId = p.nvme ? "ov-ssd" : "ov-sata";
    else if (id === "ssd2") ovId = (zone === "m2b") ? "ov-ssd-b" : "ov-ssd";
    else ovId = "ov-" + id;
    const g = document.getElementById(ovId);
    if (g) { g.style.display = ""; g.classList.remove("in"); void g.getBoundingClientRect(); g.classList.add("in"); }
    const card = document.querySelector('.hwa-card[data-id="' + id + '"]');
    card.classList.add("placed"); card.setAttribute("aria-disabled", "true");
    selectA(null);
    const n = Object.keys(A.placed).length;
    $("aPieces").textContent = n + "/" + A.pieces.length;
    if (n === A.pieces.length) A.complete = true;
    applyGuidance();
    let key = id;
    if (p.group === "ram") key = (A.slot.dimm2 && A.slot.dimm4) ? "ram2" : "ram";
    else if (id === "storage") key = p.nvme ? "ssd" : "drive";
    setTimeout(() => showAInfo(key), 360);
  }

  function onComplete() { if (A.hard && !A.tidied) startCableMgmt(); else revealPower(); }

  function showAInfo(key) {
    const d = AINFO[key];
    if (!d) { if (A.complete) onComplete(); return; }
    $("aSheet").innerHTML =
      '<div class="i-tag">' + d.tag + '</div><h3 id="aSheetT">' + d.title + '</h3>' +
      '<p>' + d.what + '</p>' +
      '<div class="where"><small>Dove va</small><span>' + d.where + '</span></div>' +
      '<h4>Mentre lo monti</h4><ul class="hwa-tips">' + d.tips.map((t) => '<li>' + t + '</li>').join("") + '</ul>' +
      '<div class="hwa-fun"><b>Lo sapevi?</b> ' + d.fun + '</div>' +
      '<button class="run-btn" type="button" id="aInfoOk">' + (A.complete ? (A.hard ? "Ultimo passo: i cavi →" : "Ho capito: accendiamo! →") : "Ho capito, avanti") + '</button>';
    $("aModal").hidden = false;
    $("aInfoOk").focus();
    $("aInfoOk").addEventListener("click", () => { $("aModal").hidden = true; if (A.complete) onComplete(); });
  }

  function startCableMgmt() {
    if (A.tidied) { revealPower(); return; }
    $("aSheet").innerHTML =
      '<div class="i-tag">Ultimo tocco</div><h3>La gestione dei cavi</h3>' +
      '<p>I componenti ci sono tutti. Prima di accendere, un tecnico <b>ordina i cavi</b>: li fa passare <b>dietro</b> alla scheda, nei passacavi, e li ferma con le fascette. Non è solo questione di estetica.</p>' +
      '<div class="where"><small>Perché conta</small><span>Cavi ordinati = aria che circola meglio, temperature più basse e manutenzione più facile domani.</span></div>' +
      '<h4>Come si fa</h4><ul class="hwa-tips"><li>Fai correre i cavi lunghi <b>dietro</b> al pannello, non davanti ai componenti.</li><li>Raggruppali con le <b>fascette</b> (spesso in velcro): niente grovigli vicino alle ventole.</li><li>Lascia un po\' di gioco vicino ai connettori, così i cavi non tirano.</li></ul>' +
      '<div class="hwa-fun"><b>Lo sapevi?</b> Un fascio di cavi davanti alla ventola può alzare la temperatura interna di diversi gradi: ordinare i cavi raffredda davvero.</div>' +
      '<button class="run-btn" type="button" id="aTidy">🧹 Sistema i cavi dietro il pannello</button>';
    $("aModal").hidden = false;
    $("aTidy").focus();
    $("aTidy").addEventListener("click", () => {
      A.tidied = true;
      const bd = $("hwaBoard"); if (bd) bd.classList.add("tidy");
      $("aModal").hidden = true;
      toastA("Cavi in ordine: più aria e PC più pulito. ✨", "ok");
      setTimeout(revealPower, 520);
    });
  }

  function revealPower() { const b = $("aPower"); if (b) { b.hidden = false; b.focus(); } }

  /* mini-gioco: orienta la CPU prima di posarla nel socket */
  function cpuStageSVG() {
    return '<svg viewBox="0 0 120 120" aria-label="Allinea il processore al socket">' +
      '<rect x="8" y="8" width="104" height="104" rx="5" fill="#8d969c"/>' +
      '<rect x="16" y="16" width="88" height="88" rx="2" fill="#2c2f31"/>' +
      '<rect x="16" y="36" width="5" height="12" fill="#8d969c"/><rect x="99" y="36" width="5" height="12" fill="#8d969c"/>' +
      '<polygon points="11,109 11,96 24,109" fill="#e0b54f"/>' +
      '<text x="60" y="17" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="5" fill="#eef3f4">SOCKET</text>' +
      '<g id="aCpuChip">' +
        '<rect x="22" y="22" width="76" height="76" rx="2" fill="#2f6b3a"/>' +
        '<rect x="31" y="31" width="58" height="58" rx="4" fill="#cdd4d8"/>' +
        '<text x="60" y="64" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="#79838a">CPU</text>' +
        '<polygon points="24,96 24,84 36,96" fill="#e0b54f"/>' +
      '</g></svg>';
  }

  function openCpuModal() {
    let ang = [90, 180, 270][Math.floor(Math.random() * 3)];
    $("aCpuSheet").innerHTML =
      '<div class="i-tag">Momento delicato</div><h3>Orienta il processore</h3>' +
      '<p>La CPU entra nel socket in un verso solo. Ruotala finché il <b>triangolino</b> dorato nell\'angolo coincide con quello segnato sul socket, poi appoggiala.</p>' +
      '<div class="hwa-cpu-stage">' + cpuStageSVG() + '</div>' +
      '<div class="hwa-cpu-ctrl"><button type="button" class="ghost-btn" id="aRotL">⟲ Ruota</button><button type="button" class="ghost-btn" id="aRotR">Ruota ⟳</button></div>' +
      '<div class="hwa-cpu-msg" id="aCpuMsg" aria-live="polite"></div>' +
      '<button class="run-btn" type="button" id="aCpuGo">Appoggia la CPU nel socket</button>';
    $("aCpuModal").hidden = false;
    const chip = () => document.getElementById("aCpuChip");
    const apply = (anim) => { const c = chip(); if (!anim) c.style.transition = "none"; c.style.transform = "rotate(" + ang + "deg)"; if (!anim) { void c.getBoundingClientRect(); c.style.transition = ""; } };
    apply(false);
    const clearMsg = () => { const m = $("aCpuMsg"); m.textContent = ""; m.className = "hwa-cpu-msg"; };
    $("aRotL").onclick = () => { ang -= 90; apply(true); clearMsg(); };
    $("aRotR").onclick = () => { ang += 90; apply(true); clearMsg(); };
    $("aRotR").focus();
    $("aCpuGo").onclick = () => {
      if ((((ang % 360) + 360) % 360) === 0) { $("aCpuModal").hidden = true; placeA("cpu", "socket", A.pieces.find((p) => p.id === "cpu")); }
      else { const m = $("aCpuMsg"); m.textContent = "Fermati: il triangolino non è allineato. Forzando così si piegherebbero i contatti del socket."; m.className = "hwa-cpu-msg bad"; }
    };
  }

  function bootA() {
    $("aPower").hidden = true;
    $("aWrap").classList.add("on");
    const b = $("aBoot"); b.hidden = false; b.innerHTML = "";
    const line = (txt) => txt + ' <em>OK</em>';
    const lines = [
      "SC Z-1 BIOS · POST (test di avvio)",
      line("CPU: " + (hasK("cpu") ? build.cpu.name : "processore")),
      line("Dissipatore: ventola CPU_FAN"),
      line("Memoria: " + (hasK("ram") ? build.ram.name : "RAM") + " · dual channel"),
      line("Archivio: " + (hasK("storage") ? build.storage.name : "SSD")),
      hasGpu() ? line("Video: " + build.gpu.name) : line("Video: grafica integrata nella CPU"),
      line("Alimentatore: " + (hasK("psu") ? build.psu.watt + " W" : "PSU") + " · +12V +5V +3,3V"),
      hasGpu() ? line("Alimentazione PCIe scheda video: collegata") : "SC Z-1 · alimentazione scheda OK",
      "Avvio del sistema operativo..."
    ];
    lines.forEach((l, i) => setTimeout(() => { const p = document.createElement("p"); p.className = "bl"; p.innerHTML = l; b.appendChild(p); b.scrollTop = b.scrollHeight; }, i * 340));
    setTimeout(() => {
      const el = document.createElement("div"); el.className = "hwa-done";
      el.innerHTML = '<h3>Il tuo PC è acceso! 🎉</h3>' +
        '<p>Hai montato tutti i pezzi sulla scheda madre e il computer è partito. Un tecnico vero ci mette circa un\'ora, cavi, case e sistema operativo compresi.</p>' +
        '<div class="hwa-done-stats"><div><small>Tempo di montaggio</small><b>' + fmtA(Date.now() - A.start) + '</b></div><div><small>Componenti montati</small><b>' + A.pieces.length + '</b></div></div>' +
        '<button class="run-btn" type="button" id="aAgain">↻ Rimonta un altro PC</button>';
      b.appendChild(el);
      $("aAgain").addEventListener("click", renderAssembly);
    }, lines.length * 340 + 250);
  }

  function applyGuidance() {
    const banner = $("aGuide");
    document.querySelectorAll(".hwa-zone").forEach((z) => z.classList.remove("guide"));
    document.querySelectorAll(".hwa-card").forEach((c) => c.classList.remove("locked"));
    if (!banner) return;
    if (A.complete) { banner.hidden = true; return; }
    if (!A.guided) {
      banner.hidden = false;
      banner.innerHTML = '<span class="g-step">🧩 Fai da solo</span><div>Scopri <b>tu</b> dove va ogni pezzo: nessun indizio automatico. Premi <b>Aiuto</b> solo se ti blocchi.</div>';
      return;
    }
    const actId = activePieceId();
    document.querySelectorAll(".hwa-card").forEach((c) => { const id = c.dataset.id; c.classList.toggle("locked", !A.placed[id] && id !== actId); });
    const p = A.pieces.find((x) => x.id === actId);
    if (!p) { banner.hidden = true; return; }
    banner.hidden = false;
    banner.innerHTML = '<span class="g-step g-guided">Passo ' + (Object.keys(A.placed).length + 1) + "/" + A.pieces.length + "</span><div><b>Monta ora: " + p.label + "</b><br>" + p.hint + "</div>";
    let targets = p.accepts.slice(); if (p.group === "ram") targets = targets.filter((z) => !A.slot[z]);
    document.querySelectorAll(".hwa-zone").forEach((z) => { if (targets.indexOf(z.dataset.zone) >= 0) z.classList.add("guide"); });
  }

  function hintA() {
    if (A.complete) return;
    let p = A.selected ? A.pieces.find((x) => x.id === A.selected) : A.pieces.find((x) => !A.placed[x.id]);
    if (!p) return;
    if (p.requires && !A.placed[p.requires]) p = A.pieces.find((x) => x.id === p.requires);
    let targets = p.accepts.slice();
    if (p.group === "ram") targets = targets.filter((z) => !A.slot[z]);
    A.hints++;
    const card = document.querySelector('.hwa-card[data-id="' + p.id + '"]');
    if (card) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
    document.querySelectorAll(".hwa-zone").forEach((z) => { z.classList.remove("hint"); if (targets.indexOf(z.dataset.zone) >= 0) { void z.getBoundingClientRect(); z.classList.add("hint"); } });
    setTimeout(() => document.querySelectorAll(".hwa-zone").forEach((z) => z.classList.remove("hint")), 4200);
    toastA("Aiuto: " + p.label.toLowerCase() + " va dove lampeggia il riquadro.", "info");
  }

  function wireAssembly() {
    document.querySelectorAll(".hwa-card").forEach((c) => {
      let drag = null;
      c.addEventListener("pointerdown", (e) => {
        if (e.button > 0) return;
        const id = c.dataset.id; if (A.placed[id] || A.complete) return;
        if (A.guided && activePieceId() !== id) { failA(id, "Modalità <b>guidata</b>: monta prima <b>" + nextLabel() + "</b>."); return; }
        drag = { id, x0: e.clientX, y0: e.clientY, ghost: null };
        try { c.setPointerCapture(e.pointerId); } catch (_) {}
      });
      c.addEventListener("pointermove", (e) => {
        if (!drag) return;
        if (!drag.ghost) {
          if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
          const g = document.createElement("div"); g.className = "hwa-ghost"; g.innerHTML = AICON[A.pieces.find((p) => p.id === drag.id).icon];
          document.body.appendChild(g); drag.ghost = g; selectA(drag.id);
        }
        drag.ghost.style.transform = "translate(" + (e.clientX - 33) + "px," + (e.clientY - 20) + "px)";
        hotZone(zoneAt(e.clientX, e.clientY));
      });
      const end = (e) => {
        if (!drag) return;
        const d = drag; drag = null; hotZone(null);
        if (d.ghost) {
          d.ghost.remove();
          if (e.type === "pointercancel") { selectA(null); return; }
          const z = zoneAt(e.clientX, e.clientY);
          if (z) tryPlaceA(d.id, z); else selectA(d.id);
        } else if (e.type === "pointerup") { toggleSelectA(d.id); }
      };
      c.addEventListener("pointerup", end);
      c.addEventListener("pointercancel", end);
    });

    $("hwaBoard").addEventListener("click", (e) => {
      if (A.complete) return;
      if (!A.selected) { toastA("Prima scegli un componente da uno dei vassoi ai lati.", "info"); return; }
      const z = zoneAt(e.clientX, e.clientY);
      if (z) tryPlaceA(A.selected, z); else toastA("Tocca il punto della scheda madre dove va il componente.", "info");
    });
    document.querySelectorAll(".hwa-zone").forEach((z) => z.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return; e.preventDefault();
      if (A.selected) tryPlaceA(A.selected, z.dataset.zone); else toastA("Prima scegli un componente da uno dei vassoi.", "info");
    }));
    $("aHint").addEventListener("click", hintA);
    $("aReset").addEventListener("click", renderAssembly);
    $("aCompSeg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]"); if (!b) return;
      const nh = b.dataset.c === "1"; if (nh === hardMode) return;
      hardMode = nh; renderAssembly();
      toastA(hardMode ? "Componenti <b>avanzati</b>: il PC completo, con alimentatore e tutti i cavi." : "Componenti <b>base</b>: l'essenziale per capire il montaggio.", "info");
    });
    $("aModeSeg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      const ng = b.dataset.m === "1"; if (ng === guidedMode) return;
      guidedMode = ng; A.guided = ng;
      $("aModeSeg").querySelectorAll(".seg-btn").forEach((x) => x.classList.toggle("active", x === b));
      selectA(null); applyGuidance();
      toastA(guidedMode ? "Modalità <b>guidata</b>: ti dico cosa montare, passo per passo." : "Modalità <b>fai da solo</b>: scopri tu dove va ogni pezzo.", "info");
    });
    $("aPower").addEventListener("click", bootA);
    $("aModal").addEventListener("click", (e) => { if (e.target === $("aModal")) { $("aModal").hidden = true; if (A.complete) onComplete(); } });
    $("aCpuModal").addEventListener("click", (e) => { if (e.target === $("aCpuModal")) $("aCpuModal").hidden = true; });
    applyGuidance();
  }

  /* ---------- Modalità ---------- */
  function setMode(m) {
    $("hwMode").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
    $("configMode").hidden = m !== "config";
    $("montaggioMode").hidden = m !== "asm";
    if (m === "asm") renderAssembly();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("hwMode").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) setMode(b.dataset.mode); });

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
