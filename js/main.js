/* ============================================================
   main.js — render dei contenuti della HOME PAGE
   Comportamenti condivisi (tema, nav, reveal) in js/core.js.
   Dati in js/content.js.
   ============================================================ */

/* ---------- Render: progetti ---------- */
function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid || typeof PROJECTS === "undefined") return;

  grid.innerHTML = PROJECTS.map((project, i) => {
    const tags = (project.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    // I link interni (pagina di presentazione) restano nella stessa scheda;
    // quelli esterni (demo live, repo) si aprono in una nuova.
    const isExternal = (url) => /^https?:\/\//i.test(url);
    const link = (url, label) =>
      `<a href="${escapeAttr(url)}"${isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;

    const links = [];
    if (project.page) links.push(link(project.page, "Scopri il progetto →"));
    if (project.demo) links.push(link(project.demo, "Demo →"));
    if (project.repo) links.push(link(project.repo, "Codice →"));

    const href = project.page || project.demo || project.repo;
    const titleHtml = href ? link(href, escapeHtml(project.title)) : escapeHtml(project.title);

    const num = String(i + 1).padStart(2, "0");

    const media = project.image
      ? `<a class="card-media" href="${escapeAttr(href || "#")}" tabindex="-1" aria-hidden="true"><img src="${escapeAttr(project.image)}" alt="" loading="lazy"></a>`
      : "";

    return `
      <article class="card reveal${project.placeholder ? " card-placeholder" : ""}${project.image ? " has-media" : ""}">
        ${media}
        <div class="card-top">
          <span class="card-index">P/${num}</span>
          <svg class="card-arrow" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M5 13L13 5M13 5H6M13 5v7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h3>${titleHtml}</h3>
        <p>${escapeHtml(project.description)}</p>
        ${tags ? `<div class="card-tags">${tags}</div>` : ""}
        ${links.length ? `<div class="card-links">${links.join("")}</div>` : ""}
      </article>`;
  }).join("");

  observeReveal("#projects-grid .reveal");
  setupCardGlow();
}

/* ---------- Render: pubblicazioni ---------- */
function renderPublications() {
  const list = document.getElementById("publications-list");
  if (!list || typeof PUBLICATIONS === "undefined") return;

  list.innerHTML = PUBLICATIONS.map((pub) => {
    const action = pub.url
      ? `<a class="pub-link" href="${escapeAttr(pub.url)}" target="_blank" rel="noopener noreferrer">Su Amazon →</a>`
      : `<span class="pub-status">${escapeHtml(pub.status || "In arrivo")}</span>`;

    return `
      <article class="pub reveal">
        <span class="pub-year">${escapeHtml(pub.year || "—")}</span>
        <div class="pub-body">
          <h3>${escapeHtml(pub.title)}</h3>
          <p>${escapeHtml(pub.description)}</p>
        </div>
        <div class="pub-action">${action}</div>
      </article>`;
  }).join("");

  observeReveal("#publications-list .reveal");
}

/* ---------- Render: contatti ---------- */
function renderContacts() {
  if (typeof SITE === "undefined") return;

  const emailEl = document.getElementById("contact-email");
  if (emailEl && SITE.email) {
    emailEl.textContent = SITE.email;
    emailEl.href = `mailto:${SITE.email}`;
  }

  const container = document.getElementById("contact-links");
  if (container) {
    container.innerHTML = (SITE.links || [])
      .map((link) => `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`)
      .join("");
  }
}

/* ---------- Glow che segue il cursore sulle card ---------- */
function setupCardGlow() {
  if (prefersReducedMotion || window.matchMedia("(max-width: 768px)").matches) return;
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- Init home ---------- */
renderProjects();
renderPublications();
renderContacts();
