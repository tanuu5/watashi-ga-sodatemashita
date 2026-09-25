// sets/desk.js — Kido's desk, seen from above. Paper comes and goes on it.
// The office faces west: after four in June the sun reaches the desk through the blinds,
// in warm stripes. Scale: 1 unit = half a millimetre (the frame is about 80 cm across).
import { R, withCam, piece, stillPiece, lights, bloomFlush, glow, pat, setPat, layer } from '../render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from '../cut.js';
import { hash, hs, rng, mixHex, lerp, clamp, boil } from '../util.js';
import { F } from '../fonts.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.25, wander: 0.6, step: 16, corner: 0.35, ...o });
const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };
export const sheetShape = (w, h, seed = 1) => memo(`sheet${w}x${h}#${seed}`, () => cs(rectPts(w, h, 0, 0), 3000 + seed, { jag: 0.15, wander: 0.35, step: 24, corner: 0.25 }));

let S = null;
function build() {
  S = {
    top: cs(rectPts(3200, 2000, 800, 450), 1, { jag: 0.2 }),
    mat: cs(rectPts(1180, 760, 800, 470), 2, { jag: 0.15, wander: 0.3 }),
  };
}

// Sun stripes through venetian blinds (for the light list). k = strength.
export function blindStripes(k = 1, o = {}) {
  const { angle = -0.5, gap = 120, width = 62, x0 = -600, n = 16, color = [255, 206, 150], dy = 0 } = o;
  const Ls = [];
  const dx = Math.cos(angle), dyy = Math.sin(angle);
  const nx = -dyy, ny = dx;
  for (let i = 0; i < n; i++) {
    const cx = x0 + i * gap * nx, cy = 450 + dy + i * gap * ny - 800;
    const L = 3000;
    Ls.push({
      type: 'poly', blur: 22, color, a: 0.6 * k,
      pts: [[cx - dx * L, cy - dyy * L], [cx + dx * L, cy + dyy * L], [cx + dx * L + nx * width, cy + dyy * L + ny * width], [cx - dx * L + nx * width, cy - dyy * L + ny * width]],
    });
  }
  return Ls;
}

// o: cam, time ('june'|'july'|'nov'), items(), hands(), sun (0..1), after()
export function desk(o) {
  if (!S) build();
  const { cam = { x: 800, y: 450, z: 1 }, sun = 1 } = o;
  const nov = o.time === 'nov';
  withCam(cam.x, cam.y, cam.z, () => {
    R.anchor = { x: 800, y: 450 };
    R.light = { x: 0.35, y: 0.55 };
    stillPiece('dk-top', S.top, { color: '#8a6446', tex: 'wood', ts: 1.2, lift: 0, edge: 0, maxQ: 1.3 });
    stillPiece('dk-mat', S.mat, { color: '#3f5a4a', tex: 'washi', ts: 0.9, lift: 1.5, edge: 0.25 });
    if (o.items) o.items();
    if (o.hands) o.hands();
    const Ls = [
      { type: 'rect', x: -1000, y: -800, w: 3600, h: 2500, blur: 10, color: nov ? [120, 118, 130] : [130, 125, 118], a: 0.28 },
      ...blindStripes(sun * (nov ? 0.7 : 1), { color: nov ? [255, 190, 140] : [255, 212, 160] }),
    ];
    if (o.lightsExtra) Ls.push(...o.lightsExtra);
    lights(nov ? '#6e6a74' : '#8a8078', Ls);
    motes(o.motes ?? sun);
    if (o.after) o.after();
    bloomFlush(0.3);
  });
}

// Dust turning in the sunlight, moved on twos.
function motes(k) {
  if (k <= 0) return;
  const ctx = R.ctx;
  const f = Math.floor(R.frame / 2);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 40; i++) {
    const x = (hash('mx', i) * 1800 + f * (1 + hash('mv', i) * 2)) % 1800 - 100;
    const y = hash('my', i) * 1000 - 50 + Math.sin(f * 0.2 + i) * 6;
    ctx.fillStyle = `rgba(255,240,210,${0.25 * k * hash('ma', i)})`;
    ctx.fillRect(x, y, 2.2, 2.2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// A sheet of paper with something printed on it. (x, y) is its centre.
export function sheet(w, h, x, y, o = {}) {
  const { r = 0, seed = 1, color = '#f7f4ec', lift = 2, print = null, key = null, tex = 'plain', ts = 0.45, alpha = 1 } = o;
  const sh = sheetShape(w, h, seed);
  const po = { x, y, r, color, tex, ts, tx: hash(seed) * 500, ty: hash(seed, 2) * 500, lift, edge: 0.35, print, alpha };
  if (key) stillPiece(key, sh, po);
  else piece(sh, po);
}

// Hands seen from above, coming in from the bottom of the frame.
// side: 'r' or 'l'; pose: 'flat' | 'point' | 'pinch' | 'pen' | 'thumb'. (x, y) = the middle of the palm.
const HANDS = {};
function handShapes(side) {
  if (HANDS[side]) return HANDS[side];
  const m = side === 'l' ? -1 : 1;
  const fl = (pts) => pts.map(([x, y]) => [x * m, y]);
  // a paper hand: the fingers are cut as one piece with shallow notches between them
  const palm = smooth(fl([[-44, 46], [-48, 0], [-42, -36], [0, -44], [40, -40], [46, 0], [42, 48], [0, 56]]), true, 3);
  const fingers = (lens, spread = 0) => {
    const xs = [-28, -9, 10, 28];
    const pts = [[-40 - spread, -20]];
    xs.forEach((x, i) => {
      const L = lens[i], a = (i - 1.5) * spread * 0.012;
      const tx = x + Math.sin(a) * L, ty = -34 - Math.cos(a) * L;
      pts.push([x - 9 + Math.sin(a) * L * 0.4, -34 - L * 0.5]);
      pts.push([tx - 6, ty + 6], [tx, ty], [tx + 6, ty + 6]);
      if (i < 3) pts.push([x + 9 + Math.sin(a) * L * 0.3, -34 - Math.max(L, lens[i + 1]) * 0.28]);
    });
    pts.push([40 + spread, -18], [30, -30], [-30, -30]);
    return fl(smooth(pts, true, 2));
  };
  const finger = (x, len, w = 15, ang = 0) => {
    const c = Math.cos(ang), s = Math.sin(ang);
    const pts = [[-w / 2, 0], [-w / 2, -len * 0.8], [0, -len], [w / 2, -len * 0.8], [w / 2, 0]].map(([px, py]) => [x + px * c - py * s, -34 + px * s + py * c]);
    return fl(pts);
  };
  const thumb = fl(smooth([[-40, 22], [-62, -4], [-74, -30], [-66, -42], [-52, -30], [-32, -8]], true, 2));
  const thumbIn = fl(smooth([[-40, 14], [-46, -12], [-32, -34], [-20, -30], [-24, -6]], true, 2));
  const knuckles = fl(smooth([[-38, -26], [-38, -52], [0, -60], [38, -52], [40, -26]], true, 2));
  const mk = (list) => cs(list, 4000 + (side === 'l' ? 1 : 0) + list.length, { jag: 0.1, wander: 0.2, step: 8 });
  HANDS[side] = {
    flat: mk([palm, fingers([62, 72, 68, 54], 6), thumb]),
    point: mk([palm, knuckles, finger(-26, 92, 16, -0.06), thumbIn]),
    pinch: mk([palm, knuckles, finger(-24, 64, 16, 0.12), fl(smooth([[-40, 14], [-56, -30], [-40, -58], [-30, -52], [-34, -24]], true, 2))]),
    pen: mk([palm, knuckles, finger(-24, 58, 16, 0.2), finger(-6, 50, 16, 0.12), fl(smooth([[-40, 14], [-58, -26], [-44, -50], [-32, -44], [-32, -18]], true, 2))]),
    thumb: mk([palm, knuckles, fl(smooth([[-40, 10], [-42, -40], [-36, -84], [-22, -84], [-20, -30]], true, 2))]),
    cuffBare: cs(fl([[-40, 40], [40, 40], [44, 380], [-44, 380]]), 4100 + (side === 'l' ? 1 : 0), { jag: 0.1 }),
    cuff: cs(fl([[-48, 70], [48, 70], [50, 130], [-50, 130]]), 4110 + (side === 'l' ? 1 : 0), { jag: 0.1 }),
    sleeve: cs(fl([[-52, 120], [52, 120], [70, 700], [-70, 700]]), 4120 + (side === 'l' ? 1 : 0), { jag: 0.2 }),
  };
  return HANDS[side];
}

// o: x, y, r (0 = fingers pointing up the frame), side, pose, s, sleeve colour, skin, bare (rolled sleeves),
//    hold(ctx) drawn under the fingers (a pen, a card)
export function topHand(o) {
  const { x, y, r = 0, side = 'r', pose = 'flat', s = 1.9, skin = '#e2b894', sleeve = '#f1f2ef', bare = false, lift = 16, f = R.frame } = o;
  const H = handShapes(side);
  const b = boil('th' + side, Math.floor(f / 2), 0.4);
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x + b[0], y + b[1]);
  ctx.rotate(r + b[2]);
  ctx.scale(s, s);
  const base = { tex: 'plain', edge: 0.25, lift, shadowK: 0.9 };
  if (bare) piece(H.cuffBare, { ...base, color: skin });
  piece(H.sleeve, { ...base, y: bare ? 260 : 0, color: sleeve, tex: 'cloth', ts: 0.6 });
  if (!bare) piece(H.cuff, { ...base, color: sleeve, tex: 'cloth', ts: 0.6, lift: lift + 1, print: (c) => { c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(-50, 72, 100, 3); } });
  if (bare) {
    ctx.save();
    ctx.translate(0, 250);
    piece(H.cuff, { ...base, color: sleeve, tex: 'cloth', lift: lift + 1 });
    ctx.restore();
  }
  if (o.hold) o.hold(ctx);
  const m = side === 'l' ? -1 : 1;
  piece(H[pose], { ...base, color: skin, lift: lift + 2, print: (c) => {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.strokeStyle = 'rgba(150,90,70,0.35)';
    c.lineWidth = 1.6;
    c.beginPath();
    if (pose === 'flat') for (const x of [-18.5, 0.5, 19]) { c.moveTo(x * m, -40); c.lineTo(x * m, -70); }
    else { c.moveTo(-30 * m, -40); c.quadraticCurveTo(0, -48, 32 * m, -40); }
    c.stroke();
    c.restore();
  } });
  if (o.over) o.over(ctx);
  ctx.restore();
}

// A pen (ballpoint), lying or held: origin at its tip, pointing up (-y) by default.
export function pen(x, y, r = 0, o = {}) {
  const S2 = memo('pen', () => ({ body: cs([[-7, -10], [7, -10], [8, -270], [-8, -270]], 4200, { jag: 0.05, wander: 0.1 }), tip: cs([[-7, -10], [7, -10], [0, 14]], 4201, { jag: 0.02 }), clip: cs([[3, -220], [8, -220], [8, -272], [3, -272]], 4202, { jag: 0.02 }) }));
  const { color = '#23303f', lift = 18 } = o;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  piece(S2.tip, { color: '#b9bbbd', tex: null, lift, edge: 0.5 });
  piece(S2.body, { color, tex: 'plain', lift, edge: 0.4 });
  piece(S2.clip, { color: '#c9cbcd', tex: null, lift: lift + 1, edge: 0.6 });
  ctx.restore();
}

// Printing helpers for documents (in a piece's print callback; coordinates are the sheet's).
export function printLines(c, lines, x, y, o = {}) {
  const { font = `400 14px ${F.mono}`, lh = 22, color = 'rgba(40,40,48,0.85)', align = 'left' } = o;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  lines.forEach((l, i) => c.fillText(l, x, y + i * lh));
  c.restore();
}
export function ruled(c, x0, y0, x1, y1, rows, cols = [], o = {}) {
  const { color = 'rgba(40,40,48,0.55)', width = 1.2 } = o;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.rect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 1; i < rows; i++) { const y = y0 + ((y1 - y0) * i) / rows; c.moveTo(x0, y); c.lineTo(x1, y); }
  for (const cx of cols) { c.moveTo(cx, y0); c.lineTo(cx, y1); }
  c.stroke();
  c.restore();
}
// Handwriting, revealed stroke by stroke (n characters written so far).
export function handwrite(c, text, x, y, size, n = Infinity, o = {}) {
  const { color = 'rgba(28,34,52,0.92)', weight = 0.6, font = F.pen } = o;
  const chars = [...text].slice(0, Math.max(0, Math.floor(n)));
  if (!chars.length) return;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.font = `400 ${size}px ${font}`;
  c.fillStyle = color;
  c.strokeStyle = color;
  c.lineWidth = weight;
  c.textBaseline = 'middle';
  let xx = x;
  for (const ch of chars) {
    const w = c.measureText(ch).width;
    c.fillText(ch, xx, y + hs('hw', ch.charCodeAt(0), x) * size * 0.04);
    if (weight > 0) c.strokeText(ch, xx, y);
    xx += w * 0.98;
  }
  c.restore();
}
