// sets/road.js — the mountain road, side on. The camera rides along with the car:
// terraced fields and cedars behind, cedar trunks flicking past in front.
// time: 'july' (white sun) | 'nov' (the colours turned, dusk before four, headlights on)
import { R, withCam, withPlane, piece, stillPiece, lights, bloomFlush, glow, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, disc } from '../cut.js';
import { rng, hash, hs, mixHex, lerp, clamp } from '../util.js';
import { car, rollFor } from '../vehicles.js';
import { bag } from '../props.js';

export const ROAD_Y = 800;
const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.4, wander: 1, step: 16, corner: 0.5, ...o });
const box = (x0, y0, x1, y1, seed, o) => cs(rectPts(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2), seed, o);

let S = null;
function build() {
  const r = rng(404);
  // terraced fields climbing away behind the road: steps of earth with green on their lips
  const terraces = [];
  for (let k = 0; k < 6; k++) {
    const y = ROAD_Y - 80 - k * 70;
    const pts = [[-3000, 1400]];
    for (let x = -3000; x <= 6000; x += 160) pts.push([x, y + Math.sin(x * 0.002 + k) * 26 + hs('tr', k, x) * 6]);
    pts.push([6000, 1400]);
    terraces.push(cs(pts, 500 + k, { jag: 0.5, wander: 1.2, step: 30 }));
  }
  const ridge = (seed, y0, amp) => {
    const pts = [[-3000, 1400]];
    let y = y0;
    for (let x = -3000; x <= 6000; x += 90) { y += (r() - 0.5) * amp; y = lerp(y, y0, 0.1); pts.push([x, y]); }
    pts.push([6000, 1400]);
    return cs(pts, seed, { jag: 0.6, wander: 1.2, step: 30 });
  };
  const cedarCone = (h, seed) => {
    const pts = [[0, -h]];
    for (let i = 1; i <= 8; i++) pts.push([h * 0.2 * (i / 8) + hs(seed, i) * 4, -h + (h * i) / 8 - 8], [h * 0.12 * (i / 8), -h + (h * i) / 8]);
    pts.push([6, 0], [-6, 0]);
    for (let i = 8; i >= 1; i--) pts.push([-h * 0.12 * (i / 8), -h + (h * i) / 8], [-h * 0.2 * (i / 8) - hs(seed, 'l', i) * 4, -h + (h * i) / 8 - 8]);
    return cs(pts, seed, { jag: 0.7, wander: 1, step: 10 });
  };
  const backCedars = [];
  for (let i = 0; i < 60; i++) backCedars.push({ x: -2800 + i * 150 + hs('bcx', i) * 50, h: 300 + hash('bch', i) * 260, sh: cedarCone(300 + hash('bch', i) * 260, 600 + i) });
  const trunks = [];
  for (let i = 0; i < 9; i++) trunks.push({ x: -2600 + i * 1000 + hs('tx', i) * 300, w: 60 + hash('tw', i) * 50, sh: box(-24, -1400, 24, 300, 700 + i, { jag: 0.5 }) });
  S = {
    terraces,
    far: ridge(801, 240, 70),
    near: ridge(802, 420, 50),
    backCedars,
    trunks,
    road: box(-3000, ROAD_Y, 6000, ROAD_Y + 90, 900, { jag: 0.2 }),
    line: box(-3000, ROAD_Y + 50, 6000, ROAD_Y + 56, 901, { jag: 0.1 }),
    verge: box(-3000, ROAD_Y + 90, 6000, 1500, 902),
    table: box(-60, -70, 60, -58, 910),
    tableLeg: box(-4, -58, 4, 0, 911),
    rail: box(-3000, ROAD_Y + 20, 6000, ROAD_Y + 36, 920, { jag: 0.1 }),
  };
}

// o: time, carX (the car's position), cam, lights (headlights 0..1), stands ([x...] roadside tables),
//    oncoming (x of a car coming the other way, or null), smoke (0..1), after()
export function road(o) {
  if (!S) build();
  const f = R.frame;
  const nov = o.time === 'nov';
  const cam = o.cam;
  R.anchor = { x: o.carX, y: 470 };
  R.light = nov ? { x: 0.2, y: 0.5 } : { x: 0.35, y: 0.8 };
  let lamps = [];
  withCam(cam.x, cam.y, cam.z, () => {
    const ctx = R.ctx;
    withPlane(0.05, () => {
      const g = ctx.createLinearGradient(0, -400, 0, ROAD_Y);
      g.addColorStop(0, nov ? '#56608a' : '#86b8de');
      g.addColorStop(1, nov ? '#e6a47e' : '#e8f0f0');
      ctx.fillStyle = g;
      ctx.fillRect(o.carX - 3000, -1200, 6000, 2600);
    });
    withPlane(0.15, () => stillPiece('rd-far|' + o.time, S.far, { color: nov ? '#7b6f86' : '#8aa6b6', tex: 'washi', lift: 2, edge: 0.1, maxQ: 0.45 }));
    withPlane(0.3, () => stillPiece('rd-near|' + o.time, S.near, { color: nov ? '#8a6a52' : '#5f845a', tex: 'washi', lift: 3, edge: 0.1, maxQ: 0.45 }));
    withPlane(0.45, () => {
      for (const [i, c] of S.backCedars.entries()) {
        const col = nov && hash('rau', i) > 0.5 ? ['#b8872e', '#9a4f2a', '#c9a23a'][i % 3] : nov ? '#3f4b3c' : mixHex('#2f5230', '#244226', hash('rc', i));
        stillPiece('rd-bc' + i + '|' + o.time, c.sh, { x: c.x, y: 470, color: col, tex: 'washi', lift: 4, edge: 0.15, maxQ: 0.7 });
      }
    });
    withPlane(0.7, () => {
      S.terraces.forEach((t, k) => stillPiece('rd-ter' + k + '|' + o.time, t, {
        y: -k * 4, color: nov ? mixHex('#9a7a4a', '#7a6a4a', k / 6) : mixHex('#7a9a48', '#5f7f3a', k / 6), tex: 'soil', ts: 0.8, lift: 3, edge: 0.3, maxQ: 0.45,
        print: (c) => {
          // the green lip of each step
          c.fillStyle = nov ? 'rgba(160,140,80,0.6)' : 'rgba(90,150,70,0.7)';
          const y = ROAD_Y - 80 - (5 - k) * 70;
          c.fillRect(-3000, y - 4, 9000, 10);
        },
      }));
    });
    stillPiece('rd-rail', S.rail, { color: '#d7d9d6', tex: 'plain', lift: 5, edge: 0.4, maxQ: 0.45 });
    stillPiece('rd-road', S.road, { color: '#6a6a6c', tex: 'gravel', ts: 0.4, lift: 2, edge: 0.2, maxQ: 0.45 });
    stillPiece('rd-line', S.line, { color: '#e6e3d8', tex: 'plain', lift: 2, edge: 0, maxQ: 0.45 });
    // roadside tables with cucumbers, and a plastic case for the money
    for (const [i, x] of (o.stands || []).entries()) {
      piece(S.tableLeg, { x: x - 50, y: ROAD_Y + 20, color: '#6a5a48', tex: 'wood', lift: 5 });
      piece(S.tableLeg, { x: x + 50, y: ROAD_Y + 20, color: '#6a5a48', tex: 'wood', lift: 5 });
      piece(S.table, { x, y: ROAD_Y + 20, color: '#8a7056', tex: 'wood', lift: 6, edge: 0.4 });
      for (let k = 0; k < 3; k++) cucumberBag(x - 38 + k * 30, ROAD_Y - 38, i * 3 + k);
      piece(S.table, { x: x + 44, y: ROAD_Y - 36, sx: 0.18, sy: 2.4, color: '#dfe6e8', tex: null, lift: 7, edge: 0.6, alpha: 0.7 });
    }
    if (o.oncoming !== undefined && o.oncoming !== null) lamps.push(car({ kind: 'wagon', x: o.oncoming, y: ROAD_Y + 72, dir: 1, roll: rollFor('wagon', o.oncoming), lights: nov ? 1 : 0, color: '#8a8a90' }));
    lamps.push(car({ kind: 'hatch', x: o.carX, y: ROAD_Y + 86, dir: -1, roll: -rollFor('hatch', o.carX), bump: Math.abs(hs('bump', Math.floor(f / 2))) * 2, lights: o.lights || 0, driver: o.driver }));
    stillPiece('rd-verge|' + o.time, S.verge, { color: nov ? '#7a6a48' : '#5f7f3a', tex: 'washi', lift: 4, edge: 0.2, maxQ: 0.45 });
    // cedar trunks, very near, sweeping past
    withPlane(1.9, () => {
      for (const [i, t] of S.trunks.entries()) {
        stillPiece('rd-tr' + i + '|' + o.time, t.sh, { x: t.x, y: ROAD_Y + 400, sx: t.w / 48, color: nov ? '#3a2e2a' : '#3a3228', tex: 'wood', ts: 0.5, lift: 20, edge: 0.3, maxQ: 0.8 });
      }
    });
    lights(nov ? '#565068' : '#b2aca2', nov ? [
      { type: 'rect', x: o.carX - 3000, y: -1200, w: 6000, h: 2600, blur: 10, color: [150, 130, 140], a: 0.45 },
      { x: o.carX - 1800, y: 200, r: 2400, color: [255, 160, 110], a: 0.45 },
    ] : [
      { type: 'rect', x: o.carX - 3000, y: -1200, w: 6000, h: 2600, blur: 10, color: [255, 246, 226], a: 0.7 },
    ]);
    if (o.smoke) smoke(o.carX + 700, ROAD_Y - 120, o.smoke);
    lamps.forEach((l) => l.lightsAt());
    if (o.after) o.after();
    bloomFlush(nov ? 0.8 : 0.3);
  });
}

function cucumberBag(x, y, seed) {
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.55, 0.55);
  ctx.fillStyle = '#2f6a2e';
  for (let i = 0; i < 3; i++) ctx.fillRect(-18 + i * 12, -60, 9, 58);
  ctx.restore();
  bag('pepper', x, y + 2, { s: 0.55, seed: 40 + seed, label: false });
}

// Smoke from a bonfire somewhere below, drifting (November).
function smoke(x, y, a) {
  const ctx = R.ctx;
  const f = R.frame;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 7; i++) {
    const t = ((f * 0.02 + i / 7) % 1);
    const px = x + t * 300 + Math.sin(t * 6 + i) * 30, py = y - t * 420;
    const g = ctx.createRadialGradient(px, py, 0, px, py, 60 + t * 120);
    g.addColorStop(0, `rgba(200,195,205,${0.22 * a * (1 - t)})`);
    g.addColorStop(1, 'rgba(200,195,205,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - 200, py - 200, 400, 400);
  }
  ctx.restore();
}
