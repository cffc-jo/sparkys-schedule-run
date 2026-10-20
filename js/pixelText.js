// Crisp bitmap text on the canvas. Each string is rendered once with "Press Start 2P", its alpha
// snapped to on/off (no anti-aliased fringe in off-palette colours), then cached.
const FONT = '"Press Start 2P", monospace';
const cache = new Map();

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function textSprite(str, color, size = 8) {
  const key = size + '|' + color + '|' + str;
  let c = cache.get(key);
  if (c) return c;

  c = document.createElement('canvas');
  const x = c.getContext('2d', { willReadFrequently: true });
  x.font = `${size}px ${FONT}`;
  const w = Math.max(1, Math.ceil(x.measureText(str).width));
  c.width = w;
  c.height = Math.ceil(size * 1.25);
  x.font = `${size}px ${FONT}`;
  x.textBaseline = 'top';
  x.fillStyle = color;
  x.fillText(str, 0, 0);

  const img = x.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const [r, g, b] = hexToRgb(color);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] >= 100) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
    else d[i + 3] = 0;
  }
  x.putImageData(img, 0, 0);
  cache.set(key, c);
  return c;
}

export function textWidth(str, size = 8) {
  return textSprite(str, '#FFFFFF', size).width;
}

// Draw text at (x, y) = top edge. align: 'left' | 'center' | 'right'.
// shadow: colour of a 1px (or `shadowOffset`) drop shadow down-right.
// outline: colour of a 1px outline all round (keeps text readable over busy scenery).
export function drawText(ctx, str, x, y, { color = '#FFFFFF', size = 8, align = 'left', shadow = null, shadowOffset = 1, outline = null } = {}) {
  const s = textSprite(String(str), color, size);
  let dx = x;
  if (align === 'center') dx = x - s.width / 2;
  else if (align === 'right') dx = x - s.width;
  dx = Math.round(dx);
  const dy = Math.round(y);
  if (shadow) ctx.drawImage(textSprite(String(str), shadow, size), dx + shadowOffset, dy + shadowOffset);
  if (outline) {
    const o = textSprite(String(str), outline, size);
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.drawImage(o, dx + ox, dy + oy);
  }
  ctx.drawImage(s, dx, dy);
}

// Call after the web font finishes loading so cached fallback-font text is re-rendered.
export function clearTextCache() {
  cache.clear();
}
