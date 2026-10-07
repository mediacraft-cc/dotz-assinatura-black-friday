# Assinatura de e-mail Dotz · Black Friday

- `index.html` — gerador: edite nome, cargo e e-mail e clique em **Copiar assinatura (Gmail)**.
- `assinatura.html` — assinatura pronta (HTML estático, compatível com Gmail).
- `img/` — PNGs em 2x usados pela assinatura (o Gmail não exibe SVG).
- `src/` — SVGs originais. Para regenerar os PNGs: `node build.mjs` (requer Playwright).

As imagens são carregadas de `raw.githubusercontent.com` a partir da branch `claude/upbeat-cray-3h32de`.
Se a branch for renomeada/apagada, atualize as URLs `src` em `assinatura.html` e `index.html`.
