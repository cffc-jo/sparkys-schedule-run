// The run: countdown → running → celebrate/complete. Pausable at any point before the finish.
import { GAME } from '../../config/game.js';
import { PALETTE as P } from '../../config/palette.js';
import { SPARKY_SHEET } from '../../config/sprites.js';
import { drawText } from '../pixelText.js';
import { createAnimator } from '../sprite.js';
import { createSparky } from '../game/sparky.js';
import { logoBox, crate } from '../game/boxArt.js';
import { createParticles } from '../game/particles.js';
import { createBanner } from '../game/banner.js';
import { ballFrames, smallBallFrames } from '../art/ballArt.js';
import { createTimer, formatTime } from '../timer.js';
import { currentSpeed } from '../speed.js';
import { buildCourse } from '../course.js';
import { createInput } from '../input/input.js';
import { track } from '../analytics.js';
import { isDebug } from '../debugFlag.js';
import { recordRun } from '../best.js';
import { sceneryForDate, openingScenery } from '../season.js';

const W = GAME.view.width;
const GROUND = GAME.world.groundY;
const SX = GAME.world.sparkyX;
const OB = GAME.obstacles;
const BALL = GAME.balls;
// Finish goal, seen from the side. `lead` = how far before the finish point the goal line sits,
// so Sparky ends up standing inside the net.
const GOAL = { height: 56, topDepth: 10, depth: 42, lead: 18 };
const GLOW = [P.FIRE_RED, P.FLAG_BLUE, P.RED, P.BLUE];

function vibrate(ms) {
  try {
    if (!navigator.vibrate) return; // unsupported (iOS): fail silently
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // needs a tap first
    navigator.vibrate(ms);
  } catch { /* ignore */ }
}

// Flat pixel shadow on the grass, narrower the higher the thing above it is.
function shadow(ctx, cx, width, height, color) {
  const w = Math.max(4, Math.round(width - height / 6));
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(cx - w / 2), GROUND, w, 2);
  ctx.fillRect(Math.round(cx - w / 2) + 2, GROUND + 2, w - 4, 1);
}

function overlaps(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

// Circle (ball) vs box (Sparky), both in world coordinates.
function circleHitsBox(cx, cy, r, b) {
  const nx = Math.max(b.x0, Math.min(cx, b.x1));
  const ny = Math.max(b.y0, Math.min(cy, b.y1));
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}

export function createPlayScene(app) {
  const sparky = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  const anim = createAnimator(SPARKY_SHEET);
  const timer = createTimer(GAME.penalties.penaltySeconds);
  const course = buildCourse(app.schedule.matches, GAME);
  const total = course.obstacles.length;
  const particles = createParticles();
  const banner = createBanner();
  const balls = ballFrames();
  const ballIcon = smallBallFrames()[0];
  const debug = isDebug();
  const sfx = (name) => { if (app.audio && app.audio.play) app.audio.play(name); };

  let phase = 'countdown'; // 'countdown' | 'run' | 'celebrate' | 'done'
  let paused = false;
  let countT = 0;
  let t = 0;
  let dist = 0;
  let speed = GAME.speed.baseSpeed;
  let cleared = 0;
  let grace = 0;
  let shake = 0;
  let invT = 0;        // invincibility time left
  let celebrateT = 0;
  let confettiT = 0;
  let boxes = [];      // per-obstacle runtime state
  let ballState = [];  // per-ball runtime state
  let popups = [];
  let debris = [];
  let result = null;

  const input = createInput(app.renderer.canvas.parentElement, {
    jump() {
      if (phase !== 'run' || paused) return;
      const r = sparky.jump();
      if (r) sfx(r === 'double' ? 'doubleJump' : 'jump');
    },
    duck() {
      if (phase !== 'run' || paused) return;
      if (sparky.duck()) sfx('duck');
    },
    pause() {
      if (phase === 'countdown' || phase === 'run') togglePause();
    },
    menuOpen() {
      return paused || phase === 'celebrate' || phase === 'done';
    },
  });

  function reset() {
    phase = 'countdown';
    paused = false;
    countT = 0;
    t = 0;
    dist = 0;
    cleared = 0;
    speed = currentSpeed(0, GAME.speed);
    grace = 0;
    shake = 0;
    invT = 0;
    celebrateT = 0;
    confettiT = 0;
    popups = [];
    debris = [];
    result = null;
    particles.clear();
    banner.clear();
    const opening = openingScenery(app.schedule.matches);
    app.bg.setSeason(opening.season, { instant: true, isOctober: opening.isOctober });
    sparky.reset();
    timer.reset();
    boxes = course.obstacles.map((ob) => ({
      ob,
      state: 'pending', // 'pending' | 'cleared' | 'hit'
      shattered: false,
      phase: ob.index * 1.7,
      art: logoBox(ob.match, app.logos[ob.match.logo] || null, OB.boxSize, OB.logoSize),
    }));
    ballState = course.balls.map((b, i) => ({ ...b, got: false, phase: i * 2.3 }));
  }

  function pause() {
    if (paused || (phase !== 'countdown' && phase !== 'run')) return;
    paused = true;
    timer.stop();
    app.audio.pauseMusic();
    app.ui.showScreen('pause', { focus: true });
  }

  function resume() {
    if (!paused) return;
    paused = false;
    if (phase === 'run') timer.start();
    app.audio.resumeMusic();
    app.ui.showScreen('play');
    // Drop focus from menu buttons so Space jumps instead of re-pressing a button.
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }

  function togglePause() {
    if (app.modal.isOpen) return;
    if (paused) resume();
    else pause();
  }

  function boxBase(ob) {
    return ob.type === 'tall' ? OB.tallCrateHeight : ob.type === 'floating' ? OB.floatingBottom : 0;
  }

  // Every box reveals its match, whether cleared, shattered or hit, and the scenery moves on to
  // that match's season.
  function reveal(b) {
    banner.show(b.ob.match, b.art);
    const scenery = sceneryForDate(b.ob.match.date);
    if (scenery) app.bg.setSeason(scenery.season, { isOctober: scenery.isOctober });
  }

  function clearBox(b) {
    b.state = 'cleared';
    cleared++;
    speed = currentSpeed(cleared, GAME.speed);
    reveal(b);
    sfx('clear');
  }

  function shatterBox(b) {
    b.shattered = true;
    const cx = b.ob.x - dist + SX + OB.boxSize / 2;
    const cy = GROUND - boxBase(b.ob) - OB.boxSize / 2;
    const home = String(b.ob.match.homeAway).toUpperCase() === 'HOME';
    particles.burst(cx, cy, { count: 18, colors: [home ? P.RED : P.FLAG_BLUE, P.WHITE, P.DARK_NAVY, P.FIRE_RED], speed: 160, up: 80, size: 3 });
    clearBox(b);
    vibrate(20);
  }

  function hitBox(b, penalize) {
    b.state = 'hit';
    debris.push({ img: b.art, x: b.ob.x - dist + SX, y: GROUND - boxBase(b.ob) - OB.boxSize, vx: 90, vy: -170, rot: 0, vr: 9 });
    reveal(b);
    if (!penalize) return;
    timer.addPenalty();
    grace = GAME.penalties.graceSeconds;
    shake = GAME.penalties.shakeSeconds;
    sparky.stumble(GAME.physics.hitStumbleTime);
    popups.push({ text: `+${GAME.penalties.penaltySeconds}`, x: SX, y: GROUND - sparky.y - 44, age: 0 });
    sfx('hit');
    app.audio.play('penalty', 0.14);
    vibrate(60);
  }

  function collectBall(ball) {
    ball.got = true;
    invT = BALL.invincibilitySeconds; // resets, never stacks
    particles.burst(SX + (ball.x - dist), GROUND - ball.y, { count: 14, colors: [P.WHITE, P.FLAG_BLUE, P.FIRE_RED], speed: 110, gravity: 120, life: 0.5 });
    popups.push({ text: 'POWER UP!', x: SX, y: GROUND - sparky.y - 44, age: 0, small: true });
    sfx('collect');
    sfx('invincibleStart');
    app.audio.setTempo(1.25);
    vibrate(30);
  }

  function finish() {
    phase = 'celebrate';
    celebrateT = 0;
    invT = 0;
    timer.stop();
    result = timer.result();
    app.lastResult = result;          // one result object: { finalTimeMs, rawTimeMs, penalties, penaltyMs }
    app.lastBest = recordRun(result); // personal best on this device
    app.ui.setPauseVisible(false);
    track('game_complete', { finalTimeMs: result.finalTimeMs, rawTimeMs: result.rawTimeMs, penalties: result.penalties });
    app.audio.music(null);
    sfx('fanfare');
    if (!app.reducedMotion) {
      particles.burst(W / 2, 120, { count: 40, colors: [P.FIRE_RED, P.WHITE, P.FLAG_BLUE, P.RED, P.BLUE], speed: 180, up: 60, gravity: 160, life: 1.6, scroll: false });
    }
  }

  function step(dt) {
    const wasAirborne = !sparky.grounded;
    sparky.update(dt);
    if (wasAirborne && sparky.grounded && !app.reducedMotion) {
      const sc = app.bg.scenery;
      particles.burst(SX, GROUND - 1, { count: 6, colors: [sc.GRASS_TIP, sc.GRASS_A], speed: 50, up: 30, gravity: 300, life: 0.3, size: 1 });
    }
    const sb = sparky.hitbox(dist);
    const invincible = invT > 0;

    for (const b of boxes) {
      if (b.state !== 'pending') continue;
      const ob = b.ob;
      if (ob.x > dist + 40) break; // course is sorted; nothing further is close yet
      for (const r of ob.rects) {
        if (invincible && !r.inset) continue; // cables don't matter when you're smashing boxes
        const ins = r.inset ? OB.hitboxInset : 0;
        const box = { x0: ob.x + r.x0 + ins, x1: ob.x + r.x1 - ins, y0: r.y0 + ins, y1: r.y1 - ins };
        if (overlaps(sb, box)) {
          if (invincible) shatterBox(b);
          else hitBox(b, grace <= 0 && !app.godMode);
          break;
        }
      }
      if (b.state === 'pending' && ob.x + ob.w < sb.x0) clearBox(b);
    }

    for (const ball of ballState) {
      if (ball.got || Math.abs(ball.x - dist) > 30) continue;
      if (circleHitsBox(ball.x, ball.y, BALL.radius, sb)) collectBall(ball);
    }
  }

  function updateEffects(dt, worldSpeed) {
    grace = Math.max(0, grace - dt);
    shake = Math.max(0, shake - dt);
    const wasWarning = invT > 0 && invT <= BALL.warningSeconds;
    const wasInvincible = invT > 0;
    invT = Math.max(0, invT - dt);
    if (!wasWarning && invT > 0 && invT <= BALL.warningSeconds) sfx('invincibleEnding');
    if (wasInvincible && invT === 0) app.audio.setTempo(1);
    for (const p of popups) { p.age += dt; p.y -= 30 * dt; }
    popups = popups.filter((p) => p.age < 0.9);
    for (const d of debris) {
      d.vy += 600 * dt;
      d.x += (d.vx - worldSpeed) * dt;
      d.y += d.vy * dt;
      d.rot += d.vr * dt;
    }
    debris = debris.filter((d) => d.y < GAME.view.height + 40);
    particles.update(dt, worldSpeed);
    banner.update(dt);
  }

  return {
    get result() { return result; },
    // Read-only snapshot for debug tools and automated play-tests.
    get debugState() {
      return { phase, paused, dist, speed, cleared, total, course, sparky, timer, boxes, balls: ballState, grace, invT };
    },
    // Debug: jump to just before the finish line.
    skipToFinish() {
      if (phase !== 'run') return;
      for (const b of boxes) if (b.state === 'pending') { b.state = 'cleared'; cleared++; }
      dist = course.finishX - 120;
    },

    enter() {
      reset();
      anim.play('idle', true);
      app.ui.showScreen('play');
      app.ui.setPauseVisible(true);
      input.enabled = true;
      app.audio.music(null); // countdown beeps play over silence; the theme starts on GO
      sfx('beep'); // the "3"
      track('game_start', { matches: total });
    },

    exit() {
      input.enabled = false;
      paused = false;
      app.ui.setPauseVisible(false);
    },

    togglePause,
    resume,
    restart() { app.go('play'); },
    onHide() { pause(); },
    onModalChange(open) { if (open) pause(); },

    update(dt) {
      if (paused) return;
      t += dt;
      let worldSpeed = 0;

      if (phase === 'countdown') {
        const before = Math.floor(countT / GAME.ui.countdownStepSeconds);
        countT += dt;
        const now = Math.floor(countT / GAME.ui.countdownStepSeconds);
        if (now !== before) sfx(now >= 3 ? 'go' : 'beep');
        if (countT >= GAME.ui.countdownStepSeconds * 3) {
          phase = 'run';
          timer.start();
          app.audio.music('game');
        }
      } else if (phase === 'run') {
        worldSpeed = speed;
        dist += speed * dt;
        timer.tick(dt);
        step(dt);
        if (dist >= course.finishX) finish();
      } else if (phase === 'celebrate') {
        celebrateT += dt;
        confettiT += dt;
        if (confettiT > 0.3 && celebrateT < GAME.ui.celebrateSeconds && !app.reducedMotion) {
          confettiT = 0;
          particles.burst(20 + Math.random() * (W - 40), 60 + Math.random() * 60, { count: 12, colors: [P.FIRE_RED, P.WHITE, P.FLAG_BLUE, P.RED], speed: 90, gravity: 140, life: 1.4, scroll: false });
        }
        if (celebrateT >= GAME.ui.celebrateSeconds) {
          phase = 'done';
          app.audio.music('title');
          const summary = document.querySelector('[data-bind-text="finish-summary"]');
          if (summary) summary.textContent = `Finish! Run time ${formatTime(result.rawTimeMs)}, ${result.penalties} penalties, final time ${formatTime(result.finalTimeMs)}.`;
          app.ui.showScreen('finish', { focus: true });
        }
      }

      app.bg.update(dt, worldSpeed, 0);
      updateEffects(dt, worldSpeed);

      const pose = phase === 'countdown' ? 'idle' : phase === 'run' ? sparky.pose : 'victory';
      anim.play(pose);
      anim.update(dt);
    },

    render(ctx) {
      const reduced = app.reducedMotion;
      ctx.save();
      if (shake > 0 && !reduced) {
        const m = GAME.penalties.shakeMagnitude;
        ctx.translate(Math.round((Math.random() * 2 - 1) * m), Math.round((Math.random() * 2 - 1) * m));
      }
      app.bg.render(ctx);

      this.renderFinishLine(ctx);
      this.renderBoxes(ctx, reduced);
      this.renderBalls(ctx, reduced);
      this.renderSparky(ctx);

      // Knocked-away boxes
      for (const d of debris) {
        ctx.save();
        ctx.translate(Math.round(d.x + OB.boxSize / 2), Math.round(d.y + OB.boxSize / 2));
        ctx.rotate(Math.round(d.rot / (Math.PI / 4)) * (Math.PI / 4));
        ctx.drawImage(d.img, -OB.boxSize / 2, -OB.boxSize / 2, OB.boxSize, OB.boxSize);
        ctx.restore();
      }
      particles.render(ctx);

      // "+10" and power-up pops
      for (const p of popups) {
        if (p.small) drawText(ctx, p.text, p.x + 10, p.y, { align: 'center', color: P.WHITE, outline: P.DARK_NAVY });
        else drawText(ctx, p.text, p.x, p.y, { size: 16, align: 'center', color: P.FIRE_RED, outline: P.WHITE });
      }

      if (debug) this.renderDebug(ctx);
      ctx.restore();

      banner.render(ctx, { reducedMotion: reduced });
      this.renderHud(ctx);

      if (phase === 'countdown') {
        const i = Math.floor(countT / GAME.ui.countdownStepSeconds);
        const label = ['3', '2', '1'][i] || 'GO!';
        drawText(ctx, label, W / 2, 130, { size: 32, align: 'center', color: P.WHITE, outline: P.DARK_NAVY, shadow: P.RED, shadowOffset: 3 });
      } else if (phase === 'run' && dist < course.obstacles[0]?.x * 0.5) {
        drawText(ctx, 'GO!', W / 2, 130, { size: 32, align: 'center', color: P.WHITE, outline: P.DARK_NAVY, shadow: P.RED, shadowOffset: 3 });
      }

      if (phase === 'celebrate') {
        const pop = reduced ? 0 : Math.round(Math.sin(Math.min(1, celebrateT * 3) * Math.PI) * 6);
        drawText(ctx, 'SEASON', W / 2, 110 - pop, { size: 24, align: 'center', color: P.WHITE, outline: P.DARK_NAVY, shadow: P.RED, shadowOffset: 3 });
        drawText(ctx, 'COMPLETE!', W / 2, 140 - pop, { size: 24, align: 'center', color: P.WHITE, outline: P.DARK_NAVY, shadow: P.RED, shadowOffset: 3 });
      }
      if (phase === 'done' && result) this.renderComplete(ctx);
    },

    // Side-on soccer goal: upright post on the goal line, short top bar, back support sloping
    // down to the ground, net mesh filling the trapezoid. Sparky finishes standing inside it.
    renderFinishLine(ctx) {
      const fx = Math.round(course.finishX - dist + SX);
      if (fx < -80 || fx > W + 80) return;
      const post = fx - GOAL.lead;          // goal line
      const top = GROUND - GOAL.height;
      const backTop = post + GOAL.topDepth; // where the top bar meets the sloping support
      const back = post + GOAL.depth;       // where the support meets the ground
      const backX = (y) => backTop + ((y - top) * (back - backTop)) / GOAL.height;

      // Chequered goal line on the grass
      for (let y = GROUND - 2; y < GROUND + 14; y += 2) {
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = (((y - GROUND) / 2 + i) % 2 === 0) ? P.WHITE : P.DARK_NAVY;
          ctx.fillRect(post - 1 + i * 2, y, 2, 2);
        }
      }
      // Net mesh, clipped to the trapezoid
      ctx.fillStyle = P.WHITE;
      for (let x = post + 4; x < back; x += 4) {
        const yTop = x <= backTop ? top + 2 : top + ((x - backTop) * GOAL.height) / (back - backTop);
        ctx.fillRect(x, Math.round(yTop), 1, GROUND - Math.round(yTop));
      }
      for (let y = top + 4; y < GROUND; y += 4) {
        ctx.fillRect(post + 2, y, Math.round(backX(y)) - post - 2, 1);
      }
      // Back support (sloping) and ground bar: dark outline, then white
      for (let y = top; y <= GROUND; y++) {
        const x = Math.round(backX(y));
        ctx.fillStyle = P.DARK_NAVY;
        ctx.fillRect(x - 1, y, 4, 1);
      }
      for (let y = top; y <= GROUND; y++) {
        ctx.fillStyle = P.WHITE;
        ctx.fillRect(Math.round(backX(y)), y, 2, 1);
      }
      ctx.fillStyle = P.WHITE;
      ctx.fillRect(post, GROUND - 1, back - post, 1);
      // Top bar and front post (thicker, so the goal frame reads clearly)
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(post - 1, top - 1, backTop - post + 3, 4);
      ctx.fillRect(post - 1, top - 1, 5, GOAL.height + 1);
      ctx.fillStyle = P.WHITE;
      ctx.fillRect(post, top, backTop - post + 1, 2);
      ctx.fillRect(post, top, 3, GOAL.height);
    },

    renderBoxes(ctx, reduced) {
      const amp = reduced ? 1 : OB.bobAmplitude;
      for (const b of boxes) {
        const ob = b.ob;
        const sx = Math.round(ob.x - dist + SX);
        if (sx > W + 10) break;
        if (sx + ob.w < -10) continue;
        const wave = Math.sin(t * OB.bobSpeed + b.phase);
        const gone = b.state === 'hit' || b.shattered;
        if (!gone || ob.type === 'tall') shadow(ctx, sx + ob.w / 2, ob.w + 4, ob.type === 'floating' ? OB.floatingBottom : 0, app.bg.scenery.GRASS_DEEP);
        let drawBottom;
        if (ob.type === 'floating') {
          drawBottom = OB.floatingBottom + Math.round(wave * amp);
          if (!gone) {
            const top = GROUND - drawBottom - OB.boxSize;
            ctx.fillStyle = P.DARK_NAVY;
            ctx.fillRect(sx + ob.w / 2 - 1, 0, 2, top);
            ctx.fillRect(sx + ob.w / 2 - 3, top - 2, 6, 2);
          }
        } else {
          if (ob.type === 'tall') ctx.drawImage(crate(ob.w, OB.tallCrateHeight), sx, GROUND - OB.tallCrateHeight);
          drawBottom = (ob.type === 'tall' ? OB.tallCrateHeight : 0) + Math.round(Math.abs(wave) * amp);
        }
        if (gone) continue;
        const squash = ob.type !== 'floating' && !reduced && Math.abs(wave) < 0.12;
        const y = GROUND - drawBottom - OB.boxSize;
        if (squash) ctx.drawImage(b.art, sx - 1, y + 2, OB.boxSize + 2, OB.boxSize - 2);
        else ctx.drawImage(b.art, sx, y, OB.boxSize, OB.boxSize);
      }
    },

    renderBalls(ctx, reduced) {
      for (const ball of ballState) {
        if (ball.got) continue;
        const sx = Math.round(ball.x - dist + SX);
        const r = BALL.size / 2;
        if (sx < -BALL.size || sx > W + BALL.size) continue;
        const bob = reduced ? 0 : Math.round(Math.sin(t * 3 + ball.phase) * BALL.bobAmplitude);
        const cy = GROUND - ball.y + bob;
        shadow(ctx, sx, BALL.size, ball.y - r, app.bg.scenery.GRASS_DEEP);
        const frame = balls[reduced ? 0 : Math.floor(t * BALL.spinFps + ball.phase) % 4];
        ctx.drawImage(frame, sx - r, cy - r);
        // Sparkle: a twinkling pixel star that hops around the ball
        const k = Math.floor(t * 4 + ball.phase) % 4;
        const [ox, oy] = [[-r - 4, -r + 1], [r + 3, -r + 2], [r + 4, r - 3], [-r - 3, r - 2]][k];
        if (Math.floor(t * 8 + ball.phase) % 2 === 0) {
          ctx.fillStyle = k % 2 ? P.FLAG_BLUE : P.WHITE;
          ctx.fillRect(sx + ox, cy + oy - 2, 1, 5);
          ctx.fillRect(sx + ox - 2, cy + oy, 5, 1);
          ctx.fillStyle = P.WHITE;
          ctx.fillRect(sx + ox, cy + oy, 1, 1);
        }
      }
    },

    renderSparky(ctx) {
      shadow(ctx, SX, 18, sparky.y, app.bg.scenery.GRASS_DEEP);
      const visible = invT > 0 || grace <= 0 || Math.floor(grace * (app.reducedMotion ? 4 : 16)) % 2 === 0;
      if (!visible) return;
      const feetY = GROUND - Math.round(sparky.y);
      const warning = invT > 0 && invT <= BALL.warningSeconds;
      const reduced = app.reducedMotion; // steady glow, no rapid flashing
      const glowOn = invT > 0 && (!warning || reduced || Math.floor(invT * 10) % 2 === 0);
      const glow = reduced ? (warning ? P.WHITE : P.FLAG_BLUE) : GLOW[Math.floor(t * 10) % GLOW.length];
      if (anim.name === 'spin') {
        const turns = Math.floor(sparky.spinT / 0.1) % 4;
        ctx.save();
        ctx.translate(SX, feetY - 18); // spin around the middle of the 36px frame
        ctx.rotate((turns * Math.PI) / 2);
        if (glowOn) app.sheet.drawGlow(ctx, anim.frame, 0, 16, glow);
        app.sheet.draw(ctx, anim.frame, 0, 18);
        ctx.restore();
      } else {
        if (glowOn) app.sheet.drawGlow(ctx, anim.frame, SX, feetY, glow);
        app.sheet.draw(ctx, anim.frame, SX, feetY);
      }
    },

    renderDebug(ctx) {
      ctx.strokeStyle = P.FIRE_RED;
      const sb = sparky.hitbox(dist);
      ctx.strokeRect(SX + (sb.x0 - dist) + 0.5, GROUND - sb.y1 + 0.5, sb.x1 - sb.x0, sb.y1 - sb.y0);
      ctx.strokeStyle = P.DARK_BLUE;
      for (const b of boxes) {
        const sx = b.ob.x - dist + SX;
        if (sx > W || sx < -40) continue;
        for (const r of b.ob.rects) {
          const ins = r.inset ? OB.hitboxInset : 0;
          const y1 = Math.min(r.y1 - ins, 600);
          ctx.strokeRect(sx + r.x0 + ins + 0.5, GROUND - y1 + 0.5, r.x1 - r.x0 - 2 * ins, y1 - r.y0 - ins);
        }
      }
      for (const ball of ballState) {
        if (ball.got) continue;
        const sx = ball.x - dist + SX;
        ctx.strokeRect(sx - BALL.radius + 0.5, GROUND - ball.y - BALL.radius + 0.5, BALL.radius * 2, BALL.radius * 2);
      }
    },

    renderHud(ctx) {
      const x = 6, y = 6, w = 108, h = 38;
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = grace > 0 && Math.floor(grace * 8) % 2 === 0 ? P.DARK_RED : P.RED;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = P.FIRE_RED;
      ctx.fillRect(x, y, w, 1);
      drawText(ctx, formatTime(timer.displayMs), x + 6, y + 5, { size: 16, color: P.WHITE, shadow: P.DARK_RED });
      drawText(ctx, `BOX ${cleared}/${total}`, x + 6, y + 26, { size: 8, color: P.WHITE });

      // Invincibility meter (only while active): ball icon + draining bar, blinks in the last second
      if (invT > 0) {
        const my = y + h + 3;
        const warning = invT <= BALL.warningSeconds && Math.floor(invT * 10) % 2 === 0;
        ctx.drawImage(ballIcon, x, my);
        ctx.fillStyle = P.DARK_NAVY;
        ctx.fillRect(x + 12, my + 2, w - 12, 7);
        ctx.fillStyle = P.NAVY;
        ctx.fillRect(x + 13, my + 3, w - 14, 5);
        ctx.fillStyle = warning ? P.WHITE : P.FLAG_BLUE;
        ctx.fillRect(x + 13, my + 3, Math.ceil((w - 14) * (invT / BALL.invincibilitySeconds)), 5);
      }
    },

    renderComplete(ctx) {
      const w = 214, h = 168, x = Math.round((W - w) / 2), y = 58;
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = P.WHITE;
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = P.DEEP_RED;
      ctx.fillRect(x, y, w, h);
      drawText(ctx, 'FINISH!', W / 2, y + 12, { size: 16, align: 'center', color: P.WHITE, shadow: P.DARK_RED, shadowOffset: 2 });
      const row = (label, value, ry, color = P.WHITE) => {
        drawText(ctx, label, x + 12, ry, { color: P.FLAG_BLUE });
        drawText(ctx, value, x + w - 12, ry, { align: 'right', color });
      };
      row('RUN TIME', formatTime(result.rawTimeMs), y + 48);
      row(`PENALTIES x${result.penalties}`, `+${formatTime(result.penaltyMs)}`, y + 66);
      ctx.fillStyle = P.WHITE;
      ctx.fillRect(x + 12, y + 84, w - 24, 1);
      drawText(ctx, 'FINAL TIME', W / 2, y + 96, { align: 'center', color: P.FLAG_BLUE });
      drawText(ctx, formatTime(result.finalTimeMs), W / 2, y + 112, { size: 24, align: 'center', color: P.WHITE, shadow: P.DARK_RED, shadowOffset: 2 });
      drawText(ctx, `BOXES CLEARED ${cleared}/${total}`, W / 2, y + 150, { align: 'center', color: P.WHITE });
    },
  };
}
