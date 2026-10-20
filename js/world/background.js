// Daytime match backdrop: sky, sun and clouds, two-layer Chicago skyline, red pitch-side LED
// boards and a mowed grass pitch. Layers are pre-rendered and scrolled with parallax.
// The sky, clouds and pitch follow the seasons (setSeason), crossfading over a couple of seconds,
// with light weather on top: snow in winter, petals in spring, leaves in fall.
import { PALETTE as P, SEASONS } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { textSprite } from '../pixelText.js';
import { decorSprites } from '../art/decorArt.js';

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

const S = SEASONS.summer; // the skyline is the same all year
const FADE_SECONDS = 2;
const MAX_FLAKES = 420;
// Pitch-side props (snowmen, leaf piles, jack-o'-lanterns): one possible prop per slot along
// the far side of the pitch, behind Sparky's running line.
const DECOR_SLOT = 72;                      // px between slots
const DECOR_BASE = PITCH_TOP + 26;          // props stand here (feet)

// Deterministic 0..1 noise per slot so props are the same every run
function slotNoise(k, salt) {
  let h = (k * 374761393 + salt * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function buildSky(S) {
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

function buildCloud(r, w, h, S) {
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

// Cloud positions are shared by every season; only their colours change.
function cloudLayout() {
  const r = rng(42);
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const w = 30 + Math.floor(r() * 30);
    const h = 12 + Math.floor(r() * 8);
    clouds.push({ w, h, seed: Math.floor(r() * 1e9), x: r() * (W + 80), y: 20 + Math.floor(r() * 140), speed: 4 + r() * 6 });
  }
  return clouds;
}

function buildCloudImages(layout, S) {
  return layout.map((cl) => buildCloud(rng(cl.seed), cl.w, cl.h, S));
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
function buildGroundTile(S) {
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
    x.fillStyle = S.LINE || P.WHITE; // far touchline
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
  // Seasonal specks: snow patches, spring flowers, fallen leaves
  if (S.SPECKS.length) {
    const r = rng(9);
    for (let i = 0; i < 9; i++) {
      const sx = Math.floor(r() * (tw - 2));
      const sy = 3 + Math.floor(r() * (th - 6));
      if (sy >= run + 17 && sy <= run + 20) continue; // keep the touchline clean
      x.fillStyle = S.SPECKS[i % S.SPECKS.length];
      x.fillRect(sx, sy, S === SEASONS.winter ? 2 : 1, 1);
    }
  }
  return c;
}

const BOARD_TEXT = '  CHICAGO FIRE FC  ·  SPARKY\'S SCHEDULE RUN  ·  ';

export function createBackground({ reducedMotion = () => false } = {}) {
  const clouds = cloudLayout();
  const farCity = buildFarCity();
  const nearCity = buildNearCity();
  const looks = {}; // season -> { sky, clouds[], ground }, built on first use
  const look = (name) => looks[name] || (looks[name] = {
    sky: buildSky(SEASONS[name]),
    clouds: buildCloudImages(clouds, SEASONS[name]),
    ground: buildGroundTile(SEASONS[name]),
  });
  const ground = look('summer').ground; // tile size is the same for every season
  const state = { far: 0, near: 0, groundX: 0, boardX: 0, travel: 0 };
  let season = 'summer';
  let october = false;      // jack-o'-lanterns in October (fall only)
  let prevOctober = false;
  let prevSeason = null; // fading out
  let fade = 1;          // 0..1 progress of the current crossfade
  let flakes = [];       // weather particles
  let spawnAcc = 0;

  function drawLayer(ctx, name, alpha) {
    const l = look(name);
    ctx.globalAlpha = alpha;
    ctx.drawImage(l.sky, 0, 0);
    clouds.forEach((cl, i) => ctx.drawImage(l.clouds[i], Math.round(cl.x), cl.y));
    ctx.globalAlpha = 1;
  }

  function drawGround(ctx, name, alpha) {
    const tile = look(name).ground;
    ctx.globalAlpha = alpha;
    const gx = Math.floor(state.groundX);
    for (let x = -gx; x < W; x += tile.width) ctx.drawImage(tile, x, PITCH_TOP);
    ctx.globalAlpha = 1;
  }

  function decorList(name, oct) {
    const s = SEASONS[name];
    return (oct && s.DECOR_OCTOBER) ? s.DECOR_OCTOBER : s.DECOR;
  }

  function drawDecor(ctx, list, alpha) {
    if (!list.length || alpha <= 0) return;
    const sprites = decorSprites();
    ctx.globalAlpha = alpha;
    const first = Math.floor((state.travel - 40) / DECOR_SLOT);
    for (let k = first; k * DECOR_SLOT - state.travel < W + 40; k++) {
      const roll = slotNoise(k, 1);
      let acc = 0;
      let pick = null;
      for (const [name, chance] of list) {
        acc += chance;
        if (roll < acc) { pick = name; break; }
      }
      if (!pick) continue;
      const img = sprites[pick];
      const x = Math.round(k * DECOR_SLOT + slotNoise(k, 2) * (DECOR_SLOT - 30) - state.travel);
      ctx.drawImage(img, x, DECOR_BASE - img.height);
      // A second pumpkin or snowman now and then, for little groups
      if (pick !== 'leafPile' && slotNoise(k, 3) < 0.3) ctx.drawImage(img, x + img.width + 2, DECOR_BASE - img.height + 2);
    }
    ctx.globalAlpha = 1;
  }

  function spawnFlake(w, y) {
    flakes.push({
      kind: w.kind,
      x: Math.random() * (W + 60),
      y,
      vy: w.kind === 'snow' ? 34 + Math.random() * 26 : 42 + Math.random() * 24,
      vx: w.kind === 'snow' ? -6 - Math.random() * 8 : -16 - Math.random() * 16,
      phase: Math.random() * 6.28,
      color: w.colors[Math.floor(Math.random() * w.colors.length)],
      size: w.kind === 'snow' && Math.random() < 0.35 ? 2 : 1,
    });
  }

  // Fill the whole sky at once (so a new season doesn't start with an empty sky)
  function prefillWeather() {
    const w = SEASONS[season].WEATHER;
    if (!w || reducedMotion()) return;
    const count = Math.min(MAX_FLAKES, Math.round(w.rate * (H / 45)));
    for (let i = 0; i < count && flakes.length < MAX_FLAKES; i++) spawnFlake(w, Math.random() * H);
  }

  function updateWeather(dt, speed) {
    const w = SEASONS[season].WEATHER;
    if (w && !reducedMotion()) {
      spawnAcc += w.rate * dt;
      while (spawnAcc >= 1 && flakes.length < MAX_FLAKES) {
        spawnAcc -= 1;
        spawnFlake(w, -4);
      }
    }
    for (const f of flakes) {
      f.phase += dt * (f.kind === 'snow' ? 2 : 3.5);
      f.x += (f.vx - speed * 0.35 + Math.sin(f.phase) * (f.kind === 'snow' ? 8 : 18)) * dt;
      f.y += f.vy * dt;
    }
    flakes = flakes.filter((f) => f.y < H && f.x > -10);
  }

  const wrap = (v, m) => ((v % m) + m) % m;

  return {
    // speed: world scroll speed in px/s (0 on menus). boardSpeed scrolls the LED text independently.
    update(dt, speed, boardSpeed = GAME.world.titleBoardSpeed) {
      state.far = wrap(state.far + speed * 0.06 * dt, farCity.width);
      state.near = wrap(state.near + speed * 0.14 * dt, nearCity.width);
      state.groundX = wrap(state.groundX + speed * dt, ground.width);
      state.travel += speed * dt;
      state.boardX += (boardSpeed + speed) * dt;
      for (const cl of clouds) {
        cl.x -= (cl.speed + speed * 0.03) * dt;
        if (cl.x < -cl.w) cl.x += W + cl.w + 40;
      }
      if (fade < 1) {
        fade = Math.min(1, fade + dt / FADE_SECONDS);
        if (fade >= 1) prevSeason = null;
      }
      updateWeather(dt, speed);
    },

    // Switch to 'winter' | 'spring' | 'summer' | 'fall' (`isOctober` adds jack-o'-lanterns in fall).
    // Crossfades unless `instant`.
    setSeason(name, { instant = false, isOctober = false } = {}) {
      if (!SEASONS[name] || (name === season && isOctober === october)) return;
      if (instant || reducedMotion()) {
        prevSeason = null;
        fade = 1;
        flakes = [];
      } else {
        prevSeason = season;
        prevOctober = october;
        fade = 0;
      }
      season = name;
      october = isOctober;
      prefillWeather();
      look(name); // make sure it's built before it's drawn
    },
    get season() { return season; },
    // Current scenery colours (e.g. for shadows on the grass)
    get scenery() { return SEASONS[season]; },

    render(ctx) {
      if (prevSeason) {
        drawLayer(ctx, prevSeason, 1);
        drawLayer(ctx, season, fade);
      } else {
        drawLayer(ctx, season, 1);
      }

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
      if (prevSeason) {
        drawGround(ctx, prevSeason, 1);
        drawGround(ctx, season, fade);
      } else {
        drawGround(ctx, season, 1);
      }

      // Pitch-side props for the season, fading with it
      if (prevSeason) drawDecor(ctx, decorList(prevSeason, prevOctober), 1 - fade);
      drawDecor(ctx, decorList(season, october), prevSeason ? fade : 1);

      // Weather (snow / petals / leaves), drifting with the wind and the run. Leaves tumble.
      for (const f of flakes) {
        ctx.fillStyle = f.color;
        if (f.kind === 'leaf') {
          const flip = Math.sin(f.phase * 1.7) > 0;
          ctx.fillRect(Math.round(f.x), Math.round(f.y), flip ? 3 : 2, flip ? 1 : 2);
        } else {
          ctx.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size);
        }
      }
    },

    get groundY() { return GROUND; },
  };
}
