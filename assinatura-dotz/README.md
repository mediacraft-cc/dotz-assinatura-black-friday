# Assinatura de e-mail Dotz · Black Friday

- `index.html` — gerador: edite nome, cargo e e-mail e clique em **Copiar assinatura (Gmail)**.
- `assinatura.html` — assinatura pronta (HTML estático, 600 × 150px, compatível com Gmail).
- `img/` — PNGs em 3x usados pela assinatura (o Gmail não exibe SVG).
- `img/black-friday.gif` — card Black Friday animado (o botão da logo liga e desliga), usado na assinatura.
- `src/` — SVGs originais. Para regenerar os PNGs: `node build.mjs` (requer Playwright).

As imagens são carregadas de `raw.githubusercontent.com/mediacraft-cc/buscador-de-imagens/main`. Por isso o repositório precisa continuar público.
Se o repositório ou a branch mudar de nome, atualize as URLs `src` em `assinatura.html` e `index.html`.

As assinaturas coladas antes de 2026-11-09 apontam para a branch antiga `claude/upbeat-cray-3h32de` na conta `uxrafa`. Não apague essa branch, senão as imagens delas somem.

Para regenerar o GIF animado: `node animacao.mjs && python3 gif.py` (requer Playwright e Pillow).
