// Seasonal pitch-side props (background scenery, not brand art): snowmen in winter,
// tulips and daisy bushes in spring, leaf piles in fall, jack-o'-lanterns in October.
import { gridToCanvas, PIXEL_COLORS } from './pixelArt.js';
import { PALETTE as P } from '../../config/palette.js';

// One character per pixel in the grids below
const C = {
  ...PIXEL_COLORS, // K outline, W white, R/D reds, ...
  R: P.FIRE_RED,   // Fire-red scarf
  D: P.DEEP_RED,
  s: '#D6E3EA',    // snow shading
  o: '#F39C3D',    // carrot nose
  T: '#7A4A2A',    // twig arms
  O: '#E8781E',    // pumpkin / orange leaves
  p: '#B85A14',    // pumpkin shading
  Y: '#FFD23F',    // candle glow / yellow leaves
  r: '#C0392B',    // red leaves
  G: '#4E8A2E',    // pumpkin stem / leaves
  g: '#76B947',    // light leaf green
  P: '#F27DAA',    // pink tulip
  q: '#C94F82',    // tulip shading
  y: '#E6A21C',    // daisy centre / yellow tulip shading
};

const SNOWMAN = [
  '.....KKKKK.....',
  '.....KKKKK.....',
  '.....KKKKK.....',
  '...KKKKKKKKK...',
  '....KWWWWWK....',
  '...KWWKWKWWK...',
  '...KWWWooWWK...',
  '...KWWWWWWsK...',
  '....RRRRRRR....',
  '...KRRDWWWsK...',
  'T.KWWWRWWWWsK.T',
  '.TKWWWRKWWWsKT.',
  '..TWWWWWWWWsT..',
  '..KWWWWKWWWsK..',
  '...KWWWWWWsK...',
  '..KKWWWWWWWsKK.',
  '.KWWWWWWWWWWssK',
  'KWWWWWWKWWWWWsK',
  'KWWWWWWWWWWWWsK',
  'KWWWWWWKWWWWssK',
  '.KsWWWWWWWWssK.',
  '..KKKKKKKKKKK..',
];

const LEAF_PILE = [
  '......KKKKKK......',
  '....KKOYrOOYKK....',
  '...KOrOYOrOOYrK...',
  '..KYOrpYrrOYOrOK..',
  '.KOrOYOrpOrYOOrYK.',
  'KOYrpOrYOOYrpOYrOK',
  'KKKKKKKKKKKKKKKKKK',
];

const PUMPKIN = [
  '.......GG.......',
  '......GG........',
  '...KKKKKKKKKK...',
  '..KOOOpOOpOOOK..',
  '.KOOOOpOOpOOOOK.',
  'KOOYOOpOOpOOYOOK',
  'KOYYYOpOOpOYYYOK',
  'KOOOOOpYYpOOOOOK',
  'KOYOOYOOOOYOOYOK',
  'KOYYYYYYYYYYYYOK',
  '.KOYOYYOOYYOYOK.',
  '..KOOOOOOOOOOK..',
  '...KKKKKKKKKK...',
];

const TULIPS = [
  '.K.K.K...........K.K.K.',
  '.KRKRK....K.K.K..KYKYK.',
  'KRRRRRK..KPKPKPK.KYYYyK',
  'KRRRRDK..KPPPPqK.KYYYyK',
  'KRRRRDK..KPPPPqK.KYYYyK',
  '.KRRDK....KPPqK...KYyK.',
  '..KGK......KGK.....KGK.',
  '.KgGK.KK...KGK..KK.KGK.',
  'KggGKKgGK.KgGK.KgGKKGgK',
  'KgGGKgGK..KgGKKgGK.KGgK',
  '.KGGGGK...KGGGGK...KGK.',
  'KKKKKKKKKKKKKKKKKKKKKKK',
];

const DAISIES = [
  '.....KKK....KKK.....',
  '....KWWWK..KWWWK....',
  '..KKWWyWWKKWWyWWK...',
  '.KgGKWWWKgGKWWWKKK..',
  'KgGgGKKKgGgGKKKWWWK.',
  'KGgKWWWKGgGgGKWWyWWK',
  'KgKWWyWWKGgGgGKWWWKK',
  'KGgKWWWKgGgGgGgKKKgK',
  'KgGgKKKgGgGgGgGgGgGK',
  'KKKKKKKKKKKKKKKKKKKK',
];

let cache = null;

export function decorSprites() {
  if (cache) return cache;
  cache = {
    snowman: gridToCanvas(SNOWMAN, C),
    leafPile: gridToCanvas(LEAF_PILE, C),
    pumpkin: gridToCanvas(PUMPKIN, C),
    tulips: gridToCanvas(TULIPS, C),
    daisies: gridToCanvas(DAISIES, C),
  };
  return cache;
}
