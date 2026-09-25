// creature.js — the orange creature on the farm's sign, and the sign itself.
// The story only says: a square body, two square eyes, what might be four legs.
// This one is the film's own: a block of orange with a sprout on its head and no claws,
// its legs not quite even. (The picture in the original post is of another creature.)
import { R, piece, cello } from './render.js';
import { cutShape } from './cut.js';
import { hs, hash, mixHex } from './util.js';
import { F } from './fonts.js';
import { SIGN } from './text.js';

// 11 x 9 pixels: G sprout, O body, K eye. Wider than it is tall; the legs don't quite match.
export const PIX = [
  '.......G.G.',
  '........G..',
  '.OOOOOOOOO.',
  '.OOOOOOOOO.',
  '.OKOOOOOKO.',
  '.OOOOOOOOO.',
  '.OOOOOOOOO.',
  '.O.O..O..O.',
  '.O....O..O.',
];
export const ORANGE = '#e0703f';
export const SPROUT = '#6aa55a';

// Draw the creature as printed ink: cell = pixel size, (x, y) = its centre.
// o.fade 0..1 (sun-faded), o.misreg (a printer's slight misregistration)
export function creatureInk(c, x, y, cell, o = {}) {
  const { fade = 0, alpha = 1 } = o;
  const w = PIX[0].length, h = PIX.length;
  const x0 = x - (w * cell) / 2, y0 = y - (h * cell) / 2;
  const cols = { G: mixHex(SPROUT, '#bcd6c4', fade * 0.9), O: mixHex(ORANGE, '#f2c6aa', fade * 0.75), K: '#1d1a18' };
  c.save();
  c.globalAlpha *= alpha;
  for (const ch of ['G', 'O', 'K']) {
    c.fillStyle = cols[ch];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (PIX[j][i] !== ch) continue;
      // cells overlap a hair so the print has no seams
      c.fillRect(x0 + i * cell - 0.3, y0 + j * cell - 0.3, cell + 0.6, cell + 0.6);
    }
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// The sign: a sheet of A4 in a laminate pouch, pinned to the post.
// Sign-local coordinates: 0..SW across, 0..SH down (world units; drawn at any scale).
export const SW = 84, SH = 118;
let SHAPES = null;
function shapes() {
  if (SHAPES) return SHAPES;
  const pouch = [[-3, -3], [SW + 3, -3], [SW + 3, SH + 3], [-3, SH + 3]];
  const sheet = [[0, 0], [SW, 0], [SW, SH], [0, SH]];
  SHAPES = {
    pouch: cutShape(pouch, 901, { jag: 0.05, wander: 0.1, step: 20, corner: 0.2 }),
    sheet: cutShape(sheet, 902, { jag: 0.02, wander: 0.05, step: 30, corner: 0.05, raw: true }),
  };
  return SHAPES;
}

// What is printed on the sheet (drawn inside a print callback; sheet-local units).
export function signPrint(c, o = {}) {
  const { fade = 0 } = o;
  c.save();
  c.globalCompositeOperation = 'multiply';
  // headline in a handwriting-style typeface
  c.fillStyle = mixHex('#1c1a18', '#6a6660', fade * 0.5);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `600 10.6px ${F.hand}`;
  c.fillText(SIGN.head, SW / 2, 13);
  // the green line under it
  c.strokeStyle = mixHex('#7fbf4a', '#a9d3d8', fade);
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(9, 22);
  for (let x = 9; x <= SW - 9; x += 4) c.lineTo(x, 22 + Math.sin(x * 0.2) * 0.35);
  c.stroke();
  c.restore();
  creatureInk(c, SW / 2, 51, 4.2, { fade });
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = mixHex('#26231f', '#77736b', fade * 0.5);
  c.font = `400 5.1px ${F.hand}`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  SIGN.lines.forEach((l, i) => c.fillText(l, 9, 84 + i * 9.5));
  // a small pair of seed leaves beside the last line
  c.strokeStyle = mixHex('#5f9a48', '#9fc8c8', fade);
  c.lineWidth = 0.8;
  c.lineJoin = 'round';
  const lx = SW - 13, ly = 104;
  c.beginPath();
  c.moveTo(lx, ly + 6); c.lineTo(lx, ly);
  c.moveTo(lx, ly); c.quadraticCurveTo(lx - 6, ly - 1, lx - 7, ly - 5); c.quadraticCurveTo(lx - 2, ly - 5, lx, ly);
  c.moveTo(lx, ly); c.quadraticCurveTo(lx + 6, ly - 2, lx + 7, ly - 6); c.quadraticCurveTo(lx + 2, ly - 6, lx, ly);
  c.stroke();
  c.restore();
}

// The sign on its post. (x, y) = top-left of the sheet in world units; s = scale.
// o.fade 0..1, o.lamCloud 0..1 (the laminate going milky), o.lift
export function sign(x, y, s = 1, o = {}) {
  const S = shapes();
  const { fade = 0, lamCloud = 0, r = 0, lift = 3, sway = 0 } = o;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  if (r || sway) ctx.rotate(r + sway);
  ctx.scale(s, s);
  // the laminate pouch (clear, a little proud of the sheet)
  piece(S.pouch, { color: '#f4f6f4', tex: null, lift, edge: 0.4, alpha: 0.96 });
  piece(S.sheet, { color: mixHex('#fbfaf5', '#f1ede2', fade), tex: 'plain', ts: 0.2, lift: 0.5, shadowK: 0, edge: 0, print: (c) => signPrint(c, { fade }) });
  // gloss and scratches of the laminate
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const g = ctx.createLinearGradient(0, 0, SW, SH);
  g.addColorStop(0.12, 'rgba(255,255,255,0)');
  g.addColorStop(0.2, `rgba(255,255,255,${0.28 - lamCloud * 0.1})`);
  g.addColorStop(0.3, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-3, -3, SW + 6, SH + 6);
  if (lamCloud > 0) {
    ctx.fillStyle = `rgba(235,238,236,${0.32 * lamCloud})`;
    ctx.fillRect(-3, -3, SW + 6, SH + 6);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 * lamCloud})`;
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const sx = hash('scr', i) * SW, sy = hash('scy', i) * SH, l = 4 + hash('scl', i) * 16, a = hs('sca', i) * 1.2;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l);
    }
    ctx.stroke();
  }
  ctx.restore();
  // two drawing pins
  for (const [px, py] of [[6, 5], [SW - 6, 5]]) {
    ctx.fillStyle = '#b8342c';
    ctx.beginPath();
    ctx.arc(px, py, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(px - 0.7, py - 0.8, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
