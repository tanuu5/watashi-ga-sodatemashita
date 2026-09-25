// Scene 3 — the passbook. Every Wednesday, the same line: カ）コトペイセイサン.
// Sales mean someone is selling; selling means someone is making.
import { desk, topHand } from '../sets/desk.js';
import { office, SHOT as OS, CHAIR, DESK, DOOR, FLOOR } from '../sets/office.js';
import { passbook, calculator } from '../docs.js';
import { puppet, restPose, sitPose, withArm, mouthAt, blinkAt } from '../puppet.js';
import { KIDO_TIE, ANZAI } from '../cast.js';
import { CAPS, PASSBOOK } from '../text.js';
import { ease, seg, lerp, clamp } from '../util.js';
import { camAt, keyAt, talking } from '../common.js';

const caps = [
  { a: 20, b: 72, ...CAPS.s3[0] },
  { a: 76, b: 102, ...CAPS.s3[1] },
  { a: 106, b: 171, ...CAPS.s3[2] },
  { a: 196, b: 246, ...CAPS.s3[3] },
  { a: 252, b: 300, ...CAPS.s3[4] },
];
const CUT = 176;
const FIRST = 5; // the row where the Wednesdays begin

export default {
  id: 's3',
  len: 306,
  mood: 'ledger',
  beds: { room: 0.6 },
  caps,
  warm: [4, 60, 120, 180, 240, 290],
  draw(f) {
    if (f < CUT) {
      // the thumb runs down the column, row by row, and stops
      const row = Math.min(PASSBOOK.rows.length - 1, FIRST + Math.floor(clamp((f - 16) / 48) * 11.99));
      const page = row >= FIRST + 8 ? 1 : 0;
      const from = FIRST - 1 + (page ? 8 : 0);
      const local = row - from;
      const side = local >= 8 ? 1 : -1;
      const rowY = 470 - 140 + 45 + (local % 8) * 26.5;
      desk({
        cam: camAt(f, [[0, { x: 800, y: 470, z: 1.55 }], [CUT, { x: 830, y: 480, z: 1.8 }]], ease.sine),
        time: 'june',
        items: () => {
          calculator(1210, 560, { r: -0.2, display: '0' });
          passbook(800, 470, { open: true, from, hi: f > 14 ? row : -1 });
        },
        hands: () => {
          const x = 800 + side * 167 + 128;
          topHand({ x: x + 70, y: rowY + 128, r: -0.5, side: 'r', pose: 'thumb', sleeve: '#f1f2ef' });
          topHand({ x: 380, y: 720, r: 0.4, side: 'l', pose: 'flat', sleeve: '#f1f2ef' });
        },
      });
      return;
    }
    const t = f - CUT;
    const turn = keyAt(t, [[0, 0], [8, 1], [80, 1], [92, 0]]);
    const door = keyAt(t, [[0, 0], [10, 1]]);
    const kTalk = talking(caps, f, 'kido');
    const kpose = turn > 0.5
      ? { ...sitPose({ knee: 1.45 }), head: 0.02, arms: { n: [0.3, 0.9, 0], f: [0.25, 1.0, 0] } }
      : withArm({ ...sitPose({ knee: 1.45 }), lean: 0.12, head: 0.3 }, 'n', [0.78, 0.85, 0.05]);
    office({
      cam: camAt(t, [[0, { ...OS.wide, x: 900, z: 1.0 }], [130, { ...OS.wide, x: 920, z: 1.04 }]]),
      time: 'june',
      door,
      chairTurn: turn * 0.2,
      fg: () => {
        puppet(KIDO_TIE, { x: CHAIR.x + 10, y: CHAIR.seat - 10, pose: kpose, face: { mouth: mouthAt(kTalk, f, 1), blink: blinkAt(f, 1), eye: turn > 0.5 ? 'open' : 'down' } });
        puppet(ANZAI, { x: DOOR.x0 + 70, ground: FLOOR + 6, dir: -1, pose: { ...restPose(), arms: { n: [0.5, 1.4, 0], f: [0.1, 0.2, 0] } }, face: { mouth: mouthAt(talking(caps, f, 'anzai'), f, 2), blink: blinkAt(f, 2) } });
      },
    });
  },
  sfx(f, A) {
    if (f === 0) { A.page(0.6); }
    if (f > 16 && f < 64 && f % 4 === 0) A.rustle(0.08, 0.25);
    if (f === 100) A.tap(0.3);
    if (f === CUT + 2) A.rustle(0.3, 0.4);
    if (f === CUT + 6) A.click();
  },
};
