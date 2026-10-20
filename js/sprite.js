// Sprite sheet + simple frame animator driven by the frame map in config/sprites.js.
export function createSpriteSheet(image, config) {
  return {
    image,
    config,
    // Draw frame `name` so its anchor lands on (x, y).
    draw(ctx, name, x, y, { scale = 1, flipX = false } = {}) {
      const f = config.frames[name] || config.frames[Object.keys(config.frames)[0]];
      const ax = (f.anchorX ?? config.anchor.x) * scale;
      const ay = (f.anchorY ?? config.anchor.y) * scale;
      const dx = Math.round(x - ax);
      const dy = Math.round(y - ay);
      if (flipX) {
        ctx.save();
        ctx.translate(dx + f.w * scale, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w * scale, f.h * scale);
        ctx.restore();
      } else {
        ctx.drawImage(image, f.x, f.y, f.w, f.h, dx, dy, f.w * scale, f.h * scale);
      }
    },
  };
}

export function createAnimator(config) {
  let anim = null;
  let name = '';
  let time = 0;
  return {
    play(animName, restart = false) {
      if (animName === name && !restart) return;
      name = animName;
      anim = config.anims[animName] || config.anims.idle;
      time = 0;
    },
    update(dt) { time += dt; },
    get frame() {
      if (!anim) return Object.keys(config.frames)[0];
      const i = Math.floor(time * anim.fps);
      const n = anim.frames.length;
      return anim.frames[anim.loop === false ? Math.min(i, n - 1) : i % n];
    },
    get name() { return name; },
  };
}
