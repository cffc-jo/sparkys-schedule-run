// Sparky sprite sheet frame map.
// To drop in a designer's sheet: replace assets/sprites/sparky.png and update the rects below.
// Each frame is a rectangle on the sheet; `anchor` is the point (within the frame) that sits on
// Sparky's position — bottom-centre = feet on the ground.
// If the PNG is missing, the game builds an equivalent sheet from the built-in pixel art.
export const SPARKY_SHEET = {
  src: 'assets/sprites/sparky.png',
  anchor: { x: 12, y: 30 },
  frames: {
    idle0: { x: 0,  y: 0, w: 24, h: 30 },
    idle1: { x: 24, y: 0, w: 24, h: 30 }, // blink
  },
  anims: {
    idle: { frames: ['idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle1'], fps: 6 },
  },
};
