# Portfolio — Simone Conca

Sito personale statico, pronto per [GitHub Pages](https://pages.github.com/).
Design *editorial-tech*: tipografia Fraunces + Inter + JetBrains Mono, tema
chiaro/scuro con toggle (segue di default le preferenze di sistema), zero
dipendenze e zero framework.

## Contenuti

Modifica **`js/content.js`** per aggiornare:

- email e link social (`SITE`)
- elenco progetti (`PROJECTS`)
- pubblicazioni / manuali Amazon (`PUBLICATIONS`)

Ogni voce è commentata: salva il file e ricarica la pagina, niente da compilare.
I testi fissi (hero, chi sono, ripetizioni) sono in `index.html`.

## Anteprima in locale

Apri `index.html` nel browser, oppure avvia un server locale con Python:

```bash
python -m http.server 5050
```

…poi vai su `http://localhost:5050`. (In alternativa `npx serve .` se hai Node.)

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
├── index.html       ← struttura e testi fissi
├── css/styles.css   ← design (tema chiaro/scuro)
├── js/
│   ├── content.js   ← dati da aggiornare (progetti, manuali, contatti)
│   └── main.js      ← render + interazioni (tema, nav, animazioni)
├── CNAME            ← dominio custom (simoneconca.it)
└── .nojekyll
```
