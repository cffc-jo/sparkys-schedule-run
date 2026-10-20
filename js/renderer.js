// Fixed low-res canvas, scaled up crisply and letterboxed inside the safe area.
// All game code draws in logical pixels (W x H). The backing canvas is `renderScale` times
// larger so a few assets (club logos) can carry extra detail; everything else is drawn with
// nearest-neighbour scaling and looks exactly like plain W x H pixel art.
import { GAME } from '../config/game.js';

export function createRenderer(canvas, frame, stage) {
  const W = GAME.view.width;
  const H = GAME.view.height;
  const RS = GAME.view.renderScale;
  canvas.width = W * RS;
  canvas.height = H * RS;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(RS, 0, 0, RS, 0, 0); // draw in logical pixels

  const r = { canvas, ctx, W, H, scale: 1, onResize: null };

  function fit() {
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0 || availH <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const fitScale = Math.min(availW / W, availH / H); // CSS px per logical px
    // Prefer a whole number of *device* pixels per canvas pixel (perfectly even pixels)...
    const RS = GAME.view.renderScale;
    const k = Math.floor((fitScale * dpr) / RS) * RS;
    let scale = k / dpr;
    // ...unless that would leave the game noticeably small; then fill and let pixelated scaling handle it.
    if (k < 1 || scale < fitScale * GAME.view.integerScaleMinFill) scale = fitScale;
    const cssW = Math.round(W * scale * dpr) / dpr;
    const cssH = Math.round(H * scale * dpr) / dpr;
    frame.style.width = cssW + 'px';
    frame.style.height = cssH + 'px';
    frame.style.setProperty('--u', (cssW / W) + 'px');
    r.scale = cssW / W;
    if (r.onResize) r.onResize(r.scale);
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 150));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);

  r.fit = fit;
  return r;
}
