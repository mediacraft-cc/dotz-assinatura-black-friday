// Gera os PNGs da assinatura (Gmail não renderiza SVG) a partir dos SVGs em ./src.
// Uso: node build.mjs   (requer playwright + chromium)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const dir = new URL('.', import.meta.url).pathname;
const svg = (name) => readFileSync(`${dir}src/${name}.svg`, 'utf8');
const inner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const viewBox = (s) => s.match(/viewBox="([^"]+)"/)[1];

const ORANGE = '#FF4F0E';
const W = 507;          // largura do card da esquerda
const SLICE_H = 150;    // altura da fatia superior (resto é HTML)
const BORDER = 2;

// Polígono arredondado: insere o polígono em r e desenha com stroke 2r + linejoin round.
function roundedPoly(points, r, fill) {
  const d = 'M' + points.map(([x, y]) => `${x},${y}`).join(' L') + ' Z';
  return `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="${2 * r}" stroke-linejoin="round"/>`;
}

// Faixa laranja: y = 39 + 0.16x na borda inferior.
function orangeShape() {
  const r = 9, m = 0.16, b = 39, k = Math.hypot(1, m);
  const yb = (x) => b + m * x - k * r;
  return roundedPoly([[r, r], [W - r, r], [W - r, yb(W - r)], [r, yb(r)]], r, ORANGE);
}

// Card preto: borda superior y = 56.7 + 0.1533x, contorno laranja de 2px.
function blackCard() {
  const m = 0.1533, b = 56.7, k = Math.hypot(1, m), bottom = SLICE_H + 60;
  const shape = (inset, r, fill) => {
    const i = inset + r;
    const yt = (x) => b + m * x + k * i;
    return roundedPoly([[i, yt(i)], [W - i, yt(W - i)], [W - i, bottom], [i, bottom]], r, fill);
  };
  return shape(0, 9, ORANGE) + shape(BORDER, 7, '#000');
}

const dotz = svg('dotz-logo');
const top = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${SLICE_H}" viewBox="0 0 ${W} ${SLICE_H}">
  ${orangeShape()}
  ${blackCard()}
  <svg x="401" y="21" width="84" height="27" viewBox="${viewBox(dotz)}">${inner(dotz)}</svg>
</svg>`;

const bf = svg('black-friday-logo');
const RW = 384, RH = 225;
const right = `<svg xmlns="http://www.w3.org/2000/svg" width="${RW}" height="${RH}" viewBox="0 0 ${RW} ${RH}">
  <rect x="0.5" y="0.5" width="${RW - 1}" height="${RH - 1}" rx="9.5" fill="${ORANGE}"/>
  <rect x="${BORDER}" y="${BORDER}" width="${RW - 2 * BORDER}" height="${RH - 2 * BORDER}" rx="7.5" fill="#000"/>
  <svg x="53" y="56" width="277" height="113" viewBox="${viewBox(bf)}">${inner(bf)}</svg>
</svg>`;

const icon = (name) => {
  const s = svg(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="${viewBox(s)}" preserveAspectRatio="xMidYMid meet">${inner(s)}</svg>`;
};

const jobs = [
  ['topo', top, W, SLICE_H],
  ['black-friday', right, RW, RH],
  ['facebook', icon('facebook'), 18, 18],
  ['instagram', icon('instagram'), 18, 18],
  ['linkedin', icon('linkedin'), 18, 18],
  ['youtube', icon('youtube'), 18, 18],
];

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const [name, markup, w, h] of jobs) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  await page.screenshot({ path: `${dir}img/${name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('ok', name);
}
await browser.close();
