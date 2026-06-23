function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid || typeof PROJECTS === "undefined") return;

  grid.innerHTML = PROJECTS.map((project) => {
    const tags = (project.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const links = [];
    if (project.demo) {
      links.push(`<a href="${escapeAttr(project.demo)}" target="_blank" rel="noopener noreferrer">Demo</a>`);
    }
    if (project.repo) {
      links.push(`<a href="${escapeAttr(project.repo)}" target="_blank" rel="noopener noreferrer">Codice</a>`);
    }

    const titleHtml = project.demo || project.repo
      ? `<a href="${escapeAttr(project.demo || project.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.title)}</a>`
      : escapeHtml(project.title);

    return `
      <article class="card${project.placeholder ? " card-placeholder" : ""}">
        <div class="card-meta">${tags}</div>
        <h3>${titleHtml}</h3>
        <p>${escapeHtml(project.description)}</p>
        ${links.length ? `<div class="card-links">${links.join("")}</div>` : ""}
      </article>
    `;
  }).join("");
}

function renderPublications() {
  const list = document.getElementById("publications-list");
  if (!list || typeof PUBLICATIONS === "undefined") return;

  list.innerHTML = PUBLICATIONS.map((pub) => {
    const statusClass = pub.url ? "" : " soon";
    const action = pub.url
      ? `<a class="publication-link" href="${escapeAttr(pub.url)}" target="_blank" rel="noopener noreferrer">Su Amazon</a>`
      : `<span class="publication-status${statusClass}">${escapeHtml(pub.status || "In arrivo")}</span>`;

    return `
      <article class="publication">
        <span class="publication-year">${escapeHtml(pub.year || "")}</span>
        <div class="publication-body">
          <h3>${escapeHtml(pub.title)}</h3>
          <p>${escapeHtml(pub.description)}</p>
        </div>
        ${action}
      </article>
    `;
  }).join("");
}

function renderContacts() {
  const container = document.getElementById("contact-links");
  if (!container || typeof SITE === "undefined") return;

  const items = [];

  if (SITE.email) {
    items.push(`<a href="mailto:${escapeAttr(SITE.email)}">${escapeHtml(SITE.email)}</a>`);
  }

  (SITE.links || []).forEach((link) => {
    items.push(`<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`);
  });

  container.innerHTML = items.join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".site-header");

  toggle?.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav?.classList.toggle("open");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle?.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
    });
  });

  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });
}

document.getElementById("year").textContent = new Date().getFullYear();
renderProjects();
renderPublications();
renderContacts();
setupNavigation();
