// Scene 8 — "The last instruction." The operation log, two centimetres of it.
// Automatic, automatic, automatic. In February: "Can't come and look today."
// The last entry: March the ninth, 21:44, from the hospital. Then Shinoda, and a receipt.
import { R } from '../render.js';
import { desk, topHand, sheet } from '../sets/desk.js';
import { office, CHAIR, DESK } from '../sets/office.js';
import { binder, logPage, weight, memoSlip, receipt } from '../docs.js';
import { puppet, sitPose, restPose, withArm, walkAlong, mouthAt, blinkAt } from '../puppet.js';
import { KIDO_TIE, SHINODA } from '../cast.js';
import { CAPS, CHAPTERS, SUBS } from '../text.js';
import { ease, seg, lerp, hs, clamp } from '../util.js';
import { camAt, keyAt, talking, chapterLabel, fadeBlack } from '../common.js';

const caps = [
  { a: 58, b: 94, who: 'sub', ja: '', en: SUBS.feb },
  { a: 98, b: 196, who: 'sub', ja: '', en: SUBS.last },
  { a: 124, b: 166, ...CAPS.s8[0] },
  { a: 170, b: 200, ...CAPS.s8[1] },
  { a: 204, b: 250, ...CAPS.s8[2] },
  { a: 254, b: 317, ...CAPS.s8[3] },
  { a: 330, b: 374, ...CAPS.s8[4] },
  { a: 378, b: 427, ...CAPS.s8[5] },
];
const SH = { flip: 0, feb: 50, last: 90, memo: 198, shino: 318 };

export default {
  id: 's8',
  len: 434,
  mood: 'logs',
  beds: { room: 0.5 },
  caps,
  warm: [5, 40, 60, 100, 140, 200, 240, 280, 320, 380, 420],
  draw(f) {
    if (f < SH.memo) {
      const flipping = f < SH.feb;
      const page = flipping ? Math.floor(f / 6) : f < SH.last ? 20 : 21;
      const turn = flipping ? (f % 6) / 6 : 0;
      const kind = f < SH.feb ? 'auto' : f < SH.last ? 'feb' : 'last';
      const lift = Math.sin(f * 0.21) * 0.5 + 0.5; // the air conditioner lifts the corner of the page
      const cam = f < SH.feb ? { x: 800, y: 460, z: 1.2 } : f < SH.last ? camAt(f, [[SH.feb, { x: 700, y: 470, z: 1.9 }], [SH.last, { x: 700, y: 470, z: 2.0 }]]) : camAt(f, [[SH.last, { x: 720, y: 560, z: 2.1 }], [SH.memo, { x: 720, y: 590, z: 2.5 }]]);
      desk({
        cam,
        time: 'july',
        items: () => {
          binder(800, 470);
          logPage(812, 465, { kind, seed: page, hi: kind === 'feb' });
          if (turn > 0) {
            // the page being turned, lifting from the right and folding over
            const sx = Math.cos(turn * Math.PI);
            const ctx = R.ctx;
            ctx.save();
            ctx.translate(512, 465);
            ctx.scale(sx, 1);
            logPage(300, 0, { kind: 'auto', seed: page + 1, lift: 20 });
            ctx.restore();
          }
          weight(1060, 250 + lift * 3);
        },
        hands: () => {
          const y = f < SH.feb ? 700 : f < SH.last ? lerp(560, 640, ease.inOut(seg(f, SH.feb, SH.feb + 16))) : lerp(620, 720, ease.inOut(seg(f, SH.last, SH.last + 30)));
          topHand({ x: 520, y: y + 150, r: -0.1, side: 'r', pose: 'point' });
        },
      });
    } else if (f < SH.shino) {
      // the memo with the balance set beside the page; then moved away again
      const t = f - SH.memo;
      const side = ease.inOut(seg(t, 4, 14));
      const away = ease.inOut(seg(t, 58, 72));
      const mx = lerp(1300, 1180, side) + away * 260, my = lerp(760, 470, side) + away * 160;
      desk({
        cam: camAt(t, [[0, { x: 900, y: 470, z: 1.05 }], [120, { x: 900, y: 480, z: 1.1 }]]),
        time: 'july',
        items: () => {
          binder(700, 470);
          logPage(712, 465, { kind: 'last', seed: 21 });
          memoSlip(mx, my, ['残高　326万'], { n: 99, w: 300, h: 110, size: 34, seed: 5, r: 0.04 });
        },
        hands: () => {
          const h = t < 16 || (t >= 56 && t < 76);
          topHand({ x: mx + 60, y: my + (h ? 160 : 420), r: -0.3, side: 'r', pose: 'flat' });
        },
      });
    } else {
      // Shinoda, in the visitor's chair; the receipt left on the desk
      const t = f - SH.shino;
      const up = t >= 96;
      const kTalk = talking(caps, f, 'kido');
      const kpose = withArm({ ...sitPose({ knee: 1.45 }), lean: 0.1, head: t > 40 ? 0.12 : 0.04 }, 'n', [0.78, 0.85, 0.05]);
      const spose = up ? restPose() : withArm({ ...sitPose({ knee: 1.5 }), lean: 0.12, head: t > 60 ? 0.2 : 0.06 }, 'n', t >= 4 && t < 20 ? [0.9, 0.9, 0.1] : [0.35, 1.05, 0.1]);
      office({
        cam: camAt(t, [[0, { x: 880, y: 470, z: 1.25 }], [110, { x: 900, y: 470, z: 1.3 }]]),
        time: 'aug',
        deskThings: () => {
          if (t >= 14) sheet(70, 6, 1010, DESK.top - 3, { seed: 9, color: '#f4f2ea', lift: 11 });
        },
        fg: () => {
          puppet(KIDO_TIE, { x: CHAIR.x + 10, y: CHAIR.seat - 10, pose: kpose, face: { mouth: mouthAt(kTalk, f, 1), blink: blinkAt(f, 1), eye: t > 40 ? 'down' : 'open' } });
          if (!up) puppet(SHINODA, { x: 1150, y: 626, dir: -1, pose: spose, face: { mouth: mouthAt(talking(caps, f, 'shino'), f, 5), blink: blinkAt(f, 5), eye: t > 60 ? 'down' : 'open' } });
          else puppet(SHINODA, { x: 1160, ground: 826, dir: 1, pose: restPose(), face: { eye: 'down' } });
        },
      });
    }
    chapterLabel(CHAPTERS.c4, f - 2, 60);
    fadeBlack(1 - ease.out(seg(f, 0, 8)));
  },
  sfx(f, A) {
    if (f < SH.feb && f % 6 === 1) A.page(0.7);
    if (f === SH.feb) A.tap(0.3);
    if (f === SH.last) { A.page(0.5); }
    if (f === SH.last + 40) A.tick(0.4);
    if (f === SH.memo + 6 || f === SH.memo + 62) A.rustle(0.3, 0.4);
    if (f === SH.shino + 14) A.rustle(0.3, 0.4);
  },
};
