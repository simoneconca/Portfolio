/* ============================================================
   guida.js — Guida dettagliata ai comandi del Git Visual Sandbox
   Renderizzata sotto al sandbox, con ricerca e pulsanti "inserisci".
   ============================================================ */
(function () {
  "use strict";

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* Ogni comando: { name, syntax, desc, opts:[[flag,testo]], ex:[stringhe], concept:bool } */
  const GUIDE = [
    {
      cat: "Concetti di base",
      intro: "Cosa c'è davvero dietro Git, prima dei comandi.",
      items: [
        { name: "concetto: repository e commit", concept: true, syntax: "la storia come catena di fotografie",
          desc: "Un <b>repository</b> (o «repo») è la cartella di un progetto di cui Git registra la storia. Ogni volta che salvi crei un <b>commit</b>: una <i>fotografia</i> dello stato del progetto in quell'istante, con un codice identificativo (hash, es. <code>a1b2c3d</code>), un messaggio e un collegamento al commit <b>genitore</b>. La storia è quindi una catena di fotografie collegate.",
          ex: ["git init", 'git commit -m "primo"'] },
        { name: "concetto: HEAD e branch", concept: true, syntax: "puntatori, non copie",
          desc: "Un <b>branch</b> (ramo) è solo un <i>puntatore</i> a un commit: un'etichetta che si sposta in avanti ogni volta che committi. <b>HEAD</b> è «dove sto lavorando adesso»: di solito punta a un branch (es. <code>main</code>). Spostare HEAD non cambia i commit, cambia solo il punto di vista. Nel grafo qui sopra HEAD è il cerchio col contorno tratteggiato.",
          ex: ["git status", "git log"] },
      ],
    },
    {
      cat: "Iniziare un repository",
      intro: "Creare il repository da zero.",
      items: [
        { name: "git init", syntax: "git init",
          desc: "Crea un nuovo repository Git vuoto. Compare subito il ramo <b>main</b>, ma è «non nato»: punterà a un commit solo dopo il primo <code>git commit</code>.",
          ex: ["git init"] },
      ],
    },
    {
      cat: "Salvare il lavoro: i commit",
      intro: "Registrare le modifiche e leggere la storia.",
      items: [
        { name: "git commit", syntax: 'git commit -m "messaggio"',
          desc: "Crea un nuovo commit (una fotografia) sopra quello corrente. Il <b>messaggio</b> tra virgolette descrive cosa hai fatto. HEAD e il ramo corrente avanzano sul nuovo commit. In questo sandbox non esistono file né <i>staging area</i>: ogni commit è immediato.",
          opts: [['-m "testo"', "il messaggio del commit"]],
          ex: ['git commit -m "primo commit"', 'git commit -m "aggiungo la homepage"'] },
        { name: "git log", syntax: "git log",
          desc: "Mostra la storia dei commit raggiungibili da HEAD, dal più recente. Per ognuno vedi l'identificativo, le etichette di ramo, l'indicazione <code>(HEAD)</code> e il messaggio.",
          ex: ["git log"] },
        { name: "git status", syntax: "git status",
          desc: "Dice su quale ramo ti trovi (o se HEAD è «detached», cioè staccato) e lo stato dell'area di lavoro. Qui i file non esistono, quindi risulta sempre «pulita».",
          ex: ["git status"] },
      ],
    },
    {
      cat: "Ramificare: i branch",
      intro: "Aprire linee di lavoro parallele senza toccare main.",
      items: [
        { name: "concetto: a cosa serve un branch", concept: true, syntax: "lavorare in parallelo",
          desc: "Un branch ti permette di sviluppare una nuova funzione <i>in parallelo</i> senza disturbare <code>main</code>. Crei un ramo, ci fai dei commit e, quando sei soddisfatto, lo <b>unisci</b> (merge). Creare un ramo è istantaneo: è solo una nuova etichetta appoggiata sul commit corrente.",
          ex: ["git branch feature", "git checkout -b feature"] },
        { name: "git branch", syntax: "git branch [nome]",
          desc: "Senza nome: <b>elenca</b> i rami (un <code>*</code> segna quello corrente). Con un nome: <b>crea</b> un nuovo ramo sul commit corrente, ma <b>non</b> sposta HEAD (resti dove sei).",
          opts: [["(vuoto)", "elenca i rami esistenti"], ["nome", "crea un ramo sul commit corrente"]],
          ex: ["git branch", "git branch feature"] },
        { name: "git checkout", syntax: "git checkout <ramo>  ·  git checkout -b <nuovo>",
          desc: "Sposta HEAD su un altro ramo (o commit). Con <code>-b</code> <b>crea</b> un nuovo ramo e ci salta sopra in un colpo solo. È il modo storico di cambiare ramo.",
          opts: [["<ramo>", "passa a un ramo esistente"], ["-b <nuovo>", "crea il ramo e ci sposta subito HEAD"]],
          ex: ["git checkout -b feature", "git checkout main"] },
        { name: "git switch", syntax: "git switch <ramo>  ·  git switch -c <nuovo>",
          desc: "Versione più recente e leggibile di <code>checkout</code>, pensata <i>solo</i> per cambiare ramo. <code>-c</code> («create») crea il nuovo ramo e ci sposta sopra, esattamente come <code>checkout -b</code>.",
          opts: [["<ramo>", "passa a un ramo esistente"], ["-c <nuovo>", "crea il ramo e ci sposta subito HEAD"]],
          ex: ["git switch -c feature", "git switch main"] },
      ],
    },
    {
      cat: "Unire i rami: merge",
      intro: "Riportare il lavoro di un ramo dentro un altro.",
      items: [
        { name: "concetto: fast-forward vs merge a tre vie", concept: true, syntax: "due modi di unire",
          desc: "Se il ramo corrente non ha commit «propri» dopo il punto di partenza, git fa un <b>fast-forward</b>: sposta semplicemente l'etichetta in avanti, senza creare nulla. Se invece i due rami sono <b>divergenti</b> (entrambi hanno commit nuovi), git crea un <b>commit di merge</b> con <b>due genitori</b>: le due linee si riuniscono nel grafo.",
          ex: ["git merge feature"] },
        { name: "git merge", syntax: "git merge <ramo>",
          desc: "Unisce il ramo indicato <b>dentro</b> quello su cui ti trovi. Spostati prima sul ramo di destinazione (es. <code>main</code>), poi unisci la feature. A seconda della storia ottieni un fast-forward oppure un commit di merge.",
          opts: [["<ramo>", "il ramo da unire in quello corrente"]],
          ex: ["git checkout main", "git merge feature"] },
      ],
    },
    {
      cat: "Tornare indietro",
      intro: "Spostare il puntatore di un ramo o staccare HEAD.",
      items: [
        { name: "git reset --hard", syntax: "git reset --hard <ref>",
          desc: "Sposta il puntatore del ramo corrente a un altro commit, indicato con un id o con un nome di ramo. I commit «scavalcati» restano nel grafo finché qualcosa li raggiunge. In Git reale <code>--hard</code> butterebbe via anche le modifiche non salvate ai file.",
          opts: [["--hard", "riallinea tutto al commit indicato"], ["<ref>", "id di un commit o nome di un ramo"]],
          ex: ["git log", "git reset --hard main"] },
        { name: "concetto: HEAD detached", concept: true, syntax: "checkout di un commit",
          desc: "Se fai <code>git checkout</code> di un <b>commit</b> (invece che di un ramo), HEAD si <b>stacca</b> (detached): non è più su nessun ramo. I commit fatti in questo stato non appartengono ad alcun ramo finché non ne crei uno con <code>git branch</code> o <code>git switch -c</code>.",
          ex: ["git switch main"] },
      ],
    },
    {
      cat: "Terminale",
      intro: "Comandi di servizio del sandbox.",
      items: [
        { name: "help", syntax: "help",
          desc: "Elenca rapidamente i comandi supportati direttamente nel terminale.",
          ex: ["help"] },
        { name: "clear", syntax: "clear",
          desc: "Pulisce lo schermo del terminale. Non tocca il grafo né la storia dei commit.",
          ex: ["clear"] },
      ],
    },
  ];

  /* ---------- Render ---------- */
  const guideEl = document.getElementById("guide");
  if (!guideEl) return;

  let html = "";
  GUIDE.forEach((group) => {
    html += `<section class="guide-cat" data-cat="${esc(group.cat)}">`;
    html += `<h3 class="guide-cat-title">${esc(group.cat)}</h3>`;
    if (group.intro) html += `<p class="guide-cat-intro">${esc(group.intro)}</p>`;
    group.items.forEach((it) => {
      const search = (it.name + " " + (it.syntax || "") + " " + it.desc + " " + group.cat +
        " " + (it.opts || []).map((o) => o.join(" ")).join(" ")).toLowerCase().replace(/<[^>]+>/g, "");
      html += `<details class="guide-cmd${it.concept ? " concept" : ""}" data-search="${esc(search)}">`;
      html += `<summary><span class="g-name">${esc(it.name)}</span>` +
              `<span class="g-syntax">${esc(it.syntax || "")}</span></summary>`;
      html += `<div class="g-body">`;
      html += `<p class="g-desc">${it.desc}</p>`;
      if (it.opts && it.opts.length) {
        html += `<ul class="g-opts">`;
        it.opts.forEach((o) => { html += `<li><code>${esc(o[0])}</code><span>${esc(o[1])}</span></li>`; });
        html += `</ul>`;
      }
      if (it.ex && it.ex.length) {
        html += `<div class="g-examples"><span class="g-ex-label">Esempi</span>`;
        it.ex.forEach((e) => {
          html += `<div class="g-ex"><code>${esc(e)}</code>` +
                  `<button type="button" class="g-try" data-cmd="${esc(e)}">inserisci ↵</button></div>`;
        });
        html += `</div>`;
      }
      html += `</div></details>`;
    });
    html += `</section>`;
  });
  guideEl.innerHTML = html;

  /* ---------- "Inserisci" → scrive il comando nell'input del sandbox ---------- */
  guideEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".g-try");
    if (!btn) return;
    e.preventDefault();
    if (window.GV && typeof window.GV.type === "function") {
      window.GV.type(btn.dataset.cmd);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  /* ---------- Ricerca ---------- */
  const search = document.getElementById("guideSearch");
  const empty = document.getElementById("guideEmpty");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let anyVisible = false;
    guideEl.querySelectorAll(".guide-cat").forEach((cat) => {
      let catVisible = false;
      cat.querySelectorAll(".guide-cmd").forEach((cmd) => {
        const match = q === "" || cmd.dataset.search.indexOf(q) >= 0;
        cmd.hidden = !match;
        if (match) { catVisible = true; anyVisible = true; }
        if (q !== "" && match) cmd.open = true;
        if (q === "") cmd.open = false;
      });
      cat.hidden = !catVisible;
    });
    empty.hidden = anyVisible;
  });
})();
