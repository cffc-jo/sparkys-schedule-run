// Original chiptune loops + a small look-ahead sequencer on the Web Audio clock.
// Each track is a list of 8th-note steps. Notes: 'C5', '-' = hold previous note, null = rest.
import { tone, noise, noteFreq } from './synth.js';

const bar = (s) => s.trim().split(/\s+/).map((n) => (n === '.' ? null : n));

export const TRACKS = {
  // Upbeat gameplay theme: I-vi-IV-V in C, two 4-bar phrases.
  game: {
    bpm: 152,
    lead: [
      ...bar('E5 G5 C6 G5 E5 G5 A5 G5'),
      ...bar('E5 A5 C6 A5 E5 C5 D5 E5'),
      ...bar('F5 A5 C6 A5 F5 A5 G5 F5'),
      ...bar('D5 G5 B5 G5 D5 F5 E5 D5'),
      ...bar('C6 - B5 C6 G5 - E5 G5'),
      ...bar('A5 - G5 A5 E5 - C5 E5'),
      ...bar('F5 G5 A5 C6 A5 G5 F5 A5'),
      ...bar('G5 B5 D6 B5 G5 - . .'),
    ],
    bass: ['C3', 'A2', 'F2', 'G2', 'C3', 'A2', 'F2', 'G2'], // root per bar, played root/octave
    drums: true,
    leadWave: 0.25,
    leadVol: 0.11,
    bassVol: 0.16,
  },
  // Gentler title loop: arpeggios over C - F - Am - G.
  title: {
    bpm: 108,
    lead: [
      ...bar('C4 E4 G4 C5 G4 E4 G4 E4'),
      ...bar('F4 A4 C5 F5 C5 A4 C5 A4'),
      ...bar('A3 C4 E4 A4 E4 C4 E4 C4'),
      ...bar('G3 B3 D4 G4 D4 B4 D5 B4'),
    ],
    bass: ['C3', 'F2', 'A2', 'G2'],
    drums: false,
    leadWave: 0.125,
    leadVol: 0.09,
    bassVol: 0.13,
  },
};

export function createSequencer(getCtx, getOut) {
  let track = null;
  let step = 0;
  let nextTime = 0;
  let timer = 0;
  let tempo = 1;
  const LOOKAHEAD = 0.15; // seconds of notes scheduled ahead
  const TICK = 30;        // ms between scheduler runs

  function stepDur() {
    return 60 / track.bpm / 2 / tempo; // 8th notes
  }

  function scheduleStep(ctx, out, i, t) {
    const n = track.lead.length;
    const note = track.lead[i % n];
    const dur = stepDur();
    if (note && note !== '-') {
      // Hold through following '-' steps
      let len = 1;
      while (track.lead[(i + len) % n] === '-' && len < n) len++;
      tone(ctx, out, t, { wave: track.leadWave, f0: noteFreq(note), dur: dur * len * 0.92, vol: track.leadVol, release: 0.02 });
    }
    const barIdx = Math.floor(i / 8) % track.bass.length;
    const root = noteFreq(track.bass[barIdx]);
    tone(ctx, out, t, { wave: 'triangle', f0: i % 2 ? root * 2 : root, dur: dur * 0.85, vol: track.bassVol, release: 0.02 });
    if (track.drums) {
      const beat = i % 8;
      if (beat === 0 || beat === 4) tone(ctx, out, t, { wave: 'triangle', f0: 160, f1: 45, dur: 0.12, vol: 0.22 }); // kick
      if (beat === 2 || beat === 6) noise(ctx, out, t, { dur: 0.12, vol: 0.14, freq: 1800, q: 0.7 });           // snare
      noise(ctx, out, t, { dur: 0.03, vol: 0.05, freq: 8000, type: 'highpass' });                                // hat
    }
  }

  function run() {
    const ctx = getCtx();
    if (!ctx || !track) return;
    const out = getOut();
    // If we fell behind (tab throttled), skip ahead rather than playing a burst of notes
    if (nextTime < ctx.currentTime - 0.2) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      scheduleStep(ctx, out, step, nextTime);
      nextTime += stepDur();
      step++;
    }
    timer = setTimeout(run, TICK);
  }

  return {
    play(name) {
      const ctx = getCtx();
      const t = TRACKS[name] || null;
      if (t === track && timer) return;
      this.stop();
      track = t;
      if (!track || !ctx) return;
      step = 0;
      nextTime = ctx.currentTime + 0.06;
      run();
    },
    stop() {
      clearTimeout(timer);
      timer = 0;
    },
    // Resume the current track after a pause, from where it left off.
    resume() {
      const ctx = getCtx();
      if (!track || timer || !ctx) return;
      nextTime = ctx.currentTime + 0.06;
      run();
    },
    setTempo(mult) { tempo = mult; },
    get current() { return track; },
    get playing() { return !!timer; },
  };
}
