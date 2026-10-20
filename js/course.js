// Deterministic course builder: one obstacle per match, in schedule order, then the finish.
// Pure (no DOM) so it can be unit-tested. The same schedule + seed always gives the same layout.
import { maxSpeed } from './speed.js';

// FNV-1a string hash -> 32-bit seed
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 PRNG
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seconds from reaching an obstacle until Sparky is back on the ground and ready again.
export function recoverTime(type, physics) {
  const g = physics.gravity;
  const v1 = physics.jumpVelocity;
  const v2 = physics.doubleJumpVelocity;
  if (type === 'floating') return physics.duckDuration;
  if (type === 'tall') {
    // Worst case: double jump fired at the apex of the first jump.
    const h = (v1 * v1) / (2 * g) + (v2 * v2) / (2 * g);
    return v1 / g + v2 / g + Math.sqrt((2 * h) / g);
  }
  return (2 * v1) / g; // ground: one full jump
}

// Choose obstacle types: easy start, ~60/25/15 mix, hard boxes drift later, no hard
// back-to-back early, never two tall boxes in a row.
export function assignTypes(n, course, rng) {
  const types = Array(n).fill('ground');
  const start = Math.min(course.easyStartCount, n);
  const cutoff = Math.floor(n * course.noBackToBackHardUntil);
  const nTall = Math.round(n * course.typeMix.tall);
  const nHard = Math.min(n - start, nTall + Math.round(n * course.typeMix.floating));

  const slots = [];
  for (let i = start; i < n; i++) slots.push({ i, score: rng() * 0.6 + (i / n) * 0.4 });
  slots.sort((a, b) => b.score - a.score);

  const hard = new Set();
  const tryFill = (strict) => {
    for (const { i } of slots) {
      if (hard.size >= nHard) return;
      if (hard.has(i)) continue;
      // A hard neighbour is only a conflict if either of the pair is in the early part.
      const conflict = (j) => hard.has(j) && Math.min(i, j) < cutoff;
      if (strict && (conflict(i - 1) || conflict(i + 1))) continue;
      hard.add(i);
    }
  };
  tryFill(true);
  tryFill(false); // only if the constraints made the target impossible (very short schedules)

  // Tall boxes favour later slots; never adjacent to another tall box.
  const hardList = [...hard].map((i) => ({ i, score: (i / n) * 0.5 + rng() * 0.5 })).sort((a, b) => b.score - a.score);
  const tall = new Set();
  for (const { i } of hardList) {
    if (tall.size >= nTall) break;
    if (tall.has(i - 1) || tall.has(i + 1)) continue;
    tall.add(i);
  }
  for (const i of hard) types[i] = tall.has(i) ? 'tall' : 'floating';
  return types;
}

// Collision rects for an obstacle, relative to its left edge / the ground (y up).
function shapeFor(type, o) {
  const s = o.boxSize;
  if (type === 'floating') {
    const b = o.floatingBottom;
    return {
      h: b + s,
      rects: [
        { x0: 0, x1: s, y0: b, y1: b + s, inset: true },
        { x0: s / 2 - 2, x1: s / 2 + 2, y0: b + s, y1: 10000, inset: false }, // the cable
      ],
    };
  }
  if (type === 'tall') {
    const h = o.tallCrateHeight + s;
    return { h, rects: [{ x0: 0, x1: s, y0: 0, y1: h, inset: true }] };
  }
  return { h: s, rects: [{ x0: 0, x1: s, y0: 0, y1: s, inset: true }] };
}

export function buildCourse(matches, GAME) {
  const { course, obstacles: o, physics } = GAME;
  const vmax = maxSpeed(GAME.speed);
  const seedStr = course.seed || matches.map((m) => m.opponent).join('|');
  const rng = createRng(hashSeed(seedStr));
  const n = matches.length;
  const types = assignTypes(n, course, rng);

  const list = [];
  let x = course.leadIn;
  for (let i = 0; i < n; i++) {
    const type = types[i];
    const shape = shapeFor(type, o);
    const ob = { index: i, match: matches[i], type, x, w: o.boxSize, h: shape.h, rects: shape.rects };
    list.push(ob);
    // Extra room tapers from full early in the season to 30% at the end.
    const taper = n > 1 ? 1 - 0.7 * (i / (n - 1)) : 1;
    const extra = course.extraSpacingMax * taper * (0.5 + 0.5 * rng());
    ob.gapAfter = (recoverTime(type, physics) + course.reactionGap + extra) * vmax;
    x += ob.w + ob.gapAfter;
  }
  const last = list[list.length - 1];
  const finishX = last ? last.x + last.w + recoverTime(last.type, physics) * vmax + course.finishRunout : course.leadIn;
  return { obstacles: list, finishX, vmax };
}
