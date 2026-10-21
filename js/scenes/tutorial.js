// First-time tutorial: five short cards, each over a live demo of Sparky acting it out.
// Skippable at any point (SKIP button or Esc); remembered on the device so it only plays once.
// Replay it from the How to Play screen.
import { GAME } from '../../config/game.js';
import { PALETTE as P } from '../../config/palette.js';
import { SPARKY_SHEET } from '../../config/sprites.js';
import { createSparky } from '../game/sparky.js';
import { createAnimator } from '../sprite.js';
import { logoBox, crate } from '../game/boxArt.js';
import { createBanner } from '../game/banner.js';
import { createParticles } from '../game/particles.js';
import { ballFrames } from '../art/ballArt.js';
import { save } from '../storage.js';
import { track } from '../analytics.js';

const W = GAME.view.width;
const GROUND = GAME.world.groundY;
const SX = GAME.world.sparkyX;
const OB = GAME.obstacles;
const SPEED = 165;       // demo scroll speed (px/s)
const SPACING = 230;     // px between demo boxes
const FIRST = 200;       // px to the first demo box
export const TUTORIAL_KEY = 'tutorialSeen';

const touch = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

// Each step: card text + the demo pattern (repeats while the card is up).
function steps(season) {
  const t = touch();
  const inv = GAME.balls.invincibilitySeconds;
  const pen = GAME.penalties.penaltySeconds;
  return [
    {
      title: 'THE GOAL',
      text: `Run the whole <b>${season}</b> season. Every box is an <b>opponent</b>. Fastest time wins, and hitting a box costs <b>+${pen} seconds</b>!`,
      pattern: ['ground'],
    },
    {
      title: 'JUMP',
      text: t
        ? '<b>TAP</b> to jump over boxes. <b>TAP AGAIN</b> in mid-air to <b>DOUBLE-JUMP</b> over tall stacks.'
        : 'Press <b>SPACE</b> (or <b>W</b> / <b>↑</b>) to jump. Press again in mid-air to <b>DOUBLE-JUMP</b> over tall stacks.',
      pattern: ['ground', 'tall'],
    },
    {
      title: 'DUCK',
      text: t
        ? '<b>SWIPE DOWN</b> to duck under boxes hanging from a cable.'
        : 'Press <b>S</b> (or <b>↓</b>) to duck under boxes hanging from a cable.',
      pattern: ['floating'],
    },
    {
      title: 'POWER-UPS',
      text: `Grab a <b>SOCCER BALL</b> for <b>${inv} seconds</b> of invincibility and smash through boxes with <b>no penalty</b>!`,
      pattern: ['ball'],
    },
    {
      title: 'THE SCHEDULE',
      text: 'Every box you pass <b>reveals a match</b>: opponent, home or away, and date. Finish to see the <b>whole schedule</b>!',
      pattern: ['ground'],
      banner: true,
    },
  ];
}

export function createTutorialScene(app) {
  const root = document.querySelector('[data-screen="tutorial"]');
  const $ = (k) => root.querySelector(`[data-tut="${k}"]`);
  const sparky = createSparky(GAME.physics, SPARKY_SHEET.hitbox);
  const anim = createAnimator(SPARKY_SHEET);
  const banner = createBanner();
  const particles = createParticles();
  const balls = ballFrames();
  let list = [];
  let index = 0;
  let t = 0;
  let dist = 0;
  let items = [];     // demo boxes { x, type, match, art, gone, passed, ball }
  let invT = 0;
  let spawned = 0;

  function matchFor(i) {
    const m = app.schedule.matches;
    return m[i % m.length];
  }

  function spawn() {
    const step = list[index];
    const kind = step.pattern[spawned % step.pattern.length];
    const match = matchFor(spawned);
    const type = kind === 'ball' ? 'ground' : kind;
    const x = FIRST + spawned * SPACING;
    items.push({
      x, type, match, gone: false, passed: false,
      art: logoBox(match, app.logos[match.logo] || null, OB.boxSize, OB.logoSize),
      ball: kind === 'ball' ? { x: x - 70, got: false } : null,
    });
    spawned++;
  }

  function showStep(i) {
    index = i;
    const step = list[i];
    $('step').textContent = `${i + 1} / ${list.length}`;
    $('title').textContent = step.title;
    $('text').innerHTML = step.text;
    $('next').textContent = i === list.length - 1 ? "LET'S GO!" : 'NEXT';
    $('dots').innerHTML = list.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('');
    // Restart the demo for this step
    sparky.reset();
    dist = 0;
    items = [];
    spawned = 0;
    invT = 0;
    banner.clear();
    particles.clear();
    for (let k = 0; k < 3; k++) spawn();
  }

  function finish(skipped) {
    save(TUTORIAL_KEY, true);
    track(skipped ? 'tutorial_skip' : 'tutorial_complete', { step: index + 1 });
    app.go('play');
  }

  function onKey(e) {
    if (app.scene !== scene || app.modal.isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); finish(true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); scene.next(); }
    else if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); showStep(index - 1); }
  }
  window.addEventListener('keydown', onKey);

  // The auto-pilot: does the right move for each demo box.
  function autopilot() {
    const next = items.find((it) => !it.passed && !it.gone);
    if (!next) return;
    const tArr = (next.x - (dist + 6)) / SPEED;
    if (next.type === 'ground' && sparky.grounded && tArr < 0.12 && !(invT > 0)) sparky.jump();
    if (next.type === 'floating' && sparky.grounded && !sparky.ducking && tArr < 0.1) sparky.duck();
    if (next.type === 'tall') {
      if (sparky.grounded && tArr < 0.28) sparky.jump();
      else if (!sparky.grounded && sparky.spinT < 0 && sparky.y > 50) sparky.jump();
    }
  }

  const scene = {
    enter() {
      const season = app.schedule.season;
      list = steps(season);
      app.ui.setPauseVisible(false);
      app.ui.showScreen('tutorial', { focus: true });
      app.audio.music('title');
      anim.play('run', true);
      showStep(0);
      $('next').focus(); // Enter / Space moves on
    },

    exit() {
      banner.clear();
    },

    next() {
      if (index < list.length - 1) {
        showStep(index + 1);
        root.querySelector('[data-tut="next"]').focus();
      } else {
        finish(false);
      }
    },

    skip() { finish(true); },

    update(dt) {
      t += dt;
      dist += SPEED * dt;
      autopilot();
      sparky.update(dt);
      invT = Math.max(0, invT - dt);

      for (const it of items) {
        if (it.ball && !it.ball.got && it.ball.x - dist < 4) {
          it.ball.got = true;
          invT = GAME.balls.invincibilitySeconds;
          particles.burst(SX, GROUND - GAME.balls.lowHeight, { count: 12, colors: [P.WHITE, P.FLAG_BLUE, P.FIRE_RED], speed: 100, gravity: 120, life: 0.5 });
          app.audio.play('collect');
        }
        if (!it.gone && invT > 0 && it.x - dist < 8 && it.x - dist > -OB.boxSize) {
          it.gone = true;
          particles.burst(SX + (it.x - dist) + OB.boxSize / 2, GROUND - OB.boxSize / 2, { count: 16, colors: [P.RED, P.WHITE, P.FLAG_BLUE, P.DARK_NAVY], speed: 150, up: 80, size: 3 });
          app.audio.play('smash');
        }
        if (!it.passed && it.x + OB.boxSize < dist - 6) {
          it.passed = true;
          if (list[index].banner) banner.show(it.match, it.art);
        }
      }
      // Keep boxes coming; forget the ones well off screen
      while (items.length && items[0].x - dist < -120) items.shift();
      while (items.length < 3) spawn();

      particles.update(dt, SPEED);
      banner.update(dt);
      app.bg.update(dt, SPEED, 0);
      anim.play(sparky.pose);
      anim.update(dt);
    },

    render(ctx) {
      app.bg.render(ctx);
      for (const it of items) {
        const sx = Math.round(it.x - dist + SX);
        if (it.ball && !it.ball.got) {
          const bx = Math.round(it.ball.x - dist + SX);
          const by = GROUND - GAME.balls.lowHeight + Math.round(Math.sin(t * 3) * 2); // low: Sparky runs right through it
          ctx.drawImage(balls[Math.floor(t * 8) % 4], bx - 10, by - 10);
        }
        if (sx < -40 || sx > W + 10 || it.gone) continue;
        if (it.type === 'tall') {
          ctx.drawImage(crate(OB.boxSize, OB.tallCrateHeight), sx, GROUND - OB.tallCrateHeight);
          ctx.drawImage(it.art, sx, GROUND - OB.tallCrateHeight - OB.boxSize, OB.boxSize, OB.boxSize);
        } else if (it.type === 'floating') {
          const top = GROUND - OB.floatingBottom - OB.boxSize;
          ctx.fillStyle = P.DARK_NAVY;
          ctx.fillRect(sx + OB.boxSize / 2 - 1, 0, 2, top);
          ctx.drawImage(it.art, sx, top, OB.boxSize, OB.boxSize);
        } else {
          ctx.drawImage(it.art, sx, GROUND - OB.boxSize, OB.boxSize, OB.boxSize);
        }
      }
      // Sparky (glowing while invincible)
      const feetY = GROUND - Math.round(sparky.y);
      if (anim.name === 'spin') {
        ctx.save();
        ctx.translate(SX, feetY - 18);
        ctx.rotate((Math.floor(sparky.spinT / 0.1) % 4) * Math.PI / 2);
        app.sheet.draw(ctx, anim.frame, 0, 18);
        ctx.restore();
      } else {
        if (invT > 0) app.sheet.drawGlow(ctx, anim.frame, SX, feetY, [P.FIRE_RED, P.FLAG_BLUE][Math.floor(t * 10) % 2]);
        app.sheet.draw(ctx, anim.frame, SX, feetY);
      }
      particles.render(ctx);
      banner.render(ctx, { reducedMotion: app.reducedMotion, top: 216 }); // just under the card
    },
  };
  return scene;
}
