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
      intro: (b) => `La <b>scheda madre</b> collega tutto. Il <b>socket</b> deve combaciare con la CPU (la tua è <b>${b.cpu.socket}</b>). Il <b>chipset</b> decide le funzioni disponibili; supporta un solo tipo di RAM (<b>DDR4</b> o <b>DDR5</b>); gli slot <b>M.2</b> ospitano gli SSD veloci; il <b>formato</b> (ATX, mATX) è la dimensione, che dovrà entrare nel case. Le schede col socket sbagliato sono segnate come <b>non compatibili</b>.`,
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
      intro: (b) => `La CPU scalda: il <b>dissipatore</b> la tiene fresca, altrimenti rallenta o si spegne. Deve smaltire il calore della CPU (il suo <b>TDP</b>, qui <b>${b.cpu.tdp} W</b>). Ad <b>aria</b> (una ventola) o a <b>liquido</b> (AIO) per le CPU più calde. Quelli che non bastano per la tua CPU sono segnati come <b>non compatibili</b>.`,
      options: () => COOLER,
      compat: (c, b) => c.maxTdp >= b.cpu.tdp ? null : `raffredda fino a <b>${c.maxTdp} W</b>, ma la tua CPU ne produce <b>${b.cpu.tdp} W</b>: non riuscirebbe a smaltire il calore e la CPU si surriscalderebbe.`,
      callout: (c) => `Bene: questo dissipatore smaltisce fino a <b>${c.maxTdp} W</b>, sufficiente per la tua CPU.` },

    { key: "psu", emoji: "🔌", title: "L'alimentatore — l'energia", type: "Alimentatore",
      intro: (b) => `L'<b>alimentatore</b> dà energia a tutto. Contano la <b>potenza</b> in W (deve bastare per tutti i componenti) e l'<b>efficienza</b> (80+ Bronze, Gold…): più alta, meno energia sprecata. Il tuo PC consuma circa <b>${power(b)} W</b>, quindi serve almeno <b>${suggestedW(b)} W</b> (un margine è sempre utile). Quelli sottodimensionati sono segnati come <b>non compatibili</b>.`,
      options: () => PSU,
      compat: (p, b) => p.watt >= suggestedW(b) ? null : `dà solo <b>${p.watt} W</b>, ma il tuo PC consuma circa <b>${power(b)} W</b> e servono almeno <b>${suggestedW(b)} W</b> di margine: rischi spegnimenti o instabilità.`,
      callout: (c) => `<b>${c.watt} W</b> con efficienza ${c.specs[1][1]}: energia sufficiente e con margine.` },

    { key: "case", emoji: "📦", title: "Il case — la scatola", type: "Case",
      intro: (b) => `Il <b>case</b> contiene e protegge tutto, e fa circolare l'aria. Deve accettare il formato della scheda madre (<b>${b.mobo.form}</b>), essere lungo abbastanza per la scheda video (${b.gpu.integrated ? "qui nessun problema" : "<b>" + b.gpu.length + " mm</b>"}) e alto per il dissipatore (<b>${b.cooler.height} mm</b>). Quelli troppo piccoli sono segnati come <b>non compatibili</b>.`,
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
    const opts = s.options(build);
    const chosen = build[s.key];
    const compatOf = (o) => (s.compat ? s.compat(o, build) : null);
    const chosenReason = chosen ? compatOf(chosen) : null;

    let calloutHtml = "";
    if (chosen && chosenReason) {
      calloutHtml = `<div class="callout warn"><span class="co-ico">⚠️</span><div><b>Scelta non compatibile:</b> ${chosenReason}<br>Scegline uno compatibile per andare avanti.</div></div>`;
    } else if (chosen) {
      calloutHtml = `<div class="callout"><span class="co-ico">💡</span><div>${s.callout(chosen)}</div></div>`;
    }

    $("wizard").innerHTML =
      `<div class="wiz-head"><span class="wiz-emoji">${s.emoji}</span><h2 class="wiz-title">${step + 1}. ${s.title}</h2></div>` +
      `<p class="wiz-intro">${s.intro(build)}</p>` +
      `<div class="opt-grid">` + opts.map((o) => {
        const bad = compatOf(o);
        return `<button type="button" class="opt-card ${chosen && chosen.id === o.id ? "selected" : ""}${bad ? " incompatible" : ""}" data-id="${o.id}">` +
          `<div class="opt-top"><span class="opt-emoji">${o.emoji}</span><span class="opt-name">${o.name}</span>` +
          (o.tag ? `<span class="opt-tag ${o.tag.toLowerCase().replace(/\s/g, "")}">${o.tag}</span>` : "") + `</div>` +
          `<div class="opt-desc">${o.desc}</div>` +
          specsHtml(o) +
          `<div class="opt-price">${o.price === 0 ? "incluso / gratis" : o.price + " €"}</div>` +
          (bad ? `<span class="opt-warn-badge">✗ non compatibile</span>` : "") +
        `</button>`;
      }).join("") + `</div>` +
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

  const ASM = [
    { emoji: "🧰", title: "Preparazione e sicurezza",
      body: () => "Lavora su un piano <b>ampio, pulito e ben illuminato</b>. Prima di toccare i componenti <b>scarica l'elettricità statica</b> toccando una parte metallica non verniciata (o usa un bracciale antistatico): una scarica invisibile può danneggiarli. Tieni a portata un <b>cacciavite a croce</b> e il <b>manuale della scheda madre</b>, e apri il case togliendo i due pannelli laterali.",
      tip: "Conviene montare CPU, dissipatore e RAM sulla scheda madre <b>fuori</b> dal case, appoggiata sulla sua scatola: si lavora molto meglio." },
    { emoji: "🧠", title: "1 · La CPU nel socket",
      body: () => "Sulla scheda madre, alza la <b>leva</b> del socket. " + cpuTxt() + " ha un piccolo <b>triangolo</b> in un angolo: allinealo a quello stampato sul socket. <b>Posa</b> la CPU delicatamente: deve scendere <b>da sola</b>, senza spingere. Poi riabbassa la leva (fa un po' di resistenza: è normale).",
      warn: "Non toccare i contatti dorati e non forzare mai: un solo pin piegato può rovinare la CPU o la scheda madre." },
    { emoji: "❄️", title: "2 · Pasta termica e dissipatore",
      body: () => "La <b>pasta termica</b> fa passare il calore dalla CPU al dissipatore. Molti dissipatori ce l'hanno già spalmata; se no, metti una piccola goccia (come un chicco di riso) al centro della CPU. Appoggia " + coolTxt() + ", avvita <b>a croce</b> (poco per volta, alternando le viti opposte) e collega il cavetto della ventola al connettore <b>CPU_FAN</b> della scheda madre." },
    { emoji: "💾", title: "3 · La RAM",
      body: () => "Apri le <b>levette</b> ai lati degli slot. Con due banchi, per attivare il <b>dual channel</b> (più veloce) usa gli slot <b>alternati</b> (di solito il 2° e il 4°: controlla il manuale). Allinea la <b>tacca</b> del banco con quella dello slot e premi con decisione ai due lati finché le levette si chiudono con un <b>click</b>." + ramTxt() },
    { emoji: "🗄️", title: "4 · L'SSD",
      body: () => isNvme()
        ? "Il tuo <b>SSD NVMe</b> va nello slot <b>M.2</b>: infilalo in diagonale, poi abbassalo e fissalo con la <b>vitina</b> (o il fermo a scatto). È sottilissimo ed è la memoria più veloce."
        : "Fissa l'<b>SSD</b> nel suo alloggio del case e collegalo con un <b>cavo SATA dati</b> alla scheda madre (più avanti un cavo SATA dell'alimentatore gli darà corrente). Se invece è un <b>NVMe</b>, va nello slot <b>M.2</b> fissato con una vitina." },
    { emoji: "🛠️", title: "5 · La scheda madre nel case",
      body: () => "Incastra la <b>mascherina I/O</b> (in dotazione) nel retro del case. Avvita i <b>distanziali</b> (standoff) nei fori del formato " + moboForm() + ", così la scheda non tocca il metallo e non va in corto. Appoggia la scheda madre allineando le porte alla mascherina e avvitala in tutti i punti, <b>senza stringere troppo</b>." },
    { emoji: "🔌", title: "6 · L'alimentatore",
      body: () => "Monta " + psuTxt() + " nel suo vano (di solito in basso), con la <b>ventola</b> rivolta verso una griglia d'aria. Se è <b>modulare</b> collega solo i cavi che userai: meno cavi = più ordine e aria migliore." },
    { emoji: "🎮", title: "7 · La scheda video",
      body: () => hasGpu()
        ? "Togli le <b>staffe</b> sul retro del case in corrispondenza dello slot <b>PCIe x16</b> (il più lungo, vicino alla CPU). Inserisci " + gpuTxt() + " finché la <b>levetta</b> dello slot scatta, avvitala al case e collega i <b>cavi di alimentazione PCIe</b> dall'alimentatore."
        : "Hai scelto la <b>grafica integrata</b> nella CPU: nessuna scheda video da montare. Più avanti collegherai il monitor direttamente alle uscite della <b>scheda madre</b>." },
    { emoji: "⚡", title: "8 · I cavi di alimentazione",
      body: () => "Dall'alimentatore collega: il grande connettore <b>24 pin</b> alla scheda madre, il connettore <b>8 pin (EPS)</b> in alto vicino alla CPU, i cavi <b>SATA</b> a SSD/HDD" + (hasGpu() ? ", e i <b>PCIe</b> alla scheda video" : "") + ". Spingi ogni connettore finché <b>scatta</b>: i mezzi contatti causano mancate accensioni." },
    { emoji: "🔘", title: "9 · I cavetti del frontale",
      body: () => "Collega i sottili cavetti del frontale del case ai <b>pin</b> sulla scheda madre (fatti guidare dal manuale): <b>Power Switch</b> (accensione), Reset, i <b>LED</b> di accensione e del disco, e le porte <b>USB</b> e <b>audio</b> frontali. Collega anche le <b>ventole del case</b> ai connettori <b>SYS_FAN</b>.",
      tip: "Il <b>Power Switch</b> (spesso «PWR_SW») è quello che fa partire il PC: se l'accensione non funziona, di solito è invertito o sui pin sbagliati." },
    { emoji: "🖥️", title: "10 · Primo avvio e BIOS",
      body: () => "Prima di chiudere tutto, fai una <b>prova</b>: collega il monitor " + (hasGpu() ? "alla <b>scheda video</b>" : "alle uscite della <b>scheda madre</b>") + ", attacca tastiera e corrente, e accendi. Dovresti entrare nel <b>BIOS/UEFI</b>: lì attiva il profilo <b>XMP/EXPO</b> per far girare la RAM alla velocità giusta e controlla che le <b>temperature</b> siano normali." },
    { emoji: "🎉", title: "11 · Sistema operativo",
      body: () => "Prepara una <b>chiavetta USB</b> con Windows o Linux, avvia da lì e <b>installa il sistema operativo</b> sull'SSD. Poi installa i <b>driver</b> (soprattutto quelli della scheda video). Chiudi i pannelli del case e sistema i cavi dietro: il tuo PC è pronto e funzionante!" },
  ];

  let asmStep = 0;
  function renderAsm() {
    const n = ASM.length, s = ASM[asmStep], pct = Math.round((asmStep + 1) / n * 100);
    $("asm").innerHTML =
      '<div class="asm-prog"><span>Passo ' + (asmStep + 1) + " / " + n + '</span><div class="asm-bar"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="wiz-head"><span class="wiz-emoji">' + s.emoji + '</span><h2 class="wiz-title">' + s.title + "</h2></div>" +
      '<div class="asm-body">' + s.body() + "</div>" +
      (s.tip ? '<div class="callout"><span class="co-ico">💡</span><div>' + s.tip + "</div></div>" : "") +
      (s.warn ? '<div class="callout warn"><span class="co-ico">⚠️</span><div>' + s.warn + "</div></div>" : "") +
      '<div class="wiz-nav">' +
        (asmStep > 0 ? '<button type="button" class="back" id="asmBack">← Indietro</button>' : "") +
        (asmStep < n - 1 ? '<button type="button" class="run-btn next" id="asmNext">Avanti →</button>'
          : '<button type="button" class="run-btn next" id="asmDone">Torna alla scelta dei pezzi</button>') +
      "</div>" +
      '<p class="asm-note">La guida si adatta ai componenti scelti nella sezione «Scegli i componenti».</p>';
  }
  $("asm").addEventListener("click", (e) => {
    if (e.target.closest("#asmNext")) { asmStep = Math.min(ASM.length - 1, asmStep + 1); renderAsm(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (e.target.closest("#asmBack")) { asmStep = Math.max(0, asmStep - 1); renderAsm(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (e.target.closest("#asmDone")) { asmStep = 0; setMode("config"); }
  });

  /* ---------- Modalità ---------- */
  function setMode(m) {
    $("hwMode").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
    $("configMode").hidden = m !== "config";
    $("montaggioMode").hidden = m !== "asm";
    if (m === "asm") renderAsm();
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
