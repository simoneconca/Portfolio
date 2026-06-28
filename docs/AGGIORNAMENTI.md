# Lab — stato del progetto e registro aggiornamenti

> File di passaggio di consegne: serve a ritrovare in fretta **come sono fatti i lab**,
> **cosa è stato fatto di recente** e **quali convenzioni seguire** quando si continua il
> lavoro (anche da un'altra macchina/sessione). Aggiornare questo file quando si aggiunge
> o si modifica un lab in modo rilevante.

Tutto il sito è **statico** (HTML/CSS/JS vanilla, zero dipendenze, zero backend), in
**italiano**, tono **didattico**, pensato per studenti di scuola superiore. Hosting su
**GitHub Pages**. I lab vivono in `lab/<nome>/`.

---

## Convenzioni dei lab (da rispettare)

- **Struttura cartella:** `lab/<nome>/index.html` + `<nome>.js` + `<nome>.css`.
  Ogni lab usa un **prefisso CSS** proprio (es. `.sn-`, `.gv-`, `.fc-`, `.rl-`, `.pe-`, `.ga-`).
- **Asset condivisi:** ogni `index.html` carica `../../css/base.css`, `../../css/lab.css`,
  e in fondo `../../js/core.js` (tema, menu mobile, anno footer) + lo script del lab.
  Le primitive (`.panel`, `.seg`/`.seg-btn`, `.ghost-btn`, `.field`, `.control-label`,
  `.tool-hero`, `.breadcrumb`) stanno in `css/lab.css`; i token (colori, font, `--ease`,
  dark mode) in `css/base.css`.
- **Niente dipendenze / niente rete:** tutto gira nel browser, nessuna chiamata esterna,
  nessuna API/chiave. Le IA dei lab AI sono modellini locali, non veri LLM.
- **Aggiungere un lab:** creare la card nella **categoria giusta** in `lab/index.html`
  (vedi sotto) e, se è una sezione nuova, aggiungere il chip in `index.html` (home,
  lista `.lab-promo-chips`). La numerazione categorie (`lab-cat-num`) va tenuta in ordine.
- **Icone dei pulsanti di controllo — set UNICO in tutti i lab** (icona prima del testo):
  - `▶` esegui / auto / azioni primarie (Traduci, Accedi, Disegna…)
  - `▸` passo / avanza / step
  - `⏸` pausa · `↺` reset / riavvia / ripristina · `✕` svuota / pulisci · `✦` esempio / carica esempio
- **Accordion "guida":** pattern riusato (git, terminale, prompt, generativa, rete):
  `<details class="guide-cmd"><summary><span class="g-name">…</span><span class="g-syntax">…</span></summary><div class="g-body"><p class="g-desc">…</p></div></details>`
  con eventuale ricerca su `data-search`.
- **Verifica:** provare nel browser (preview locale) e controllare **niente overflow a 375px**.
  Attenzione alla **cache**: in locale serve hard refresh (Ctrl+F5); JS/CSS hanno la stessa
  URL, quindi il `?v=` sulla pagina non basta a bustarli.
- **Commit:** messaggi in italiano, footer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
  Su Windows: i messaggi multilinea via heredoc PowerShell falliscono → usare più `-m`
  o `git commit -F <file>`.

---

## Catalogo dei lab (per sezione di `lab/index.html`)

**01 · Introduzione all'informatica**
- `vonneumann/` — Macchina di von Neumann (+ codifica testo/immagini/suoni)
- `binario/` — Binary & Base Analyzer (basi, complemento a due)
- `hardware/` — PC Assembly Lab (configuratore + **guida al montaggio**)
- `logica/` — Logica booleana & circuiti

**02 · Sistemi e reti**
- `terminale/` — Virtual Terminal (shell Linux simulata + guida comandi)
- `so/` — Sistemi Operativi (scheduling + **Gestione della memoria**: rilocazione, paginazione, memoria virtuale)
- `rete/` — TCP/IP Packet Voyager (incapsulamento + **livello fisico** + approfondimento)
- `subnet/` — Subnetting & IP Calculator (+ divisione in sottoreti)
- `git/` — Git Visual Sandbox (+ guida comandi)
- `rete-lab/` — «Costruisci la tua rete» (mini Packet Tracer)

**03 · Programmazione e dati**
- `cpu/` — CPU & Assembly Visualizer (esecuzione assembly passo-passo)
- `sort/` — Algoritmi di ordinamento
- `strutture/` — Strutture dati (pila, coda, BST)
- `flowchart/` — **Diagrammi di flusso (stile Flowgorithm)** — *ha sostituito il vecchio `cicli/`*
- `sql/` — Live SQL Sandbox
- `er/` — Modello E-R
- `linguaggio/` — Quale linguaggio? (quiz)

**04 · Sviluppo Web**
- `layout/` — Box Model, Flexbox & Grid
- `editor/` — Editor HTML/CSS dal vivo

**05 · Sicurezza & Hacking**
- `crittografia/` · `sqli/` · `cookie/` · `password/`

**06 · Intelligenza Artificiale**
- `prompt/` — Prompt Engineering
- `generativa/` — Come funziona l'IA generativa

---

## Registro aggiornamenti — sessione corrente

### Nuovi lab
- **Diagrammi di flusso** (`flowchart/`), in stile **Flowgorithm**. Tre parti:
  - *motore di disegno SVG* con le forme esatte (terminatore, rettangolo, parallelogramma,
    rombo per Se/Mentre, esagono per il Per, do-while post-test) e il routing delle frecce
    come Flowgorithm (If: falso a sinistra / vero a destra che si ricongiungono; While/For:
    vero/ripeti a destra nel corpo, back-edge dal fondo, falso/termina a sinistra; do-while:
    corpo prima, rombo in fondo, back-edge a sinistra);
  - *«Impara i blocchi»*: spiegazione **animata** di ogni blocco (Dichiarazione con la **RAM
    come tabella**, Assegnazione, Leggi, Scrivi, Selezione vero/falso, Cicli while/do-while/per);
  - *editor* con inserimento via **«+»** sulle linee (come Flowgorithm) + dialog, e
    *interprete* passo-passo (variabili, output, input, temperatura no — è codice;
    valutatore di espressioni; rigoroso sulle **dichiarazioni** come Flowgorithm; modificabile
    anche dopo l'esecuzione).
  - **Rimosso** il vecchio lab `cicli/` (assorbito qui).
- **Editor HTML/CSS dal vivo** (`editor/`).
- **Forza della password** (`password/`).
- **Quale linguaggio?** (`linguaggio/`) — quiz, 13 linguaggi, 6 domande.
- **Sezione «Intelligenza Artificiale»** (categoria 06 + chip nella home) con:
  - **Prompt Engineering** (`prompt/`): costruttore di prompt a componenti con barra di
    completezza, **analizzatore euristico pesato** (compito/specificità/formato/contesto/
    vincoli essenziali; ruolo/esempi bonus; regex per radici a prefisso così «bambino/
    bambini» contano), galleria «debole → forte», accordion delle tecniche.
  - **Come funziona l'IA generativa** (`generativa/`): modellino a **n-grammi** su testo
    originale incluso → tokenizzazione (testo→token→numeri), **predizione della parola
    successiva** con probabilità a barre, **temperatura** (sharpening/flattening), generazione
    passo-passo, accordion («prevede non capisce», allucinazioni, differenza con un vero LLM).

### Lab esistenti — modifiche
- **Sistemi Operativi** (`so/`): sezione memoria rinominata **«Gestione della memoria»**;
  nuova vista **Paginazione** con processi in **frame non contigui**, riquadro visivo dello
  *spezzettamento* (pagina logica → pagina fisica) e formula della lezione
  (`fisico = logico − base logica + base fisica`).
- **TCP/IP Voyager** (`rete/`): **livello fisico** ora distinto (lo step di transito è L1, con
  i **bit ASCII** che scorrono sul cavo); nuova sezione **approfondimento** (accordion) su
  tutti i livelli e protocolli; dossier del livello fisico compattato (i controlli restano
  visibili).
- **Packet Tracer** (`rete-lab/`): la configurazione del dispositivo si apre in un **popup**
  al click (prima era un div fisso sotto la tela); **etichette di interfaccia** sui cavi +
  elenco «porta → dispositivo» nelle config (router/switch/AP/server); fix overflow dell'IP
  del server DHCP.
- **Subnet** (`subnet/`): la funzione **«dividi in sottoreti»** ora rispetta la scelta del
  menu (prima si resettava); fix input IP tagliati e binario/maschera che sforavano.
- **von Neumann** (`vonneumann/`): slider **RGB** uniformi (stile custom indipendente da
  tema/browser; prima il verde appariva nero su tema scuro); **campioni suono** da 6 (min).
- **E/R** (`er/`): fix **cardinalità** che non cambiava e **collegamenti** non eliminabili
  (un layer copriva i click → `pointer-events` corretti + area di click larga sui cavi).
- **Quale linguaggio** (`linguaggio/`): fix ultima risposta che mostrava `undefined`
  (array `KEYS` esteso oltre la «G»).
- **Git** (`git/`): aggiunta la **guida ai comandi** (accordion, come nel terminale);
  i comandi suggeriti sono ora una **sequenza numerata** (così «git merge feature» non dà
  errore se cliccato fuori ordine).
- **PC Assembly** (`hardware/`): nuova modalità **«Monta il PC»** (guida al montaggio fisico
  in 12 passi, **personalizzata** sui pezzi scelti); le opzioni **incompatibili non vengono
  più marchiate in anticipo** — restano visibili e il motivo si scopre **solo scegliendole**
  (si impara provando), con «Avanti» bloccato finché la scelta non è valida.
- **Trasversale:** **icone dei pulsanti** uniformate in tutti i lab; vari fix
  responsive/overflow e del menu burger su mobile.

---

## Idee per i prossimi lab (sezione AI e non solo)

Tutte fattibili **client-side**, senza backend:
- **Il neurone artificiale (perceptron)** — punti di 2 classi, retta di separazione che si allena.
- **Riconoscimento di cifre disegnate** — disegni un numero, un modellino indovina (effetto-wow).
- **k-NN**, **K-means**, **Albero di decisione**, **Regressione lineare**, **Naive Bayes (anti-spam)**.
- **A\* (pathfinding)**, **Algoritmo genetico**, **Q-learning (rinforzo)**, **Convoluzione / edge detection**.
- Non-AI: **Ricorsione e stack delle chiamate**, **Codifica dell'informazione** (testo/immagini/suoni con calcolo dimensioni).
