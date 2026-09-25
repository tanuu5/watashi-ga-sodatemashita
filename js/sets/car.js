// sets/car.js — inside the rental car: the windscreen, the wheel, the rear-view mirror.
// The mirror shows another shot, rendered small and flipped (see render.inset).
import { R, withCam, piece, stillPiece, lights, bloomFlush, glow, inset, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from '../cut.js';
import { hash, hs, mixHex, lerp, clamp } from '../util.js';
import { armOnly } from '../puppet.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.3, wander: 0.6, step: 14, corner: 0.4, ...o });
// A wall of cedars seen in perspective: its top edge is a row of spires, smaller as they go away.
function cedarEdge(outer, near, far, seed) {
  const pts = [...outer];
  const [x0, y0] = outer[1], [x1, y1] = near;
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    const h = (1 - t) * 120 + 20;
    pts.push([x - (x1 - x0) / n * 0.3, y + h * 0.35]);
    pts.push([x, y - h * (0.6 + hash(seed, i) * 0.4)]);
  }
  pts.push(near, far);
  return pts;
}
let S = null;
export const MIRROR = { x: 800, y: 118, w: 330, h: 104 };

function build() {
  S = {
    // the view ahead (a road curving away between cedars)
    sky: cs(rectPts(1800, 500, 800, 150), 1),
    wallL: cs(cedarEdge([[-100, 900], [-100, 40]], [640, 330], [640, 430], 2), 2, { jag: 0.4, wander: 0.8, step: 12 }),
    wallR: cs(cedarEdge([[1700, 900], [1700, 20]], [930, 318], [930, 430], 3), 3, { jag: 0.4, wander: 0.8, step: 12 }),
    road: cs([[-100, 900], [640, 430], [700, 404], [880, 404], [930, 430], [1700, 900]], 4, { jag: 0.2 }),
    line: cs([[786, 406], [794, 406], [880, 900], [812, 900]], 5, { jag: 0.1 }),
    rail: cs([[1700, 530], [930, 384], [930, 396], [1700, 572]], 6, { jag: 0.1 }),
    farHill: cs([[500, 420], [620, 300], [760, 330], [900, 280], [1080, 420]], 7, { jag: 0.6, wander: 1.2 }),
    // the car
    roof: cs([[-200, -200], [1800, -200], [1800, 60], [1400, 70], [800, 84], [200, 70], [-200, 60]], 10),
    pillarL: cs([[-200, 40], [110, 60], [30, 900], [-200, 900]], 11),
    pillarR: cs([[1800, 40], [1490, 60], [1570, 900], [1800, 900]], 12),
    dash: cs(smooth([[-200, 900], [-200, 640], [300, 600], [800, 590], [1300, 600], [1800, 640], [1800, 900]], true, 4), 13),
    dashTop: cs(smooth([[-200, 650], [300, 606], [800, 596], [1300, 606], [1800, 650], [1800, 668], [800, 616], [-200, 668]], true, 4), 14),
    wheelRim: disc(250, 15, { ry: 250 }),
    wheelHole: disc(214, 16),
    hub: disc(70, 17),
    spokes: cs([[-214, -14], [214, -14], [214, 14], [-214, 14]], 18),
    spokeV: cs([[-14, 0], [14, 0], [16, 214], [-16, 214]], 19),
    mirrorCase: cs(smooth([[MIRROR.x - MIRROR.w / 2 - 14, MIRROR.y - MIRROR.h / 2 - 12], [MIRROR.x + MIRROR.w / 2 + 14, MIRROR.y - MIRROR.h / 2 - 12], [MIRROR.x + MIRROR.w / 2 + 18, MIRROR.y + MIRROR.h / 2 + 12], [MIRROR.x - MIRROR.w / 2 - 18, MIRROR.y + MIRROR.h / 2 + 12]], true, 3), 20),
    mirrorStem: cs([[MIRROR.x - 10, 40], [MIRROR.x + 10, 40], [MIRROR.x + 8, MIRROR.y - MIRROR.h / 2], [MIRROR.x - 8, MIRROR.y - MIRROR.h / 2]], 21),
  };
}

// o: time ('july'|'nov'), mirror (fn drawing the shot seen behind, at world scale, or null),
//    hands ({ spec, grip: 0..1 }), dusk (0..1), headlights of oncoming cars (0..1), shake
export function carInterior(o) {
  if (!S) build();
  const f = R.frame;
  const nov = o.time === 'nov';
  withCam(800, 450, 1, () => {
    const ctx = R.ctx;
    R.anchor = { x: 800, y: 450 };
    R.light = { x: 0.1, y: 0.7 };
    const shake = o.shake ? hs('sh', Math.floor(f / 2)) * o.shake : 0;
    ctx.save();
    ctx.translate(0, shake);
    // the view ahead
    stillPiece('car-sky|' + o.time, S.sky, { color: nov ? '#c7a79a' : '#a9cde6', tex: 'washi', lift: 0, edge: 0, print: (c) => {
      const g = c.createLinearGradient(0, -100, 0, 420);
      g.addColorStop(0, nov ? 'rgba(90,90,140,0.6)' : 'rgba(90,140,200,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(-100, -100, 1800, 520);
    } });
    stillPiece('car-hill|' + o.time, S.farHill, { color: nov ? '#8a7a8a' : '#7f9aaa', tex: 'washi', lift: 1, edge: 0.1 });
    stillPiece('car-road', S.road, { color: '#6a6a6c', tex: 'gravel', ts: 0.5, lift: 1, edge: 0.2 });
    stillPiece('car-line', S.line, { color: '#e6e3d8', tex: 'plain', lift: 1, edge: 0 });
    stillPiece('car-wallL|' + o.time, S.wallL, { color: nov ? '#8a6a3a' : '#2f5230', tex: 'washi', lift: 3, edge: 0.2 });
    stillPiece('car-wallR|' + o.time, S.wallR, { color: nov ? '#a5783a' : '#355a34', tex: 'washi', lift: 3, edge: 0.2 });
    stillPiece('car-rail', S.rail, { color: '#d7d9d6', tex: 'plain', lift: 4, edge: 0.4 });
    ctx.restore();
    // the car around us
    const trim = nov ? '#2c2b30' : '#34333a';
    stillPiece('car-roof', S.roof, { color: '#4a4850', tex: 'cloth', ts: 0.6, lift: 8, edge: 0.2 });
    stillPiece('car-pl', S.pillarL, { color: trim, tex: 'cloth', lift: 8, edge: 0.2 });
    stillPiece('car-pr', S.pillarR, { color: trim, tex: 'cloth', lift: 8, edge: 0.2 });
    stillPiece('car-dash', S.dash, { color: '#2a292e', tex: 'plain', lift: 10, edge: 0.2 });
    stillPiece('car-dashtop', S.dashTop, { color: '#3a3940', tex: 'plain', lift: 11, edge: 0.3 });
    stillPiece('car-mstem', S.mirrorStem, { color: '#26252a', tex: 'plain', lift: 12, edge: 0.3 });
    stillPiece('car-mcase', S.mirrorCase, { color: '#2a292e', tex: 'plain', lift: 13, edge: 0.35 });
    // the wheel (seen from the driver's seat, a little to the left of centre)
    const wx = 520, wy = 860;
    piece(S.wheelRim, { x: wx, y: wy, sy: 0.9, color: '#1f1e22', tex: 'plain', lift: 20, edge: 0.3 });
    piece(S.spokes, { x: wx, y: wy, color: '#26252a', tex: 'plain', lift: 21, edge: 0.2 });
    piece(S.spokeV, { x: wx, y: wy, color: '#26252a', tex: 'plain', lift: 21, edge: 0.2 });
    piece(S.hub, { x: wx, y: wy, sy: 0.9, color: '#2e2d33', tex: 'plain', lift: 22, edge: 0.3 });
    if (o.hands) {
      const { spec, grip = 1 } = o.hands;
      const tight = hs('grip', Math.floor(f / 4)) * 0.01;
      armOnly(spec, { x: wx - 380, y: 1120, s: 1.9, dir: 1, a: [1.9 + tight, 0.9, -0.5], hand: 'fist', f });
      armOnly(spec, { x: wx + 420, y: 1140, s: 1.9, dir: -1, a: [1.95 - tight, 0.85, -0.5], hand: 'fist', f });
    }
    // light: the day outside, the cabin in shadow
    lights(nov ? '#5a5462' : '#8d8a88', [
      { type: 'rect', x: 80, y: 60, w: 1440, h: 560, blur: 120, color: nov ? [230, 170, 140] : [255, 250, 235], a: 1 },
      { x: 800, y: 700, r: 900, color: nov ? [120, 90, 90] : [150, 145, 130], a: 0.5 },
    ]);
    // the mirror's glass (self-lit: what it shows was lit in its own shot)
    if (o.mirror) {
      const k = R.k;
      const img = inset('mirror', MIRROR.w * k * 1.4, MIRROR.h * k * 1.4, o.mirror);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(MIRROR.x - MIRROR.w / 2, MIRROR.y - MIRROR.h / 2, MIRROR.w, MIRROR.h, 14) : ctx.rect(MIRROR.x - MIRROR.w / 2, MIRROR.y - MIRROR.h / 2, MIRROR.w, MIRROR.h);
      ctx.clip();
      // a mirror flips left and right
      ctx.translate(MIRROR.x + MIRROR.w / 2, MIRROR.y - MIRROR.h / 2);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, MIRROR.w, MIRROR.h);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createLinearGradient(MIRROR.x - MIRROR.w / 2, MIRROR.y - 60, MIRROR.x + MIRROR.w / 2, MIRROR.y + 60);
      g.addColorStop(0.3, 'rgba(255,255,255,0)');
      g.addColorStop(0.42, 'rgba(255,255,255,0.12)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(MIRROR.x - MIRROR.w / 2, MIRROR.y - MIRROR.h / 2, MIRROR.w, MIRROR.h);
      ctx.restore();
    }
    if (o.after) o.after();
    bloomFlush(0.4);
  });
}
