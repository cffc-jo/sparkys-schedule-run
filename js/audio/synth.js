// 8-bit sound effects, generated with the Web Audio API (no audio files).
// Every effect is a function (ctx, out, t, volume) so it can be played live or rendered offline
// for testing. Voices: NES-style pulse waves (12.5% / 25% / 50%), triangle, and noise.

const pulseCache = new WeakMap();

// Pulse wave with a given duty cycle, built from its Fourier series.
export function pulseWave(ctx, duty) {
  let byCtx = pulseCache.get(ctx);
  if (!byCtx) pulseCache.set(ctx, (byCtx = {}));
  if (byCtx[duty]) return byCtx[duty];
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  return (byCtx[duty] = ctx.createPeriodicWave(real, imag));
}

const noiseCache = new WeakMap();
function noiseBuffer(ctx) {
  if (noiseCache.has(ctx)) return noiseCache.get(ctx);
  const len = ctx.sampleRate; // 1 second, looped
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // NES-ish: hold each random value for a few samples for a grittier crunch
  let v = 0;
  for (let i = 0; i < len; i++) {
    if (i % 4 === 0) v = Math.random() * 2 - 1;
    d[i] = v;
  }
  noiseCache.set(ctx, buf);
  return buf;
}

// One note with a pitch slide and a short attack/decay envelope.
export function tone(ctx, out, t, { wave = 0.5, f0, f1 = f0, dur, vol = 0.3, attack = 0.004, release = 0.03 }) {
  const osc = ctx.createOscillator();
  if (wave === 'triangle' || wave === 'sine') osc.type = wave;
  else osc.setPeriodicWave(pulseWave(ctx, wave));
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function noise(ctx, out, t, { dur, vol = 0.3, freq = 3000, type = 'bandpass', q = 0.8 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const N = (name) => noteFreq(name);

// "A4" -> 440, "C#5" -> 554.37
export function noteFreq(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) return 0;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const semis = base + acc + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

function arp(ctx, out, t, notes, step, opts) {
  notes.forEach((n, i) => tone(ctx, out, t + i * step, { f0: N(n), dur: step * 1.1, ...opts }));
}

// ---- The sound list ----
export const SFX = {
  jump: (c, o, t) => tone(c, o, t, { wave: 0.5, f0: 280, f1: 720, dur: 0.13, vol: 0.22 }),
  doubleJump: (c, o, t) => {
    tone(c, o, t, { wave: 0.25, f0: 520, f1: 1240, dur: 0.12, vol: 0.2 });
    tone(c, o, t + 0.05, { wave: 'triangle', f0: 900, f1: 1800, dur: 0.1, vol: 0.18 });
  },
  duck: (c, o, t) => tone(c, o, t, { wave: 0.5, f0: 420, f1: 140, dur: 0.1, vol: 0.18 }),
  clear: (c, o, t) => {
    tone(c, o, t, { wave: 0.25, f0: N('A5'), dur: 0.05, vol: 0.16 });
    tone(c, o, t + 0.05, { wave: 0.25, f0: N('E6'), dur: 0.07, vol: 0.16 });
  },
  // Powered-up Sparky bursting through a box. Crunch: a hard impact, a thump, then a crackle of
  // splintering debris. Positive: a rising power "zing" and a bright major-chord sparkle on the
  // hit, so it feels like a reward (no melody).
  smash: (c, o, t) => {
    noise(c, o, t, { dur: 0.09, vol: 0.45, freq: 1800, q: 0.5 });
    tone(c, o, t, { wave: 0.5, f0: 200, f1: 55, dur: 0.1, vol: 0.26 });
    [[0.03, 3800, 0.28], [0.06, 2400, 0.24], [0.09, 4400, 0.2], [0.12, 2900, 0.15], [0.155, 3600, 0.1]]
      .forEach(([dt, freq, vol]) => noise(c, o, t + dt, { dur: 0.03, vol, freq, q: 1.4 }));
    tone(c, o, t + 0.01, { wave: 0.25, f0: 420, f1: 1700, dur: 0.11, vol: 0.13 });
    for (const n of ['C6', 'E6', 'G6']) tone(c, o, t + 0.03, { wave: 0.125, f0: N(n), dur: 0.09, vol: 0.07, release: 0.06 });
  },
  // Sleigh bells for Santa's flyover: a quick shimmer of high jingles
  sleighBells: (c, o, t) => {
    ['E7', 'G7', 'E7', 'C7', 'G7', 'E7', 'G7', 'C8'].forEach((n, i) => {
      tone(c, o, t + i * 0.07, { wave: 'triangle', f0: N(n), dur: 0.06, vol: 0.07 });
      noise(c, o, t + i * 0.07, { dur: 0.04, vol: 0.05, freq: 9000, type: 'highpass' });
    });
  },
  collect: (c, o, t) => arp(c, o, t, ['C6', 'E6', 'G6', 'C7'], 0.04, { wave: 0.125, vol: 0.18 }),
  invincibleStart: (c, o, t) => {
    arp(c, o, t + 0.16, ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.045, { wave: 0.25, vol: 0.16 });
    arp(c, o, t + 0.16, ['C4', 'G4', 'C5', 'G5', 'C6', 'G6'], 0.045, { wave: 'triangle', vol: 0.18 });
  },
  invincibleEnding: (c, o, t) => {
    for (let i = 0; i < 3; i++) tone(c, o, t + i * 0.14, { wave: 0.125, f0: i % 2 ? 880 : 1175, dur: 0.07, vol: 0.14 });
  },
  hit: (c, o, t) => {
    noise(c, o, t, { dur: 0.18, vol: 0.35, freq: 1200, q: 0.6 });
    tone(c, o, t, { wave: 0.5, f0: 240, f1: 55, dur: 0.22, vol: 0.22 });
  },
  penalty: (c, o, t) => {
    // Sad two-note "wah-wah" sting
    tone(c, o, t, { wave: 0.25, f0: N('G4'), f1: N('F#4'), dur: 0.16, vol: 0.18 });
    tone(c, o, t + 0.17, { wave: 0.25, f0: N('D4'), f1: N('C4'), dur: 0.3, vol: 0.18 });
  },
  beep: (c, o, t) => tone(c, o, t, { wave: 0.5, f0: N('A5'), dur: 0.14, vol: 0.2 }),
  go: (c, o, t) => {
    tone(c, o, t, { wave: 0.5, f0: N('A6'), dur: 0.32, vol: 0.22 });
    tone(c, o, t, { wave: 'triangle', f0: N('A4'), dur: 0.32, vol: 0.2 });
  },
  fanfare: (c, o, t) => {
    const lead = [['C5', 0.1], ['E5', 0.1], ['G5', 0.1], ['C6', 0.22], ['G5', 0.1], ['C6', 0.5]];
    const bass = [['C3', 0.3], ['G3', 0.32], ['C4', 0.5]];
    let tt = t;
    for (const [n, d] of lead) { tone(c, o, tt, { wave: 0.25, f0: N(n), dur: d, vol: 0.2 }); tt += d; }
    tt = t;
    for (const [n, d] of bass) { tone(c, o, tt, { wave: 'triangle', f0: N(n), dur: d, vol: 0.24 }); tt += d; }
    noise(c, o, t + 0.52, { dur: 0.25, vol: 0.12, freq: 6000, type: 'highpass' });
  },
  click: (c, o, t) => tone(c, o, t, { wave: 0.125, f0: 1400, f1: 1000, dur: 0.035, vol: 0.12 }),
};
