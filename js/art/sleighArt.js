// Santa's sleigh and reindeer (facing right) for the midwinter-break flyover.
// Reindeer have two gallop frames; the lead reindeer has a glowing red nose.
import { gridToCanvas } from './pixelArt.js';

const COLORS = {
  K: '#160008', // outline / dark
  R: '#D41F26', // Santa red
  D: '#8E1018', // shade red
  W: '#FFFFFF',
  S: '#F6C9A2', // skin
  Y: '#F2C230', // gold trim / runner
  G: '#B5874E', // toy sack
  B: '#8A5A2E', // reindeer brown
  b: '#5E3A1C', // reindeer dark brown
  T: '#E9D8B4', // antlers / tail
  N: '#FF2A2A', // red nose
};

const SLEIGH = [
  '..W.RRR...............',
  '...RRRRR..............',
  '...WWWWW..............',
  'GG.SSKSS..............',
  'GGGWWWWWR.............',
  'GGGRWWWRR.............',
  'YRRRRRRRRRRRRRRRRRY...',
  '.RRRRRRRRRRRRRRRRRRY..',
  '..RDYYYYYYYYYYYYYDR.Y.',
  '...DDDDDDDDDDDDDDD..Y.',
  '...K.K.......K.K...Y..',
  '.YYYYYYYYYYYYYYYYYY...',
];

const DEER_TOP = [
  '.........T.T.',
  '..........T..',
  '.........BBb.',
  '.........BKBb',
  'T.BBBBBBBBB..',
  '.BBBBBBBBBb..',
  '.bBBBBBBBb...',
];
const LEGS = [
  ['.b.b....b.b..', 'b...b..b...b.'], // stretched out
  ['..bb....bb...', '..b......b...'], // tucked
];

function deer(frame, rudolph) {
  const rows = [...DEER_TOP, ...LEGS[frame]];
  if (rudolph) rows[3] = rows[3].slice(0, 12) + 'N';
  return gridToCanvas(rows, COLORS);
}

export function buildSleighArt() {
  return {
    sleigh: gridToCanvas(SLEIGH, COLORS),
    reindeer: [deer(0, false), deer(1, false)],
    rudolph: [deer(0, true), deer(1, true)],
  };
}
