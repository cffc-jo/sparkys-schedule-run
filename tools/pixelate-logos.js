#!/usr/bin/env node
// Turns every high-res club logo in assets/logos-source/ into an 8-bit version in assets/logos/.
// Re-runnable: overwrites the outputs each time.
//
//   npm install            (once, installs sharp)
//   npm run logos          (or: node tools/pixelate-logos.js)
//
// Options:  --size 48  --colors 16  --no-outline  --resample nearest|detail
// Per-club tweaks (e.g. MIA uses 'detail' resampling) live in OVERRIDES in tools/pixelate-core.js.
// Source naming: <CODE>@3x.png (e.g. NYC@3x.png, CLB_2@3x.png). Output: assets/logos/<CODE>.png
// CHI (our crest) is also exported larger as assets/logos/CHI.png for the title and finish line.
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { pixelateLogo, DEFAULTS, OVERRIDES } from './pixelate-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'assets', 'logos-source');
const outDir = path.join(root, 'assets', 'logos');
const CREST_SIZE = 88; // CHI crest: 44 logical px x renderScale 2, for the title screen and the goal

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--size') o.size = Number(argv[++i]);
    else if (a === '--colors') o.colors = Number(argv[++i]);
    else if (a === '--no-outline') o.outline = false;
    else if (a === '--resample') o.resample = argv[++i];
  }
  return o;
}

async function readRgba(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) };
}

async function writePng(img, file) {
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), {
    raw: { width: img.width, height: img.height, channels: 4 },
  }).png({ palette: false }).toFile(file);
}

async function main() {
  const opts = { ...DEFAULTS, ...parseArgs(process.argv.slice(2)) };
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir)).filter((f) => /\.(png|webp|jpe?g|svg)$/i.test(f));
  if (!files.length) {
    console.error(`No logos found in ${srcDir}. Add <CODE>@3x.png files and run again.`);
    process.exit(1);
  }
  let ok = 0;
  for (const f of files.sort()) {
    const code = path.basename(f, path.extname(f)).replace(/@\dx$/i, '').toUpperCase();
    try {
      const src = await readRgba(path.join(srcDir, f));
      const size = code === 'CHI' ? CREST_SIZE : opts.size;
      const colors = opts.colors;
      const { image, palette } = pixelateLogo(src, { ...opts, size, colors, ...(OVERRIDES[code] || {}) });
      await writePng(image, path.join(outDir, `${code}.png`));
      console.log(`${code.padEnd(6)} ${src.width}x${src.height} -> ${size}x${size}, ${palette.length} colours`);
      ok++;
    } catch (err) {
      console.error(`${code}: FAILED (${err.message})`);
    }
  }
  console.log(`\nDone: ${ok}/${files.length} logos written to assets/logos/. Review them in tools/logo-preview.html`);
}

main();
