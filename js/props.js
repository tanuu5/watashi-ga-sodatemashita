// props.js — the things of the farm: bags of vegetables and their labels, the cash box,
// the QR stand, harvest crates, autumn vegetables.
import { R, piece, cello, layer, glow } from './render.js';
import { cutShape, smooth, ellipsePts, disc } from './cut.js';
import { hash, hs, rng, mixHex } from './util.js';
import { F } from './fonts.js';
import { LABELS } from './text.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.2, wander: 0.4, step: 8, corner: 0.3, ...o });
const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };

// ---------------------------------------------------------------------------
// A bag of vegetables. Origin: the bottom centre of the bag. ~56 wide, ~92 tall with its neck.
function bagShape(seed) {
  return memo('bag' + seed, () => {
    const r = rng(seed);
    const w = 27 + r() * 4, h = 60 + r() * 8, lean = (r() - 0.5) * 6;
    // a soft sack: wide at the bottom, gathered in folds up to the tape
    const pts = [
      [-w, 0], [-w - 2, -h * 0.35], [-w - 1, -h * 0.66], [-w + 3 + lean * 0.3, -h * 0.84],
      [-15 + lean * 0.6, -h * 0.95], [-7 + lean, -h - 5], [-4 + lean, -h - 10], [4 + lean, -h - 10], [7 + lean, -h - 5],
      [15 + lean * 0.6, -h * 0.95], [w - 3 + lean * 0.3, -h * 0.84], [w + 1, -h * 0.66], [w + 2, -h * 0.35], [w, 0],
      [w * 0.7, 2.5], [-w * 0.7, 2.5],
    ];
    const tx = lean;
    const frill = smooth([[-4 + tx, -h - 10], [-11 + tx, -h - 15 - r() * 3], [-8 + tx, -h - 20], [-2 + tx, -h - 18], [2 + tx + r() * 2, -h - 23], [8 + tx, -h - 19], [11 + tx, -h - 14 + r() * 3], [4 + tx, -h - 10]], true, 2);
    return {
      w, h, lean,
      bag: cs(pts, seed, { jag: 0.35, wander: 0.8, step: 7 }),
      frill: cs(frill, seed + 1, { jag: 0.4, wander: 0.4, step: 5 }),
      tape: cs([[-7 + tx, -h - 6], [7 + tx, -h - 6], [6.5 + tx, -h - 13], [-6.5 + tx, -h - 13]], seed + 2, { jag: 0.1, wander: 0.1 }),
    };
  });
}

const tomatoDisc = (i) => memo('tom' + i, () => disc(7.4 + (i % 3) * 0.5, 300 + i));
const pepperShape = (i) => memo('pep' + i, () => cs(smooth([[0, -2], [8, 2], [10, 14], [7, 30], [2, 38], [-3, 36], [-7, 24], [-8, 8]], true, 3), 400 + i));
const calyx = memo('calyx', () => cs([[0, -4], [2, -1], [5, -2], [2, 1], [3, 4], [0, 2], [-3, 4], [-2, 1], [-5, -2], [-2, -1]], 450, { jag: 0.05, wander: 0.1 }));

function contents(kind, B, seed) {
  const r = rng(seed + 7);
  if (kind === 'tomato') {
    // two layers of small tomatoes, the lower ones redder
    const n = 14;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 4), col = i % 4;
      const x = -B.w + 9 + col * ((B.w * 2 - 18) / 3) + hs(seed, 'tx', i) * 3 + (row % 2) * 4;
      const y = -8 - row * 13 + hs(seed, 'ty', i) * 2.5;
      if (y < -B.h + 10) continue;
      const ripe = Math.min(1, 0.55 + (i / n) * 0.2 + r() * 0.3);
      piece(tomatoDisc(i % 6), { x, y, color: mixHex('#e87a3a', '#d8322a', ripe), tex: 'plain', ts: 0.4, lift: 1.5, edge: 0.35, shadowK: 0.5 });
      piece(calyx, { x: x + 1, y: y - 6, r: r() * 3, color: '#4e7a36', tex: null, lift: 1, edge: 0, shadowK: 0 });
    }
  } else if (kind === 'pepper') {
    for (let i = 0; i < 5; i++) {
      const x = -B.w + 12 + i * ((B.w * 2 - 24) / 4) + hs(seed, 'px', i) * 3;
      const y = -44 - (i % 2) * 8 + hs(seed, 'py', i) * 3;
      piece(pepperShape(i), { x, y, r: hs(seed, 'pr', i) * 0.35, color: mixHex('#2f7a2e', '#4f9a3a', hash(seed, 'pc', i)), tex: 'plain', lift: 1.5, edge: 0.45, shadowK: 0.5 });
    }
  }
}

// The label on the bag's front, as printed matter (label-local coordinates, 0..LW, 0..LH).
export const LW = 40, LH = 26;
export function labelPrint(c, kind, o = {}) {
  const lines = LABELS[kind] || LABELS.tomato;
  const { pale = 0.62 } = o;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = `rgba(60,62,70,${pale})`;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.font = `700 3.6px ${F.mono}`;
  c.fillText(lines[0], 2.2, 4.6);
  c.font = `400 3.1px ${F.mono}`;
  if (lines[1]) c.fillText(lines[1], 2.2, 10.4);
  c.fillText(lines[2], 2.2, 16.4);
  // a small barcode
  c.fillStyle = `rgba(50,52,60,${pale})`;
  const r = rng(kind.length * 31);
  let x = 2.2;
  while (x < 22) {
    const w = r() < 0.5 ? 0.35 : 0.7;
    if (r() < 0.6) c.fillRect(x, 19.6, w, 4.4);
    x += w + 0.35;
  }
  c.restore();
}
const labelShape = memo('label', () => cs([[0, 0], [LW, 0], [LW, LH], [0, LH]], 480, { jag: 0.05, wander: 0.1, step: 12, corner: 0.15 }));

export function priceLabel(kind, x, y, s = 1, o = {}) {
  piece(labelShape, { x, y, s, r: o.r || 0, color: '#f7f6f0', tex: 'plain', ts: 0.2, lift: 0.6, edge: 0.2, shadowK: 0.4, print: (c) => labelPrint(c, kind, o) });
}

// o: kind ('tomato'|'pepper'), r (tilt), s, label (bool), tape colour
export function bag(kind, x, y, o = {}) {
  const { r = 0, s = 1, seed = 1, label = true, tape = kind === 'tomato' ? '#d8322a' : '#2f6ab0' } = o;
  const B = bagShape(seed % 5);
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  if (r) ctx.rotate(r);
  if (s !== 1) ctx.scale(s, s);
  // a faint shadow where the bag sits
  ctx.fillStyle = 'rgba(30,20,10,0.18)';
  ctx.beginPath();
  ctx.ellipse(2, 1, B.w * 0.95, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  contents(kind, B, seed);
  // the plastic
  cello(B.bag, { color: '#eef3f2', mode: 'glow', glowA: 0.16, crinkle: 0.7, edge: 0.6, tx: hash(seed) * 300 });
  cello(B.frill, { color: '#f4f7f6', mode: 'glow', glowA: 0.3, crinkle: 0.5, edge: 0.5 });
  piece(B.tape, { color: tape, tex: 'plain', lift: 1, edge: 0.4, shadowK: 0.5 });
  // the folds where the neck is gathered, and a highlight running down the film
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const nx = B.lean;
  ctx.moveTo(nx - 3, -B.h - 4); ctx.lineTo(-B.w + 8, -B.h * 0.74);
  ctx.moveTo(nx + 2, -B.h - 4); ctx.lineTo(B.w * 0.35, -B.h * 0.8);
  ctx.moveTo(nx + 4, -B.h - 3); ctx.lineTo(B.w - 6, -B.h * 0.7);
  ctx.moveTo(-B.w + 5, -B.h * 0.6); ctx.quadraticCurveTo(-B.w + 2, -B.h * 0.35, -B.w + 5, -8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,50,50,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(nx - 1, -B.h - 4); ctx.lineTo(-B.w * 0.3, -B.h * 0.78);
  ctx.moveTo(nx + 3, -B.h - 4); ctx.lineTo(B.w * 0.6, -B.h * 0.76);
  ctx.stroke();
  if (label) priceLabel(o.labelKind || kind, -LW / 2 + hs(seed, 'lx') * 4, -LH - 8 + hs(seed, 'ly') * 3, 1, { r: hs(seed, 'lr') * 0.05, pale: o.pale });
  ctx.restore();
}

// A bag that stays put: cut once, then set down again each frame.
export function bagStill(key, kind, x, y, o = {}) {
  const s = o.s || 1;
  layer('bag|' + key, [x - 40 * s, y - 130 * s, x + 44 * s, y + 10 * s], () => bag(kind, x, y, o), { res: 1.3, maxQ: 6 });
}

// ---------------------------------------------------------------------------
// The cash box: painted steel, a slot on top, a padlock on the lid. Origin: bottom centre.
export const BOX = { w: 118, h: 74 };
const boxShapes = () => memo('box', () => ({
  body: cs([[-BOX.w / 2, 0], [-BOX.w / 2, -BOX.h], [BOX.w / 2, -BOX.h], [BOX.w / 2, 0]], 500, { jag: 0.1, wander: 0.2 }),
  lid: cs([[-BOX.w / 2 - 4, -BOX.h], [-BOX.w / 2 + 6, -BOX.h - 16], [BOX.w / 2 + 6, -BOX.h - 16], [BOX.w / 2 + 4, -BOX.h]], 501, { jag: 0.1, wander: 0.2 }),
  lip: cs([[-BOX.w / 2 - 5, -BOX.h + 1], [BOX.w / 2 + 5, -BOX.h + 1], [BOX.w / 2 + 5, -BOX.h - 5], [-BOX.w / 2 - 5, -BOX.h - 5]], 502, { jag: 0.1, wander: 0.1 }),
  hasp: cs([[-8, -BOX.h + 2], [8, -BOX.h + 2], [8, -BOX.h + 20], [-8, -BOX.h + 20]], 503, { jag: 0.05, wander: 0.1 }),
  lockBody: cs(smooth([[-11, 0], [11, 0], [12, 16], [8, 22], [-8, 22], [-12, 16]], true, 3), 504, { jag: 0.05, wander: 0.1 }),
}));

export function cashBox(x, y, o = {}) {
  const S = boxShapes();
  const { lock = 'old', lift = 4, jolt = 0 } = o;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y - jolt);
  piece(S.body, { color: '#5f7466', tex: 'plain', lift, edge: 0.35, print: (c) => {
    c.save();
    c.globalCompositeOperation = 'multiply';
    // chipped paint and rust along the bottom
    c.fillStyle = 'rgba(140,80,40,0.45)';
    for (let i = 0; i < 16; i++) c.fillRect(-BOX.w / 2 + hash('rb', i) * BOX.w, -6 - hash('rh', i) * 10, 2 + hash('rw', i) * 5, 3 + hash('rh2', i) * 8);
    c.restore();
    c.fillStyle = 'rgba(245,242,230,0.9)';
    c.font = `700 13px ${F.mincho}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('料 金 箱', 0, -BOX.h * 0.42);
  } });
  piece(S.lid, { color: '#6e8676', tex: 'plain', lift: lift + 1, edge: 0.45, print: (c) => {
    c.fillStyle = '#15130f';
    c.fillRect(-26, -BOX.h - 10, 52, 3.4);
  } });
  piece(S.lip, { color: '#566a5c', tex: 'plain', lift: lift + 1.5, edge: 0.4 });
  piece(S.hasp, { color: '#9a9a96', tex: 'plain', lift: lift + 2, edge: 0.5 });
  // the padlock: shackle, then body
  const newLock = lock === 'new';
  ctx.save();
  ctx.translate(0, -BOX.h + 14);
  ctx.strokeStyle = newLock ? '#d8d8d4' : '#8f8d86';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-6, 4); ctx.lineTo(-6, -3); ctx.arc(0, -3, 6, Math.PI, 0); ctx.lineTo(6, 4);
  ctx.stroke();
  piece(S.lockBody, { y: 2, color: newLock ? '#d9b24a' : '#a88a3c', tex: 'plain', lift: lift + 4, edge: newLock ? 0.7 : 0.4, print: (c) => {
    c.fillStyle = 'rgba(40,30,10,0.7)';
    c.fillRect(-1.2, 11, 2.4, 6);
    if (!newLock) { c.fillStyle = 'rgba(90,60,30,0.35)'; c.fillRect(-12, 16, 24, 8); }
  } });
  ctx.restore();
  ctx.restore();
}

// The acrylic QR stand. Origin: bottom centre.
export function qrStand(x, y, s = 1) {
  const S = memo('qr', () => ({
    plate: cs([[-26, 0], [-26, -74], [26, -74], [26, 0]], 510, { jag: 0.05, wander: 0.1 }),
    card: cs([[-22, -6], [-22, -70], [22, -70], [22, -6]], 511, { jag: 0.05, wander: 0.1 }),
    foot: cs([[-28, 2], [28, 2], [24, -8], [-24, -8]], 512, { jag: 0.05, wander: 0.1 }),
  }));
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // the acrylic has warped a little in the sun
  ctx.rotate(-0.03);
  piece(S.card, { color: '#fbfbf7', tex: 'plain', ts: 0.3, lift: 3, edge: 0.3, print: (c) => {
    c.fillStyle = '#e0703f';
    c.fillRect(-22, -70, 44, 11);
    c.fillStyle = '#ffffff';
    c.font = `700 7.4px ${F.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('コトペイ', 0, -64.5);
    // the code
    const r = rng(77);
    c.fillStyle = '#1a1a1a';
    const q0x = -15, q0y = -55, m = 1.35;
    for (let j = 0; j < 22; j++) for (let i = 0; i < 22; i++) {
      const finder = (i < 7 && j < 7) || (i > 14 && j < 7) || (i < 7 && j > 14);
      let on = r() < 0.5;
      if (finder) {
        const fi = i > 14 ? i - 15 : i, fj = j > 14 ? j - 15 : j;
        on = fi === 0 || fi === 6 || fj === 0 || fj === 6 || (fi >= 2 && fi <= 4 && fj >= 2 && fj <= 4);
      }
      if (on) c.fillRect(q0x + i * m, q0y + j * m, m, m);
    }
    c.fillStyle = 'rgba(40,40,40,0.8)';
    c.font = `400 4.2px ${F.mono}`;
    c.fillText('キャッシュレスでも', 0, -13);
  } });
  cello(S.plate, { color: '#e8f0f0', mode: 'glow', glowA: 0.12, crinkle: 0.15, edge: 0.7 });
  piece(S.foot, { color: '#d8e2e0', tex: null, lift: 2, edge: 0.6, alpha: 0.8 });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// A harvest crate (yellow plastic), seen from the side. Origin: bottom centre.
export function crate(x, y, o = {}) {
  const { r = 0, color = '#e2b43a', lift = 4, s = 1 } = o;
  const S = memo('crate', () => cs([[-58, 0], [-60, -40], [60, -40], [58, 0]], 520, { jag: 0.1, wander: 0.2 }));
  piece(S, { x, y, r, s, color, tex: 'plain', lift, edge: 0.45, print: (c) => {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(120,80,10,0.4)';
    c.fillRect(-60, -40, 120, 4);
    for (let i = 0; i < 7; i++) c.fillRect(-50 + i * 16, -30, 9, 20);
    c.fillStyle = 'rgba(60,40,5,0.65)';
    c.beginPath(); c.ellipse(-40, -30, 8, 3.2, 0, 0, Math.PI * 2); c.ellipse(40, -30, 8, 3.2, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  } });
}

// ---------------------------------------------------------------------------
// Autumn vegetables (November). Origin: bottom centre, lying on the shelf.
export function daikon(x, y, o = {}) {
  const { r = 0, seed = 1, label = true } = o;
  const S = memo('daikon' + (seed % 3), () => ({
    root: cs(smooth([[-70, -8], [-60, -18], [40, -16], [78, -10], [96, -8], [80, -4], [40, 0], [-60, 2]], true, 4), 530 + seed),
    top: cs(smooth([[-70, -14], [-90, -30], [-120, -44], [-128, -30], [-104, -16], [-128, -8], [-118, 4], [-92, 0], [-70, -2]], true, 3), 540 + seed, { jag: 0.6, wander: 1 }),
  }));
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  piece(S.top, { color: '#4f7f3a', tex: 'washi', lift: 2, edge: 0.3 });
  piece(S.root, { color: '#f1efe6', tex: 'plain', lift: 3, edge: 0.4, print: (c) => {
    const g = c.createLinearGradient(-70, 0, -30, 0);
    g.addColorStop(0, 'rgba(160,200,120,0.6)');
    g.addColorStop(1, 'rgba(160,200,120,0)');
    c.fillStyle = g;
    c.fillRect(-70, -20, 60, 24);
    c.strokeStyle = 'rgba(150,140,120,0.35)';
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = 0; i < 6; i++) { const xx = -30 + i * 18; c.moveTo(xx, -15); c.lineTo(xx + 3, -13); }
    c.stroke();
  } });
  if (label) priceLabel('daikon', 0, -26, 0.85, { r: -0.04 });
  ctx.restore();
}

export function hakusai(x, y, o = {}) {
  const { seed = 1, label = true } = o;
  const S = memo('hakusai' + (seed % 2), () => ({
    body: cs(smooth([[-44, 0], [-48, -40], [-34, -86], [0, -98], [34, -88], [48, -42], [44, 0]], true, 4), 560 + seed),
    leaf: cs(smooth([[-30, -30], [-40, -70], [-26, -100], [4, -108], [24, -94], [10, -60], [-6, -40]], true, 4), 562 + seed, { jag: 0.5, wander: 0.8 }),
  }));
  piece(S.body, { x, y, color: '#e9ecd6', tex: 'plain', lift: 3, edge: 0.4, print: (c) => {
    c.strokeStyle = 'rgba(160,170,130,0.5)';
    c.lineWidth = 1.2;
    c.beginPath();
    for (let i = -3; i <= 3; i++) { c.moveTo(i * 10, -4); c.quadraticCurveTo(i * 13, -50, i * 6, -92); }
    c.stroke();
  } });
  piece(S.leaf, { x, y, color: '#8fb36a', tex: 'washi', lift: 4, edge: 0.3 });
  if (label) priceLabel('hakusai', x - 20, y - 36, 0.85);
}

export function komatsuna(x, y, o = {}) {
  const { seed = 1, label = true, r = 0 } = o;
  const S = memo('koma' + (seed % 3), () => {
    const leaves = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.18;
      const l = 70 + hash(seed, 'kl', i) * 26;
      const bx = (i - 2.5) * 3;
      leaves.push(smooth([[bx - 2, 0], [bx + Math.cos(a - 0.12) * l * 0.5, Math.sin(a - 0.12) * l * 0.5], [bx + Math.cos(a) * l, Math.sin(a) * l], [bx + Math.cos(a + 0.12) * l * 0.5 + 5, Math.sin(a + 0.12) * l * 0.5], [bx + 2, 0]], true, 3));
    }
    return { leaves: cs(leaves, 580 + seed, { jag: 0.4, wander: 0.6 }), band: cs([[-10, -20], [10, -20], [10, -12], [-10, -12]], 590 + seed) };
  });
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  piece(S.leaves, { color: '#3f7a34', tex: 'washi', lift: 3, edge: 0.3 });
  piece(S.band, { color: '#2f6ab0', tex: 'plain', lift: 4, edge: 0.3 });
  if (label) priceLabel('komatsuna', -20, -14, 0.8);
  ctx.restore();
}
