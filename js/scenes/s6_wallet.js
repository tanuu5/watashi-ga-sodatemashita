// Scene 6 — "The dead man's wallet." The cloud company's answer, laid out on the desk:
// the owner's account, a virtual wallet under it, three rules, four payees. Nothing else.
// A memo; the calculator; and a phone call to the heir.
import { R } from '../render.js';
import { desk, topHand, pen, sheet, printLines } from '../sets/desk.js';
import { office, SHOT as OS, CHAIR, DESK } from '../sets/office.js';
import { card, wool, memoSlip, calculator } from '../docs.js';
import { puppet, sitPose, withArm, mouthAt, blinkAt } from '../puppet.js';
import { KIDO_TIE } from '../cast.js';
import { CAPS, CHAPTERS, WALLET, MEMO, CALC, SUBS } from '../text.js';
import { ease, seg, lerp, hs, clamp } from '../util.js';
import { camAt, keyAt, talking, chapterLabel, fadeBlack } from '../common.js';
import { F } from '../fonts.js';

const caps = [
  { a: 100, b: 168, ...CAPS.s6[0] },
  { a: 170, b: 234, who: 'sub', ja: '', en: SUBS.memo },
  { a: 272, b: 294, ...CAPS.s6[1] },
  { a: 298, b: 355, ...CAPS.s6[2] },
  { a: 376, b: 416, ...CAPS.s6[3] },
  { a: 420, b: 456, ...CAPS.s6[4] },
  { a: 460, b: 498, ...CAPS.s6[5] },
];
const SH = { diagram: 0, memo: 156, calc: 236, phone: 356 };
const len = 500;

// the diagram's pieces: [appear frame, draw]
const EN = () => R.lang === 'en';
function diagram(f) {
  const drop = (t0) => (f < t0 ? null : { dy: f === t0 ? -14 : f === t0 + 1 ? -4 : 0, lift: f < t0 + 2 ? 24 : 4 });
  const w = WALLET;
  let d;
  if ((d = drop(6))) card(800, 150 + d.dy, 420, 110, [{ text: EN() ? w.en.parent : w.parent, bold: true, size: 22 }, { text: w.parentSub, size: 15 }], { head: true, seed: 1, lift: d.lift });
  if (f >= 18) wool([[800, 205], [800, 280]]);
  if ((d = drop(20))) card(800, 330 + d.dy, 380, 100, [{ text: EN() ? w.en.child : w.child, bold: true, size: 20 }, { text: w.childSub, size: 14 }], { head: true, headColor: '#e0703f', seed: 2, lift: d.lift });
  w.rules.forEach((r, i) => { if ((d = drop(34 + i * 8))) card(1150, 250 + i * 64 + d.dy, 260, 50, [{ text: EN() ? w.en.rules[i] : r, size: 15 }], { seed: 3 + i, color: '#fff7df', lift: d.lift }); });
  if (f >= 34) wool([[990, 330], [1020, 250 + 64]], { color: '#8a6a3a', width: 2 });
  w.payees.forEach((p, i) => {
    const x = 380 + i * 280;
    if (f >= 58 + i * 8) wool([[800, 380], [x, 520]]);
    if ((d = drop(60 + i * 8))) card(x, 560 + d.dy, 230, 76, [{ text: EN() ? w.en.payees[i] : p, bold: true, size: 19 }], { seed: 7 + i, color: '#f3f6fb', headColor: '#3f6aa0', head: true, lift: d.lift });
  });
  if ((d = drop(112))) card(470, 330 + d.dy, 250, 60, [{ text: w.balance, size: 17, bold: true }], { seed: 12, color: '#fdf1e4', lift: d.lift });
}

export default {
  id: 's6',
  len,
  mood: 'wallet',
  beds: { room: 0.6 },
  caps,
  warm: [5, 60, 110, 160, 200, 250, 300, 360, 420, 480],
  draw(f) {
    if (f < SH.memo) {
      desk({
        cam: camAt(f, [[0, { x: 800, y: 380, z: 0.98 }], [SH.memo, { x: 800, y: 400, z: 1.05 }]], ease.sine),
        time: 'july',
        items: () => diagram(f),
        hands: () => {
          const t = f % 8;
          const place = f < 100 ? Math.sin((t / 8) * Math.PI) : 0;
          topHand({ x: 1180 - place * 60, y: 900 - place * 120, r: -0.4, side: 'r', pose: 'flat' });
        },
      });
    } else if (f < SH.calc) {
      const t = f - SH.memo;
      const n = Math.max(0, (t - 8) * 0.9);
      desk({
        cam: { x: 760, y: 480, z: 1.7 },
        time: 'july',
        items: () => {
          diagram(999);
          memoSlip(760, 470, MEMO, { n, w: 560, h: 150, size: 30, seed: 2 });
        },
        hands: () => {
          const chars = Math.min(n, [...MEMO[0]].length + [...MEMO[1]].length);
          const line = chars < [...MEMO[0]].length ? 0 : 1;
          const col = line ? chars - [...MEMO[0]].length : chars;
          const px = 760 - 280 + 22 + col * 29, py = 470 - 75 + 30 + line * 34;
          topHand({ x: px + 110, y: py + 150, r: -0.5, side: 'r', pose: 'pen', hold: (ctx) => { ctx.save(); ctx.scale(0.53, 0.53); pen(-60, -80, -0.5, { lift: 20 }); ctx.restore(); } });
        },
      });
    } else if (f < SH.phone) {
      const t = f - SH.calc;
      const seq = ['3', '32', '326', '3262', '32624', '326248', '3262480', '3262480', '368000', '368000', CALC.months];
      const k = Math.min(seq.length - 1, Math.floor(t / 4));
      const display = t < 44 ? seq[k] : CALC.months;
      const writing = Math.max(0, (t - 56) * 0.6);
      desk({
        cam: { x: 900, y: 500, z: 1.5 },
        time: 'july',
        items: () => {
          memoSlip(700, 470, [...MEMO, CALC.note], { n: 99 + writing, w: 560, h: 190, size: 30, seed: 2 });
          calculator(1150, 520, { r: -0.1, display, pressed: t < 44 && t % 4 < 2 ? (t * 7) % 20 : -1 });
        },
        hands: () => {
          if (t < 48) topHand({ x: 1150 + hs('cx', Math.floor(t / 4)) * 40, y: 640 + (t % 4 < 2 ? 0 : -10), r: -0.2, side: 'r', pose: 'point' });
          else topHand({ x: 700 - 280 + 22 + Math.min(writing, 8) * 29 + 110, y: 470 - 95 + 30 + 68 + 150, r: -0.5, side: 'r', pose: 'pen', hold: (ctx) => { ctx.save(); ctx.scale(0.53, 0.53); pen(-60, -80, -0.5, { lift: 20 }); ctx.restore(); } });
        },
      });
    } else {
      // the phone: the heir, somewhere on a platform in Tokyo
      const t = f - SH.phone;
      const kTalk = talking(caps, f, 'kido');
      const pose = withArm({ ...sitPose({ knee: 1.45 }), lean: 0.08, head: t > 110 ? 0.2 : 0.04 }, 'n', [0.35, 2.45, 0.3], 'fist');
      pose.arms.f = [0.72, 0.9, 0.05];
      office({
        cam: camAt(t, [[0, { x: 700, y: 440, z: 1.6 }], [140, { x: 690, y: 440, z: 1.75 }]]),
        time: 'july',
        phone: 'held',
        fg: () => puppet(KIDO_TIE, {
          x: CHAIR.x + 10, y: CHAIR.seat - 10, pose,
          hold: { n: (ctx, { L }) => { ctx.save(); ctx.translate(0, L.hand * 0.5); ctx.rotate(1.2); ctx.fillStyle = '#e8e6de'; ctx.fillRect(-44, -8, 88, 16); ctx.restore(); } },
          face: { mouth: mouthAt(kTalk, f, 1), blink: blinkAt(f, 1), eye: t > 110 ? 'down' : 'open' },
        }),
      });
    }
    chapterLabel(CHAPTERS.c3, f - 2, 76);
    fadeBlack(1 - ease.out(seg(f, 0, 8)));
  },
  sfx(f, A) {
    for (const t0 of [6, 20, 34, 42, 50, 60, 68, 76, 84, 112]) if (f === t0) A.tap(0.45);
    if (f > SH.memo + 8 && f < SH.memo + 60 && f % 2 === 0) A.rustle(0.05, 0.2);
    if (f >= SH.calc && f < SH.calc + 44 && (f - SH.calc) % 4 === 0) A.calc(0.8);
    const t = f - SH.phone;
    if (t === 2 || t === 14) A.ringback(0.9);
    if (t === 26) A.click();
    if (t === 44) A.station(0.6);
    if (t === 134) A.busy(0.7);
  },
};
