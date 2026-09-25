// puppet.js — people cut from paper, jointed like split-pin puppets, seen in profile.
// A puppet faces right in its own coordinates (dir = -1 flips it). Its origin is the hip
// joint; y grows downward. Angles are "forward" angles: 0 hangs straight down, + swings
// the limb towards the way the puppet faces. Knees bend backwards (+).
import { R, piece } from './render.js';
import { cutShape, smooth, ellipsePts } from './cut.js';
import { hs, hash, clamp, lerp, boil } from './util.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.25, wander: 0.5, step: 10, corner: 0.3, ...o });
const scalePts = (pts, k, dx = 0, dy = 0) => pts.map(([x, y]) => [x * k + dx, y * k + dy]);

// ---------------------------------------------------------------------------
// Head in profile. Units: the head's height (chin to crown) = 1. Origin: the neck pivot.
function headOutline(p = {}) {
  const { nose = 0.1, noseDrop = 0, lip = 0, chin = 0, brow = 0, back = 0, jaw = 0, crown = 0, forehead = 0 } = p;
  return [
    [-0.16, 0.08], [-0.22 - back * 0.5, -0.2], [-0.34 - back, -0.5], [-0.27 - back * 0.6, -0.84 - crown * 0.5], [-0.02, -1.0 - crown],
    [0.24 + forehead * 0.5, -0.93 - crown * 0.5], [0.36 + forehead, -0.76], [0.4 + brow, -0.63], [0.38, -0.56],
    [0.38 + nose * 0.55, -0.49 + noseDrop * 0.5], [0.38 + nose, -0.42 + noseDrop], [0.4 + nose * 0.2, -0.37],
    [0.42 + lip, -0.32], [0.395, -0.275], [0.41 + lip * 0.8, -0.235], [0.37, -0.2], [0.4 + chin, -0.13], [0.3 + chin * 0.6, -0.04 + jaw],
    [0.16, -0.06 + jaw], [0.1, 0.02], [0.06, 0.1],
  ];
}

// Hair styles, as outlines over the skull (same units).
const HAIR = {
  short: [[0.3, -0.87], [0.33, -0.95], [0.2, -1.05], [-0.06, -1.08], [-0.3, -0.94], [-0.4, -0.66], [-0.38, -0.42], [-0.26, -0.26], [-0.16, -0.3], [-0.08, -0.42], [0.04, -0.5], [0.1, -0.62], [0.12, -0.78], [0.22, -0.84]],
  bob: [[0.34, -0.8], [0.36, -0.95], [0.2, -1.08], [-0.08, -1.1], [-0.36, -0.96], [-0.46, -0.66], [-0.44, -0.3], [-0.36, -0.12], [-0.2, -0.14], [-0.14, -0.3], [-0.04, -0.46], [0.08, -0.62], [0.16, -0.76], [0.28, -0.8]],
  thin: [[0.16, -0.95], [0.02, -1.03], [-0.22, -0.98], [-0.38, -0.72], [-0.38, -0.44], [-0.26, -0.28], [-0.16, -0.32], [-0.08, -0.44], [0.0, -0.56], [0.02, -0.74], [0.08, -0.88]],
  white: [[-0.1, -0.66], [-0.3, -0.7], [-0.37, -0.5], [-0.3, -0.34], [-0.18, -0.36], [-0.12, -0.5]],
  perm: [[0.32, -0.84], [0.38, -0.98], [0.22, -1.12], [-0.08, -1.16], [-0.36, -1.02], [-0.48, -0.74], [-0.46, -0.44], [-0.34, -0.3], [-0.18, -0.34], [-0.08, -0.46], [0.06, -0.6], [0.14, -0.74], [0.26, -0.8]],
  grey: [[0.3, -0.86], [0.32, -0.96], [0.18, -1.05], [-0.08, -1.07], [-0.32, -0.92], [-0.4, -0.64], [-0.36, -0.4], [-0.24, -0.26], [-0.14, -0.32], [-0.06, -0.44], [0.06, -0.54], [0.12, -0.7], [0.22, -0.82]],
};

// ---------------------------------------------------------------------------
// Characters are specs: height, build, colours, head shape, extras.
// Built once into cut pieces (in world units, scaled by H).

const BUILT = new Map();

function build(spec) {
  const { H, seed } = spec;
  const B = { ...spec.build };
  const hh = H * (B.head ?? 0.172); // head height
  const L = {
    hh,
    torso: H * (B.torso ?? 0.3),
    neck: H * (B.neck ?? 0.016),
    ua: H * (B.ua ?? 0.19),
    fa: H * (B.fa ?? 0.155),
    hand: H * 0.072,
    th: H * (B.th ?? 0.245),
    sh: H * (B.sh ?? 0.232),
    ankle: H * 0.034,
    foot: H * 0.125,
    chest: H * (B.chest ?? 0.078),
    backW: H * (B.backW ?? 0.07),
    belly: H * (B.belly ?? 0),
    hipW: H * (B.hipW ?? 0.075),
    armW: H * (B.armW ?? 0.034),
    legW: H * (B.legW ?? 0.048),
  };
  const T = L.torso;
  const o = { jag: 0.2, wander: 0.4, step: 10, corner: 0.3 };

  // torso (shirt/jacket): from the belt line up to the shoulders
  const tpts = smooth([
    [-L.backW * 0.92, -H * 0.04], [-L.backW, -T * 0.45], [-L.backW * 1.02, -T * 0.8], [-L.backW * 0.8, -T * 0.97], [-L.backW * 0.2, -T * 1.03],
    [L.chest * 0.35, -T * 1.0], [L.chest * 0.8, -T * 0.9], [L.chest, -T * 0.7], [L.chest * 0.92 + L.belly * 0.4, -T * 0.45], [L.chest * 0.82 + L.belly, -T * 0.2],
    [L.chest * 0.8 + L.belly * 0.7, -H * 0.04],
  ], true, 4);
  // hips (trousers/skirt) from the belt line down over the tops of the thighs
  const skirt = spec.skirt;
  const hpts = skirt ? smooth([
    [-L.hipW * 1.05, -H * 0.05], [L.hipW * 1.05 + L.belly * 0.6, -H * 0.05], [L.hipW * 1.25, H * 0.1], [L.hipW * 1.35, H * 0.2], [-L.hipW * 1.3, H * 0.2], [-L.hipW * 1.2, H * 0.1],
  ], true, 4) : smooth([
    [-L.hipW, -H * 0.05], [L.hipW * 0.95 + L.belly * 0.6, -H * 0.05], [L.hipW * 1.05, H * 0.02], [L.hipW * 0.8, H * 0.07], [0, H * 0.085], [-L.hipW * 0.9, H * 0.06], [-L.hipW * 1.08, H * 0.01],
  ], true, 4);
  // limbs, drawn hanging down from their joint
  const limb = (len, w0, w1) => smooth([[-w0 / 2, -w0 * 0.3], [0, -w0 * 0.55], [w0 / 2, -w0 * 0.3], [w1 / 2, len * 0.55], [w1 / 2, len], [0, len + w1 * 0.45], [-w1 / 2, len], [-w1 / 2, len * 0.55]], true, 3);
  const ua = limb(L.ua, L.armW * 1.15, L.armW * 0.95);
  const fa = limb(L.fa, L.armW * 0.9, L.armW * 0.72);
  const th = limb(L.th, L.legW * 1.25, L.legW * 0.95);
  const sh = limb(L.sh, L.legW * 0.95, L.legW * 0.72);
  // hand: palm + fingers hanging down, thumb to the front
  const hw = L.armW * 0.85, hl = L.hand;
  const hand = smooth([[-hw * 0.5, 0], [hw * 0.55, 0], [hw * 0.9, hl * 0.35], [hw * 0.75, hl * 0.62], [hw * 0.5, hl * 0.5], [hw * 0.45, hl * 0.9], [0, hl * 1.02], [-hw * 0.5, hl * 0.86], [-hw * 0.55, hl * 0.4]], true, 3);
  const fist = smooth([[-hw * 0.55, 0], [hw * 0.6, 0], [hw * 0.75, hl * 0.4], [hw * 0.5, hl * 0.66], [-hw * 0.3, hl * 0.7], [-hw * 0.6, hl * 0.4]], true, 3);
  // shoe: from the ankle, pointing forward
  const fl = L.foot, fh = L.ankle;
  const shoe = spec.sandal
    ? smooth([[-fl * 0.24, -fh * 0.2], [fl * 0.2, -fh * 0.6], [fl * 0.62, fh * 0.2], [fl * 0.78, fh * 0.75], [fl * 0.7, fh * 1.05], [-fl * 0.22, fh * 1.05], [-fl * 0.3, fh * 0.6]], true, 3)
    : smooth([[-fl * 0.25, -fh * 0.6], [fl * 0.18, -fh * 0.55], [fl * 0.55, fh * 0.1], [fl * 0.8, fh * 0.5], [fl * 0.78, fh * 1.05], [-fl * 0.26, fh * 1.05], [-fl * 0.3, fh * 0.2]], true, 3);

  // head
  const HO = headOutline(spec.face || {});
  const head = scalePts(HO, hh);
  const hair = scalePts(HAIR[spec.hair || 'short'], hh);
  const ear = ellipsePts(hh * 0.07, hh * 0.12, 14, -hh * 0.02, -hh * 0.52);
  const neck = [[-hh * 0.15, -hh * 0.2], [hh * 0.12, -hh * 0.2], [hh * 0.14, L.neck + hh * 0.12], [-hh * 0.17, L.neck + hh * 0.12]];

  const P = {
    spec, L, H,
    torso: cs(tpts, seed + 1, o),
    hips: cs(hpts, seed + 2, o),
    ua: cs(ua, seed + 3, o),
    fa: cs(fa, seed + 4, o),
    th: cs(th, seed + 5, o),
    sh: cs(sh, seed + 6, o),
    hand: cs(hand, seed + 7, { ...o, jag: 0.15 }),
    fist: cs(fist, seed + 8, { ...o, jag: 0.15 }),
    shoe: cs(shoe, seed + 9, o),
    head: cs(smooth(head, true, 4), seed + 10, { ...o, jag: 0.12, wander: 0.25 }),
    hair: cs(smooth(hair, true, 4), seed + 11, { ...o, jag: 0.5, wander: 0.8 }),
    ear: cs(ear, seed + 12, o),
    neck: cs(neck, seed + 13, o),
    extras: {},
  };
  // extras
  const X = spec.extras || {};
  if (X.collar) P.extras.collar = cs([[-hh * 0.18, -T * 1.0], [hh * 0.02, -T * 1.05], [hh * 0.2, -T * 0.98], [hh * 0.24, -T * 0.9], [hh * 0.02, -T * 0.94], [-hh * 0.14, -T * 0.9]], seed + 20, o);
  if (X.tie) P.extras.tie = cs([[L.chest * 0.62, -T * 0.94], [L.chest * 0.92, -T * 0.94], [L.chest * 1.02, -T * 0.4], [L.chest * 0.86, -T * 0.3], [L.chest * 0.72, -T * 0.42]], seed + 21, o);
  if (X.jacket) {
    P.extras.jacket = cs(smooth([
      [-L.backW * 1.05, H * 0.03], [-L.backW * 1.08, -T * 0.45], [-L.backW * 1.1, -T * 0.82], [-L.backW * 0.85, -T * 1.0], [-L.backW * 0.2, -T * 1.06],
      [L.chest * 0.3, -T * 1.02], [L.chest * 0.6, -T * 0.72], [L.chest * 0.9, -T * 0.42], [L.chest * 1.04 + L.belly * 0.8, -T * 0.2], [L.chest * 0.95 + L.belly * 0.7, H * 0.03],
    ], true, 4), seed + 22, o);
  }
  if (X.cardigan) {
    P.extras.cardigan = cs(smooth([
      [-L.backW * 1.04, H * 0.0], [-L.backW * 1.06, -T * 0.5], [-L.backW * 1.05, -T * 0.85], [-L.backW * 0.7, -T * 1.0], [-L.backW * 0.1, -T * 1.04],
      [L.chest * 0.2, -T * 1.0], [L.chest * 0.55, -T * 0.72], [L.chest * 0.85, -T * 0.45], [L.chest * 0.95, -T * 0.15], [L.chest * 0.9, H * 0.0],
    ], true, 4), seed + 24, o);
  }
  if (X.hat) {
    // straw hat: a wide brim and a crown
    P.extras.brim = cs(smooth([[-hh * 0.72, -hh * 0.78], [-hh * 0.2, -hh * 0.9], [hh * 0.5, -hh * 0.9], [hh * 0.98, -hh * 0.78], [hh * 0.94, -hh * 0.72], [hh * 0.3, -hh * 0.8], [-hh * 0.3, -hh * 0.8], [-hh * 0.7, -hh * 0.72]], true, 4), seed + 25, o);
    P.extras.crown = cs(smooth([[-hh * 0.4, -hh * 0.82], [-hh * 0.36, -hh * 1.08], [-hh * 0.1, -hh * 1.22], [hh * 0.24, -hh * 1.2], [hh * 0.42, -hh * 1.06], [hh * 0.44, -hh * 0.84]], true, 4), seed + 26, o);
    P.extras.band = cs([[-hh * 0.4, -hh * 0.86], [hh * 0.44, -hh * 0.88], [hh * 0.43, -hh * 0.96], [-hh * 0.39, -hh * 0.96]], seed + 27, o);
  }
  if (X.towel) P.extras.towel = cs(smooth([[-hh * 0.34, -T * 1.0], [0, -T * 1.08], [hh * 0.34, -T * 1.02], [hh * 0.42, -T * 0.86], [hh * 0.3, -T * 0.6], [hh * 0.2, -T * 0.62], [hh * 0.26, -T * 0.88], [0, -T * 0.92], [-hh * 0.3, -T * 0.86]], true, 4), seed + 28, o);
  if (X.badge) {
    P.extras.lanyard = cs([[-hh * 0.02, -T * 1.0], [hh * 0.02, -T * 1.0], [L.chest * 0.82, -T * 0.52], [L.chest * 0.76, -T * 0.5]], seed + 29, { ...o, jag: 0.05 });
    P.extras.badge = cs([[L.chest * 0.55, -T * 0.52], [L.chest * 1.02, -T * 0.52], [L.chest * 1.02, -T * 0.34], [L.chest * 0.55, -T * 0.34]], seed + 30, o);
  }
  if (X.apron) P.extras.apron = cs([[L.chest * 0.4, -T * 0.7], [L.chest * 0.9, -T * 0.7], [L.chest * 1.0, H * 0.18], [L.chest * 0.2, H * 0.2]], seed + 31, o);
  if (X.armcover) P.extras.armcover = cs(limb(L.fa * 0.85, L.armW * 1.05, L.armW * 0.95), seed + 32, o);
  return P;
}

export function getPuppet(spec) {
  let P = BUILT.get(spec.id);
  if (!P) { P = build(spec); BUILT.set(spec.id, P); }
  return P;
}

// ---------------------------------------------------------------------------
// Poses

// A standing rest pose (angles in radians).
export function restPose() {
  return {
    lean: 0, head: 0,
    arms: { n: [0.06, 0.12, 0], f: [-0.04, 0.14, 0] },
    legs: { n: [0.04, 0.03, 0], f: [-0.04, 0.03, 0] },
    hands: { n: 'hand', f: 'hand' },
  };
}

// Blend two poses (angles only).
export function mixPose(a, b, t) {
  const m = (x, y) => lerp(x, y, t);
  const arr = (x, y) => x.map((v, i) => m(v, y[i]));
  return {
    ...a,
    lean: m(a.lean, b.lean), head: m(a.head, b.head),
    arms: { n: arr(a.arms.n, b.arms.n), f: arr(a.arms.f, b.arms.f) },
    legs: { n: arr(a.legs.n, b.legs.n), f: arr(a.legs.f, b.legs.f) },
    hands: t < 0.5 ? a.hands : b.hands,
  };
}

// Walk cycle. p: phase in cycles (1 = a full two-step cycle).
export function walkPose(p, o = {}) {
  const { stride = 1, arms = 1 } = o;
  const a = p * Math.PI * 2;
  const leg = (ph) => {
    const hip = 0.38 * stride * Math.sin(ph);
    const swing = Math.cos(ph) > 0; // thigh moving forward
    const knee = 0.05 + (swing ? 0.82 * Math.pow(Math.max(0, Math.cos(ph + 0.35)), 1.4) * stride : 0.06 * Math.max(0, Math.sin(ph)));
    const ank = -0.22 * Math.max(0, -Math.sin(ph)) * stride + (swing ? 0.12 : 0);
    return [hip, knee, ank];
  };
  return {
    lean: 0.05, head: 0.02,
    arms: { n: [-0.3 * arms * Math.sin(a), 0.2 + 0.18 * Math.max(0, -Math.sin(a)), 0], f: [0.3 * arms * Math.sin(a), 0.2 + 0.18 * Math.max(0, Math.sin(a)), 0] },
    legs: { n: leg(a), f: leg(a + Math.PI) },
    hands: { n: 'hand', f: 'hand' },
  };
}

// Sitting on a chair or the edge of the veranda (hip at the seat).
export function sitPose(o = {}) {
  const { knee = 1.5, hip = 1.55, lean = 0.02 } = o;
  return {
    lean, head: 0,
    arms: { n: [0.35, 1.0, 0.1], f: [0.3, 1.05, 0.1] },
    legs: { n: [hip, knee, -0.05], f: [hip - 0.06, knee - 0.08, -0.05] },
    hands: { n: 'hand', f: 'hand' },
  };
}

export function crouchPose() {
  return {
    lean: 0.62, head: 0.25,
    arms: { n: [0.95, 0.7, 0.1], f: [0.7, 0.9, 0.1] },
    legs: { n: [2.15, 2.45, -0.35], f: [1.85, 2.35, -0.25] },
    hands: { n: 'hand', f: 'hand' },
  };
}

// Where a leg ends up, relative to the hip joint (the sole's lowest point).
function legDrop(P, [hip, knee, ank]) {
  const { th, sh, ankle, foot } = P.L;
  const a1 = hip, a2 = hip - knee;
  const kx = Math.sin(a1) * th, ky = Math.cos(a1) * th;
  const ax = kx + Math.sin(a2) * sh, ay = ky + Math.cos(a2) * sh;
  const t = -(a2 + ank); // the foot's rotation
  const st = Math.sin(t), ct = Math.cos(t);
  const toe = ay + foot * 0.78 * st + ankle * 1.05 * ct;
  const heel = ay - foot * 0.26 * st + ankle * 1.05 * ct;
  return { x: ax, y: Math.max(toe, heel) };
}

// The hip height above the ground for a pose (so the lower foot stands on the floor).
export function hipHeight(spec, pose) {
  const P = getPuppet(spec);
  const n = legDrop(P, pose.legs.n), f = legDrop(P, pose.legs.f);
  return Math.max(n.y, f.y);
}

// ---------------------------------------------------------------------------
// Drawing

// o: x, y (hip joint; or ground: y of the floor, and y is computed), dir, s, pose, face {...},
//    hold: { n: (ctx) => {}, f: ... } drawn in the hand's frame, lift, f (frame for boil), tint {...}
export function puppet(spec, o = {}) {
  const P = getPuppet(spec);
  const { dir = 1, s = 1, f = R.frame, alpha = 1, still = false } = o;
  const pose = o.pose || restPose();
  const face = o.face || {};
  const C = { ...spec.colors, ...(o.colors || {}) };
  const ctx = R.ctx;
  const L = P.L;
  let y = o.y;
  if (o.ground !== undefined) y = o.ground - hipHeight(spec, pose) * s;
  const bk = still ? [0, 0, 0] : boil(spec.id, Math.floor(f / 2), 0.55);
  const tx0 = hash(spec.seed, 'tx') * 600;
  const base = { tex: 'cloth', ts: 0.7, edge: 0.22, shadowK: 0.7 };
  const far = { shade: 0.22, shadeColor: '40,34,40' };
  const X = spec.extras || {};

  ctx.save();
  ctx.translate(o.x + bk[0], y + bk[1]);
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.scale(dir * s, s);

  const T = L.torso;
  const shoulder = [L.backW * 0.1, -T * 0.9];
  const lean = pose.lean + bk[2] * 2;

  // an arm, in the torso's frame
  const arm = (which) => {
    const [a1, a2, a3] = pose.arms[which];
    const isFar = which === 'f';
    const lift = isFar ? 2 : 7;
    const sleeveCol = X.jacket ? C.jacket : X.cardigan ? C.cardigan : C.sleeve || C.shirt;
    const fx = isFar ? far : {};
    ctx.save();
    ctx.translate(shoulder[0] + (isFar ? -L.armW * 0.2 : 0), shoulder[1]);
    ctx.rotate(-a1);
    piece(P.ua, { ...base, ...fx, color: sleeveCol, lift, tx: tx0 + 10 });
    ctx.translate(0, L.ua);
    ctx.rotate(-a2);
    const bare = spec.bareForearm && !X.jacket && !X.cardigan;
    piece(P.fa, { ...base, ...fx, color: bare ? C.skin : sleeveCol, tex: bare ? 'plain' : 'cloth', lift, tx: tx0 + 50 });
    if (bare) {
      // the rolled-up cuff
      piece(P.extras.cuff || (P.extras.cuff = cs([[-L.armW * 0.64, -L.armW * 0.35], [L.armW * 0.64, -L.armW * 0.35], [L.armW * 0.6, L.armW * 0.3], [-L.armW * 0.6, L.armW * 0.3]], spec.seed + 40)), { ...base, ...fx, color: sleeveCol, lift: lift + 1 });
    } else if (X.jacket) {
      // the shirt cuff showing at the wrist
      piece(P.extras.wcuff || (P.extras.wcuff = cs([[-L.armW * 0.4, L.fa - L.armW * 0.2], [L.armW * 0.4, L.fa - L.armW * 0.2], [L.armW * 0.38, L.fa + L.armW * 0.12], [-L.armW * 0.38, L.fa + L.armW * 0.12]], spec.seed + 41)), { ...base, ...fx, color: C.shirt, tex: 'plain', lift: lift + 1 });
    }
    if (X.armcover) piece(P.extras.armcover, { ...base, ...fx, color: C.armcover, lift: lift + 1, tx: tx0 + 70 });
    ctx.translate(0, L.fa);
    ctx.rotate(-a3);
    const hk = (pose.hands && pose.hands[which]) || 'hand';
    const gloved = o.gloves && o.gloves[which];
    const info = { L, s, dir, lean };
    if (o.hold && o.hold[which] && o.holdBehind) o.hold[which](ctx, info);
    piece(hk === 'fist' ? P.fist : P.hand, { ...base, ...fx, color: gloved ? '#dcd8cc' : C.skin, tex: gloved ? 'cloth' : 'plain', lift: lift + 1, tx: tx0 + 90, print: gloved ? gloveDots : null });
    if (o.hold && o.hold[which] && !o.holdBehind) o.hold[which](ctx, info);
    ctx.restore();
  };

  // a leg, from the hip joint
  const leg = (which) => {
    const [a1, a2, a3] = pose.legs[which];
    const isFar = which === 'f';
    const lift = isFar ? 2 : 5;
    const fx = isFar ? far : {};
    ctx.save();
    ctx.translate(isFar ? -L.hipW * 0.25 : L.hipW * 0.1, 0);
    ctx.rotate(-a1);
    piece(P.th, { ...base, ...fx, color: C.pants, lift, tx: tx0 + 110 });
    ctx.translate(0, L.th);
    ctx.rotate(a2);
    piece(P.sh, { ...base, ...fx, color: spec.skirt ? C.skin : C.pants, tex: spec.skirt ? 'plain' : 'cloth', lift, tx: tx0 + 130 });
    ctx.translate(0, L.sh);
    ctx.rotate(-a3); // foot angle relative to the shin
    piece(P.shoe, { ...base, ...fx, color: C.shoes, tex: 'plain', lift: lift + 1, tx: tx0 + 150 });
    if (spec.sandal) {
      ctx.fillStyle = C.skin;
      ctx.beginPath();
      ctx.ellipse(L.foot * 0.25, -L.ankle * 0.1, L.foot * 0.3, L.ankle * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // --- back to front ---
  // the torso points up, so a forward lean turns it clockwise
  ctx.save();
  ctx.rotate(lean);
  arm('f');
  ctx.restore();
  leg('f');
  leg('n');
  piece(P.hips, { ...base, color: C.pants, lift: 4, tx: tx0 + 170, print: X.belt ? (c) => {
    c.fillStyle = C.belt || '#2a2522';
    c.fillRect(-L.hipW * 1.2, -P.H * 0.052, L.hipW * 2.6, P.H * 0.018);
  } : null });
  if (X.apron) {
    ctx.save(); ctx.rotate(lean);
    piece(P.extras.apron, { ...base, color: C.apron, lift: 5 });
    ctx.restore();
  }
  ctx.save();
  ctx.rotate(lean);
  piece(P.torso, { ...base, color: C.shirt, lift: 4, tx: tx0 + 190, print: (c) => shirtPrint(c, P, spec, C) });
  if (X.tie) piece(P.extras.tie, { ...base, color: C.tie, tex: 'plain', lift: 5 });
  if (X.cardigan) piece(P.extras.cardigan, { ...base, color: C.cardigan, tex: 'washi', lift: 5, tx: tx0 + 200 });
  if (X.jacket) piece(P.extras.jacket, { ...base, color: C.jacket, lift: 5, tx: tx0 + 210, print: (c) => {
    c.strokeStyle = 'rgba(0,0,0,0.22)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(L.chest * 0.3, -T * 1.0); c.lineTo(L.chest * 0.62, -T * 0.6); c.lineTo(L.chest * 0.78, -T * 0.1);
    c.stroke();
  } });
  if (X.collar) piece(P.extras.collar, { ...base, color: C.collar || '#f4f2ec', tex: 'plain', lift: 6 });
  if (X.badge) {
    piece(P.extras.lanyard, { ...base, color: C.lanyard || '#2e5f8a', tex: 'plain', lift: 6, edge: 0 });
    piece(P.extras.badge, { ...base, color: '#f4f1e8', tex: 'plain', lift: 7, print: (c) => {
      c.fillStyle = '#5b7a9a';
      c.fillRect(L.chest * 0.6, -T * 0.5, L.chest * 0.16, T * 0.12);
      c.fillStyle = 'rgba(40,40,50,0.6)';
      c.fillRect(L.chest * 0.8, -T * 0.48, L.chest * 0.18, 2);
      c.fillRect(L.chest * 0.8, -T * 0.44, L.chest * 0.14, 2);
    } });
  }
  if (X.towel) piece(P.extras.towel, { ...base, color: C.towel || '#eef0ee', tex: 'plain', lift: 7, print: (c) => {
    c.fillStyle = 'rgba(60,90,150,0.55)';
    c.fillRect(-L.hh * 0.4, -T * 0.97, L.hh * 0.9, 3);
    c.fillRect(-L.hh * 0.4, -T * 0.93, L.hh * 0.9, 2);
  } });

  // neck + head
  ctx.save();
  ctx.translate(L.hh * 0.02, -T - L.neck);
  piece(P.neck, { ...base, color: C.skin, tex: 'plain', lift: 3, shade: 0.12, shadeColor: '90,50,40' });
  ctx.rotate((pose.head || 0) + bk[2]);
  drawHead(ctx, P, spec, C, face, f);
  ctx.restore();
  arm('n');
  ctx.restore();
  ctx.restore();
}

function gloveDots(c) {
  c.fillStyle = 'rgba(120,120,120,0.35)';
  for (let i = 0; i < 16; i++) c.fillRect(-6 + (i % 4) * 4, 3 + Math.floor(i / 4) * 5, 1.4, 1.4);
}

function shirtPrint(c, P, spec, C) {
  const L = P.L, T = L.torso;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.strokeStyle = 'rgba(0,0,0,0.18)';
  c.lineWidth = 1.6;
  c.beginPath();
  // side seam and the line of the arm hole
  c.moveTo(-L.backW * 0.2, -T * 0.95);
  c.quadraticCurveTo(L.chest * 0.2, -T * 0.75, L.chest * 0.05, -T * 0.6);
  c.stroke();
  if (spec.extras && spec.extras.buttons) {
    c.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 4; i++) c.fillRect(L.chest * 0.84, -T * 0.82 + i * T * 0.2, 2.2, 2.2);
  }
  if (spec.extras && spec.extras.pocket) {
    c.strokeStyle = 'rgba(0,0,0,0.2)';
    c.strokeRect(L.chest * 0.3, -T * 0.72, L.chest * 0.42, T * 0.12);
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// The head: skin, ear, hair, eye, brow, mouth, glasses, hat.
function drawHead(ctx, P, spec, C, face, f) {
  const hh = P.L.hh;
  const X = spec.extras || {};
  const base = { tex: 'plain', edge: 0.2, shadowK: 0.6 };
  if (spec.hair === 'bob' || spec.hair === 'perm') piece(P.hair, { ...base, color: C.hair, tex: 'washi', ts: 0.6, lift: 4, edge: 0.12 });
  piece(P.head, { ...base, color: C.skin, lift: 5, print: (c) => facePrint(c, P, spec, C, face, f) });
  if (spec.hair !== 'bob' && spec.hair !== 'perm') piece(P.hair, { ...base, color: C.hair, tex: 'washi', ts: 0.6, lift: 6, edge: 0.15 });
  if (spec.hair === 'bob' || spec.hair === 'perm') {
    // fringe over the forehead
    piece(P.extras.fringe || (P.extras.fringe = cs(smooth([[0.34, -0.8], [0.37, -0.96], [0.18, -1.06], [0.02, -1.02], [0.1, -0.88], [0.24, -0.78]].map(([x, y]) => [x * hh, y * hh]), true, 3), spec.seed + 50)), { ...base, color: C.hair, tex: 'washi', lift: 6, edge: 0.1 });
  }
  if (spec.hair !== 'bob' && spec.hair !== 'perm') piece(P.ear, { ...base, color: C.skin, lift: 7, shade: 0.1, shadeColor: '120,60,50', print: (c) => {
    c.strokeStyle = 'rgba(110,50,40,0.4)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(-hh * 0.02, -hh * 0.52, hh * 0.045, -1.2, 1.6);
    c.stroke();
  } });
  if (X.glasses) glasses(ctx, hh, C);
  if (X.chainGlasses) glasses(ctx, hh, C, true);
  if (X.hat) {
    piece(P.extras.crown, { ...base, color: C.hat || '#d9bf7c', tex: 'straw', ts: 0.5, lift: 8 });
    piece(P.extras.band, { ...base, color: C.hatBand || '#2b2b2b', lift: 9, edge: 0 });
    piece(P.extras.brim, { ...base, color: C.hat || '#d9bf7c', tex: 'straw', ts: 0.5, lift: 9 });
  }
}

function facePrint(c, P, spec, C, face, f) {
  const hh = P.L.hh;
  const k = hh;
  const { eye = 'open', mouth = 0, brow = 0, blink = false, look = 0 } = face;
  c.save();
  // cheek warmth and the shadow of the eye socket
  c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(k * 0.22, -k * 0.36, 1, k * 0.22, -k * 0.36, k * 0.16);
  g.addColorStop(0, `rgba(210,110,100,${spec.cheek ?? 0.25})`);
  g.addColorStop(1, 'rgba(210,110,100,0)');
  c.fillStyle = g;
  c.fillRect(0, -k * 0.6, k * 0.5, k * 0.5);
  if (spec.wrinkles) {
    c.strokeStyle = 'rgba(110,60,45,0.45)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(k * 0.2, -k * 0.62); c.lineTo(k * 0.12, -k * 0.6);
    c.moveTo(k * 0.2, -k * 0.55); c.lineTo(k * 0.11, -k * 0.52);
    c.moveTo(k * 0.36, -k * 0.37); c.quadraticCurveTo(k * 0.3, -k * 0.3, k * 0.33, -k * 0.2);
    c.moveTo(k * 0.18, -k * 0.84); c.lineTo(k * 0.34, -k * 0.83);
    c.moveTo(k * 0.16, -k * 0.79); c.lineTo(k * 0.33, -k * 0.78);
    c.stroke();
  }
  if (spec.stubble) {
    c.fillStyle = 'rgba(80,80,90,0.18)';
    for (let i = 0; i < 40; i++) c.fillRect(k * (0.18 + hash(spec.seed, 'st', i) * 0.22), -k * (0.05 + hash(spec.seed, 'sy', i) * 0.25), 1.3, 1.3);
  }
  c.restore();
  // eye
  const ex = k * 0.29 + look * k * 0.02, ey = -k * 0.575;
  c.fillStyle = '#231c1c';
  c.strokeStyle = '#231c1c';
  c.lineCap = 'round';
  const shut = blink || eye === 'closed';
  if (shut) {
    c.lineWidth = Math.max(1.6, k * 0.022);
    c.beginPath();
    c.moveTo(ex - k * 0.05, ey + k * 0.005);
    c.quadraticCurveTo(ex, ey + k * 0.025, ex + k * 0.04, ey + k * 0.005);
    c.stroke();
  } else {
    const hy = eye === 'half' ? 0.55 : eye === 'wide' ? 1.25 : 1;
    const dy = eye === 'down' ? k * 0.012 : 0;
    c.beginPath();
    c.ellipse(ex, ey + dy, k * 0.032, k * 0.036 * hy, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.arc(ex + k * 0.012, ey + dy - k * 0.012 * hy, k * 0.009, 0, Math.PI * 2);
    c.fill();
    if (eye === 'half' || eye === 'down') {
      c.fillStyle = C.skin;
      c.fillRect(ex - k * 0.05, ey - k * 0.06, k * 0.1, k * (eye === 'down' ? 0.052 : 0.045));
      c.strokeStyle = '#231c1c';
      c.lineWidth = Math.max(1.2, k * 0.016);
      c.beginPath();
      c.moveTo(ex - k * 0.045, ey - k * (eye === 'down' ? 0.008 : 0.015));
      c.lineTo(ex + k * 0.04, ey - k * (eye === 'down' ? 0.004 : 0.012));
      c.stroke();
    }
  }
  // brow
  c.save();
  c.translate(k * 0.29, -k * 0.665 - brow * k * 0.03);
  c.rotate(-brow * 0.15 + (face.frown ? 0.18 : 0));
  c.fillStyle = C.brow || C.hair;
  c.fillRect(-k * 0.07, -k * 0.012, k * 0.12, k * 0.026);
  c.restore();
  // mouth
  c.fillStyle = '#4a2224';
  c.strokeStyle = 'rgba(90,40,40,0.75)';
  c.lineWidth = Math.max(1.2, k * 0.016);
  const mx = k * 0.405, my = -k * 0.265;
  if (mouth > 0) {
    c.beginPath();
    c.ellipse(mx - k * 0.015, my + k * 0.006, k * 0.028, k * (0.01 + mouth * 0.012), 0.2, 0, Math.PI * 2);
    c.fill();
  } else {
    c.beginPath();
    c.moveTo(mx + k * 0.01, my);
    c.lineTo(mx - k * (face.smile ? 0.06 : 0.05), my + (face.smile ? -k * 0.012 : 0));
    c.stroke();
  }
}

function glasses(ctx, hh, C, chain = false) {
  ctx.save();
  ctx.strokeStyle = C.glasses || '#23242a';
  ctx.lineWidth = Math.max(1.4, hh * 0.022);
  ctx.lineJoin = 'round';
  // the frame around the lens (seen a little from the front, as puppets cheat)
  const x0 = hh * 0.22, y0 = -hh * 0.625, w = hh * 0.17, h = hh * 0.1, r = hh * 0.025;
  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
  ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
  ctx.arcTo(x0, y0 + h, x0, y0, r);
  ctx.arcTo(x0, y0, x0 + w, y0, r);
  ctx.closePath();
  ctx.fillStyle = C.lens || 'rgba(210,225,235,0.22)';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x0, y0 + h * 0.3);
  ctx.lineTo(-hh * 0.02, -hh * 0.56);
  ctx.stroke();
  if (chain) {
    ctx.strokeStyle = 'rgba(200,180,120,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hh * 0.02, -hh * 0.56);
    ctx.quadraticCurveTo(-hh * 0.1, -hh * 0.1, -hh * 0.02, hh * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Just an arm, for close shots of hands: the shoulder is somewhere off the edge of the frame.
// o: x, y (shoulder), s, dir, a (angles [shoulder, elbow, wrist]), hand ('hand'|'fist'),
//    gloved, hold (fn drawing in the hand's frame), holdBehind
export function armOnly(spec, o) {
  const P = getPuppet(spec);
  const L = P.L;
  const C = spec.colors;
  const X = spec.extras || {};
  const { x, y, s = 1, dir = 1, a = [0, 0, 0], f = R.frame } = o;
  const ctx = R.ctx;
  const bk = boil(spec.id + 'arm', Math.floor(f / 2), 0.35);
  const base = { tex: 'cloth', ts: 0.7, edge: 0.22, shadowK: 0.8 };
  const sleeveCol = X.jacket ? C.jacket : X.cardigan ? C.cardigan : C.sleeve || C.shirt;
  const bare = spec.bareForearm && !X.jacket && !X.cardigan;
  ctx.save();
  ctx.translate(x + bk[0], y + bk[1]);
  ctx.scale(dir * s, s);
  ctx.rotate(-a[0] + bk[2]);
  piece(P.ua, { ...base, color: sleeveCol, lift: 8 });
  ctx.translate(0, L.ua);
  ctx.rotate(-a[1]);
  piece(P.fa, { ...base, color: bare ? C.skin : sleeveCol, tex: bare ? 'plain' : 'cloth', lift: 8 });
  if (bare) piece(P.extras.cuff || (P.extras.cuff = cs([[-L.armW * 0.64, -L.armW * 0.35], [L.armW * 0.64, -L.armW * 0.35], [L.armW * 0.6, L.armW * 0.3], [-L.armW * 0.6, L.armW * 0.3]], spec.seed + 40)), { ...base, color: sleeveCol, lift: 9 });
  ctx.translate(0, L.fa);
  ctx.rotate(-a[2]);
  if (o.hold && o.holdBehind) o.hold(ctx, { L, lean: 0 });
  piece(o.hand === 'fist' ? P.fist : P.hand, { ...base, color: o.gloved ? '#dcd8cc' : C.skin, tex: o.gloved ? 'cloth' : 'plain', lift: 10, print: o.gloved ? gloveDots : null });
  if (o.hold && !o.holdBehind) o.hold(ctx, { L, lean: 0 });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Talking: which mouth to show (on twos, a little irregular).
export const mouthAt = (on, f, seed = 0) => (on ? [2, 1, 0, 1, 2, 0][Math.floor(f / 2 + hash('m', seed, Math.floor(f / 8)) * 3) % 6] : 0);
// Blinks every few seconds.
export const blinkAt = (f, seed = 0) => {
  const period = 38 + Math.floor(hash('bl', seed) * 22);
  return (f + Math.floor(hash('bo', seed) * period)) % period === 0;
};

// ---------------------------------------------------------------------------
// Acting helpers.

// Walk from x0 to x1 between frames f0 and f1 (standing still before and after).
// Returns { x, pose, dir }. The stride follows the distance so the feet don't skate.
export function walkAlong(spec, f, f0, f1, x0, x1, o = {}) {
  const dir = x1 >= x0 ? 1 : -1;
  if (f <= f0) return { x: x0, pose: o.rest || restPose(), dir };
  if (f >= f1) return { x: x1, pose: o.rest || restPose(), dir };
  const t = (f - f0) / (f1 - f0);
  // ease in and out over the first and last step
  const e = t < 0.12 ? (t * t) / 0.24 : t > 0.88 ? 1 - ((1 - t) * (1 - t)) / 0.24 : (t - 0.06) / 0.88 * 1;
  const x = x0 + (x1 - x0) * Math.min(1, Math.max(0, e));
  const cycle = spec.H * 0.78; // one full cycle (two steps) covers this much ground
  const phase = Math.abs(x - x0) / cycle;
  const amp = Math.min(1, Math.min(t, 1 - t) * 8);
  const w = walkPose(phase, { stride: 0.4 + 0.6 * amp, arms: amp });
  return { x, pose: mixPose(o.rest || restPose(), w, Math.min(1, amp * 1.5)), dir };
}

// Set one arm's angles on a copy of a pose.
export function withArm(pose, which, a, hand) {
  const p = { ...pose, arms: { ...pose.arms, [which]: a }, hands: { ...(pose.hands || {}), [which]: hand || (pose.hands && pose.hands[which]) || 'hand' } };
  return p;
}

// Where a puppet's hand ends up in world coordinates (for placing what it holds).
export function handAt(spec, o, which = 'n') {
  const P = getPuppet(spec);
  const L = P.L;
  const pose = o.pose || restPose();
  const s = o.s || 1, dir = o.dir || 1;
  let y = o.y;
  if (o.ground !== undefined) y = o.ground - hipHeight(spec, pose) * s;
  const lean = pose.lean;
  const T = L.torso;
  // shoulder in torso frame, rotated by lean (clockwise for forward)
  const sx0 = L.backW * 0.1 + (which === 'f' ? -L.armW * 0.2 : 0), sy0 = -T * 0.9;
  const cl = Math.cos(lean), sl = Math.sin(lean);
  const sx = sx0 * cl - sy0 * sl, sy = sx0 * sl + sy0 * cl;
  const [a1, a2] = pose.arms[which];
  const d1 = lean - a1, d2 = d1 - a2; // limb directions as canvas rotations from straight down
  const ex = sx - Math.sin(d1) * L.ua, ey = sy + Math.cos(d1) * L.ua;
  const hx = ex - Math.sin(d2) * (L.fa + L.hand * 0.5), hy = ey + Math.cos(d2) * (L.fa + L.hand * 0.5);
  return { x: o.x + hx * s * dir, y: y + hy * s };
}
