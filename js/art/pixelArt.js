// Tiny helpers for building pixel art from strings. One character = one pixel.
import { PALETTE as P } from '../../config/palette.js';

// Shared character → colour map for all built-in art. '.' or ' ' = transparent.
export const PIXEL_COLORS = {
  K: P.DARK_NAVY,  // outlines, Sparky's black ears / spots / nose
  N: P.NAVY,       // sheen on black areas
  W: P.WHITE,
  R: P.RED,
  F: P.FIRE_RED,
  D: P.DEEP_RED,
  X: P.DARK_RED,
  B: P.FLAG_BLUE,
  b: P.BLUE,
  e: P.DEEP_BLUE,
  d: P.DARK_BLUE,
  V: P.DEEP_NAVY,
};

export function gridToCanvas(rows, colors = PIXEL_COLORS) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawGrid(c.getContext('2d'), rows, 0, 0, colors);
  return c;
}

export function drawGrid(ctx, rows, ox, oy, colors = PIXEL_COLORS) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = colors[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

// Recolour an image to the nearest palette colour and snap alpha to on/off.
// Used for the crest so it matches the 8-bit look exactly.
export function snapToPalette(canvas, palette = Object.values(P)) {
  const rgb = palette.map((h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  });
  const x = canvas.getContext('2d', { willReadFrequently: true });
  const img = x.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
    let best = 0, bestD = Infinity;
    for (let j = 0; j < rgb.length; j++) {
      const dr = d[i] - rgb[j][0], dg = d[i + 1] - rgb[j][1], db = d[i + 2] - rgb[j][2];
      const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
      if (dist < bestD) { bestD = dist; best = j; }
    }
    d[i] = rgb[best][0]; d[i + 1] = rgb[best][1]; d[i + 2] = rgb[best][2]; d[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return canvas;
}

// Render an <img> (e.g. the SVG crest) into a small pixel-art canvas.
export function pixelateImage(img, size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, size, size);
  return snapToPalette(c);
}
