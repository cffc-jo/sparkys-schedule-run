// Sparky sprite sheet frame map.
// To drop in a designer's sheet: replace assets/sprites/sparky.png and update the rects below.
// Each frame is a rectangle on the sheet; `anchor` is the point (within the frame) that sits on
// Sparky's position — bottom-centre = feet on the ground. A frame may override with anchorX/anchorY.
// If the PNG is missing, the game builds an equivalent sheet from the built-in pixel art.
const F = (i) => ({ x: i * 30, y: 0, w: 30, h: 36 });

export const SPARKY_SHEET = {
  src: 'assets/sprites/sparky.png',
  anchor: { x: 13, y: 36 },
  frames: {
    idle0: F(0), idle1: F(1),
    run0: F(2), run1: F(3), run2: F(4), run3: F(5),
    jump: F(6),
    spin: F(7),       // double jump: the game spins this frame in 90° steps
    duck: F(8),
    hit: F(9),
    victory0: F(10), victory1: F(11),
  },
  anims: {
    idle:    { frames: ['idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle0', 'idle1'], fps: 6 },
    run:     { frames: ['run0', 'run1', 'run2', 'run3'], fps: 12 },
    jump:    { frames: ['jump'], fps: 1 },
    spin:    { frames: ['spin'], fps: 1 },
    duck:    { frames: ['duck'], fps: 1 },
    hit:     { frames: ['hit'], fps: 1 },
    victory: { frames: ['victory0', 'victory1'], fps: 4 },
  },
  // Collision boxes relative to the feet (x centred). Smaller than the art = forgiving.
  hitbox: {
    stand: { w: 12, h: 28 },
    duck:  { w: 14, h: 14 },
  },
};
