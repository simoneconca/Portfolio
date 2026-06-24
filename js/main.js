/* ============================================================
   Simone Conca — Portfolio · interazioni
   Nessuna dipendenza. Modifica i contenuti in js/content.js.
   ============================================================ */

/* ---------- Utils ---------- */
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
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Reveal on scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
);
function observeReveal(selector) {
  document.querySelectorAll(selector).forEach((el) => revealObserver.observe(el));
}

/* ---------- Render: progetti ---------- */
function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid || typeof PROJECTS === "undefined") return;

  grid.innerHTML = PROJECTS.map((project, i) => {
    const tags = (project.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const links = [];
    if (project.demo) links.push(`<a href="${escapeAttr(project.demo)}" target="_blank" rel="noopener noreferrer">Demo →</a>`);
    if (project.repo) links.push(`<a href="${escapeAttr(project.repo)}" target="_blank" rel="noopener noreferrer">Codice →</a>`);

    const href = project.demo || project.repo;
    const titleHtml = href
      ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.title)}</a>`
      : escapeHtml(project.title);

    const num = String(i + 1).padStart(2, "0");

    return `
      <article class="card reveal${project.placeholder ? " card-placeholder" : ""}">
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

/* ---------- Tema chiaro/scuro ---------- */
function setupTheme() {
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // Segui il sistema solo se l'utente non ha mai scelto manualmente
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (err) {}
    if (!saved) document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  });
}

/* ---------- Navigazione ---------- */
function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".nav-mobile");
  const header = document.querySelector(".site-header");

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    mobileNav?.classList.toggle("open", !open);
    document.body.style.overflow = open ? "" : "hidden";
  });

  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      toggle?.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  const onScroll = () => {
    header?.classList.toggle("scrolled", window.scrollY > 10);
    updateActiveNav();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function updateActiveNav() {
  const sections = ["progetti", "pubblicazioni", "ripetizioni", "contatti"];
  const pos = window.scrollY + 140;
  let current = "";
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= pos) current = id;
  });
  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === current);
  });
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

/* ---------- Init ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
renderProjects();
renderPublications();
renderContacts();
setupTheme();
setupNavigation();
observeReveal(".reveal");
