// Scene 1 — "An ordinary case." The box of the company's effects; Anzai and a notice
// that may or may not be thrown away; the inventory form, every box empty.
import { R } from '../render.js';
import { desk, topHand, pen, sheet } from '../sets/desk.js';
import { office, SHOT as OS, DESK, CHAIR, FLOOR, DOOR } from '../sets/office.js';
import { cardboardBox, sealStamp, keyShape, parkingCard, passbook, inventoryForm, subsidyNotice } from '../docs.js';
import { puppet, restPose, sitPose, walkAlong, withArm, mouthAt, blinkAt } from '../puppet.js';
import { KIDO_TIE, ANZAI } from '../cast.js';
import { CAPS, CHAPTERS } from '../text.js';
import { ease, seg, lerp, hs, hash, clamp } from '../util.js';
import { camAt, keyAt, talking, chapterLabel, fadeBlack } from '../common.js';

const caps = [
  { a: 14, b: 94, ...CAPS.s1[0] },
  { a: 146, b: 182, ...CAPS.s1[1] },
  { a: 186, b: 214, ...CAPS.s1[2] },
  { a: 218, b: 244, ...CAPS.s1[3] },
  { a: 248, b: 301, ...CAPS.s1[4] },
  { a: 338, b: 380, ...CAPS.s1[5] },
  { a: 384, b: 426, ...CAPS.s1[6] },
];
const SH = { box: 0, office: 118, form: 330 };

// the effects, taken out one at a time and laid in a row
const ITEMS = [
  { kind: 'seal', from: [470, 250], to: [560, 570], r: 0.1 },
  { kind: 'seal', from: [540, 270], to: [630, 578], r: -0.05, color: '#e8dcc0' },
  { kind: 'key', from: [600, 230], to: [740, 560], r: 0.3 },
  { kind: 'key', from: [650, 280], to: [812, 570], r: -0.2, k: 1 },
  { kind: 'key', from: [520, 310], to: [880, 558], r: 0.5, k: 2 },
  { kind: 'card', from: [600, 330], to: [1020, 566], r: -0.06 },
];
const T0 = 18, STEP = 12;
function itemAt(i, f) {
  const it = ITEMS[i];
  const t0 = T0 + i * STEP;
  const p = ease.inOut(clamp((f - t0 - 3) / 7));
  if (f < t0 + 3) return { x: it.from[0], y: it.from[1], r: it.r * 0.3, inBox: true, lift: 0 };
  return { x: lerp(it.from[0], it.to[0], p), y: lerp(it.from[1], it.to[1], p) - Math.sin(p * Math.PI) * 30, r: lerp(it.r * 0.3, it.r, p), inBox: false, moving: p < 1, lift: p < 1 ? 40 : 6 };
}
function drawItem(i, st) {
  const it = ITEMS[i];
  if (it.kind === 'seal') sealStamp(st.x, st.y, st.r + Math.PI / 2, { color: it.color || '#1f1c1c', lift: st.lift || 6 });
  else if (it.kind === 'key') keyShape(st.x, st.y, st.r, { kind: it.k || 0, lift: st.lift || 5 });
  else parkingCard(st.x, st.y, st.r, { lift: st.lift || 4 });
}

function boxShot(f) {
  const boxPush = ease.inOut(seg(f, 94, 106));
  const bx = lerp(560, 330, boxPush), by = lerp(280, 150, boxPush);
  const pbIn = ease.inOut(seg(f, 104, 116));
  desk({
    cam: { x: 800, y: 470, z: 1 },
    time: 'june',
    items: () => {
      passbook(lerp(1320, 1080, pbIn), lerp(230, 330, pbIn), { r: 0.12, seed: 2, color: '#6a3a3a' });
      passbook(lerp(1300, 1060, pbIn), lerp(220, 320, pbIn), { r: 0.04, seed: 1 });
      cardboardBox(bx, by, {
        r: -0.04,
        contents: (ctx) => {
          ctx.save();
          ctx.translate(-bx, -by);
          ITEMS.forEach((_, i) => { const st = itemAt(i, f); if (st.inBox) drawItem(i, { ...st, x: st.x - 560 + bx, y: st.y - 280 + by, lift: 5 }); });
          ctx.restore();
        },
      });
      ITEMS.forEach((_, i) => { const st = itemAt(i, f); if (!st.inBox && !st.moving) drawItem(i, st); });
    },
    hands: () => {
      // the right hand fetches; the left waits at the edge of the mat
      let hx = 1000, hy = 800, pose = 'flat', r = -0.3;
      for (let i = 0; i < ITEMS.length; i++) {
        const t0 = T0 + i * STEP;
        if (f >= t0 - 3 && f < t0 + 11) {
          const st = itemAt(i, f);
          const reach = ease.inOut(clamp((f - t0 + 3) / 6));
          hx = f < t0 + 3 ? lerp(1000, st.x + 30, reach) : st.x + 30;
          hy = f < t0 + 3 ? lerp(800, st.y + 105, reach) : st.y + 105;
          pose = 'pinch';
          r = -0.25;
          if (st.moving) drawItem(i, st);
        }
      }
      if (f >= 92 && f < 108) { hx = lerp(820, 560, ease.inOut(seg(f, 94, 106))); hy = lerp(560, 400, ease.inOut(seg(f, 94, 106))); pose = 'flat'; r = -0.6; }
      if (f >= 106) { hx = lerp(560, 1120, ease.inOut(seg(f, 106, 116))); hy = lerp(400, 480, ease.inOut(seg(f, 106, 116))); pose = 'flat'; r = -0.1; }
      topHand({ x: hx, y: hy, r, side: 'r', pose, sleeve: '#f1f2ef' });
      topHand({ x: 330, y: 800, r: 0.35, side: 'l', pose: 'flat', sleeve: '#f1f2ef' });
    },
  });
}

function officeShot(f) {
  const t = f - SH.office;
  const door = keyAt(t, [[0, 0], [8, 1], [180, 1], [196, 0]]);
  const aw = t < 30 ? walkAlong(ANZAI, t, 8, 26, DOOR.x0 + 60, 1200) : t < 180 ? { x: 1200, pose: restPose(), dir: -1 } : walkAlong(ANZAI, t, 184, 200, 1200, DOOR.x0 + 80);
  const holding = t >= 8 && t < 122;
  let apose = { ...aw.pose };
  if (holding) apose = withArm(apose, 'n', t >= 22 && t < 110 ? [0.9, 0.35, 0] : [0.4, 0.7, 0], 'fist');
  if (t >= 172 && t < 180) apose = { ...apose, lean: -0.02, arms: { n: [0.1, 0.5, 0], f: [-0.1, 0.5, 0] } }; // a shrug
  const kidoTalk = talking(caps, f, 'kido');
  const look = t >= 20 && t < 172 ? 0.06 : 0.28;
  const kpose = withArm({ ...sitPose({ knee: 1.45 }), lean: 0.12, head: look }, 'n', [0.78, 0.85, 0.05], 'hand');
  kpose.arms.f = [0.72, 0.9, 0.05];
  office({
    cam: camAt(t, [[0, OS.wide], [60, { ...OS.wide, x: 860, z: 0.98 }], [210, { ...OS.wide, x: 880, z: 1.0 }]]),
    time: 'june',
    door,
    deskThings: () => {
      // papers on the desk
      sheet(160, 6, 860, DESK.top - 2, { seed: 5, color: '#f4f2ea', lift: 11 });
      sheet(120, 6, 980, DESK.top - 5, { seed: 6, color: '#ebe6d8', lift: 11 });
    },
    fg: () => {
      puppet(KIDO_TIE, { x: CHAIR.x + 10, y: CHAIR.seat - 10, pose: kpose, face: { mouth: mouthAt(kidoTalk, f, 1), blink: blinkAt(f, 1), eye: t < 20 || t >= 172 ? 'down' : 'open' } });
      if (t >= 6 && t < 204) {
        const hold = holding ? { n: (ctx, { L }) => { ctx.save(); ctx.translate(0, L.hand * 0.8); ctx.rotate(0.3); sheet(76, 104, 20, 30, { seed: 7, color: '#f8f7f1', lift: 2, print: (c) => { c.fillStyle = 'rgba(40,40,48,0.4)'; for (let i = 0; i < 6; i++) c.fillRect(-26, -30 + i * 10, 52 - (i % 2) * 14, 3); } }); ctx.restore(); } } : null;
        puppet(ANZAI, { x: aw.x, ground: FLOOR + 6, dir: aw.dir, pose: apose, hold, face: { mouth: mouthAt(talking(caps, f, 'anzai'), f, 2), blink: blinkAt(f, 2) } });
      }
    },
  });
}

function formShot(f) {
  const t = f - SH.form;
  const slide = ease.out(seg(t, 0, 8));
  desk({
    cam: camAt(t, [[0, { x: 800, y: 470, z: 1.02 }], [100, { x: 800, y: 440, z: 1.12 }]], ease.sine),
    time: 'june',
    items: () => {
      passbook(1180, 250, { r: 0.1, seed: 1 });
      inventoryForm(lerp(1300, 760, slide), lerp(560, 470, slide), { r: lerp(0.2, -0.02, slide), fill: 0 });
    },
    hands: () => {
      const hover = Math.sin(t * 0.18) * 6;
      topHand({ x: 1130 + hover, y: 760 - hover * 0.5, r: -0.35, side: 'r', pose: 'pen', sleeve: '#f1f2ef', hold: (ctx) => { ctx.save(); ctx.scale(0.53, 0.53); pen(-60, -80, -0.5, { lift: 20 }); ctx.restore(); } });
      topHand({ x: 360, y: 800, r: 0.3, side: 'l', pose: 'flat', sleeve: '#f1f2ef' });
    },
  });
}

export default {
  id: 's1',
  len: 428,
  mood: 'office',
  beds: (f) => ({ room: 0.7, copier: f >= 316 && f < 420 ? 0.8 : 0 }),
  caps,
  warm: [4, 40, 80, 110, 130, 200, 260, 320, 340, 400],
  draw(f) {
    if (f < SH.office) boxShot(f);
    else if (f < SH.form) officeShot(f);
    else formShot(f);
    chapterLabel(CHAPTERS.c1, f - 2, 80);
    fadeBlack(1 - ease.out(seg(f, 0, 8)));
  },
  sfx(f, A) {
    for (let i = 0; i < ITEMS.length; i++) if (f === T0 + i * STEP + 10) A.tap(0.5);
    if (f === 96) A.rustle(0.4, 0.6);
    if (f === 108) A.rustle(0.3, 0.5);
    const t = f - SH.office;
    if (t === 4) A.click();
    if (t > 8 && t < 26 && t % 5 === 0) A.step(0.6);
    if (t === 14) A.rustle(0.3, 0.4);
    if (t > 184 && t < 200 && t % 5 === 0) A.step(0.5);
    if (t === 198) { A.click(); }
    if (f === SH.form) { A.rustle(0.4, 0.6); }
  },
};
