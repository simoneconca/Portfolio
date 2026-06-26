/* ============================================================
   guida.js — Guida dettagliata ai comandi del Virtual Terminal
   Renderizzata sotto al terminale, con ricerca e pulsanti "prova".
   ============================================================ */
(function () {
  "use strict";

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* Ogni comando: { name, syntax, desc, opts:[[flag,testo]], ex:[stringhe], concept:bool } */
  const GUIDE = [
    {
      cat: "Percorsi e navigazione",
      intro: "Dove ti trovi e come spostarti nell'albero delle cartelle.",
      items: [
        { name: "concetto: percorsi", concept: true, syntax: "assoluto vs relativo",
          desc: "Un percorso <b>assoluto</b> parte dalla radice <code>/</code> e indica la posizione esatta (es. <code>/home/studente/documenti</code>). Un percorso <b>relativo</b> parte da dove ti trovi ora. Due scorciatoie fondamentali: <code>.</code> è la cartella corrente, <code>..</code> è la cartella superiore (per salire).",
          ex: ["cd /etc", "cd ..", "cd ../.."] },
        { name: "pwd", syntax: "pwd",
          desc: "<i>Print Working Directory</i>: stampa il percorso assoluto della cartella in cui ti trovi in questo momento.",
          ex: ["pwd"] },
        { name: "cd", syntax: "cd [percorso]",
          desc: "<i>Change Directory</i>: cambia la cartella corrente. Senza argomenti torni alla tua home. Accetta percorsi assoluti o relativi, e <code>..</code> per salire.",
          opts: [["cd", "torna alla home (~)"], ["cd ..", "sali di un livello"], ["cd /percorso", "vai a un percorso assoluto"]],
          ex: ["cd documenti", "cd ..", "cd /etc", "cd"] },
        { name: "ls", syntax: "ls [opzioni] [percorso]",
          desc: "<i>List</i>: elenca il contenuto di una cartella. Le opzioni si possono combinare (es. <code>ls -lr</code>).",
          opts: [["-l", "formato lungo: permessi, proprietario, gruppo, dimensione, data"], ["-a", "mostra anche i file nascosti (che iniziano con .)"], ["-r", "ordine inverso"], ["-t", "ordina per data di modifica"], ["-S", "ordina per dimensione"]],
          ex: ["ls", "ls -l", "ls -la", "ls -lt documenti", "ls -lS"] },
        { name: "tree", syntax: "tree",
          desc: "Mostra l'intero albero della cartella corrente con la sua struttura ad albero (cartelle e file annidati). Comodo per avere una visione d'insieme.",
          ex: ["tree"] },
      ],
    },
    {
      cat: "Creare e gestire file e cartelle",
      intro: "Creare, copiare, spostare ed eliminare. Servono i permessi di scrittura sulla cartella.",
      items: [
        { name: "mkdir", syntax: "mkdir nome",
          desc: "<i>Make Directory</i>: crea una nuova cartella vuota nella posizione indicata.",
          ex: ["mkdir progetti", "mkdir documenti/esami"] },
        { name: "touch", syntax: "touch nome",
          desc: "Crea un file vuoto. Se il file esiste già, ne aggiorna soltanto la data di modifica.",
          ex: ["touch appunti.txt", "touch progetti/main.py"] },
        { name: "cp", syntax: "cp sorgente destinazione",
          desc: "<i>Copy</i>: copia un file. La destinazione può essere un nuovo nome oppure una cartella esistente (in cui copiarlo).",
          ex: ['echo "testo" > a.txt', "cp a.txt b.txt", "cp a.txt documenti"] },
        { name: "mv", syntax: "mv sorgente destinazione",
          desc: "<i>Move</i>: sposta un file in un'altra cartella oppure lo <b>rinomina</b> (se la destinazione è un nuovo nome). A differenza di cp, l'originale non resta.",
          ex: ["touch vecchio.txt", "mv vecchio.txt nuovo.txt", "mv nuovo.txt documenti"] },
        { name: "rm", syntax: "rm [-r] nome",
          desc: "<i>Remove</i>: elimina un file. Per cancellare una <b>cartella</b> (con tutto il contenuto) serve l'opzione <code>-r</code> (ricorsivo). Attenzione: non c'è cestino, l'eliminazione è definitiva.",
          opts: [["-r", "ricorsivo: necessario per eliminare una cartella e ciò che contiene"]],
          ex: ["touch usa-e-getta.txt", "rm usa-e-getta.txt", "mkdir temp", "rm -r temp"] },
      ],
    },
    {
      cat: "Scrivere e redirezione dell'output",
      intro: "Come mandare l'output di un comando dentro un file o dentro un altro comando.",
      items: [
        { name: "echo", syntax: 'echo "testo"',
          desc: "Stampa a video la stringa che gli passi. Da solo serve a poco, ma combinato con la redirezione (<code>&gt;</code>) diventa il modo più rapido per scrivere in un file.",
          opts: [["-n", "non andare a capo alla fine"]],
          ex: ['echo "Ciao mondo"', 'echo "Prima riga" > note.txt'] },
        { name: "> (redirezione, sovrascrive)", syntax: "comando > file",
          desc: "Invia l'output di un comando dentro un file. <b>Attenzione:</b> se il file esiste già, il suo contenuto viene <b>cancellato e sostituito</b>.",
          ex: ['echo "nuovo contenuto" > saluti.txt', "ls -l > elenco.txt"] },
        { name: ">> (redirezione, aggiunge)", syntax: "comando >> file",
          desc: "Come <code>&gt;</code>, ma <b>aggiunge</b> l'output in fondo al file senza cancellare ciò che c'era già (modalità <i>append</i>).",
          ex: ['echo "prima" > diario.txt', 'echo "seconda" >> diario.txt', "cat diario.txt"] },
        { name: "cat > file (multilinea)", syntax: "cat > file",
          desc: "Scrive nel file più righe a mano: dopo l'invio, ogni riga che digiti finisce nel file. Premi <b>Ctrl+D</b> per terminare e salvare. Con <code>cat &gt;&gt; file</code> aggiungi invece di sovrascrivere.",
          ex: ["cat > appunti.txt"] },
        { name: "| (pipe)", syntax: "comando1 | comando2",
          desc: "La <i>pipe</i> collega due comandi: l'output del primo diventa l'input del secondo. Tipico con grep per filtrare i risultati.",
          ex: ["ls -l | grep txt", "cat documenti/numeri.txt | grep [0-9]"] },
      ],
    },
    {
      cat: "Leggere e cercare nei file",
      intro: "Visualizzare il contenuto e trovare ciò che ti serve.",
      items: [
        { name: "cat", syntax: "cat file",
          desc: "<i>conCATenate</i>: stampa l'intero contenuto di uno o più file. Per file lunghi conviene head/tail.",
          ex: ["cat benvenuto.txt", "cat documenti/note.txt"] },
        { name: "head", syntax: "head [-n N] file",
          desc: "Mostra solo le <b>prime</b> righe di un file (10 di default).",
          opts: [["-n N", "mostra le prime N righe"]],
          ex: ["head documenti/note.txt", "head -n 2 documenti/note.txt"] },
        { name: "tail", syntax: "tail [-n N] file",
          desc: "Mostra solo le <b>ultime</b> righe di un file (10 di default).",
          opts: [["-n N", "mostra le ultime N righe"]],
          ex: ["tail documenti/note.txt", "tail -n 3 documenti/note.txt"] },
        { name: "grep", syntax: "grep [opzioni] PATTERN file",
          desc: "Cerca e stampa le righe che contengono il <i>pattern</i>. Il pattern può essere una semplice parola o un'<b>espressione regolare</b> (vedi sotto).",
          opts: [["-i", "ignora maiuscole/minuscole"], ["-n", "mostra il numero di riga"], ["-v", "inverte: mostra le righe che NON corrispondono"]],
          ex: ["grep root documenti/note.txt", "grep -n riga documenti/note.txt", "grep -v [0-9] documenti/numeri.txt"] },
        { name: "concetto: espressioni regolari (regex)", concept: true, syntax: "metacaratteri",
          desc: "Le regex descrivono <i>schemi</i> di testo. I principali: " +
            "<code>^root</code> = inizia con «root»; <code>r$</code> = finisce con «r»; " +
            "<code>.</code> = un carattere qualsiasi; <code>[0-9]</code> = una cifra; " +
            "<code>[^0-9]</code> = un carattere che NON è una cifra; <code>re*d</code> = «r», zero o più «e», poi «d» (red, reed, rd).",
          ex: ["grep ^riga documenti/note.txt", "grep [0-9] documenti/numeri.txt", "grep [^0-9] documenti/numeri.txt"] },
      ],
    },
    {
      cat: "Editor di testo: vi",
      intro: "L'editor classico di Unix. Funziona a modalità: capire in quale sei è la chiave.",
      items: [
        { name: "vi", syntax: "vi file",
          desc: "Apre il file nell'editor (lo crea se non esiste). vi ha tre modalità: " +
            "<b>Comando</b> (di default): ci si sposta e si modifica con tasti singoli. " +
            "<b>Inserimento</b>: si scrive liberamente, ci si entra con <code>i</code> e si esce con <code>Esc</code>. " +
            "<b>Ex/ultima riga</b>: dalla modalità comando premi <code>:</code> per salvare/uscire.",
          opts: [
            ["i / a / o", "entra in inserimento (i: prima del cursore, a: dopo, o: nuova riga sotto)"],
            ["Esc", "torna alla modalità comando"],
            ["h j k l", "sposta il cursore (sinistra, giù, su, destra) — anche con le frecce"],
            ["x", "cancella il carattere sotto il cursore"],
            ["dd", "cancella (taglia) l'intera riga"],
            ["yy / p", "copia la riga / incolla dopo il cursore"],
            ["cw", "cambia la parola (change word)"],
            [":w", "salva"], [":q", "esci"], [":wq", "salva ed esci"], [":q!", "esci senza salvare"],
          ],
          ex: ["vi appunti.txt", "vi documenti/note.txt"] },
      ],
    },
    {
      cat: "Permessi: r, w, x",
      intro: "I permessi decidono chi può leggere, scrivere ed eseguire ogni file o cartella: è così che Linux protegge i dati di ogni utente.",
      items: [
        { name: "concetto: leggere i permessi (ls -l)", concept: true, syntax: "i 10 caratteri di ls -l",
          desc: "Con <code>ls -l</code> ogni riga inizia con <b>10 caratteri</b>, per esempio <code>-rwxr-x---</code>. " +
            "Il <b>1°</b> dice il tipo: <code>-</code> è un file, <code>d</code> una cartella. " +
            "Gli altri <b>9</b> sono <b>tre gruppi da tre</b>: i primi 3 sono i permessi del <b>proprietario</b>, " +
            "i tre centrali del <b>gruppo</b>, gli ultimi 3 di <b>tutti gli altri</b>. " +
            "In ogni terzina l'ordine è sempre <b>r&nbsp;w&nbsp;x</b> (lettura, scrittura, esecuzione); un trattino <code>-</code> vuol dire che quel permesso manca. " +
            "Quindi <code>-rwxr-x---</code> = il proprietario può fare tutto, il gruppo può leggere ed eseguire ma non modificare, gli altri non possono nulla.",
          ex: ["ls -l benvenuto.txt", "ls -l documenti"] },

        { name: "concetto: cosa significano r, w, x", concept: true, syntax: "file vs cartella",
          desc: "Su un <b>file</b>: <b>r</b> = leggerne il contenuto (con <code>cat</code>), <b>w</b> = modificarlo o sovrascriverlo, <b>x</b> = eseguirlo (se è un programma o uno script). " +
            "Su una <b>cartella</b> cambiano significato: <b>r</b> = vedere l'elenco dei file (<code>ls</code>), <b>w</b> = creare, rinominare o cancellare file al suo interno, <b>x</b> = attraversarla, cioè entrarci con <code>cd</code> e raggiungere i file che contiene. " +
            "Spesso servono insieme: per usare davvero una cartella di solito ti serve <code>r</code> + <code>x</code>.",
          ex: ["ls -l documenti", "cd documenti"] },

        { name: "concetto: la notazione ottale (i numeri)", concept: true, syntax: "r=4 · w=2 · x=1",
          desc: "Ogni permesso vale un numero: <b>r&nbsp;=&nbsp;4</b>, <b>w&nbsp;=&nbsp;2</b>, <b>x&nbsp;=&nbsp;1</b>. " +
            "Per ogni categoria <b>sommi</b> i numeri dei permessi che vuoi dare: " +
            "<code>7</code> = 4+2+1 = rwx, <code>6</code> = 4+2 = rw-, <code>5</code> = 4+1 = r-x, <code>4</code> = r--, <code>0</code> = nessuno. " +
            "Usi <b>tre cifre</b>, una per proprietario, gruppo e altri: " +
            "<code>755</code> = rwx&nbsp;r-x&nbsp;r-x (tipico di programmi e cartelle), " +
            "<code>644</code> = rw-&nbsp;r--&nbsp;r-- (tipico dei file normali), " +
            "<code>600</code> = rw-&nbsp;---&nbsp;--- (solo il proprietario).",
          ex: ["chmod 644 documenti/note.txt", "ls -l documenti/note.txt"] },

        { name: "chmod", syntax: "chmod MODO file",
          desc: "<i>Change Mode</i>: cambia i permessi di un file o cartella. Hai due modi. " +
            "<b>Simbolico</b> — scegli <b>chi</b> (<code>u</code> proprietario, <code>g</code> gruppo, <code>o</code> altri, <code>a</code> tutti), l'<b>operazione</b> (<code>+</code> aggiunge, <code>-</code> toglie, <code>=</code> imposta esatto) e i <b>permessi</b> (r/w/x). " +
            "Es.: <code>u+x</code> dà l'esecuzione al proprietario, <code>go-w</code> toglie la scrittura a gruppo e altri, <code>a=r</code> mette solo lettura a tutti. " +
            "<b>Ottale</b> — le tre cifre viste sopra, es. <code>chmod 755 script.sh</code>.",
          opts: [["u / g / o / a", "proprietario · gruppo · altri · tutti"], ["+   -   =", "aggiungi · togli · imposta esatto"], ["r=4 w=2 x=1", "i valori da sommare nella notazione ottale"], ["755 · 644 · 600", "esempi pronti: programmi · file · privati"]],
          ex: ["touch script.sh", "ls -l script.sh", "chmod u+x script.sh", "chmod go-w script.sh", "chmod 600 script.sh", "ls -l script.sh"] },

        { name: "chown", syntax: "chown utente[:gruppo] file",
          desc: "<i>Change Owner</i>: cambia il <b>proprietario</b> di un file (e, aggiungendo <code>:gruppo</code>, anche il gruppo). Serve quando un file deve passare a un altro utente. " +
            "È un'operazione potente, riservata a <b>root</b>: usala con <code>sudo</code>. " +
            "Es.: <code>sudo chown studente file.txt</code> rende «studente» il proprietario; <code>sudo chown studente:studente file.txt</code> cambia proprietario <b>e</b> gruppo.",
          opts: [["utente", "nuovo proprietario"], ["utente:gruppo", "cambia anche il gruppo"]],
          ex: ["ls -l benvenuto.txt", "sudo chown root benvenuto.txt", "ls -l benvenuto.txt"] },
      ],
    },
    {
      cat: "Utenti, gruppi e privilegi",
      intro: "Diventare root, creare utenti e gestire i gruppi. Molte di queste operazioni richiedono i privilegi di amministratore.",
      items: [
        { name: "whoami", syntax: "whoami",
          desc: "Stampa il nome dell'utente con cui stai operando in questo momento.",
          ex: ["whoami"] },
        { name: "id", syntax: "id",
          desc: "Mostra UID (numero dell'utente), GID (gruppo principale) e tutti i gruppi di appartenenza.",
          ex: ["id"] },
        { name: "su", syntax: "su - [utente]",
          desc: "<i>Switch User</i>: apre una nuova shell come un altro utente (root se non specificato). Il trattino <code>-</code> simula un login completo. Si esce con <code>exit</code>.",
          ex: ["su -", "whoami", "exit"] },
        { name: "sudo", syntax: "sudo comando",
          desc: "Esegue <b>un singolo comando</b> con i privilegi di root, senza diventare root in modo permanente. Funziona solo se l'utente è abilitato (gruppo sudo).",
          ex: ["sudo useradd -m luca", "sudo cat /etc/passwd"] },
        { name: "useradd", syntax: "useradd -m -s /bin/bash nome",
          desc: "Crea un nuovo utente (serve root). Con <code>-m</code> ne crea anche la home; con <code>-s</code> imposti la shell.",
          opts: [["-m", "crea la cartella home"], ["-s shell", "imposta la shell di login"]],
          ex: ["sudo useradd -m -s /bin/bash mario", "cat /etc/passwd"] },
        { name: "passwd", syntax: "passwd [utente]",
          desc: "Imposta o cambia la password di un utente. Un utente può cambiare la propria; per cambiare quella di altri serve root.",
          ex: ["sudo passwd mario"] },
        { name: "userdel", syntax: "userdel -r nome",
          desc: "Elimina un utente (serve root). Con <code>-r</code> rimuove anche la sua home.",
          opts: [["-r", "elimina anche la home dell'utente"]],
          ex: ["sudo userdel -r mario"] },
        { name: "groupadd", syntax: "groupadd nome",
          desc: "Crea un nuovo gruppo (serve root).",
          ex: ["sudo groupadd progetto"] },
        { name: "groupdel", syntax: "groupdel nome",
          desc: "Elimina un gruppo esistente (serve root).",
          ex: ["sudo groupdel progetto"] },
        { name: "usermod", syntax: "usermod -aG gruppo utente",
          desc: "Modifica un utente. L'uso più comune è <code>-aG</code> per <b>aggiungere</b> l'utente a un gruppo (la <code>a</code> è importante: senza, sostituisce tutti i gruppi).",
          opts: [["-aG gruppo", "aggiunge l'utente al gruppo indicato"]],
          ex: ["sudo groupadd progetto", "sudo usermod -aG progetto studente", "groups studente"] },
        { name: "groups", syntax: "groups [utente]",
          desc: "Elenca i gruppi a cui appartiene un utente (te stesso se non specifichi il nome).",
          ex: ["groups", "groups studente"] },
      ],
    },
    {
      cat: "Sistema",
      intro: "Comandi di servizio.",
      items: [
        { name: "help", syntax: "help",
          desc: "Mostra un riepilogo rapido dei comandi disponibili direttamente nel terminale.",
          ex: ["help"] },
        { name: "clear", syntax: "clear",
          desc: "Pulisce lo schermo del terminale (anche con Ctrl+L). Non cancella nulla dal filesystem.",
          ex: ["clear"] },
        { name: "date", syntax: "date",
          desc: "Mostra data e ora correnti.",
          ex: ["date"] },
        { name: "hostname", syntax: "hostname",
          desc: "Stampa il nome della macchina (qui: lab).",
          ex: ["hostname"] },
        { name: "shutdown", syntax: "shutdown",
          desc: "Spegne il sistema simulato. Per riavviarlo usa il pulsante <b>reset</b> in alto a destra nel terminale.",
          ex: ["shutdown"] },
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

  /* ---------- "Inserisci" → scrive il comando nel terminale ---------- */
  guideEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".g-try");
    if (!btn) return;
    e.preventDefault();
    if (window.VT && typeof window.VT.type === "function") window.VT.type(btn.dataset.cmd);
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
