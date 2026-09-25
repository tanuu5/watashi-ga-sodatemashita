// timeline.js — the scenes in order.
import s0 from './scenes/s0_title.js';
import s1 from './scenes/s1_office.js';
import s2 from './scenes/s2_court.js';
import s3 from './scenes/s3_wednesday.js';
import s4 from './scenes/s4_farm.js';
import s5 from './scenes/s5_stand.js';
import s6 from './scenes/s6_wallet.js';
import s7 from './scenes/s7_veranda.js';
import s8 from './scenes/s8_logs.js';
import s9 from './scenes/s9_retort.js';
import s10 from './scenes/s10_officials.js';
import s11 from './scenes/s11_inventory.js';

export const SCENES = [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11];

let acc = 0;
for (const s of SCENES) {
  s.start = acc;
  acc += s.len;
}
export const TOTAL = acc;

export function locate(g) {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (g >= SCENES[i].start) return { sc: SCENES[i], f: g - SCENES[i].start, i };
  }
  return { sc: SCENES[0], f: 0, i: 0 };
}
