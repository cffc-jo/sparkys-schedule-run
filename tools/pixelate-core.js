// Logo → 8-bit pixel art. Pure functions on RGBA images ({ width, height, data: Uint8ClampedArray }),
// shared by the Node script (tools/pixelate-logos.js) and the browser contact sheet
// (tools/logo-preview.html), so both produce identical results.
//
// Steps: trim transparent padding → centre on a square → downscale → reduce to the logo's own
// 8-12 main colours → snap alpha to on/off → optional 1px dark outline.
// Note: downscaling defaults to area-averaging rather than pure nearest-neighbour: from a 3x
// source, nearest-neighbour drops thin lines and lettering. Colours are still snapped to the
// logo's palette afterwards, so the result is hard-edged pixel art either way (--resample nearest
// switches back).

export const DEFAULTS = {
  size: 24,           // output size (px). Matches GAME.obstacles.logoSize
  colors: 10,         // max colours per logo (taken from the logo itself)
  outline: true,      // 1px dark outline around the shape (drawn inside `size`)
  outlineColor: [0x16, 0x00, 0x08], // Dark Navy
  alphaCutoff: 128,   // alpha >= this becomes fully opaque
  resample: 'area',   // 'area' (averages, keeps thin details) or 'nearest' (raw nearest-neighbour)
};

function makeImage(width, height) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

// 1. Crop to the bounding box of visible pixels.
export function trim(img, threshold = 16) {
  const { width: w, height: h, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return img; // fully transparent: leave as is
  const out = makeImage(x1 - x0 + 1, y1 - y0 + 1);
  for (let y = 0; y < out.height; y++) {
    const src = ((y + y0) * w + x0) * 4;
    out.data.set(data.subarray(src, src + out.width * 4), y * out.width * 4);
  }
  return out;
}

// 2. Centre on a transparent square canvas.
export function squarePad(img) {
  const s = Math.max(img.width, img.height);
  const out = makeImage(s, s);
  const ox = Math.floor((s - img.width) / 2);
  const oy = Math.floor((s - img.height) / 2);
  for (let y = 0; y < img.height; y++) {
    out.data.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), ((y + oy) * s + ox) * 4);
  }
  return out;
}

// 3. Downscale a square image to n x n.
export function downscale(img, n, mode = 'area') {
  const out = makeImage(n, n);
  const s = img.width;
  const scale = s / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const o = (y * n + x) * 4;
      if (mode === 'nearest') {
        const sx = Math.min(s - 1, Math.floor((x + 0.5) * scale));
        const sy = Math.min(s - 1, Math.floor((y + 0.5) * scale));
        const i = (sy * s + sx) * 4;
        out.data.set(img.data.subarray(i, i + 4), o);
        continue;
      }
      // Area average with premultiplied alpha (so transparent edges don't darken colours)
      const sx0 = Math.floor(x * scale), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * scale));
      const sy0 = Math.floor(y * scale), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * scale));
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let yy = sy0; yy < sy1; yy++) {
        for (let xx = sx0; xx < sx1; xx++) {
          const i = (yy * s + xx) * 4;
          const al = img.data[i + 3];
          r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al;
          count++;
        }
      }
      if (a > 0) {
        out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a;
      }
      out.data[o + 3] = a / count;
    }
  }
  return out;
}

// 4. Palette = the logo's own most-used colours, read from the full-resolution source so the
// anti-aliased in-between shades on edges never make the cut. Colours closer than `minDistance`
// to one already chosen are merged; tiny accents under `minShare` of the logo are dropped.
export function buildPalette(img, maxColors, alphaCutoff, { minDistance = 48, minShare = 0.004 } = {}) {
  const buckets = new Map(); // 4 bits per channel
  const step = Math.max(1, Math.floor((img.width * img.height) / 250000)); // sample big images
  let total = 0;
  for (let p = 0; p < img.width * img.height; p += step) {
    const i = p * 4;
    if (img.data[i + 3] < alphaCutoff) continue;
    const key = ((img.data[i] >> 4) << 8) | ((img.data[i + 1] >> 4) << 4) | (img.data[i + 2] >> 4);
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { n: 0, r: 0, g: 0, b: 0 }));
    b.n++; b.r += img.data[i]; b.g += img.data[i + 1]; b.b += img.data[i + 2];
    total++;
  }
  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n);
  const palette = [];
  for (const b of ranked) {
    if (palette.length >= maxColors || b.n < total * minShare) break;
    const c = [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)];
    const close = palette.some((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) < minDistance);
    if (!close) palette.push(c);
  }
  return palette;
}

function nearest(palette, r, g, b) {
  let best = palette[0], bestD = Infinity;
  for (const p of palette) {
    const dr = r - p[0], dg = g - p[1], db = b - p[2];
    const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

// 4 + 5. Map every pixel to the palette and snap alpha to fully on / fully off.
export function quantize(img, palette, alphaCutoff) {
  const out = makeImage(img.width, img.height);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < alphaCutoff || !palette.length) continue;
    const p = nearest(palette, img.data[i], img.data[i + 1], img.data[i + 2]);
    out.data[i] = p[0]; out.data[i + 1] = p[1]; out.data[i + 2] = p[2]; out.data[i + 3] = 255;
  }
  return out;
}

// 6. 1px outline on transparent pixels that touch the shape.
export function addOutline(img, rgb) {
  const { width: w, height: h } = img;
  const out = { width: w, height: h, data: new Uint8ClampedArray(img.data) };
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && img.data[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        const i = (y * w + x) * 4;
        out.data[i] = rgb[0]; out.data[i + 1] = rgb[1]; out.data[i + 2] = rgb[2]; out.data[i + 3] = 255;
      }
    }
  }
  return out;
}

// Place an n x n image in the middle of a size x size transparent canvas.
function center(img, size) {
  const out = makeImage(size, size);
  const o = Math.floor((size - img.width) / 2);
  for (let y = 0; y < img.height; y++) {
    out.data.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), ((y + o) * size + o) * 4);
  }
  return out;
}

export function pixelateLogo(src, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const inner = o.outline ? o.size - 2 : o.size; // leave room for the outline inside `size`
  const square = squarePad(trim(src));
  const small = downscale(square, inner, o.resample);
  const palette = buildPalette(square, o.colors, o.alphaCutoff);
  let out = center(quantize(small, palette, o.alphaCutoff), o.size);
  if (o.outline) out = addOutline(out, o.outlineColor);
  return { image: out, palette };
}
