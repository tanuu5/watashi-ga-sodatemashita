// sets/farm.js — F Farm. Six greenhouses of white film on a gravel yard; inside one of them,
// the tomato rows run away down the aisle; the robot cart waits between them.
// The farm's structures are cut from paper printed with its own operation log.
import { R, withCam, withPlane, piece, stillPiece, lights, bloom, bloomFlush, glow, cello, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from '../cut.js';
import { rng, hash, hs, mixHex, lerp, clamp } from '../util.js';
import { F } from '../fonts.js';
import { CAL } from '../text.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.3, wander: 0.7, step: 14, corner: 0.4, ...o });
const box = (x0, y0, x1, y1, seed, o) => cs(rectPts(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2), seed, o);
const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };

// ---------------------------------------------------------------------------
// Outside: the yard and the six houses, gable ends towards us, stepping back up the slope.
export const YARD = 820;
export const HOUSES = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 120 + i * 470 - i * i * 12, y: YARD - 40 - i * 46, s: 1.05 - i * 0.1, par: 0.98 - i * 0.07 }));

function archPts(w, h, n = 18) {
  const pts = [[-w / 2, 0]];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI;
    pts.push([Math.cos(a) * w / 2, -h * 0.35 + Math.sin(a) * h * 0.65]);
  }
  pts.push([w / 2, 0]);
  return pts;
}

let SO = null;
function buildOut() {
  SO = {
    sky: box(-2000, -1400, 5000, YARD, 1),
    hills: cs([[-2000, 1400], [-2000, 300], [-900, 220], [0, 280], [900, 190], [1900, 250], [3000, 200], [5000, 280], [5000, 1400]], 2, { jag: 0.8, wander: 1.4, step: 30 }),
    cedarBand: cs([[-2000, 1400], ...Array.from({ length: 70 }, (_, i) => [-2000 + i * 100, 470 - (i % 2 ? 60 + hash('cb', i) * 60 : 0)]), [5000, 1400]], 3, { jag: 0.6, wander: 1, step: 20 }),
    yard: box(-2000, YARD - 30, 5000, 1500, 4, { jag: 0.2 }),
    house: cs(archPts(380, 360), 10, { jag: 0.2, wander: 0.4 }),
    door: cs(archPts(90, 250, 8), 11, { jag: 0.2 }),
    vent: box(-60, -18, 60, 18, 12),
    ribs: memo('ribs', () => null),
    motor: box(-16, -12, 16, 12, 13),
    shed: box(-2000, YARD - 260, -1500, YARD, 14),
    shedRoof: cs([[-2040, YARD - 250], [-1460, YARD - 290], [-1460, YARD - 270], [-2040, YARD - 230]], 15),
  };
}

// o: cam, vents (0..1 per house: how far the ridge vents are open), fg(), after()
export function farmOutside(o) {
  if (!SO) buildOut();
  const f = R.frame;
  R.anchor = { x: 800, y: 470 };
  R.light = { x: 0.4, y: 0.8 };
  withCam(o.cam.x, o.cam.y, o.cam.z, () => {
    const ctx = R.ctx;
    withPlane(0.06, () => {
      const g = ctx.createLinearGradient(0, -600, 0, YARD);
      g.addColorStop(0, '#8cbfe2');
      g.addColorStop(1, '#eef4f2');
      ctx.fillStyle = g;
      ctx.fillRect(-2000, -1400, 7000, 2400);
    });
    withPlane(0.2, () => stillPiece('fo-hills', SO.hills, { color: '#86a4b0', tex: 'washi', lift: 2, edge: 0.1, maxQ: 0.6 }));
    withPlane(0.4, () => stillPiece('fo-cedars', SO.cedarBand, { color: '#2f5230', tex: 'washi', lift: 4, edge: 0.15, maxQ: 0.6 }));
    // the houses, the far ones first
    for (let i = HOUSES.length - 1; i >= 0; i--) {
      const H = HOUSES[i];
      withPlane(H.par, () => house(i, H, o.vents ? o.vents[i] : 0, f));
    }
    stillPiece('fo-yard', SO.yard, { color: '#a8a296', tex: 'gravel', ts: 0.5, lift: 1, edge: 0.1, maxQ: 0.6 });
    if (o.fg) o.fg();
    lights('#aaa49c', [
      { type: 'rect', x: -2000, y: -1400, w: 7000, h: 3000, blur: 10, color: [255, 248, 230], a: 0.72 },
    ]);
    // the film glows where the sun comes through it
    for (let i = HOUSES.length - 1; i >= 0; i--) {
      const H = HOUSES[i];
      withPlane(H.par, () => glow(H.x, H.y - 200 * H.s, 260 * H.s, '255,252,240', 0.22));
    }
    if (o.after) o.after();
    bloomFlush(0.6);
  });
}

function house(i, H, vent, f) {
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(H.x, H.y);
  ctx.scale(H.s * 1.4, H.s * 1.4);
  // the gable end: film over steel hoops, with the shadows of plants inside
  cello(SO.house, { color: '#f3f5f2', mode: 'box', crinkle: 0.4, edge: 0.7 });
  piece(SO.house, { color: '#eef0ec', tex: 'log', ts: 0.3, texA: 0.5, lift: 4, edge: 0.4, alpha: 0.92, print: (c) => {
    // plants behind the film
    c.fillStyle = i === 5 ? 'rgba(90,80,60,0.08)' : 'rgba(60,110,60,0.28)';
    for (let k = 0; k < 7; k++) {
      const x = -150 + k * 50;
      c.beginPath();
      c.moveTo(x - 16, 0); c.lineTo(x - 10, -180 - hash('pl', i, k) * 40); c.lineTo(x + 10, -190 - hash('pl2', i, k) * 30); c.lineTo(x + 16, 0);
      c.fill();
    }
    // the hoops
    c.strokeStyle = 'rgba(120,125,130,0.55)';
    c.lineWidth = 3;
    c.beginPath();
    for (const w of [380, 260, 120]) { c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -126); }
    c.stroke();
  } });
  // the door (a flap of film), the ridge vent and its little motor
  piece(SO.door, { x: 0, y: 0, color: '#e6e8e4', tex: 'plain', lift: 5, edge: 0.4, alpha: 0.9 });
  ctx.save();
  ctx.translate(0, -300);
  piece(SO.vent, { r: -vent * 0.5, color: '#dcdfdb', tex: 'plain', lift: 6 + vent * 8, edge: 0.5 });
  piece(SO.motor, { x: 70, y: 6, color: '#5a6068', tex: 'plain', lift: 7, edge: 0.4 });
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Inside a house: the aisle in one-point perspective. Paper flats at eight depths.
export const VP = { x: 800, y: 380 }; // where the aisle vanishes
const DEPTHS = [0.14, 0.2, 0.28, 0.38, 0.5, 0.64, 0.8, 1.0];
let SI = null;
function buildIn() {
  const r = rng(99);
  // a tomato plant: a stem up a string, leaves, trusses (fruit drawn live so it can ripen)
  const plant = (seed) => {
    const rr = rng(seed);
    const leaves = [];
    for (let k = 0; k < 9; k++) {
      const y = -60 - k * 62, side = k % 2 ? 1 : -1, l = 70 + rr() * 40;
      leaves.push(smooth([[0, y], [side * l * 0.4, y - 26], [side * l, y - 10 + rr() * 16], [side * l * 0.7, y + 10], [side * l * 0.3, y + 16]], true, 3));
    }
    leaves.push([[-5, 0], [-4, -600], [4, -600], [5, 0]]);
    return cs(leaves, seed, { jag: 0.5, wander: 0.8, step: 10 });
  };
  SI = {
    plants: [0, 1, 2, 3].map((k) => plant(300 + k)),
    ridge: box(-12, -8, 12, 8, 20),
    string: box(-1, -700, 1, 0, 21, { jag: 0, wander: 0 }),
    cart: {
      body: cs(smooth([[-170, 0], [-176, -120], [-160, -150], [160, -150], [176, -120], [170, 0]], true, 3), 30),
      armA: box(-8, -120, 8, 0, 31),
      armB: box(-6, -90, 6, 0, 32),
      pad: cs(smooth([[-24, 0], [-20, -14], [20, -14], [24, 0], [20, 12], [-20, 12]], true, 3), 33),
      wheel: disc(34, 34),
      cable: null,
    },
  };
}

// o: cam, plants (true | false: the empty sixth house), ripe (0..1), cart (bool), drip (0..1),
//    vent (0..1), fg(), fogged, noShadow
export function greenhouse(o) {
  if (!SI) buildIn();
  const f = R.frame;
  const empty = o.plants === false;
  R.anchor = { x: 800, y: 450 };
  R.light = { x: 0.1, y: 0.4 };
  const shadeWas = R.shade;
  if (o.noShadow) R.shade = 0;
  withCam(o.cam.x, o.cam.y, o.cam.z, () => {
    const ctx = R.ctx;
    // the film overhead and at the far end, all one soft white
    ctx.fillStyle = '#f4f5f0';
    ctx.fillRect(-1600, -1000, 4800, 3000);
    const p = pat('log');
    setPat(p, 0, 0, 0.5, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = p;
    ctx.fillRect(-1600, -1000, 4800, 1420);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // the soil floor, converging to the vanishing point
    ctx.fillStyle = empty ? '#8a7560' : '#7a6450';
    ctx.beginPath();
    ctx.moveTo(-1600, 1400); ctx.lineTo(VP.x - 40, VP.y + 40); ctx.lineTo(VP.x + 40, VP.y + 40); ctx.lineTo(3200, 1400);
    ctx.closePath();
    ctx.fill();
    const sp = pat('soil');
    setPat(sp, 0, 0, 0.7, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = sp;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // furrows or beds
    ctx.strokeStyle = empty ? 'rgba(60,45,30,0.18)' : 'rgba(50,36,24,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const k of [-3, -2, -1, 1, 2, 3]) { ctx.moveTo(VP.x + k * 8, VP.y + 40); ctx.lineTo(VP.x + k * 700, 1400); }
    ctx.stroke();
    // the hoops, from far to near
    for (let d = 0; d < DEPTHS.length; d++) {
      const s = DEPTHS[d];
      ctx.strokeStyle = `rgba(150,156,160,${0.35 + s * 0.4})`;
      ctx.lineWidth = 2 + s * 8;
      ctx.beginPath();
      ctx.ellipse(VP.x, VP.y + 440 * s, 1000 * s, 1100 * s, 0, Math.PI, 0);
      ctx.stroke();
    }
    // the drip tubes
    ctx.strokeStyle = 'rgba(25,25,28,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const k of [-1, 1]) { ctx.moveTo(VP.x + k * 30, VP.y + 42); ctx.lineTo(VP.x + k * 520, 1400); }
    ctx.stroke();
    // plants in rows on both sides, far ones first
    if (!empty) {
      for (let d = 0; d < DEPTHS.length; d++) {
        const s = DEPTHS[d];
        for (const side of [-1, 1]) {
          for (let k = 0; k < 2; k++) {
            const x = VP.x + side * (260 + k * 180) * s * 1.6, y = VP.y + 440 * s + 40 * s;
            const sh = SI.plants[(d + k + (side > 0 ? 2 : 0)) % 4];
            stillPiece(`gh-pl${d}-${side}-${k}`, sh, { x, y, s: s * 1.1, sx: side, color: mixHex('#3f7a3a', '#2f5a2c', k * 0.5 + d * 0.02), tex: 'washi', ts: 0.8, lift: 3 + s * 6, edge: 0.25, maxQ: 1.6 });
            trusses(x, y, s * 1.1, side, d * 10 + k + (side > 0 ? 5 : 0), o.ripe ?? 1);
          }
        }
      }
    }
    // the robot cart, parked in the aisle a little way in
    if (o.cart) cart(VP.x + 10, VP.y + 440 * 0.64 + 60, 0.62, o.cartArms || 0);
    if (o.fg) o.fg();
    lights('#d6d6cf', [{ type: 'rect', x: -1600, y: -1000, w: 4800, h: 3000, blur: 10, color: [255, 255, 250], a: 0.4 }]);
    // the drip: a fine mist catching the light near the tubes
    if (o.drip > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 60; i++) {
        const t = hash('dr', i);
        const side = i % 2 ? 1 : -1;
        const x = VP.x + side * (30 + t * 490) + hs('drx', i, Math.floor(f / 2)) * 4;
        const y = VP.y + 42 + t * 958 - hash('dry', i, Math.floor(f / 2)) * 10;
        ctx.fillStyle = `rgba(255,255,255,${0.5 * o.drip})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    }
    // warm humid haze
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(VP.x, VP.y, 20, VP.x, VP.y, 900);
    g.addColorStop(0, 'rgba(255,255,248,0.55)');
    g.addColorStop(1, 'rgba(255,255,248,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-1600, -1000, 4800, 3000);
    ctx.restore();
    if (o.after) o.after();
    bloomFlush(0.5);
  });
  R.shade = shadeWas;
}

// Trusses of small tomatoes on a plant: red at the bottom, whiter as they go up.
function trusses(x, y, s, side, seed, ripe) {
  const ctx = R.ctx;
  for (let k = 0; k < 5; k++) {
    const ty = y - (80 + k * 110) * s, tx = x + side * 30 * s;
    const red = clamp(1 - k / 4.5) * ripe;
    const col = mixHex('#e9ecd8', mixHex('#e8a03a', '#d8352a', red), Math.min(1, red * 1.6));
    ctx.fillStyle = col;
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.arc(tx + side * (j * 9 - 10) * s + hs('tt', seed, k, j) * 3 * s, ty + (j % 2) * 9 * s + j * 6 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// The robot cart: "the size of a washing machine on its side", two arms folded on top, soft pads.
export function cart(x, y, s = 1, arms = 0, o = {}) {
  if (!SI) buildIn();
  const C = SI.cart;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const wx of [-120, 120]) piece(C.wheel, { x: wx, y: -30, color: '#2a2a2e', tex: 'plain', lift: 3, edge: 0.3 });
  piece(C.body, { y: -24, color: '#8d9398', tex: 'plain', lift: 4, edge: 0.45, print: (c) => {
    c.fillStyle = 'rgba(30,30,34,0.5)';
    c.fillRect(-150, -100, 60, 10);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(-170, -150, 340, 8);
    c.fillStyle = '#5ad08a';
    c.beginPath(); c.arc(140, -120, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(40,40,48,0.6)';
    c.font = `400 13px ${F.mono}`;
    c.fillText('AGR-T2', -140, -60);
  } });
  // the arms, folded along the top, pads resting (green sap on them)
  for (const [ax, dir] of [[-60, 1], [70, -1]]) {
    ctx.save();
    ctx.translate(ax, -174);
    ctx.rotate(dir * (1.45 - arms * 0.8));
    piece(C.armA, { color: '#6f757b', tex: 'plain', lift: 6, edge: 0.4 });
    ctx.translate(0, -120);
    ctx.rotate(dir * -2.6 * (1 - arms * 0.3));
    piece(C.armB, { color: '#7a8086', tex: 'plain', lift: 7, edge: 0.4 });
    ctx.translate(0, -90);
    piece(C.pad, { color: '#d9d2c2', tex: 'plain', lift: 8, edge: 0.3, print: (c) => {
      c.strokeStyle = 'rgba(90,150,60,0.75)';
      c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-16, -4); c.lineTo(14, 2); c.moveTo(-10, 5); c.lineTo(10, 8); c.stroke();
    } });
    ctx.restore();
  }
  if (o.cable !== false) {
    ctx.strokeStyle = 'rgba(20,20,22,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(170, -60); ctx.quadraticCurveTo(260, 0, 420, 10);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The house across the yard, through its kitchen window: a cup upside down, the calendar still at March.
let SW = null;
export function farmhouseWindow(o) {
  SW ||= {
    wall: box(-800, -400, 2400, 1300, 50),
    frameT: box(380, 160, 1220, 192, 51),
    frameB: box(370, 728, 1230, 772, 56),
    frameL: box(380, 160, 412, 760, 57),
    frameR: box(1188, 160, 1220, 760, 58),
    frameM: box(792, 190, 808, 730, 59),
    glass: box(410, 190, 1190, 730, 52),
    sink: box(420, 560, 900, 600, 53),
    cup: cs([[-26, 0], [-22, -50], [22, -50], [26, 0]], 54),
    cal: box(-90, -120, 90, 120, 55),
  };
  withCam(o.cam.x, o.cam.y, o.cam.z, () => {
    R.anchor = { x: 800, y: 450 };
    R.light = { x: 0.4, y: 0.7 };
    stillPiece('fw-wall', SW.wall, { color: '#b9ad98', tex: 'log', ts: 0.5, texA: 0.5, lift: 0, edge: 0 });
    stillPiece('fw-glass', SW.glass, { color: '#6e6a62', tex: 'tate', ts: 0.6, texA: 0.25, lift: 1, edge: 0 });
    // inside, dim
    stillPiece('fw-sink', SW.sink, { color: '#8a8e90', tex: 'plain', lift: 2, edge: 0.3 });
    stillPiece('fw-cup', SW.cup, { x: 700, y: 560, color: '#d8d4c8', tex: 'plain', lift: 3, edge: 0.3 });
    stillPiece('fw-cal', SW.cal, { x: 1020, y: 380, color: '#efece2', tex: 'plain', lift: 3, edge: 0.3, print: (c) => {
      c.fillStyle = 'rgba(180,40,40,0.8)';
      c.font = `700 64px ${F.mincho}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(CAL.month, 1020, 320);
      c.fillStyle = 'rgba(40,40,48,0.6)';
      c.font = `400 12px ${F.mono}`;
      for (let r = 0; r < 5; r++) for (let d = 0; d < 7; d++) {
        const n = r * 7 + d - 1;
        if (n < 1 || n > 31) continue;
        c.fillText(String(n), 960 + d * 20, 380 + r * 22);
      }
    } });
    for (const k of ['frameT', 'frameB', 'frameL', 'frameR', 'frameM']) stillPiece('fw-' + k, SW[k], { color: '#6a5a48', tex: 'wood', lift: 6, edge: 0.4 });
    lights('#7a7670', [
      { type: 'rect', x: -800, y: -400, w: 3200, h: 1700, blur: 10, color: [255, 246, 228], a: 0.6 },
      { type: 'shade', rect: [410, 190, 780, 540], color: [170, 168, 175], blur: 20 },
    ]);
    // the sky reflected on the glass
    const ctx = R.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(410, 190, 1190, 730);
    g.addColorStop(0, 'rgba(160,200,230,0.35)');
    g.addColorStop(0.5, 'rgba(160,200,230,0.08)');
    g.addColorStop(1, 'rgba(160,200,230,0.2)');
    ctx.fillStyle = g;
    ctx.fillRect(410, 190, 780, 540);
    ctx.restore();
    if (o.after) o.after();
    bloomFlush(0.3);
  });
}
