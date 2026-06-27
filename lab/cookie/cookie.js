/* ============================================================
   cookie.js — Cookie & Privilege Escalation (laboratorio didattico)
   Tutto simulato: lo "stato di sessione" è un oggetto JS, modificabile
   da un finto pannello cookie. Nessun cookie/server reale.
   Lezione: l'autorizzazione lato client NON va mai fidata.
   ============================================================ */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  // Cookie "inviati al server" (ciò che il finto server riceve al reload)
  let cookie = { role: "student", user_id: "104" };
  // Stato applicato dopo l'ultimo "reload"
  let session = Object.assign({}, cookie);
  let escalated = false;

  const VOTI = [
    { materia: "Informatica", voto: 9 },
    { materia: "Matematica", voto: 6 },
    { materia: "Sistemi e Reti", voto: 8 },
    { materia: "Inglese", voto: 7 },
    { materia: "Storia", voto: 5 }
  ];

  const PRIV = { professore: true, prof: true, docente: true, admin: true, amministratore: true, teacher: true };
  function isPriv(role) { return !!PRIV[String(role).toLowerCase()]; }

  /* ---------- Render dashboard ---------- */
  function renderDash() {
    const priv = isPriv(session.role);
    const roleLabel = priv ? session.role : "studente";

    $("ckRoleBadge").textContent = roleLabel;
    $("ckRoleBadge").className = "ck-rolebadge " + (priv ? "priv" : "student");
    $("ckUserName").textContent = priv ? "Sig. " + (session.role) : "Marco Rossi";

    // tabella voti
    const tb = $("ckGradesBody");
    tb.innerHTML = "";
    VOTI.forEach(function (v, i) {
      const tr = document.createElement("tr");
      if (priv) {
        tr.innerHTML = "<td>" + escapeHtml(v.materia) + '</td><td class="voto"><input class="ck-voto-input" type="number" min="0" max="10" value="' + v.voto + '" data-i="' + i + '"></td>';
      } else {
        tr.innerHTML = "<td>" + escapeHtml(v.materia) + '</td><td class="voto">' + v.voto + ' <span class="ck-lockicon">🔒</span></td>';
      }
      tb.appendChild(tr);
    });

    $("ckSub").innerHTML = priv
      ? "Sei autenticato con privilegi elevati: ora i voti sono <b>modificabili</b>."
      : "Profilo studente: puoi solo <b>consultare</b> i tuoi voti (sola lettura).";

    $("ckAdminBox").hidden = !priv;
    $("ckSaveMsg").textContent = "";

    // url mostra il ruolo "lato server"
    $("ckUrl").innerHTML = "registro-pariovoti.it/dashboard <b>· sessione: role=" + escapeHtml(session.role) + "</b>";

    // input voti -> salvataggio
    if (priv) {
      tb.querySelectorAll(".ck-voto-input").forEach(function (inp) {
        inp.addEventListener("change", function () {
          const i = parseInt(inp.dataset.i, 10);
          VOTI[i].voto = Math.max(0, Math.min(10, parseInt(inp.value, 10) || 0));
          inp.value = VOTI[i].voto;
          $("ckSaveMsg").textContent = "✓ Voto di " + VOTI[i].materia + " aggiornato a " + VOTI[i].voto + " — \"salvato\" sul server.";
          if (!escalated) triggerWin();
        });
      });
    }
  }

  /* ---------- Cookie panel ---------- */
  function renderCookiePanel() {
    $("ckCookieRole").value = cookie.role;
    $("ckCookieId").value = cookie.user_id;
    markChanged();
  }
  function markChanged() {
    $("ckCookieRole").classList.toggle("changed", cookie.role !== session.role);
  }

  function applyReload() {
    cookie.role = $("ckCookieRole").value.trim() || "student";
    cookie.user_id = $("ckCookieId").value.trim() || "104";
    session = Object.assign({}, cookie);
    renderDash();
    renderCookiePanel();
    updateSteps();
    if (isPriv(session.role)) triggerWin();
  }

  /* ---------- Guida a step ---------- */
  function updateSteps() {
    const editedRole = cookie.role !== "student";
    const reloadedPriv = isPriv(session.role);
    setStep("s1", true, true);
    setStep("s2", editedRole || reloadedPriv, reloadedPriv);
    setStep("s3", reloadedPriv, reloadedPriv);
    setStep("s4", reloadedPriv, escalated);
  }
  function setStep(id, on, done) {
    const el = $(id);
    el.classList.toggle("on", on || done);
    el.classList.toggle("done", !!done);
  }

  /* ---------- Vittoria ---------- */
  function triggerWin() {
    escalated = true;
    $("ckWin").classList.add("show");
    updateSteps();
  }

  /* ---------- Wiring ---------- */
  $("ckReload").addEventListener("click", applyReload);
  $("ckCookieRole").addEventListener("input", markChanged);
  document.querySelectorAll("[data-setrole]").forEach(function (b) {
    b.addEventListener("click", function () { $("ckCookieRole").value = b.dataset.setrole; markChanged(); });
  });
  $("ckResetBtn").addEventListener("click", function () {
    cookie = { role: "student", user_id: "104" };
    session = Object.assign({}, cookie);
    escalated = false;
    $("ckWin").classList.remove("show");
    renderDash(); renderCookiePanel(); updateSteps();
  });

  // init
  renderDash();
  renderCookiePanel();
  updateSteps();
})();
