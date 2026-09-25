// sets/office.js — the law office, side on. A west window with venetian blinds on the left;
// shelves of case binders; the desk; the door to the clerk's room on the right.
// The walls are cut from paper printed with the original story.
import { R, withCam, withPlane, piece, stillPiece, lights, bloom, bloomFlush, glow, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, disc } from '../cut.js';
import { rng, hash, hs, mixHex, lerp, clamp } from '../util.js';
import { F } from '../fonts.js';

export const FLOOR = 820;
export const WIN = { x0: 70, x1: 470, y0: 150, y1: 640 };
export const DESK = { x0: 690, x1: 1110, top: 585 };
export const DOOR = { x0: 1290, x1: 1480, y0: 250 };
export const CHAIR = { x: 600, seat: 668 };
export const SHOT = {
  wide: { x: 800, y: 470, z: 0.92 },
  desk: { x: 820, y: 500, z: 1.35 },
  kido: { x: 700, y: 470, z: 1.9 },
  door: { x: 1150, y: 480, z: 1.3 },
};

let S = null;
const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.3, wander: 0.7, step: 14, corner: 0.4, ...o });
const box = (x0, y0, x1, y1, seed, o) => cs(rectPts(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2), seed, o);

function build() {
  const r = rng(77);
  const still = [];
  const add = (key, sh, o) => still.push({ key: 'of-' + key, sh, o }); // cache names are per set
  // window frame and sill
  const fr = { color: '#d6d2c8', tex: 'plain', lift: 6, edge: 0.35 };
  add('win-t', box(WIN.x0 - 14, WIN.y0 - 14, WIN.x1 + 14, WIN.y0 + 4, 1), fr);
  add('win-b', box(WIN.x0 - 24, WIN.y1 - 4, WIN.x1 + 24, WIN.y1 + 16, 2), { ...fr, lift: 8 });
  add('win-l', box(WIN.x0 - 14, WIN.y0, WIN.x0 + 4, WIN.y1, 3), fr);
  add('win-r', box(WIN.x1 - 4, WIN.y0, WIN.x1 + 14, WIN.y1, 4), fr);
  add('win-m', box((WIN.x0 + WIN.x1) / 2 - 6, WIN.y0, (WIN.x0 + WIN.x1) / 2 + 6, WIN.y1, 5), { ...fr, lift: 4 });
  add('blind-head', box(WIN.x0 - 8, WIN.y0 - 6, WIN.x1 + 8, WIN.y0 + 16, 6), { color: '#e8e6df', tex: 'plain', lift: 12, edge: 0.4 });
  // shelves of case binders
  add('shelf-side-l', box(540, 110, 556, FLOOR, 10), { color: '#8a7058', tex: 'wood', lift: 6, edge: 0.35 });
  add('shelf-side-r', box(1204, 110, 1220, FLOOR, 11), { color: '#8a7058', tex: 'wood', lift: 6, edge: 0.35 });
  const cols = ['#2f4f7a', '#6a3a3a', '#3f5f4a', '#b89a58', '#4a4a58', '#7a5a3a', '#2f5f6a', '#8a4a4a'];
  for (let k = 0; k < 4; k++) {
    const y = 110 + k * 118;
    add('shelf' + k, box(548, y + 106, 1212, y + 118, 12 + k), { color: '#9a7e62', tex: 'wood', lift: 7, edge: 0.4 });
    let x = 560;
    let i = 0;
    while (x < 1196) {
      const w = 26 + Math.floor(r() * 14), h = 82 + r() * 16;
      if (x + w > 1198) break;
      const col = cols[Math.floor(r() * cols.length)];
      const lean = r() < 0.06 ? 0.18 : 0;
      add(`binder${k}-${i}`, box(-w / 2, -h, w / 2, 0, 100 + k * 40 + i, { jag: 0.15, wander: 0.3 }), {
        x: x + w / 2, y: y + 106, r: lean, color: col, tex: 'plain', lift: 4, edge: 0.3,
        print: (c) => {
          c.fillStyle = 'rgba(245,242,232,0.9)';
          c.fillRect(-w / 2 + 5, -h + 14, w - 10, 44);
          c.fillStyle = 'rgba(40,40,48,0.6)';
          for (let j = 0; j < 4; j++) c.fillRect(-2, -h + 20 + j * 9, 4, 5);
          c.beginPath();
          c.arc(0, -16, 5, 0, Math.PI * 2);
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.fill();
        },
      });
      x += w + 2 + (lean ? 8 : 0);
      i++;
    }
  }
  // the desk (side on), its drawers, the telephone at the far end
  const wood = { color: '#7a5a42', tex: 'wood', ts: 0.7, edge: 0.35 };
  add('desk-top', box(DESK.x0, DESK.top, DESK.x1, DESK.top + 22, 20), { ...wood, lift: 10 });
  add('desk-ped', box(DESK.x1 - 170, DESK.top + 22, DESK.x1 - 10, FLOOR, 21), { ...wood, color: '#6d503a', lift: 8, print: (c) => {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 3; i++) { c.fillRect(DESK.x1 - 160, DESK.top + 90 + i * 68, 140, 2); c.fillRect(DESK.x1 - 110, DESK.top + 56 + i * 68, 40, 6); }
  } });
  add('desk-leg', box(DESK.x0 + 10, DESK.top + 22, DESK.x0 + 34, FLOOR, 22), { ...wood, color: '#6d503a', lift: 8 });
  add('phone-base', cs(smooth([[DESK.x1 - 120, DESK.top], [DESK.x1 - 116, DESK.top - 26], [DESK.x1 - 40, DESK.top - 32], [DESK.x1 - 30, DESK.top]], true, 3), 23), { color: '#e2e0d8', tex: 'plain', lift: 12, edge: 0.4 });
  // the door to the clerk's room, with frosted glass
  add('door-frame', box(DOOR.x0 - 16, DOOR.y0 - 16, DOOR.x1 + 16, FLOOR, 30), { color: '#bdb6a6', tex: 'plain', lift: 5, edge: 0.3 });
  add('door-hole', box(DOOR.x0, DOOR.y0, DOOR.x1, FLOOR, 31, { jag: 0.2 }), { color: '#3a3632', tex: 'plain', lift: 1, edge: 0 });
  add('clock', disc(40, 32), { x: 1385, y: 170, color: '#efece4', tex: 'plain', lift: 10, edge: 0.4, print: (c) => {
    c.fillStyle = 'rgba(30,30,34,0.8)';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillRect(1385 + Math.cos(a) * 32 - 1.5, 170 + Math.sin(a) * 32 - 1.5, 3, 3); }
  } });
  // a visitor's chair facing the desk
  add('vchair-back', box(1180, 470, 1196, 640, 40), { color: '#3f3f48', tex: 'cloth', lift: 7, edge: 0.3 });
  add('vchair-seat', box(1100, 624, 1196, 642, 41), { color: '#3f3f48', tex: 'cloth', lift: 7, edge: 0.3 });
  add('vchair-leg1', box(1110, 642, 1118, FLOOR, 42), { color: '#2a2a30', tex: 'plain', lift: 6 });
  add('vchair-leg2', box(1180, 642, 1188, FLOOR, 43), { color: '#2a2a30', tex: 'plain', lift: 6 });
  S = {
    still,
    doorLeaf: box(0, 0, DOOR.x1 - DOOR.x0, FLOOR - DOOR.y0, 50, { jag: 0.2 }),
    blindSlat: box(WIN.x0, -5, WIN.x1, 5, 51, { jag: 0.05, wander: 0.1 }),
    chairBack: cs(smooth([[-20, -260], [18, -250], [22, -40], [-18, -30]], true, 3), 52),
    chairSeat: box(-60, -12, 70, 12, 53),
    chairPost: box(-6, 0, 6, 160, 54),
    chairBase: cs([[-80, 190], [80, 190], [70, 176], [-70, 176]], 55),
    handset: cs(smooth([[-40, -8], [40, -8], [44, 8], [-44, 8]], true, 2), 56),
  };
}

// o: cam, time ('june'|'july'|'aug'|'nov'), door (0 shut .. 1 open), chair (fn → draws Kido's chair? default true),
//    fg() puppets, front(), phone ('cradle'|'held'), sun (0..1)
export function office(o) {
  if (!S) build();
  const { cam, sun = 1 } = o;
  const nov = o.time === 'nov';
  R.anchor = { x: 800, y: 470 };
  R.light = { x: 0.55, y: 0.5 };
  withCam(cam.x, cam.y, cam.z, () => {
    const ctx = R.ctx;
    // the outside, through the window (a street of offices in the afternoon)
    withPlane(0.4, () => {
      const g = ctx.createLinearGradient(0, WIN.y0, 0, WIN.y1);
      g.addColorStop(0, nov ? '#d9b89a' : '#f2e3c4');
      g.addColorStop(1, nov ? '#b89a88' : '#e6d6b8');
      ctx.fillStyle = g;
      ctx.fillRect(-400, 0, 1200, 900);
      ctx.fillStyle = nov ? '#8a7a78' : '#a8a096';
      for (let i = 0; i < 5; i++) ctx.fillRect(-300 + i * 180, 300 + hash('bd', i) * 160, 150, 600);
    });
    wall();
    for (const p of S.still) stillPiece(p.key, p.sh, p.o);
    // the blinds, slats tilted; the light pours between them
    for (let i = 0; i < 22; i++) {
      const y = WIN.y0 + 22 + i * 21;
      piece(S.blindSlat, { y, sy: 0.5, color: '#efede6', tex: 'plain', lift: 9, edge: 0.3, shadowK: 0.3 });
    }
    // the door leaf, swinging open towards the clerk's room
    const door = o.door || 0;
    if (door < 0.98) {
      piece(S.doorLeaf, { x: DOOR.x0, y: DOOR.y0, sx: Math.max(0.03, 1 - door * 0.92), color: '#a8998a', tex: 'wood', ts: 0.7, lift: 6, edge: 0.3, print: (c) => {
        c.fillStyle = 'rgba(235,235,228,0.85)';
        c.fillRect(40, 60, 110, 220);
        c.fillStyle = 'rgba(0,0,0,0.3)';
        c.fillRect(150, 290, 18, 8);
      } });
    }
    // Kido's chair (behind him; he sits on it in fg)
    if (o.chair !== false) {
      const cx = o.chairX ?? CHAIR.x, cy = CHAIR.seat;
      const turn = o.chairTurn || 0;
      piece(S.chairPost, { x: cx, y: cy + 12, color: '#2a2a30', tex: 'plain', lift: 5 });
      piece(S.chairBase, { x: cx, y: cy + 12, color: '#2a2a30', tex: 'plain', lift: 5 });
      piece(S.chairBack, { x: cx - 40 + turn * 70, y: cy, sx: 1 - Math.abs(turn) * 0.7, color: '#34343c', tex: 'cloth', lift: 6, edge: 0.3 });
      piece(S.chairSeat, { x: cx, y: cy, color: '#34343c', tex: 'cloth', lift: 7, edge: 0.3 });
    }
    if (o.deskThings) o.deskThings();
    if (o.phone !== 'held') piece(S.handset, { x: DESK.x1 - 76, y: DESK.top - 34, color: '#e8e6de', tex: 'plain', lift: 13, edge: 0.4 });
    if (o.fg) o.fg();
    // light: the room's own light, and the west sun through the slats in long bands
    const Ls = [
      { type: 'rect', x: -800, y: -400, w: 3200, h: 1700, blur: 20, color: nov ? [110, 108, 122] : [128, 124, 118], a: 0.28 },
      { type: 'rect', x: WIN.x0, y: WIN.y0, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0, blur: 60, color: [255, 236, 200], a: 0.8 * sun },
    ];
    const k = sun * (nov ? 0.6 : 1);
    for (let i = 0; i < 11; i++) {
      const y = WIN.y0 + 40 + i * 42;
      const drop = 0.62; // the sun is low: bands fall steeply down and right
      const len = 1300;
      Ls.push({
        type: 'poly', blur: 26, color: nov ? [255, 180, 130] : [255, 214, 160], a: 0.6 * k,
        pts: [[WIN.x1, y], [WIN.x1 + len, y + len * drop], [WIN.x1 + len, y + len * drop + 26], [WIN.x1, y + 16]],
      });
    }
    lights(nov ? '#5e5a66' : '#7a746c', Ls);
    motes(k);
    glow((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, 360, nov ? '255,190,140' : '255,230,190', 0.25 * sun);
    if (o.front) o.front();
    bloomFlush(0.5);
  });
}

function wall() {
  const ctx = R.ctx;
  const fillPat = (name, x, y, w, h, ts, a, tx = 0, ty = 0) => {
    const p = pat(name);
    setPat(p, tx, ty, ts, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = a;
    ctx.fillStyle = p;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };
  ctx.fillStyle = '#d8d2c4';
  // leave the window open
  ctx.beginPath();
  ctx.rect(-900, 20, 3400, FLOOR - 20);
  ctx.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  ctx.fill('evenodd');
  ctx.save();
  ctx.beginPath();
  ctx.rect(-900, 20, 3400, FLOOR - 20);
  ctx.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  ctx.clip('evenodd');
  fillPat('tate', -900, 20, 3400, FLOOR - 20, 0.8, 0.16, 30, 10);
  ctx.restore();
  ctx.fillStyle = '#b9b3a6';
  ctx.fillRect(-900, -600, 3400, 620);
  ctx.fillStyle = 'rgba(40,30,20,0.25)';
  ctx.fillRect(-900, 12, 3400, 10);
  // floor: grey carpet tiles
  ctx.fillStyle = '#7d7a76';
  ctx.fillRect(-900, FLOOR, 3400, 700);
  fillPat('cloth', -900, FLOOR, 3400, 700, 1.4, 1);
  ctx.strokeStyle = 'rgba(30,30,30,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let y = FLOOR + 40; y < FLOOR + 700; y += 60) { ctx.moveTo(-900, y); ctx.lineTo(2500, y); }
  ctx.stroke();
  ctx.fillStyle = '#9a9488';
  ctx.fillRect(-900, FLOOR - 14, 3400, 14);
}

function motes(k) {
  if (k <= 0) return;
  const ctx = R.ctx;
  const f = Math.floor(R.frame / 2);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 50; i++) {
    const t = (hash('om', i) + f * 0.004 * (1 + hash('ov', i))) % 1;
    const x = WIN.x1 + t * 700 + hs('ox', i) * 40;
    const y = WIN.y0 + 80 + hash('oy', i) * 380 + t * 300;
    ctx.fillStyle = `rgba(255,236,200,${0.35 * k * hash('oa', i)})`;
    ctx.fillRect(x, y, 2.4, 2.4);
  }
  ctx.restore();
}
