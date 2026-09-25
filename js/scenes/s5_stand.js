// Scene 5 — the stand, in July. The price label; the cash box that will not lift; the sign.
// A woman buys peppers from no one. Kido takes four photographs. In the mirror, a kei truck.
import { R, inset, withCam, withLocal, piece, lights } from '../render.js';
import { stand, SHOT, SLOTS, GROUND, ST, SIGNPOS, BOXPOS } from '../sets/stand.js';
import { carInterior } from '../sets/car.js';
import { puppet, armOnly, restPose, walkAlong, withArm, handAt, mixPose, blinkAt } from '../puppet.js';
import { KIDO, BUYER } from '../cast.js';
import { bag } from '../props.js';
import { car, keiLoad } from '../vehicles.js';
import { SW, SH } from '../creature.js';
import { CAPS, SUBS } from '../text.js';
import { ease, seg, lerp, hash, hs, clamp } from '../util.js';
import { camAt, keyAt, hangFromHand, fadeBlack } from '../common.js';

const caps = [
  { a: 66, b: 112, who: 'sub', ja: '', en: SUBS.label },
  { a: 158, b: 234, who: 'sub', ja: '', en: SUBS.sign },
  { a: 184, b: 238, ...CAPS.s5[0] },
  { a: 290, b: 336, ...CAPS.s5[1] },
  { a: 340, b: 392, ...CAPS.s5[2] },
];

const KX = 200; // where Kido stands, at the left of the stand
const PICK = 0; // the tomato bag he picks up
const B = { a: 44, lift: 58, insert: 62, back: 102, c: 112, d: 150, e: 236, f: 362, g: 396 };

const kidoRest = () => ({ ...restPose(), head: 0.12 });

// Kido reaching for the bag, lifting it, putting it back.
function kidoAtShelf(f) {
  const slot = SLOTS[PICK];
  const back = f >= B.back ? 1 : 0;
  const reach = ease.inOut(seg(f, B.a + 2, B.a + 12)) * (1 - ease.inOut(seg(f, B.back + 2, B.back + 10)));
  const lift = ease.inOut(seg(f, B.a + 12, B.lift)) * (1 - back);
  const a = [lerp(0.08, 1.2, reach) + lift * 0.25 * (1 - back), lerp(0.1, 0.45, reach) - lift * 0.1, 0.1];
  const pose = withArm({ ...kidoRest(), lean: 0.08 * reach, head: 0.15 + lift * 0.05 }, 'n', a, reach > 0.6 ? 'fist' : 'hand');
  const o = { x: KX + 40, ground: GROUND + 20, pose, dir: 1 };
  const held = reach > 0.95 && !back && f >= B.a + 12;
  return { o, held, slot };
}

function buyerAt(t) {
  // walks in, reaches into the lower shelf, puts one back, takes two, pays, goes
  const rest = restPose();
  if (t < 44) return { ...walkAlong(BUYER, t, 14, 44, 1780, 1300, { rest }), hold: [] };
  if (t < 88) {
    let a = [0.08, 0.12, 0], hold = [];
    const r1 = ease.inOut(seg(t, 44, 52)), r2 = ease.inOut(seg(t, 62, 68)), r3 = ease.inOut(seg(t, 70, 78));
    if (t < 62) { a = [lerp(0.08, 1.05, r1), lerp(0.12, 0.3, r1), 0]; if (t >= 52) hold = [33]; }
    else if (t < 70) { a = [lerp(1.05, 1.15, r2), 0.3, 0]; hold = t < 66 ? [33] : []; }
    else { a = [lerp(1.15, 1.2, r3), lerp(0.3, 0.2, r3), 0]; hold = t >= 74 ? [31] : []; }
    if (t >= 80) hold = [31, 29];
    const squeeze = t >= 54 && t < 60 ? Math.sin((t - 54) * 1.2) * 0.04 : 0;
    return { x: 1300, dir: -1, pose: withArm({ ...rest, head: 0.2, lean: 0.06 }, 'n', a, hold.length ? 'fist' : 'hand'), hold, squeeze };
  }
  if (t < 104) {
    const w = walkAlong(BUYER, t, 88, 94, 1300, 1116, { rest });
    const bend = ease.inOut(seg(t, 94, 98)) * (1 - ease.inOut(seg(t, 101, 104)));
    const pose = t < 94 ? w.pose : withArm({ ...rest, lean: 0.45 * bend, head: 0.3 * bend }, 'n', [0.3 * bend, 0.2, 0.1], 'fist');
    return { x: w.x, dir: -1, pose, hold: [31, 29], coins: t >= 96 && t < 101 ? t - 96 : -1 };
  }
  return { ...walkAlong(BUYER, t, 104, 126, 1116, 1780, { rest }), hold: [31, 29] };
}

// The shot of the stand from the road, used for A, E and the photographs.
function standShot(f, cam, o = {}) {
  const k = kidoAtShelf(f);
  const t = f - B.e;
  const buyer = f >= B.e && f < B.f ? buyerAt(t) : null;
  const lifted = [];
  if (k.held && f < B.back) lifted.push(PICK);
  if (buyer) lifted.push(...buyer.hold);
  const soldOut = f >= B.e + 104 ? [31, 29] : [];
  const bags = SLOTS.map((_, i) => i).filter((i) => !soldOut.includes(i));
  const lamps = [];
  stand({
    time: 'july', cam, bags, lifted, live: o.live,
    box: { jolt: f >= B.c + 10 && f < B.c + 18 ? [0, 1.5, 2.5, 1.5, 0.5, 2, 1, 0][f - B.c - 10] : 0 },
    back: () => {
      // his rental car, parked on the shoulder at the left
      lamps.push(car({ kind: 'hatch', x: -640, y: GROUND + 36, dir: 1 }));
    },
    fg: () => {
      if (!o.noKido) {
        const ko = k.o;
        const face = { blink: blinkAt(f, 3), eye: 'open' };
        const hold = k.held ? { n: hangFromHand(ko.pose.arms.n, 1, (ctx, { L }) => bag('tomato', 0, 78, { seed: k.slot.seed })) } : null;
        puppet(KIDO, { ...ko, face, hold, holdBehind: true });
      }
      if (buyer) {
        const hold = {};
        if (buyer.hold.length) {
          hold.n = hangFromHand(buyer.pose.arms.n, -1, (ctx, { L }) => {
            buyer.hold.forEach((si, j) => {
              ctx.save();
              ctx.translate(j * 14 - 6, 0);
              ctx.scale(1 - (buyer.squeeze || 0), 1 + (buyer.squeeze || 0));
              bag('pepper', 0, 78, { seed: SLOTS[si].seed });
              ctx.restore();
            });
          });
        }
        puppet(BUYER, { x: buyer.x, ground: GROUND + 24, dir: buyer.dir, pose: buyer.pose, hold, holdBehind: true, face: { eye: buyer.coins >= 0 ? 'down' : 'open' } });
        if (buyer.coins >= 0) {
          // two coins falling into the slot
          const ctx = R.ctx;
          for (let i = 0; i < 2; i++) {
            const ct = buyer.coins - i * 2;
            if (ct < 0 || ct > 2) continue;
            ctx.fillStyle = i ? '#c9a24a' : '#b9bcbf';
            ctx.beginPath();
            ctx.ellipse(BOXPOS.x - 4 + i * 6, 660 + ct * 18, 6, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      if (o.fg) o.fg();
    },
    front: () => lamps.forEach((l) => l.lightsAt()),
  });
}

// A: the stand from the road. B: at the shelf. C: the cash box. D: the sign.
export default {
  id: 's5',
  len: 470,
  mood: 'stand',
  beds: (f) => (f < 396 ? { cicada: 0.8, minmin: 0.5 } : { engine: 0.35, rev: 0, cicada: 0.4 }),
  caps,
  warm: [10, 50, 80, 120, 170, 220, 260, 300, 340, 370, 400, 440],
  draw(f) {
    if (f < B.a) {
      standShot(f, camAt(f, [[0, { ...SHOT.wide, x: 700, z: 0.84 }], [B.a, { ...SHOT.wide, x: 720, z: 0.88 }]]));
      return;
    }
    if (f < B.insert || (f >= B.back && f < B.c)) {
      standShot(f, { x: 470, y: 470, z: 1.9 });
      return;
    }
    if (f < B.back) {
      // the bag, held up close to his face: its label
      const slot = SLOTS[PICK];
      const t = f - B.insert;
      stand({
        time: 'july', cam: { x: 520, y: 440, z: 1.6 }, lifted: [PICK],
        fg: () => withLocal(520 + t * 0.15, 440 - t * 0.1, 8, () => {
          // the thumb and fingers pinching the bag's neck, just out of the top of the frame
          const a = [0.2, 0.15, 0.05];
          armOnly(KIDO, { x: -40, y: -178, s: 0.72, dir: 1, a, hand: 'fist' });
          bag('tomato', 2, 44, { seed: slot.seed, r: 0.02 });
        }),
      });
      return;
    }
    if (f < B.d) {
      // the cash box: he takes hold of it and pulls; it barely moves
      const t = f - B.c;
      const grip = ease.inOut(seg(t, 2, 10)) * (1 - ease.inOut(seg(t, 30, 38)));
      const pull = t >= 10 && t < 26 ? 1 : 0;
      standShot(f, SHOT.box, {
        noKido: true,
        fg: () => {
          // hands on either side of the box; a heave; nothing
          const heave = pull * 4;
          const a1 = lerp(0.1, 0.35, grip), a2 = lerp(0.1, 0.25, grip);
          armOnly(KIDO, { x: 866 + (1 - grip) * -60, y: 541 - heave - (1 - grip) * 40, s: 1.2, dir: 1, a: [a1, a2, 0.1], hand: grip > 0.7 ? 'fist' : 'hand' });
          armOnly(KIDO, { x: 1194 + (1 - grip) * 60, y: 541 - heave - (1 - grip) * 40, s: 1.2, dir: -1, a: [a1, a2, 0.1], hand: grip > 0.7 ? 'fist' : 'hand' });
        },
      });
      return;
    }
    if (f < B.e) {
      // the sign: from the words at the top, down to the creature, then the small print
      const t = f - B.d;
      const y0 = SIGNPOS.y + 22, y1 = SIGNPOS.y + 56, y2 = SIGNPOS.y + 94;
      const y = keyAt(t, [[0, y0], [14, y0], [40, y1], [62, y1], [80, y2], [86, y2]]);
      standShot(f, { x: SIGNPOS.x + SW / 2, y, z: 5.2 }, { noKido: true });
      return;
    }
    if (f < B.f) {
      standShot(f, camAt(f, [[B.e, { ...SHOT.wide, x: 820, z: 0.86 }], [B.f, { ...SHOT.wide, x: 840, z: 0.88 }]]));
      return;
    }
    if (f < B.g) {
      photos(f - B.f);
      return;
    }
    mirrorShot(f - B.g);
  },
  sfx(f, A) {
    if (f === 30 || f === 214 || f === 318) A.tin(0.8);
    if (f === B.a + 12) A.crinkle(0.4, 0.7);
    if (f === B.back) A.crinkle(0.3, 0.6);
    if (f === B.c + 10) A.coins(0.9);
    if (f === B.c + 18) A.coins(0.5);
    const t = f - B.e;
    if (t === 2) A.gravel(1);
    if (t === 8) A.door(0.7);
    if (t > 14 && t < 44 && t % 5 === 0) A.gravel(0.4);
    if (t === 52 || t === 74 || t === 80) A.crinkle(0.3, 0.6);
    if (t === 96) A.coin(0.9);
    if (t === 99) A.coin(0.8);
    if (t > 104 && t < 126 && t % 5 === 0) A.gravel(0.4);
    if (t === 128) A.door(0.6);
    for (let i = 0; i < 4; i++) if (f === B.f + 2 + i * 8) A.shutter(1);
    if (f === B.g) { A.door(0.8); }
    if (f === B.g + 14) A.pass(0.7, 2.6);
    if (f === B.g + 30) A.motif(0.035, 0, 2);
  },
};

// F: four photographs on his phone: the shelves, a label, the sign, the cash box.
const PHOTO_CAMS = [
  { x: 800, y: 470, z: 1.02 },
  { x: SLOTS[2].x, y: SLOTS[2].y - 36, z: 5 },
  { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + SH / 2, z: 3.8 },
  { x: BOXPOS.x + 40, y: BOXPOS.y - 50, z: 3 },
];
function photos(t) {
  const k = Math.min(3, Math.floor((t - 2) / 8));
  const shot = t < 2 ? 0 : k;
  const since = t < 2 ? 99 : (t - 2) % 8;
  // behind the phone: the stand, a little out of focus
  standShot(B.f, { x: 760, y: 500, z: 1.25 }, { noKido: true });
  const ctx = R.ctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(20,16,12,0.35)';
  ctx.fillRect(0, 0, R.canvas.width, R.canvas.height);
  ctx.restore();
  withCam(800, 450, 1, () => {
    // the phone, held in both hands
    const px = 800, py = 470, pw = 520, ph = 300;
    const img = inset('photo' + shot, pw * R.k * 0.9, ph * R.k * 0.9, () => stand({ time: 'july', cam: PHOTO_CAMS[shot], bags: 'all', live: shot === 1 ? [2] : [] }));
    armOnly(KIDO, { x: px - 420, y: py + 520, s: 1.6, dir: 1, a: [1.2, 1.25, 0.2], hand: 'fist' });
    armOnly(KIDO, { x: px + 420, y: py + 520, s: 1.6, dir: -1, a: [1.2, 1.25, 0.2], hand: 'fist' });
    ctx.save();
    ctx.fillStyle = '#1b1a1e';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30 * R.px;
    ctx.shadowOffsetY = 12 * R.px;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(px - pw / 2 - 18, py - ph / 2 - 18, pw + 36, ph + 36, 26) : ctx.rect(px - pw / 2 - 18, py - ph / 2 - 18, pw + 36, ph + 36);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(img, px - pw / 2, py - ph / 2, pw, ph);
    if (since === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
    } else if (since < 3) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 / since})`;
      ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
    }
    // the shutter button and a thumbnail of the last one
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(px + pw / 2 - 36, py, 16, 0, Math.PI * 2);
    ctx.fill();
  });
}

// G: back in the car. In the mirror: the stand, and a kei truck going by.
function mirrorShot(t) {
  const truckX = keyAt(t, [[8, 2600], [62, -1500]], ease.lin);
  const glance = t >= 30 && t < 37;
  carInterior({
    time: 'july',
    hands: { spec: KIDO },
    mirror: () => stand({
      time: 'july', cam: { x: 800, y: 640, z: 0.9 }, bags: SLOTS.map((_, i) => i).filter((i) => i !== 31 && i !== 29),
      fg: () => {
        if (t > 8 && t < 62) car({ kind: 'kei', x: truckX, y: GROUND + 190, dir: -1, roll: -truckX / 78, load: keiLoad(4), driver: (c) => keiDriver(c, glance) });
      },
    }),
  });
}

// the old man at the wheel of the kei truck (drawn inside the cab's glass)
export function keiDriver(c, glance = false) {
  c.save();
  c.translate(250, -440);
  c.fillStyle = '#7e8a74';
  c.fillRect(-70, 40, 110, 80);
  c.fillStyle = '#b98260';
  if (glance) {
    // turned towards the stand: we see his face
    c.beginPath(); c.ellipse(-10, 0, 34, 40, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#231c1c';
    c.fillRect(-24, -6, 7, 4); c.fillRect(0, -6, 7, 4);
  } else {
    c.beginPath(); c.ellipse(0, 0, 34, 40, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(30, -8); c.lineTo(44, 8); c.lineTo(28, 12); c.fill();
  }
  c.fillStyle = '#d9bf7c';
  c.beginPath(); c.ellipse(-4, -30, 64, 12, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(-4, -44, 34, 22, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#2d2a28';
  c.fillRect(-38, -38, 68, 6);
  c.restore();
}
