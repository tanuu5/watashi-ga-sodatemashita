// title.js — the title, cut letter by letter and lowered on threads.
import { R, sprite, letterSprite, thread } from './render.js';
import { label } from './label.js';
import { TITLE } from './text.js';
import { F } from './fonts.js';
import { ease, lerp, hs, boil } from './util.js';

const LS = {};
function letters(tone = 'light') {
  return (LS[tone] ||= [...TITLE.ja].map((ch, i) =>
    letterSprite(ch, {
      font: `900 124px ${F.mincho}`,
      color: tone === 'dark' ? '#3b3a30' : '#f1e9d6',
      tex: i % 2 ? 'tate' : 'washi', seed: 40 + i, ts: 0.7, grow: 3,
    })));
}

// one row: 私が育てました
export function titleLayout(cx, cy, scale = 1, tone = 'light') {
  const sp = letters(tone);
  const widths = sp.map((s) => s.w * 0.8 * scale);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  return sp.map((s, i) => {
    const p = { x: x + widths[i] / 2, y: cy + hs('ty', i) * 10 * scale + (i % 2 ? 6 : -4) * scale };
    x += widths[i];
    return p;
  });
}

// A letter hung on a thread: dropped in, bounces on the thread, settles and sways.
export function hangingTitle(f, start, o = {}) {
  const { cx = 800, cy = 300, scale = 1, top = -40, alpha = 1, tone = 'light', gap = 4, lift = 18 } = o;
  const sp = letters(tone);
  const pos = titleLayout(cx, cy, scale, tone);
  sp.forEach((s, i) => {
    const t = f - start - i * gap;
    if (t < 0) return;
    const { x, y } = pos[i];
    const fall = t < 5 ? ease.in(t / 5) : 1;
    const bounce = t >= 5 ? Math.exp(-(t - 5) * 0.22) * Math.cos((t - 5) * 0.9) * 18 * scale : 0;
    const yy = lerp(top - 60, y, fall) - bounce;
    const sway = Math.sin((f + i * 7) * 0.12) * 0.03 + (t < 20 ? hs('sw', i, t) * 0.035 : 0);
    const b = t < 8 ? boil('tl' + i, f, 1.2) : [0, 0, 0];
    const topY = yy - s.h * 0.34 * scale;
    thread(x + b[0], top, x + b[0] + sway * 20, topY, { alpha, color: 'rgba(250,246,236,0.6)' });
    sprite(s, { x: x + b[0], y: yy + b[1], r: sway + b[2], s: scale * 0.9, lift, alpha });
  });
}

// The label under the title: the English title and the credit.
export function titleLabel(f, t, o = {}) {
  const { x = 800, y = 640, credit = false } = o;
  const ja = R.lang !== 'en';
  const lines = [{ text: TITLE.en, font: `italic 400 34px ${F.garamond}`, lh: 44, color: '#2b221c' }];
  if (credit) {
    lines.push(ja ? { text: '原作　たぬ「私が育てました」', font: `600 20px ${F.hand}`, lh: 32, color: '#5a4a3e' } : { text: 'from a short story by Tanu', font: `italic 400 21px ${F.garamond}`, lh: 30, color: '#5a4a3e' });
    lines.push({ text: 'made one frame at a time by Claude', font: `italic 400 19px ${F.garamond}`, lh: 28, color: '#6a5a4e' });
  } else {
    lines.push(ja ? { text: TITLE.tagJa, font: `600 22px ${F.hand}`, lh: 34, color: '#5a4a3e' } : { text: TITLE.tagEn, font: `italic 400 22px ${F.garamond}`, lh: 32, color: '#5a4a3e' });
  }
  label({ x, y, t, cps: 1.7, r: -0.012, lines });
}
