// Built-in Sparky pixel art (24x30 per frame, facing right). Used to generate the sprite sheet
// when assets/sprites/sparky.png is missing. Frames are composed from layers: head, arm, torso, legs.
// Key: K outline/black fur, N sheen, W white fur/chest band, R/F/D jersey, '.' transparent.
import { drawGrid } from './pixelArt.js';

// Head in profile: black crown patch, big floppy ear hanging behind, oval eye,
// white snout with a big black nose, little tongue.
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

// Swap the eye block (rows 5-10, cols 12-16) for other expressions.
const withEyes = (eyes) => HEAD.map((row, y) => (eyes[y] ? row.slice(0, 12) + eyes[y] + row.slice(17) : row));
const HEAD_HAPPY = withEyes({ 5: 'WWWWW', 6: 'WWWWW', 7: 'WKKKW', 8: 'KWWWK', 9: 'WWWWW', 10: 'WWWWW' });
const HEAD_DIZZY = withEyes({ 5: 'WWWWW', 6: 'KWWWK', 7: 'WKWKW', 8: 'WWKWW', 9: 'WKWKW', 10: 'KWWWK' });

// Side-on torso: red home jersey with plain white chest band, red shorts.
const TORSO = [
  '......KKKKKKKKKKKK......',
  '.....KFRRRRRRRRRDK......',
  '.....KFRRRRRRRRRDK......',
  '.....KWWWWWWWWWWWK......',
  '.....KWWWWWWWWWWWK......',
  '.....KFRRRRRRRRRDK......',
  '.....KDDDDDDDDDDDK......',
  '.....KRRRRRRRRRRDK......',
  '......KRRRRRRRRDK.......',
];

// Arms (white fur with a black spot)
const ARM_DOWN = ['KKKK', 'KWWK', 'KWKK', 'KWWK', '.KK.'];
const ARM_FWD = ['.KKKKKK.', 'KWWWKWWK', 'KWWWWWWK', '.KKKKKK.'];
const ARM_BACK = ['.KKKKKK.', 'KWWKWWWK', 'KWWWWWWK', '.KKKKKK.'];
const ARM_UP = ['.KK.', 'KWWK', 'KWWK', 'KWKK', 'KWWK', 'KWWK', 'KWWK', 'KWWK'];

// Legs (rows 23-29): white spotted legs, dark cleats.
const LEGS_STAND = [
  '.......KWWKKWWK.........',
  '.......KWWKKWWK.........',
  '.......KWKKKWKK.........',
  '.......KWWKKWWK.........',
  '.......KWWKKWWK.........',
  '.......KKKKKKKKKK.......',
  '.......KKKKKKKKKK.......',
];
const LEGS_STRIDE = [
  '......KWWK..KWWK........',
  '.....KWWK....KWWK.......',
  '.....KWKK.....KWKK......',
  '....KWWK.......KWWK.....',
  '....KWWK.......KWWK.....',
  '...KKKKK.......KKKKKK...',
  '...KKKK........KKKKKK...',
];
const LEGS_PASS = [
  '.......KWWKWWK..........',
  '......KWWKKWWK..........',
  '.....KKKK.KWWK..........',
  '.....KKK..KWKK..........',
  '..........KWWK..........',
  '..........KKKKKK........',
  '..........KKKKKK........',
];
const LEGS_TUCK = [
  '.......KWWWWWWK.........',
  '.......KKKKKWWK.........',
  '...........KWWK.........',
  '..........KKKKKK........',
  '........................',
  '........................',
  '........................',
];

// Crouch: head lowered onto a squashed body (total 18px tall).
const DUCK_BODY = [
  '.....KFRRWWWWWRRDK......',
  '.....KDDDDDDDDDDDK......',
  '....KWWKKRRRRKKWWK......',
  '...KKKKK.......KKKKK....',
];

const W = 24, H = 30;

function compose(layers) {
  const grid = Array.from({ length: H }, () => Array(W).fill('.'));
  for (const { art, x = 0, y = 0 } of layers) {
    art.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const ch = row[rx];
        const gx = x + rx, gy = y + ry;
        if (ch !== '.' && gx >= 0 && gx < W && gy >= 0 && gy < H) grid[gy][gx] = ch;
      }
    });
  }
  return grid.map((r) => r.join(''));
}

const body = (head, legs, arm) => {
  const layers = [];
  if (arm === 'back') layers.push({ art: ARM_BACK, x: 2, y: 15 });
  layers.push({ art: head }, { art: TORSO, y: 14 }, { art: legs, y: 23 });
  if (arm === 'down') layers.push({ art: ARM_DOWN, x: 10, y: 15 });
  if (arm === 'fwd') layers.push({ art: ARM_FWD, x: 12, y: 15 });
  if (arm === 'up') layers.push({ art: ARM_UP, x: 1, y: 7 });
  return compose(layers);
};

export const SPARKY_ART = {
  idle0: body(HEAD, LEGS_STAND, 'down'),
  idle1: body(HEAD_HAPPY, LEGS_STAND, 'down'),
  run0: body(HEAD, LEGS_STRIDE, 'fwd'),
  run1: body(HEAD, LEGS_PASS, 'down'),
  run2: body(HEAD, LEGS_STRIDE, 'back'),
  run3: body(HEAD, LEGS_PASS, 'down'),
  jump: body(HEAD, LEGS_TUCK, 'fwd'),
  spin: body(HEAD_HAPPY, LEGS_TUCK, 'fwd'),
  duck: compose([{ art: HEAD, y: 12 }, { art: DUCK_BODY, y: 26 }]),
  hit: body(HEAD_DIZZY, LEGS_PASS, 'up'),
  victory0: body(HEAD_HAPPY, LEGS_STAND, 'up'),
  victory1: body(HEAD_HAPPY, LEGS_TUCK, 'up'),
};

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
