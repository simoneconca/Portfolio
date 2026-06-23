function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid || typeof PROJECTS === "undefined") return;

  grid.innerHTML = PROJECTS.map((project, i) => {
    const tags = (project.tags || [])
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join("");

    const links = [];
    if (project.demo) {
      links.push(`<a href="${escapeAttr(project.demo)}" target="_blank" rel="noopener noreferrer">Demo →</a>`);
    }
    if (project.repo) {
      links.push(`<a href="${escapeAttr(project.repo)}" target="_blank" rel="noopener noreferrer">Codice →</a>`);
    }

    const titleHtml = project.demo || project.repo
      ? `<a href="${escapeAttr(project.demo || project.repo)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.title)}</a>`
      : escapeHtml(project.title);

    return `
      <article class="card reveal-card${project.placeholder ? " card-placeholder" : ""}" style="transition-delay: ${i * 0.1}s">
        <div class="card-glow" aria-hidden="true"></div>
        <div class="card-meta">${tags}</div>
        <h3>${titleHtml}</h3>
        <p>${escapeHtml(project.description)}</p>
        ${links.length ? `<div class="card-links">${links.join("")}</div>` : ""}
      </article>
    `;
  }).join("");

  observeReveal(".card.reveal-card");
}

function renderPublications() {
  const list = document.getElementById("publications-list");
  if (!list || typeof PUBLICATIONS === "undefined") return;

  list.innerHTML = PUBLICATIONS.map((pub, i) => {
    const statusClass = pub.url ? "" : " soon";
    const action = pub.url
      ? `<a class="publication-link" href="${escapeAttr(pub.url)}" target="_blank" rel="noopener noreferrer">Su Amazon</a>`
      : `<span class="publication-status${statusClass}">${escapeHtml(pub.status || "In arrivo")}</span>`;

    return `
      <article class="publication reveal-item" style="transition-delay: ${i * 0.12}s">
        <span class="publication-year">${escapeHtml(pub.year || "")}</span>
        <div class="publication-body">
          <h3>${escapeHtml(pub.title)}</h3>
          <p>${escapeHtml(pub.description)}</p>
        </div>
        ${action}
      </article>
    `;
  }).join("");

  observeReveal(".publication.reveal-item");
}

function renderContacts() {
  const container = document.getElementById("contact-links");
  if (!container || typeof SITE === "undefined") return;

  const items = [];

  if (SITE.email) {
    items.push(`<a href="mailto:${escapeAttr(SITE.email)}">✉ ${escapeHtml(SITE.email)}</a>`);
  }

  (SITE.links || []).forEach((link) => {
    const icon = link.label === "GitHub" ? "⌘" : link.label === "LinkedIn" ? "◆" : "→";
    items.push(`<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${icon} ${escapeHtml(link.label)}</a>`);
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
  const navLinks = nav?.querySelectorAll("a") ?? [];

  toggle?.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav?.classList.toggle("open");
    document.body.style.overflow = expanded ? "" : "hidden";
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggle?.setAttribute("aria-expanded", "false");
      nav?.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 20);
    updateActiveNav();
  }, { passive: true });
}

function updateActiveNav() {
  const sections = ["progetti", "pubblicazioni", "ripetizioni", "contatti"];
  const scrollPos = window.scrollY + 120;

  let current = "";
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollPos) current = id;
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === current);
  });
}

function observeReveal(selector) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  elements.forEach((el) => observer.observe(el));
}

function setupReveal() {
  observeReveal(".reveal");
}

function setupCursorGlow() {
  const glow = document.querySelector(".cursor-glow");
  if (!glow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 768px)").matches) return;

  let raf;
  document.addEventListener("mousemove", (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    });
  }, { passive: true });
}

function setupParallaxOrbs() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const orbs = document.querySelectorAll(".orb");
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    orbs.forEach((orb, i) => {
      orb.style.transform = `translateY(${y * (0.03 + i * 0.02)}px)`;
    });
  }, { passive: true });
}

document.getElementById("year").textContent = new Date().getFullYear();
renderProjects();
renderPublications();
renderContacts();
setupNavigation();
setupReveal();
setupCursorGlow();
setupParallaxOrbs();
