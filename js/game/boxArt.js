// Pre-rendered obstacle art: "?"-block style logo boxes and the plain crate under tall boxes.
// HOME boxes have a solid red frame; AWAY boxes a dashed sky-blue frame (shape + colour, not colour alone).
import { PALETTE as P } from '../../config/palette.js';
import { textSprite } from '../pixelText.js';

const cache = new Map();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Short label for the logo-missing fallback: up to 3 chars per line, max 2 lines.
export function abbrevLines(code) {
  const c = String(code || '?').toUpperCase();
  if (c.length <= 3) return [c];
  if (c.endsWith('FC') && c.length <= 5) return [c.slice(0, -2), 'FC'];
  return [c.slice(0, 3), c.slice(3, 6)];
}

export function logoBox(match, logoImg, size, logoSize) {
  const home = String(match.homeAway).toUpperCase() === 'HOME';
  const key = `${match.code}|${home}|${logoImg ? 1 : 0}|${size}`;
  if (cache.has(key)) return cache.get(key);

  const c = canvas(size, size);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  // Outline
  x.fillStyle = P.DARK_NAVY;
  x.fillRect(0, 0, size, size);
  // Frame
  const main = home ? P.RED : P.FLAG_BLUE;
  const alt = home ? P.RED : P.DEEP_BLUE;
  const hi = home ? P.FIRE_RED : P.WHITE;
  for (let i = 1; i < size - 1; i++) {
    const seg = Math.floor(i / 3) % 2 === 0 ? main : alt;
    x.fillStyle = seg;
    x.fillRect(i, 1, 1, 2);
    x.fillRect(i, size - 3, 1, 2);
    x.fillRect(1, i, 2, 1);
    x.fillRect(size - 3, i, 2, 1);
  }
  x.fillStyle = hi;
  x.fillRect(1, 1, size - 3, 1);
  x.fillRect(1, 1, 1, size - 3);
  // Rivets
  x.fillStyle = P.DARK_NAVY;
  for (const [rx, ry] of [[2, 2], [size - 3, 2], [2, size - 3], [size - 3, size - 3]]) x.fillRect(rx, ry, 1, 1);
  // Logo panel
  const inset = (size - logoSize) / 2;
  x.fillStyle = P.WHITE;
  x.fillRect(inset, inset, logoSize, logoSize);
  if (logoImg) {
    x.drawImage(logoImg, inset, inset, logoSize, logoSize);
  } else {
    const lines = abbrevLines(match.code);
    const lh = 9;
    const top = inset + Math.round((logoSize - lines.length * lh) / 2) + 1;
    lines.forEach((line, i) => {
      const t = textSprite(line, P.NAVY, 8, 0); // no extra spacing: 3 letters fill the 24px panel
      x.drawImage(t, Math.round(inset + (logoSize - t.width) / 2), top + i * lh);
    });
  }
  cache.set(key, c);
  return c;
}

export function crate(w, h) {
  const key = `crate|${w}|${h}`;
  if (cache.has(key)) return cache.get(key);
  const c = canvas(w, h);
  const x = c.getContext('2d');
  x.fillStyle = P.DARK_NAVY;
  x.fillRect(0, 0, w, h);
  x.fillStyle = P.DEEP_RED;
  x.fillRect(1, 1, w - 2, h - 2);
  // Planks
  x.fillStyle = P.DARK_RED;
  for (let y = 11; y < h - 2; y += 11) x.fillRect(1, y, w - 2, 1);
  // Cross brace
  x.fillStyle = P.RED;
  for (let i = 0; i < h - 6; i++) {
    const px = Math.round(3 + (i * (w - 8)) / (h - 7));
    x.fillRect(px, 3 + i, 2, 1);
    x.fillRect(w - 5 - (px - 3), 3 + i, 2, 1);
  }
  // Highlight edge
  x.fillStyle = P.RED;
  x.fillRect(1, 1, w - 2, 1);
  x.fillRect(1, 1, 1, h - 2);
  cache.set(key, c);
  return c;
}
