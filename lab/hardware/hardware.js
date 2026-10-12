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
    cpu: { title: "Processore (CPU)", tag: "Il cervello", where: "Nel socket, il quadrato con i contatti, in alto al centro.",
      what: "Esegue le istruzioni di tutti i programmi, miliardi di operazioni al secondo. Si posa nel socket senza spingere.",
      tips: ["Allinea il triangolino dorato dell'angolo con quello del socket: c'è un solo verso.", "Posala delicatamente: deve scendere da sola. Poi abbassa la leva (un po' di resistenza è normale).", "Non toccare i contatti e non forzare: un pin piegato può rovinare CPU o scheda madre."],
      fun: "Un processore moderno ha decine di miliardi di transistor, ognuno più piccolo di un virus." },
    cooler: { title: "Dissipatore", tag: "Il raffreddamento", where: "Sopra il processore, sui 4 fori del socket.",
      what: "La CPU scalda tantissimo: il dissipatore assorbe il calore con le alette e la ventola lo soffia via.",
      tips: ["Una goccia di pasta termica grande come un chicco di riso al centro della CPU.", "Togli la pellicola di plastica sotto il dissipatore, se c'è: dimenticarla è un classico!", "Avvita a X, poco per volta, e collega la ventola al connettore CPU_FAN."],
      fun: "Senza dissipatore la CPU supererebbe i 100 °C in pochi secondi e si spegnerebbe da sola." },
    ram: { title: "Memoria RAM", tag: "La scrivania del PC", where: "Negli slot verticali, a destra del processore.",
      what: "Tiene a portata i dati dei programmi aperti adesso. Velocissima, ma si svuota quando spegni il PC.",
      tips: ["Apri le clip, poi allinea la tacca dei contatti con il dentino dello slot: se non entra, non forzarla.", "Premi deciso ai due lati finché le clip si chiudono con un click.", "Con due moduli usa gli slot alternati (il 2° e il 4°) per il dual channel."],
      fun: "Se l'archivio fosse un armadio, la RAM sarebbe la scrivania: più è grande, più cose tieni aperte." },
    ram2: { title: "Secondo modulo RAM", tag: "Dual channel attivo", where: "L'altro slot consigliato.",
      what: "Ora i due moduli lavorano in coppia, come due corsie di un'autostrada: i dati corrono più veloci verso la CPU.",
      tips: ["Stesso verso, stessa tacca: controlla prima di spingere.", "Meglio due moduli identici per marca, capacità e velocità.", "Nel BIOS puoi poi attivare il profilo di velocità (XMP o EXPO)."],
      fun: "I due moduli insieme raddoppiano la «corsia» di dati tra memoria e processore." },
    ssd: { title: "SSD M.2 NVMe", tag: "L'archivio velocissimo", where: "Nello slot M.2, sotto il processore.",
      what: "Qui restano sistema operativo, programmi e file anche a PC spento. Nessuna parte in movimento: solo chip.",
      tips: ["Infilalo inclinato di circa 30°, poi abbassalo e fissalo con la vitina (o il fermo a scatto).", "La vite è minuscola: tienila in una ciotolina per non perderla.", "Montalo prima della scheda video, o dopo lo slot resta coperto."],
      fun: "Un NVMe veloce legge oltre 7 GB al secondo: un film intero in meno di un secondo." },
    drive: { title: "Disco / SSD SATA", tag: "Il magazzino", where: "A una porta SATA, sul bordo destro della scheda.",
      what: "Memoria capiente ed economica per foto, video e backup, collegata con un cavo alla scheda madre.",
      tips: ["Servono due cavi: il SATA dati (sottile) alla scheda, l'alimentazione dall'alimentatore.", "I connettori SATA hanno la forma a L: entrano in un solo verso.", "Fissalo bene nel suo cassetto, così non vibra."],
      fun: "A parità di prezzo un disco meccanico contiene molti più dati di un SSD: anche 10 TB e oltre." },
    gpu: { title: "Scheda video (GPU)", tag: "La grafica", where: "Nello slot lungo con il rinforzo (PCIe x16).",
      what: "Disegna tutto ciò che vedi: finestre, video, i mondi 3D dei giochi. Ha processore e memoria propri.",
      tips: ["Abbassa il gancetto dello slot, poi spingi la scheda dritta finché scatta.", "Avvitala al case: è pesante e non deve piegarsi.", "Il monitor va collegato alla scheda video, non alla scheda madre!"],
      fun: "Una scheda video ha migliaia di piccoli processori che lavorano tutti insieme sull'immagine." },
    pwr24: { title: "Cavo 24 pin", tag: "Alimentazione scheda", where: "Il connettore grande sul bordo destro.",
      what: "Porta corrente alla scheda madre e a gran parte dei componenti. È il cavo più grosso dell'alimentatore.",
      tips: ["Ha una clip ed entra in un solo verso: premi finché fa click.", "Fai passare i cavi dietro il pannello: più ordine e l'aria circola meglio."],
      fun: "L'alimentatore trasforma i 230 volt di casa in 12, 5 e 3,3 volt per i componenti." },
    pwrcpu: { title: "Cavo CPU 8 pin (EPS)", tag: "Alimentazione CPU", where: "In alto a sinistra, vicino al processore.",
      what: "Dà alla CPU la corrente extra che le serve quando lavora sotto sforzo.",
      tips: ["È la dimenticanza più frequente: senza, il PC non si accende!", "Entra in un solo verso: spingi finché scatta."],
      fun: "Si chiama EPS ed è separato dal 24 pin proprio perché la CPU può assorbire molta corrente." }
  };

  const AICON = {
    cpu: '<svg viewBox="0 0 46 30" aria-hidden="true"><g fill="#8a9298"><rect x="7" y="9" width="5" height="1.6"/><rect x="7" y="14" width="5" height="1.6"/><rect x="7" y="19" width="5" height="1.6"/><rect x="34" y="9" width="5" height="1.6"/><rect x="34" y="14" width="5" height="1.6"/><rect x="34" y="19" width="5" height="1.6"/></g><rect x="12" y="4" width="22" height="22" rx="2" fill="#aab3b9"/><rect x="15" y="7" width="16" height="16" rx="1.5" fill="#d2d8db"/><polygon points="14,24 14,21 17,24" fill="#e0b54f"/></svg>',
    cooler: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="9" y="2" width="28" height="26" rx="4" fill="#3a444b"/><circle cx="23" cy="15" r="11.5" fill="#161c20"/><g stroke="#5a666e" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M23 15V5"/><path d="M23 15l8.5 5"/><path d="M23 15l-8.5 5"/></g><circle cx="23" cy="15" r="3" fill="#2d363c"/></svg>',
    ram: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="4" y="8" width="38" height="15" rx="1.5" fill="#2f6b4a"/><rect x="4" y="8" width="38" height="3" rx="1.5" fill="#6b82ff"/><rect x="8" y="13" width="30" height="6" rx="1" fill="#d7ded4"/><g fill="#e0b54f"><rect x="6" y="20.5" width="16" height="2.5"/><rect x="24" y="20.5" width="16" height="2.5"/></g></svg>',
    ssd: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="5" y="10" width="36" height="10" rx="1" fill="#0f5a3b"/><rect x="5" y="11" width="4" height="8" fill="#e0b54f"/><rect x="12" y="8" width="8" height="14" rx="1" fill="#141414"/><rect x="22" y="12" width="17" height="6" rx="1" fill="#e9e4d7"/></svg>',
    drive: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="9" y="4" width="28" height="22" rx="2" fill="#aab3b8"/><circle cx="23" cy="14" r="8.5" fill="#d2d8db" stroke="#8a9298"/><circle cx="23" cy="14" r="2.3" fill="#8a9298"/><path d="M33 23 26 16" stroke="#3b4248" stroke-width="2.4" stroke-linecap="round"/></svg>',
    gpu: '<svg viewBox="0 0 46 30" aria-hidden="true"><rect x="3" y="8" width="39" height="15" rx="2" fill="#2b333a"/><circle cx="15" cy="15.5" r="6" fill="#121619"/><circle cx="30" cy="15.5" r="6" fill="#121619"/><g stroke="#5a666e" stroke-width="1.6" stroke-linecap="round"><path d="M15 15.5V10"/><path d="M30 15.5V10"/></g><rect x="12" y="23" width="22" height="3" fill="#e0b54f"/></svg>',
    cable: '<svg viewBox="0 0 46 30" aria-hidden="true"><g stroke="#8a9298" stroke-width="2" stroke-linecap="round"><path d="M6 10h10M6 15h10M6 20h10"/></g><rect x="16" y="6" width="13" height="18" rx="2" fill="#2a2f34"/><g stroke="#e0b54f" stroke-width="2" stroke-linecap="round"><path d="M29 10h11M29 15h11M29 20h11"/></g></svg>'
  };

  function aPieces() {
    const nvme = hasK("storage") && /NVMe/i.test(build.storage.name);
    const list = [
      { id: "cpu", label: "Processore", sub: hasK("cpu") ? build.cpu.name : "CPU", icon: "cpu", tray: "L", accepts: ["socket"],
        hint: "Il processore va nel socket: il quadrato con i contatti, in alto al centro." },
      { id: "cooler", label: "Dissipatore", sub: hasK("cooler") ? build.cooler.name : "Raffreddamento", icon: "cooler", tray: "L", accepts: ["socket"], requires: "cpu",
        requiresMsg: "Prima la CPU! Il dissipatore va montato <b>sopra</b> il processore.",
        hint: "Il dissipatore va sopra il processore, al centro del socket." },
      { id: "ram1", label: "RAM · modulo 1", sub: hasK("ram") ? build.ram.type : "Memoria", icon: "ram", tray: "L", group: "ram", accepts: ["dimm2", "dimm4"],
        hint: "La RAM va negli slot lunghi e verticali, a destra del processore." },
      { id: "ram2", label: "RAM · modulo 2", sub: hasK("ram") ? build.ram.type : "Memoria", icon: "ram", tray: "L", group: "ram", accepts: ["dimm2", "dimm4"],
        hint: "La RAM va negli slot lunghi e verticali, a destra del processore." },
      { id: "storage", label: nvme ? "SSD M.2" : "Disco / SSD", sub: hasK("storage") ? build.storage.name : "Archivio", icon: nvme ? "ssd" : "drive", tray: "R", accepts: [nvme ? "m2" : "sata"], nvme,
        hint: nvme ? "L'SSD M.2 va nello slot piccolo e tratteggiato, sotto il processore." : "Il disco si collega a una porta SATA, in basso sul bordo destro." }
    ];
    if (hasGpu()) list.push({ id: "gpu", label: "Scheda video", sub: build.gpu.name, icon: "gpu", tray: "R", accepts: ["pcie"],
      hint: "La scheda video va nello slot lungo con il rinforzo (PCIe x16)." });
    list.push({ id: "pwr24", label: "Cavo 24 pin", sub: "Alimenta la scheda", icon: "cable", tray: "R", accepts: ["atx24"],
      hint: "Il cavo grande a 24 pin va sul bordo destro della scheda." });
    list.push({ id: "pwrcpu", label: "Cavo CPU 8 pin", sub: "Alimenta la CPU (EPS)", icon: "cable", tray: "R", accepts: ["eps"],
      hint: "Il cavo CPU a 8 pin va in alto a sinistra, vicino al processore." });
    return list;
  }

  const ZN = {
    socket: [110, 38, 68, 62], eps: [62, -3, 36, 17],
    dimm1: [190, 12, 12, 144], dimm2: [202, 12, 12, 144], dimm3: [214, 12, 12, 144], dimm4: [226, 12, 12, 144],
    m2: [60, 106, 102, 28], pcie: [16, 150, 124, 19], atx24: [272, 50, 24, 62], sata: [266, 166, 32, 58]
  };

  function boardSVG() {
    const sock = hasK("cpu") ? build.cpu.socket : "SOCKET";
    const zoneRects = Object.keys(ZN).map((k) => {
      const z = ZN[k];
      return '<rect class="hwa-zone" data-zone="' + k + '" x="' + z[0] + '" y="' + z[1] + '" width="' + z[2] + '" height="' + z[3] + '" tabindex="0" role="button" aria-label="' + k + '"/>';
    }).join("");
    return '' +
    '<svg id="hwaBoard" viewBox="0 0 300 240" role="img" aria-label="Scheda madre vista dall\'alto">' +
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
      '<text class="silk" x="64" y="113">M.2 · SSD</text><rect x="62" y="116" width="96" height="12" rx=".6" fill="none" stroke="#cdd8dc80" stroke-width=".5" stroke-dasharray="2 1.5"/><circle cx="155" cy="122" r="1.7" fill="#b39d62"/>' +
      '<text class="silk" x="24" y="151">PCIEX16_1</text><rect x="24" y="153" width="96" height="7" rx=".6" fill="#3b4349" stroke="#aab3b8" stroke-width=".6"/><rect x="25.5" y="155.6" width="16" height="1.4" fill="#0b0b0b"/><rect x="43.5" y="155.6" width="74" height="1.4" fill="#0b0b0b"/><rect x="120" y="152" width="5" height="9" rx=".5" fill="#5c666c"/>' +
      '<rect x="278" y="54" width="10" height="52" fill="url(#hwaPins)" stroke="#3a3a3a" stroke-width=".3"/><text class="silk" transform="translate(276 106) rotate(-90)">ATX 24-pin</text>' +
      '<g id="hwaSata">' + [170, 181, 192, 203].map(function (y) { return '<rect x="282" y="' + y + '" width="13" height="9" rx=".6" fill="#3a3f43"/><path d="M284 ' + (y + 2.2) + 'h9v2h-6v3h-3z" fill="#0b0b0b"/>'; }).join("") + '</g><text class="silk" x="296" y="166" text-anchor="end">SATA</text>' +
      '<rect x="150" y="170" width="54" height="42" rx="3" fill="url(#hwaFins)" stroke="#5a6b74" stroke-width=".4"/><rect x="161" y="180" width="32" height="22" rx="1.5" fill="#46535b"/><text x="177" y="193" text-anchor="middle" font-family="Fraunces, serif" font-weight="600" font-size="5" fill="#8794a0">SC Z-1</text><text x="177" y="198.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="2.2" fill="#8794a0">CHIPSET</text>' +
      '<circle class="hwa-led" cx="262" cy="230" r="2"/><text class="silk" x="266" y="231.5">PWR</text>' +
      '<text class="silk big" x="40" y="226">ATX · 305 × 244 mm</text>' +
      '<g id="hwaOverlays">' +
        '<g class="hwa-ov" id="ov-cpu" style="display:none"><rect x="120" y="46" width="48" height="48" rx="1" fill="#2f6b3a"/><rect x="123" y="49" width="42" height="42" rx="3" fill="#cdd4d8"/><text x="144" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.4" font-weight="700" fill="#79838a">CPU</text><polygon points="121,92 121,88 125,92" fill="#e0b54f"/><rect x="117" y="43" width="54" height="54" rx="1" fill="none" stroke="#9aa3a8" stroke-width="2.2"/></g>' +
        '<g class="hwa-ov" id="ov-cooler" style="display:none"><rect x="106" y="36" width="76" height="68" rx="5" fill="#252b30" stroke="#4d565d" stroke-width=".6"/><circle cx="144" cy="70" r="31" fill="#0f1317"/><g class="hwa-fan" transform="translate(144 70)"><g stroke="#4a555d" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M0 0V-26"/><path d="M0 0L22.5 13"/><path d="M0 0L-22.5 13"/></g></g><circle cx="144" cy="70" r="8" fill="#2c343a"/><circle cx="144" cy="70" r="8" fill="none" stroke="#6b82ff" stroke-width="1.4"/></g>' +
        '<g class="hwa-ov" id="ov-dimm2" style="display:none"><rect x="201.5" y="12" width="10" height="142" rx="1" fill="#2a3037" stroke="#4f5860" stroke-width=".4"/><rect x="203" y="13" width="7" height="140" rx=".6" fill="#353e46"/><rect x="205" y="15" width="2.4" height="138" fill="#6b82ff"/></g>' +
        '<g class="hwa-ov" id="ov-dimm4" style="display:none"><rect x="225.5" y="12" width="10" height="142" rx="1" fill="#2a3037" stroke="#4f5860" stroke-width=".4"/><rect x="227" y="13" width="7" height="140" rx=".6" fill="#353e46"/><rect x="229" y="15" width="2.4" height="138" fill="#6b82ff"/></g>' +
        '<g class="hwa-ov" id="ov-ssd" style="display:none"><rect x="62" y="116.5" width="94" height="11" rx="1" fill="#0f5a3b"/><rect x="66" y="119" width="8" height="7" rx=".6" fill="#121212"/><rect x="78" y="118" width="64" height="8" rx="1" fill="#e9e4d7"/><text x="110" y="124" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="3.2" font-weight="700" fill="#333">SSD NVMe</text><circle cx="155" cy="122" r="2.2" fill="#c3cacd" stroke="#7a8287" stroke-width=".4"/></g>' +
        '<g class="hwa-ov" id="ov-sata" style="display:none"><path d="M288 174 C300 173 300 185 300 190" stroke="#c23b2f" stroke-width="2.4" fill="none"/><rect x="280" y="169" width="18" height="11" rx="1" fill="#c23b2f"/><rect x="282" y="171.5" width="2" height="6" fill="#8c231b"/></g>' +
        '<g class="hwa-ov" id="ov-gpu" style="display:none"><rect x="12" y="148" width="6" height="18" fill="#aab3b8"/><rect x="18" y="146" width="210" height="22" rx="2.5" fill="#22272c" stroke="#40484f" stroke-width=".6"/><circle cx="60" cy="157" r="9" fill="#111518"/><circle cx="92" cy="157" r="9" fill="#111518"/><rect x="28" y="147" width="150" height="1.6" fill="#6b82ff"/><text x="150" y="160" text-anchor="middle" font-family="Fraunces, serif" font-weight="600" font-size="6" fill="#59646c">GPU</text></g>' +
        '<g class="hwa-ov" id="ov-pwr24" style="display:none"><path d="M292 60 C305 60 305 54 300 50" stroke="#e0b54f" stroke-width="1.6" fill="none"/><rect x="275" y="52" width="14" height="56" rx="1" fill="#141414" stroke="#3a3a3a" stroke-width=".4"/><rect x="284" y="76" width="4" height="8" rx=".5" fill="#2a2a2a"/></g>' +
        '<g class="hwa-ov" id="ov-pwrcpu" style="display:none"><path d="M60 2 C48 2 44 -6 40 -10" stroke="#e0b54f" stroke-width="1.6" fill="none"/><rect x="63" y="-2" width="24" height="12" rx="1" fill="#141414" stroke="#3a3a3a" stroke-width=".4"/></g>' +
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
    A = { placed: {}, slot: {}, errors: 0, hints: 0, selected: null, complete: false, pieces: aPieces(), start: Date.now() };
    const L = A.pieces.filter((p) => p.tray === "L"), R = A.pieces.filter((p) => p.tray === "R");
    $("asm").innerHTML =
      '<div class="hwa-wrap">' +
        '<div class="hwa-top">' +
          '<div><h2 class="wiz-title">Monta il PC</h2><p class="hwa-sub">Trascina ogni componente sul punto giusto della scheda madre — oppure toccalo e poi tocca il punto dove va. Il montaggio usa i pezzi scelti nella sezione precedente.</p></div>' +
          '<div class="hwa-stats"><div class="hwa-stat"><small>Montati</small><b id="aPieces">0/' + A.pieces.length + '</b></div>' +
            '<div class="hwa-stat"><small>Errori</small><b id="aErr">0</b></div>' +
            '<button type="button" class="ghost-btn" id="aHint">Aiuto</button>' +
            '<button type="button" class="ghost-btn" id="aReset">Ricomincia</button></div>' +
        '</div>' +
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
      '<div class="hwa-modal" id="aModal" hidden><div class="hwa-sheet" id="aSheet" role="dialog" aria-modal="true" aria-labelledby="aSheetT"></div></div>';
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
  function toggleSelectA(id) {
    if (A.placed[id] || A.complete) return;
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

  function failA(id, msg, count) {
    if (count !== false) { A.errors++; $("aErr").textContent = A.errors; }
    toastA(msg, "bad");
    const c = document.querySelector('.hwa-card[data-id="' + id + '"]');
    c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
  }

  function tryPlaceA(id, zone) {
    const p = A.pieces.find((x) => x.id === id);
    if (!p || A.placed[id] || A.complete || !zone) return;
    if (p.requires && !A.placed[p.requires]) return failA(id, p.requiresMsg);
    if (p.group === "ram") {
      if (zone === "dimm1" || zone === "dimm3") return failA(id, "Entrerebbe, ma con due moduli il manuale consiglia gli slot <b>alternati</b> (il 2° e il 4°) per il <b>dual channel</b>.");
      if (A.slot[zone]) return failA(id, "Questo slot è già occupato: usa l'altro slot consigliato.", false);
    }
    if (p.accepts.indexOf(zone) >= 0) return placeA(id, zone, p);
    failA(id, "Non va qui. " + p.hint);
  }

  function placeA(id, zone, p) {
    A.placed[id] = zone;
    let ovId;
    if (p.group === "ram") { A.slot[zone] = id; ovId = "ov-" + zone; }
    else if (id === "storage") ovId = p.nvme ? "ov-ssd" : "ov-sata";
    else ovId = "ov-" + id;
    const g = document.getElementById(ovId);
    if (g) { g.style.display = ""; g.classList.remove("in"); void g.getBoundingClientRect(); g.classList.add("in"); }
    const card = document.querySelector('.hwa-card[data-id="' + id + '"]');
    card.classList.add("placed"); card.setAttribute("aria-disabled", "true");
    selectA(null);
    const n = Object.keys(A.placed).length;
    $("aPieces").textContent = n + "/" + A.pieces.length;
    if (n === A.pieces.length) A.complete = true;
    let key = id;
    if (p.group === "ram") key = (A.slot.dimm2 && A.slot.dimm4) ? "ram2" : "ram";
    else if (id === "storage") key = p.nvme ? "ssd" : "drive";
    setTimeout(() => showAInfo(key), 360);
  }

  function showAInfo(key) {
    const d = AINFO[key];
    if (!d) { if (A.complete) revealPower(); return; }
    $("aSheet").innerHTML =
      '<div class="i-tag">' + d.tag + '</div><h3 id="aSheetT">' + d.title + '</h3>' +
      '<p>' + d.what + '</p>' +
      '<div class="where"><small>Dove va</small><span>' + d.where + '</span></div>' +
      '<h4>Mentre lo monti</h4><ul class="hwa-tips">' + d.tips.map((t) => '<li>' + t + '</li>').join("") + '</ul>' +
      '<div class="hwa-fun"><b>Lo sapevi?</b> ' + d.fun + '</div>' +
      '<button class="run-btn" type="button" id="aInfoOk">' + (A.complete ? "Ho capito: accendiamo! →" : "Ho capito, avanti") + '</button>';
    $("aModal").hidden = false;
    $("aInfoOk").focus();
    $("aInfoOk").addEventListener("click", () => { $("aModal").hidden = true; if (A.complete) revealPower(); });
  }

  function revealPower() { const b = $("aPower"); if (b) { b.hidden = false; b.focus(); } }

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
      line("Alimentazione: +12V +5V +3,3V"),
      "Avvio del sistema operativo..."
    ];
    lines.forEach((l, i) => setTimeout(() => { const p = document.createElement("p"); p.className = "bl"; p.innerHTML = l; b.appendChild(p); b.scrollTop = b.scrollHeight; }, i * 340));
    setTimeout(() => {
      const el = document.createElement("div"); el.className = "hwa-done";
      el.innerHTML = '<h3>Il tuo PC è acceso! 🎉</h3>' +
        '<p>Hai montato tutti i pezzi sulla scheda madre e il computer è partito. Un tecnico vero ci mette circa un\'ora, cavi, case e sistema operativo compresi.</p>' +
        '<div class="hwa-done-stats"><div><small>Tempo</small><b>' + fmtA(Date.now() - A.start) + '</b></div><div><small>Errori</small><b>' + A.errors + '</b></div><div><small>Aiuti</small><b>' + A.hints + '</b></div></div>' +
        '<button class="run-btn" type="button" id="aAgain">↻ Rimonta un altro PC</button>';
      b.appendChild(el);
      $("aAgain").addEventListener("click", renderAssembly);
    }, lines.length * 340 + 250);
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
    $("aPower").addEventListener("click", bootA);
    $("aModal").addEventListener("click", (e) => { if (e.target === $("aModal")) { $("aModal").hidden = true; if (A.complete) revealPower(); } });
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
