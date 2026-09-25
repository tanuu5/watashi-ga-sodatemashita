// Scene 4 — "No one there." Up the mountain road; the six houses, their vents moving on their own;
// inside, tomatoes, the drip's breath, a fogged pair of glasses, 2:14. The robot cart.
// The sixth house, empty and shadowless. The farmhouse: March on the calendar. Wheel tracks.
import { R, piece } from '../render.js';
import { road, ROAD_Y } from '../sets/road.js';
import { farmOutside, greenhouse, farmhouseWindow, cart, HOUSES, YARD, VP } from '../sets/farm.js';
import { puppet, armOnly, restPose, walkAlong, crouchPose, withArm, mouthAt, blinkAt, mixPose } from '../puppet.js';
import { KIDO } from '../cast.js';
import { car } from '../vehicles.js';
import { CAPS, CHAPTERS } from '../text.js';
import { ease, seg, lerp, hs, hash, clamp } from '../util.js';
import { camAt, keyAt, pickAt, talking, chapterLabel, fadeBlack } from '../common.js';

const caps = [
  { a: 238, b: 275, ...CAPS.s4[0] },
  { a: 446, b: 488, ...CAPS.s4[1] },
  { a: 494, b: 530, ...CAPS.s4[2] },
];
const SH = { road: 0, yard: 72, inside: 150, fog: 186, watch: 210, call: 226, cart: 280, pad: 330, empty: 350, house: 396, tracks: 440 };

// the vent on the first house: opens a little, stops (カタン), opens a little more
const ventAt = (t) => pickAt(t, [[0, 0.1], [18, 0.2], [30, 0.3], [44, 0.42], [58, 0.52]]);

export default {
  id: 's4',
  len: 534,
  mood: 'road',
  moodAt: (f) => (f < SH.inside ? 'road' : 'farm'),
  beds: (f) => (f < 72 ? { engine: 0.6, rev: 0.8, cicada: 0.6 } : f < 150 ? { engine: f < 96 ? 0.6 : 0, rev: 0.2, motors: 0.7, cicada: 0.5 } : f < 350 ? { motors: 0.7, cicada: 0.15 } : f < 396 ? { motors: 0.25, cicada: 0.08 } : f < 440 ? { cicada: 0.5, motors: 0.4 } : { cicada: 0.3, motors: 0.3 }),
  caps,
  warm: [4, 40, 80, 120, 160, 196, 214, 240, 300, 336, 370, 410, 460, 500],
  draw(f) {
    if (f < SH.yard) {
      const carX = lerp(2600, -1400, f / SH.yard);
      road({ time: 'july', carX, cam: { x: carX + 200, y: 520, z: 0.56 }, stands: [1700, -200], driver: (c) => driverSilhouette(c) });
      chapterLabel(CHAPTERS.c2, f - 4, 64);
      fadeBlack(1 - ease.out(seg(f, 0, 6)));
      return;
    }
    if (f < SH.inside) {
      const t = f - SH.yard;
      const cx = keyAt(t, [[0, 2900], [22, 2020]], ease.out);
      const out = t >= 30;
      const kw = walkAlong(KIDO, t, 34, 60, 1640, 1420);
      const vents = HOUSES.map((_, i) => (i === 0 ? ventAt(t) : 0.2 + (i % 3) * 0.1));
      farmOutside({
        cam: camAt(t, [[0, { x: 1200, y: 420, z: 0.62 }], [78, { x: 1120, y: 430, z: 0.66 }]]),
        vents,
        fg: () => {
          car({ kind: 'hatch', x: cx, y: YARD + 60, dir: -1, roll: -cx / 92 });
          if (out) puppet(KIDO, { x: kw.x, ground: YARD + 40, dir: -1, pose: t >= 60 ? { ...restPose(), head: -0.12 } : kw.pose, face: { blink: blinkAt(f, 3) } });
        },
      });
      return;
    }
    if (f < SH.fog) {
      const t = f - SH.inside;
      greenhouse({
        cam: camAt(t, [[0, { x: 800, y: 470, z: 1.0 }], [36, { x: 790, y: 460, z: 1.08 }]]),
        drip: 1,
        fg: () => puppet(KIDO, { x: 330, ground: 1050, s: 1.35, dir: 1, pose: { ...restPose(), head: -0.05 }, face: { blink: blinkAt(f, 3) } }),
      });
      return;
    }
    if (f < SH.watch) {
      // his glasses fog over; he takes them off and wipes them on his shirt
      const t = f - SH.fog;
      const off = t >= 8;
      const wipe = t >= 8 ? Math.sin(t * 1.4) * 0.12 : 0;
      greenhouse({
        cam: { x: 520, y: 360, z: 2.6 },
        drip: 1,
        fg: () => {
          const pose = off ? withArm({ ...restPose(), head: 0.25 }, 'n', [1.0 + wipe, 1.6, 0.2], 'fist') : { ...restPose(), head: 0.02 };
          puppet(off ? { ...KIDO, extras: { ...KIDO.extras, glasses: false } } : KIDO, {
            x: 500, ground: 900, s: 1.2, dir: 1, pose,
            colors: { lens: 'rgba(250,252,250,0.92)' },
            face: { eye: off ? 'half' : 'open', blink: t === 3 },
            hold: off ? { n: (ctx) => glassesInHand(ctx) } : null,
          });
        },
      });
      return;
    }
    if (f < SH.call) {
      watchInsert(f - SH.watch);
      return;
    }
    if (f < SH.cart) {
      // "Is anyone here?" — the film swallows it
      const t = f - SH.call;
      greenhouse({
        cam: camAt(t, [[0, { x: 800, y: 500, z: 0.92 }], [54, { x: 800, y: 480, z: 0.96 }]]),
        drip: t < 24 ? 1 - t / 24 : 0,
        fg: () => puppet(KIDO, { x: 620, ground: 920, s: 0.9, dir: 1, pose: { ...restPose(), head: -0.1 }, face: { mouth: mouthAt(talking(caps, f, 'kido'), f, 3), blink: blinkAt(f, 3) } }),
      });
      return;
    }
    if (f < SH.pad) {
      // the robot cart; he crouches beside it
      const t = f - SH.cart;
      const down = ease.inOut(seg(t, 8, 20));
      greenhouse({
        cam: camAt(t, [[0, { x: 800, y: 620, z: 1.3 }], [50, { x: 820, y: 640, z: 1.45 }]]),
        cart: true,
        fg: () => puppet(KIDO, { x: 480, ground: 900, s: 1.05, dir: 1, pose: mixPose(restPose(), crouchPose(), down), face: { blink: blinkAt(f, 3), eye: down > 0.5 ? 'down' : 'open' } }),
      });
      return;
    }
    if (f < SH.empty) {
      // close: a soft pad, a thin green streak of sap dried on it
      greenhouse({
        cam: { x: 800, y: 578, z: 6.5 },
        cart: true,
        fg: () => {
          const t = f - SH.pad;
          armOnly(KIDO, { x: 590 + t * 0.6, y: 540 - t * 0.2, s: 0.9, dir: 1, a: [1.2, 0.3, 0.3], hand: 'point' });
        },
      });
      return;
    }
    if (f < SH.house) {
      // the sixth house: nothing growing, the soil levelled; no shadow anywhere
      const t = f - SH.empty;
      const turned = t >= 22 && t < 36;
      greenhouse({
        cam: camAt(t, [[0, { x: 800, y: 480, z: 0.9 }], [46, { x: 800, y: 470, z: 0.96 }]]),
        plants: false,
        noShadow: true,
        fg: () => puppet(KIDO, { x: 800, ground: 880, s: 0.8, dir: turned ? -1 : 1, pose: { ...restPose(), head: -0.08 }, face: { blink: blinkAt(f, 3) } }),
      });
      return;
    }
    if (f < SH.tracks) {
      farmhouseWindow({ cam: camAt(f - SH.house, [[0, { x: 800, y: 460, z: 1.1 }], [44, { x: 830, y: 450, z: 1.25 }]]) });
      return;
    }
    // narrow tracks, running away down the aisle; no footprints
    greenhouse({
      cam: camAt(f - SH.tracks, [[0, { x: 800, y: 700, z: 1.2 }], [76, { x: 800, y: 660, z: 1.3 }]]),
      tracks: true,
      after: () => tracks(),
    });
  },
  sfx(f, A) {
    if (f === SH.yard + 24) { A.gravel(0.8); }
    if (f === SH.yard + 30) A.door(0.9);
    const t = f - SH.yard;
    for (const k of [18, 30, 44, 58]) if (t === k) A.clunk(0.9);
    for (const k of [6, 20, 32, 46]) if (t === k) A.whirr(0.8, 0.7);
    if (f === SH.inside) A.hiss(3.4, 1);
    if (f === SH.fog + 8) A.rustle(0.6, 0.4);
    if (f === SH.watch + 4) A.tick(0.8);
    if (f === SH.watch + 10) { A.whirr(1.2, 0.9); }
    if (f === SH.call + 30) A.clunk(0.5);
    if (f === SH.cart + 8) A.gravel(0.3);
  },
};

function driverSilhouette(c) {
  c.save();
  c.translate(-170, -330);
  c.fillStyle = 'rgba(30,30,36,0.55)';
  c.beginPath(); c.ellipse(0, 0, 36, 44, 0, 0, Math.PI * 2); c.fill();
  c.fillRect(-50, 40, 110, 80);
  c.restore();
}

function glassesInHand(ctx) {
  ctx.save();
  ctx.translate(4, 40);
  ctx.strokeStyle = '#26262c';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(250,252,250,0.7)';
  for (const dx of [-14, 12]) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(dx - 11, -7, 22, 14, 4) : ctx.rect(dx - 11, -7, 22, 14);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// 2:14 on his wristwatch.
function watchInsert(t) {
  greenhouse({
    cam: { x: 800, y: 450, z: 1.0 },
    drip: 1,
    fg: () => {
      const ctx = R.ctx;
      // the house behind, out of focus
      ctx.save();
      ctx.fillStyle = 'rgba(240,240,232,0.6)';
      ctx.fillRect(-200, -200, 2000, 1300);
      ctx.restore();
      armOnly(KIDO, { x: -40, y: 470, s: 3.4, dir: 1, a: [1.62, 0.02, 0.05], hand: 'hand' });
      ctx.save();
      ctx.translate(700, 452);
      ctx.scale(1.9, 1.9);
      ctx.fillStyle = '#3a3a3e';
      ctx.fillRect(-26, -62, 52, 124);
      ctx.fillStyle = '#c9c9c4';
      ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f7f6f0';
      ctx.beginPath(); ctx.arc(0, 0, 43, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2a2e';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.fillRect(Math.cos(a) * 36 - 1.5, Math.sin(a) * 36 - 1.5, 3, 3); }
      const hand = (a, l, w) => { ctx.save(); ctx.rotate(a); ctx.fillRect(-w / 2, -l, w, l); ctx.restore(); };
      const mins = 14;
      hand(((2 + mins / 60) / 12) * Math.PI * 2, 22, 4);
      hand((mins / 60) * Math.PI * 2, 34, 3);
      ctx.fillStyle = '#c8413a';
      hand(((24 + t * 5 / 12) / 60) * Math.PI * 2, 38, 1.2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-14, -18, 16, 8, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  });
}

// Two narrow wheel tracks pressed into the soil, running to the far end of the house.
function tracks() {
  const ctx = R.ctx;
  ctx.save();
  ctx.fillStyle = 'rgba(46,32,20,0.5)';
  for (const k of [-1, 1]) {
    ctx.beginPath();
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = Math.pow(i / 30, 1.6);
      const y = VP.y + 42 + t * 1000;
      const cx = VP.x + k * (8 + (y - VP.y) * 0.3) + Math.sin(i * 0.9) * t * 3;
      const w = 1 + t * 22;
      pts.push([cx - w / 2, y, cx + w / 2]);
    }
    pts.forEach(([x0, y], i) => (i ? ctx.lineTo(x0, y) : ctx.moveTo(x0, y)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][2], pts[i][1]);
    ctx.closePath();
    ctx.fill();
    // tread marks
    ctx.strokeStyle = 'rgba(30,20,12,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 4; i < 30; i++) {
      const [x0, y, x1] = pts[i];
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y + 2); ctx.stroke();
    }
  }
  ctx.restore();
}
