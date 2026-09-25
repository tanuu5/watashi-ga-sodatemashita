// fonts.js — font stacks and loading.
//   hand     Klee One: captions, and the sign (a "handwritten-look" typeface, printed by the farm)
//   mincho   Zen Old Mincho: the title, the court forms, the story printed on the paper
//   garamond EB Garamond: English
//   mono     BIZ UDGothic: machine print (price labels, the passbook, the operation log)
//   pen      Yomogi: real handwriting (Kido's memos, Kadowaki's note)
export const F = {
  hand: '"Klee One", "Hiragino Maru Gothic ProN", "Yu Gothic", "Hiragino Sans", sans-serif',
  mincho: '"Zen Old Mincho", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif',
  garamond: '"EB Garamond", "Iowan Old Style", Georgia, serif',
  mono: '"BIZ UDGothic", "Osaka-Mono", "MS Gothic", "Hiragino Sans", monospace',
  pen: '"Yomogi", "Klee One", "Hiragino Maru Gothic ProN", sans-serif',
};

function stylesheetReady() {
  const link = document.querySelector('link[data-fonts]');
  if (!link || link.sheet) return Promise.resolve();
  return new Promise((res) => {
    link.addEventListener('load', res, { once: true });
    link.addEventListener('error', res, { once: true });
    setTimeout(res, 4000);
  });
}

export async function loadFonts(sample) {
  if (!document.fonts || !document.fonts.load) return;
  await stylesheetReady();
  const faces = [
    '400 24px "Klee One"', '600 24px "Klee One"',
    '400 24px "Zen Old Mincho"', '700 24px "Zen Old Mincho"', '900 24px "Zen Old Mincho"',
    '400 24px "EB Garamond"', 'italic 400 24px "EB Garamond"', '500 24px "EB Garamond"',
    '400 24px "BIZ UDGothic"', '700 24px "BIZ UDGothic"', '400 24px "Yomogi"',
  ];
  const jobs = faces.map((f) => document.fonts.load(f, sample).catch(() => null));
  // Never let a slow font network hold the film hostage.
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 7000))]);
}
