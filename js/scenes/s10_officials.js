// Scene 10 — "Who is making this claim?" August, noon, cicadas. Two people from the prefecture.
// The arithmetic is right; the baseline is old. And then the question Kido cannot answer —
// every box has a name in it; outside the boxes there is only the doing that joins them.
import { R, piece, thread } from '../render.js';
import { stand, SHOT, SLOTS, GROUND, SIGNPOS, ST } from '../sets/stand.js';
import { puppet, armOnly, restPose, withArm, mixPose, mouthAt, blinkAt } from '../puppet.js';
import { KIDO, YOUNG, OLDER } from '../cast.js';
import { bag } from '../props.js';
import { car } from '../vehicles.js';
import { cutShape, rectPts } from '../cut.js';
import { SW, SH as SIGNH } from '../creature.js';
import { CAPS, CHAPTERS, TAGS, SUBS } from '../text.js';
import { F } from '../fonts.js';
import { ease, seg, lerp, hs, hash, boil, strHash } from '../util.js';
import { camAt, keyAt, pickAt, talking, chapterLabel, hangFromHand, fadeBlack } from '../common.js';

const caps = [
  { a: 66, b: 104, ...CAPS.s10[0] },
  { a: 112, b: 148, ...CAPS.s10[1] },
  { a: 152, b: 208, ...CAPS.s10[2] },
  { a: 212, b: 256, ...CAPS.s10[3] },
  { a: 260, b: 290, ...CAPS.s10[4] },
  { a: 294, b: 344, ...CAPS.s10[5] },
  { a: 368, b: 440, ...CAPS.s10[6] },
  { a: 454, b: 498, ...CAPS.s10[7] },
  { a: 526, b: 575, ...CAPS.s10[8] },
  { a: 586, b: 630, ...CAPS.s10[9] },
  { a: 634, b: 670, ...CAPS.s10[10] },
  { a: 674, b: 714, ...CAPS.s10[11] },
];
const PICKED = 33; // the pepper bag the young official takes up
const T = { photo: 14, pick: 40, insert: 62, talk: 100, question: 290, tags: 346, lift: 440, pen: 494, older: 516, back: 572, sign: 706 };
const LEN = 770;

const KX = 210, YX = 1480, OX = 1640;

function scene(f, cam, o = {}) {
  const yTalk = talking(caps, f, 'young'), oTalk = talking(caps, f, 'older'), kTalk = talking(caps, f, 'kido');
  const holding = f >= T.pick + 6 && f < T.back + 10;
  const writing = f >= T.pen - 40 && f < T.pen + 12;
  let yArm = [0.1, 0.2, 0];
  if (f >= T.pick && f < T.pick + 6) yArm = [lerp(0.1, 1.15, (f - T.pick) / 6), 0.3, 0];
  else if (holding) yArm = [0.75, 0.9, 0.1];
  if (f >= T.back && f < T.back + 10) yArm = [lerp(0.75, 1.15, (f - T.back) / 10), 0.3, 0];
  const camUp = f >= T.photo && f < T.photo + 22;
  const ypose = withArm({ ...restPose(), head: holding ? 0.18 : 0.04 }, 'n', camUp ? [1.35, 1.4, 0.2] : yArm, holding || camUp ? 'fist' : 'hand');
  if (writing) ypose.arms.f = [0.6, 1.5, 0.3];
  const opose = withArm({ ...restPose(), head: f >= T.older - 6 && f < T.older + 50 ? 0.28 : 0.1 }, 'n', [0.55, 1.75, 0.2], 'fist');
  const kpose = { ...restPose(), head: f >= T.question && f < T.pen ? 0.22 : 0.05 };
  const lifted = holding ? [PICKED] : [];
  stand({
    time: 'august', cam, lifted,
    back: () => car({ kind: 'pref', x: 2060, y: GROUND + 40, dir: -1 }),
    fg: () => {
      puppet(KIDO, { x: KX, ground: GROUND + 20, dir: 1, pose: kpose, face: { mouth: mouthAt(kTalk, f, 3), blink: blinkAt(f, 3), eye: f >= T.question && f < T.pen ? 'down' : 'open' } });
      const yhold = holding ? { n: hangFromHand(yArm, -1, (ctx, { L }) => bag('pepper', 0, 78, { seed: SLOTS[PICKED].seed })) } : camUp ? { n: (ctx) => { ctx.fillStyle = '#2a2a2e'; ctx.fillRect(-20, 20, 40, 26); } } : null;
      puppet(YOUNG, { x: YX, ground: GROUND + 20, dir: -1, pose: ypose, hold: yhold, holdBehind: true, face: { mouth: mouthAt(yTalk, f, 6), blink: blinkAt(f, 6), eye: holding && !yTalk ? 'down' : 'open' } });
      puppet(OLDER, { x: OX, ground: GROUND + 22, dir: -1, pose: opose, hold: { n: (ctx, { L }) => { ctx.fillStyle = '#6f8a64'; ctx.fillRect(-14, 6, 40, 56); } }, face: { mouth: mouthAt(oTalk, f, 7), blink: blinkAt(f, 7), eye: 'down' } });
      if (o.fg) o.fg();
    },
    front: () => {
      if (f === T.photo + 6 || f === T.photo + 16) {
        const ctx = R.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(255,255,250,0.55)';
        ctx.fillRect(0, 0, R.canvas.width, R.canvas.height);
        ctx.restore();
      }
      if (o.front) o.front();
    },
  });
}

// Name tags on threads — who does what — and a red thread through them all that has no tag of its own.
const TAGSH = new Map();
function tags(f, cam) {
  const t = f - T.tags, out = f - T.lift;
  if (t < 0 || out > 16) return;
  const ctx = R.ctx;
  const en = R.lang === 'en';
  const top = cam.y - 450 / cam.z - 20;
  const pos = TAGS.map((_, i) => ({ x: 150 + i * 262 + (i % 2) * 16, y: 240 + (i % 2) * 110 + hs('tgy', i) * 14 }));
  // the red thread, passing through every tag's hole
  const threadIn = ease.inOut(seg(t, 40, 64));
  const holes = [];
  TAGS.forEach((tg, i) => {
    const tt = t - i * 5;
    if (tt < 0) return;
    const fall = tt < 5 ? ease.in(tt / 5) : 1;
    const bounce = tt >= 5 ? Math.exp(-(tt - 5) * 0.25) * Math.cos((tt - 5) * 0.9) * 14 : 0;
    const rise = out > 0 ? ease.in(Math.min(1, out / 14)) * 700 : 0;
    const y = lerp(top - 100, pos[i].y, fall) - bounce - rise;
    const sway = Math.sin((f + i * 9) * 0.1) * 0.04;
    const w = 250, h = 112;
    let S = TAGSH.get(i);
    if (!S) { S = cutShape([[-w / 2 + 16, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + 16, h / 2], [-w / 2, h / 2 - 16], [-w / 2, -h / 2 + 16]], 1200 + i, { jag: 0.2, wander: 0.4 }); TAGSH.set(i, S); }
    thread(pos[i].x - 70, top, pos[i].x - 70 + sway * 20, y - 30, { color: 'rgba(250,246,236,0.7)' });
    const b = tt < 8 ? boil('tag' + i, f, 1) : [0, 0, 0];
    piece(S, {
      x: pos[i].x + b[0], y: y + b[1], r: sway + b[2], color: '#f2e8cf', tex: 'plain', lift: 26, edge: 0.4,
      print: (c) => {
        c.save();
        c.globalCompositeOperation = 'multiply';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = 'rgba(80,70,60,0.8)';
        c.font = en ? `italic 400 19px ${F.garamond}` : `400 19px ${F.mincho}`;
        c.fillText(en ? tg.enWhat : tg.what, 8, -24);
        c.fillStyle = 'rgba(24,20,18,0.95)';
        c.font = en ? `500 24px ${F.garamond}` : `700 28px ${F.mincho}`;
        c.fillText(en ? tg.enWho : tg.who, 8, 16);
        c.strokeStyle = 'rgba(80,70,60,0.4)';
        c.strokeRect(-w / 2 + 22, -h / 2 + 8, w - 30, h - 16);
        c.restore();
        c.fillStyle = 'rgba(40,30,20,0.6)';
        c.beginPath(); c.arc(-w / 2 + 12, 0, 5, 0, Math.PI * 2); c.fill();
      },
    });
    holes.push([pos[i].x + b[0] - w / 2 + 12, y + b[1]]);
  });
  if (threadIn > 0 && holes.length === TAGS.length) {
    ctx.save();
    ctx.strokeStyle = '#b8342c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(20,10,5,0.35)';
    ctx.shadowBlur = 4 * R.px;
    ctx.shadowOffsetY = 5 * R.px;
    ctx.beginPath();
    const n = Math.max(2, Math.ceil(holes.length * threadIn));
    ctx.moveTo(holes[0][0] - 160, holes[0][1] + 60);
    for (let i = 0; i < n && i < holes.length; i++) {
      const [x, y] = holes[i];
      ctx.quadraticCurveTo(x - 60, y + 70 * (i % 2 ? -1 : 1), x, y);
    }
    if (threadIn >= 1) ctx.quadraticCurveTo(holes[holes.length - 1][0] + 120, holes[holes.length - 1][1] + 80, holes[holes.length - 1][0] + 220, holes[holes.length - 1][1] - 20);
    ctx.stroke();
    ctx.restore();
  }
}

export default {
  id: 's10',
  len: LEN,
  mood: 'officials',
  beds: (f) => ({ cicada: f >= 706 ? 0.9 : 1, minmin: f >= 292 && f < 706 ? 0.2 : f >= 706 ? 0.6 : 0.8 }),
  caps,
  warm: [5, 30, 70, 120, 200, 280, 320, 380, 430, 480, 530, 600, 660, 720, 760],
  draw(f) {
    if (f >= T.insert && f < T.talk) {
      // the young official's finger on the second line of the label
      const slot = SLOTS[PICKED];
      stand({
        time: 'august', cam: { x: 1080, y: 440, z: 1.6 }, lifted: [PICKED],
        fg: () => {
          const ctx = R.ctx;
          ctx.save();
          ctx.translate(1080, 440);
          ctx.scale(7, 7);
          bag('pepper', 0, 38, { seed: slot.seed });
          ctx.restore();
          const slide = (f - T.insert) * 1.2;
          armOnly(YOUNG, { x: 1400 - slide, y: 180, s: 1.6, dir: -1, a: [0.9, 0.55, 0.3], hand: 'point' });
        },
      });
    } else if (f >= T.sign) {
      // they have stopped talking; up on the post, the sign still faces the road
      const t = f - T.sign;
      scene(f, camAt(t, [[0, { ...SHOT.wide, x: 900, z: 0.9 }], [24, { ...SHOT.wide, x: 900, z: 0.9 }], [64, { x: SIGNPOS.x + SW / 2, y: SIGNPOS.y + SIGNH * 0.45, z: 3.4 }]]));
    } else {
      const cam = f < T.insert ? camAt(f, [[0, { ...SHOT.wide, x: 880, z: 0.86 }], [T.insert, { ...SHOT.wide, x: 900, z: 0.9 }]])
        : f < T.question ? pickAt(f, [[T.talk, { x: 1100, y: 480, z: 1.3 }], [206, { x: 420, y: 470, z: 1.5 }], [290, { x: 1100, y: 480, z: 1.3 }]])
        : f < T.tags ? camAt(f, [[T.question, { x: 520, y: 450, z: 1.2 }], [T.tags, { x: 360, y: 400, z: 1.9 }]])
        : f < T.pen ? camAt(f, [[T.tags, { x: 800, y: 400, z: 0.98 }], [T.pen, { x: 800, y: 410, z: 1.02 }]])
        : pickAt(f, [[T.pen, { x: 1180, y: 470, z: 1.25 }], [T.older, { x: 1300, y: 460, z: 1.6 }], [580, { x: 900, y: 470, z: 0.95 }], [630, { x: 420, y: 470, z: 1.5 }], [670, { x: 1180, y: 480, z: 1.3 }]]);
      scene(f, cam, { front: () => tags(f, cam) });
    }
    chapterLabel(CHAPTERS.c5, f - 2, 70);
    fadeBlack(1 - ease.out(seg(f, 0, 8)));
  },
  sfx(f, A) {
    if (f === T.photo + 6 || f === T.photo + 16) A.shutter(1);
    if (f === T.pick + 4) A.crinkle(0.4, 0.7);
    if (f === 130 || f === 400 || f === 600) A.tin(0.7);
    for (let i = 0; i < 6; i++) if (f === T.tags + i * 5 + 5) { A.tap(0.4); A.bell(['F#4', 'A4', 'C#5', 'E5', 'C#5', 'A4'][i], 0.035); }
    if (f === T.lift) A.rustle(0.4, 0.5);
    if (f === T.pen - 30) A.rustle(0.2, 0.3);
    if (f === T.pen) A.knock(1);
    if (f === T.pen + 8) A.knock(0.8);
    if (f === T.older - 8) A.rustle(0.25, 0.4);
    if (f === T.back + 6) A.crinkle(0.3, 0.6);
    if (f === T.sign + 30) A.tin(0.9);
  },
};
