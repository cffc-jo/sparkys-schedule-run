// Daytime match backdrop: sky, sun and clouds, two-layer Chicago skyline, red pitch-side LED
// boards and a mowed grass pitch. Layers are pre-rendered once and scrolled with parallax.
import { PALETTE as P, SCENERY as S } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { textSprite } from '../pixelText.js';

const W = GAME.view.width;
const H = GAME.view.height;
const GROUND = GAME.world.groundY;
const BOARD_H = 16;
const BOARD_TOP = GROUND - GAME.world.pitchDepth - BOARD_H; // boards sit behind a strip of pitch, so Sparky runs in front of them
const PITCH_TOP = BOARD_TOP + BOARD_H;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Small deterministic RNG so the scenery is identical every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Ordered 2x2 dither between two colours: t in 0..1 is how much of `b` shows.
function ditherOn(x, y, t) {
  const m = [[0, 0.5], [0.75, 0.25]][y % 2][x % 2];
  return t > m;
}

function buildSky() {
  const h = BOARD_TOP;
  const c = makeCanvas(W, h);
  const x = c.getContext('2d');
  const bands = [
    { from: S.SKY_TOP, to: S.SKY_MID, y0: 0, y1: 150 },
    { from: S.SKY_MID, to: S.SKY_LOW, y0: 150, y1: h },
  ];
  for (const b of bands) {
    for (let y = b.y0; y < b.y1; y++) {
      const t = (y - b.y0) / (b.y1 - b.y0);
      for (let px = 0; px < W; px++) {
        x.fillStyle = ditherOn(px, y, Math.round(t * 4) / 4) ? b.to : b.from;
        x.fillRect(px, y, 1, 1);
      }
    }
  }
  // Sun
  const cx = 34, cy = 40;
  for (let y = -11; y <= 11; y++) {
    for (let px = -11; px <= 11; px++) {
      const d = Math.sqrt(px * px + y * y);
      if (d <= 9) x.fillStyle = S.SUN;
      else if (d <= 10.5) x.fillStyle = S.SUN_EDGE;
      else continue;
      x.fillRect(cx + px, cy + y, 1, 1);
    }
  }
  return c;
}

function buildCloud(r, w, h) {
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const puffs = [];
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const pr = h * (0.3 + r() * 0.2);
    puffs.push({ x: pr + (w - pr * 2) * (i / (n - 1)), y: h - pr - 1 - r() * (h * 0.25), r: pr });
  }
  for (let y = 0; y < h; y++) {
    for (let px = 0; px < w; px++) {
      const inside = puffs.some((p) => (px - p.x) ** 2 + (y - p.y) ** 2 <= p.r * p.r) || (y >= h - 4 && px > 3 && px < w - 4);
      if (!inside) continue;
      x.fillStyle = y >= h - 3 ? S.CLOUD_SHADE : S.CLOUD;
      x.fillRect(px, y, 1, 1);
    }
  }
  return c;
}

function buildClouds() {
  const r = rng(42);
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const w = 30 + Math.floor(r() * 30);
    clouds.push({ img: buildCloud(r, w, 12 + Math.floor(r() * 8)), x: r() * (W + 80), y: 20 + Math.floor(r() * 140), speed: 4 + r() * 6 });
  }
  return clouds;
}

function windows(x, r, bx, top, bw, base, color, density) {
  x.fillStyle = color;
  for (let wy = top + 4; wy < base - 4; wy += 4) {
    for (let wx = bx + 2; wx < bx + bw - 2; wx += 3) {
      if (r() < density) x.fillRect(wx, wy, 1, 2);
    }
  }
}

function buildFarCity() {
  const w = W * 2, h = 130;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const r = rng(77);
  let bx = 0;
  while (bx < w) {
    const bw = 12 + Math.floor(r() * 20);
    const bh = 50 + Math.floor(r() * 70);
    x.fillStyle = S.CITY_FAR;
    x.fillRect(bx, h - bh, bw, bh);
    windows(x, r, bx, h - bh, bw, h, S.CITY_FAR_WIN, 0.35);
    bx += bw;
  }
  return c;
}

function buildNearCity() {
  const w = W * 2, h = 170;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const r = rng(1871);
  const base = h;

  const block = (bx, bw, bh, col = S.CITY_NEAR, win = S.CITY_NEAR_WIN) => {
    x.fillStyle = col;
    x.fillRect(bx, base - bh, bw, bh);
    windows(x, r, bx, base - bh, bw, base, win, 0.3);
  };

  let bx = 0;
  while (bx < w) {
    const bw = 10 + Math.floor(r() * 18);
    const bh = 24 + Math.floor(r() * 50);
    block(bx, bw, bh);
    if (r() < 0.25) { x.fillStyle = S.CITY_NEAR; x.fillRect(bx + Math.floor(bw / 2), base - bh - 6, 1, 6); }
    bx += bw + (r() < 0.3 ? 3 : 0);
  }

  // Willis Tower: stepped tiers with twin antennas
  const wx = 150;
  block(wx, 26, 118, S.CITY_DARK, S.CITY_NEAR);
  block(wx + 4, 18, 134, S.CITY_DARK, S.CITY_NEAR);
  block(wx + 8, 12, 146, S.CITY_DARK, S.CITY_NEAR);
  x.fillStyle = S.CITY_DARK;
  x.fillRect(wx + 9, base - 164, 1, 18);
  x.fillRect(wx + 17, base - 164, 1, 18);

  // John Hancock Center: tapered with antennas and X-bracing
  const hx = 390;
  for (let i = 0; i < 128; i++) {
    const inset = Math.floor(i / 22);
    x.fillStyle = S.CITY_DARK;
    x.fillRect(hx + inset, base - 1 - i, 26 - inset * 2, 1);
  }
  x.fillStyle = S.CITY_NEAR;
  for (let i = 8; i < 124; i += 10) x.fillRect(hx + 4 + Math.floor(i / 22), base - i, 18 - Math.floor(i / 22) * 2, 1);
  x.fillStyle = S.CITY_DARK;
  x.fillRect(hx + 9, base - 150, 1, 22);
  x.fillRect(hx + 16, base - 150, 1, 22);

  // Aircraft warning lights
  x.fillStyle = P.FIRE_RED;
  for (const lx of [wx + 9, wx + 17]) x.fillRect(lx, base - 165, 1, 1);
  for (const lx of [hx + 9, hx + 16]) x.fillRect(lx, base - 151, 1, 1);
  return c;
}

// Mowed pitch tile from the foot of the boards to the bottom of the screen.
// Sparky's running line (GROUND) is part-way down, so grass shows behind his legs.
function buildGroundTile() {
  const tw = 32;
  const th = H - PITCH_TOP;
  const run = GROUND - PITCH_TOP; // running line, relative to the tile
  const c = makeCanvas(tw, th);
  const x = c.getContext('2d');
  for (let px = 0; px < tw; px++) {
    const stripe = px < 16 ? S.GRASS_A : S.GRASS_B;
    x.fillStyle = S.GRASS_DARK; // shadow under the boards
    x.fillRect(px, 0, 1, 2);
    x.fillStyle = stripe;
    x.fillRect(px, 2, 1, run + 16);
    x.fillStyle = P.WHITE; // far touchline
    x.fillRect(px, 6, 1, 1);
    x.fillRect(px, run + 18, 1, 2); // near touchline, just in front of Sparky
    // Pitch-side strip: darker stripes, fading slightly toward the bottom edge
    const near = px < 16 ? S.GRASS_B : S.GRASS_DARK;
    for (let y = run + 20; y < th; y++) {
      const t = Math.min(1, (y - run - 20) / 40) * 0.5;
      x.fillStyle = ditherOn(px, y, t) ? S.GRASS_DEEP : near;
      x.fillRect(px, y, 1, 1);
    }
  }
  // Grass tufts
  x.fillStyle = S.GRASS_TIP;
  for (const [tx, ty] of [[3, 14], [19, 22], [9, 30], [27, 11], [14, run + 6], [30, run + 2]]) {
    x.fillRect(tx, ty, 1, 1);
    x.fillRect(tx + 2, ty, 1, 1);
    x.fillRect(tx + 1, ty - 1, 1, 1);
  }
  return c;
}

const BOARD_TEXT = '  CHICAGO FIRE FC  ·  SPARKY\'S SCHEDULE RUN  ·  ';

export function createBackground() {
  const sky = buildSky();
  const clouds = buildClouds();
  const farCity = buildFarCity();
  const nearCity = buildNearCity();
  const ground = buildGroundTile();
  const state = { far: 0, near: 0, groundX: 0, boardX: 0 };

  const wrap = (v, m) => ((v % m) + m) % m;

  return {
    // speed: world scroll speed in px/s (0 on menus). boardSpeed scrolls the LED text independently.
    update(dt, speed, boardSpeed = GAME.world.titleBoardSpeed) {
      state.far = wrap(state.far + speed * 0.06 * dt, farCity.width);
      state.near = wrap(state.near + speed * 0.14 * dt, nearCity.width);
      state.groundX = wrap(state.groundX + speed * dt, ground.width);
      state.boardX += (boardSpeed + speed) * dt;
      for (const cl of clouds) {
        cl.x -= (cl.speed + speed * 0.03) * dt;
        if (cl.x < -cl.img.width) cl.x += W + cl.img.width + 40;
      }
    },

    render(ctx) {
      ctx.drawImage(sky, 0, 0);
      for (const cl of clouds) ctx.drawImage(cl.img, Math.round(cl.x), cl.y);

      const fx = Math.floor(state.far);
      ctx.drawImage(farCity, -fx, BOARD_TOP - farCity.height);
      ctx.drawImage(farCity, farCity.width - fx, BOARD_TOP - farCity.height);
      const nx = Math.floor(state.near);
      ctx.drawImage(nearCity, -nx, BOARD_TOP - nearCity.height);
      ctx.drawImage(nearCity, nearCity.width - nx, BOARD_TOP - nearCity.height);

      // Pitch-side LED boards
      ctx.fillStyle = P.RED;
      ctx.fillRect(0, BOARD_TOP, W, BOARD_H);
      ctx.fillStyle = P.DARK_RED;
      ctx.fillRect(0, BOARD_TOP, W, 2);
      ctx.fillStyle = P.FIRE_RED;
      ctx.fillRect(0, BOARD_TOP + 2, W, 1);
      const label = textSprite(BOARD_TEXT, P.WHITE, 8);
      const off = Math.floor(state.boardX % label.width);
      for (let lx = -off; lx < W; lx += label.width) ctx.drawImage(label, lx, BOARD_TOP + 5);

      // Grass
      const gx = Math.floor(state.groundX);
      for (let x = -gx; x < W; x += ground.width) ctx.drawImage(ground, x, PITCH_TOP);
    },

    get groundY() { return GROUND; },
  };
}
