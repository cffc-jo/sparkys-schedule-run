// Audio front door: one Web Audio context, separate sound-effect and music buses, a master
// mute (saved in localStorage), iOS-safe unlock, and pause/suspend handling.
import { GAME } from '../../config/game.js';
import { load, save } from '../storage.js';
import { SFX } from './synth.js';
import { createSequencer } from './music.js';

let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let muted = !!load('muted', false);
let wantedTrack = null;  // what should be playing once audio is unlocked
let musicPaused = false;
const listeners = new Set();

const seq = createSequencer(() => ctx, () => musicBus);

function build() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  // Start the requested music as soon as the browser actually lets audio run.
  ctx.addEventListener?.('statechange', () => {
    if (ctx.state === 'running' && wantedTrack && !musicPaused && !seq.playing) seq.play(wantedTrack);
  });
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = GAME.audio.sfxVolume;
  sfxBus.connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = GAME.audio.musicVolume;
  musicBus.connect(master);
  return true;
}

export const audio = {
  get muted() { return muted; },

  setMuted(value) {
    muted = !!value;
    save('muted', muted);
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.015);
    listeners.forEach((fn) => fn(muted));
  },

  toggleMute() {
    this.setMuted(!muted);
  },

  onMuteChange(fn) {
    listeners.add(fn);
  },

  get unlocked() { return !!ctx && ctx.state === 'running'; },

  // Must run inside a user gesture (browsers start audio suspended until one). Called on every
  // click / tap / key until audio is actually running, since browsers differ on which gesture
  // counts (Safari and some desktop settings ignore the initial press but accept the release).
  unlock() {
    try {
      if (!ctx && !build()) return;
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      // Play one silent sample: required by older iOS to fully unlock output.
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
      if (wantedTrack && !musicPaused && !seq.playing) seq.play(wantedTrack);
    } catch {
      /* audio unavailable: the game plays silently */
    }
  },

  // Fire-and-forget sound effect. `delay` in seconds.
  play(name, delay = 0) {
    if (!ctx || ctx.state === 'closed') return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {}); // plays as soon as it's allowed
    const fn = SFX[name];
    if (!fn) return;
    try { fn(ctx, sfxBus, ctx.currentTime + 0.005 + delay); } catch { /* ignore */ }
  },

  // Switch the background loop: 'title', 'game' or null (silence).
  music(name) {
    wantedTrack = name;
    musicPaused = false;
    seq.setTempo(1);
    if (!ctx) return; // starts on unlock
    if (name) seq.play(name);
    else seq.stop();
  },

  pauseMusic() {
    musicPaused = true;
    seq.stop();
  },

  resumeMusic() {
    if (!musicPaused) return;
    musicPaused = false;
    if (ctx && wantedTrack) seq.resume();
  },

  // Sped-up music while invincible.
  setTempo(mult) {
    seq.setTempo(mult);
  },

  // App hidden / shown (visibilitychange): silence everything, then pick up again.
  suspend() {
    seq.stop();
    if (ctx && ctx.state === 'running') ctx.suspend();
  },
  wake() {
    if (!ctx) return;
    const restart = () => { if (wantedTrack && !musicPaused) seq.resume(); };
    if (ctx.state === 'suspended') ctx.resume().then(restart, () => {});
    else restart();
  },

  get context() { return ctx; },
};
