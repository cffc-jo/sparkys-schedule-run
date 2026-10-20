// 10x10 pixel soccer ball. The 4-frame spin is the same art turned in 90° steps (stays crisp).
import { gridToCanvas } from './pixelArt.js';

const BALL = [
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

let frames = null;

export function ballFrames() {
  if (frames) return frames;
  const base = gridToCanvas(BALL);
  frames = [0, 1, 2, 3].map((q) => {
    const c = document.createElement('canvas');
    c.width = base.width;
    c.height = base.height;
    const x = c.getContext('2d');
    x.translate(c.width / 2, c.height / 2);
    x.rotate((q * Math.PI) / 2);
    x.drawImage(base, -base.width / 2, -base.height / 2);
    return c;
  });
  return frames;
}
