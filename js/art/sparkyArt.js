// Built-in Sparky pixel art (24x30 per frame, facing right). Used to generate the sprite sheet
// when assets/sprites/sparky.png is missing. Frames are composed from layers: head, arm, torso, legs.
// Key: K outline/black fur, N sheen, W white fur/chest band, R/F/D jersey, '.' transparent.
import { drawGrid } from './pixelArt.js';

// Dalmatian head in profile: round white skull, small black crown patch, floppy black ear,
// kind eye, boxy white muzzle with a round black nose, upturned smile and a little tongue.
const pad = (rows) => rows.map((r) => '....' + r + '...');
const HEAD = pad([
  '.....KKKKK.......',
  '...KKKKKWWWK.....',
  '..KKKKKWWWKKWK...',
  '.KKNKKWWWWKWWWKKK',
  '.KKNKWWWWWKKWWKKK',
  '.KKNKWWWWWWWWWWKK',
  '.KKNKWWWWWKWWWWWK',
  '.KKNKWWWWWWKKKKKK',
  '..KKKWWKWWWWFFK..',
  '...KKKWWWWWWKK...',
  '.....KKWWWWK.....',
  '......KWWWWK.....',
]);

// Swap the eye block (rows 2-4, cols 13-16) for other expressions.
const withEyes = (eyes) => HEAD.map((row, y) => (eyes[y] ? row.slice(0, 13) + eyes[y] + row.slice(17) : row));
const HEAD_HAPPY = withEyes({ 2: 'WWWW', 3: 'WKKW', 4: 'KWWK' });
const HEAD_DIZZY = withEyes({ 2: 'WKWK', 3: 'WWKW', 4: 'WKWK' });

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

// Arms: white fur with a black spot, placed at the shoulder.
const ARM_DOWN = { x: 12, y: 13, art: ['KKK', 'KWK', 'KWK', 'KWK', 'KWK', 'KKK'] };
const ARM_FWD = { x: 13, y: 13, art: ['KKKK...', 'KWWKKK.', '.KKWWWK', '...KKKK'] };
const ARM_BACK = { x: 5, y: 13, art: ['...KKKK', '.KKKWWK', 'KWWWKK.', 'KKKK...'] };
const ARM_UP = { x: 5, y: 4, art: ['.KK....', 'KWWK...', 'KWWK...', 'KWKK...', 'KWWK...', '.KWWK..', '..KWWK.', '...KWWK', '....KWK'] };

// Legs (rows 21-29): strong thighs, white spotted legs, dark cleats.
const LEGS_STAND = [
  '..........KWWKWWK.......',
  '..........KWWKWWK.......',
  '..........KWKKWWK.......',
  '..........KWWKWKK.......',
  '...........KWKWK........',
  '...........KWKWK........',
  '...........KKKWK........',
  '..........KKKKKKK.......',
  '..........KKKKKKKK......',
];
const LEGS_STRIDE = [
  '.........KWWKWWK........',
  '........KWWK.KWWK.......',
  '.......KWKK...KWWK......',
  '......KWWK.....KWK......',
  '......KWK......KWK......',
  '.....KWK........KWK.....',
  '.....KKK........KWK.....',
  '....KKKK........KKKKK...',
  '...KKKK.........KKKKK...',
];
const LEGS_PASS = [
  '.........KWWWWWK........',
  '..........KWWWWWWK......',
  '..........KWWKKKWK......',
  '...........KWK.KWK......',
  '...........KWK.KWK......',
  '...........KKK.KKKK.....',
  '...........KWK..........',
  '..........KKKKKK........',
  '..........KKKKKK........',
];
const LEGS_TUCK = [
  '.........KWWWWWWK.......',
  '.........KKKKKWWK.......',
  '.............KWWK.......',
  '............KKKKKK......',
  '............KKKKK.......',
];

// Crouch: head lowered and pushed forward onto a squashed body (18px tall).
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
  if (arm === ARM_BACK) layers.push(arm);
  layers.push({ art: head }, { art: TORSO, y: 12 }, { art: legs, y: 21 });
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
  duck: compose([{ art: HEAD, x: 2, y: 12 }, { art: DUCK_BODY, y: 22 }]),
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
