// Gera img/black-friday.gif: o "boolean" da logo Black Friday ligando e desligando.
// O Gmail não roda CSS/SVG animado, por isso a animação vira GIF.
// Uso: node animacao.mjs && python3 gif.py
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const dir = new URL('.', import.meta.url).pathname;
const framesDir = `${dir}.frames`;
const src = readFileSync(`${dir}src/black-friday-logo.svg`, 'utf8');
// Os paths 8 e 9 preenchem um recorte do "D"; um traço fino da mesma cor esconde a emenda (linha cinza) entre eles.
const sealSeams = (s) => { let i = -1; return s.replace(/<path /g, (m) => (++i === 8 || i === 9 ? '<path stroke="white" stroke-width="0.6" stroke-linejoin="round" ' : m)); };
const paths = sealSeams(src).match(/<path [^>]*\/>/g);

// Índices dos paths no SVG original.
const PILL = 16;                 // pílula branca com furo para o botão
const KNOB = [11, 12, 13, 14, 15]; // círculo laranja + sombra + "DZ"
const letters = paths.filter((_, i) => i !== PILL && !KNOB.includes(i)).join('');
const knob = KNOB.map((i) => paths[i]).join('');

// Geometria medida no viewBox da logo (186 x 76).
const pill = { x: 126.75, y: 0.12, w: 58.25, h: 28.8 };
const hole = { cx: 171.12, cy: 15, r: 12.25 };   // furo = espaço preto em volta do botão
const OFF_DX = -30.5;                            // deslocamento até a posição "desligado"

const ORANGE = '#FF4F0E';
const SCALE = 600 / 900;
const RW = 384, RH = 225, BORDER = 1.5;

const mix = (a, b, t) => Math.round(a + (b - a) * t);
const grey = (t) => { const v = mix(255, 214, t); return `rgb(${v},${v},${v})`; };

// t = 0 → ligado (botão à direita), t = 1 → desligado (botão à esquerda, pílula levemente acinzentada)
function card(t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${RW * SCALE}" height="${RH * SCALE}" viewBox="0 0 ${RW} ${RH}">
  <rect x="0" y="0" width="${RW}" height="${RH}" rx="10" fill="${ORANGE}"/>
  <rect x="${BORDER}" y="${BORDER}" width="${RW - 2 * BORDER}" height="${RH - 2 * BORDER}" rx="8" fill="#000"/>
  <svg x="53" y="56" width="277" height="113" viewBox="0 0 186 76">
    ${letters}
    <rect x="${pill.x}" y="${pill.y}" width="${pill.w}" height="${pill.h}" rx="${pill.h / 2}" fill="${grey(t)}"/>
    <g transform="translate(${OFF_DX * t} 0)">
      <circle cx="${hole.cx}" cy="${hole.cy}" r="${hole.r}" fill="#000"/>
      ${knob}
    </g>
  </svg>
</svg>`;
}

// Curva suave (ease-in-out) para o deslize.
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const STEP = 40;          // ms por quadro na transição
const MOVE = 14;          // quadros por transição (~0,56s)
const HOLD_ON = 1600;     // ms parado ligado
const HOLD_OFF = 1000;    // ms parado desligado

const frames = [];
frames.push({ t: 0, ms: HOLD_ON });
for (let i = 1; i < MOVE; i++) frames.push({ t: ease(i / MOVE), ms: STEP });
frames.push({ t: 1, ms: HOLD_OFF });
for (let i = 1; i < MOVE; i++) frames.push({ t: 1 - ease(i / MOVE), ms: STEP });

rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir);
const DPR = 2;
const w = RW * SCALE, h = RH * SCALE;
const browser = await playwright.chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: DPR, viewport: { width: w, height: h } });
const list = [];
for (const [i, f] of frames.entries()) {
  await page.setContent(`<html><body style="margin:0;background:transparent">${card(f.t)}</body></html>`);
  const file = `${framesDir}/${String(i).padStart(3, '0')}.png`;
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  list.push({ file, ms: f.ms });
}
await browser.close();
writeFileSync(`${framesDir}/frames.json`, JSON.stringify(list));
console.log(`${list.length} quadros em ${framesDir}`);
