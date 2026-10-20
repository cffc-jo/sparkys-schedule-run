// ?debug=1 developer tools: FPS, god mode, skip to finish, game speed slider.
// (Hitboxes are drawn by the play scene in debug mode; analytics events log to the console.)
import { PALETTE as P } from '../config/palette.js';
import { drawText } from './pixelText.js';

export function createDebugTools(app) {
  let fps = 60;
  let acc = 0;
  let frames = 0;

  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  panel.innerHTML = `
    <strong>DEBUG</strong>
    <label><input type="checkbox" data-dbg="god"> God mode</label>
    <button type="button" data-dbg="skip">Skip to finish</button>
    <label>Speed <input type="range" min="0.25" max="2" step="0.25" value="1" data-dbg="speed"> <span data-dbg="speedVal">1×</span></label>
    <button type="button" data-dbg="hide">Hide</button>`;
  document.body.append(panel);

  const q = (k) => panel.querySelector(`[data-dbg="${k}"]`);
  q('god').addEventListener('change', (e) => { app.godMode = e.target.checked; });
  q('skip').addEventListener('click', () => {
    if (app.scene === app.scenes.play && app.scene.skipToFinish) app.scene.skipToFinish();
  });
  q('speed').addEventListener('input', (e) => {
    app.timeScale = Number(e.target.value);
    q('speedVal').textContent = `${app.timeScale}×`;
  });
  q('hide').addEventListener('click', () => { panel.hidden = true; });

  return {
    // Called after every rendered frame
    frame(ctx, dt) {
      if (dt > 0) {
        acc += dt;
        frames++;
        if (acc >= 0.5) { fps = Math.round(frames / acc); acc = 0; frames = 0; }
      }
      drawText(ctx, `${fps} FPS`, app.renderer.W - 4, app.renderer.H - 12, { align: 'right', color: fps >= 55 ? P.WHITE : P.FIRE_RED, outline: P.DARK_NAVY });
    },
  };
}
