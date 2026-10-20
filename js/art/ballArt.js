// Pixel soccer balls. The 4-frame spin is the same art turned in 90° steps (stays crisp).
//   ballFrames()      20x20 power-up on the course
//   smallBallFrames() 10x10 icon (HUD invincibility meter)
import { gridToCanvas } from './pixelArt.js';

const BIG = [
  '......KKKKKKKK......',
  '....KKWWWWWWWWKK....',
  '...KWWWWKKKKWWWWK...',
  '..KWWWWKKKKKKWWWWK..',
  '.KWWWWWKKKKKKWWWWWK.',
  '.KKWWWWWKKKKWWWWWKK.',
  'KKKKWWWWWKKWWWWWKKKK',
  'KKKKWWWWWWWWWWWWKKKK',
  'KKKWWWWWWWWWWWWWWKKK',
  'KKWWWWWWWWWWWWWWWWKK',
  'KWWWKWWWWWWWWWWKWWWK',
  'KWWKKKWWWWWWWWKKKWWK',
  'KWKKKKKWWWWWWKKKKKWK',
  'KWWKKKKWWWWWWKKKKWWK',
  '.KWWKKWWWWWWWWKKWWK.',
  '.KWWWWWWWKKWWWWWWWK.',
  '..KWWWWWKKKKWWWWWK..',
  '...KWWWWKKKKWWWWK...',
  '....KKWWWWWWWWKK....',
  '......KKKKKKKK......',
];

// Soft sky-blue shading on the lower-right of the white panels so the ball looks round.
const BIG_SHADED = BIG.map((row, y) => [...row].map((ch, x) => (ch === 'W' && x + y > 26 ? 'B' : ch)).join(''));

const SMALL = [
  '...KKKK...',
  '.KKWWWWKK.',
  '.KWWKKWWK.',
  'KWWKKKKWWK',
  'KKWWKKWWKK',
  'KKWWWWWWKK',
  'KWWWWWWWWK',
  '.KKWWWWKK.',
  '.KKKWWKKK.',
  '...KKKK...',
];

function spin(rows) {
  const base = gridToCanvas(rows);
  return [0, 1, 2, 3].map((q) => {
    const c = document.createElement('canvas');
    c.width = base.width;
    c.height = base.height;
    const x = c.getContext('2d');
    x.translate(c.width / 2, c.height / 2);
    x.rotate((q * Math.PI) / 2);
    x.drawImage(base, -base.width / 2, -base.height / 2);
    return c;
  });
}

let big = null;
let small = null;

export function ballFrames() {
  return big || (big = spin(BIG_SHADED));
}

export function smallBallFrames() {
  return small || (small = spin(SMALL));
}
