// Scene 7 — Kadowaki's veranda, late July. Barley tea, a mosquito coil, cicadas.
// "That's me. I carry it down." — and, for a moment, the stand at dawn again,
// the same shot as the opening, with the hands in it this time.
import { R } from '../render.js';
import { veranda, SHOT as VS, ENGAWA, GROUND, TRUCK } from '../sets/veranda.js';
import { stand, SLOTS, GROUND as SG } from '../sets/stand.js';
import { farmOutside, HOUSES } from '../sets/farm.js';
import { puppet, restPose, sitPose, walkAlong, withArm, mixPose, mouthAt, blinkAt } from '../puppet.js';
import { KIDO, KADO } from '../cast.js';
import { bag } from '../props.js';
import { car, keiLoad } from '../vehicles.js';
import { CAPS } from '../text.js';
import { ease, seg, lerp, hs, hash, clamp } from '../util.js';
import { camAt, keyAt, pickAt, talking, hangFromHand, fadeBlack } from '../common.js';
import { APPEAR } from './s0_title.js';

const caps = [
  { a: 52, b: 84, ...CAPS.s7[0] },
  { a: 88, b: 110, ...CAPS.s7[1] },
  { a: 114, b: 144, ...CAPS.s7[2] },
  { a: 148, b: 178, ...CAPS.s7[3] },
  { a: 182, b: 226, ...CAPS.s7[4] },
  { a: 230, b: 269, ...CAPS.s7[5] },
  { a: 336, b: 362, ...CAPS.s7[6] },
  { a: 366, b: 390, ...CAPS.s7[7] },
  { a: 394, b: 414, ...CAPS.s7[8] },
  { a: 418, b: 442, ...CAPS.s7[9] },
  { a: 446, b: 490, ...CAPS.s7[10] },
  { a: 494, b: 522, ...CAPS.s7[11] },
  { a: 528, b: 558, ...CAPS.s7[12] },
  { a: 562, b: 598, ...CAPS.s7[13] },
];
const FB = { a: 266, b: 332 }; // the flashback

export const KIDO_SEAT = { x: 360, y: ENGAWA.top - 4 };
export const KADO_SEAT = { x: 820, y: ENGAWA.top - 4 };

export function kidoSitting(f, o = {}) {
  const p = withArm({ ...sitPose({ knee: 1.5 }), lean: 0.06, head: o.head ?? 0.04 }, 'n', o.arm || [0.32, 1.1, 0.1]);
  return { spec: KIDO, x: KIDO_SEAT.x, y: KIDO_SEAT.y, dir: 1, pose: p };
}
export function kadoSitting(f, o = {}) {
  const p = withArm({ ...sitPose({ knee: 1.4 }), lean: 0.14, head: o.head ?? 0 }, 'n', o.arm || [0.3, 1.05, 0.1], o.hand);
  return { spec: o.spec || KADO, x: KADO_SEAT.x, y: KADO_SEAT.y, dir: -1, pose: p };
}

export default {
  id: 's7',
  len: 602,
  mood: 'veranda',
  beds: (f) => (f >= 266 && f < 332 ? { higurashi: 0.6 } : { cicada: f >= 528 ? 0.4 : 0.9, minmin: f < 300 ? 0.6 : 0.3 }),
  caps,
  warm: [4, 40, 80, 130, 200, 250, 280, 320, 360, 420, 480, 540],
  draw(f) {
    if (f >= FB.a && f < FB.b) { flashback(f - FB.a); return; }
    const kdTalk = talking(caps, f, 'kado'), kiTalk = talking(caps, f, 'kido');
    // what his glass is doing: held, drunk from, set down on the board
    const drink = f >= 150 && f < 170;
    const down = f >= 524;
    const nod = f >= 116 && f < 136 ? -0.35 : 0; // a nod of the chin, towards the houses over the road
    const puzzled = f >= 418 && f < 444;
    const kdArm = down ? [0.35, 1.0, 0.1] : drink ? [0.6, 2.3, 0.3] : [0.5, 1.25, 0.2];
    const kd = kadoSitting(f, { head: nod + (drink ? -0.25 : 0), arm: kdArm, hand: 'fist' });
    const ki = kidoSitting(f, { arm: f >= 36 && f < 60 ? [0.55, 1.3, 0.2] : [0.32, 1.1, 0.1] });
    const kdHold = down ? null : { n: hangFromHand(kdArm, -1, (ctx, { L }) => { ctx.save(); ctx.translate(0, 6); ctx.scale(1.1, 1.1); glassInHand(ctx); ctx.restore(); }) };
    // "Over there." — the houses across the road, their vents moving on their own
    if (f >= 118 && f < 148) {
      const t = f - 118;
      farmOutside({ cam: { x: 900, y: 430, z: 0.5 + t * 0.002 }, vents: HOUSES.map((_, i) => 0.2 + ((Math.floor((t + i * 7) / 9) % 3) * 0.12)) });
      return;
    }
    const KIDO_CU = { x: 400, y: 420, z: 2.3 }, KADO_CU = { x: 790, y: 430, z: 2.3 };
    let cam;
    if (f < 40) cam = camAt(f, [[0, VS.wide], [40, { ...VS.wide, z: 0.8 }]]);
    else cam = pickAt(f, [[40, VS.two], [88, KIDO_CU], [110, KADO_CU], [148, KADO_CU], [176, KIDO_CU], [226, KADO_CU], [332, VS.two], [444, KADO_CU], [492, KIDO_CU], [520, { x: 700, y: ENGAWA.top - 30, z: 3.2 }], [540, { x: 1300, y: GROUND + 40, z: 1.4 }], [560, VS.two]]);
    veranda({
      cam,
      glasses: [{ x: 440, full: 0.8 }].concat(f >= 520 ? [{ x: 700, full: 0.5, lift: Math.max(0, 524 - f) * 10 }] : []),
      rings: f >= 530 ? [700] : [],
      furin: f % 90 < 20 ? 1 : 0,
      fg: () => {
        if (f < 40) {
          // he comes round from behind the shed; Kido is already there, standing
          const w = walkAlong(KADO, f, 4, 34, 1260, 900);
          puppet(KIDO, { x: 380, ground: GROUND + 10, dir: 1, pose: restPose(), face: { blink: blinkAt(f, 3) } });
          puppet(KADO, { x: w.x, ground: GROUND + 10, dir: -1, pose: w.pose, face: { blink: blinkAt(f, 4) } });
          return;
        }
        puppet(ki.spec, { ...ki, face: { mouth: mouthAt(kiTalk, f, 3), blink: blinkAt(f, 3), eye: 'open' } });
        puppet(kd.spec, { ...kd, hold: kdHold, face: { mouth: mouthAt(kdTalk, f, 4), blink: blinkAt(f, 4), brow: puzzled ? 1.2 : 0, smile: f >= 562 } });
      },
    });
  },
  sfx(f, A) {
    if (f % 90 === 2) A.furin(0.7);
    if (f > 4 && f < 34 && f % 6 === 0) A.gravel(0.4);
    if (f === 150 || f === 524) A.glass(0.8);
    if (f === 118) A.clunk(0.4);
    if (f === 130) A.whirr(0.9, 0.5);
    if (f > FB.a && f < FB.b) for (const k of [8, 20, 32, 44, 56]) if (f === FB.a + k + 3) A.tap(0.5);
    if (f === 564) A.motif(0.03, 0, 1);
  },
};

function glassInHand(ctx) {
  ctx.fillStyle = 'rgba(220,230,228,0.8)';
  ctx.fillRect(-10, -18, 20, 36);
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(-9, -10, 18, 27);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 5; i++) ctx.fillRect(-7 + hash('gb', i) * 14, -12 + hash('gy', i) * 26, 1.6, 2);
}

// The stand at dawn, as in the opening — this time we see who sets the bags down.
function flashback(t) {
  const reach = (k) => ease.inOut(seg(t, k, k + 5)) * (1 - ease.inOut(seg(t, k + 7, k + 11)));
  const slots = [...APPEAR.keys()];
  const placed = Math.min(slots.length, 14 + Math.floor(t / 12) * 2);
  const cur = Math.floor(t / 12) % 6;
  const r = reach(cur * 12 + 2);
  const bags = slots.slice(0, placed);
  const pose = withArm({ ...restPose(), lean: 0.16 + r * 0.1, head: 0.3 }, 'n', [0.4 + r * 0.75, 0.3, 0.1], 'fist');
  stand({
    time: 'dawn',
    cam: { x: 820, y: 520, z: 1.4 },
    bags,
    back: () => car({ kind: 'kei', x: -520, y: SG + 60, dir: 1, load: keiLoad(2) }),
    fg: () => {
      puppet(KADO, {
        x: 1330, ground: SG + 30, dir: -1, pose, gloves: { n: true, f: true },
        hold: r > 0.3 ? { n: hangFromHand(pose.arms.n, -1, (ctx, { L }) => bag('pepper', 0, 78, { seed: 33 })) } : null,
        holdBehind: true, face: { eye: 'down', blink: false },
      });
    },
  });
  fadeBlack(t < 3 ? 0.6 - t * 0.2 : t > 62 ? (t - 62) * 0.15 : 0, '250,248,240');
}
