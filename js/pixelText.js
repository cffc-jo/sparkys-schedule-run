// Crisp bitmap text on the canvas. Each string is rendered once with "Press Start 2P", then cached.
// The font is designed on an 8x8 pixel grid, but the browser's own rasteriser smears its thin
// diagonals at 8px (M and W turn into solid blocks). So at multiples of 8px each glyph is drawn
// from its true pixel design instead: rendered once at 64px and sampled per design pixel.
// Other sizes fall back to fillText with the alpha snapped to on/off.
const FONT = '"Press Start 2P", monospace';
const GRID = 8;   // design pixels per glyph cell
const ROWS = 10;  // rows sampled (glyph + room for punctuation that dips below)
const cache = new Map();
const glyphs = new Map();

// Lighter M and W than the font's own: its full-width middle rows read as heavy blocks at 8px.
const GLYPH_OVERRIDES = {
  M: ['##...##', '###.###', '##.#.##', '##.#.##', '##...##', '##...##', '##...##'],
  W: ['##...##', '##...##', '##...##', '##.#.##', '##.#.##', '###.###', '##...##'],
};

// A glyph's design pixels: ROWS strings of '#' / '.'
function glyph(ch) {
  let g = glyphs.get(ch);
  if (g) return g;
  if (GLYPH_OVERRIDES[ch]) {
    g = [...GLYPH_OVERRIDES[ch]];
  } else {
    const k = 8; // sample scale: one design pixel = 8x8 px
    const c = document.createElement('canvas');
    c.width = GRID * k * 2;
    c.height = ROWS * k;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.font = `${GRID * k}px ${FONT}`;
    x.textBaseline = 'top';
    x.fillStyle = '#000';
    x.fillText(ch, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const cols = Math.min(GRID * 2, Math.max(1, Math.round(x.measureText(ch).width / k)));
    g = [];
    for (let gy = 0; gy < ROWS; gy++) {
      let row = '';
      for (let gx = 0; gx < cols; gx++) row += d[(((gy * k + k / 2) * c.width) + gx * k + k / 2) * 4 + 3] >= 128 ? '#' : '.';
      g.push(row);
    }
  }
  while (g.length < ROWS) g.push('');
  glyphs.set(ch, g);
  return g;
}

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
  if (size % GRID === 0) {
    const k = size / GRID;
    chars.forEach((ch, i) => glyph(ch).forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) if (row[gx] === '#') x.fillRect(xs[i] + gx * k, gy * k, k, k);
    }));
  } else {
    chars.forEach((ch, i) => x.fillText(ch, xs[i], 0));
  }

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
  glyphs.clear();
}
