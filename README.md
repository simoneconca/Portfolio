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

