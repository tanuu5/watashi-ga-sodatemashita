// sets/court.js — the district court, third floor. The meeting room seen from above
// (twenty folding chairs, a table, one tube flickering), and the corridor outside.
import { R, withCam, piece, stillPiece, lights, bloomFlush, glow, pat, setPat } from '../render.js';
import { cutShape, rectPts, smooth, ellipsePts, disc } from '../cut.js';
import { hash, hs, mixHex, lerp, clamp } from '../util.js';

const cs = (pts, seed, o) => cutShape(pts, seed, { jag: 0.25, wander: 0.5, step: 12, corner: 0.35, ...o });
const box = (x0, y0, x1, y1, seed, o) => cs(rectPts(x1 - x0, y1 - y0, (x0 + x1) / 2, (y0 + y1) / 2), seed, o);

// chairs: 4 rows of 5, facing the table at the top
export const CHAIRS = [];
for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) CHAIRS.push({ x: 440 + c * 180, y: 380 + r * 140 });
export const TABLE = { x: 800, y: 190 };

let S = null;
function build() {
  S = {
    floor: box(-600, -400, 2200, 1400, 1, { jag: 0.1 }),
    seat: box(-44, -40, 44, 40, 2, { jag: 0.2 }),
    back: box(-46, 40, 46, 56, 3, { jag: 0.15 }),
    table: box(-360, -60, 360, 60, 4),
    head: disc(34, 5),
    shoulders: cs(smooth([[-62, -10], [-40, -30], [40, -30], [62, -10], [58, 26], [-58, 26]], true, 3), 6),
    wallN: box(-600, -400, 2200, 60, 7),
    door: box(1400, 60, 1560, 80, 8),
    // the corridor
    cWall: box(-800, -300, 2400, 820, 20, { jag: 0.1 }),
    cFloor: box(-800, 820, 2400, 1400, 21, { jag: 0.1 }),
    cBase: box(-800, 800, 2400, 822, 22),
    cBoard: box(180, 300, 620, 560, 23),
    cBench: box(900, 690, 1300, 712, 24),
    cBenchLeg1: box(930, 712, 946, 820, 25),
    cBenchLeg2: box(1254, 712, 1270, 820, 26),
    cWin: box(1500, 180, 1760, 620, 27),
    cDoor: box(-300, 220, -60, 820, 28),
  };
}

// The room from above. o: cam, people [{chair, hair, suit, turn}], kido (at the table), askew {chair: angle}, flicker
export function meetingRoom(o) {
  if (!S) build();
  const f = R.frame;
  withCam(o.cam.x, o.cam.y, o.cam.z, () => {
    R.anchor = { x: 800, y: 450 };
    R.light = { x: 0.1, y: 0.35 };
    stillPiece('mr-floor', S.floor, { color: '#b9b5a6', tex: 'block', ts: 0.9, lift: 0, edge: 0, maxQ: 1.4 });
    stillPiece('mr-wall', S.wallN, { color: '#d3cfc2', tex: 'tate', ts: 0.6, texA: 0.35, lift: 2, edge: 0.3 });
    stillPiece('mr-door', S.door, { color: '#8a7a68', tex: 'wood', lift: 3, edge: 0.3 });
    stillPiece('mr-table', S.table, { x: TABLE.x, y: TABLE.y, color: '#8a7058', tex: 'wood', lift: 10, edge: 0.4 });
    // papers on the table
    piece(S.seat, { x: TABLE.x - 60, y: TABLE.y + 10, sx: 1.1, sy: 0.7, color: '#f4f2ea', tex: 'plain', lift: 11, edge: 0.3 });
    CHAIRS.forEach((c, i) => {
      const a = (o.askew && o.askew[i]) || 0;
      piece(S.back, { x: c.x, y: c.y, r: a, color: '#5a6068', tex: 'plain', lift: 6, edge: 0.4 });
      piece(S.seat, { x: c.x, y: c.y, r: a, color: '#7c8490', tex: 'plain', lift: 5, edge: 0.45, print: (cc) => {
        // the seat's shine under the tubes
        cc.fillStyle = 'rgba(255,255,255,0.18)';
        cc.fillRect(-40, -36, 30, 72);
      } });
    });
    const person = (x, y, p) => {
      piece(S.shoulders, { x, y: y + 4, r: p.turn || 0, color: p.suit || '#2c3346', tex: 'cloth', lift: 14, edge: 0.3 });
      piece(S.head, { x: x + Math.sin(p.turn || 0) * 6, y: y - 2, color: p.hair || '#26211f', tex: 'washi', lift: 16, edge: 0.25, print: p.bald ? (cc) => { cc.fillStyle = '#dfb391'; cc.beginPath(); cc.arc(0, -4, 18, 0, Math.PI * 2); cc.fill(); } : null });
    };
    for (const p of o.people || []) person(CHAIRS[p.chair].x, CHAIRS[p.chair].y, p);
    if (o.kido) person(TABLE.x + 60, TABLE.y - 70, { suit: '#34394a', hair: '#26211f', turn: Math.PI });
    // the light: tubes in the ceiling; one of them flickering
    const flick = o.flicker ? (hash('fl', Math.floor(f / 1)) > 0.72 ? 0.25 : 1) : 1;
    const Ls = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const lx = 440 + i * 360, ly = 300 + j * 360;
      const on = i === 2 && j === 0 ? flick : 1;
      Ls.push({ x: lx, y: ly, r: 420, color: [210, 225, 220], a: 0.55 * on, sy: 0.6 });
    }
    lights('#6c7070', Ls);
    bloomFlush(0.2);
  });
}

// The corridor outside, side on. o: cam, fg()
export function corridor(o) {
  if (!S) build();
  withCam(o.cam.x, o.cam.y, o.cam.z, () => {
    R.anchor = { x: 800, y: 470 };
    R.light = { x: -0.3, y: 0.6 };
    stillPiece('cr-wall', S.cWall, { color: '#c9cfc0', tex: 'tate', ts: 0.8, texA: 0.3, lift: 0, edge: 0, maxQ: 1.4 });
    stillPiece('cr-floor', S.cFloor, { color: '#8f8a7a', tex: 'block', ts: 1.2, lift: 0, edge: 0, maxQ: 1.2 });
    stillPiece('cr-base', S.cBase, { color: '#6d6a60', tex: 'plain', lift: 2, edge: 0.3 });
    stillPiece('cr-board', S.cBoard, { color: '#b89a6a', tex: 'plain', lift: 4, edge: 0.4, print: (c) => {
      for (let i = 0; i < 6; i++) {
        c.fillStyle = '#f6f4ec';
        c.fillRect(200 + (i % 3) * 140, 320 + Math.floor(i / 3) * 120, 110, 100);
        c.fillStyle = 'rgba(40,40,48,0.35)';
        for (let k = 0; k < 5; k++) c.fillRect(210 + (i % 3) * 140, 336 + Math.floor(i / 3) * 120 + k * 14, 80, 4);
      }
    } });
    stillPiece('cr-bench', S.cBench, { color: '#6a5a4a', tex: 'wood', lift: 8, edge: 0.4 });
    stillPiece('cr-bl1', S.cBenchLeg1, { color: '#3a3a40', tex: 'plain', lift: 7 });
    stillPiece('cr-bl2', S.cBenchLeg2, { color: '#3a3a40', tex: 'plain', lift: 7 });
    stillPiece('cr-win', S.cWin, { color: '#eef2f0', tex: 'plain', lift: 3, edge: 0.4 });
    stillPiece('cr-door', S.cDoor, { color: '#8a7a68', tex: 'wood', lift: 4, edge: 0.3 });
    if (o.fg) o.fg();
    lights('#7a7c78', [
      { type: 'rect', x: 1500, y: 180, w: 260, h: 440, blur: 90, color: [255, 250, 235], a: 0.9 },
      { x: 1600, y: 700, r: 1300, color: [200, 205, 200], a: 0.55, sy: 0.6 },
      { x: 400, y: 100, r: 900, color: [180, 195, 190], a: 0.4 },
    ]);
    glow(1630, 400, 300, '255,250,235', 0.3);
    bloomFlush(0.4);
  });
}
