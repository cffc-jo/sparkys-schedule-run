// Built-in Sparky pixel art (24x30 per frame). Used to generate the sprite sheet when
// assets/sprites/sparky.png is missing, and by tools to export that PNG.
// Key: K outline/black fur, N sheen, W white fur/chest band, R/F/D jersey, '.' transparent.
import { drawGrid } from './pixelArt.js';

// Head in profile facing right: black crown patch, big floppy ear hanging behind,
// oval eye, white snout with a big black nose, little tongue.
const HEAD = [
  '......KKKKKKKK..........',
  '....KKKKKKKKKKKK........',
  '...KKKKKKKKKKKWWK.......',
  '...KKKKKKKKKKWWWWK......',
  '..KKNKKKKKKKWWWWWWK.....',
  '..KKNKKKKWWWWKKKWWK.....',
  '.KKKNKKKKWWWKWWWKWKKK...',
  '.KKKNKKKKWWWKWKWKWWWKKK.',
  '.KKKNKKKKWWWKWKWKWWWKKKK',
  '.KKKNKKKKWWWKWWWKWWWWKK.',
  '.KKKNKKKWWWWWKKKWWWWWWK.',
  '..KKNKKKWWWWWWWWWKKKKKK.',
  '..KKKKKWWWWWWWWWWWFFK...',
  '...KKKKWWWWWWWWWWKKK....',
];

// Happy "^" blink: swap the eye block (rows 5-10, cols 12-16).
const BLINK_EYE = { 5: 'WWWWW', 6: 'WWWWW', 7: 'WKKKW', 8: 'KWWWK', 9: 'WWWWW', 10: 'WWWWW' };
const HEAD_BLINK = HEAD.map((row, y) => (BLINK_EYE[y] ? row.slice(0, 12) + BLINK_EYE[y] + row.slice(17) : row));

const BODY = [
  '......KKKKKKKKKKKK......',
  '.....KFRRRRRRRRRRDK.....',
  '...KWKFRRRRRRRRRRDKWK...',
  '..KWWKWWWWWWWWWWWWKWWK..',
  '..KWKKWWWWWWWWWWWWKKWK..',
  '..KWWKFRRRRRRRRRRDKWWK..',
  '...KKKFRRRRRRRRRRDKKK...',
  '.....KDDDDDDDDDDDDK.....',
  '.....KRRRRRRRRRRRDK.....',
  '.....KRRRRRKKRRRRDK.....',
  '......KWWWK..KWWWK......',
  '......KWKWK..KWKWK......',
  '......KWWWK..KWWWK......',
  '......KWWWK..KWWWK......',
  '.....KKKKKK..KKKKKKK....',
  '.....KKKKKK..KKKKKKK....',
];

export const SPARKY_ART = {
  idle0: [...HEAD, ...BODY],
  idle1: [...HEAD_BLINK, ...BODY],
};

// Sanity check in development: every row must be 24 wide.
for (const [name, rows] of Object.entries(SPARKY_ART)) {
  rows.forEach((r, i) => { if (r.length !== 24) console.warn(`sparkyArt ${name} row ${i} is ${r.length} wide`); });
}

// Build a sheet canvas that matches the frame map in config/sprites.js.
export function buildSparkySheet(sheetConfig) {
  const rects = Object.values(sheetConfig.frames);
  const w = Math.max(...rects.map((f) => f.x + f.w));
  const h = Math.max(...rects.map((f) => f.y + f.h));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  for (const [name, f] of Object.entries(sheetConfig.frames)) {
    const art = SPARKY_ART[name] || SPARKY_ART.idle0;
    drawGrid(ctx, art, f.x, f.y + (f.h - art.length));
  }
  return c;
}
