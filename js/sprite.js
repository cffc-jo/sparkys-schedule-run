// Sprite sheet + simple frame animator driven by the frame map in config/sprites.js.
export function createSpriteSheet(image, config) {
  const silhouettes = new Map();

  // Solid single-colour copy of a frame (for the invincibility glow).
  function silhouette(name, color) {
    const key = name + '|' + color;
    if (silhouettes.has(key)) return silhouettes.get(key);
    const f = config.frames[name] || config.frames[Object.keys(config.frames)[0]];
    const c = document.createElement('canvas');
    c.width = f.w;
    c.height = f.h;
    const x = c.getContext('2d');
    x.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, f.w, f.h);
    silhouettes.set(key, c);
    return c;
  }

  return {
    image,
    config,
    // 1px coloured outline around a frame, drawn before the frame itself.
    drawGlow(ctx, name, x, y, color) {
      const f = config.frames[name] || config.frames[Object.keys(config.frames)[0]];
      const s = silhouette(name, color);
      const dx = Math.round(x - (f.anchorX ?? config.anchor.x));
      const dy = Math.round(y - (f.anchorY ?? config.anchor.y));
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(s, dx + ox, dy + oy);
    },
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
