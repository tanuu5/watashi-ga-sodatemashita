// Scene 0 — dawn at the stand on the mountain road. Nobody comes; the shelves fill anyway.
// Then the title, lowered on threads.
// (One frame, if you step through, shows whose hand it was.)
import { R } from '../render.js';
import { stand, SHOT, SLOTS, GROUND } from '../sets/stand.js';
import { armOnly } from '../puppet.js';
import { KADO } from '../cast.js';
import { bag } from '../props.js';
import { hangingTitle, titleLabel } from '../title.js';
import { ease, seg, hash } from '../util.js';
import { camAt, fadeBlack, hangFromHand } from '../common.js';

const T0 = 44; // the first bag
// when each slot's bag appears: the tomatoes up top, then the peppers, one every few frames
const ORDER = [];
for (let c = 0; c < 7; c++) ORDER.push(c * 2, c * 2 + 1);
for (let c = 0; c < 10; c++) ORDER.push(14 + c * 2 + 1, 14 + c * 2);
export const APPEAR = new Map(ORDER.map((slot, k) => [slot, T0 + (k < 14 ? k * 3 : 42 + (k - 14) * 2) + (hash('ap', k) > 0.8 ? 1 : 0)]));
export const HIDDEN = T0 + 42 + 13 * 2 + 1; // the one frame with the hand in it
const HIDDEN_SLOT = ORDER[14 + 14];
const TITLE_AT = 140;

const CAM = [
  [0, { ...SHOT.wide, z: 0.78 }], [40, { ...SHOT.wide, z: 0.8 }],
  [41, { x: 800, y: 512, z: 1.72, cut: true }], [41, { x: 800, y: 512, z: 1.72 }], [128, { x: 800, y: 506, z: 1.78 }],
  [129, { ...SHOT.wide, y: 460, z: 0.82, cut: true }], [129, { ...SHOT.wide, y: 460, z: 0.82 }], [230, { ...SHOT.wide, y: 456, z: 0.86 }],
];

// The poster (the picture shown when the film is shared): the stand on a July afternoon,
// the title lowered in front of it. Drawn with ?poster in the address.
export function posterFrame() {
  stand({
    time: 'july',
    cam: { ...SHOT.wide, y: 470, z: 0.84 },
    bags: 'all',
    front: () => {
      hangingTitle(400, 0, { cx: 800, cy: 318, top: 470 - 450 / 0.84 - 10, scale: 1 });
      titleLabel(400, 60, { x: 800, y: 700 });
    },
  });
}

export default {
  id: 's0',
  len: 230,
  mood: 'title',
  beds: (f) => ({ higurashi: f < 200 ? 0.8 : 0.3, wind: 0.25 }),
  caps: [],
  warm: [2, 60, HIDDEN, 120, 150, 200],
  draw(f) {
    const cam = camAt(f, CAM, ease.sine);
    const bags = [];
    let landing = null;
    for (const [slot, t] of APPEAR) {
      if (f >= t) bags.push(slot);
      if (f === t) landing = slot;
    }
    const shown = f < 41 ? [] : bags.filter((s) => s !== landing && !(f === HIDDEN && s === HIDDEN_SLOT));
    stand({
      time: 'dawn',
      cam,
      bags: shown,
      fg: () => {
        // a bag just set down sits a hair high and askew for its first frame
        if (landing !== null && f >= 41) {
          const s = SLOTS[landing];
          bag(s.kind, s.x + 1, s.y - 5, { r: s.r + 0.05, seed: s.seed });
        }
        if (f === HIDDEN) {
          const s = SLOTS[HIDDEN_SLOT];
          const a = [0.95, 0.55, 0.2];
          armOnly(KADO, {
            x: s.x + 269, y: s.y - 210, s: 1.5, dir: -1, a, gloved: true, hand: 'fist',
            hold: hangFromHand(a, -1, (ctx, { L }) => bag(s.kind, 0, 78, { seed: s.seed })),
            holdBehind: true,
          });
        }
      },
      front: () => {
        if (f >= TITLE_AT - 10) {
          hangingTitle(f, TITLE_AT, { cx: 800, cy: 318, top: cam.y - 450 / cam.z - 10, scale: 1 });
          titleLabel(f, f - (TITLE_AT + 40), { x: 800, y: 700 });
        }
      },
    });
    fadeBlack(1 - ease.out(seg(f, 0, 26)));
  },
  sfx(f, A) {
    if (f % 17 === 5 && hash('bd', f) > 0.4) A.bird(0.7);
    for (const [, t] of APPEAR) if (f === t) A.tap(0.35 + hash('tp', t) * 0.25);
    if (f === HIDDEN) A.crinkle(0.2, 0.5);
    for (let i = 0; i < 7; i++) if (f === TITLE_AT + i * 4 + 5) { A.tap(0.6); A.bell(['D5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'E5'][i], 0.07); }
    if (f === TITLE_AT + 40) A.rustle(0.3, 0.5);
  },
};
