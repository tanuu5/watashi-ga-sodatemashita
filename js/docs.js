// docs.js — the paper of the case: the box of effects, passbooks, the inventory form,
// the calculator, the operation log, memos. Seen from above, on Kido's desk.
import { R, piece, stillPiece, cello } from './render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from './cut.js';
import { hash, hs, rng, lerp, clamp, mixHex } from './util.js';
import { F } from './fonts.js';
import { sheet, sheetShape, printLines, ruled, handwrite } from './sets/desk.js';
import { FORM, PASSBOOK, LOG, WALLET, MEMO, PATHS, LABELS } from './text.js';
import { labelPrint, LW, LH } from './props.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.2, wander: 0.4, step: 12, corner: 0.3, ...o });
const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };

// ---------------------------------------------------------------------------
// The cardboard box of the company's effects, flaps open.
export function cardboardBox(x, y, o = {}) {
  const S = memo('cbox', () => ({
    floor: cs(rectPts(560, 400, 0, 0), 5000, { jag: 0.3 }),
    rim: cs([[-300, -220], [300, -220], [300, 220], [-300, 220], [-300, -220], [-280, -200], [-280, 200], [280, 200], [280, -200], [-280, -200]], 5001, { jag: 0.2 }),
    flapT: cs([[-280, -210], [280, -210], [300, -330], [-290, -340]], 5002, { jag: 0.4 }),
    flapB: cs([[-280, 210], [280, 210], [296, 320], [-292, 330]], 5003, { jag: 0.4 }),
    flapL: cs([[-290, -200], [-290, 200], [-430, 214], [-420, -214]], 5004, { jag: 0.4 }),
    flapR: cs([[290, -200], [290, 200], [428, 210], [424, -220]], 5005, { jag: 0.4 }),
  }));
  const { r = 0, contents = null, lift = 4 } = o;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  const kraft = { tex: 'washi', ts: 0.7, edge: 0.35 };
  piece(S.flapT, { ...kraft, color: '#c9a578', lift: lift + 1 });
  piece(S.flapB, { ...kraft, color: '#c29d70', lift: lift + 1 });
  piece(S.flapL, { ...kraft, color: '#bf996a', lift: lift + 1 });
  piece(S.flapR, { ...kraft, color: '#c7a274', lift: lift + 1 });
  piece(S.floor, { ...kraft, color: '#9a7a52', lift: lift, shade: 0.25, shadeColor: '60,40,20' });
  if (contents) contents(ctx);
  // the inside walls, seen from above: a darker band round the floor
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = 'rgba(80,55,30,0.45)';
  ctx.lineWidth = 26;
  ctx.strokeRect(-267, -187, 534, 374);
  ctx.restore();
  piece(S.rim, { ...kraft, color: '#caa679', lift: lift + 2 });
  ctx.restore();
}

export function sealStamp(x, y, r = 0, o = {}) {
  const S = memo('seal', () => ({ body: cs(smooth([[-14, -58], [14, -58], [15, 54], [0, 60], [-15, 54]], true, 3), 5010, { jag: 0.05, wander: 0.1 }), end: disc(14, 5011) }));
  const { color = '#1f1c1c', lift = 8 } = o;
  piece(S.body, { x, y, r, color, tex: 'plain', lift, edge: 0.6, print: (c) => { c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-9, -52, 4, 100); } });
  piece(S.end, { x: x + Math.sin(-r) * -58, y: y + Math.cos(r) * -58, color: '#b8342c', tex: 'plain', lift: lift + 1, edge: 0.3 });
}

export function keyShape(x, y, r = 0, o = {}) {
  const S = memo('key' + (o.kind || 0), () => cs(smooth([[-26, -20], [0, -34], [26, -20], [26, 8], [8, 14], [6, 110], [-4, 118], [-4, 100], [-12, 96], [-4, 88], [-12, 82], [-4, 74], [-6, 14], [-26, 8]], true, 2), 5020 + (o.kind || 0), { jag: 0.05, wander: 0.1 }));
  piece(S, { x, y, r, color: o.color || '#b8b39c', tex: 'plain', lift: o.lift || 6, edge: 0.7, print: (c) => { c.fillStyle = 'rgba(40,40,40,0.5)'; c.beginPath(); c.arc(0, -14, 7, 0, Math.PI * 2); c.fill(); } });
}

export function parkingCard(x, y, r = 0, o = {}) {
  sheet(172, 108, x, y, {
    r, seed: 21, color: '#e9eef2', lift: o.lift || 5, print: (c) => {
      c.fillStyle = '#3f6aa0';
      c.fillRect(-86, -54, 172, 26);
      printLines(c, ['月極駐車場　利用者カード'], -76, -41, { font: `700 12px ${F.mono}`, color: 'rgba(255,255,255,0.95)' });
      printLines(c, ['区画　No.14', '有効期限　3月31日'], -76, -8, { font: `400 12px ${F.mono}`, lh: 20 });
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.strokeStyle = 'rgba(190,40,40,0.8)';
      c.lineWidth = 2;
      c.strokeRect(22, 6, 56, 30);
      c.restore();
      printLines(c, ['期限切'], 50, 21, { font: `700 12px ${F.mincho}`, color: 'rgba(190,40,40,0.85)', align: 'center' });
    },
  });
}

// A passbook: closed, or open at its last pages.
export function passbook(x, y, o = {}) {
  const { r = 0, open = false, seed = 1, color = '#2f6a58', rows = PASSBOOK.rows, from = 0, lift = 4, hi = -1 } = o;
  if (!open) {
    sheet(180, 280, x, y, {
      r, seed: 30 + seed, color, lift, print: (c) => {
        printLines(c, ['普通預金通帳'], 0, -80, { font: `700 18px ${F.mincho}`, color: 'rgba(255,250,235,0.92)', align: 'center' });
        printLines(c, ['Fファーム株式会社　様'], 0, 60, { font: `400 12px ${F.mincho}`, color: 'rgba(255,250,235,0.85)', align: 'center' });
        c.fillStyle = 'rgba(255,250,235,0.7)';
        c.fillRect(-60, 96, 120, 2);
      },
    });
    return;
  }
  // open: two pages side by side
  const pw = 330, ph = 280;
  for (const side of [-1, 1]) {
    sheet(pw, ph, x + side * (pw / 2 + 2), y, {
      r, seed: 40 + seed + side, color: '#f3f1e8', lift, print: (c) => {
        const col = [-pw / 2 + 12, -pw / 2 + 62, -pw / 2 + 196, -pw / 2 + 262];
        ruled(c, -pw / 2 + 8, -ph / 2 + 30, pw / 2 - 8, ph / 2 - 10, 9, col.slice(1).map((v) => v - 6), { color: 'rgba(60,110,100,0.35)', width: 1 });
        printLines(c, PASSBOOK.head, -pw / 2 + 12, -ph / 2 + 20, { font: `400 10px ${F.mono}`, color: 'rgba(60,110,100,0.8)', lh: 0 });
        c.save();
        c.globalCompositeOperation = 'multiply';
        c.font = `400 12.5px ${F.mono}`;
        c.fillStyle = 'rgba(30,30,40,0.82)';
        c.textBaseline = 'middle';
        const start = from + (side > 0 ? 8 : 0);
        for (let i = 0; i < 8; i++) {
          const row = rows[start + i];
          if (!row) break;
          const yy = -ph / 2 + 45 + i * 26.5;
          if (start + i === hi) { c.fillStyle = 'rgba(255,220,120,0.55)'; c.fillRect(-pw / 2 + 8, yy - 12, pw - 16, 24); c.fillStyle = 'rgba(30,30,40,0.82)'; }
          c.textAlign = 'left';
          c.fillText(row[0], col[0], yy);
          c.fillText(row[1], col[1], yy);
          c.textAlign = 'right';
          if (row[2]) c.fillText(row[2], col[3] - 10, yy);
          if (row[3]) c.fillText(row[3], pw / 2 - 12, yy);
        }
        c.restore();
      },
    });
  }
}

// 財産目録: the court's inventory form. o.fill: how many of its value cells are written in (0..1).
export function inventoryForm(x, y, o = {}) {
  const { r = 0, fill = 0, lift = 3, key = null } = o;
  const w = 420, h = 594;
  sheet(w, h, x, y, {
    r, seed: 60, color: '#f8f6ef', lift, key, print: (c) => {
      printLines(c, [FORM.title], 0, -h / 2 + 50, { font: `700 26px ${F.mincho}`, align: 'center', color: 'rgba(20,20,26,0.9)' });
      printLines(c, [FORM.case], -w / 2 + 30, -h / 2 + 92, { font: `400 10px ${F.mincho}`, color: 'rgba(20,20,26,0.8)' });
      const x0 = -w / 2 + 26, x1 = w / 2 - 26, y0 = -h / 2 + 116, rowH = 50;
      const cols = [x0 + 34, x0 + 132, x0 + 250, x0 + 318];
      ruled(c, x0, y0, x1, y0 + rowH * (FORM.rows.length + 1), FORM.rows.length + 1, cols, { color: 'rgba(20,20,26,0.6)', width: 1.1 });
      const cx = [x0 + 17, x0 + 83, x0 + 191, x0 + 284, x0 + 342];
      FORM.head.forEach((t, i) => printLines(c, [t], cx[i], y0 + rowH / 2, { font: `700 10.5px ${F.mincho}`, align: 'center', color: 'rgba(20,20,26,0.85)' }));
      FORM.rows.forEach((row, j) => {
        const yy = y0 + rowH * (j + 1.5);
        printLines(c, [row[0]], cx[0], yy, { font: `400 11px ${F.mincho}`, align: 'center' });
        printLines(c, [row[1]], x0 + 40, yy, { font: `400 11px ${F.mincho}` });
      });
      // what has been written in by hand so far
      const cells = FORM.filled.length * 3;
      const n = Math.floor(fill * cells + 0.0001);
      let k = 0;
      FORM.filled.forEach((row, j) => {
        const yy = y0 + rowH * (j + 1.5);
        for (const [ci, align] of [[2, 'left'], [3, 'right'], [4, 'left']]) {
          if (k++ >= n) continue;
          const t = row[ci];
          if (!t) continue;
          const px = ci === 2 ? x0 + 138 : ci === 3 ? x0 + 312 : x0 + 322;
          c.save();
          c.textAlign = align;
          handwrite(c, t, align === 'right' ? px - c.measureText(t).width * 1.2 : px, yy, ci === 4 ? 9 : 11, Infinity, { weight: 0.3 });
          c.restore();
        }
      });
    },
  });
}

// The calculator. o.display: what it shows.
export function calculator(x, y, o = {}) {
  const S = memo('calc', () => ({ body: cs(smooth([[-90, -160], [90, -160], [94, 150], [0, 164], [-94, 150]], true, 2), 5100, { jag: 0.1, wander: 0.2 }) }));
  const { r = 0, display = '0', pressed = -1, lift = 6 } = o;
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(r);
  piece(S.body, { color: '#3b3d44', tex: 'plain', lift, edge: 0.4, print: (c) => {
    c.fillStyle = '#b8c2a4';
    c.fillRect(-72, -140, 144, 56);
    c.fillStyle = 'rgba(30,36,24,0.9)';
    c.font = `400 26px ${F.mono}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText(display, 66, -110);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
      const k = j * 4 + i;
      c.fillStyle = k === pressed ? '#9a9da6' : i === 3 ? '#c9803e' : '#d8d9dc';
      c.fillRect(-72 + i * 38, -64 + j * 42, 30, 32);
    }
  } });
  ctx.restore();
}

// An index card with a few lines on it (the wallet, drawn out as a diagram).
export function card(x, y, w, h, lines, o = {}) {
  const { r = 0, color = '#fbf9f1', seed = 1, lift = 4, head = null, headColor = '#3f6aa0', font = F.mincho, size = 16 } = o;
  sheet(w, h, x, y, {
    r, seed: 70 + seed, color, lift, print: (c) => {
      if (head) { c.fillStyle = headColor; c.fillRect(-w / 2, -h / 2, w, 10); }
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.strokeStyle = 'rgba(120,150,190,0.4)';
      c.lineWidth = 1;
      for (let yy = -h / 2 + 30; yy < h / 2; yy += 24) { c.beginPath(); c.moveTo(-w / 2 + 6, yy); c.lineTo(w / 2 - 6, yy); c.stroke(); }
      c.restore();
      lines.forEach((l, i) => printLines(c, [l.text || l], 0, (i - (lines.length - 1) / 2) * (size * 1.5), { font: `${l.bold ? 700 : 400} ${l.size || size}px ${font}`, align: 'center', color: l.color || 'rgba(24,24,30,0.9)' }));
    },
  });
}

// A thread of red wool laid between points (for diagrams on the desk).
export function wool(pts, o = {}) {
  const { color = '#b8342c', width = 3.2, n = 1 } = o;
  const ctx = R.ctx;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(20,10,5,0.35)';
  ctx.shadowBlur = 3 * R.px;
  ctx.shadowOffsetX = 2 * R.px;
  ctx.shadowOffsetY = 3 * R.px;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px + hs('wl', i) * 2, py + hs('wm', i) * 2) : ctx.moveTo(px, py)));
  ctx.stroke();
  ctx.restore();
}

// A memo slip with handwriting (n characters written).
export function memoSlip(x, y, lines, o = {}) {
  const { r = 0, n = Infinity, w = 400, h = 150, seed = 1, size = 22, lift = 3 } = o;
  sheet(w, h, x, y, {
    r, seed: 80 + seed, color: '#fbf8ea', lift, print: (c) => {
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.strokeStyle = 'rgba(120,150,190,0.35)';
      c.lineWidth = 1;
      for (let yy = -h / 2 + 34; yy < h / 2; yy += 34) { c.beginPath(); c.moveTo(-w / 2, yy); c.lineTo(w / 2, yy); c.stroke(); }
      c.restore();
      let left = n;
      lines.forEach((l, i) => {
        handwrite(c, l, -w / 2 + 22, -h / 2 + 30 + i * 34 + (l.dy || 0), size, left);
        left -= [...l].length;
      });
    },
  });
}

// The operation log, one page of a thick binder. kind: 'auto' | 'feb' | 'last'
export function logPage(x, y, o = {}) {
  const { r = 0, kind = 'auto', seed = 1, lift = 3, hi = false } = o;
  const w = 600, h = 420;
  const rr = rng(900 + seed);
  sheet(w, h, x, y, {
    r, seed: 90 + seed, color: '#f7f6f1', lift, print: (c) => {
      printLines(c, [LOG.head + '　p.' + (40 + seed)], -w / 2 + 24, -h / 2 + 24, { font: `400 11px ${F.mono}`, color: 'rgba(40,40,48,0.6)' });
      const lines = [];
      let mo = kind === 'last' ? 3 : kind === 'feb' ? 2 : 1 + (seed % 3), dd = 1 + (seed * 3) % 20, mm = 6 * 60;
      for (let i = 0; i < 15; i++) {
        mm += 20 + Math.floor(rr() * 70);
        if (mm > 23 * 60) { mm -= 18 * 60; dd++; }
        const pad = (v) => String(v).padStart(2, '0');
        lines.push(`${pad(mo)}-${pad(dd)} ${pad(Math.floor(mm / 60))}:${pad(mm % 60)}　自動　${LOG.acts[Math.floor(rr() * LOG.acts.length)]}　${LOG.params[Math.floor(rr() * LOG.params.length)]}`);
      }
      if (kind === 'feb') lines.splice(7, 1, `${LOG.feb.t}　${LOG.feb.who}　${LOG.feb.text}`);
      if (kind === 'last') {
        lines.length = 9;
      }
      c.save();
      c.globalCompositeOperation = 'multiply';
      c.font = `400 13px ${F.mono}`;
      c.textBaseline = 'middle';
      lines.forEach((l, i) => {
        const human = kind === 'feb' && i === 7;
        if (human && hi) { c.fillStyle = 'rgba(255,220,120,0.5)'; c.fillRect(-w / 2 + 18, -h / 2 + 52 + i * 24 - 11, w - 36, 22); }
        c.fillStyle = human ? 'rgba(20,20,30,0.95)' : 'rgba(50,52,62,0.62)';
        c.fillText(l, -w / 2 + 24, -h / 2 + 52 + i * 24);
      });
      if (kind === 'last') {
        const y0 = -h / 2 + 52 + 9 * 24;
        c.fillStyle = 'rgba(20,20,30,0.95)';
        c.fillText(`${LOG.last.t}　入力　${LOG.last.src}`, -w / 2 + 24, y0);
        c.fillStyle = 'rgba(50,52,62,0.8)';
        c.fillText(`　　　　　　　　${LOG.last.net}`, -w / 2 + 24, y0 + 24);
        c.fillStyle = 'rgba(20,20,30,0.95)';
        c.fillText(`　　注記　${LOG.last.lines[0]}`, -w / 2 + 24, y0 + 56);
        c.fillText(`　　　　　${LOG.last.lines[1]}`, -w / 2 + 24, y0 + 80);
        c.fillStyle = 'rgba(50,52,62,0.35)';
        c.fillText('（以降、自動入力のみ）', -w / 2 + 24, y0 + 120);
      }
      c.restore();
      // punch holes
      c.fillStyle = 'rgba(60,50,40,0.5)';
      for (const yy of [-120, 120]) { c.beginPath(); c.arc(-w / 2 + 12, yy, 7, 0, Math.PI * 2); c.fill(); }
    },
  });
}

// The binder the log came in: a hard cover under the page, two rings.
export function binder(x, y, o = {}) {
  const { r = 0, lift = 3 } = o;
  sheet(650, 470, x, y, { r, seed: 99, color: '#2f3e5a', tex: 'cloth', lift, print: (c) => {
    c.fillStyle = 'rgba(200,200,210,0.5)';
    c.fillRect(-325, -235, 40, 470);
  } });
}

// A paperweight (brass).
export function weight(x, y) {
  const S = memo('weight', () => cs(smooth([[-50, -18], [50, -18], [56, 18], [-56, 18]], true, 2), 5200, { jag: 0.05 }));
  piece(S, { x, y, color: '#a8894a', tex: 'plain', lift: 14, edge: 0.7 });
}

// The receipt Shinoda left: folded paper with a price label stuck to it.
export function receipt(x, y, o = {}) {
  const { r = 0 } = o;
  sheet(150, 240, x, y, { r, seed: 110, color: '#f4f2ea', lift: 4, print: (c) => {
    printLines(c, ['領収証', '', '　　　　', ''], -60, -90, { font: `400 12px ${F.mono}`, color: 'rgba(40,40,48,0.5)' });
    c.strokeStyle = 'rgba(0,0,0,0.12)';
    c.beginPath(); c.moveTo(-75, 0); c.lineTo(75, 0); c.stroke();
  } });
  const ctx = R.ctx;
  ctx.save();
  ctx.translate(x - 10, y + 20);
  ctx.rotate(r + 0.05);
  ctx.scale(2.6, 2.6);
  const S = memo('rlabel', () => cs([[0, 0], [LW, 0], [LW, LH], [0, LH]], 5300, { jag: 0.05, wander: 0.1 }));
  piece(S, { x: -LW / 2, y: -LH / 2, color: '#f9f8f2', tex: 'plain', ts: 0.2, lift: 2, edge: 0.3, print: (c) => labelPrint(c, 'tomato') });
  ctx.restore();
}

// The three roads, and the questions written small beside them. n: characters of the questions written so far.
export function pathsSheet(x, y, o = {}) {
  const { r = 0, n = 0, vals = 1, lift = 3 } = o;
  const w = 420, h = 594;
  sheet(w, h, x, y, { r, seed: 120, color: '#fbfaf4', lift, print: (c) => {
    const x0 = -w / 2 + 40, y0 = -h / 2 + 90;
    ruled(c, x0 + 90, y0, w / 2 - 30, y0 + 3 * 80 + 40, 1, [x0 + 180, x0 + 270], { color: 'rgba(30,34,52,0)' });
    handwrite(c, '　　　　' + PATHS.cols.join('　　'), x0 + 60, y0 + 10, 16, Infinity, { weight: 0.3 });
    PATHS.rows.forEach((row, i) => {
      const yy = y0 + 70 + i * 90;
      handwrite(c, row.name, x0, yy, 24, Infinity);
      if (vals > i) row.vals.forEach((v, j) => handwrite(c, v, x0 + 100 + j * 90, yy, 14, Infinity, { weight: 0.2 }));
    });
    // in the margin, much smaller
    let left = n;
    PATHS.rows.forEach((row, i) => {
      handwrite(c, row.q, x0 + 10, y0 + 70 + i * 90 + 32, 11, left, { weight: 0.15, color: 'rgba(28,34,52,0.75)' });
      left -= [...row.q].length;
    });
  } });
}

// The case file (a card folder with a label on its spine edge).
export function caseFile(x, y, o = {}) {
  const { r = 0, open = 0, lift = 3 } = o;
  sheet(460, 620, x, y, { r, seed: 130, color: '#d9c7a0', tex: 'washi', lift, print: (c) => {
    printLines(c, ['事件記録'], 0, -200, { font: `700 30px ${F.mincho}`, align: 'center', color: 'rgba(30,26,20,0.85)' });
    printLines(c, ['Fファーム株式会社　破産管財'], 0, -150, { font: `400 16px ${F.mincho}`, align: 'center', color: 'rgba(30,26,20,0.75)' });
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillRect(-120, 180, 240, 60);
    printLines(c, ['保存期限　10年'], 0, 210, { font: `400 16px ${F.mono}`, align: 'center', color: 'rgba(30,26,20,0.75)' });
  } });
}

// The prefecture's subsidy notice Anzai finds (A4, generic).
export function subsidyNotice(x, y, o = {}) {
  const { r = 0, lift = 3 } = o;
  sheet(420, 594, x, y, { r, seed: 140, color: '#f8f7f1', lift, print: (c) => {
    printLines(c, ['交付決定通知書'], 0, -220, { font: `700 24px ${F.mincho}`, align: 'center', color: 'rgba(20,20,26,0.85)' });
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = 'rgba(40,40,48,0.35)';
    for (let i = 0; i < 12; i++) c.fillRect(-160, -150 + i * 26, 320 - (i % 3) * 40, 6);
    c.strokeStyle = 'rgba(190,40,40,0.7)';
    c.lineWidth = 3;
    c.strokeRect(100, 200, 60, 60);
    c.restore();
  } });
}
