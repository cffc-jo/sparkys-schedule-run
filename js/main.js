// Boot: palette → renderer → preload (with loading bar) → scenes → loop.
import { GAME } from '../config/game.js';
import { PALETTE as P } from '../config/palette.js';
import { SPARKY_SHEET } from '../config/sprites.js';
import { createRenderer } from './renderer.js';
import { createLoop } from './loop.js';
import { loadAssets } from './assets.js';
import { drawText, clearTextCache } from './pixelText.js';
import { pixelateImage } from './art/pixelArt.js';
import { buildSparkySheet } from './art/sparkyArt.js';
import { iconDataURL } from './art/icons.js';
import { createSpriteSheet } from './sprite.js';
import { createBackground } from './world/background.js';
import { createUI } from './ui/ui.js';
import { createModal } from './ui/modal.js';
import { audio } from './audio/audio.js';
import { scheduleUrl } from './links.js';
import { track } from './analytics.js';
import { isDebug } from './debugFlag.js';
import { createDebugTools } from './debug.js';
import { createTitleScene } from './scenes/title.js';
import { createPlayScene } from './scenes/play.js';
import { createEndScene } from './scenes/end.js';
import { createTutorialScene, TUTORIAL_KEY } from './scenes/tutorial.js';
import { load } from './storage.js';
import { isEnabled as leaderboardEnabled } from './leaderboard.js';
import { shareResult } from './share.js';

// ---- Palette → CSS custom properties (single source of truth) ----
for (const [name, hex] of Object.entries(P)) {
  document.documentElement.style.setProperty('--c-' + name.toLowerCase().replace(/_/g, '-'), hex);
}

// ---- Page behaviour: no scroll / zoom / pull-to-refresh / callouts ----
document.addEventListener('touchmove', (e) => {
  if (!e.target.closest('.scrollable')) e.preventDefault();
}, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('a')) e.preventDefault();
});

const stage = document.getElementById('stage');
const frame = document.getElementById('frame');
const canvas = document.getElementById('game');
const renderer = createRenderer(canvas, frame, stage);
const { ctx, W, H } = renderer;

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const app = {
  renderer,
  audio,
  reducedMotion: reducedMotionQuery.matches,
  scene: null,
  scenes: {},
  go(name) {
    if (app.scene && app.scene.exit) app.scene.exit();
    app.scene = app.scenes[name];
    app.scene.enter();
  },
};
reducedMotionQuery.addEventListener?.('change', (e) => { app.reducedMotion = e.matches; });
if (isDebug()) window.__app = app; // console access for testing

// ---- Loading screen ----
let loadProgress = 0;
let loadError = null;

function drawLoading() {
  ctx.fillStyle = P.RED;
  ctx.fillRect(0, 0, W, H);
  const bw = 150, bh = 10, bx = (W - bw) / 2, by = H / 2;
  if (loadError) {
    drawText(ctx, 'COULD NOT LOAD', W / 2, by - 20, { align: 'center', color: P.WHITE });
    drawText(ctx, 'PLEASE REFRESH', W / 2, by, { align: 'center', color: P.WHITE });
    return;
  }
  drawText(ctx, 'LOADING', W / 2, by - 20, { align: 'center', color: P.WHITE, shadow: P.DARK_RED });
  ctx.fillStyle = P.DARK_RED;
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = P.DEEP_RED;
  ctx.fillRect(bx, by, bw, bh);
  // Chunky 8-bit segments
  const seg = 10;
  const filled = Math.floor((bw / seg) * loadProgress);
  ctx.fillStyle = P.WHITE;
  for (let i = 0; i < filled; i++) ctx.fillRect(bx + i * seg + 1, by + 1, seg - 2, bh - 2);
}

const loop = createLoop({
  step: GAME.loop.fixedStep,
  maxFrameTime: GAME.loop.maxFrameTime,
  timeScale: () => app.timeScale || 1,
  update(dt) {
    if (app.scene) app.scene.update(dt);
  },
  render(alpha, frameDt) {
    if (app.scene) app.scene.render(ctx, alpha);
    else drawLoading();
    if (app.debug) app.debug.frame(ctx, frameDt);
  },
});
app.loop = loop;
loop.start();

// ---- Lifecycle: pause when the app/tab is hidden ----
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (app.scene && app.scene.onHide) app.scene.onHide();
    audio.suspend();
    loop.stop();
  } else {
    audio.wake();
    loop.resetClock();
    loop.start();
  }
});

// ---- Audio unlock (browsers block sound until a user gesture) ----
// Try on every kind of gesture until audio is running, then stop listening.
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown', 'keyup'];
const unlock = () => {
  audio.unlock();
  if (audio.unlocked) UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock, true));
};
UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, unlock, true));

// ---- After the finish screen: (future) initials + leaderboard, then the end screen ----
function afterFinish() {
  if (GAME.flags.LEADERBOARD_ENABLED && leaderboardEnabled()) {
    // Future: app.go('initials') -> submitScore(app.lastResult + initials) -> end screen.
  }
  app.go('end');
}

let toastTimer = 0;
function toast(message) {
  const el = frame.querySelector('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

// ---- Boot ----
async function boot() {
  // Font first so the loading text is in the right face
  await loadAssets([{ key: 'font', type: 'font', family: 'Press Start 2P', optional: true }]);
  clearTextCache();

  const assets = await loadAssets([
    { key: 'schedule', type: 'json', src: 'config/schedule.json' },
    { key: 'sparky', type: 'image', src: SPARKY_SHEET.src, optional: true },
    { key: 'chi', type: 'image', src: 'assets/logos/CHI.png', optional: true }, // pixel crest from tools/pixelate-logos.js
    { key: 'crest', type: 'image', src: 'assets/crest.svg', optional: true },   // fallback until CHI.png exists
  ], (p) => { loadProgress = p; });

  app.assets = assets;
  app.schedule = assets.schedule;
  if (!app.schedule || !Array.isArray(app.schedule.matches) || !app.schedule.matches.length) {
    throw new Error('config/schedule.json has no matches');
  }

  // Opponent logos (optional: a missing logo shows the club abbreviation instead)
  const logoPaths = [...new Set(app.schedule.matches.map((m) => m.logo).filter(Boolean))];
  const logos = await loadAssets(logoPaths.map((src) => ({ key: src, type: 'image', src, optional: true })));
  app.logos = logos;
  app.sheet = createSpriteSheet(assets.sparky || buildSparkySheet(SPARKY_SHEET), SPARKY_SHEET);
  app.crest = assets.chi || (assets.crest ? pixelateImage(assets.crest, GAME.world.crestSize * GAME.view.renderScale) : null);
  app.bg = createBackground({ reducedMotion: () => app.reducedMotion });

  // DOM: bind config values into the instructions, icons, links
  frame.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    const v = GAME.balls[key] ?? GAME.penalties[key];
    if (v !== undefined) el.textContent = v;
  });
  frame.querySelectorAll('img[data-icon]').forEach((img) => { img.src = iconDataURL(img.dataset.icon); });
  frame.querySelectorAll('[data-action="schedule"]').forEach((a) => { a.href = scheduleUrl(); });

  const modal = createModal(document.getElementById('modal'), {
    onChange: (open) => {
      // The TUTORIAL replay button only makes sense from the menus, not mid-run
      const replay = document.querySelector('[data-tutorial-replay]');
      if (replay) replay.hidden = !(app.scene === app.scenes.title || app.scene === app.scenes.end);
      if (app.scene && app.scene.onModalChange) app.scene.onModalChange(open);
    },
  });
  app.modal = modal;

  app.ui = createUI(frame, {
    // First PLAY on this device shows the tutorial; after that, straight into the run.
    play: () => app.go(load(TUTORIAL_KEY, false) ? 'play' : 'tutorial'),
    'tutorial-next': () => app.scenes.tutorial.next(),
    'tutorial-skip': () => app.scenes.tutorial.skip(),
    'replay-tutorial': () => { modal.close(); app.go('tutorial'); },
    continue: () => afterFinish(),
    'play-again': () => { track('play_again'); app.go('play'); },
    share: async () => {
      track('share_click', { finalTimeMs: app.lastResult && app.lastResult.finalTimeMs });
      const outcome = await shareResult(app.lastResult ? app.lastResult.finalTimeMs : 0);
      if (outcome === 'copied') toast('LINK COPIED!');
      else if (outcome === 'manual') toast('COPY THE PAGE LINK TO SHARE');
    },
    resume: () => app.scene.resume && app.scene.resume(),
    restart: () => app.go('play'),
    quit: () => app.go('title'),
    schedule: (el) => track('schedule_click', { source: el.dataset.source }), // link opens natively
    help: () => modal.open(),
    'close-modal': () => modal.close(),
    mute: () => audio.toggleMute(),
    pause: () => app.scene && app.scene.togglePause && app.scene.togglePause(),
  });
  app.ui.setMuted(audio.muted);
  // UI click sound for every button/link
  frame.addEventListener('click', (e) => { if (e.target.closest('[data-action]')) audio.play('click'); });
  audio.onMuteChange((m) => app.ui.setMuted(m));

  app.scenes.title = createTitleScene(app);
  app.scenes.play = createPlayScene(app);
  app.scenes.end = createEndScene(app);
  app.scenes.tutorial = createTutorialScene(app);
  if (isDebug()) app.debug = createDebugTools(app);
  frame.querySelectorAll('[data-bind-text="season"]').forEach((el) => { el.textContent = app.schedule.season; });

  // Phones turned to landscape show the rotate prompt; pause the run underneath it.
  const landscape = window.matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
  landscape.addEventListener?.('change', (e) => { if (e.matches && app.scene && app.scene.onHide) app.scene.onHide(); });

  // Short hold on 100% so the bar doesn't flash past
  await new Promise((r) => setTimeout(r, 200));
  app.go('title');
}

boot().catch((err) => {
  console.error(err);
  loadError = err;
});
