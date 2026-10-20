// Gameplay input: touch/mouse on the play area + keyboard.
// Jump fires immediately on press (no waiting to see if it's a double tap). If the same touch
// then turns into a downward swipe, that becomes a duck (a mid-air swipe = fast-fall + duck),
// which cancels the hop almost instantly.
import { GAME } from '../../config/game.js';
import { classifyGesture } from './gesture.js';

const JUMP_KEYS = new Set(['Space', 'KeyW', 'ArrowUp']);
const DUCK_KEYS = new Set(['KeyS', 'ArrowDown']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(surface, handlers) {
  let enabled = false;
  const touches = new Map(); // pointerId -> { y, t, done }

  const isControl = (el) => el.closest('button, a, .modal, .panel');

  function onDown(e) {
    if (!enabled || isControl(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    touches.set(e.pointerId, { y: e.clientY, t: performance.now(), done: false });
    handlers.jump();
  }

  function onMove(e) {
    const g = touches.get(e.pointerId);
    if (!enabled || !g || g.done) return;
    const kind = classifyGesture(e.clientY - g.y, performance.now() - g.t, GAME.input);
    if (kind === 'swipeDown') {
      g.done = true;
      handlers.duck();
    } else if (kind === 'swipeUp') {
      g.done = true; // the press already jumped; a swipe up is the same action
    }
  }

  function onUp(e) {
    touches.delete(e.pointerId);
  }

  function onKey(e) {
    if (!enabled) return;
    if (document.querySelector('.modal:not([hidden])')) return;
    if (PAUSE_KEYS.has(e.code)) {
      e.preventDefault();
      if (!e.repeat) handlers.pause();
      return;
    }
    // In a menu (paused / finished), let Space and Enter press the focused button.
    if (handlers.menuOpen && handlers.menuOpen()) return;
    if (JUMP_KEYS.has(e.code)) {
      e.preventDefault(); // also stops Space "clicking" a focused button
      if (!e.repeat) handlers.jump();
    } else if (DUCK_KEYS.has(e.code)) {
      e.preventDefault();
      if (!e.repeat) handlers.duck();
    }
  }

  surface.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', onKey);

  return {
    set enabled(v) {
      enabled = v;
      if (!v) touches.clear();
    },
    get enabled() { return enabled; },
  };
}
