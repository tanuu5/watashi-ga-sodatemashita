// Scene 2 — the creditors' meeting. Twenty chairs; five used; three people leave.
// In the corridor, Shinoda of the credit union turns back — then thinks better of it.
import { meetingRoom, corridor, CHAIRS } from '../sets/court.js';
import { puppet, restPose, walkAlong, mouthAt, blinkAt, mixPose } from '../puppet.js';
import { KIDO_SUIT, SHINODA } from '../cast.js';
import { CAPS } from '../text.js';
import { ease, seg, lerp, hs } from '../util.js';
import { camAt, talking } from '../common.js';

const caps = [
  { a: 12, b: 88, ...CAPS.s2[0] },
  { a: 112, b: 152, ...CAPS.s2[1] },
  { a: 162, b: 194, ...CAPS.s2[2] },
];
const CUT = 100;
const PEOPLE = [
  { chair: 1, hair: '#3a3230', suit: '#6a6a70', leave: 46 },
  { chair: 3, hair: '#26211f', suit: '#3f4a5a', leave: 58 },
  { chair: 7, hair: '#4a4038', suit: '#7a6a5a', leave: 70 },
  { chair: 11, hair: '#3d3632', suit: '#2c3346', bald: true, leave: 999 }, // Shinoda stays
];

export default {
  id: 's2',
  len: 198,
  mood: 'court',
  beds: (f) => (f < 100 ? { fluor: 0.8 } : { room: 0.5 }),
  caps,
  warm: [5, 60, 90, 120, 170],
  draw(f) {
    if (f < CUT) {
      const people = PEOPLE.filter((p) => f < p.leave).map((p) => ({ ...p, turn: f > p.leave - 6 ? 0.5 : 0 }));
      const askew = {};
      for (const p of PEOPLE) if (f >= p.leave) askew[p.chair] = hs('ask', p.chair) * 0.25;
      meetingRoom({ cam: camAt(f, [[0, { x: 800, y: 470, z: 0.95 }], [CUT, { x: 800, y: 470, z: 1.0 }]], ease.sine), people, askew, kido: true, flicker: true });
      return;
    }
    const t = f - CUT;
    // Kido walks out after him; Shinoda, a few steps ahead, stops and turns
    const sw = walkAlong(SHINODA, t, 0, 10, 1000, 1100);
    const turned = t >= 10;
    const kw = walkAlong(KIDO_SUIT, t, 0, 12, 520, 640);
    const shTalk = talking(caps, f, 'shino');
    const done = t >= 62;
    corridor({
      cam: camAt(t, [[0, { x: 860, y: 480, z: 1.15 }], [90, { x: 880, y: 470, z: 1.22 }]]),
      fg: () => {
        puppet(KIDO_SUIT, { x: kw.x, ground: 830, dir: 1, pose: kw.pose, face: { blink: blinkAt(f, 4) } });
        const p = turned ? { ...restPose(), head: done ? 0.18 : -0.04, arms: { n: [0.2, 0.6, 0], f: [0.1, 0.2, 0] } } : sw.pose;
        puppet(SHINODA, { x: sw.x, ground: 830, dir: turned ? -1 : 1, pose: p, face: { mouth: mouthAt(shTalk, f, 5), eye: done ? 'down' : 'open', blink: blinkAt(f, 5) } });
      },
    });
  },
  sfx(f, A) {
    for (const p of PEOPLE) if (f === p.leave - 4) { A.step(0.5); A.tap(0.3); }
    if (f % 9 === 3 && f < CUT) A.neon(0.25);
    if (f > CUT && f < CUT + 12 && f % 5 === 0) A.step(0.6);
  },
};
