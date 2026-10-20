// Dependency-free unit tests. Run in a browser (tests/run.html) or with Node (npm test).
// Covers: speed formula, timer + penalty math, gesture classifier, obstacle spacing at max
// speed, course layout rules, jump physics vs obstacle heights, ball placement.
import { GAME } from '../config/game.js';
import { currentSpeed, speedMultiplier, maxSpeed } from '../js/speed.js';
import { createTimer, makeResult, formatTime } from '../js/timer.js';
import { classifyGesture } from '../js/input/gesture.js';
import { buildCourse, recoverTime, assignTypes, createRng } from '../js/course.js';
import { createSparky } from '../js/game/sparky.js';
import { SPARKY_SHEET } from '../config/sprites.js';

export const tests = [];
const test = (name, fn) => tests.push({ name, fn });

function eq(actual, expected, msg = '') {
  if (actual !== expected) throw new Error(`${msg} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}
function near(a, b, eps, msg = '') {
  if (Math.abs(a - b) > eps) throw new Error(`${msg} expected ~${b}, got ${a}`);
}

// A fake schedule of n matches with a few repeat opponents
function schedule(n) {
  const clubs = ['ATL', 'MIA', 'NYC', 'TOR', 'SEA', 'LAFC', 'CLB'];
  return Array.from({ length: n }, (_, i) => ({
    matchNumber: i + 1, opponent: `Club ${clubs[i % clubs.length]}`, code: clubs[i % clubs.length],
    logo: '', homeAway: i % 2 ? 'AWAY' : 'HOME', date: 'TBD',
  }));
}

// ---------- Speed ----------
test('speed: base speed with no clears', () => eq(currentSpeed(0, GAME.speed), GAME.speed.baseSpeed));
test('speed: +0.8% per cleared box', () => {
  near(speedMultiplier(10, GAME.speed), 1 + 10 * GAME.speed.boostPerClear, 1e-9);
  near(currentSpeed(34, GAME.speed), GAME.speed.baseSpeed * (1 + 34 * GAME.speed.boostPerClear), 1e-9);
});
test('speed: capped at maxSpeedMultiplier', () => {
  eq(speedMultiplier(1000, GAME.speed), GAME.speed.maxSpeedMultiplier);
  eq(maxSpeed(GAME.speed), GAME.speed.baseSpeed * GAME.speed.maxSpeedMultiplier);
});

// ---------- Timer & penalties ----------
test('timer: penalties add exactly penaltySeconds each', () => {
  const t = createTimer(10);
  t.start();
  for (let i = 0; i < 120 * 5; i++) t.tick(1 / 120); // 5 s of fixed steps
  t.addPenalty();
  t.addPenalty();
  near(t.rawMs, 5000, 1e-6, 'raw');
  near(t.displayMs, 25000, 1e-6, 'display');
  const r = t.result();
  eq(r.penalties, 2);
  eq(r.penaltyMs, 20000);
  eq(r.finalTimeMs, r.rawTimeMs + 20000, 'final = raw + 10s x hits');
});
test('timer: does not run while stopped (paused)', () => {
  const t = createTimer(10);
  t.tick(1);
  eq(t.rawMs, 0);
  t.start(); t.tick(1); t.stop(); t.tick(1);
  eq(t.rawMs, 1000);
});
test('timer: makeResult rounds raw to whole ms and keeps penalties exact', () => {
  const r = makeResult(72437.6, 3, 10);
  eq(r.rawTimeMs, 72438);
  eq(r.finalTimeMs, 102438);
});
test('timer: M:SS.t formatting (tenths truncated)', () => {
  eq(formatTime(0), '0:00.0');
  eq(formatTime(72437), '1:12.4');
  eq(formatTime(59999), '0:59.9');
  eq(formatTime(600000), '10:00.0');
  eq(formatTime(-5), '0:00.0');
});

// ---------- Gesture classifier ----------
const G = GAME.input;
test('gesture: quick downward drag is a swipe down', () => eq(classifyGesture(G.swipeMinDistance, 100, G), 'swipeDown'));
test('gesture: quick upward drag is a swipe up', () => eq(classifyGesture(-45, 200, G), 'swipeUp'));
test('gesture: short drag is a tap', () => eq(classifyGesture(G.swipeMinDistance - 1, 100, G), 'tap'));
test('gesture: slow drag is a tap', () => eq(classifyGesture(80, G.swipeMaxTime + 1, G), 'tap'));
test('gesture: exactly at the time limit still counts', () => eq(classifyGesture(-G.swipeMinDistance, G.swipeMaxTime, G), 'swipeUp'));

// ---------- Course: spacing at max speed ----------
test('course: one obstacle per match, in schedule order', () => {
  const m = schedule(34);
  const c = buildCourse(m, GAME);
  eq(c.obstacles.length, 34);
  c.obstacles.forEach((o, i) => eq(o.match.matchNumber, i + 1));
});
test('course: every gap is reactable at MAX speed', () => {
  for (const n of [34, 12, 50]) {
    const c = buildCourse(schedule(n), GAME);
    const vmax = maxSpeed(GAME.speed);
    for (let i = 0; i < c.obstacles.length - 1; i++) {
      const a = c.obstacles[i], b = c.obstacles[i + 1];
      const open = b.x - (a.x + a.w); // clear ground between the two boxes
      const needed = (recoverTime(a.type, GAME.physics) + GAME.course.reactionGap) * vmax;
      ok(open >= needed - 1e-6, `n=${n} gap ${i}->${i + 1}: ${open.toFixed(1)}px < ${needed.toFixed(1)}px`);
      ok(open / vmax >= GAME.course.reactionGap, `gap ${i} reaction time ${(open / vmax).toFixed(2)}s`);
    }
  }
});
test('course: same schedule gives the same layout (fair, learnable runs)', () => {
  const a = buildCourse(schedule(34), GAME);
  const b = buildCourse(schedule(34), GAME);
  eq(JSON.stringify(a.obstacles.map((o) => [o.x, o.type])), JSON.stringify(b.obstacles.map((o) => [o.x, o.type])));
});
test('course: ~60/25/15 mix, easy start, no early hard back-to-back, no tall-tall', () => {
  const n = 34;
  const types = assignTypes(n, GAME.course, createRng(42));
  const count = (t) => types.filter((x) => x === t).length;
  near(count('floating'), n * GAME.course.typeMix.floating, 1.01, 'floating');
  near(count('tall'), n * GAME.course.typeMix.tall, 1.01, 'tall');
  for (let i = 0; i < GAME.course.easyStartCount; i++) eq(types[i], 'ground', `box ${i}`);
  const cutoff = Math.floor(n * GAME.course.noBackToBackHardUntil);
  for (let i = 1; i < n; i++) {
    const hard = (t) => t !== 'ground';
    if (Math.min(i - 1, i) < cutoff) ok(!(hard(types[i - 1]) && hard(types[i])), `hard back-to-back at ${i}`);
    ok(!(types[i - 1] === 'tall' && types[i] === 'tall'), `tall-tall at ${i}`);
  }
});
test('course: works for any schedule length (no hard-coded 34)', () => {
  for (const n of [1, 5, 20, 40]) eq(buildCourse(schedule(n), GAME).obstacles.length, n);
});

// ---------- Physics vs obstacle heights ----------
const O = GAME.obstacles;
function apexOfSingleJump() {
  const s = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  s.jump();
  let top = 0;
  for (let i = 0; i < 240; i++) { s.update(GAME.loop.fixedStep); top = Math.max(top, s.y); }
  return top;
}
test('physics: a single jump clears a ground box', () => ok(apexOfSingleJump() > O.boxSize - O.hitboxInset, 'apex too low'));
test('physics: a single jump cannot clear a tall box', () => ok(apexOfSingleJump() < O.tallCrateHeight + O.boxSize - O.hitboxInset, 'tall box too short'));
test('physics: a double jump clears a tall box', () => {
  const s = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  s.jump();
  let top = 0;
  for (let i = 0; i < 300; i++) {
    if (i === 30) s.jump(); // double jump near the apex
    s.update(GAME.loop.fixedStep);
    top = Math.max(top, s.y);
  }
  ok(top > O.tallCrateHeight + O.boxSize + 20, `double-jump apex ${top.toFixed(1)}`);
});
test('physics: ducking fits under a floating box, standing does not', () => {
  const H = SPARKY_SHEET.hitbox;
  ok(H.duck.h < O.floatingBottom + O.hitboxInset - O.bobAmplitude, 'duck too tall');
  ok(H.stand.h > O.floatingBottom + O.bobAmplitude + O.hitboxInset, 'stand too short');
});
test('physics: duck lasts duckDuration then stands up', () => {
  const s = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  s.duck();
  ok(s.ducking, 'should duck');
  for (let t = 0; t < GAME.physics.duckDuration + 0.05; t += GAME.loop.fixedStep) s.update(GAME.loop.fixedStep);
  ok(!s.ducking, 'should stand back up');
});
test('physics: only one double jump per airtime', () => {
  const s = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  eq(s.jump(), 'jump');
  s.update(0.05);
  eq(s.jump(), 'double');
  s.update(0.05);
  eq(s.jump(), null);
});

// ---------- Balls ----------
test('balls: configured count, never on a tall box, low balls clear of their box', () => {
  const c = buildCourse(schedule(34), GAME);
  eq(c.balls.length, GAME.balls.count);
  for (const b of c.balls) {
    const ob = c.obstacles[b.near];
    ok(ob.type !== 'tall', 'ball on a tall box');
    if (ob.type === 'floating') ok(b.x + GAME.balls.size / 2 < ob.x, 'low ball overlaps its floating box');
  }
});
