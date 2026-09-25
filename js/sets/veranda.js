// sets/veranda.js — Kadowaki's house, across the road from the farm. The engawa under deep eaves,
// glass doors behind it; the yard, his kei truck and shed, his own crooked rows of cucumbers;
// and over the road, the white greenhouses. The house is cut from paper printed with the story.
import { R, withCam, withPlane, piece, stillPiece, lights, bloom, bloomFlush, glow, cello, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from '../cut.js';
import { rng, hash, hs, mixHex, lerp, clamp } from '../util.js';
import { car, keiLoad } from '../vehicles.js';

export const GROUND = 840;
export const ENGAWA = { x0: -200, x1: 1060, top: 690 };
export const TRUCK = { x: 1760, y: GROUND - 4, s: 0.82 };
export const SHOT = {
  wide: { x: 820, y: 470, z: 0.74 },
  two: { x: 560, y: 520, z: 1.25 },
  kado: { x: 760, y: 470, z: 2.0 },
  kido: { x: 380, y: 480, z: 2.0 },
  truck: { x: 1660, y: 600, z: 1.25 },
};

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.35, wander: 0.8, step: 14, corner: 0.45, ...o });
const box = (x0, y0, x1, y1, seed, o) => cs(rectPts(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2), seed, o);

let S = null;
function build() {
  const still = [];
  const add = (key, sh, o) => still.push({ key: 'vr-' + key, sh, o }); // cache names are per set
  // the house: wall, glass doors with their frames, the engawa boards, the eaves
  add('wall', box(-900, 60, 1100, ENGAWA.top, 1), { color: '#c8b89a', tex: 'tate', ts: 0.8, texA: 0.4, lift: 1, edge: 0 });
  for (let i = 0; i < 6; i++) {
    const x0 = -180 + i * 200;
    add('door' + i, box(x0, 250, x0 + 196, ENGAWA.top - 6, 10 + i, { jag: 0.2 }), {
      color: '#6a5a44', tex: 'wood', ts: 0.6, lift: 4, edge: 0.35,
      print: (c) => {
        // four panes of glass, dark with the room behind
        c.fillStyle = 'rgba(40,44,46,0.82)';
        for (let k = 0; k < 4; k++) c.fillRect(x0 + 14, 266 + k * 100, 168, 88);
        c.fillStyle = 'rgba(200,215,220,0.18)';
        for (let k = 0; k < 4; k++) c.fillRect(x0 + 20, 270 + k * 100, 40, 80);
      },
    });
  }
  add('lintel', box(-900, 226, 1100, 256, 20), { color: '#5a4a38', tex: 'wood', lift: 6, edge: 0.4 });
  add('engawa', box(ENGAWA.x0, ENGAWA.top, ENGAWA.x1, ENGAWA.top + 30, 21, { jag: 0.2 }), { color: '#a48a68', tex: 'wood', ts: 0.8, lift: 8, edge: 0.45 });
  add('engawa-front', box(ENGAWA.x0, ENGAWA.top + 30, ENGAWA.x1, GROUND, 22), { color: '#4a3c2e', tex: 'wood', lift: 3, edge: 0.2 });
  add('post1', box(ENGAWA.x0 + 20, 120, ENGAWA.x0 + 50, ENGAWA.top, 23), { color: '#6a5842', tex: 'wood', lift: 10, edge: 0.4 });
  add('post2', box(ENGAWA.x1 - 30, 120, ENGAWA.x1, ENGAWA.top, 24), { color: '#6a5842', tex: 'wood', lift: 10, edge: 0.4 });
  add('eave', cs([[-960, 60], [1180, 60], [1220, 128], [-960, 140]], 25), { color: '#4a4440', tex: 'tin', ts: 0.4, lift: 16, edge: 0.4 });
  add('eave-edge', box(-960, 118, 1230, 138, 26), { color: '#3a3430', tex: 'plain', lift: 17, edge: 0.4 });
  add('step-stone', cs(smooth([[300, GROUND], [290, GROUND - 60], [340, GROUND - 76], [480, GROUND - 74], [520, GROUND - 50], [516, GROUND]], true, 3), 27), { color: '#8a8880', tex: 'block', ts: 0.6, lift: 6, edge: 0.4 });
  // the shed at the right, and the yard's edge
  add('shed', box(1180, 380, 1900, GROUND, 30), { color: '#8a7a64', tex: 'wood', ts: 0.8, lift: 4, edge: 0.3 });
  add('shed-roof', cs([[1150, 400], [1940, 350], [1940, 376], [1150, 424]], 31), { color: '#6a6e72', tex: 'tin', ts: 0.4, lift: 8, edge: 0.4 });
  S = {
    still,
    road: box(-900, GROUND - 40, 3200, GROUND + 10, 40),
    yard: box(-900, GROUND, 3200, 1500, 41, { jag: 0.2 }),
    hill: cs([[-900, 1400], [-900, 200], [600, 160], [1800, 230], [3200, 180], [3200, 1400]], 42, { jag: 0.8, wander: 1.4, step: 30 }),
    houses: [0, 1, 2].map((i) => cs(smooth([[-200, 0], [-200, -120], [-120, -220], [0, -250], [120, -220], [200, -120], [200, 0]], true, 4), 50 + i)),
    pole: box(-6, -300, 6, 0, 60, { jag: 0.2 }),
    vine: cs(smooth([[-40, 0], [-50, -80], [-30, -170], [10, -250], [40, -170], [50, -80], [40, 0]], true, 4), 61, { jag: 1, wander: 1.5 }),
    coil: disc(24, 70),
    coilStand: box(-30, -4, 30, 4, 71),
    glass: cs([[-18, 0], [-20, -70], [20, -70], [18, 0]], 72, { jag: 0.1, wander: 0.2 }),
    reel: disc(46, 80),
    reelStand: cs([[-50, 0], [-30, -60], [30, -60], [50, 0]], 81),
    furin: cs(smooth([[-16, 0], [-14, -22], [0, -28], [14, -22], [16, 0]], true, 3), 90),
    tanzaku: box(-5, 0, 5, 50, 91),
  };
}

// o: cam, time ('july'|'dawn'), glasses [{x, full(0..1)}], rings [x...] (wet rings on the board),
//    truck { load(), neat }, fg(), front(), smoke (bool), furin (swing 0..1)
export function veranda(o) {
  if (!S) build();
  const f = R.frame;
  R.anchor = { x: 700, y: 470 };
  R.light = { x: 0.35, y: 0.8 };
  withCam(o.cam.x, o.cam.y, o.cam.z, () => {
    const ctx = R.ctx;
    withPlane(0.06, () => {
      const g = ctx.createLinearGradient(0, -400, 0, GROUND);
      g.addColorStop(0, '#86b8de');
      g.addColorStop(1, '#eef3ee');
      ctx.fillStyle = g;
      ctx.fillRect(-1200, -1000, 5000, 2400);
    });
    withPlane(0.25, () => stillPiece('vr-hill', S.hill, { color: '#4f7a4a', tex: 'washi', lift: 3, edge: 0.15, maxQ: 0.6 }));
    // over the road: the greenhouses, small and white
    withPlane(0.5, () => {
      S.houses.forEach((h, i) => stillPiece('vr-gh' + i, h, { x: 1500 + i * 330, y: GROUND - 150, s: 0.75, color: '#f1f3ef', tex: 'log', ts: 0.3, texA: 0.4, lift: 4, edge: 0.4 }));
      stillPiece('vr-road', S.road, { y: -120, color: '#6a6a6c', tex: 'gravel', ts: 0.4, lift: 2, edge: 0.2, maxQ: 0.6 });
    });
    for (const p of S.still) stillPiece(p.key, p.sh, p.o);
    stillPiece('vr-yard', S.yard, { color: '#a08a6a', tex: 'soil', ts: 0.8, lift: 1, edge: 0.1, maxQ: 0.8 });
    // the kei truck in the yard
    car({ kind: 'kei', x: TRUCK.x, y: TRUCK.y, s: TRUCK.s, dir: -1, load: o.truck && o.truck.load ? o.truck.load : keiLoad(4) });
    // his own cucumbers: poles leaning every which way
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4; k++) {
      const x = 1180 + row * 90 + k * 34 + hs('cx', row, k) * 8, y = GROUND + 150 + row * 24;
      const lean = hs('cl', row, k) * 0.12 + (row === 1 ? 0.08 : 0);
      piece(S.pole, { x, y, r: lean, color: '#c9b98a', tex: 'plain', lift: 12, edge: 0.3 });
      stillPiece(`vr-vine${row}-${k}`, S.vine, { x: x + Math.sin(lean) * -120, y: y - 30, s: 0.8, r: lean, color: '#4f7f3a', tex: 'washi', lift: 13, edge: 0.2 });
    }
    // the hose reel, half unwound
    piece(S.reelStand, { x: 960, y: GROUND + 120, color: '#3a6a8a', tex: 'plain', lift: 10, edge: 0.3 });
    piece(S.reel, { x: 960, y: GROUND + 60, color: '#4f8aaa', tex: 'plain', lift: 11, edge: 0.4, print: (c) => {
      c.strokeStyle = '#2f6a3a';
      c.lineWidth = 6;
      c.beginPath(); c.arc(960, GROUND + 60, 30, 0, Math.PI * 1.3); c.stroke();
    } });
    ctx.strokeStyle = '#2f6a3a';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(990, GROUND + 80); ctx.bezierCurveTo(1060, GROUND + 160, 880, GROUND + 180, 760, GROUND + 150); ctx.stroke();
    // on the engawa: the mosquito coil, the glasses of barley tea
    if (o.coil !== false) {
      piece(S.coilStand, { x: 520, y: ENGAWA.top - 2, color: '#3a3a3a', tex: 'plain', lift: 3, edge: 0.3 });
      piece(S.coil, { x: 520, y: ENGAWA.top - 10, sy: 0.3, color: '#4f6a3a', tex: 'plain', lift: 4, edge: 0.3 });
    }
    for (const g of o.glasses || []) teaGlass(g.x, ENGAWA.top - 1, g.full ?? 1, g.lift || 0);
    for (const x of o.rings || []) {
      ctx.strokeStyle = 'rgba(60,40,20,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(x, ENGAWA.top + 2, 20, 3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // the wind chime under the eaves
    const sw = (o.furin || 0) * Math.sin(f * 0.9) * 0.3 + Math.sin(f * 0.17) * 0.04;
    ctx.save();
    ctx.translate(140, 140);
    ctx.strokeStyle = 'rgba(40,40,40,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.stroke();
    ctx.translate(0, 58);
    ctx.rotate(sw);
    cello(S.furin, { color: '#d8eef0', mode: 'glow', glowA: 0.3, crinkle: 0.1, edge: 0.6 });
    ctx.strokeStyle = 'rgba(40,40,40,0.7)';
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 16); ctx.stroke();
    piece(S.tanzaku, { y: 16, r: sw * 1.4, color: '#d86a5a', tex: 'plain', lift: 6, edge: 0.3 });
    ctx.restore();
    if (o.fg) o.fg();
    // the eaves' deep shade over the engawa; the yard in the sun
    lights('#9c9488', [
      { type: 'rect', x: -1200, y: -1000, w: 5000, h: 2600, blur: 10, color: [255, 246, 224], a: 0.72 },
      { type: 'shade', pts: [[-960, 130], [1230, 130], [1230, 520], [1060, 690], [-960, 690]], blur: 60, color: [178, 170, 168], a: 1 },
    ]);
    if (o.smoke !== false) coilSmoke(520, ENGAWA.top - 16, f);
    if (o.front) o.front();
    bloomFlush(0.4);
  });
}

// A glass of barley tea: brown, beaded with water; full drops as it is drunk.
export function teaGlass(x, y, full = 1, lift = 0) {
  if (!S) build();
  piece(S.glass, { x, y: y - lift, color: '#d9e2e0', tex: null, lift: 3 + lift * 0.3, edge: 0.6, alpha: 0.85, print: (c) => {
    c.fillStyle = '#7a4a22';
    const h = 62 * full;
    c.fillRect(x - 19, y - lift - h - 2, 38, h);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 9; i++) c.fillRect(x - 14 + hash('bead', i) * 28, y - lift - 8 - hash('bdy', i) * 56, 2, 2.6);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(x - 15, y - lift - 66, 5, 60);
  } });
}

// Smoke from the coil: a thin line that wanders up and breaks, redrawn on twos.
function coilSmoke(x, y, f) {
  const ctx = R.ctx;
  const k = Math.floor(f / 2);
  ctx.save();
  ctx.lineCap = 'round';
  for (let s = 0; s < 3; s++) {
    ctx.strokeStyle = `rgba(235,235,240,${0.5 - s * 0.14})`;
    ctx.lineWidth = 2.2 - s * 0.5;
    ctx.beginPath();
    let px = x + 20, py = y;
    ctx.moveTo(px, py);
    for (let i = 1; i < 14; i++) {
      px += Math.sin(i * 0.8 + k * 0.35 + s * 2) * 7 + 3;
      py -= 14;
      if (i > 7 + s && hash('sm', k, i, s) > 0.6) break;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}
