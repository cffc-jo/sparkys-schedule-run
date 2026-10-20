// Night-match backdrop: sky + stars, Chicago skyline, pitch-side LED boards and the running track.
// Layers are pre-rendered once and scrolled with parallax.
import { PALETTE as P } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { textSprite } from '../pixelText.js';

const W = GAME.view.width;
const H = GAME.view.height;
const GROUND = GAME.world.groundY;
const BOARD_TOP = GROUND - 18;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Small deterministic RNG so the skyline is identical every load.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildSky() {
  const c = makeCanvas(W, BOARD_TOP);
  const x = c.getContext('2d');
  x.fillStyle = P.DEEP_NAVY;
  x.fillRect(0, 0, W, c.height);
  // Dithered transition into navy lower sky
  x.fillStyle = P.NAVY;
  const bandTop = 150;
  for (let y = bandTop; y < c.height; y++) {
    const t = (y - bandTop) / 40;
    for (let px = 0; px < W; px++) {
      const on = t >= 1 || (t > 0.66 ? (px + y) % 2 === 0 || y % 2 === 0 : t > 0.33 ? (px + y) % 2 === 0 : (px % 2 === 0 && y % 2 === 0));
      if (on) x.fillRect(px, y, 1, 1);
    }
  }
  return c;
}

function buildStars() {
  const r = rng(7);
  const stars = [];
  for (let i = 0; i < 38; i++) {
    stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * 170) + 4, phase: r() * Math.PI * 2, big: r() < 0.15 });
  }
  return stars;
}

function buildSkyline() {
  const w = W * 2;
  const h = 170;
  const c = makeCanvas(w, h);
  const x = c.getContext('2d');
  const r = rng(1871);
  const base = h;

  const block = (bx, bw, bh) => {
    x.fillStyle = P.DARK_NAVY;
    x.fillRect(bx, base - bh, bw, bh);
    // Lit windows
    x.fillStyle = P.DEEP_BLUE;
    for (let wy = base - bh + 4; wy < base - 4; wy += 4) {
      for (let wx = bx + 2; wx < bx + bw - 2; wx += 3) {
        if (r() < 0.22) x.fillRect(wx, wy, 1, 2);
      }
    }
  };

  // Generic buildings across the strip
  let bx = 0;
  while (bx < w) {
    const bw = 10 + Math.floor(r() * 18);
    const bh = 30 + Math.floor(r() * 60);
    block(bx, bw, bh);
    if (r() < 0.25) { x.fillStyle = P.DARK_NAVY; x.fillRect(bx + Math.floor(bw / 2), base - bh - 6, 1, 6); }
    bx += bw + (r() < 0.3 ? 2 : 0);
  }

  // Willis Tower: stepped tiers with twin antennas
  const wx = 150;
  block(wx, 26, 118);
  block(wx + 4, 18, 134);
  block(wx + 8, 12, 146);
  x.fillStyle = P.DARK_NAVY;
  x.fillRect(wx + 9, base - 164, 1, 18);
  x.fillRect(wx + 17, base - 164, 1, 18);

  // John Hancock Center: tapered with antennas
  const hx = 390;
  for (let i = 0; i < 128; i++) {
    const inset = Math.floor(i / 22);
    x.fillStyle = P.DARK_NAVY;
    x.fillRect(hx + inset, base - 1 - i, 26 - inset * 2, 1);
  }
  x.fillStyle = P.DEEP_BLUE;
  for (let i = 8; i < 124; i += 10) x.fillRect(hx + 4 + Math.floor(i / 22), base - i, 26 - 8 - Math.floor(i / 22) * 2, 1); // X-bracing hint
  x.fillStyle = P.DARK_NAVY;
  x.fillRect(hx + 9, base - 150, 1, 22);
  x.fillRect(hx + 16, base - 150, 1, 22);
  // Aircraft warning lights
  x.fillStyle = P.FIRE_RED;
  x.fillRect(wx + 9, base - 165, 1, 1);
  x.fillRect(wx + 17, base - 165, 1, 1);
  x.fillRect(hx + 9, base - 151, 1, 1);
  x.fillRect(hx + 16, base - 151, 1, 1);
  return c;
}

function buildGroundTile() {
  const tw = 32;
  const c = makeCanvas(tw, H - GROUND);
  const x = c.getContext('2d');
  // Track surface
  x.fillStyle = P.FIRE_RED;
  x.fillRect(0, 0, tw, 1);
  x.fillStyle = P.RED;
  x.fillRect(0, 1, tw, 17);
  x.fillStyle = P.DEEP_RED;
  x.fillRect(0, 18, tw, 2);
  x.fillRect(0, 6, 12, 1);    // lane marking dashes
  x.fillRect(16, 12, 12, 1);
  x.fillStyle = P.DARK_RED;
  x.fillRect(0, 20, tw, 4);
  // Below the track: navy checker
  x.fillStyle = P.DEEP_NAVY;
  x.fillRect(0, 24, tw, c.height - 24);
  x.fillStyle = P.NAVY;
  for (let y = 24; y < c.height; y += 8) {
    for (let px = ((y / 8) % 2) * 8; px < tw; px += 16) x.fillRect(px, y, 8, 8);
  }
  return c;
}

const BOARD_TEXT = '  CHICAGO FIRE FC  ·  SPARKY\'S SCHEDULE RUN  ·  ';

export function createBackground() {
  const sky = buildSky();
  const stars = buildStars();
  const skyline = buildSkyline();
  const ground = buildGroundTile();
  const state = { skylineX: 0, groundX: 0, boardX: 0, t: 0 };

  return {
    // speed: world scroll speed in px/s (0 on menus). boardSpeed scrolls the LED text independently.
    update(dt, speed, boardSpeed = GAME.world.titleBoardSpeed) {
      state.t += dt;
      state.skylineX = (state.skylineX + speed * 0.12 * dt) % skyline.width;
      state.groundX = (state.groundX + speed * dt) % ground.width;
      state.boardX += (boardSpeed + speed) * dt;
    },

    render(ctx, { reducedMotion = false } = {}) {
      ctx.drawImage(sky, 0, 0);

      for (const s of stars) {
        const tw = reducedMotion ? 1 : Math.sin(state.t * 1.7 + s.phase);
        ctx.fillStyle = tw > 0.6 ? P.WHITE : tw > -0.4 ? P.FLAG_BLUE : P.DEEP_BLUE;
        ctx.fillRect(s.x, s.y, 1, 1);
        if (s.big && tw > 0.6) {
          ctx.fillRect(s.x - 1, s.y, 3, 1);
          ctx.fillRect(s.x, s.y - 1, 1, 3);
        }
      }

      const sx = Math.floor(state.skylineX);
      const sy = BOARD_TOP - skyline.height;
      ctx.drawImage(skyline, -sx, sy);
      ctx.drawImage(skyline, skyline.width - sx, sy);

      // LED advertising boards
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(0, BOARD_TOP, W, GROUND - BOARD_TOP);
      ctx.fillStyle = P.NAVY;
      ctx.fillRect(0, BOARD_TOP, W, 1);
      ctx.fillRect(0, BOARD_TOP + 2, W, 1);
      const label = textSprite(BOARD_TEXT, P.FLAG_BLUE, 8);
      const off = Math.floor(state.boardX % label.width);
      for (let lx = -off; lx < W; lx += label.width) ctx.drawImage(label, lx, BOARD_TOP + 6);

      // Track
      const gx = Math.floor(state.groundX);
      for (let x = -gx; x < W; x += ground.width) ctx.drawImage(ground, x, GROUND);
    },

    get groundY() { return GROUND; },
  };
}

