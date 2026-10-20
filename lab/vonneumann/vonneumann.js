/* ============================================================
   vonneumann.js — La macchina di von Neumann (lab introduttivo)
   Hardware/software, sistema operativo, input-elaborazione-output,
   i componenti del PC (diagramma cliccabile + flusso dei dati) e
   il ciclo fetch–decode–execute. Zero dipendenze.
   ============================================================ */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  /* ============================================================
     COMPONENTI — definizioni (a cosa serve ognuno)
     ============================================================ */
  const INFO = {
    input:  { ico: "⌨️", title: "Dispositivi di input", text: "Servono a <b>immettere</b> dati e istruzioni nel computer: tastiera, mouse, microfono, fotocamera… Sono il modo con cui <b>l'utente comunica</b> con il computer." },
    output: { ico: "🖥️", title: "Dispositivi di output", text: "<b>Mostrano</b> o restituiscono i risultati dell'elaborazione: monitor, stampante, casse… Sono il modo con cui <b>il computer comunica</b> con l'utente." },
    cpu:    { ico: "🧠", title: "CPU — il cervello", text: "La <b>CPU</b> (Central Processing Unit) è l'unità che <b>esegue le istruzioni</b> dei programmi. È fatta di tre parti: <b>Unità di Controllo (CU)</b>, <b>ALU</b> e <b>Registri</b>." },
    cu:     { ico: "🎛️", title: "Unità di Controllo (CU)", text: "Il “direttore d'orchestra”: <b>interpreta le istruzioni</b> del programma e <b>dirige il flusso dei dati</b> tra i vari componenti del computer." },
    alu:    { ico: "➗", title: "ALU — Unità Aritmetico-Logica", text: "Esegue i <b>calcoli matematici</b> (addizioni, sottrazioni…) e le <b>operazioni logiche</b> (confronti: maggiore, minore, uguale…)." },
    reg:    { ico: "⚡", title: "Registri", text: "Piccolissime memorie <b>velocissime</b> dentro la CPU. Conservano i dati e le istruzioni che la CPU sta usando <b>proprio in questo istante</b>." },
    mem:    { ico: "📥", title: "Memoria centrale", text: "Conserva <b>temporaneamente</b> i dati e le istruzioni dei programmi in esecuzione, con accesso rapido. È divisa in <b>RAM</b>, <b>ROM</b> e <b>Cache</b>." },
    ram:    { ico: "📝", title: "RAM — memoria di lavoro", text: "Qui stanno il sistema operativo, i programmi aperti e i dati in lavorazione. È <b>volatile</b>: quando spegni il computer, <b>si svuota</b>. “Random Access”: si legge qualsiasi dato in modo diretto e veloce." },
    rom:    { ico: "🔒", title: "ROM — memoria di avvio", text: "Memoria <b>non volatile</b> (non si cancella) con le istruzioni per accendere il PC: il <b>BIOS/UEFI</b>. All'avvio la CPU parte da qui, controlla l'hardware e carica il sistema operativo (<b>bootstrap</b>)." },
    cache:  { ico: "🚀", title: "Cache", text: "Memoria piccola e <b>ultra-veloce</b>, tra CPU e RAM. Tiene i dati usati <b>più spesso</b> per ridarli alla CPU quasi all'istante, migliorando le prestazioni." },
    bus:    { ico: "🔗", title: "Bus di sistema", text: "I “cavi” che collegano i componenti e fanno passare le informazioni. Tre tipi: <b>Data bus</b> (i dati veri e propri), <b>Address bus</b> (la posizione in memoria), <b>Control bus</b> (i comandi che coordinano tutto)." },
    mobo:   { ico: "🔲", title: "Scheda madre (Motherboard)", text: "Il <b>circuito principale</b> a cui si collegano tutti i componenti, permettendo loro di comunicare tra di loro." },
    storage:{ ico: "💽", title: "Memoria secondaria (HDD / SSD)", text: "Conserva i dati in modo <b>permanente</b>, anche a PC spento: sistema operativo, programmi e file. L'<b>HDD</b> usa dischi magnetici che girano (economico ma lento); l'<b>SSD</b> usa memorie flash senza parti in movimento (molto più veloce)." },
    gpu:    { ico: "🎮", title: "Scheda video (GPU)", text: "Elabora e produce le <b>immagini</b> da mostrare sullo schermo. È fondamentale per i <b>giochi</b> e i programmi di grafica." },
    psu:    { ico: "🔌", title: "Alimentatore (PSU)", text: "Converte la corrente elettrica della <b>presa a muro</b> in una forma adatta ad alimentare i componenti del computer." },
  };

  // componenti che nel lab "Montaggio PC" si scelgono e si montano davvero
  const MONTAGGIO = { cpu: "la CPU", mem: "la memoria RAM", ram: "la memoria RAM", storage: "il disco (SSD/HDD)", gpu: "la scheda video", psu: "l'alimentatore", mobo: "la scheda madre" };
  function showInfo(key) {
    const d = INFO[key]; if (!d) return;
    const link = MONTAGGIO[key]
      ? `<a class="vn-info-link" href="../hardware/">🔧 Scegli e monta ${MONTAGGIO[key]} nel lab «Montaggio PC» →</a>`
      : "";
    $("vnInfo").innerHTML =
      `<div class="vn-info-card">` +
      `<div class="vn-info-head"><span class="vn-ico-big">${d.ico}</span><h2>${d.title}</h2></div>` +
      `<p>${d.text}</p>${link}</div>`;
    document.querySelectorAll("[data-comp]").forEach((el) => el.classList.toggle("picked", el.dataset.comp === key));
  }
  document.querySelectorAll("[data-comp]").forEach((el) =>
    el.addEventListener("click", () => showInfo(el.dataset.comp)));

  /* ---------- Flusso dei dati (passo-passo) ---------- */
  const FLOW = [
    { on: ["rom", "cu", "bus"], t: "1. <b>Accensione</b>: la CPU esegue le prime istruzioni che trova nella <b>ROM</b> (il BIOS/UEFI), che controlla l'hardware." },
    { on: ["storage", "ram", "bus"], t: "2. <b>Bootstrap</b>: il <b>sistema operativo</b> viene caricato dalla <b>memoria secondaria</b> (HDD/SSD) nella <b>RAM</b>, passando dal bus. Ora il PC è pronto." },
    { on: ["input", "bus"], t: "3. Apri un programma: con un dispositivo di <b>input</b> (la tastiera) inserisci dati e comandi, che viaggiano sul <b>bus</b>." },
    { on: ["storage", "ram", "bus"], t: "4. Anche il <b>programma</b> che apri viene copiato dalla <b>memoria secondaria</b> alla <b>RAM</b>, pronto per essere eseguito." },
    { on: ["cu", "ram", "bus"], t: "5. La <b>CU</b> (unità di controllo) legge l'istruzione dalla RAM passando dal bus: capisce cosa fare." },
    { on: ["reg"], t: "6. I dati da elaborare vengono caricati nei <b>Registri</b>, dentro la CPU." },
    { on: ["alu"], t: "7. L'<b>ALU</b> esegue il calcolo richiesto (per esempio una somma)." },
    { on: ["ram", "bus"], t: "8. Il <b>risultato</b> torna nella RAM, sempre attraverso il bus." },
    { on: ["output", "bus"], t: "9. Infine un dispositivo di <b>output</b> (lo schermo) mostra il risultato all'utente. 🎉" },
  ];
  let fstep = -1, ftimer = null;

  function paintFlow() {
    document.querySelectorAll(".vn-diagram [data-comp]").forEach((el) => el.classList.remove("flowing"));
    if (fstep < 0) { $("flowDesc").innerHTML = "Premi <b>Passo</b> o <b>«Guarda il flusso»</b> per vedere come i dati attraversano i componenti."; return; }
    const s = FLOW[fstep];
    s.on.forEach((k) => document.querySelectorAll(`.vn-diagram [data-comp="${k}"]`).forEach((el) => el.classList.add("flowing")));
    $("flowDesc").innerHTML = `<span class="fd-n">▸</span> ${s.t}`;
  }
  function flowStep() {
    if (fstep >= FLOW.length - 1) { stopAuto(); return; }
    fstep++; paintFlow();
    if (fstep >= FLOW.length - 1) stopAuto();
  }
  function stopAuto() { if (ftimer) { clearInterval(ftimer); ftimer = null; $("flowAuto").textContent = "▶ Guarda il flusso"; $("flowAuto").classList.remove("on"); } }
  function flowReset() { stopAuto(); fstep = -1; paintFlow(); }
  function toggleAuto() {
    if (ftimer) { stopAuto(); return; }
    if (fstep >= FLOW.length - 1) { fstep = -1; paintFlow(); }
    $("flowAuto").textContent = "⏸ Pausa"; $("flowAuto").classList.add("on");
    ftimer = setInterval(() => { if (fstep < FLOW.length - 1) flowStep(); else stopAuto(); }, 1500);
  }
  $("flowStep").addEventListener("click", () => { stopAuto(); flowStep(); });
  $("flowAuto").addEventListener("click", toggleAuto);
  $("flowReset").addEventListener("click", flowReset);
  flowReset();

  /* ============================================================
     1. HARDWARE E SOFTWARE — classifica
     ============================================================ */
  const HWSW = [
    { name: "CPU", a: "hw" }, { name: "Tastiera", a: "hw" }, { name: "RAM", a: "hw" },
    { name: "Mouse", a: "hw" }, { name: "SSD / Hard disk", a: "hw" }, { name: "Monitor", a: "hw" },
    { name: "Windows", a: "sw" }, { name: "Android", a: "sw" }, { name: "Un videogioco", a: "sw" },
    { name: "Il browser", a: "sw" }, { name: "WhatsApp", a: "sw" }, { name: "Photoshop", a: "sw" },
  ];
  const hwswDone = {}; let hwswScore = 0;
  function updateHwswScore() {
    const done = Object.keys(hwswDone).length;
    $("hwswScore").innerHTML = done
      ? `Risposte giuste: <b>${hwswScore} / ${done}</b>` + (done === HWSW.length ? " — completato! 🎉" : "") : "";
  }
  function renderHwsw() {
    $("hwswGrid").innerHTML = HWSW.map((it, i) =>
      `<div class="hwsw-item" data-i="${i}">` +
        `<span class="hwsw-name">${it.name}</span>` +
        `<div class="hwsw-btns"><button type="button" data-a="hw">💻 Hardware</button>` +
        `<button type="button" data-a="sw">📀 Software</button></div></div>`).join("");
  }
  $("hwswGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-a]"); if (!btn) return;
    const item = btn.closest(".hwsw-item"), i = +item.dataset.i;
    if (hwswDone[i]) return;
    const correct = HWSW[i].a, ok = btn.dataset.a === correct;
    hwswDone[i] = true; if (ok) hwswScore++;
    item.classList.add(ok ? "correct" : "wrong");
    item.querySelectorAll("[data-a]").forEach((b) => { b.disabled = true; if (b.dataset.a === correct) b.classList.add("right"); });
    item.insertAdjacentHTML("beforeend", `<span class="hwsw-fb ${ok ? "ok" : "no"}">${ok ? "✓ giusto" : "✗ è " + (correct === "hw" ? "hardware" : "software")}</span>`);
    updateHwswScore();
  });
  renderHwsw(); updateHwswScore();

  /* ============================================================
     2. INPUT – ELABORAZIONE – OUTPUT
     ============================================================ */
  const IPO = [
    { topic: "🧮 Calcolatrice: 3 + 5", in: "Digiti «3 + 5» sulla tastiera.", proc: "La CPU somma i due numeri.", out: "Sullo schermo appare «8».", mem: "I numeri e il risultato sono tenuti nella RAM durante il calcolo." },
    { topic: "🎵 Ascoltare una canzone", in: "Premi play: il file audio viene letto dal disco.", proc: "Il computer decodifica l'audio in un segnale.", out: "Le casse (o le cuffie) emettono il suono.", mem: "Un pezzo di canzone viene caricato in RAM mentre suona." },
    { topic: "🖨️ Stampare una foto", in: "Invii la foto alla stampante.", proc: "La stampante elabora i dati e prepara i colori.", out: "Esce il foglio stampato.", mem: "L'immagine resta in memoria finché non è stampata." },
    { topic: "🎮 Giocare", in: "Premi i tasti o muovi il joystick.", proc: "CPU e scheda video (GPU) calcolano la scena.", out: "Lo schermo mostra il gioco, le casse il suono.", mem: "Il gioco e la scena corrente stanno in RAM." },
  ];
  let ipoI = 0;
  function renderIpoPick() { $("ipoPick").innerHTML = IPO.map((s, i) => `<button type="button" class="ipo-btn${i === ipoI ? " active" : ""}" data-i="${i}">${s.topic}</button>`).join(""); }
  function renderIpo() {
    const s = IPO[ipoI];
    $("ipoIn").textContent = s.in; $("ipoProc").textContent = s.proc; $("ipoOut").textContent = s.out;
    $("ipoMem").innerHTML = `<span class="ipo-mem-ico">📥</span> <b>Memoria:</b> ${s.mem}`;
  }
  $("ipoPick").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; ipoI = +b.dataset.i; renderIpoPick(); renderIpo(); });
  renderIpoPick(); renderIpo();

  /* ============================================================
     4. CICLO MACCHINA — fetch / decode / execute
     ============================================================ */
  const FDE = [
    { desc: "<b>Preleva (fetch).</b> La CU usa il <b>Program Counter</b> (PC) per leggere dalla RAM la prossima istruzione: «<b>SOMMA A, B</b>». L'istruzione entra nella CPU.", pc: 0, ris: "—" },
    { desc: "<b>Decodifica (decode).</b> La CU <b>interpreta</b> l'istruzione: capisce che è una <b>somma</b> e che deve usare l'ALU con i valori A e B.", pc: 0, ris: "—" },
    { desc: "<b>Esegui (execute).</b> L'<b>ALU</b> prende A = 3 e B = 5 dai registri e calcola <b>3 + 5 = 8</b>.", pc: 0, ris: "8" },
    { desc: "<b>Scrivi (write-back).</b> Il risultato <b>8</b> viene salvato. Il <b>PC avanza</b> (→ 1) e il ciclo <b>ricomincia</b> con l'istruzione successiva.", pc: 1, ris: "8" },
  ];
  let fdeS = -1, fdeTimer = null;
  function paintFde() {
    document.querySelectorAll(".fde-stage").forEach((el) => el.classList.toggle("on", +el.dataset.s === fdeS));
    const s = fdeS < 0 ? null : FDE[fdeS];
    $("fdeRegs").innerHTML =
      `<span class="fde-reg"><b>PC</b><i>${s ? s.pc : 0}</i></span>` +
      `<span class="fde-reg a"><b>A</b><i>3</i></span>` +
      `<span class="fde-reg b"><b>B</b><i>5</i></span>` +
      `<span class="fde-reg r"><b>Risultato</b><i>${s ? s.ris : "—"}</i></span>`;
    $("fdeDesc").innerHTML = s ? s.desc : "Premi <b>Passo</b> per seguire il ciclo su un'istruzione, oppure <b>«Avvia»</b> per vederlo girare in continuo.";
  }
  function fdeNext() { fdeS = (fdeS + 1) % FDE.length; paintFde(); }
  function fdeStopAuto() { if (fdeTimer) { clearInterval(fdeTimer); fdeTimer = null; $("fdeAuto").textContent = "▶ Avvia il ciclo"; $("fdeAuto").classList.remove("on"); } }
  $("fdeStep").addEventListener("click", () => { fdeStopAuto(); fdeNext(); });
  $("fdeAuto").addEventListener("click", () => { if (fdeTimer) { fdeStopAuto(); return; } $("fdeAuto").textContent = "⏸ Pausa"; $("fdeAuto").classList.add("on"); fdeTimer = setInterval(fdeNext, 1600); });
  $("fdeReset").addEventListener("click", () => { fdeStopAuto(); fdeS = -1; paintFde(); });
  paintFde();

  /* ============================================================
     5. SISTEMA OPERATIVO — strati
     ============================================================ */
  const SO_LAYERS = [
    { ico: "🧑", name: "Tu (l'utente)", text: "Usi il computer tramite finestre, icone, tocchi e clic. Non parli mai direttamente con l'hardware: passi sempre dal sistema operativo." },
    { ico: "🧩", name: "I programmi (le app)", text: "Browser, giochi, Word, WhatsApp… Per funzionare <b>chiedono servizi</b> al sistema operativo (aprire un file, mostrare una finestra, usare la rete)." },
    { ico: "⚙️", name: "Il Sistema Operativo", text: "Il grande <b>intermediario</b>: gestisce la <b>memoria</b>, i <b>file</b>, i <b>processi</b> (i programmi in esecuzione) e le <b>periferiche</b>; offre a te un'interfaccia e ai programmi dei «servizi» pronti all'uso. Esempi: <b>Windows, macOS, Linux, Android, iOS</b>.", hot: true },
    { ico: "🔌", name: "L'hardware", text: "CPU, memoria, dischi, schermo… Esegue gli ordini, ma da solo non saprebbe cosa fare: è il sistema operativo a comandarlo per conto tuo e dei programmi." },
  ];
  function renderSo() {
    $("soStack").innerHTML = SO_LAYERS.map((l, i) =>
      `<button type="button" class="so-layer${l.hot ? " hot" : ""}" data-i="${i}"><span class="so-ico">${l.ico}</span><span class="so-name">${l.name}</span></button>` +
      (i < SO_LAYERS.length - 1 ? `<span class="so-sep">▼</span>` : "")).join("");
  }
  function showSo(i) {
    const l = SO_LAYERS[i];
    document.querySelectorAll(".so-layer").forEach((el) => el.classList.toggle("sel", +el.dataset.i === i));
    $("soDetail").innerHTML = `<span class="so-d-ico">${l.ico}</span><div><b>${l.name}</b><p>${l.text}</p></div>`;
  }
  $("soStack").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) showSo(+b.dataset.i); });
  renderSo(); showSo(2);
})();
