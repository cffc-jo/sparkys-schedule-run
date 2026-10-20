// Tiny square-pixel particle system (box shatter, ball collect burst, finish confetti).
export function createParticles() {
  let list = [];

  return {
    // Spawn `count` particles at (x, y) in screen space.
    burst(x, y, { count = 10, colors, speed = 120, up = 0, gravity = 400, life = 0.7, size = 2, scroll = true } = {}) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.6);
        list.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - up,
          g: gravity,
          life: life * (0.6 + Math.random() * 0.4),
          age: 0,
          size,
          color: colors[i % colors.length],
          scroll,
        });
      }
    },

    // worldSpeed: px/s the world is scrolling; particles marked `scroll` drift with it.
    update(dt, worldSpeed = 0) {
      for (const p of list) {
        p.age += dt;
        p.vy += p.g * dt;
        p.x += (p.vx - (p.scroll ? worldSpeed : 0)) * dt;
        p.y += p.vy * dt;
      }
      list = list.filter((p) => p.age < p.life);
    },

    render(ctx) {
      for (const p of list) {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
    },

    clear() { list = []; },
    get count() { return list.length; },
  };
}
