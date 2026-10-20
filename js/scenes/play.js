// The run: countdown → running → complete. Pausable at any point before completion.
import { GAME } from '../../config/game.js';
import { PALETTE as P, SCENERY } from '../../config/palette.js';
import { SPARKY_SHEET } from '../../config/sprites.js';
import { drawText } from '../pixelText.js';
import { createAnimator } from '../sprite.js';
import { createSparky } from '../game/sparky.js';
import { logoBox, crate } from '../game/boxArt.js';
import { createTimer, formatTime } from '../timer.js';
import { currentSpeed } from '../speed.js';
import { buildCourse } from '../course.js';
import { createInput } from '../input/input.js';
import { track } from '../analytics.js';
import { isDebug } from '../debugFlag.js';

const W = GAME.view.width;
const GROUND = GAME.world.groundY;
const SX = GAME.world.sparkyX;
const OB = GAME.obstacles;

function vibrate(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* unsupported (iOS) */ }
}

// Flat pixel shadow on the grass, narrower the higher the thing above it is.
function shadow(ctx, cx, width, height) {
  const w = Math.max(4, Math.round(width - height / 6));
  ctx.fillStyle = SCENERY.GRASS_DEEP;
  ctx.fillRect(Math.round(cx - w / 2), GROUND, w, 2);
  ctx.fillRect(Math.round(cx - w / 2) + 2, GROUND + 2, w - 4, 1);
}

function overlaps(a, b) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

export function createPlayScene(app) {
  const sparky = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  const anim = createAnimator(SPARKY_SHEET);
  const timer = createTimer(GAME.penalties.penaltySeconds);
  const course = buildCourse(app.schedule.matches, GAME);
  const total = course.obstacles.length;
  const debug = isDebug();

  let phase = 'countdown'; // 'countdown' | 'run' | 'done'
  let paused = false;
  let countT = 0;
  let t = 0;
  let dist = 0;
  let speed = GAME.speed.baseSpeed;
  let cleared = 0;
  let grace = 0;
  let shake = 0;
  let boxes = [];   // per-obstacle runtime state
  let popups = [];
  let debris = [];
  let result = null;

  const input = createInput(app.renderer.canvas.parentElement, {
    jump() {
      if (phase === 'run' && !paused) sparky.jump();
    },
    duck() {
      if (phase === 'run' && !paused) sparky.duck();
    },
    pause() {
      if (phase !== 'done') togglePause();
    },
    menuOpen() {
      return paused || phase === 'done';
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
    popups = [];
    debris = [];
    result = null;
    sparky.reset();
    timer.reset();
    boxes = course.obstacles.map((ob) => ({
      ob,
      state: 'pending', // 'pending' | 'cleared' | 'hit'
      phase: ob.index * 1.7,
      art: logoBox(ob.match, app.logos[ob.match.logo] || null, OB.boxSize, OB.logoSize),
    }));
  }

  function pause() {
    if (paused || phase === 'done') return;
    paused = true;
    timer.stop();
    app.ui.showScreen('pause', { focus: true });
  }

  function resume() {
    if (!paused) return;
    paused = false;
    if (phase === 'run') timer.start();
    app.ui.showScreen('play');
    // Drop focus from menu buttons so Space jumps instead of re-pressing a button.
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }

  function togglePause() {
    if (app.modal.isOpen) return;
    if (paused) resume();
    else pause();
  }

  function hitBox(b, penalize) {
    b.state = 'hit';
    const base = b.ob.type === 'tall' ? OB.tallCrateHeight : b.ob.type === 'floating' ? OB.floatingBottom : 0;
    debris.push({ img: b.art, x: b.ob.x - dist + SX, y: GROUND - base - OB.boxSize, vx: 90, vy: -170, rot: 0, vr: 9 });
    if (!penalize) return;
    timer.addPenalty();
    grace = GAME.penalties.graceSeconds;
    shake = GAME.penalties.shakeSeconds;
    sparky.stumble(GAME.physics.hitStumbleTime);
    popups.push({ text: `+${GAME.penalties.penaltySeconds}`, x: SX, y: GROUND - sparky.y - 40, age: 0 });
    vibrate(60);
  }

  function finish() {
    phase = 'done';
    timer.stop();
    result = timer.result();
    app.lastResult = result;
    track('game_complete', { finalTimeMs: result.finalTimeMs, rawTimeMs: result.rawTimeMs, penalties: result.penalties });
    app.ui.setPauseVisible(false);
    app.ui.showScreen('complete', { focus: false });
  }

  function step(dt) {
    sparky.update(dt);
    const sb = sparky.hitbox(dist);
    for (const b of boxes) {
      if (b.state !== 'pending') continue;
      const ob = b.ob;
      if (ob.x > dist + 40) break; // course is sorted; nothing further is close yet
      for (const r of ob.rects) {
        const ins = r.inset ? OB.hitboxInset : 0;
        const box = { x0: ob.x + r.x0 + ins, x1: ob.x + r.x1 - ins, y0: r.y0 + ins, y1: r.y1 - ins };
        if (overlaps(sb, box)) {
          hitBox(b, grace <= 0 && !app.godMode);
          break;
        }
      }
      if (b.state === 'pending' && ob.x + ob.w < sb.x0) {
        b.state = 'cleared';
        cleared++;
        speed = currentSpeed(cleared, GAME.speed);
      }
    }
  }

  return {
    get result() { return result; },
    // Read-only snapshot for debug tools and automated play-tests.
    get debugState() {
      return { phase, paused, dist, speed, cleared, total, course, sparky, timer, boxes, grace };
    },

    enter() {
      reset();
      anim.play('idle', true);
      app.ui.showScreen('play');
      app.ui.setPauseVisible(true);
      input.enabled = true;
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

      if (phase === 'countdown') {
        countT += dt;
        if (countT >= GAME.ui.countdownStepSeconds * 3) {
          phase = 'run';
          timer.start();
        }
      } else if (phase === 'run') {
        dist += speed * dt;
        timer.tick(dt);
        step(dt);
        if (dist >= course.finishX) finish();
      }

      app.bg.update(dt, phase === 'run' ? speed : 0, 0);
      grace = Math.max(0, grace - dt);
      shake = Math.max(0, shake - dt);
      for (const p of popups) { p.age += dt; p.y -= 30 * dt; }
      popups = popups.filter((p) => p.age < 0.9);
      for (const d of debris) {
        d.vy += 600 * dt;
        d.x += (d.vx - (phase === 'run' ? speed : 0)) * dt;
        d.y += d.vy * dt;
        d.rot += d.vr * dt;
      }
      debris = debris.filter((d) => d.y < 520);

      const pose = phase === 'countdown' ? 'idle' : phase === 'done' ? 'victory' : sparky.pose;
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

      // Obstacles
      const amp = reduced ? 1 : OB.bobAmplitude;
      for (const b of boxes) {
        const ob = b.ob;
        const sx = Math.round(ob.x - dist + SX);
        if (sx > W + 10) break;
        if (sx + ob.w < -10) continue;
        const wave = Math.sin(t * OB.bobSpeed + b.phase);
        if (b.state !== 'hit' || ob.type === 'tall') shadow(ctx, sx + ob.w / 2, ob.w + 4, ob.type === 'floating' ? OB.floatingBottom : 0);
        if (ob.type === 'floating') {
          b.drawBottom = OB.floatingBottom + Math.round(wave * amp);
          const top = GROUND - b.drawBottom - OB.boxSize;
          ctx.fillStyle = P.DARK_NAVY;
          ctx.fillRect(sx + ob.w / 2 - 1, 0, 2, top);
          ctx.fillRect(sx + ob.w / 2 - 3, top - 2, 6, 2);
        } else {
          const base = ob.type === 'tall' ? OB.tallCrateHeight : 0;
          if (ob.type === 'tall') ctx.drawImage(crate(ob.w, OB.tallCrateHeight), sx, GROUND - OB.tallCrateHeight);
          b.drawBottom = base + Math.round(Math.abs(wave) * amp);
        }
        if (b.state === 'hit') continue;
        const squash = ob.type !== 'floating' && !reduced && Math.abs(wave) < 0.12;
        const y = GROUND - b.drawBottom - OB.boxSize;
        if (squash) ctx.drawImage(b.art, sx - 1, y + 2, OB.boxSize + 2, OB.boxSize - 2);
        else ctx.drawImage(b.art, sx, y);
      }

      // Sparky (flickers during grace frames)
      shadow(ctx, SX, 18, sparky.y);
      const visible = grace <= 0 || Math.floor(grace * 16) % 2 === 0;
      if (visible) {
        const feetY = GROUND - Math.round(sparky.y);
        if (anim.name === 'spin') {
          const turns = Math.floor(sparky.spinT / 0.1) % 4;
          ctx.save();
          ctx.translate(SX, feetY - 15);
          ctx.rotate((turns * Math.PI) / 2);
          app.sheet.draw(ctx, anim.frame, 0, 15);
          ctx.restore();
        } else {
          app.sheet.draw(ctx, anim.frame, SX, feetY);
        }
      }

      // Knocked-away boxes
      for (const d of debris) {
        ctx.save();
        ctx.translate(Math.round(d.x + OB.boxSize / 2), Math.round(d.y + OB.boxSize / 2));
        ctx.rotate(Math.round(d.rot / (Math.PI / 4)) * (Math.PI / 4));
        ctx.drawImage(d.img, -OB.boxSize / 2, -OB.boxSize / 2);
        ctx.restore();
      }

      // "+10" pops
      for (const p of popups) {
        drawText(ctx, p.text, p.x, p.y, { size: 16, align: 'center', color: P.FIRE_RED, outline: P.WHITE });
      }

      if (debug) {
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
      }
      ctx.restore();

      this.renderHud(ctx);

      if (phase === 'countdown') {
        const i = Math.floor(countT / GAME.ui.countdownStepSeconds);
        const label = ['3', '2', '1'][i] || 'GO!';
        drawText(ctx, label, W / 2, 130, { size: 32, align: 'center', color: P.WHITE, outline: P.DARK_NAVY, shadow: P.RED, shadowOffset: 3 });
      } else if (phase === 'run' && dist < course.obstacles[0]?.x * 0.5) {
        drawText(ctx, 'GO!', W / 2, 130, { size: 32, align: 'center', color: P.WHITE, outline: P.DARK_NAVY, shadow: P.RED, shadowOffset: 3 });
      }

      if (phase === 'done' && result) this.renderComplete(ctx);
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
