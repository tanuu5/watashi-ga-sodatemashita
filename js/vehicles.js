// vehicles.js — cars cut from card, side on, facing right (dir -1 flips them).
// Origin: on the ground, under the middle of the car. Wheels turn on twos.
import { R, piece, glow } from './render.js';
import { cutShape, smooth, disc } from './cut.js';
import { hash, hs, mixHex } from './util.js';
import { crate } from './props.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.3, wander: 0.7, step: 16, corner: 0.4, ...o });
const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };

const MODELS = {
  // a small white hatchback from the rental place
  hatch: {
    body: [[-600, -70], [-604, -230], [-570, -300], [-430, -326], [-310, -436], [70, -448], [240, -330], [500, -296], [598, -236], [604, -120], [590, -64], [-590, -64]],
    glass: [[-292, -418], [58, -428], [210, -334], [-418, -330]],
    pillar: [-110, -426, -96, -332],
    wheels: [[-385, 92], [375, 92]],
    lights: { front: [585, -238], back: [-600, -250] },
    color: '#e8e8e2', trim: '#3a3a40',
  },
  // the neighbour's kei truck: cab over the front wheels, a flat bed behind
  kei: {
    body: [[-520, -60], [-520, -250], [60, -250], [60, -560], [310, -566], [420, -500], [470, -330], [520, -290], [526, -120], [516, -60]],
    glass: [[110, -540], [300, -544], [396, -408], [110, -404]],
    pillar: null,
    wheels: [[-330, 78], [330, 78]],
    lights: { front: [512, -280], back: [-516, -232] },
    color: '#ecece6', trim: '#3a3a40', bed: true,
  },
  // a tall little wagon
  wagon: {
    body: [[-520, -60], [-530, -470], [-470, -540], [200, -548], [380, -440], [510, -300], [522, -120], [512, -60]],
    glass: [[-440, -520], [180, -526], [330, -420], [-460, -404]],
    pillar: [-120, -520, -104, -406],
    wheels: [[-330, 80], [320, 80]],
    lights: { front: [505, -300], back: [-522, -330] },
    color: '#b9cfd3', trim: '#3a3a40',
  },
  // the prefecture's white car
  pref: {
    body: [[-640, -70], [-646, -250], [-610, -330], [-360, -350], [-250, -460], [180, -466], [330, -350], [560, -320], [640, -250], [646, -120], [632, -70]],
    glass: [[-236, -442], [170, -448], [300, -356], [-340, -352]],
    pillar: [-40, -446, -26, -354],
    wheels: [[-420, 94], [420, 94]],
    lights: { front: [628, -250], back: [-640, -270] },
    color: '#f0f0ec', trim: '#3a3a40', stripe: '#3f7a52',
  },
};

function shapes(kind) {
  return memo(kind, () => {
    const M = MODELS[kind];
    return {
      body: cs(M.body, 1000 + kind.length),
      glass: cs(M.glass, 1010 + kind.length, { jag: 0.1, wander: 0.2 }),
      tyre: M.wheels.map(([, r], i) => disc(r, 1020 + i)),
      hub: M.wheels.map(([, r], i) => disc(r * 0.55, 1030 + i)),
      arch: M.wheels.map(([, r], i) => disc(r * 1.12, 1040 + i)),
      bumper: cs([[M.body[0][0] - 6, -60], [M.body[0][0] - 6, -100], [-M.body[0][0] + 6, -100], [-M.body[0][0] + 6, -60]], 1050 + kind.length, { jag: 0.1 }),
    };
  });
}

// o: kind, x, y (ground), dir, roll (wheel angle), color, lights (0..1), bump (body bounce),
//    driver (fn drawing whoever sits inside, in car coordinates), load (kei: crates), lift
export function car(o) {
  const M = MODELS[o.kind];
  const S = shapes(o.kind);
  const { x, y, dir = 1, roll = 0, lights = 0, bump = 0, s = 1 } = o;
  const color = o.color || M.color;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  // wheels, arches behind the body
  M.wheels.forEach(([wx, r], i) => piece(S.arch[i], { x: wx, y: -r, color: '#1e1d20', tex: null, lift: 3, edge: 0 }));
  ctx.save();
  ctx.translate(0, -bump);
  piece(S.body, { color, tex: 'plain', ts: 0.8, lift: 10, edge: 0.45, print: (c) => bodyPrint(c, o.kind, M) });
  piece(S.glass, { color: '#3b4450', tex: null, lift: 11, edge: 0.3, print: (c) => {
    // sky caught in the glass
    const g = c.createLinearGradient(0, M.glass[0][1], 0, M.glass[3][1]);
    g.addColorStop(0, 'rgba(200,215,230,0.55)');
    g.addColorStop(0.5, 'rgba(120,140,160,0.25)');
    g.addColorStop(1, 'rgba(60,70,80,0.1)');
    c.fillStyle = g;
    c.fillRect(-700, -700, 1400, 700);
    if (o.driver) o.driver(c);
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(M.glass[1][0] - 60, M.glass[1][1] + 10);
    c.lineTo(M.glass[1][0] - 140, M.glass[2][1] - 10);
    c.stroke();
  } });
  if (M.pillar) {
    const [x0, y0, x1, y1] = M.pillar;
    piece(memo(o.kind + 'pil', () => cs([[x0, y0], [x0 + 16, y0], [x1 + 16, y1], [x1, y1]], 1060)), { color: mixHex(color, '#333', 0.35), tex: 'plain', lift: 12, edge: 0 });
  }
  if (M.bed) {
    // the flat bed and its gate; what is loaded rides on it
    piece(memo('bed', () => cs([[-520, -250], [60, -250], [60, -290], [-520, -290]], 1070)), { color: mixHex(color, '#999', 0.25), tex: 'plain', lift: 12, edge: 0.4 });
    if (o.load) o.load(ctx);
  }
  piece(S.bumper, { color: M.trim, tex: 'plain', lift: 12, edge: 0.3 });
  ctx.restore();
  M.wheels.forEach(([wx, r], i) => {
    piece(S.tyre[i], { x: wx, y: -r, color: '#222226', tex: 'plain', ts: 0.5, lift: 13, edge: 0.25 });
    piece(S.hub[i], { x: wx, y: -r, r: roll, color: '#b9bcbf', tex: 'plain', lift: 14, edge: 0.5, print: (c) => {
      c.fillStyle = 'rgba(40,40,44,0.55)';
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        c.beginPath();
        c.ellipse(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, r * 0.1, r * 0.07, a, 0, Math.PI * 2);
        c.fill();
      }
    } });
  });
  ctx.restore();
  return { lightsAt: () => headlights(o, M) };
}

function bodyPrint(c, kind, M) {
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.strokeStyle = 'rgba(40,40,50,0.35)';
  c.lineWidth = 2.4;
  c.beginPath();
  // a door seam or two and a crease along the side
  const b = M.body;
  const xs = kind === 'kei' ? [110] : [-130, 150];
  for (const x of xs) { c.moveTo(x, -330); c.lineTo(x - 6, -80); }
  c.moveTo(b[0][0] + 30, -200); c.lineTo(-b[0][0] - 30, -210);
  c.stroke();
  // door handles
  c.fillStyle = 'rgba(40,40,50,0.45)';
  for (const x of xs) c.fillRect(x - 60, -280, 40, 8);
  c.restore();
  // lamps
  c.fillStyle = '#e8e3c8';
  c.fillRect(M.lights.front[0] - 26, M.lights.front[1] - 14, 26, 24);
  c.fillStyle = '#b2322c';
  c.fillRect(M.lights.back[0], M.lights.back[1] - 20, 18, 34);
  if (M.stripe) {
    c.fillStyle = M.stripe;
    c.fillRect(b[0][0] + 10, -176, -b[0][0] * 2 - 20, 12);
    c.fillStyle = '#f7f7f2';
    c.beginPath();
    c.arc(-20, -240, 26, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = M.stripe;
    c.lineWidth = 4;
    c.stroke();
  }
}

// Headlight beams, for after the light pass (world coordinates via the current transform).
function headlights(o, M) {
  if (!o.lights) return;
  const ctx = R.ctx;
  const dir = o.dir || 1;
  const [fx, fy] = M.lights.front;
  const hx = o.x + fx * dir * (o.s || 1), hy = o.y + fy * (o.s || 1);
  glow(hx, hy, 60, '255,236,190', 0.9 * o.lights);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(hx, hy, hx + dir * 1400, hy + 160);
  g.addColorStop(0, `rgba(255,236,190,${0.32 * o.lights})`);
  g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(hx, hy - 10);
  ctx.lineTo(hx + dir * 1400, hy - 120);
  ctx.lineTo(hx + dir * 1400, hy + 320);
  ctx.lineTo(hx, hy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Four empty crates on the kei truck's bed (drawn in the car's frame).
export function keiLoad(n = 4, o = {}) {
  return () => {
    for (let i = 0; i < n; i++) crate(-400 + (i % 2) * 150 + (o.neat ? 0 : hs('cr', i) * 8), -290 - Math.floor(i / 2) * 40, { r: o.neat ? 0 : hs('crr', i) * 0.04, lift: 13, color: i % 2 ? '#e2b43a' : '#d9a92c' });
  };
}

// Wheel angle for a car that has travelled dx (world units).
export const rollFor = (kind, dx) => dx / MODELS[kind].wheels[0][1];
