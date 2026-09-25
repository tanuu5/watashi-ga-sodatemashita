// common.js — small helpers the scenes share.
import { R, piece, speaking, setCaptionIcons } from './render.js';
import { ease, seg, lerp, hs, boil, strHash, canvas } from './util.js';
import { F } from './fonts.js';

// Camera keyframes: [[frame, {x,y,z}], ...] eased between (on the frame grid).
// A key with cut: true jumps instead of moving.
export function camAt(f, keys, e = ease.inOut) {
  if (f <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i], [f1, b] = keys[i + 1];
    if (f < f1) {
      if (b.cut) return { ...a };
      const p = e(seg(f, f0, f1));
      return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), p)) };
    }
  }
  return { ...keys[keys.length - 1][1] };
}

// Which shot is on at local frame f: [[from, value], ...]
export function pickAt(f, list) {
  let v = list[0][1];
  for (const [f0, val] of list) if (f >= f0) v = val;
  return v;
}

// Keyed values for anything (numbers): [[frame, value], ...]
export function keyAt(f, keys, e = ease.inOut) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i], [f1, b] = keys[i + 1];
    if (f < f1) return lerp(a, b, e(seg(f, f0, f1)));
  }
  return keys[keys.length - 1][1];
}

// Is this speaker's line being typed right now? (mouths move while it is)
export const talking = (caps, f, who) => speaking(caps, f, who);

// ---------------------------------------------------------------------------
// Chapter label: a slip of paper that drops in at the top left, stays, and is lifted away.
const CH = new Map();
export function chapterLabel(ch, t, len = 70) {
  if (t < 0 || t > len + 3 || R.lang === 'off') return;
  const ja = R.lang !== 'en', en = R.lang !== 'ja';
  const lines = [];
  if (ja) lines.push({ text: ch.ja, font: `700 30px ${F.mincho}`, lh: 42, color: '#2b221c' });
  if (en) lines.push({ text: ch.en, font: `italic 400 ${ja ? 21 : 28}px ${F.garamond}`, lh: ja ? 30 : 38, color: ja ? '#5a4a3e' : '#2b221c' });
  const key = R.lang + ch.ja;
  let S = CH.get(key);
  if (!S) {
    const m = canvas(4, 4).getContext('2d');
    let w = 0, h = 0;
    for (const l of lines) { m.font = l.font; w = Math.max(w, m.measureText(l.text).width); h += l.lh; }
    w += 56; h += 30;
    const seed = strHash(key) & 0xffff;
    const p = new Path2D();
    const pts = [];
    for (let i = 0; i <= 10; i++) pts.push([(w * i) / 10, hs(seed, i) * 1.2]);
    for (let i = 1; i <= 3; i++) pts.push([w + hs(seed, 'r', i) * 2.5, (h * i) / 3]);
    for (let i = 9; i >= 0; i--) pts.push([(w * i) / 10, h + hs(seed, 'b', i) * 1.2]);
    for (let i = 2; i >= 1; i--) pts.push([hs(seed, 'l', i) * 2.5, (h * i) / 3]);
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    p.closePath();
    S = { path: p, w, h };
    CH.set(key, S);
  }
  const ctx = R.ctx;
  ctx.save();
  ctx.setTransform(R.k, 0, 0, R.k, 0, 0);
  const sv = R.shade, px = R.px, sl = R.light;
  R.shade = 1;
  R.px = R.k;
  R.light = { x: 0.45, y: 0.8 };
  let dy = 0, lift = 4;
  if (t < 3) { dy = [-22, -8, -2][t]; lift = [26, 12, 5][t]; }
  const out = t - len;
  if (out > 0) { dy = [-14, -40, -80][out - 1] || -80; lift = [16, 36, 60][out - 1] || 60; }
  const b = boil('ch' + ch.ja, R.frame, 0.4);
  const typed = Math.max(0, (t - 2) * 1.5);
  piece(S, {
    x: 40 + b[0], y: 34 + dy + b[1], r: -0.012 + b[2], lift, color: '#efe6d2', tex: 'plain', tx: 300, ty: 120, edge: 0.3,
    print: (c) => {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.textBaseline = 'middle';
      let y = 15, budget = typed;
      for (const l of lines) {
        c.font = l.font;
        c.fillStyle = l.color;
        const chars = [...l.text];
        const n = Math.max(0, Math.min(chars.length, Math.floor(budget)));
        budget -= chars.length;
        if (n) c.fillText(chars.slice(0, n).join(''), 28, y + l.lh / 2);
        y += l.lh;
      }
      c.fillStyle = 'rgba(176,86,60,0.55)';
      c.fillRect(14, 12, 2, S.h - 24);
      c.restore();
    },
  });
  R.shade = sv;
  R.px = px;
  R.light = sl;
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Caption icons, one per speaker.
setCaptionIcons({
  kido(c, x, y) {
    // a pair of glasses
    c.save();
    c.translate(x, y);
    c.strokeStyle = '#2a2d33';
    c.lineWidth = 2.2;
    c.beginPath();
    c.roundRect ? c.roundRect(-15, -5, 12, 9, 3) : c.rect(-15, -5, 12, 9);
    c.moveTo(3, -1);
    c.roundRect ? c.roundRect(3, -5, 12, 9, 3) : c.rect(3, -5, 12, 9);
    c.moveTo(-3, -2); c.quadraticCurveTo(0, -5, 3, -2);
    c.stroke();
    c.restore();
  },
  anzai(c, x, y) {
    // a paper clip
    c.save();
    c.translate(x, y);
    c.rotate(0.5);
    c.strokeStyle = '#6a7078';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-3, 10); c.lineTo(-3, -8); c.arc(0, -8, 3, Math.PI, 0); c.lineTo(3, 12); c.arc(-1, 12, 4, 0, Math.PI); c.lineTo(-5, -10);
    c.stroke();
    c.restore();
  },
  shino(c, x, y) {
    // a coin
    c.save();
    c.translate(x, y);
    c.fillStyle = '#b7a26a';
    c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(80,60,20,0.6)';
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(80,60,20,0.7)';
    c.font = `700 9px ${F.mincho}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('円', 0, 0.5);
    c.restore();
  },
  kado(c, x, y) {
    // a straw hat
    c.save();
    c.translate(x, y + 2);
    c.fillStyle = '#d4b56c';
    c.beginPath(); c.ellipse(0, 3, 15, 4.5, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(0, -2, 8, 7, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#2d2a28';
    c.fillRect(-8, -1, 16, 2.4);
    c.restore();
  },
  son(c, x, y) {
    // a telephone handset
    c.save();
    c.translate(x, y);
    c.rotate(-0.6);
    c.fillStyle = '#3a3a3e';
    c.fillRect(-3, -9, 6, 18);
    c.beginPath(); c.ellipse(0, -10, 6, 3.5, 0, 0, Math.PI * 2); c.ellipse(0, 10, 6, 3.5, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  },
  young(c, x, y) {
    // a clipboard
    c.save();
    c.translate(x, y);
    c.fillStyle = '#9a7a52';
    c.fillRect(-8, -11, 16, 22);
    c.fillStyle = '#f4f2ea';
    c.fillRect(-6, -7, 12, 16);
    c.fillStyle = '#6a6a70';
    c.fillRect(-4, -13, 8, 4);
    c.fillStyle = 'rgba(40,40,50,0.5)';
    for (let i = 0; i < 4; i++) c.fillRect(-4, -4 + i * 3.4, 8, 1);
    c.restore();
  },
  older(c, x, y) {
    // a document folder
    c.save();
    c.translate(x, y);
    c.fillStyle = '#6f8a64';
    c.fillRect(-10, -9, 20, 18);
    c.fillStyle = '#e9e5d6';
    c.fillRect(-8, -11, 15, 4);
    c.restore();
  },
});

export { R };

// A fade to (or from) black: the exposure going down between shots. a 0..1.
export function fadeBlack(a, color = '8,7,11') {
  if (a <= 0) return;
  const ctx = R.ctx;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(${color},${Math.min(1, a)})`;
  ctx.fillRect(0, 0, R.canvas.width, R.canvas.height);
  ctx.restore();
}

// Hold something in a puppet's hand so it hangs straight down whatever the arm is doing.
// angles: the arm's [shoulder, elbow, wrist]; dir: the puppet's facing.
// fn draws with (0, 0) at the middle of the fist, "down" pointing down.
export function hangFromHand(angles, dir, fn) {
  return (ctx, info) => {
    ctx.save();
    ctx.translate(0, info.L.hand * 0.5);
    ctx.rotate(angles[0] + angles[1] + angles[2] - (info.lean || 0));
    if (dir < 0) ctx.scale(-1, 1);
    fn(ctx, info);
    ctx.restore();
  };
}
