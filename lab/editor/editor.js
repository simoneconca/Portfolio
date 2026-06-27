/* ============================================================
   editor.js — Editor HTML/CSS dal vivo
   Scrivi HTML e CSS, vedi il risultato in tempo reale in un
   iframe isolato (sandbox). Zero backend.
   ============================================================ */
(function () {
  "use strict";

  const htmlEl = document.getElementById("edHtml");
  const cssEl = document.getElementById("edCss");
  const frame = document.getElementById("edFrame");

  const EXAMPLE_HTML =
    "<h1>Ciao, mondo! 👋</h1>\n" +
    "<p>Questa è la mia prima pagina. Cambia il testo o il CSS e guarda cosa succede.</p>\n" +
    "<button class=\"bottone\">Cliccami</button>\n" +
    "<ul>\n  <li>Primo</li>\n  <li>Secondo</li>\n  <li>Terzo</li>\n</ul>";

  const EXAMPLE_CSS =
    "body {\n" +
    "  font-family: system-ui, sans-serif;\n" +
    "  color: #222;\n" +
    "  background: #f4f1ea;\n" +
    "  padding: 1.5rem;\n" +
    "}\n" +
    "h1 { color: #2c45ff; }\n" +
    ".bottone {\n" +
    "  background: #2c45ff;\n" +
    "  color: white;\n" +
    "  border: 0;\n" +
    "  padding: 0.6rem 1.2rem;\n" +
    "  border-radius: 8px;\n" +
    "  cursor: pointer;\n" +
    "}\n" +
    ".bottone:hover { background: #1f33cc; }";

  function render() {
    const doc =
      "<!doctype html><html lang=\"it\"><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      "<style>" + cssEl.value + "</style></head><body>" + htmlEl.value + "</body></html>";
    frame.srcdoc = doc;
  }

  let t = null;
  function schedule() { clearTimeout(t); t = setTimeout(render, 200); }

  htmlEl.addEventListener("input", schedule);
  cssEl.addEventListener("input", schedule);

  // Tab inserisce due spazi invece di spostare il focus
  [htmlEl, cssEl].forEach((area) => {
    area.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const s = area.selectionStart, en = area.selectionEnd;
        area.value = area.value.slice(0, s) + "  " + area.value.slice(en);
        area.selectionStart = area.selectionEnd = s + 2;
        schedule();
      }
    });
  });

  document.getElementById("edReset").addEventListener("click", () => {
    htmlEl.value = EXAMPLE_HTML; cssEl.value = EXAMPLE_CSS; render();
  });
  document.getElementById("edClear").addEventListener("click", () => {
    htmlEl.value = ""; cssEl.value = ""; render();
  });

  // avvio
  htmlEl.value = EXAMPLE_HTML;
  cssEl.value = EXAMPLE_CSS;
  render();
})();
