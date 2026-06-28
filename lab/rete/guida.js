/* ============================================================
   guida.js — Approfondimento: livelli e protocolli di rete
   Accordion ricercabile sotto al voyager. Nessuna dipendenza.
   ============================================================ */
(function () {
  "use strict";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* item: { name, syntax, desc, layer? }  (layer dà il colore: app/tcp/ip/eth/phy) */
  const GUIDE = [
    {
      cat: "I livelli, dall'alto verso il basso",
      intro: "Ogni livello offre un servizio a quello sopra e usa quello sotto. Scendendo, i dati vengono incapsulati; salendo, decapsulati.",
      items: [
        { name: "Applicazione", syntax: "OSI 7·6·5 — PDU: dati / messaggio", layer: "app",
          desc: "È il livello con cui interagiscono i <b>programmi</b> (browser, client di posta, app). Genera e interpreta i <b>dati</b> veri e propri secondo un protocollo applicativo (HTTP, DNS, SMTP…). In OSI è diviso in tre — <b>Applicazione</b> (il servizio), <b>Presentazione</b> (formato/codifica e cifratura TLS) e <b>Sessione</b> (apertura/chiusura del dialogo) — che il modello TCP/IP unisce in uno solo. Non si occupa di <i>come</i> i dati viaggiano: delega tutto ai livelli sotto." },
        { name: "Trasporto", syntax: "OSI 4 — PDU: segmento (TCP) / datagramma (UDP)", layer: "tcp",
          desc: "Gestisce la comunicazione <b>da processo a processo</b> usando le <b>porte</b> (un numero che identifica l'applicazione: 80, 443, 53…). Decide <i>come</i> consegnare: con <b>TCP</b> (affidabile, ordinato, con conferme) o con <b>UDP</b> (veloce, senza garanzie). Spezza i dati grandi in <b>segmenti</b> numerati e, lato TCP, li riordina e richiede la ritrasmissione di quelli persi. È il primo livello «end-to-end»: i router non lo guardano." },
        { name: "Rete (Internet)", syntax: "OSI 3 — PDU: pacchetto", layer: "ip",
          desc: "Si occupa di portare i dati <b>da una rete all'altra</b> in tutto il mondo. Aggiunge gli <b>indirizzi IP</b> (logici): sorgente e destinazione. Il suo lavoro è l'<b>instradamento</b> (routing): i <b>router</b> leggono l'IP di destinazione e scelgono il salto successivo. Ogni pacchetto è indipendente e può seguire strade diverse; il <b>TTL</b> evita che giri all'infinito. Qui IP non garantisce nulla: ci pensa TCP sopra." },
        { name: "Collegamento dati", syntax: "OSI 2 — PDU: frame", layer: "eth",
          desc: "Consegna i dati <b>all'interno di una singola rete locale</b>, da una scheda all'altra, usando gli <b>indirizzi MAC</b> (fisici, scritti nell'hardware). Racchiude il pacchetto in un <b>frame</b> con MAC sorgente e destinazione e una <b>FCS</b> (checksum) per scoprire errori. È il livello degli <b>switch</b>. A ogni salto tra router il frame viene rifatto con nuovi MAC, mentre gli IP restano gli stessi." },
        { name: "Fisico", syntax: "OSI 1 — PDU: bit", layer: "phy",
          desc: "Il livello più basso: trasforma il frame in una <b>sequenza di bit</b> (0 e 1) e poi in <b>segnali fisici</b> — impulsi di tensione sul rame, lampi di luce nella fibra ottica, onde radio nel Wi-Fi — che viaggiano sul <b>mezzo trasmissivo</b>. Definisce cavi, connettori (RJ45), voltaggi, frequenze, codifica dei bit e <b>velocità</b> (es. 100 Mbps, 1 Gbps). Non capisce cosa trasporta: muove solo bit grezzi da un punto all'altro del cavo." },
      ],
    },
    {
      cat: "Protocolli applicativi",
      intro: "Vivono nel livello Applicazione e definiscono il «linguaggio» con cui due programmi si parlano.",
      items: [
        { name: "HTTP", syntax: "porta 80 · su TCP", layer: "app",
          desc: "<i>HyperText Transfer Protocol</i>: il protocollo del <b>Web</b>. Il client invia una <b>richiesta</b> (es. <code>GET /pagina</code>) e il server risponde con un <b>codice di stato</b> (200 OK, 404 Not Found, 301…) e il contenuto. È <b>senza stato</b>: ogni richiesta è indipendente (per ricordare l'utente si usano i cookie). Viaggia in chiaro." },
        { name: "HTTPS", syntax: "porta 443 · HTTP + TLS", layer: "app",
          desc: "È HTTP dentro un tunnel cifrato <b>TLS/SSL</b>: prima si scambiano le chiavi (handshake) e si verifica il <b>certificato</b> del server, poi tutto il traffico è <b>cifrato</b>. Garantisce riservatezza (nessuno legge), integrità (nessuno modifica) e autenticità (parli col sito giusto). È lo standard di oggi: il lucchetto del browser." },
        { name: "DNS", syntax: "porta 53 · di solito su UDP", layer: "app",
          desc: "<i>Domain Name System</i>: la «rubrica» di Internet. Traduce i <b>nomi</b> leggibili (<code>esempio.it</code>) nell'<b>indirizzo IP</b> corrispondente (93.184.216.34). È un sistema gerarchico e distribuito di server; senza DNS dovremmo ricordare gli IP a memoria. È quasi sempre il primo passo prima di aprire un sito." },
        { name: "FTP", syntax: "porte 20/21 · su TCP", layer: "app",
          desc: "<i>File Transfer Protocol</i>: trasferisce <b>file</b> tra client e server. Usa due connessioni: una per i <b>comandi</b> (21) e una per i <b>dati</b> (20). È datato e non cifrato: oggi si preferisce <b>SFTP</b> (file transfer dentro SSH) o HTTPS." },
        { name: "SMTP", syntax: "porta 25 (587) · su TCP", layer: "app",
          desc: "<i>Simple Mail Transfer Protocol</i>: si occupa dell'<b>invio</b> della posta elettronica (dal mittente al server e tra server). Per <b>leggere</b> la posta dal proprio server si usano invece <b>IMAP</b> o <b>POP3</b>." },
        { name: "SSH", syntax: "porta 22 · su TCP", layer: "app",
          desc: "<i>Secure Shell</i>: apre una <b>riga di comando remota cifrata</b> verso un altro computer. Sostituisce i vecchi Telnet/rlogin (in chiaro) e si usa per amministrare server in sicurezza, oltre che per trasferire file (SFTP/SCP)." },
        { name: "DHCP", syntax: "porte 67/68 · su UDP", layer: "app",
          desc: "<i>Dynamic Host Configuration Protocol</i>: assegna <b>automaticamente</b> a ogni dispositivo che si connette un IP, la maschera, il gateway e il DNS. Funziona con lo scambio <b>DORA</b> (Discover, Offer, Request, Acknowledge). Senza DHCP dovremmo configurare l'IP a mano su ogni dispositivo." },
      ],
    },
    {
      cat: "Protocolli di trasporto e di rete",
      intro: "Sono il «motore» che muove davvero i dati: porte, affidabilità, indirizzi IP e instradamento.",
      items: [
        { name: "TCP", syntax: "livello Trasporto · affidabile", layer: "tcp",
          desc: "<i>Transmission Control Protocol</i>: <b>orientato alla connessione</b>. Prima apre il canale con un <b>handshake a tre vie</b> (SYN, SYN-ACK, ACK), poi numera i segmenti, conferma quelli ricevuti (<b>ACK</b>) e <b>ritrasmette</b> quelli persi, controllando anche la congestione. Risultato: i dati arrivano <b>completi e in ordine</b>. Lo usano Web, posta, trasferimenti file — quando non puoi perdere nulla." },
        { name: "UDP", syntax: "livello Trasporto · veloce", layer: "tcp",
          desc: "<i>User Datagram Protocol</i>: <b>senza connessione</b> e senza garanzie. Spedisce <b>datagrammi</b> e basta: niente handshake, niente conferme, niente riordino. È <b>leggero e velocissimo</b>, perfetto quando la rapidità conta più della perfezione: streaming, giochi online, chiamate VoIP, DNS." },
        { name: "IP", syntax: "livello Rete · indirizzamento", layer: "ip",
          desc: "<i>Internet Protocol</i>: dà a ogni dispositivo un <b>indirizzo logico</b> e fa in modo che i pacchetti raggiungano la rete giusta nel mondo. È <b>best-effort</b>: non garantisce consegna né ordine (ci pensa TCP). <b>IPv4</b> usa indirizzi a 32 bit (es. 192.168.1.1), ormai quasi esauriti; <b>IPv6</b> ne usa 128 per averne a sufficienza." },
        { name: "ICMP", syntax: "livello Rete · diagnostica", layer: "ip",
          desc: "<i>Internet Control Message Protocol</i>: il protocollo dei <b>messaggi di servizio</b> della rete. Segnala errori («destinazione irraggiungibile», «TTL scaduto») ed è il motore di <b>ping</b> (echo request/reply) e <b>traceroute</b>. Non trasporta dati utente: serve a controllare e diagnosticare." },
        { name: "ARP", syntax: "tra livello Rete e Collegamento", layer: "ip",
          desc: "<i>Address Resolution Protocol</i>: fa da <b>ponte tra IP e MAC</b> nella rete locale. Quando un dispositivo conosce l'IP di destinazione ma non il suo MAC, manda in <b>broadcast</b> «chi ha questo IP?»; il proprietario risponde col proprio MAC, che viene messo in cache. Indispensabile per costruire il frame Ethernet." },
        { name: "OSPF", syntax: "livello Rete · routing", layer: "ip",
          desc: "<i>Open Shortest Path First</i>: un <b>protocollo di routing</b> con cui i router si scambiano informazioni e calcolano da soli il <b>percorso più breve</b> (algoritmo di Dijkstra) verso ogni rete. È un protocollo «link-state»: ogni router conosce la mappa completa e reagisce in fretta ai guasti." },
      ],
    },
    {
      cat: "Protocolli di accesso alla rete",
      intro: "Livello 2 e 1: come i dati attraversano fisicamente la rete locale, da una scheda all'altra.",
      items: [
        { name: "Ethernet", syntax: "OSI 2 · LAN cablata", layer: "eth",
          desc: "Lo standard delle <b>reti locali cablate</b>. Impacchetta i dati in <b>frame</b> con MAC sorgente, MAC destinazione, tipo e <b>FCS</b> (checksum di controllo). Gli <b>switch</b> imparano quale MAC è su quale porta e inoltrano il frame solo dove serve. È veloce, economico e dominante negli uffici e nei data center." },
        { name: "Wi-Fi (802.11)", syntax: "OSI 2·1 · LAN senza fili", layer: "eth",
          desc: "L'equivalente di Ethernet <b>senza cavi</b>: i frame viaggiano come <b>onde radio</b> tra dispositivo e <b>access point</b>. Usa MAC come Ethernet ma aggiunge gestione del canale condiviso, associazione all'AP e cifratura (WPA2/WPA3). Più comodo, ma più sensibile a interferenze e distanza." },
        { name: "PPP", syntax: "OSI 2 · punto-punto", layer: "eth",
          desc: "<i>Point-to-Point Protocol</i>: collega <b>due soli nodi</b> in diretta (tipico delle connessioni seriali e di molti collegamenti WAN). Gestisce l'autenticazione e l'instaurazione del collegamento su una linea dedicata, senza bisogno di indirizzi MAC e switch." },
        { name: "Mezzi fisici (L1)", syntax: "OSI 1 · il mezzo", layer: "phy",
          desc: "Il <b>livello fisico</b> in concreto: <b>cavo UTP</b> (doppini di rame, connettore RJ45) per le LAN, <b>fibra ottica</b> (luce nel vetro, lunghe distanze e altissima velocità), <b>onde radio</b> per il wireless. Definisce voltaggi/lunghezze d'onda, codifica dei bit in segnali e la <b>velocità</b> massima. Qui «viaggiano» solo 0 e 1." },
      ],
    },
  ];

  const guideEl = document.getElementById("netGuide");
  if (!guideEl) return;

  let html = "";
  GUIDE.forEach((group) => {
    html += `<section class="guide-cat">`;
    html += `<h3 class="guide-cat-title">${esc(group.cat)}</h3>`;
    if (group.intro) html += `<p class="guide-cat-intro">${esc(group.intro)}</p>`;
    group.items.forEach((it) => {
      const search = (it.name + " " + (it.syntax || "") + " " + it.desc).toLowerCase().replace(/<[^>]+>/g, "");
      html += `<details class="guide-cmd" data-search="${esc(search)}"${it.layer ? ` data-layer="${it.layer}"` : ""}>`;
      html += `<summary><span class="g-name">${esc(it.name)}</span>` +
              `<span class="g-syntax">${esc(it.syntax || "")}</span></summary>`;
      html += `<div class="g-body"><p class="g-desc">${it.desc}</p></div>`;
      html += `</details>`;
    });
    html += `</section>`;
  });
  guideEl.innerHTML = html;

  const search = document.getElementById("guideSearch");
  const empty = document.getElementById("guideEmpty");
  if (search) search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let any = false;
    guideEl.querySelectorAll(".guide-cat").forEach((cat) => {
      let catVisible = false;
      cat.querySelectorAll(".guide-cmd").forEach((cmd) => {
        const match = q === "" || cmd.dataset.search.indexOf(q) >= 0;
        cmd.hidden = !match;
        if (match) { catVisible = true; any = true; }
        cmd.open = q !== "" && match;
      });
      cat.hidden = !catVisible;
    });
    if (empty) empty.hidden = any;
  });
})();
