// Scene 11 — "The inventory." Three roads, each with one box that won't fill; the paper folded
// into the case file. November: the box taped shut. Then the mountain road once more, at dusk.
// The stand is open. Autumn vegetables; the label's second line gone; the sign faded, its eyes
// still black; next year's planting plan; a new padlock; a note: enquiries, Kadowaki.
import { R } from '../render.js';
import { desk, topHand, pen, sheet } from '../sets/desk.js';
import { office, SHOT as OS, CHAIR, DESK, FLOOR, WIN } from '../sets/office.js';
import { stand, SHOT, GROUND, SIGNPOS, BOXPOS, PLANPOS, NOTEPOS, ST } from '../sets/stand.js';
import { road, ROAD_Y } from '../sets/road.js';
import { carInterior } from '../sets/car.js';
import { pathsSheet, caseFile, cardboardBox, inventoryForm } from '../docs.js';
import { puppet, restPose, withArm, walkAlong, mouthAt, blinkAt } from '../puppet.js';
import { KIDO_COAT, ANZAI } from '../cast.js';
import { car } from '../vehicles.js';
import { SW, SH as SIGNH } from '../creature.js';
import { hangingTitle, titleLabel } from '../title.js';
import { CAPS, CHAPTERS, SUBS, PATHS } from '../text.js';
import { ease, seg, lerp, hs, hash, clamp } from '../util.js';
import { camAt, keyAt, pickAt, talking, chapterLabel, fadeBlack } from '../common.js';

const SH = { paths: 0, fold: 104, box: 146, tape: 244, road: 334, arrive: 400, shelf: 440, sign: 480, plan: 520, note: 560, leave: 604, end: 668 };
const LEN = 800;
const caps = [
  { a: 16, b: 102, who: 'sub', ja: '', en: SUBS.paths },
  { a: 44, b: 96, ...CAPS.s11[0] },
  { a: 164, b: 208, ...CAPS.s11[1] },
  { a: 212, b: 246, ...CAPS.s11[2] },
  { a: 256, b: 300, ...CAPS.s11[3] },
  { a: 304, b: 345, ...CAPS.s11[4] },
  { a: 408, b: 443, ...CAPS.s11[5] },
  { a: 446, b: 482, who: 'sub', ja: '', en: SUBS.label2 },
  { a: 524, b: 562, who: 'sub', ja: '', en: SUBS.plan },
  { a: 566, b: 600, who: 'sub', ja: '', en: SUBS.note },
];
const QCHARS = PATHS.rows.reduce((a, r) => a + [...r.q].length, 0);

function novStand(f, cam, o = {}) {
  const lamps = [];
  stand({
    time: 'nov', cam, autumn: true,
    sign: { fade: 1, lamCloud: 1, sway: o.signSway || 0 },
    box: { lock: 'new' },
    plan: { lift: o.planLift || 0 },
    note: { wave: o.noteWave || 0 },
    back: () => { if (o.car !== false) lamps.push(car({ kind: 'hatch', x: -600, y: GROUND + 36, dir: 1, lights: 1 })); },
    fg: () => { if (o.kido) puppet(KIDO_COAT, { x: o.kido.x, ground: GROUND + 20, dir: o.kido.dir || 1, pose: o.kido.pose || restPose(), face: { blink: blinkAt(f, 3), eye: o.kido.eye || 'open' } }); },
    front: () => { lamps.forEach((l) => l.lightsAt()); if (o.front) o.front(); },
  });
}

export default {
  id: 's11',
  len: LEN,
  mood: 'inventory',
  beds: (f) => (f < 334 ? { room: 0.5 } : f < 410 ? { engine: 0.5, rev: 0.5, wind: 0.4 } : f < 604 ? { wind: 0.4 } : f < 668 ? { engine: 0.4, rev: 0.3, wind: 0.3 } : { wind: 0.5 }),
  moodAt: (f) => (f >= SH.road ? 'november' : 'inventory'),
  caps,
  warm: [5, 60, 110, 160, 220, 260, 300, 350, 410, 450, 490, 530, 570, 620, 680, 740, 790],
  draw(f) {
    if (f < SH.fold) {
      const n = Math.max(0, (f - 20) * (QCHARS / 70));
      desk({
        cam: camAt(f, [[0, { x: 800, y: 470, z: 1.15 }], [SH.fold, { x: 780, y: 500, z: 1.3 }]], ease.sine),
        time: 'nov',
        items: () => pathsSheet(780, 470, { n, vals: 3 }),
        hands: () => {
          const k = Math.min(QCHARS, n);
          let row = 0, acc = 0;
          while (row < 2 && acc + [...PATHS.rows[row].q].length <= k) { acc += [...PATHS.rows[row].q].length; row++; }
          const col = k - acc;
          const px = 780 - 210 + 50 + col * 11, py = 470 - 297 + 90 + 70 + row * 90 + 32;
          topHand({ x: px + 110, y: py + 150, r: -0.5, side: 'r', pose: 'pen', hold: (ctx) => { ctx.save(); ctx.scale(0.53, 0.53); pen(-60, -80, -0.5, { lift: 20 }); ctx.restore(); } });
        },
      });
    } else if (f < SH.box) {
      // folded in two; slipped inside the cover of the case file
      const t = f - SH.fold;
      const fold = ease.inOut(seg(t, 2, 14));
      const cover = ease.inOut(seg(t, 20, 34));
      desk({
        cam: { x: 800, y: 470, z: 1.1 },
        time: 'nov',
        items: () => {
          caseFile(800, 470);
          const ctx = R.ctx;
          ctx.save();
          ctx.translate(lerp(780, 800, cover), lerp(470, 470 + cover * 10, cover));
          ctx.scale(1 - fold * 0.5, 1);
          ctx.translate(-fold * 105, 0);
          pathsSheet(0, 0, { n: 999, vals: 3, lift: 3 + fold * 6 });
          ctx.restore();
          if (cover > 0) caseFile(lerp(1500, 800, cover), 470, { lift: 6 });
        },
      });
    } else if (f < SH.tape) {
      // November. Anzai tapes the box of the case record; Kido at the window
      const t = f - SH.box;
      const tapeX = keyAt(t, [[8, 0], [22, 1], [30, 1], [44, 0]]);
      office({
        cam: camAt(t, [[0, { ...OS.wide, x: 760, z: 1.05 }], [98, { ...OS.wide, x: 780, z: 1.1 }]]),
        time: 'nov',
        chair: true,
        deskThings: () => {
          sheet(300, 170, 900, DESK.top - 85, { seed: 40, color: '#c9a578', tex: 'washi', lift: 11, print: (c) => {
            c.fillStyle = 'rgba(220,200,150,0.8)';
            c.fillRect(-150, -6, 300 * tapeX + (t > 30 ? 300 : 0) * 0, 12);
          } });
        },
        fg: () => {
          puppet(KIDO_COAT, { x: 560, ground: FLOOR + 6, dir: -1, pose: { ...restPose(), head: -0.05 }, face: { mouth: mouthAt(talking(caps, f, 'kido'), f, 1), blink: blinkAt(f, 1) } });
          const a = withArm({ ...restPose(), lean: 0.2 }, 'n', [1.0 + tapeX * 0.3, 0.6, 0.1], 'fist');
          puppet(ANZAI, { x: 1180, ground: FLOOR + 6, dir: -1, pose: a, face: { mouth: mouthAt(talking(caps, f, 'anzai'), f, 2), blink: blinkAt(f, 2), eye: 'down' } });
        },
      });
    } else if (f < SH.road) {
      // the filled inventory on top; the flaps shut; tape across
      const t = f - SH.tape;
      const shut = ease.inOut(seg(t, 64, 76));
      desk({
        cam: { x: 800, y: 460, z: 1.0 },
        time: 'nov',
        items: () => {
          cardboardBox(800, 440, {
            contents: (ctx) => {
              caseFile(0, 20, { r: 0.02 });
              inventoryForm(10, 0, { r: -0.03, fill: 1 });
            },
          });
          if (shut > 0) {
            sheet(600, 220 * shut, 800, 440 - 220 + 110 * shut, { seed: 50, color: '#c9a578', tex: 'washi', lift: 12 });
            sheet(600, 220 * shut, 800, 440 + 220 - 110 * shut, { seed: 51, color: '#c29d70', tex: 'washi', lift: 12 });
          }
          if (t >= 78) {
            const tp = ease.out(seg(t, 78, 88));
            sheet(700 * tp, 60, 450 + 350 * tp, 440, { seed: 52, color: '#d8c48e', tex: 'plain', lift: 14, alpha: 0.85 });
          }
        },
      });
    } else if (f < SH.arrive) {
      const t = f - SH.road;
      const carX = lerp(2400, -900, t / (SH.arrive - SH.road));
      road({ time: 'nov', carX, cam: { x: carX + 200, y: 500, z: 0.6 }, lights: 1, oncoming: lerp(-2400, 2600, t / (SH.arrive - SH.road)), smoke: 1 });
    } else if (f < SH.shelf) {
      const t = f - SH.arrive;
      novStand(f, camAt(t, [[0, { ...SHOT.wide, x: 700, z: 0.84 }], [40, { ...SHOT.wide, x: 720, z: 0.9 }]]), { kido: t >= 16 ? { x: 150, pose: { ...restPose(), head: 0.05 } } : null });
    } else if (f < SH.sign) {
      novStand(f, camAt(f - SH.shelf, [[0, { x: 560, y: 520, z: 3.2 }], [40, { x: 580, y: 530, z: 3.6 }]]));
    } else if (f < SH.sign + 40) {
      novStand(f, camAt(f - SH.sign, [[0, { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + 30, z: 4.6 }], [40, { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + 56, z: 4.8 }]]));
    } else if (f < SH.note) {
      const t = f - SH.plan;
      novStand(f, camAt(t, [[0, { x: PLANPOS.x + 59, y: PLANPOS.y + 42, z: 4.2 }], [40, { x: PLANPOS.x + 59, y: PLANPOS.y + 46, z: 4.4 }]]), { planLift: t >= 18 && t < 30 ? Math.sin((t - 18) / 12 * Math.PI) : 0 });
    } else if (f < SH.leave) {
      const t = f - SH.note;
      novStand(f, camAt(t, [[0, { x: (BOXPOS.x + NOTEPOS.x + 35) / 2, y: 720, z: 3.0 }], [20, { x: NOTEPOS.x + 35, y: NOTEPOS.y + 23, z: 5.2 }], [44, { x: NOTEPOS.x + 35, y: NOTEPOS.y + 23, z: 5.4 }]]), { noteWave: t >= 26 && t < 36 ? Math.sin((t - 26) / 10 * Math.PI) : 0 });
    } else if (f < SH.end) {
      // back in the car; in the mirror the stand's roof sinks lower, and the curve takes it
      const t = f - SH.leave;
      carInterior({
        time: 'nov',
        hands: { spec: KIDO_COAT },
        mirror: () => novStand(f, { x: 800 - t * 14, y: 460 + t * 2, z: Math.max(0.3, 0.9 - t * 0.012) }, { car: false }),
        after: () => {
          // the cedars at the bend slide across the mirror and it is gone
          if (t > 40) {
            const ctx = R.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.rect(800 - 165, 118 - 52, 330, 104);
            ctx.clip();
            ctx.fillStyle = '#3f4b3c';
            const k = ease.in(seg(t, 40, 60));
            ctx.fillRect(800 + 165 - k * 340, 60, 340, 120);
            ctx.restore();
          }
        },
      });
    } else {
      // the sign again, in the last of the light; the title lowered on threads over it
      const t = f - SH.end;
      novStand(f, camAt(t, [[0, { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + SIGNH * 0.5, z: 3.0 }], [80, { x: SIGNPOS.x - 200, y: SIGNPOS.y + 90, z: 1.6 }], [130, { x: SIGNPOS.x - 250, y: SIGNPOS.y + 110, z: 1.5 }]]), {
        signSway: Math.sin(t * 0.12) * 0.004,
        front: () => {
          const cam = camAt(t, [[0, { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + SIGNH * 0.5, z: 3.0 }], [80, { x: SIGNPOS.x - 200, y: SIGNPOS.y + 90, z: 1.6 }], [130, { x: SIGNPOS.x - 250, y: SIGNPOS.y + 110, z: 1.5 }]]);
          if (t >= 44) {
            hangingTitle(t, 48, { cx: SIGNPOS.x - 330, cy: SIGNPOS.y - 10, scale: 0.6, top: cam.y - 450 / cam.z - 10, lift: 12 });
            titleLabel(t, t - 84, { x: SIGNPOS.x - 330, y: SIGNPOS.y + 210, credit: true });
          }
        },
      });
      fadeBlack(ease.in(seg(t, 112, 132)));
    }
    chapterLabel(CHAPTERS.c6, f - 2, 60);
    if (f < 8) fadeBlack(1 - ease.out(seg(f, 0, 8)));
  },
  sfx(f, A) {
    if (f > 20 && f < 90 && f % 3 === 0) A.rustle(0.05, 0.2);
    if (f === SH.fold + 4) A.rustle(0.5, 0.6);
    if (f === SH.fold + 22) A.rustle(0.3, 0.4);
    const tb = f - SH.box;
    if (tb === 8) A.tape(1.2, 1);
    if (tb === 32) A.tape(1.1, 0.9);
    const tt = f - SH.tape;
    if (tt === 64) A.rustle(0.4, 0.6);
    if (tt === 78) A.tape(0.8, 1);
    if (f === SH.road + 26) A.pass(0.8, 2);
    if (f === SH.arrive + 10) { A.gravel(0.7); }
    if (f === SH.arrive + 14) A.door(0.8);
    if (f === SH.plan + 16) A.pass(0.9, 2);
    if (f === SH.note + 24) A.pass(0.7, 1.8);
    if (f === SH.leave) { A.door(0.8); }
    for (let i = 0; i < 7; i++) if (f === SH.end + 48 + i * 4 + 5) { A.tap(0.5); A.bell(['D5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'E5'][i], 0.06); }
    if (f === SH.end + 84) A.rustle(0.3, 0.5);
    if (f === SH.end + 100) A.motif(0.05, 0, 1);
  },
};
