// Sparky's movement. y = height of his feet above the ground (up is positive).
// Stepped with the fixed physics timestep, so behaviour never depends on frame rate.
export function createSparky(physics, hitbox) {
  const s = {
    y: 0,
    vy: 0,
    grounded: true,
    airJumps: 0,
    duckT: 0,         // time left crouched
    duckOnLand: false,
    fastFall: false,
    spinT: -1,        // time since the double jump started (-1 = not spinning)
    hitT: 0,          // stumble frame timer
    bufferT: 0,       // remembered jump press
  };

  function jump() {
    if (s.grounded) {
      s.vy = physics.jumpVelocity;
      s.grounded = false;
      s.airJumps = 0;
      s.duckT = 0;
      s.duckOnLand = false;
      return 'jump';
    }
    if (s.airJumps < physics.maxDoubleJumps) {
      s.vy = physics.doubleJumpVelocity;
      s.airJumps++;
      s.spinT = 0;
      s.fastFall = false;
      s.duckOnLand = false;
      return 'double';
    }
    s.bufferT = physics.jumpBufferTime;
    return null;
  }

  function duck() {
    if (s.grounded) {
      s.duckT = physics.duckDuration;
      return 'duck';
    }
    // Mid-air: slam down, then crouch on landing.
    s.fastFall = true;
    s.duckOnLand = true;
    s.spinT = -1;
    s.vy = Math.min(s.vy, -physics.fastFallVelocity);
    return 'fastfall';
  }

  function update(dt) {
    if (!s.grounded) {
      s.vy -= physics.gravity * dt;
      if (s.fastFall) s.vy = Math.min(s.vy, -physics.fastFallVelocity);
      s.y += s.vy * dt;
      if (s.spinT >= 0) s.spinT += dt;
      if (s.y <= 0) {
        s.y = 0;
        s.vy = 0;
        s.grounded = true;
        s.airJumps = 0;
        s.spinT = -1;
        s.fastFall = false;
        if (s.duckOnLand) {
          s.duckOnLand = false;
          s.duckT = physics.duckDuration;
        }
        if (s.bufferT > 0) {
          s.bufferT = 0;
          jump();
        }
      }
    }
    if (s.duckT > 0) s.duckT = Math.max(0, s.duckT - dt);
    if (s.bufferT > 0) s.bufferT = Math.max(0, s.bufferT - dt);
    if (s.hitT > 0) s.hitT = Math.max(0, s.hitT - dt);
  }

  return {
    jump,
    duck,
    update,
    stumble(seconds) { s.hitT = seconds; },
    reset() {
      Object.assign(s, { y: 0, vy: 0, grounded: true, airJumps: 0, duckT: 0, duckOnLand: false, fastFall: false, spinT: -1, hitT: 0, bufferT: 0 });
    },
    get y() { return s.y; },
    get grounded() { return s.grounded; },
    get ducking() { return s.grounded && s.duckT > 0; },
    get spinT() { return s.spinT; },
    // Collision box around screen x `cx`, in ground-relative coordinates (y up).
    hitbox(cx) {
      const b = this.ducking ? hitbox.duck : hitbox.stand;
      return { x0: cx - b.w / 2, x1: cx + b.w / 2, y0: s.y, y1: s.y + b.h };
    },
    // Which animation to show
    get pose() {
      if (s.hitT > 0) return 'hit';
      if (this.ducking) return 'duck';
      if (!s.grounded) return s.spinT >= 0 && s.spinT < 0.4 ? 'spin' : 'jump';
      return 'run';
    },
  };
}
