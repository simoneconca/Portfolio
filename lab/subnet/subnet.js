/* ============================================================
   subnet.js — Subnetting & IP Calculator visuale
   Tutto a 32 bit unsigned (>>> 0). Nessuna libreria.
   ============================================================ */
(function () {
  "use strict";

  const octEls = Array.prototype.slice.call(document.querySelectorAll(".sn-oct"));
  const cidrRange = document.getElementById("cidrRange");
  const cidrNum = document.getElementById("cidrNum");
  const bitLine = document.getElementById("bitLine");
  const maskLine = document.getElementById("maskLine");
  const results = document.getElementById("snResults");
  const splitSelect = document.getElementById("splitSelect");
  const subnetsBox = document.getElementById("snSubnets");
  const splitInfo = document.getElementById("splitInfo");

  /* ---------- Helpers a 32 bit ---------- */
  function octets(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }
  function dotted(n) { return octets(n).join("."); }
  function binOctet(v) { return v.toString(2).padStart(8, "0"); }
  function maskFromCidr(c) { return c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0; }

  function readIp() {
    let n = 0;
    for (let i = 0; i < 4; i++) {
      let v = parseInt(octEls[i].value, 10);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(255, v));
      n = ((n << 8) >>> 0) + v;
    }
    return n >>> 0;
  }
  function readCidr() {
    let c = parseInt(cidrNum.value, 10);
    if (isNaN(c)) c = 24;
    return Math.max(0, Math.min(32, c));
  }

  /* ---------- Classificazione ---------- */
  function ipClass(first) {
    if (first < 128) return "A";
    if (first < 192) return "B";
    if (first < 224) return "C";
    if (first < 240) return "D (multicast)";
    return "E (riservata)";
  }
  function specialKind(n) {
    const o = octets(n);
    if (o[0] === 10) return { priv: true, txt: "Privato (10.0.0.0/8)" };
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return { priv: true, txt: "Privato (172.16.0.0/12)" };
    if (o[0] === 192 && o[1] === 168) return { priv: true, txt: "Privato (192.168.0.0/16)" };
    if (o[0] === 127) return { priv: true, txt: "Loopback (127.0.0.0/8)" };
    if (o[0] === 169 && o[1] === 254) return { priv: true, txt: "Link-local (169.254.0.0/16)" };
    return { priv: false, txt: "Pubblico (instradabile su Internet)" };
  }

  /* ---------- Render bit dell'IP ---------- */
  function renderBits(ip, cidr) {
    bitLine.innerHTML = "";
    maskLine.innerHTML = "";
    const ipOct = octets(ip);
    const maskOct = octets(maskFromCidr(cidr));

    for (let g = 0; g < 4; g++) {
      // gruppo IP
      const grp = document.createElement("div");
      grp.className = "sn-octet";
      const bits = document.createElement("div");
      bits.className = "sn-octbits";
      const bs = binOctet(ipOct[g]);
      for (let b = 0; b < 8; b++) {
        const idx = g * 8 + b;
        const cell = document.createElement("span");
        const isNet = idx < cidr;
        cell.className = "sn-bit " + (isNet ? "net" : "host");
        if (idx === cidr && cidr !== 0 && cidr !== 32) cell.classList.add("boundary");
        cell.textContent = bs[b];
        bits.appendChild(cell);
      }
      const dec = document.createElement("div");
      dec.className = "sn-octdec";
      dec.textContent = ipOct[g];
      grp.appendChild(bits);
      grp.appendChild(dec);
      bitLine.appendChild(grp);

      // gruppo maschera
      const mgrp = document.createElement("div");
      mgrp.className = "sn-octet";
      const mbits = document.createElement("div");
      mbits.className = "sn-octbits";
      const ms = binOctet(maskOct[g]);
      for (let b = 0; b < 8; b++) {
        const cell = document.createElement("span");
        cell.className = "sn-bit" + (ms[b] === "1" ? " one" : "");
        cell.textContent = ms[b];
        mbits.appendChild(cell);
      }
      const mdec = document.createElement("div");
      mdec.className = "sn-octdec";
      mdec.style.color = "var(--ink-soft)";
      mdec.textContent = maskOct[g];
      mgrp.appendChild(mbits);
      mgrp.appendChild(mdec);
      maskLine.appendChild(mgrp);

      if (g < 3) {
        const dot1 = document.createElement("span"); dot1.className = "sn-octdot"; dot1.textContent = "."; bitLine.appendChild(dot1);
        const dot2 = document.createElement("span"); dot2.className = "sn-octdot"; dot2.textContent = "."; maskLine.appendChild(dot2);
      }
    }
  }

  /* ---------- Calcolo + render risultati ---------- */
  function res(label, val, sub, span2) {
    const d = document.createElement("div");
    d.className = "sn-res" + (span2 ? " span2" : "");
    d.innerHTML = '<span class="sn-res-label">' + label + '</span><div class="sn-res-val">' +
      escapeHtml(val) + "</div>" + (sub ? '<div class="sn-res-sub">' + escapeHtml(sub) + "</div>" : "");
    return d;
  }

  function compute() {
    const ip = readIp();
    const cidr = readCidr();
    const mask = maskFromCidr(cidr);
    const wildcard = (~mask) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const hostBits = 32 - cidr;

    renderBits(ip, cidr);

    // Conteggio host e range, con casi limite /31 e /32
    let totalAddr, usable, firstHost, lastHost;
    if (cidr === 32) {
      totalAddr = 1; usable = 1; firstHost = network; lastHost = network;
    } else if (cidr === 31) {
      totalAddr = 2; usable = 2; firstHost = network; lastHost = broadcast; // RFC 3021 (punto-punto)
    } else {
      totalAddr = Math.pow(2, hostBits);
      usable = totalAddr - 2;
      firstHost = (network + 1) >>> 0;
      lastHost = (broadcast - 1) >>> 0;
    }

    const first = octets(ip)[0];
    const kind = specialKind(ip);

    results.innerHTML = "";
    results.appendChild(res("Subnet mask", dotted(mask), octets(mask).map(binOctet).join(".")));
    results.appendChild(res("Wildcard mask", dotted(wildcard), "la maschera \"al contrario\""));
    results.appendChild(res("Network ID", dotted(network) + " /" + cidr, "il primo indirizzo: identifica la rete"));
    results.appendChild(res("Broadcast", dotted(broadcast), "l'ultimo indirizzo: parla a tutta la rete"));

    if (cidr >= 31) {
      results.appendChild(res("Host utilizzabili", usable + (cidr === 31 ? " (punto-punto)" : " (host singolo)"),
        cidr === 31 ? "/31 — RFC 3021: niente rete/broadcast" : "/32 — un solo indirizzo", true));
      results.appendChild(res("Range utilizzabile", dotted(firstHost) + " – " + dotted(lastHost), null, true));
    } else {
      results.appendChild(res("Host utilizzabili", usable.toLocaleString("it-IT"),
        "2^" + hostBits + " − 2 (tolti rete e broadcast)", true));
      results.appendChild(res("Primo host", dotted(firstHost)));
      results.appendChild(res("Ultimo host", dotted(lastHost)));
    }

    const classRes = res("Classe & tipo", "Classe " + ipClass(first));
    const badges = document.createElement("div");
    badges.className = "sn-badges";
    badges.innerHTML = '<span class="sn-badge ' + (kind.priv ? "priv" : "pub") + '">' + escapeHtml(kind.txt) + "</span>";
    classRes.appendChild(badges);
    classRes.classList.add("span2");
    results.appendChild(classRes);

    renderSplit(network, cidr);
  }

  /* ---------- Divisione in sottoreti (bonus) ---------- */
  function renderSplit(network, cidr) {
    // popola le opzioni possibili (sottoprefissi fino a +6 bit, max /30)
    const maxExtra = Math.min(6, 30 - cidr);
    splitSelect.innerHTML = "";
    if (maxExtra < 1) {
      subnetsBox.innerHTML = "";
      splitInfo.innerHTML = "Con <b>/" + cidr + "</b> non c'è spazio per dividere ulteriormente in sottoreti utili.";
      return;
    }
    for (let e = 1; e <= maxExtra; e++) {
      const opt = document.createElement("option");
      opt.value = String(e);
      opt.textContent = Math.pow(2, e) + " sottoreti (/" + (cidr + e) + ")";
      splitSelect.appendChild(opt);
    }
    drawSubnets(network, cidr);
  }

  function drawSubnets(network, cidr) {
    const extra = parseInt(splitSelect.value, 10) || 1;
    const newCidr = cidr + extra;
    const count = Math.pow(2, extra);
    const block = Math.pow(2, 32 - newCidr); // ampiezza di ogni sottorete
    const hostsEach = newCidr >= 31 ? (newCidr === 31 ? 2 : 1) : block - 2;

    splitInfo.innerHTML = "Divido la <b>/" + cidr + "</b> in <b>" + count + "</b> sottoreti <b>/" + newCidr +
      "</b>, ognuna con <b>" + (typeof hostsEach === "number" ? hostsEach.toLocaleString("it-IT") : hostsEach) +
      "</b> host utilizzabili.";

    subnetsBox.innerHTML = "";
    const limit = Math.min(count, 64); // non listarne migliaia
    for (let i = 0; i < limit; i++) {
      const net = (network + i * block) >>> 0;
      const bcast = (net + block - 1) >>> 0;
      const d = document.createElement("div");
      d.className = "sn-subnet";
      d.innerHTML = "<b>#" + (i + 1) + "</b> " + escapeHtml(dotted(net)) + "/" + newCidr +
        "<small>broadcast " + escapeHtml(dotted(bcast)) + "</small>";
      subnetsBox.appendChild(d);
    }
    if (count > limit) {
      const d = document.createElement("div");
      d.className = "sn-subnet";
      d.innerHTML = "<b>…</b> e altre " + (count - limit) + " sottoreti";
      subnetsBox.appendChild(d);
    }
  }

  /* ---------- Input handlers ---------- */
  function syncCidr(val) {
    const c = Math.max(0, Math.min(32, val));
    cidrRange.value = c;
    cidrNum.value = c;
    compute();
  }

  octEls.forEach(function (el, i) {
    el.addEventListener("input", function () {
      // limita a 0–255, passa al campo successivo dopo 3 cifre
      let v = el.value.replace(/[^0-9]/g, "");
      if (v.length > 3) v = v.slice(0, 3);
      el.value = v;
      if (parseInt(v, 10) > 255) el.value = "255";
      compute();
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "." && i < 3) { e.preventDefault(); octEls[i + 1].focus(); octEls[i + 1].select(); }
    });
    el.addEventListener("focus", function () { el.select(); });
  });

  cidrRange.addEventListener("input", function () { syncCidr(parseInt(cidrRange.value, 10)); });
  cidrNum.addEventListener("input", function () { syncCidr(parseInt(cidrNum.value, 10)); });
  splitSelect.addEventListener("change", function () { compute(); });

  // Esempi predefiniti
  document.querySelectorAll("[data-preset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const parts = btn.dataset.preset.split("/");
      const o = parts[0].split(".");
      for (let i = 0; i < 4; i++) octEls[i].value = o[i];
      syncCidr(parseInt(parts[1], 10));
    });
  });

  compute();
})();
