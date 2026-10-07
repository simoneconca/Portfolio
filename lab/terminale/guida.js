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
        { name: "cp", syntax: "cp [-r] sorgente destinazione",
          desc: "<i>Copy</i>: copia un file. La destinazione può essere un nuovo nome oppure una cartella esistente (in cui copiarlo). Per copiare un'intera <b>cartella</b> con tutto il suo contenuto serve l'opzione <code>-r</code> (ricorsivo).",
          opts: [["-r", "ricorsivo: copia una cartella e tutto ciò che contiene"]],
          ex: ['echo "testo" > a.txt', "cp a.txt b.txt", "cp a.txt documenti", "cp -r documenti copia_documenti"] },
        { name: "mv", syntax: "mv sorgente destinazione",
          desc: "<i>Move</i>: sposta un file in un'altra cartella oppure lo <b>rinomina</b> (se la destinazione è un nuovo nome). A differenza di cp, l'originale non resta.",
          ex: ["touch vecchio.txt", "mv vecchio.txt nuovo.txt", "mv nuovo.txt documenti"] },
        { name: "rm", syntax: "rm [-r] [-f] nome",
          desc: "<i>Remove</i>: elimina un file. Per cancellare una <b>cartella</b> (con tutto il contenuto) serve l'opzione <code>-r</code> (ricorsivo); <code>-f</code> (force) non chiede conferma. Attenzione: non c'è cestino, l'eliminazione è definitiva.",
          opts: [["-r", "ricorsivo: necessario per eliminare una cartella e ciò che contiene"], ["-f", "force: non chiede conferma e non segnala errori"]],
          ex: ["touch usa-e-getta.txt", "rm usa-e-getta.txt", "mkdir temp", "rm -r temp"] },
        { name: "rmdir", syntax: "rmdir nome",
          desc: "<i>Remove Directory</i>: elimina una cartella, ma <b>solo se è vuota</b>. Se contiene file o sottocartelle, ti avvisa e non la tocca: è più sicuro di <code>rm -r</code> proprio perché non cancella nulla di nascosto.",
          ex: ["mkdir vuota", "rmdir vuota", "mkdir piena", "touch piena/f.txt", "rmdir piena"] },
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
        { name: "< (redirezione dell'input)", syntax: "comando < file",
          desc: "Fa leggere a un comando i dati <b>da un file</b> invece che dalla tastiera. È il contrario di <code>&gt;</code>: mentre <code>&gt;</code> manda l'output <i>verso</i> un file, <code>&lt;</code> prende l'input <i>da</i> un file. Tipico con la calcolatrice <code>bc</code>.",
          ex: ['echo "3 + 4" > conti.txt', "bc < conti.txt"] },
        { name: "2> (redirezione degli errori)", syntax: "comando 2> file",
          desc: "I comandi hanno <b>due</b> uscite separate: l'output normale (<i>standard output</i>) e i messaggi d'errore (<i>standard error</i>). Con <code>2&gt;</code> mandi <b>solo gli errori</b> in un file, lasciando pulito lo schermo. Con <code>&gt;&amp;</code> (oppure <code>&amp;&gt;</code>) mandi invece <b>sia l'output sia gli errori</b> nello stesso file.",
          opts: [["2> file", "scrive solo i messaggi d'errore nel file"], [">& file", "scrive output + errori nel file"]],
          ex: ["rm inesistente 2> errori.txt", "cat errori.txt", "ls documenti inesistente >& tutto.txt"] },
        { name: "| (pipe)", syntax: "comando1 | comando2",
          desc: "La <i>pipe</i> collega due comandi: l'output del primo diventa l'input del secondo, senza creare file intermedi. Si possono concatenare più comandi in fila. Tipico con grep per filtrare i risultati.",
          ex: ["ls -l | grep txt", "cat documenti/numeri.txt | grep [0-9]", "ls / | sort | head -n 3"] },
        { name: "tee", syntax: "comando | tee [-a] file",
          desc: "La <i>pipe</i> manda l'output a un solo posto. <code>tee</code> fa una <b>giunzione a T</b>: salva il flusso in un file <b>e</b> contemporaneamente lo lascia proseguire a schermo (o al comando dopo). Con <code>-a</code> aggiunge in coda invece di sovrascrivere.",
          opts: [["-a", "aggiunge in coda al file invece di sovrascriverlo"]],
          ex: ["ls / | tee elenco.txt", "cat elenco.txt", "ls documenti | tee -a elenco.txt"] },
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
          desc: "<i>Get Regular Expression Program</i>: cerca e stampa le righe che contengono il <i>pattern</i>. Il pattern può essere una semplice parola o un'<b>espressione regolare</b> (vedi sotto). Realizza di fatto l'operazione di <b>selezione</b> delle righe, come il filtro di un database.",
          opts: [["-i", "ignora maiuscole/minuscole"], ["-n", "mostra il numero di riga"], ["-v", "inverte: mostra le righe che NON corrispondono"], ["-c", "conta soltanto quante righe corrispondono"]],
          ex: ["grep root documenti/note.txt", "grep -n riga documenti/note.txt", "grep -v [0-9] documenti/numeri.txt", "grep -c a documenti/nomi.txt"] },
        { name: "find", syntax: "find [percorso] -name NOME",
          desc: "Cerca file e cartelle <b>nell'albero</b> a partire da un punto: scende in tutte le sottocartelle. Con <code>-name</code> indichi il nome da cercare (puoi usare i caratteri jolly, ma vanno messi <b>tra apici</b> perché non li espanda prima la shell). Il punto <code>.</code> indica «parti da qui».",
          opts: [["-name NOME", "cerca per nome (apici se usi * o ?)"], ["-type f / -type d", "solo file / solo directory"]],
          ex: ["find .", "find . -name note.txt", "find documenti -name '*.txt'", "find . -type d"] },
        { name: "concetto: espressioni regolari (regex)", concept: true, syntax: "metacaratteri",
          desc: "Le regex descrivono <i>schemi</i> di testo. I principali: " +
            "<code>^root</code> = inizia con «root»; <code>r$</code> = finisce con «r»; " +
            "<code>.</code> = un carattere qualsiasi; <code>[0-9]</code> = una cifra; " +
            "<code>[^0-9]</code> = un carattere che NON è una cifra; <code>re*d</code> = «r», zero o più «e», poi «d» (red, reed, rd).",
          ex: ["grep ^riga documenti/note.txt", "grep [0-9] documenti/numeri.txt", "grep [^0-9] documenti/numeri.txt"] },
      ],
    },
    {
      cat: "Caratteri jolly ed espansioni",
      intro: "Prima di eseguire un comando, la shell «espande» alcuni simboli speciali: è lei a trasformarli in nomi di file veri. Capire questo passaggio evita tanti errori.",
      items: [
        { name: "concetto: * e ? (caratteri jolly)", concept: true, syntax: "glob",
          desc: "Servono a indicare <b>più file con un solo schema</b>. <code>*</code> sta per «una sequenza qualsiasi di caratteri» (anche nessuno), <code>?</code> sta per «un solo carattere qualsiasi». " +
            "La shell cerca tra i file <b>esistenti</b> quelli che corrispondono e li passa al comando. " +
            "Es.: <code>*.txt</code> = tutti i file che finiscono in .txt; <code>nota?.txt</code> = nota1.txt, notaA.txt… ma non nota10.txt (un solo carattere).",
          ex: ["ls documenti/*.txt", "ls documenti/n*", "ls /?in"] },
        { name: "concetto: [ ] (parentesi quadre)", concept: true, syntax: "classi di caratteri",
          desc: "Le parentesi quadre corrispondono a <b>un singolo carattere scelto tra quelli elencati</b>. " +
            "<code>[abc]</code> = a, b oppure c; <code>[a-f]</code> = un intervallo; <code>[0-9]</code> = una cifra; <code>[!...]</code> (o <code>[^...]</code>) = un carattere che NON è tra quelli indicati. " +
            "A differenza delle graffe, le quadre <b>cercano tra i file che esistono già</b>.",
          ex: ["touch documenti/f1.txt documenti/f2.txt documenti/fx.txt", "ls documenti/f[12].txt", "ls documenti/f[!0-9].txt"] },
        { name: "concetto: { } (espansione delle graffe)", concept: true, syntax: "{a,b}  {1..5}",
          desc: "Le graffe <b>generano nuove stringhe</b> (non cercano file esistenti): perciò sono perfette per <b>creare</b> più file o cartelle in un colpo solo. " +
            "<code>{a,b,c}</code> genera le tre varianti; <code>{1..5}</code> genera un intervallo 1 2 3 4 5; funziona anche con le lettere, <code>{a..e}</code>. " +
            "Differenza chiave: le <b>graffe</b> creano testo nuovo (touch, mkdir), le <b>quadre</b> filtrano file già presenti (ls, rm).",
          ex: ["touch file{1..4}.txt", "ls", "mkdir trimestre{1,2,3}", "ls", "mkdir cartella_{a..c}"] },
      ],
    },
    {
      cat: "Elaborazione del testo",
      intro: "Un piccolo arsenale di comandi che, combinati con le pipe, permettono di ordinare, contare, tagliare e confrontare il contenuto dei file.",
      items: [
        { name: "sort", syntax: "sort [-n -r -u] [-k N] file",
          desc: "Ordina le righe di un file. Di default ordina <b>alfabeticamente</b>; con <code>-n</code> ordina per <b>valore numerico</b> (altrimenti «10» verrebbe prima di «2»). Con <code>-k N</code> ordina in base all'<b>N-esimo campo</b> (le colonne separate da spazi/tab).",
          opts: [["-n", "ordinamento numerico"], ["-r", "ordine inverso (decrescente)"], ["-u", "elimina i duplicati (unique)"], ["-k N", "ordina per l'N-esimo campo"]],
          ex: ["sort documenti/nomi.txt", "sort -u documenti/nomi.txt", "sort -n documenti/numeri.txt", "sort -k2 -n documenti/arch1.txt"] },
        { name: "wc", syntax: "wc [-l -w -c] file",
          desc: "<i>Word Count</i>: conta <b>righe, parole e caratteri</b> di un file. Senza opzioni li mostra tutti e tre; con le opzioni scegli cosa contare.",
          opts: [["-l", "solo il numero di righe (lines)"], ["-w", "solo il numero di parole (words)"], ["-c", "solo il numero di caratteri (chars)"]],
          ex: ["wc documenti/note.txt", "wc -l documenti/note.txt", "wc -w documenti/nomi.txt"] },
        { name: "cut", syntax: "cut -c LISTA | -f LISTA [-d DELIM] file",
          desc: "Estrae <b>colonne</b> dalle righe: una «proiezione», come scegliere alcune colonne di una tabella. Con <code>-c</code> scegli per <b>posizione dei caratteri</b> (es. <code>-c1-3</code>), con <code>-f</code> per <b>campo</b>. I campi sono separati dal tabulatore, oppure dal carattere che indichi con <code>-d</code>.",
          opts: [["-c LISTA", "caratteri: es. -c1-3 oppure -c1,5"], ["-f LISTA", "campi: es. -f1,3"], ["-d DELIM", "cambia il separatore dei campi (default: tab)"]],
          ex: ["cut -f1 documenti/arch1.txt", "cut -c1-4 documenti/note.txt", "date | cut -c1-3"] },
        { name: "diff", syntax: "diff file1 file2",
          desc: "<i>DIFFerence</i>: confronta due file e mostra <b>cosa cambia</b> per rendere il primo uguale al secondo. Le righe del primo file sono precedute da <code>&lt;</code>, quelle del secondo da <code>&gt;</code>; <code>c</code>=cambiata, <code>a</code>=aggiunta, <code>d</code>=cancellata. Se i file sono identici, non stampa nulla.",
          ex: ["diff documenti/originale.txt documenti/modificato.txt"] },
        { name: "more", syntax: "more file",
          desc: "Mostra il contenuto di un file. Su un terminale reale lo fa <b>una schermata per volta</b> (spazio = pagina dopo, invio = riga dopo, q = esci), utile per file lunghi. Qui mostra l'intero contenuto, come <code>cat</code>.",
          ex: ["more documenti/note.txt"] },
      ],
    },
    {
      cat: "Collegamenti: hard link e link simbolici",
      intro: "Un collegamento è un «secondo nome» per un file. Linux ne ha due tipi, molto diversi tra loro.",
      items: [
        { name: "concetto: l'i-number (inode)", concept: true, syntax: "ls -i",
          desc: "Ogni file ha un numero che lo identifica in modo univoco nel filesystem: l'<b>i-number</b> (o inode). Il <b>nome</b> è solo un'etichetta che punta a quell'inode. Puoi vedere gli inode con <code>ls -i</code>: due nomi con lo <b>stesso</b> i-number sono in realtà lo stesso identico file.",
          ex: ["ls -i documenti", "ls -li documenti"] },
        { name: "ln (hard link)", syntax: "ln sorgente nome_link",
          desc: "Crea un <b>hard link</b>: un secondo nome che punta allo <b>stesso inode</b> del file originale. Non è una copia: è lo stesso file con due nomi, quindi modificandone uno cambia anche l'altro. Nel formato lungo (<code>ls -l</code>) il <b>contatore dei link</b> sale a 2. Il file sparisce davvero solo quando elimini l'ultimo nome.",
          ex: ['echo "contenuto" > originale.txt', "ln originale.txt secondo_nome.txt", "ls -li", "cat secondo_nome.txt"] },
        { name: "ln -s (link simbolico)", syntax: "ln -s sorgente nome_link",
          desc: "Crea un <b>link simbolico</b> (symlink): un file speciale che <b>punta al percorso</b> di un altro file o cartella, come i «collegamenti» di Windows. In <code>ls -l</code> appare con una <code>l</code> iniziale e la freccia <code>-&gt;</code>. Se cancelli l'originale, il symlink resta ma «punta nel vuoto» (a differenza dell'hard link).",
          opts: [["-s", "crea un collegamento simbolico invece di uno hard link"]],
          ex: ["ln -s documenti scorciatoia", "ls -l", "cd scorciatoia", "pwd"] },
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

        { name: "umask", syntax: "umask [valore]",
          desc: "Decide i permessi <b>predefiniti</b> dei nuovi file e cartelle. Funziona «al contrario»: indica i permessi da <b>togliere</b>. Si parte da 666 per i file e 777 per le cartelle, e si sottrae la maschera. " +
            "Con la tipica <code>umask 022</code>: i file nascono 644 (rw-r--r--) e le cartelle 755 (rwxr-xr-x). Senza argomenti mostra il valore attuale.",
          opts: [["(nessuno)", "mostra la maschera corrente"], ["022", "toglie la scrittura a gruppo e altri (valore tipico)"]],
          ex: ["umask", "umask 077", "touch privato.txt", "ls -l privato.txt", "umask 022"] },
      ],
    },
    {
      cat: "Processi",
      intro: "Ogni programma in esecuzione è un «processo», identificato da un numero (PID). Questi comandi permettono di vederli e di avviarli in parallelo.",
      items: [
        { name: "ps", syntax: "ps [-e] [-f]",
          desc: "<i>Process Status</i>: elenca i processi in esecuzione. Senza opzioni mostra solo quelli del tuo terminale. Con <code>-e</code> vedi <b>tutti</b> i processi del sistema; con <code>-f</code> ottieni il <b>formato completo</b> (utente, PID, PID del padre PPID, ora di avvio…). Spesso si usano insieme: <code>ps -ef</code>.",
          opts: [["-e", "mostra tutti i processi (every)"], ["-f", "formato completo (full): UID, PID, PPID…"]],
          ex: ["ps", "ps -e", "ps -ef"] },
        { name: "concetto: foreground e background (&)", concept: true, syntax: "comando &",
          desc: "Di norma un comando viene eseguito in <b>primo piano</b> (foreground): la shell aspetta che finisca prima di tornare libera. Aggiungendo <code>&</code> alla fine della riga lo avvii in <b>background</b>: parte in parallelo e riavii subito il prompt, mentre il comando lavora. La shell ti mostra il numero del job e il PID.",
          ex: ["find / -name note.txt &", "ps"] },
      ],
    },
    {
      cat: "Script bash",
      intro: "Un insieme di comandi scritti in un file che possono essere eseguiti tutti insieme: è il primo passo verso l'automazione.",
      items: [
        { name: "concetto: creare ed eseguire uno script", concept: true, syntax: "#!/bin/bash · chmod +x · ./script.sh",
          desc: "Uno script è un file di testo che contiene una sequenza di comandi, uno per riga. " +
            "La prima riga <code>#!/bin/bash</code> (detta <i>shebang</i>) dice al sistema con quale interprete eseguirlo; le righe che iniziano con <code>#</code> sono <b>commenti</b>. " +
            "Per lanciarlo servono due passi: rendilo <b>eseguibile</b> con <code>chmod +x</code>, poi avvialo con <code>./nome.sh</code> (il <code>./</code> significa «qui nella cartella corrente»). In alternativa: <code>bash nome.sh</code>, che non richiede il permesso x.",
          opts: [["#!/bin/bash", "shebang: l'interprete da usare"], ["chmod +x file", "rende lo script eseguibile"], ["./file.sh", "esegue lo script nella cartella corrente"], ["bash file.sh", "esegue lo script senza bisogno di +x"]],
          ex: ['echo "#!/bin/bash" > saluta.sh', 'echo "echo Ciao dallo script!" >> saluta.sh', 'echo "date" >> saluta.sh', "chmod +x saluta.sh", "./saluta.sh"] },
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
      cat: "Scrivania e utilità",
      intro: "Piccoli comandi per prendere confidenza con il terminale: data, calendario, calcolatrice e un po' di divertimento.",
      items: [
        { name: "cal", syntax: "cal [mese] [anno]",
          desc: "Mostra il <b>calendario</b>. Senza argomenti stampa il mese corrente; puoi chiedere un mese e un anno specifici (es. <code>cal 4 2004</code> per aprile 2004), oppure un intero anno.",
          ex: ["cal", "cal 4 2004", "cal 12 2025"] },
        { name: "who / whoami", syntax: "who",
          desc: "<code>who</code> mostra gli utenti attualmente collegati al sistema (con terminale e orario di accesso). <code>whoami</code>, già visto, mostra invece solo il nome dell'utente con cui stai lavorando.",
          ex: ["who", "whoami"] },
        { name: "bc", syntax: "... | bc [-l]", concept: false,
          desc: "<i>Basic Calculator</i>: una calcolatrice. Operatori: <code>+ - * / %</code> e <code>^</code> per l'elevamento a potenza. Qui la usi mandandole i calcoli con una pipe o con <code>&lt;</code>. Attenzione: senza <code>-l</code> le divisioni sono <b>intere</b> (7/2 dà 3); con <code>-l</code> usa i decimali.",
          opts: [["-l", "attiva i decimali (altrimenti divisione intera)"]],
          ex: ['echo "34 + 2" | bc', 'echo "(8 - 3) * 5" | bc', 'echo "7 / 2" | bc', 'echo "7 / 2" | bc -l', 'echo "5 ^ 2" | bc'] },
        { name: "banner", syntax: "banner testo",
          desc: "Scrive una stringa a <b>caratteri grandi</b>. Un classico comando «di scena», utile per intestazioni vistose.",
          ex: ["banner CIAO", "banner LINUX"] },
      ],
    },
    {
      cat: "Aiuto, cronologia e sistema",
      intro: "Come chiedere aiuto al sistema, rivedere i comandi già dati e gestire la sessione.",
      items: [
        { name: "man / info", syntax: "man comando",
          desc: "<i>Manual</i>: apre il <b>manuale</b> di un comando, con sintassi e descrizione. È la prima risorsa da consultare quando non ricordi come funziona qualcosa. <code>info</code> è un'alternativa simile.",
          ex: ["man ls", "man grep", "man chmod"] },
        { name: "help", syntax: "help",
          desc: "Mostra un riepilogo rapido di tutti i comandi disponibili direttamente nel terminale.",
          ex: ["help"] },
        { name: "history", syntax: "history",
          desc: "Mostra l'<b>elenco numerato</b> dei comandi che hai già digitato. Puoi richiamarli al volo: <code>!!</code> riesegue l'ultimo comando, <code>!n</code> riesegue il comando numero n della lista. Con le frecce ↑ e ↓ scorri la cronologia.",
          opts: [["!!", "riesegue l'ultimo comando"], ["!n", "riesegue il comando numero n"]],
          ex: ["history", "pwd", "!!", "ls -l"] },
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
