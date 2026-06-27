# «Costruisci la tua rete» — Specifica di design

Simulatore di rete didattico, stile *Packet Tracer* semplificato, per il portale
`/lab/` di simoneconca.it. Documento di progettazione: **da costruire a milestone**,
qui c'è il piano completo. (Nessun codice ancora.)

---

## 0. Contesto e vincoli (come gli altri lab)
- Sito **statico** (GitHub Pages, simoneconca.it), **zero backend**, niente framework,
  niente build. Tutto in **italiano**, tono didattico per le superiori. Autore: Simone
  Conca (insegnante A041).
- **Design system**: `css/base.css` (token + dark mode), `css/lab.css` (`.panel`, `.seg`,
  `.ghost-btn`, `.field`, `.controls-panel`, `.breadcrumb`, `.tool-hero`), `js/core.js`
  (tema, nav, reveal, `escapeHtml`). Header/footer/breadcrumb come in `lab/cicli/`.
- **Drag su SVG**: riusare i pattern di `lab/er/` (nodi trascinabili, fitCanvas) e
  `lab/git/` (grafo SVG ridisegnato).
- **Responsive**: lezione imparata — niente elementi che sforano; griglie con
  `minmax(0,1fr)` e `min-width:0`; tela scrollabile e pannelli impilati su mobile;
  segmented control a piena larghezza con testo a capo se le etichette sono lunghe.

## 1. Nome, cartella, collocazione
- Nome visibile: **«Costruisci la tua rete»**.
- Cartella: **`lab/rete-lab/`** con `index.html` + JS (diviso, vedi §9) + `rete-lab.css`.
- **Prefisso CSS dedicato: `.rl-`**.
- Categoria nel portale: **Sistemi e reti** (accanto a Subnetting e TCP/IP Voyager).

## 2. Decisioni di portata (confermate con l'utente)
- **Dispositivi**: PC + Switch + Router.
- **Routing**: Statico + **RIP** + **OSPF**.
- **Realismo L2**: mostrare **MAC e ARP** (non solo IP).
- **Modalità**: **scenari pronti + sandbox** libero.
- **Costruzione**: a **milestone M1→M5** (vedi §10).
- Principio guida: *tanta sostanza ma config a un clic e tutto spiegato* →
  **progressive disclosure** (default sensati, avanzato dietro toggle, il pannello
  spiegazione fa il lavoro pesante).

## 3. Modello dati (in memoria, nessuna persistenza in M1–M4)
```
device = { id, type:'pc'|'switch'|'router', name, x, y, ports:[portId...] , extra... }
port   = { id, deviceId, name, mac, ip?, mask?, linkId? }   // ip/mask solo su pc/router
link   = { id, aPortId, bPortId }                            // cavo punto-punto
```
- **PC**: 1 porta; sul device anche `gateway`. `arp = {ip->mac}`.
- **Switch**: N porte senza IP; `macTable = {mac -> portId}` (apprendimento).
- **Router**: N porte con IP+mask; `arp`; `routingTable`; `routingMode:'static'|'rip'|'ospf'`;
  per statico `staticRoutes:[{dest,mask,nextHop}]`.
- **MAC** generati deterministicamente (es. `02:00:00:NN:NN:NN` da un contatore — **niente
  `Math.random`** per riproducibilità). IP **mai** auto-assegnati a caso: default vuoti o
  da scenario.
- Helper a 32 bit unsigned (`>>>0`) per IP/mask, riusando la logica di `lab/subnet/`
  (stessa-subnet = `(ipA & mask) === (ipB & mask)`).

## 4. Livello 2 — MAC, ARP, switch (realismo richiesto)
- **ARP**: prima di spedire a un IP nello stesso link, il mittente cerca il MAC in cache;
  se manca → **ARP request broadcast** (`FF:FF:..`), lo switch flooda, il proprietario
  risponde con **ARP reply** (unicast). Tutto narrato nel log e visibile in tabella ARP.
- **Switch**: alla ricezione **impara** `MAC sorgente -> porta`; inoltra per MAC
  destinazione; **flood** se destinazione sconosciuta o broadcast. Tabella MAC visibile.
- Astrazioni accettabili (per semplicità): un solo dominio di broadcast per switch
  (niente VLAN in M1–M5), niente STP, frame Ethernet semplificato (src/dst MAC + payload IP).

## 5. Livello 3 — routing (Statico / RIP / OSPF)
Su ogni router la **tabella di routing** = rotte **connesse** (le reti delle sue interfacce,
automatiche) + rotte apprese/inserite. Match per **longest-prefix**.

- **Statico**: form guidato «rete destinazione (IP+mask) → prossimo salto». Validazione:
  il next hop deve essere su una rete connessa.
- **RIP** (distance-vector, v2 base): ogni router annuncia la propria tabella ai vicini con
  **metrica = numero di hop**; simulazione a **round discreti** fino a convergenza; mostrare
  i round e l'aggiornamento delle tabelle. Split-horizon attivo (semplice). Niente timer reali.
- **OSPF** (link-state, single area 0): ogni router scopre i vicini, **flood degli LSA**
  (le proprie interfacce/link), tutti costruiscono lo **stesso link-state DB**, poi
  **Dijkstra** (costo default 1 per link) per le shortest path. Mostrare: vicini, DB,
  albero/percorsi calcolati. Niente DR/BDR, aree multiple, autenticazione.
- **UX comune**: si sceglie la modalità con un `.seg` (Statico/RIP/OSPF). Per RIP/OSPF basta
  **accendere** il protocollo: il valore didattico è *guardare le tabelle convergere*, con un
  pulsante «esegui un round / passo di convergenza» oltre all'auto.

## 6. Motore di simulazione — ciclo del ping
Input: PC sorgente, IP destinazione. Passi (ognuno loggato in italiano semplice, con
evidenziazione della riga/decisione pertinente e animazione del pacchetto sul cavo):
1. **Sorgente**: «dest è nella mia subnet?» (`ip&mask`). Sì → target = dest; No → target =
   **gateway** (se gateway assente o fuori subnet → **errore spiegato**).
2. **ARP** del target sul link locale (vedi §4) se MAC non in cache.
3. **Frame L2** (src/dst MAC, payload IP, **TTL=64**) sul cavo.
4. Se attraversa uno **switch** → inoltro per MAC (apprendi/flooda).
5. Al **router** (dst MAC = sua interfaccia): rimuove L2, legge **IP dest**, cerca in
   **routing table** (longest-prefix):
   - rete **connessa** → ARP sull'interfaccia d'uscita, consegna.
   - via **next hop** → ARP del next hop, inoltra, **TTL−1**.
   - **nessuna rotta** → drop + «destination unreachable» (spiega quale router).
   - **TTL=0** → drop + «TTL scaduto».
6. Arrivo a destinazione → **echo reply** sul percorso inverso → **banner successo** con
   riepilogo del cammino (lista hop).
- **Diagnostica fallimenti** (obiettivo didattico primario): messaggi precisi —
  gateway mancante/errato, mask incoerente, IP duplicato, nessuna rotta, loop/TTL, cavo
  mancante, porta non configurata.

## 7. Interfaccia
- **Toolbar**: aggiungi PC / Switch / Router (poi clic sulla tela o drag); strumento «cavo»
  (clic porta → clic porta); **«Invia ping»** (scegli sorgente e destinazione);
  Play / Passo / Reset; velocità; selettore **scenari**.
- **Tela SVG** centrale: device con icone, cavi, etichette IP sotto i device, **pallino
  animato** del pacchetto, badge di stato.
- **Pannello laterale contestuale** (a tab) sul device selezionato:
  *Config* · *Tabella routing* · *ARP / MAC*.
- **Log** in basso: narrazione passo-passo + legenda colori.
- **Responsive**: tela in contenitore scrollabile; su mobile pannelli impilati; controllare
  overflow a 375/600px come per gli altri lab.

## 8. Scenari pronti (+ sandbox vuoto)
1. **Due PC, uno switch** — stessa rete: ARP e tabella MAC in azione, nessun router.
2. **Due reti, un router** — instradamento tra subnet (statico): il caso "gateway".
3. **Tre router in fila** — confronto **Statico vs RIP vs OSPF** e convergenza visibile.
4. **Rete da riparare** — mask/gateway sbagliati: allena la diagnostica.

## 9. Struttura file
```
lab/rete-lab/
  index.html        header/footer/breadcrumb + toolbar + tela + pannelli (come lab/cicli)
  rete-lab.css      prefisso .rl-
  net-model.js      device/port/link, helper IP 32-bit, MAC, ARP, validazioni
  net-engine.js     ciclo del ping, switch L2, routing match, RIP, OSPF (Dijkstra), diagnosi
  net-ui.js         SVG render, drag, pannelli, log, animazione, scenari
```
(Se più comodo, un solo `rete-lab.js`; ma data la dimensione conviene separare model/engine/ui.)

## 10. Milestone (build incrementale, ognuna verificabile nel browser)
- **M1 — Topologia + L2**: tela, aggiungi/collega PC·Switch·Router, config indirizzi,
  **ping stessa subnet con ARP + switch**, log e diagnosi. *Accettazione*: due PC sulla
  stessa rete via switch si "pingano"; ARP e tabella MAC si popolano; errori base spiegati.
- **M2 — Routing statico L3**: inoltro del router, rotte connesse + statiche, scenario
  "due reti un router". *Accettazione*: ping tra subnet diverse passa dal router seguendo la
  tabella; senza rotta → fallimento spiegato.
- **M3 — RIP**: convergenza distance-vector a round, tabelle che si riempiono.
  *Accettazione*: su 3 router, abilitando RIP le rotte si imparano da sole e il ping arriva;
  i round sono mostrati.
- **M4 — OSPF**: vicini, link-state DB, **Dijkstra**, percorsi più brevi.
  *Accettazione*: su topologia con percorso alternativo, OSPF sceglie il costo minimo; DB e
  calcolo visibili.
- **M5 — Scenari + sfide + rifinitura**: libreria scenari, eventuali sfide a obiettivo
  ("fai arrivare il ping di PC1 a PC2" con verifica), polish e **responsive** a 375/600px.

## 11. Quando finito (checklist di chiusura, come gli altri lab)
- Aggiungere la card in `lab/index.html` (categoria **Sistemi e reti**), stato `live`.
- Aggiornare i contatori nella **home** `index.html` (numero strumenti: passerà da 19 a 20)
  e aggiungere il chip nella `lab-promo`.
- Verifica nel browser (preview): zero errori console, responsive + dark mode.
- Commit + push su `main`.

## 12. Rischi / note
- È il lab più grande: **OSPF/RIP + ARP/MAC + switch** insieme sono molto. Mitigazione:
  milestone, default che "funzionano da soli", avanzato dietro toggle, spiegazioni che
  reggono il carico didattico.
- Mantenere **determinismo** (niente `Math.random`/`Date.now()` nella logica) per
  riproducibilità e test.
- Tenere la simulazione **a passi discreti** (no timing reale): più chiara e più facile da
  animare/spiegare.
