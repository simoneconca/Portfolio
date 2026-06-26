/* ============================================================
   hardware.js — PC Assembly Lab (percorso guidato)
   Un componente alla volta: spiega e fa scegliere solo tra le
   opzioni compatibili. Per studenti di 1ª–2ª. Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ---------- Catalogo (semplice e amichevole) ---------- */
  const CPU = [
    { id: "i5", emoji: "🔵", name: "Intel Core i5", tag: "Equilibrata", desc: "Va bene per studiare, navigare e qualche gioco.", socket: "LGA1700", tdp: 65, tier: 6, price: 180 },
    { id: "r5", emoji: "🔴", name: "AMD Ryzen 5", tag: "Equilibrata", desc: "Buona per tutti i giorni e i giochi leggeri.", socket: "AM5", tdp: 65, tier: 6, price: 200 },
    { id: "r7", emoji: "🔴", name: "AMD Ryzen 7", tag: "Potente", desc: "Per giochi impegnativi e montaggio video.", socket: "AM5", tdp: 120, tier: 9, price: 350 },
  ];
  const MOBO = [
    { id: "b660", emoji: "🟩", name: "Scheda madre B660", desc: "Compatta ed economica.", socket: "LGA1700", ram: "DDR4", form: "mATX", price: 110 },
    { id: "z790", emoji: "🟩", name: "Scheda madre Z790", desc: "Grande, con tante porte.", socket: "LGA1700", ram: "DDR5", form: "ATX", price: 200 },
    { id: "a620", emoji: "🟥", name: "Scheda madre A620", desc: "Compatta per AMD.", socket: "AM5", ram: "DDR5", form: "mATX", price: 120 },
    { id: "b650", emoji: "🟥", name: "Scheda madre B650", desc: "Grande ed espandibile.", socket: "AM5", ram: "DDR5", form: "ATX", price: 180 },
  ];
  const RAM = [
    { id: "d4_16", emoji: "🟦", name: "16 GB DDR4", desc: "Abbastanza per quasi tutto.", type: "DDR4", price: 40 },
    { id: "d4_32", emoji: "🟦", name: "32 GB DDR4", desc: "Tanta, per fare molte cose insieme.", type: "DDR4", price: 80 },
    { id: "d5_16", emoji: "🟪", name: "16 GB DDR5", desc: "Veloce, abbastanza per quasi tutto.", type: "DDR5", price: 60 },
    { id: "d5_32", emoji: "🟪", name: "32 GB DDR5", desc: "Veloce e abbondante.", type: "DDR5", price: 110 },
  ];
  const GPU = [
    { id: "igpu", emoji: "✅", name: "Grafica integrata", tag: "gratis", desc: "È già dentro la CPU: gratis, perfetta per studiare e navigare.", length: 0, tdp: 0, tier: 3, price: 0, integrated: true },
    { id: "rtx4060", emoji: "🎮", name: "GeForce RTX 4060", desc: "Buona per giocare in Full HD.", length: 245, tdp: 115, tier: 6, price: 300 },
    { id: "rtx4070", emoji: "🎮", name: "GeForce RTX 4070", tag: "potente", desc: "Per giocare alla grande.", length: 285, tdp: 200, tier: 8, price: 600 },
  ];
  const PSU = [
    { id: "p450", emoji: "⚡", name: "Alimentatore 450 W", desc: "Per PC senza scheda video potente.", watt: 450, price: 45 },
    { id: "p550", emoji: "⚡", name: "Alimentatore 550 W", desc: "Una buona via di mezzo.", watt: 550, price: 60 },
    { id: "p650", emoji: "⚡", name: "Alimentatore 650 W", desc: "Con margine per giocare.", watt: 650, price: 85 },
    { id: "p850", emoji: "⚡", name: "Alimentatore 850 W", desc: "Tanta energia, per i PC più potenti.", watt: 850, price: 130 },
  ];
  const CASE = [
    { id: "small", emoji: "📦", name: "Case piccolo", desc: "Occupa poco spazio sulla scrivania.", forms: ["ITX", "mATX"], maxGpu: 300, price: 70 },
    { id: "big", emoji: "📦", name: "Case grande", desc: "C'è posto per tutto, facile da montare.", forms: ["ITX", "mATX", "ATX"], maxGpu: 360, price: 110 },
  ];

  const power = (b) => b.cpu.tdp + (b.gpu ? b.gpu.tdp : 0) + 70;
  const suggestedW = (b) => { const need = power(b); return Math.ceil((need * 1.5) / 50) * 50; };

  /* ---------- Passi della guida ---------- */
  const STEPS = [
    { key: "cpu", emoji: "🧠", title: "La CPU — il cervello", type: "CPU",
      intro: () => "La <b>CPU</b> è il cervello del computer: esegue tutti i calcoli. Ogni CPU ha un <b>socket</b>, cioè la forma dell'attacco. La scheda madre dovrà avere lo <b>stesso socket</b>, come una spina e la sua presa. Scegline una:",
      options: () => CPU,
      spec: (c) => "Socket: " + c.socket,
      callout: (c) => `Hai scelto una CPU con socket <b>${c.socket}</b>. Tieni a mente questa parola: al prossimo passo serve una scheda madre con lo <b>stesso</b> socket!` },

    { key: "mobo", emoji: "🛠️", title: "La scheda madre — la base", type: "Scheda madre",
      intro: (b) => `La <b>scheda madre</b> è la base su cui si collega tutto. Ti mostro <b>solo</b> quelle compatibili con la tua CPU (socket <b>${b.cpu.socket}</b>):`,
      options: (b) => MOBO.filter((m) => m.socket === b.cpu.socket),
      spec: (c) => "Memorie: " + c.ram + " · " + c.form,
      callout: (c) => `Bene! Questa scheda madre usa memorie <b>${c.ram}</b>, quindi anche la RAM dovrà essere <b>${c.ram}</b>.` },

    { key: "ram", emoji: "💾", title: "La RAM — la memoria di lavoro", type: "RAM",
      intro: (b) => `La <b>RAM</b> è la memoria di lavoro: più ne hai, più cose il PC può fare nello stesso momento. Deve essere del tipo giusto: la tua scheda madre vuole <b>${b.mobo.ram}</b>.`,
      options: (b) => RAM.filter((r) => r.type === b.mobo.ram),
      spec: (c) => c.type,
      callout: () => "Perfetto, RAM del tipo giusto. ✅" },

    { key: "gpu", emoji: "🎮", title: "La scheda video", type: "Scheda video",
      intro: () => "La <b>scheda video</b> disegna le immagini, importante soprattutto per i <b>giochi</b>. La tua CPU ha già una grafica integrata: per studiare e navigare basta quella. Per giocare meglio, aggiungi una scheda dedicata.",
      options: () => GPU,
      spec: (c) => (c.integrated ? "Inclusa nella CPU" : "Lunga " + c.length + " mm"),
      callout: (c) => c.integrated ? "Ottima scelta per risparmiare: userai la grafica già dentro la CPU." : "Bella per i giochi! Però consuma più energia: lo terremo a mente per l'alimentatore." },

    { key: "psu", emoji: "🔌", title: "L'alimentatore — l'energia", type: "Alimentatore",
      intro: (b) => `L'<b>alimentatore</b> dà energia a tutti i componenti. Il tuo PC consuma circa <b>${power(b)} W</b>, quindi serve un alimentatore da almeno <b>${suggestedW(b)} W</b> (un po' di margine è sempre meglio). Ti mostro quelli adatti:`,
      options: (b) => PSU.filter((p) => p.watt >= suggestedW(b)),
      spec: (c) => c.watt + " W",
      callout: () => "Energia sufficiente, con il giusto margine. ⚡" },

    { key: "case", emoji: "📦", title: "Il case — la scatola", type: "Case",
      intro: (b) => `Il <b>case</b> è la scatola che contiene tutto. Deve essere grande abbastanza per la tua scheda madre (<b>${b.mobo.form}</b>) e per la scheda video. Ti mostro quelli in cui tutto entra:`,
      options: (b) => CASE.filter((c) => c.forms.indexOf(b.mobo.form) >= 0 && c.maxGpu >= (b.gpu ? b.gpu.length : 0)),
      spec: (c) => "Entra fino a " + c.maxGpu + " mm di GPU",
      callout: () => "Tutto entra! Hai assemblato il tuo PC. 🎉" },
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
          `<div class="opt-spec">${s.spec(o)}</div>` +
          `<div class="opt-price">${o.price === 0 ? "incluso" : o.price + " €"}</div>` +
        `</button>`).join("") + `</div>` +
      (chosen ? `<div class="callout"><span class="co-ico">💡</span><div>${s.callout(chosen)}</div></div>` : "") +
      `<div class="wiz-nav">` +
        (step > 0 ? `<button type="button" class="back" id="wizBack">← Indietro</button>` : "") +
        `<button type="button" class="run-btn next" id="wizNext" ${chosen ? "" : "disabled"}>${step === STEPS.length - 1 ? "Vedi il risultato 🎉" : "Avanti →"}</button>` +
      `</div>`;
  }

  function renderFinale() {
    const order = ["cpu", "mobo", "ram", "gpu", "psu", "case"];
    let total = 0; order.forEach((k) => total += build[k].price);
    $("wizard").innerHTML =
      `<div class="finale">` +
      `<div class="big-emoji">🎉</div>` +
      `<h2>Complimenti, il tuo PC è pronto!</h2>` +
      `<p>Hai scelto ogni pezzo facendo attenzione che si incastrasse con gli altri. Ecco cosa hai imparato:</p>` +
      `<div class="recap">` +
        `<div class="recap-item"><span class="ri">✓</span><div>Il <b>socket</b> della CPU (${build.cpu.socket}) deve combaciare con la scheda madre.</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>La <b>RAM</b> deve essere del tipo giusto (${build.ram.type}).</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>L'<b>alimentatore</b> deve dare abbastanza Watt (~${power(build)} W di consumo).</div></div>` +
        `<div class="recap-item"><span class="ri">✓</span><div>Il <b>case</b> deve essere grande abbastanza per scheda madre e scheda video.</div></div>` +
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
    $("buildTotal").innerHTML = `<span class="bt-lbl">Totale (${done}/6 pezzi)</span><span class="bt-val">${total} €</span>`;
  }

  function renderAll() { renderSteps(); renderWizard(); renderBuild(); }

  /* ---------- Eventi ---------- */
  $("wizard").addEventListener("click", (e) => {
    const card = e.target.closest(".opt-card");
    if (card) {
      const s = STEPS[step];
      const o = s.options(build).find((x) => x.id === card.dataset.id);
      build[s.key] = o;
      // cambiare un componente a monte azzera le scelte successive (dipendevano da questo)
      for (let i = step + 1; i < STEPS.length; i++) delete build[STEPS[i].key];
      renderAll();
      return;
    }
    if (e.target.closest("#wizNext")) { if (build[STEPS[step].key]) { if (step === STEPS.length - 1) finished = true; else step++; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); } }
    else if (e.target.closest("#wizBack")) { if (step > 0) { step--; renderAll(); } }
    else if (e.target.closest("#restart")) { step = 0; build = {}; finished = false; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  /* ---------- Avvio ---------- */
  renderAll();
})();
