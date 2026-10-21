// Built-in Sparky pixel art (30x36 per frame, facing right). Used to generate the sprite sheet
// when assets/sprites/sparky.png is missing. The frames come from the pixel rig in sparkyRig.js:
// white Dalmatian in profile with a big friendly eye, rounded snout, black nose, floppy ear with a
// black tip, crown and chin spots, black fists and cleats. Red home jersey with a plain white band.
// Key: K outline/black fur, W white fur/chest band, R/F/D/X jersey reds, '.' transparent.
import { drawGrid } from './pixelArt.js';
import { buildSparkyFrames, buildSparkyHead } from './sparkyRig.js';

export const SPARKY_ART = buildSparkyFrames();
export const SPARKY_HEAD = buildSparkyHead(); // used for the favicon / app icon

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
