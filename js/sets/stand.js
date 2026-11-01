// sets/stand.js — the unmanned stand on the mountain road.
// Blocks for a base, a timber frame, a tin roof; open on three sides.
// Planes, back to front: sky · far ridges · near slope · cedars · the stand · the road.
// The farm's things are cut from paper printed with its operation log.
import { R, withCam, withPlane, piece, stillPiece, backdrop, lights, bloom, bloomFlush, glow, layer, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from '../cut.js';
import { rng, hash, hs, mix, mixHex, clamp, lerp } from '../util.js';
import { bag, bagStill, cashBox, qrStand, daikon, hakusai, komatsuna, crate } from '../props.js';
import { sign, SW, SH } from '../creature.js';
import { PLAN, NOTE } from '../text.js';
import { F } from '../fonts.js';

export const GROUND = 820;
export const ST = { x0: 300, x1: 1300, roof: 104, back: 150, shelf1: 566, shelf2: 458 };
export const SIGNPOS = { x: 1258, y: 300 }; // top-left of the sign on the right-hand post
export const BOXPOS = { x: 1030, y: GROUND - 18 };
export const QRPOS = { x: 1156, y: GROUND - 18 };

export const SHOT = {
  wide: { x: 800, y: 470, z: 0.8 },
  stand: { x: 800, y: 470, z: 1.02 },
  shelf: { x: 800, y: 500, z: 1.7 },
  sign: { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + SH / 2, z: 4.4 },
  box: { x: 1060, y: 740, z: 3.1 },
};

// Where the bags sit: 14 tomatoes up top (two staggered rows), 20 peppers below.
export const SLOTS = [];
{
  for (let i = 0; i < 14; i++) {
    const row = i % 2, col = Math.floor(i / 2);
    SLOTS.push({ kind: 'tomato', x: 392 + col * 128 + row * 62, y: ST.shelf2 - 2 + row * 12, r: hs('sr', i) * 0.06, seed: i });
  }
  for (let i = 0; i < 20; i++) {
    const row = i % 2, col = Math.floor(i / 2);
    SLOTS.push({ kind: 'pepper', x: 372 + col * 88 + row * 44, y: ST.shelf1 - 2 + row * 13, r: hs('sp', i) * 0.07, seed: 20 + i });
  }
}

// ---------------------------------------------------------------------------
let S = null;
const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.35, wander: 0.9, step: 14, corner: 0.5, ...o });
const box = (x0, y0, x1, y1, seed, o) => cs(rectPts(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2), seed, o);

function ridge(seed, y0, amp, x0 = -1600, x1 = 3200, step = 60) {
  const r = rng(seed);
  const pts = [[x0, 1400]];
  let y = y0;
  for (let x = x0; x <= x1; x += step) {
    y += (r() - 0.5) * amp;
    y = lerp(y, y0, 0.12);
    pts.push([x, y]);
  }
  pts.push([x1, 1400]);
  return cs(smooth(pts, false, 3).concat([[x1, 1400]]), seed, { jag: 0.6, wander: 1.4, step: 30 });
}

function cedar(h, seed) {
  // a tall cone with ragged tiers
  const pts = [];
  const tiers = 9;
  for (let i = 0; i <= tiers; i++) {
    const y = -h + (h * i) / tiers;
    const w = 6 + (h * 0.2 * i) / tiers;
    pts.push([w + hs(seed, 'r', i) * 4, y + (h * 0.5) / tiers]);
    pts.push([w * 0.62, y + (h * 0.8) / tiers]);
  }
  const right = pts;
  const left = pts.map(([x, y]) => [-x + hs(seed, 'l', y) * 3, y]).reverse();
  return cs([[0, -h - 12], ...right, [6, 0], [-6, 0], ...left], seed, { jag: 0.8, wander: 1.2, step: 10 });
}

function build() {
  const r = rng(812);
  const still = [];
  const add = (key, sh, o) => still.push({ key: 'st-' + key, sh, o }); // cache names are per set

  // --- the stand ---------------------------------------------------------------
  // block base: along the back, two courses high, and a low kerb in front
  add('blocks', box(ST.x0 - 10, GROUND - 132, ST.x1 + 10, GROUND, 10, { jag: 0.2 }), { color: '#aaa89f', tex: 'block', ts: 0.55, lift: 3, edge: 0.3 });
  add('slab', box(ST.x0 - 26, GROUND - 22, ST.x1 + 26, GROUND + 6, 11, { jag: 0.2 }), { color: '#b8b5ab', tex: 'block', ts: 1.1, lift: 4, edge: 0.4 });
  // back wall: weathered boards, printed with the log
  for (let i = 0; i < 12; i++) {
    const x0 = ST.x0 + i * 84, w = 84 - 3;
    add('board' + i, box(x0, ST.back, x0 + w, GROUND - 126, 20 + i, { jag: 0.3 }), {
      color: mixHex('#8d7f6c', '#a39480', hash('bd', i)), tex: 'log', ts: 0.55, tx: i * 97, ty: i * 31, lift: 2, edge: 0.25,
    });
  }
  // back posts (seen through), beams
  add('beam-back', box(ST.x0 - 20, ST.back - 16, ST.x1 + 20, ST.back + 6, 40), { color: '#6f5a44', tex: 'wood', ts: 0.6, lift: 5, edge: 0.35 });
  add('beam-front', box(ST.x0 - 40, ST.roof + 16, ST.x1 + 40, ST.roof + 40, 41), { color: '#7b6450', tex: 'wood', ts: 0.6, lift: 14, edge: 0.4 });
  // the roof: its underside, then the corrugated front edge
  add('roof-under', cs([[ST.x0 - 60, ST.roof + 14], [ST.x1 + 60, ST.roof + 14], [ST.x1 + 20, ST.back - 12], [ST.x0 - 20, ST.back - 12]], 42), { color: '#5d5f63', tex: 'tin', ts: 0.5, lift: 6, edge: 0 });
  add('roof-edge', box(ST.x0 - 64, ST.roof - 6, ST.x1 + 64, ST.roof + 18, 43, { jag: 0.2 }), { color: '#8e969a', tex: 'tin', ts: 0.34, lift: 18, edge: 0.5, print: (c) => {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(140,70,30,0.35)';
    for (let i = 0; i < 40; i++) c.fillRect(ST.x0 - 60 + hash('rust', i) * (ST.x1 - ST.x0 + 120), ST.roof + 6 + hash('ry', i) * 10, 3 + hash('rw', i) * 10, 3);
    c.restore();
  } });
  // shelves: two tiers, each a top board seen a little from above and a front plank
  const plank = { color: '#9c8466', tex: 'log', ts: 0.6, edge: 0.35 };
  add('sh2-top', cs([[ST.x0 + 60, ST.shelf2 - 24], [ST.x1 - 60, ST.shelf2 - 24], [ST.x1 - 50, ST.shelf2], [ST.x0 + 50, ST.shelf2]], 50), { ...plank, color: '#a58d6e', lift: 5 });
  add('sh2-front', box(ST.x0 + 46, ST.shelf2, ST.x1 - 46, ST.shelf2 + 16, 51), { ...plank, lift: 7 });
  add('sh2-leg-l', box(ST.x0 + 60, ST.shelf2 + 16, ST.x0 + 76, ST.shelf1 - 24, 52), { ...plank, color: '#7e6850', lift: 4 });
  add('sh2-leg-r', box(ST.x1 - 76, ST.shelf2 + 16, ST.x1 - 60, ST.shelf1 - 24, 53), { ...plank, color: '#7e6850', lift: 4 });
  add('sh1-top', cs([[ST.x0 + 30, ST.shelf1 - 26], [ST.x1 - 30, ST.shelf1 - 26], [ST.x1 - 18, ST.shelf1], [ST.x0 + 18, ST.shelf1]], 54), { ...plank, color: '#ae9676', lift: 7 });
  add('sh1-front', box(ST.x0 + 14, ST.shelf1, ST.x1 - 14, ST.shelf1 + 20, 55), { ...plank, lift: 9 });
  add('sh1-leg-l', box(ST.x0 + 30, ST.shelf1 + 20, ST.x0 + 48, GROUND - 20, 56), { ...plank, color: '#7e6850', lift: 6 });
  add('sh1-leg-r', box(ST.x1 - 48, ST.shelf1 + 20, ST.x1 - 30, GROUND - 20, 57), { ...plank, color: '#7e6850', lift: 6 });
  add('sh1-leg-m', box(800 - 9, ST.shelf1 + 20, 800 + 9, GROUND - 20, 58), { ...plank, color: '#7e6850', lift: 6 });
  // front posts
  add('post-l', box(ST.x0 - 16, ST.roof + 10, ST.x0 + 12, GROUND - 16, 60, { jag: 0.2 }), { color: '#86705a', tex: 'log', ts: 0.5, tx: 40, lift: 16, edge: 0.4 });
  add('post-r', box(ST.x1 - 12, ST.roof + 10, ST.x1 + 16, GROUND - 16, 61, { jag: 0.2 }), { color: '#86705a', tex: 'log', ts: 0.5, tx: 70, lift: 16, edge: 0.4 });
  add('brace-l', cs([[ST.x0 + 8, ST.roof + 60], [ST.x0 + 14, ST.roof + 44], [ST.x0 + 90, ST.roof + 36], [ST.x0 + 90, ST.roof + 48]], 62), { color: '#7b6450', tex: 'wood', lift: 15, edge: 0.3 });
  add('brace-r', cs([[ST.x1 - 8, ST.roof + 60], [ST.x1 - 14, ST.roof + 44], [ST.x1 - 90, ST.roof + 36], [ST.x1 - 90, ST.roof + 48]], 63), { color: '#7b6450', tex: 'wood', lift: 15, edge: 0.3 });

  // --- surroundings -------------------------------------------------------------
  const far = [ridge(900, 250, 70), ridge(901, 330, 60)];
  const cedars = [];
  for (let i = 0; i < 26; i++) {
    const x = -700 + i * 118 + hs('cx', i) * 40;
    const h = 520 + hash('ch', i) * 360;
    cedars.push({ x, y: GROUND - 60 - hash('cy', i) * 50, h, sh: cedar(h, 700 + i), dark: hash('cd', i) });
  }
  const slope = cs([[-1400, GROUND - 120], [-400, GROUND - 170], [400, GROUND - 190], [1400, GROUND - 160], [2800, GROUND - 120], [2800, GROUND + 40], [-1400, GROUND + 40]], 720);
  const road = box(-1600, GROUND + 26, 3400, 1500, 730, { jag: 0.1, wander: 0.2 });
  const shoulder = box(-1600, GROUND - 2, 3400, GROUND + 30, 731, { jag: 0.6, wander: 1 });
  const line = box(-1600, GROUND + 62, 3400, GROUND + 70, 732, { jag: 0.1, wander: 0.3 });
  const gutter = box(-1600, GROUND + 24, 3400, GROUND + 34, 733, { jag: 0.1 });
  // guardrail on the left, along the road's edge
  const rail = box(-1500, GROUND - 60, 120, GROUND - 38, 740, { jag: 0.1, wander: 0.2 });
  const railPosts = [];
  for (let x = -1480; x <= 100; x += 160) railPosts.push(box(x, GROUND - 64, x + 12, GROUND + 4, 741 + x));
  // a curve mirror on an orange pole
  const mirrorPole = box(-156, GROUND - 520, -144, GROUND + 4, 760, { jag: 0.1 });
  const mirror = disc(62, 761);
  const mirrorRim = disc(70, 762);
  // a utility pole and its wires
  const pole = box(1760, -300, 1790, GROUND + 4, 770, { jag: 0.2 });
  const arm = box(1700, -160, 1850, -148, 771);
  // grass tufts along the shoulder
  const tufts = [];
  for (let i = 0; i < 40; i++) {
    const x = -1400 + i * 110 + hs('tx', i) * 30;
    if (x > ST.x0 - 40 && x < ST.x1 + 40) continue;
    const blades = [];
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.25 + hs('ta', i, k) * 0.1;
      const l = 26 + hash('tl', i, k) * 30;
      blades.push([[x + k * 4 - 10, GROUND + 2], [x + k * 4 - 10 + Math.cos(a) * l, GROUND + 2 + Math.sin(a) * l], [x + k * 4 - 6, GROUND + 2]]);
    }
    tufts.push(cs(blades, 780 + i, { jag: 0.2, wander: 0.3, step: 8 }));
  }
  // clouds (summer)
  const clouds = [0, 1, 2, 3].map((i) => {
    const pts = [];
    const n = 7;
    for (let k = 0; k <= n; k++) {
      const a = Math.PI + (k / n) * Math.PI;
      const rr = 60 + hash('cl', i, k) * 50;
      pts.push([Math.cos(a) * (170 + i * 30) + hs('cx', i, k) * 20, Math.sin(a) * rr]);
    }
    return cs(smooth(pts, true, 4), 800 + i, { jag: 0.5, wander: 1.2 });
  });
  S = { still, far, cedars, slope, road, shoulder, line, gutter, rail, railPosts, mirrorPole, mirror, mirrorRim, pole, arm, tufts, clouds };
}

// ---------------------------------------------------------------------------
// Light for each time of day.
const TIMES = {
  dawn: { sky: ['#8494b2', '#e6cfc4'], ambient: '#707890', far: '#8390a3', near: '#61705f', cedar: '#3d4d3c', slope: '#6b7a5c', sun: null, mist: 0.75 },
  july: { sky: ['#8fbde0', '#e6eff2'], ambient: '#b0aaa2', far: '#8aa2b0', near: '#557a45', cedar: '#2f5230', slope: '#6f9046', sun: { from: [-0.5, -1], color: [255, 238, 205], a: 0.75 } },
  august: { sky: ['#7fb4e0', '#eef2ee'], ambient: '#aca69c', far: '#90a8b4', near: '#4f7540', cedar: '#2b4d2c', slope: '#6b8c40', sun: { from: [-0.15, -1], color: [255, 242, 210], a: 0.85 }, haze: 1 },
  nov: { sky: ['#5f6f98', '#f0ad86'], ambient: '#6f6a80', far: '#7b7488', near: '#8a6a3e', cedar: '#39473a', slope: '#8d7447', sun: null, glowFrom: [-900, 200], autumn: 1 },
};

function sky(T, f) {
  const ctx = R.ctx;
  const g = ctx.createLinearGradient(0, -700, 0, GROUND);
  g.addColorStop(0, T.sky[0]);
  g.addColorStop(1, T.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(-2600, -1400, 7000, 2600);
  const p = pat('washi');
  setPat(p, 0, 0, 1.4, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = p;
  ctx.fillRect(-2600, -1400, 7000, 2600);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// o: time ('dawn'|'july'|'august'|'nov'), cam, bags (array of slot indices, or 'all'),
//    autumn (the November produce instead), sign { fade, lamCloud }, box { lock, jolt },
//    back() drawn behind the stand's front (e.g. a car parked beside), fg() in front of it,
//    front() on top of everything (after the light), lightsExtra, mist override, plan, note
export function stand(o) {
  if (!S) build();
  const T = TIMES[o.time || 'july'];
  const { cam } = o;
  const f = R.frame;
  R.anchor = { x: 800, y: 470 };
  R.light = T.sun ? { x: -T.sun.from[0] * 0.9, y: -T.sun.from[1] * 0.9 } : { x: 0.2, y: 0.6 };
  // The light (and so each piece's shadow and kept bounds) follows the time, so every kept piece is named per time.
  withCam(cam.x, cam.y, cam.z, () => {
    const ctx = R.ctx;
    // 1. the far planes
    withPlane(0.08, () => {
      sky(T, f);
      if (!o.time || o.time === 'july' || o.time === 'august') {
        S.clouds.forEach((c, i) => stillPiece('st-cloud' + i + '|' + o.time, c, { x: -300 + i * 620, y: -40 - (i % 2) * 90, color: '#f6f7f4', tex: 'washi', lift: 4, edge: 0.2, alpha: 0.95, maxQ: 0.9 }));
      }
    });
    withPlane(0.22, () => stillPiece('st-far0|' + o.time, S.far[0], { color: T.far, tex: 'washi', ts: 1.2, lift: 3, edge: 0.15, maxQ: 0.6 }));
    withPlane(0.35, () => stillPiece('st-far1|' + o.time, S.far[1], { color: mixHex(T.far, T.near, 0.5), tex: 'washi', ts: 1.2, lift: 4, edge: 0.15, maxQ: 0.6 }));
    if (T.mist) mistBand(0.4, 360, T.mist * (o.mist ?? 1));
    withPlane(0.6, () => {
      for (const [i, c] of S.cedars.entries()) {
        const col = T.autumn && hash('au', i) > 0.55 ? mixHex(['#b8872e', '#9a4f2a', '#c9a23a'][i % 3], T.cedar, 0.25) : mixHex(T.cedar, '#1f3320', c.dark * 0.5);
        stillPiece('st-cedar' + i + '|' + o.time, c.sh, { x: c.x, y: c.y, color: col, tex: 'washi', ts: 0.8, lift: 6, edge: 0.2, maxQ: 0.9 });
      }
      stillPiece('st-slope|' + o.time, S.slope, { color: T.slope, tex: 'washi', ts: 1, lift: 5, edge: 0.2, maxQ: 0.8 });
    });
    if (T.mist) mistBand(0.75, 640, T.mist * 0.8 * (o.mist ?? 1));

    // 2. the stand, its things, and whatever stands around it
    withPlane(0.94, () => {
      stillPiece('st-mirror-pole|' + o.time, S.mirrorPole, { color: '#d9722f', tex: 'plain', lift: 10, edge: 0.4 });
      stillPiece('st-mirror-rim|' + o.time, S.mirrorRim, { x: -150, y: GROUND - 560, color: '#e07a34', tex: 'plain', lift: 12, edge: 0.4 });
      stillPiece('st-mirror|' + o.time, S.mirror, { x: -150, y: GROUND - 560, color: mixHex(T.sky[1], '#9aa4a8', 0.4), tex: null, lift: 13, edge: 0.6 });
    });
    stillPiece('st-shoulder|' + o.time, S.shoulder, { color: '#a49c8e', tex: 'gravel', ts: 0.5, lift: 1, edge: 0.1, maxQ: 1.2 });
    if (o.back) o.back();
    for (const p of S.still) stillPiece(p.key + '|' + o.time, p.sh, p.o);
    produce(o);
    cashBox(BOXPOS.x, BOXPOS.y, o.box || {});
    qrStand(QRPOS.x, QRPOS.y, 1);
    extras(o);
    sign(SIGNPOS.x, SIGNPOS.y, 1, { fade: o.sign?.fade || 0, lamCloud: o.sign?.lamCloud || 0, lift: 4, sway: o.sign?.sway || 0 });
    stillPiece('st-rail|' + o.time, S.rail, { color: '#d7d9d6', tex: 'plain', lift: 6, edge: 0.5, maxQ: 1.2 });
    S.railPosts.forEach((p, i) => stillPiece('st-rp' + i + '|' + o.time, p, { color: '#c9ccc8', tex: 'plain', lift: 5, edge: 0.4 }));
    S.tufts.forEach((t, i) => stillPiece('st-tuft' + i + '|' + o.time, t, { color: T.autumn ? '#9a8a52' : '#6f9a48', tex: 'washi', lift: 3, edge: 0.2 }));
    stillPiece('st-gutter|' + o.time, S.gutter, { color: '#8a8780', tex: 'block', ts: 0.4, lift: 2, edge: 0.3, maxQ: 0.8 });
    stillPiece('st-road|' + o.time, S.road, { color: '#5d5d5f', tex: 'gravel', ts: 0.35, lift: 1, edge: 0.2, maxQ: 0.8 });
    stillPiece('st-line|' + o.time, S.line, { color: '#e8e6dc', tex: 'plain', lift: 1.5, edge: 0.1, maxQ: 0.8 });
    if (o.fg) o.fg();
    withPlane(1.35, () => {
      stillPiece('st-pole|' + o.time, S.pole, { color: '#6e6a62', tex: 'plain', lift: 20, edge: 0.3, maxQ: 1.2 });
      stillPiece('st-arm|' + o.time, S.arm, { color: '#5e5a54', tex: 'plain', lift: 20, edge: 0.3 });
    });
    wires(T);

    // 3. light
    lights(T.ambient, lightList(T, o));

    // 4. after the light: glow, haze, headlights
    if (T.haze) haze(f);
    if (o.front) o.front();
    bloomFlush(o.bloom ?? 0.6);
  });
}

function lightList(T, o) {
  const Ls = [];
  if (T.sun) {
    const [dx, dy] = T.sun.from;
    // open sky over everything, then the sun; the roof and the cedars shade what is under them
    Ls.push({ type: 'rect', x: -2000, y: -1500, w: 6000, h: 3200, blur: 10, color: T.sun.color, a: T.sun.a });
    // the roof's shadow on the back wall and the shelves (the front posts and the sign stay in the sun)
    const drop = dy < -0.7 ? 470 : 250; // a high sun throws the shadow further down
    Ls.push({ type: 'shade', pts: [[ST.x0 + 20, ST.roof + 10], [ST.x1 - 52, ST.roof + 10], [ST.x1 - 52, ST.back + drop - 60], [ST.x0 + 20, ST.back + drop + 40]], blur: 40, color: [168, 166, 182], a: 1 });
  } else if (T.glowFrom) {
    // November, just before four: the sun is behind the ridge; the sky over it still glows
    Ls.push({ type: 'rect', x: -2000, y: -1500, w: 6000, h: 1800, blur: 400, color: [120, 110, 120], a: 0.5 });
    Ls.push({ x: T.glowFrom[0], y: T.glowFrom[1], r: 2200, color: [255, 170, 110], a: 0.5, core: 0.2 });
  } else {
    // dawn: the sky is the only light
    Ls.push({ type: 'rect', x: -2000, y: -1500, w: 6000, h: 1900, blur: 300, color: [120, 124, 136], a: 0.5 });
    Ls.push({ x: 1700, y: -200, r: 1400, color: [255, 180, 150], a: 0.3 });
  }
  if (o.lightsExtra) Ls.push(...o.lightsExtra);
  return Ls;
}

// The produce on the shelves.
function produce(o) {
  if (o.autumn) {
    daikon(470, ST.shelf1 - 6, { r: -0.03, seed: 1 });
    daikon(640, ST.shelf1 - 4, { r: 0.02, seed: 2 });
    daikon(810, ST.shelf1 - 7, { r: -0.01, seed: 3 });
    hakusai(1000, ST.shelf1 - 2, { seed: 1 });
    hakusai(1130, ST.shelf1 - 4, { seed: 2 });
    for (let i = 0; i < 4; i++) komatsuna(470 + i * 120, ST.shelf2 - 2, { seed: i, r: hs('kr', i) * 0.05 });
    return;
  }
  const list = o.bags === 'all' || o.bags === undefined ? SLOTS.map((_, i) => i) : o.bags;
  // back row first so the front row overlaps it
  const order = [...list].sort((a, b) => SLOTS[a].y - SLOTS[b].y);
  for (const i of order) {
    const s = SLOTS[i];
    if (o.lifted && o.lifted.includes(i)) continue;
    if (o.live && o.live.includes(i)) bag(s.kind, s.x, s.y, { r: s.r, seed: s.seed });
    else bagStill('slot' + i, s.kind, s.x, s.y, { r: s.r, seed: s.seed });
  }
}

// Paper added to the stand later (November): the plan on the wall, Kadowaki's note.
function extras(o) {
  if (o.plan) planSheet(o.plan);
  if (o.note) noteSheet(o.note);
}

export const PLANPOS = { x: 1080, y: 220 };
export const NOTEPOS = { x: 870, y: 700 };
let PLAN_S = null, NOTE_S = null;
export function planSheet(p = {}) {
  PLAN_S ||= cutShape(rectPts(118, 84, 0, 0), 870, { jag: 0.05, wander: 0.1, step: 20 });
  piece(PLAN_S, { x: PLANPOS.x + 59, y: PLANPOS.y + 42, r: -0.01 + (p.lift || 0) * 0.02, color: '#f7f5ee', tex: 'plain', ts: 0.3, lift: 2 + (p.lift || 0) * 6, edge: 0.3, print: (c) => planPrint(c) });
  // tape at the corners
  const ctx = R.ctx;
  ctx.fillStyle = 'rgba(240,244,240,0.55)';
  for (const [x, y] of [[0, 0], [118, 0], [0, 84], [118, 84]]) ctx.fillRect(PLANPOS.x + x - 7, PLANPOS.y + y - 3, 14, 6);
}
export function planPrint(c) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(64,66,74,0.62)';
  c.font = `400 7px ${F.mono}`;
  c.textBaseline = 'middle';
  c.strokeStyle = 'rgba(64,66,74,0.3)';
  c.lineWidth = 0.4;
  PLAN.forEach((l, i) => {
    c.fillText(l, -52, -26 + i * 15);
    c.beginPath(); c.moveTo(-54, -18 + i * 15); c.lineTo(54, -18 + i * 15); c.stroke();
  });
  c.restore();
}
export function noteSheet(n = {}) {
  NOTE_S ||= cutShape([[0, 0], [70, 0], [70, 46], [0, 46]], 880, { jag: 0.3, wander: 0.4, step: 8 });
  piece(NOTE_S, { x: NOTEPOS.x, y: NOTEPOS.y, r: 0.03 + (n.wave || 0) * 0.04, color: '#f4f1e6', tex: 'plain', ts: 0.3, lift: 3 + (n.wave || 0) * 5, edge: 0.3, print: (c) => notePrint(c) });
}
export function notePrint(c) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.strokeStyle = 'rgba(90,120,170,0.45)';
  c.lineWidth = 0.4;
  for (let y = 8; y < 46; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(70, y); c.stroke(); }
  c.fillStyle = 'rgba(30,30,40,0.9)';
  c.font = `400 7.4px ${F.pen}`;
  c.textBaseline = 'middle';
  c.fillText(NOTE.head, 5, 11);
  c.font = `400 9.6px ${F.pen}`;
  c.fillText(NOTE.name, 36, 20);
  // the number: the fourth figure went thin and was gone over again; the rest is off the edge
  c.font = `400 7.6px ${F.pen}`;
  c.fillText(NOTE.tel, 6, 33);
  c.lineWidth = 0.5;
  c.strokeStyle = 'rgba(30,30,40,0.7)';
  c.strokeText('8', 6 + c.measureText('090-').width, 33);
  c.fillStyle = 'rgba(30,30,40,0.45)';
  c.fillText('…', 6 + c.measureText('090-8').width + 1, 33);
  c.restore();
}

// A soft band of mist drifting between planes.
function mistBand(par, y, a) {
  withPlane(par, () => {
    const ctx = R.ctx;
    const f = R.frame;
    for (let i = 0; i < 3; i++) {
      const g = ctx.createLinearGradient(0, y - 120, 0, y + 120);
      g.addColorStop(0, 'rgba(236,236,240,0)');
      g.addColorStop(0.5, `rgba(236,236,240,${0.32 * a})`);
      g.addColorStop(1, 'rgba(236,236,240,0)');
      ctx.fillStyle = g;
      const dx = ((Math.floor(f / 2) * (1.2 + i * 0.5)) % 1200) - 600;
      ctx.fillRect(-2000 + dx + i * 300, y - 120 + i * 20, 5000, 240);
    }
  });
}

// Heat over the road in August: bright shimmer on twos.
function haze(f) {
  const ctx = R.ctx;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const y = GROUND + 40 + i * 14;
    ctx.fillStyle = `rgba(255,250,235,${0.05 + 0.04 * Math.abs(hs('hz', i, Math.floor(f / 2)))})`;
    ctx.fillRect(-2000 + hs('hx', i, Math.floor(f / 2)) * 30, y, 6000, 6);
  }
  ctx.restore();
}

function wires(T) {
  const ctx = R.ctx;
  ctx.save();
  ctx.strokeStyle = 'rgba(30,30,34,0.75)';
  ctx.lineWidth = 2;
  for (const dy of [0, 22]) {
    ctx.beginPath();
    ctx.moveTo(-2000, -80 + dy);
    ctx.quadraticCurveTo(800, 60 + dy, 1775, -150 + dy);
    ctx.stroke();
  }
  ctx.restore();
}
