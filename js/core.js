/* ============================================================
   core.js — comportamenti condivisi (sito + portale Lab)
   Tema chiaro/scuro, navigazione, reveal allo scroll, utility.
   Caricato su ogni pagina. La home aggiunge js/main.js.
   ============================================================ */

/* ---------- Utility ---------- */
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

/* ---------- Reveal allo scroll ---------- */
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

// Evidenzia la voce di menu della sezione corrente (solo se esistono le sezioni)
function updateActiveNav() {
  const links = document.querySelectorAll(".nav a[data-section]");
  if (!links.length) return;
  const pos = window.scrollY + 140;
  let current = "";
  links.forEach((link) => {
    const el = document.getElementById(link.dataset.section);
    if (el && el.offsetTop <= pos) current = link.dataset.section;
  });
  links.forEach((link) => link.classList.toggle("active", link.dataset.section === current));
}

/* ---------- Init condiviso ---------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

setupTheme();
setupNavigation();
observeReveal(".reveal");
