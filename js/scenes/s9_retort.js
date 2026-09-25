// Scene 9 — "That's just how you want to read it." One glove off, then the other.
// He never said a word, that man. Then Kadowaki restacks the four empty crates for tomorrow.
import { veranda, SHOT as VS, ENGAWA, GROUND, TRUCK } from '../sets/veranda.js';
import { puppet, restPose, walkAlong, withArm, mixPose, mouthAt, blinkAt } from '../puppet.js';
import { KIDO, KADO } from '../cast.js';
import { crate } from '../props.js';
import { CAPS } from '../text.js';
import { ease, seg, lerp, hs, hash } from '../util.js';
import { camAt, pickAt, keyAt, talking } from '../common.js';
import { kidoSitting, kadoSitting, KADO_SEAT } from './s7_veranda.js';

const caps = [
  { a: 14, b: 56, ...CAPS.s9[0] },
  { a: 60, b: 109, ...CAPS.s9[1] },
  { a: 140, b: 191, ...CAPS.s9[2] },
  { a: 196, b: 250, ...CAPS.s9[3] },
];
const STAND = 110; // he gets up, steps into his sandals
const CRATES = 262; // at the truck

// the crates: from where they were thrown on the bed to a neat stack of two by two
const MESSY = [[-400, -290, 0.06], [-262, -290, -0.08], [-330, -330, 0.18], [-230, -326, -0.12]];
const NEAT = [[-400, -290, 0], [-250, -290, 0], [-400, -330, 0], [-250, -330, 0]];
function crateLoad(t) {
  return (ctx) => {
    for (let i = 0; i < 4; i++) {
      const p = ease.inOut(seg(t, 8 + i * 12, 16 + i * 12));
      const lift = Math.sin(p * Math.PI) * 30;
      const [x0, y0, r0] = MESSY[i], [x1, y1, r1] = NEAT[i];
      crate(lerp(x0, x1, p), lerp(y0, y1, p) - lift, { r: lerp(r0, r1, p), lift: 13 + lift * 0.4, color: i % 2 ? '#e2b43a' : '#d9a92c' });
    }
  };
}

export default {
  id: 's9',
  len: 330,
  mood: 'kado',
  beds: { cicada: 0.8, minmin: 0.4 },
  caps,
  warm: [5, 60, 120, 170, 220, 280, 320],
  draw(f) {
    const kdTalk = talking(caps, f, 'kado');
    if (f < CRATES) {
      const glovesOff = f >= 60;
      const up = ease.inOut(seg(f, STAND, STAND + 12));
      const walkT = f - STAND - 12;
      let kd;
      if (f < STAND) kd = kadoSitting(f, { head: f < 14 ? 0.1 : 0, arm: [0.35, 1.0, 0.1] });
      else if (walkT < 0) kd = { spec: KADO, x: KADO_SEAT.x + up * 60, y: undefined, ground: GROUND + 10, dir: -1, pose: mixPose({ ...restPose(), lean: 0.3 }, restPose(), up) };
      else {
        const w = walkAlong(KADO, walkT, 40, 70, KADO_SEAT.x + 60, 1300);
        kd = { spec: KADO, x: w.x, ground: GROUND + 10, dir: walkT >= 30 ? 1 : f >= 132 ? 1 : -1, pose: { ...w.pose, head: 0.05 } };
      }
      const ki = kidoSitting(f, { head: f >= STAND + 20 ? -0.04 : 0.04 });
      veranda({
        cam: pickAt(f, [[0, VS.two], [56, { x: 790, y: 430, z: 2.3 }], [108, { ...VS.two, x: 700, z: 1.0 }], [192, { x: 400, y: 420, z: 2.3 }], [222, { x: 980, y: 500, z: 0.95 }]]),
        glasses: [{ x: 440, full: 0.3 }, { x: 700, full: 0.2 }],
        fg: () => {
          puppet(KIDO, { ...ki, face: { blink: blinkAt(f, 3) } });
          const o = { ...kd, gloves: { n: false, f: !glovesOff }, face: { mouth: mouthAt(kdTalk, f, 4), blink: blinkAt(f, 4), eye: f >= 186 ? 'down' : 'open' } };
          if (kd.y === undefined) delete o.y;
          puppet(KADO, o);
        },
      });
      return;
    }
    // at the truck: the four empty crates, stacked again, neatly, for tomorrow
    const t = f - CRATES;
    veranda({
      cam: camAt(t, [[0, VS.truck], [68, { ...VS.truck, z: 1.18 }]]),
      glasses: [{ x: 440, full: 0.3 }, { x: 700, full: 0.2 }],
      truck: { load: crateLoad(t) },
      fg: () => {
        const cur = Math.min(3, Math.max(0, Math.floor((t - 6) / 12)));
        const r = t < 56 ? Math.sin(((t - 6) % 12) / 12 * Math.PI) : 0;
        const pose = withArm({ ...restPose(), lean: 0.1 + r * 0.1, head: 0.25 }, 'n', [0.8 + r * 0.5, 0.5, 0.1], 'fist');
        pose.arms.f = [0.7 + r * 0.4, 0.6, 0.1];
        puppet(KADO, { x: TRUCK.x + 150 - cur * 16, ground: GROUND + 30, dir: -1, pose, face: { eye: 'down', blink: blinkAt(f, 4) } });
      },
    });
  },
  sfx(f, A) {
    if (f === 60) A.rustle(0.2, 0.3);
    if (f === STAND + 4) A.step(0.6);
    if (f > STAND + 52 && f < STAND + 82 && f % 6 === 0) A.gravel(0.4);
    const t = f - CRATES;
    for (let i = 0; i < 4; i++) if (t === 16 + i * 12) A.tap(0.7);
    if (t === 60) A.motif(0.04, 0, 0);
  },
};
