// Audio front door. Phase 1: mute state + persistence + context unlock.
// Procedural sound effects and music are added in Phase 4.
import { load, save } from '../storage.js';

let ctx = null;
let muted = !!load('muted', false);
const listeners = new Set();

export const audio = {
  get muted() { return muted; },

  setMuted(value) {
    muted = !!value;
    save('muted', muted);
    listeners.forEach((fn) => fn(muted));
  },

  toggleMute() {
    this.setMuted(!muted);
  },

  onMuteChange(fn) {
    listeners.add(fn);
  },

  // Must run inside a user gesture (iOS).
  unlock() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch {
      /* audio unavailable: play silently */
    }
  },

  get context() { return ctx; },
};
