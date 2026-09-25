// textures.js — the paper everything is cut from.
// Paper textures are neutral (near-white paper + dark ink). A piece is tinted by
// filling its own colour first and multiplying the texture on top.
// The people's rooms are printed with the original story; the farm is printed with
// its own operation log — the days it spent running with no one there.

import { rng, canvas } from './util.js';
import { F } from './fonts.js';
import { CORPUS, LOG } from './text.js';

export const TEX = {};
export const TS = 1024;
export const GRAIN = [];
export let CRINKLE = null;
export let VIGNETTE = null;

// Tileable value noise (size must be a multiple of cell).
function noiseField(size, cell, r) {
  const g = Math.round(size / cell);
  const grid = new Float32Array(g * g);
  for (let i = 0; i < grid.length; i++) grid[i] = r() * 2 - 1;
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const gy = y / cell, iy = Math.floor(gy), fy = gy - iy, sy = fy * fy * (3 - 2 * fy);
    const y0 = (iy % g) * g, y1 = ((iy + 1) % g) * g;
    for (let x = 0; x < size; x++) {
      const gx = x / cell, ix = Math.floor(gx), fx = gx - ix, sx = fx * fx * (3 - 2 * fx);
      const x0 = ix % g, x1 = (ix + 1) % g;
      const a = grid[y0 + x0], b = grid[y0 + x1], c = grid[y1 + x0], d = grid[y1 + x1];
      const top = a + (b - a) * sx, bot = c + (d - c) * sx;
      out[y * size + x] = top + (bot - top) * sy;
    }
  }
  return out;
}

function basePaper(seed, fibres = 1, longFibres = false) {
  const r = rng(seed);
  const c = canvas(TS, TS), g = c.getContext('2d');
  const img = g.createImageData(TS, TS), d = img.data;
  const n1 = noiseField(TS, 128, r), n2 = noiseField(TS, 32, r), n3 = noiseField(TS, 8, r);
  const tone = [243, 239, 231];
  for (let i = 0, p = 0; i < TS * TS; i++, p += 4) {
    const v = 1 + n1[i] * 0.025 + n2[i] * 0.017 + n3[i] * 0.02 + (r() - 0.5) * 0.05;
    d[p] = tone[0] * v;
    d[p + 1] = tone[1] * v;
    d[p + 2] = tone[2] * v;
    d[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Fibres, wrapped so the tile stays seamless.
  g.lineCap = 'round';
  const n = Math.floor(1500 * fibres);
  for (let i = 0; i < n; i++) {
    const x = r() * TS, y = r() * TS, a = r() * Math.PI * 2;
    const l = (4 + r() * 22) * (longFibres ? 1 + r() * 2.2 : 1);
    const light = r() < 0.6;
    g.strokeStyle = light ? `rgba(255,253,248,${0.3 + r() * 0.45})` : `rgba(110,92,74,${0.05 + r() * 0.09})`;
    g.lineWidth = 0.35 + r() * (longFibres ? 1.1 : 0.8);
    const bend = (r() - 0.5) * 1.4;
    for (const ox of [-TS, 0, TS]) for (const oy of [-TS, 0, TS]) {
      const X = x + ox, Y = y + oy;
      if (X < -80 || X > TS + 80 || Y < -80 || Y > TS + 80) continue;
      g.beginPath();
      g.moveTo(X, Y);
      g.quadraticCurveTo(X + Math.cos(a + bend) * l * 0.5, Y + Math.sin(a + bend) * l * 0.5, X + Math.cos(a) * l, Y + Math.sin(a) * l);
      g.stroke();
    }
  }
  return c;
}

// Copy a base sheet with a flip/rotation so every texture's fibres differ.
function derive(base, variant) {
  const c = canvas(TS, TS), g = c.getContext('2d');
  g.translate(TS / 2, TS / 2);
  g.rotate((variant % 4) * Math.PI / 2);
  if (variant & 4) g.scale(-1, 1);
  g.drawImage(base, -TS / 2, -TS / 2);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

const INK = 0.86;
const ink = (a, c = [58, 47, 40]) => `rgba(${c[0]},${c[1]},${c[2]},${a * INK})`;
const any = (r, arr) => arr[Math.floor(r() * arr.length)];

// Vertical Japanese text, right to left — the pages of the original story.
function printTate(g, r, pool = CORPUS.novel, size = 19) {
  g.globalCompositeOperation = 'multiply';
  const colW = Math.round(size * 1.7);
  g.font = `400 ${size}px ${F.mincho}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let x = TS - 16; x > -colW; x -= colW) {
    let y = 16 + (r() < 0.25 ? size * 2 : 0);
    g.fillStyle = ink(0.48 + r() * 0.38);
    while (y < TS + size) {
      const s = any(r, pool).replace(/[「」]/g, '');
      for (const ch of s) {
        if (y > TS + size) break;
        if ('、。'.includes(ch)) g.fillText(ch, x + size * 0.55, y - size * 0.5);
        else if ('ー〜…：'.includes(ch)) {
          g.save(); g.translate(x, y); g.rotate(Math.PI / 2); g.fillText(ch, 0, 0); g.restore();
        } else g.fillText(ch, x, y);
        y += size * 1.07;
      }
      if (r() < 0.35) y += size;
    }
  }
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
}

// The farm's operation log, one line per event, printed pale in machine type.
function printLog(g, r, size = 15) {
  g.globalCompositeOperation = 'multiply';
  g.font = `400 ${size}px ${F.mono}`;
  g.textBaseline = 'middle';
  const lh = Math.round(size * 1.62);
  let mo = 3, dd = 21, mins = 5 * 60 + 40;
  const pad = (n) => String(n).padStart(2, '0');
  for (let y = 12; y < TS + lh; y += lh) {
    mins += 7 + Math.floor(r() * 50);
    if (mins >= 24 * 60) { mins -= 24 * 60; dd++; if (dd > 30) { dd = 1; mo++; } }
    const act = any(r, LOG.acts);
    const par = r() < 0.7 ? any(r, LOG.params) : '';
    const line = `${pad(mo)}-${pad(dd)} ${pad(Math.floor(mins / 60))}:${pad(mins % 60)}　自動　${act}　${par}`;
    g.fillStyle = ink(0.13 + r() * 0.13, [40, 44, 52]);
    // lines run off the tile and continue on the other side, so the pattern stays seamless
    const x0 = 14 - r() * 40;
    g.fillText(line, x0, y);
    g.fillText(line, x0 - TS, y);
    const w = g.measureText(line).width;
    if (x0 + w < TS - 40) {
      const more = `　${any(r, LOG.acts)}　${any(r, LOG.params)}`;
      g.fillText(more, x0 + w, y);
    }
    if (r() < 0.06) y += lh * 0.6;
  }
}

// Wood-grain print for desks, posts, floors and the veranda.
function printWood(g, r) {
  g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 90; i++) {
    const y0 = r() * TS, amp = 3 + r() * 10, ph = r() * 6, per = 180 + r() * 400;
    g.strokeStyle = `rgba(90,60,40,${0.06 + r() * 0.12})`;
    g.lineWidth = 0.6 + r() * 2.2;
    for (const oy of [-TS, 0, TS]) {
      g.beginPath();
      for (let x = 0; x <= TS; x += 16) {
        const y = y0 + oy + Math.sin((x / TS) * Math.PI * 2 * Math.round(TS / per) + ph) * amp;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
}

// Corrugated tin: soft light-dark bands, with a little rust.
function printTin(g, r) {
  g.globalCompositeOperation = 'multiply';
  const P = 32;
  for (let x = 0; x < TS; x += P) {
    const gr = g.createLinearGradient(x, 0, x + P, 0);
    gr.addColorStop(0, 'rgba(60,64,74,0.34)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0)');
    gr.addColorStop(0.55, 'rgba(255,255,255,0)');
    gr.addColorStop(1, 'rgba(60,64,74,0.34)');
    g.fillStyle = gr;
    g.fillRect(x, 0, P, TS);
  }
  for (let i = 0; i < 260; i++) {
    const x = r() * TS, y = r() * TS, l = 4 + r() * 40;
    g.fillStyle = `rgba(150,80,40,${0.04 + r() * 0.12})`;
    g.fillRect(x, y, 1 + r() * 3, l);
  }
}

// Concrete blocks with mortar lines.
function printBlock(g, r) {
  g.globalCompositeOperation = 'multiply';
  const bw = 128, bh = 64;
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(70,70,74,${0.04 + r() * 0.14})`;
    const s = 0.8 + r() * 2.4;
    g.fillRect(r() * TS, r() * TS, s, s);
  }
  g.strokeStyle = 'rgba(60,58,60,0.42)';
  g.lineWidth = 3;
  for (let y = 0, row = 0; y <= TS; y += bh, row++) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(TS, y); g.stroke();
    const off = row % 2 ? bw / 2 : 0;
    for (let x = off; x <= TS; x += bw) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + bh); g.stroke(); }
  }
}

// Soil: clods, specks and the odd pale stone.
function printSoil(g, r) {
  g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 2600; i++) {
    const x = r() * TS, y = r() * TS, s = 2 + r() * 9;
    g.fillStyle = `rgba(70,50,36,${0.05 + r() * 0.16})`;
    g.beginPath();
    g.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,250,240,${0.1 + r() * 0.25})`;
    g.fillRect(r() * TS, r() * TS, 1 + r() * 2, 1 + r() * 2);
  }
}

// Gravel: a crowd of small stones.
function printGravel(g, r) {
  for (let i = 0; i < 5200; i++) {
    const x = r() * TS, y = r() * TS, s = 2 + r() * 7;
    const v = r();
    g.globalCompositeOperation = v < 0.6 ? 'multiply' : 'source-over';
    g.fillStyle = v < 0.6 ? `rgba(80,76,72,${0.12 + r() * 0.3})` : `rgba(255,252,246,${0.15 + r() * 0.3})`;
    g.beginPath();
    g.ellipse(x, y, s, s * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
}

// Straw weave (the hat) and the rush of a tatami edge.
function printStraw(g, r) {
  g.globalCompositeOperation = 'multiply';
  const P = 14;
  for (let y = 0; y < TS; y += P) {
    for (let x = 0; x < TS; x += P) {
      const k = ((x / P) + (y / P)) % 2;
      g.fillStyle = `rgba(120,90,40,${k ? 0.16 : 0.05 + r() * 0.05})`;
      g.fillRect(x, y, P, P);
    }
  }
  g.strokeStyle = 'rgba(110,80,40,0.18)';
  g.lineWidth = 1;
  for (let y = 0; y < TS; y += 4) { g.beginPath(); g.moveTo(0, y + r()); g.lineTo(TS, y + r()); g.stroke(); }
}

// Fine weave for cloth (shirts, trousers, the towel).
function printCloth(g, r) {
  g.globalCompositeOperation = 'multiply';
  g.lineWidth = 1;
  for (let y = 0; y < TS; y += 3) {
    g.strokeStyle = `rgba(60,60,70,${0.04 + r() * 0.05})`;
    g.beginPath(); g.moveTo(0, y); g.lineTo(TS, y); g.stroke();
  }
  for (let x = 0; x < TS; x += 3) {
    g.strokeStyle = `rgba(60,60,70,${0.03 + r() * 0.04})`;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TS); g.stroke();
  }
}

// ---------------------------------------------------------------------------
// Film: a mid-grey sheet of creases, used with 'overlay' (grey = no change).
// Here it is the plastic of the vegetable bags and the laminate of the sign.
function makeCrinkle() {
  const S = 512, r = rng(313);
  const c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = 'rgb(128,128,128)';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) {
    const x = r() * S, y = r() * S, a = r() * Math.PI, l = 30 + r() * 150;
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const X = x + ox, Y = y + oy;
      if (X < -200 || X > S + 200 || Y < -200 || Y > S + 200) continue;
      const grd = g.createLinearGradient(X - dy * 0.06, Y + dx * 0.06, X + dy * 0.06, Y - dx * 0.06);
      const k = 0.1 + r() * 0.22;
      grd.addColorStop(0, `rgba(255,255,255,0)`);
      grd.addColorStop(0.48, `rgba(255,255,255,${k})`);
      grd.addColorStop(0.52, `rgba(0,0,0,${k * 0.8})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.strokeStyle = grd;
      g.lineWidth = 3 + r() * 9;
      g.beginPath();
      g.moveTo(X - dx / 2, Y - dy / 2);
      g.lineTo(X + dx / 2, Y + dy / 2);
      g.stroke();
    }
  }
  CRINKLE = c;
}

function makeGrainTiles() {
  for (let k = 0; k < 4; k++) {
    const r = rng(900 + k);
    const c = canvas(256, 256), g = c.getContext('2d');
    const img = g.createImageData(256, 256), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 128 + ((r() + r() + r()) / 3 - 0.5) * 150;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    GRAIN.push(c);
  }
}

function makeVignette() {
  const c = canvas(640, 360), g = c.getContext('2d');
  const gr = g.createRadialGradient(320, 175, 60, 320, 180, 390);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.55, '#f7f3ee');
  gr.addColorStop(1, '#6b6358');
  g.fillStyle = gr;
  g.fillRect(0, 0, 640, 360);
  VIGNETTE = c;
}

export function buildTextures(progress = () => {}) {
  const base = basePaper(7, 1);
  const washi = basePaper(19, 2.6, true);
  TEX.plain = base;
  TEX.washi = washi;
  const printers = {
    tate: (g, r) => printTate(g, r),
    tateS: (g, r) => printTate(g, r, CORPUS.novel, 13),
    log: (g, r) => printLog(g, r, 12),
    logS: (g, r) => printLog(g, r, 9),
    wood: printWood,
    tin: printTin,
    block: printBlock,
    soil: printSoil,
    gravel: printGravel,
    straw: printStraw,
    cloth: printCloth,
  };
  const count = Object.keys(printers).length;
  let v = 1;
  for (const [name, fn] of Object.entries(printers)) {
    const c = derive(v % 2 ? base : washi, v);
    const g = c.getContext('2d');
    fn(g, rng(100 + v));
    g.globalCompositeOperation = 'source-over';
    TEX[name] = c;
    progress((v / count) * 0.9);
    v++;
  }
  makeCrinkle();
  progress(1);
  makeGrainTiles();
  makeVignette();
}
