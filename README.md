# Portfolio — Simone Conca

Sito personale statico, pronto per [GitHub Pages](https://pages.github.com/).

## Contenuti

Modifica **`js/content.js`** per aggiornare:

- email e link social
- elenco progetti
- pubblicazioni (manuali Amazon)

Il resto del sito (testi fissi in `index.html`) puoi cambiarlo lì direttamente.

## Anteprima in locale

Apri `index.html` nel browser, oppure avvia un server locale:

```bash
npx serve .
```

## Pubblicazione su GitHub Pages

1. Crea un repository su GitHub (es. `simone-conca.github.io` o `portfolio`).
2. Carica i file e fai push sul branch `main`.
3. Su GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)**
4. Dopo qualche minuto il sito sarà online.

### Dominio personalizzato

1. Crea un file **`CNAME`** nella root con il tuo dominio (es. `www.simoneconca.it`).
2. Nel pannello del tuo registrar, aggiungi i record DNS indicati da GitHub:
   - per apex (`simoneconca.it`): record **A** verso gli IP di GitHub Pages
   - per sottodominio (`www`): record **CNAME** verso `TUO-USERNAME.github.io`
3. Su GitHub Pages, abilita **Enforce HTTPS**.

Documentazione: [Custom domains for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## Struttura

```
├── index.html
├── css/styles.css
├── js/
│   ├── content.js   ← dati da aggiornare
│   └── main.js
├── CNAME            ← opzionale, solo con dominio custom
└── .nojekyll
```
