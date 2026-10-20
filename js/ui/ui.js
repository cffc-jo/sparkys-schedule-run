// DOM layer over the canvas: screens, buttons, corner controls.
// All buttons use data-action="..."; handlers are supplied by main.js.
import { GAME } from '../../config/game.js';

export function createUI(frame, actions) {
  const lastPress = new WeakMap();

  frame.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || !frame.contains(el)) return;
    // Swallow accidental double-taps on the same control.
    const now = performance.now();
    if (now - (lastPress.get(el) || 0) < GAME.ui.buttonCooldownMs) {
      e.preventDefault();
      return;
    }
    lastPress.set(el, now);
    const fn = actions[el.dataset.action];
    if (fn) fn(el, e);
  });

  const screens = [...frame.querySelectorAll('[data-screen]')];
  const pauseBtn = frame.querySelector('[data-action="pause"]');
  const muteBtn = frame.querySelector('[data-action="mute"]');

  return {
    showScreen(name) {
      for (const s of screens) s.hidden = s.dataset.screen !== name;
    },
    setPauseVisible(visible) {
      pauseBtn.hidden = !visible;
    },
    setMuted(muted) {
      muteBtn.setAttribute('aria-pressed', String(muted));
      muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    },
  };
}
