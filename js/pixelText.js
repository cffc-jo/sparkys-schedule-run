// Crisp bitmap text on the canvas. Each string is rendered once with "Press Start 2P", its alpha
// snapped to on/off (no anti-aliased fringe in off-palette colours), then cached.
const FONT = '"Press Start 2P", monospace';
const cache = new Map();

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Extra pixels between letters. Small text gets a 1px gap so letters never touch.
export function defaultSpacing(size) {
  return size < 16 ? 1 : 0;
}

export function textSprite(str, color, size = 8, spacing = defaultSpacing(size)) {
  const key = size + '|' + spacing + '|' + color + '|' + str;
  let c = cache.get(key);
  if (c) return c;

  c = document.createElement('canvas');
  const x = c.getContext('2d', { willReadFrequently: true });
  x.font = `${size}px ${FONT}`;
  // Lay out each character on a whole-pixel position so glyph edges stay sharp.
  const chars = [...str];
  const xs = [];
  let w = 0;
  for (const ch of chars) {
    xs.push(w);
    w += Math.round(x.measureText(ch).width) + spacing;
  }
  c.width = Math.max(1, w - spacing);
  c.height = Math.ceil(size * 1.25);
  x.font = `${size}px ${FONT}`;
  x.textBaseline = 'top';
  x.fillStyle = color;
  chars.forEach((ch, i) => x.fillText(ch, xs[i], 0));

  const img = x.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const [r, g, b] = hexToRgb(color);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] >= 128) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
    else d[i + 3] = 0;
  }
  x.putImageData(img, 0, 0);
  cache.set(key, c);
  return c;
}

export function textWidth(str, size = 8, spacing = defaultSpacing(size)) {
  return textSprite(str, '#FFFFFF', size, spacing).width;
}

// Draw text at (x, y) = top edge. align: 'left' | 'center' | 'right'.
// shadow: colour of a 1px (or `shadowOffset`) drop shadow down-right.
// outline: colour of a 1px outline all round (keeps text readable over busy scenery).
// spacing: extra px between letters (defaults to 1 for small text).
export function drawText(ctx, str, x, y, { color = '#FFFFFF', size = 8, align = 'left', shadow = null, shadowOffset = 1, outline = null, spacing = defaultSpacing(size) } = {}) {
  const s = textSprite(String(str), color, size, spacing);
  let dx = x;
  if (align === 'center') dx = x - s.width / 2;
  else if (align === 'right') dx = x - s.width;
  dx = Math.round(dx);
  const dy = Math.round(y);
  if (shadow) ctx.drawImage(textSprite(String(str), shadow, size, spacing), dx + shadowOffset, dy + shadowOffset);
  if (outline) {
    const o = textSprite(String(str), outline, size, spacing);
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.drawImage(o, dx + ox, dy + oy);
  }
  ctx.drawImage(s, dx, dy);
}

// Call after the web font finishes loading so cached fallback-font text is re-rendered.
export function clearTextCache() {
  cache.clear();
}
