// cast.js — the people of the film, as puppet specs.
// Heights are in world units (about 3.2 units to the centimetre).

// 城戸悠 — the trustee. Seventeen years a lawyer; glasses; no opinions to speak of.
export const KIDO = {
  id: 'kido', seed: 100, H: 560,
  build: { chest: 0.074, backW: 0.066, hipW: 0.07, armW: 0.032, legW: 0.046 },
  face: { nose: 0.1, chin: 0.01, brow: 0.01, forehead: 0.01 },
  hair: 'short',
  colors: { skin: '#e2b894', hair: '#26211f', brow: '#2a2320', shirt: '#f1f2ef', pants: '#4a4c55', shoes: '#231f1f', tie: '#2b3a5c', jacket: '#34394a', glasses: '#26262c' },
  extras: { glasses: true, collar: true, buttons: true, pocket: true, belt: true },
  bareForearm: true,
};
// in the office and at court: tie, sleeves down
export const KIDO_SUIT = { ...KIDO, id: 'kido-suit', extras: { ...KIDO.extras, tie: true, jacket: true }, bareForearm: false };
export const KIDO_TIE = { ...KIDO, id: 'kido-tie', extras: { ...KIDO.extras, tie: true }, bareForearm: false };
// November: a jacket over the shirt
export const KIDO_COAT = { ...KIDO, id: 'kido-coat', colors: { ...KIDO.colors, jacket: '#5a5448' }, extras: { ...KIDO.extras, jacket: true }, bareForearm: false };

// 安西 — the clerk.
export const ANZAI = {
  id: 'anzai', seed: 200, H: 505,
  build: { chest: 0.07, backW: 0.06, hipW: 0.07, armW: 0.03, legW: 0.042, head: 0.178 },
  face: { nose: 0.06, chin: -0.02, lip: 0.01, forehead: 0.02 },
  hair: 'bob',
  colors: { skin: '#eac3a2', hair: '#3a2a22', shirt: '#f3efe6', pants: '#39405a', shoes: '#4a3a32', cardigan: '#8fa38a' },
  extras: { cardigan: true },
  cheek: 0.32,
};

// 篠田 — of the local credit union.
export const SHINODA = {
  id: 'shinoda', seed: 300, H: 545,
  build: { chest: 0.085, backW: 0.074, hipW: 0.08, belly: 0.012, armW: 0.035, legW: 0.05 },
  face: { nose: 0.09, chin: -0.03, jaw: 0.03, back: 0.02 },
  hair: 'thin',
  colors: { skin: '#dfb391', hair: '#3d3632', shirt: '#dfe8f2', pants: '#2c3346', shoes: '#1d1b1c', tie: '#7a2f36', jacket: '#2c3346' },
  extras: { collar: true, tie: true, jacket: true, belt: true },
};

// 門脇 — next door. Past seventy; the backs of his hands burnt thick by the sun.
export const KADO = {
  id: 'kado', seed: 400, H: 520,
  build: { chest: 0.076, backW: 0.07, hipW: 0.072, armW: 0.036, legW: 0.046, head: 0.176 },
  face: { nose: 0.13, noseDrop: 0.02, lip: -0.03, chin: -0.01, brow: 0.02 },
  hair: 'white',
  colors: { skin: '#b98260', hair: '#dcdad4', brow: '#cfcbc2', shirt: '#7e8a74', pants: '#5d5a4a', shoes: '#3a3a3e', towel: '#f0f1ee', hat: '#dcc27f', hatBand: '#2d2a28' },
  extras: { hat: true, towel: true, pocket: true },
  wrinkles: true, stubble: true, cheek: 0.18,
  bareForearm: true, sandal: true,
};
export const KADO_BARE = { ...KADO, id: 'kado-bare', hair: 'grey', extras: { towel: true, pocket: true }, colors: { ...KADO.colors, hair: '#d6d3cc' } };

// the woman who buys peppers
export const BUYER = {
  id: 'buyer', seed: 500, H: 495,
  build: { chest: 0.08, backW: 0.07, hipW: 0.08, belly: 0.01, armW: 0.033, legW: 0.046, head: 0.176 },
  face: { nose: 0.07, chin: -0.02, lip: 0.005 },
  hair: 'perm',
  colors: { skin: '#e3b796', hair: '#4a3530', shirt: '#b7a3c6', pants: '#cdbfa6', shoes: '#6a5a4c', armcover: '#3d4658' },
  extras: { armcover: true },
  sandal: true, bareForearm: true, cheek: 0.3,
};

// the two from the prefecture
export const YOUNG = {
  id: 'young', seed: 600, H: 550,
  build: { chest: 0.074, backW: 0.066, hipW: 0.07, armW: 0.032, legW: 0.046 },
  face: { nose: 0.085, chin: 0.02, forehead: -0.01 },
  hair: 'short',
  colors: { skin: '#e0b28e', hair: '#1f1b1c', shirt: '#f5f5f1', pants: '#5b5e66', shoes: '#2a2626', lanyard: '#2f6a8f' },
  extras: { collar: true, badge: true, belt: true, pocket: true },
  bareForearm: true,
};
export const OLDER = {
  id: 'older', seed: 700, H: 505,
  build: { chest: 0.078, backW: 0.07, hipW: 0.078, armW: 0.032, legW: 0.045, head: 0.176 },
  face: { nose: 0.08, chin: -0.02, lip: -0.005, jaw: 0.02 },
  hair: 'perm',
  colors: { skin: '#dfb697', hair: '#9a948e', shirt: '#d8cdb8', pants: '#4f5249', shoes: '#3a3530', glasses: '#6a5a4a' },
  extras: { chainGlasses: true, badge: true },
  bareForearm: false, cheek: 0.2,
};
