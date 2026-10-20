// Built-in Sparky pixel art (24x32 per frame, facing right). Used to generate the sprite sheet
// when assets/sprites/sparky.png is missing. Frames are composed from layers: head, arm, torso, legs.
// Modelled on the club's cartoon Sparky: white Dalmatian, floppy spotted ears, big friendly eyes,
// black nose, wide grin, black fists. Kit stays the red home jersey with a plain white band.
// Key: K outline/black fur, W white fur/chest band, R/F/D jersey, '.' transparent.
import { drawGrid } from './pixelArt.js';

// 3/4 head turned to the right: two floppy white ears with black tips flopping out to each
// side, a black spot on top of the head, two big oval eyes glancing forward, black nose, big grin.
const HEAD = [
  '.........KKKKKK.........',
  '.......KKWKKKWWKK.......',
  '..KKKKKWWKKKKWWWWKKKKKK.',
  '.KWWWWKWWWWWWWWWWKWWWKKK',
  'KWWWWWKWWKKWKKWWWKWWWKKK',
  'KWWWWWKWKWWKWWKWWKWWKKKK',
  'KWWWWWKWKWKKWKKWWWKKKKK.',
  'KKKWWWKWKWKKWKKWWWWK....',
  '.KKKKWKWKWWKWWKKKKWK....',
  '..KKKKKWWKKWKKWKKKWK....',
  '...KK.KWWKWWWWWWKWWK....',
  '.......KWWKKKKKKWWK.....',
  '........KWWFFWWKWK......',
  '.........KKKKKKKK.......',
];

// Swap the eye block (rows 4-9, cols 8-14) for other expressions.
const withEyes = (eyes) => HEAD.map((row, y) => (eyes[y] ? row.slice(0, 8) + eyes[y] + row.slice(15) : row));
const HEAD_HAPPY = withEyes({ 4: 'WWWWWWW', 5: 'WWWWWWW', 6: 'WKKWKKW', 7: 'KWWKWWK', 8: 'WWWWWWW', 9: 'WWWWWWW' });
const HEAD_DIZZY = withEyes({ 4: 'WWWWWWW', 5: 'KWKWKWK', 6: 'WKWWWKW', 7: 'KWKWKWK', 8: 'WWWWWWW', 9: 'WWWWWWW' });

// Athletic side-on torso: broad shoulders, narrow waist. Red home jersey, plain white chest band.
const TORSO = [
  '.........KKKKKKKK.......',
  '........KFRRRRRRDK......',
  '........KWWWWWWWWK......',
  '........KWWWWWWWWK......',
  '........KFRRRRRRDK......',
  '.........KRRRRRDK.......',
  '.........KDDDDDDK.......',
  '.........KRRRRRDK.......',
  '.........KRRKRRDK.......',
];

// Arms: white fur, black fists, placed at the shoulder.
const ARM_DOWN = { x: 12, y: 15, art: ['KKKK', 'KWWK', 'KWWK', 'KWWK', 'KKKK', 'KKKK'] };
const ARM_FWD = { x: 13, y: 15, art: ['KKKKK...', 'KWWWWKKK', 'KWWWWKKK', '.KKKKKKK'] };
const ARM_BACK = { x: 4, y: 15, art: ['....KKKK', '.KKKWWWK', 'KKKWWWK.', 'KKKKKK..'] };
const ARM_UP = { x: 16, y: 5, art: ['....KKKK', '....KKKK', '....KKKK', '....KWWK', '...KWWK.', '...KWWK.', '..KWWK..', '.KWWK...', 'KWWK....', 'KWK.....'] };

// Legs (rows 23-31): strong thighs and shins, white spotted legs, dark cleats.
const LEGS_STAND = [
  '..........KWWKWWK.......',
  '..........KWWKWWK.......',
  '..........KWKKWWK.......',
  '..........KWWKWKK.......',
  '..........KWWKWWK.......',
  '..........KWWKWWK.......',
  '..........KKWKWWK.......',
  '..........KKKKKKKK......',
  '..........KKKKKKKKK.....',
];
const LEGS_STRIDE = [
  '.........KWWKWWK........',
  '........KWWK.KWWK.......',
  '.......KKWK...KWWK......',
  '......KWWK.....KWWK.....',
  '......KWWK.....KWKK.....',
  '.....KWWK.......KWWK....',
  '.....KWKK.......KWWK....',
  '....KKKKK.......KKKKKK..',
  '...KKKKK........KKKKKK..',
];
const LEGS_PASS = [
  '.........KWWWWWK........',
  '..........KWWWWWWK......',
  '..........KWWKKKWWK.....',
  '..........KWWK.KWWK.....',
  '..........KWKK.KWWK.....',
  '..........KWWK.KKKKK....',
  '..........KWWK..........',
  '..........KKKKKKK.......',
  '..........KKKKKKK.......',
];
const LEGS_TUCK = [
  '.........KWWWWWWK.......',
  '.........KWWWWWWK.......',
  '............KWWWK.......',
  '............KWWWK.......',
  '...........KKKKKKK......',
  '...........KKKKKK.......',
];

// Crouch: body tucked low behind the lowered head (15px tall, well under floating boxes).
const DUCK_BODY = [
  '........KFRRRRRRDK......',
  '........KWWWWWWWWK......',
  '........KFRRRRRRDK......',
  '.........KRRKRRDK.......',
  '.......KWWKKKKKWWK......',
  '......KWWK.....KWWK.....',
  '......KKKKK....KKKKK....',
  '......KKKKK....KKKKK....',
];

const W = 24, H = 32;

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
  if (arm === ARM_BACK) layers.push(arm);
  layers.push({ art: head, y: 1 }, { art: TORSO, y: 14 }, { art: legs, y: 23 });
  if (arm && arm !== ARM_BACK) layers.push(arm);
  return compose(layers);
};

export const SPARKY_ART = {
  idle0: body(HEAD, LEGS_STAND, ARM_DOWN),
  idle1: body(HEAD_HAPPY, LEGS_STAND, ARM_DOWN),
  run0: body(HEAD, LEGS_STRIDE, ARM_FWD),
  run1: body(HEAD, LEGS_PASS, ARM_DOWN),
  run2: body(HEAD, LEGS_STRIDE, ARM_BACK),
  run3: body(HEAD, LEGS_PASS, ARM_DOWN),
  jump: body(HEAD, LEGS_TUCK, ARM_FWD),
  spin: body(HEAD_HAPPY, LEGS_TUCK, ARM_FWD),
  duck: compose([{ art: DUCK_BODY, x: -3, y: 24 }, { art: HEAD, x: 1, y: 17 }]),
  hit: body(HEAD_DIZZY, LEGS_PASS, ARM_BACK),
  victory0: body(HEAD_HAPPY, LEGS_STAND, ARM_UP),
  victory1: body(HEAD_HAPPY, LEGS_TUCK, ARM_UP),
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
