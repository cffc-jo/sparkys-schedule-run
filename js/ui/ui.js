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
  const muteBtns = [...frame.querySelectorAll('[data-action="mute"]')];

  return {
    // Show one screen; optionally move keyboard focus to its first button.
    showScreen(name, { focus = false } = {}) {
      for (const s of screens) s.hidden = s.dataset.screen !== name;
      if (focus) {
        const first = frame.querySelector(`[data-screen="${name}"] button, [data-screen="${name}"] a`);
        if (first) first.focus();
      } else if (document.activeElement && document.activeElement.closest('[hidden]')) {
        document.activeElement.blur();
      }
    },
    setPauseVisible(visible) {
      pauseBtn.hidden = !visible;
    },
    setMuted(muted) {
      for (const b of muteBtns) {
        b.setAttribute('aria-pressed', String(muted));
        if (b.hasAttribute('data-mute-label')) b.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
        else b.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
      }
    },
  };
}
