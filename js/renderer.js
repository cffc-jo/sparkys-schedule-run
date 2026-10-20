// Fixed low-res canvas, scaled up crisply and letterboxed inside the safe area.
import { GAME } from '../config/game.js';

export function createRenderer(canvas, frame, stage) {
  const W = GAME.view.width;
  const H = GAME.view.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  const r = { canvas, ctx, W, H, scale: 1, onResize: null };

  function fit() {
    const cs = getComputedStyle(stage);
    const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0 || availH <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const fitScale = Math.min(availW / W, availH / H); // CSS px per logical px
    // Prefer a whole number of *device* pixels per game pixel (perfectly even pixels)...
    const k = Math.floor(fitScale * dpr);
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
