// Every gameplay tunable lives here. Units: logical pixels (the 270x480 canvas) and seconds,
// unless noted. Edit freely; nothing else in the code should hard-code these numbers.
export const GAME = {
  view: {
    width: 270,                 // logical canvas width (portrait)
    height: 480,                // logical canvas height
    integerScaleMinFill: 0.88,  // use a whole-number device-pixel scale only if it fills >= 88% of the
                                // available space; otherwise fall back to a fractional pixelated fit
  },

  loop: {
    fixedStep: 1 / 120,         // physics step (s). Same behaviour at 60Hz, 120Hz or throttled
    maxFrameTime: 0.25,         // clamp long frames (tab hitch) so physics never "teleports"
  },

  world: {
    groundY: 420,               // y of the running surface (Sparky's feet)
    sparkyX: 52,                // Sparky's fixed screen x (centre of sprite)
    titleBoardSpeed: 24,        // px/s the LED board text scrolls on the title screen
  },

  physics: {
    gravity: 1500,              // px/s^2 downward
    jumpVelocity: 450,          // first jump take-off speed (px/s). Apex = v^2 / 2g ~= 67px
    doubleJumpVelocity: 420,    // second jump speed, applied mid-air
    maxDoubleJumps: 1,          // extra jumps allowed per airtime
    fastFallVelocity: 650,      // swipe-down in the air snaps fall speed to at least this
    duckDuration: 0.6,          // s Sparky stays crouched after a swipe down / S / Down
    coyoteTime: 0.06,           // s after running off a ledge where a ground jump still counts
    jumpBufferTime: 0.10,       // s a jump pressed just before landing is remembered
  },

  speed: {
    baseSpeed: 150,             // world scroll speed at the start (px/s)
    boostPerClear: 0.008,       // speed = base * (1 + boostPerClear * boxesCleared)
    maxSpeedMultiplier: 1.3,    // hard cap on that multiplier
  },

  course: {
    leadIn: 330,                // px of open ground before the first box
    reactionGap: 1.0,           // s of open ground guaranteed between obstacles AT MAX SPEED
    extraSpacingMax: 0.45,      // s of random extra spacing added on top (deterministic per seed)
    easyStartCount: 6,          // first N boxes are always ground boxes
    typeMix: { ground: 0.60, floating: 0.25, tall: 0.15 }, // target obstacle mix
    finishRunout: 260,          // px from the last box to the finish line
  },

  obstacles: {
    boxSize: 28,                // logo box outer size (px)
    logoSize: 24,               // pixel-logo size drawn inside the box
    floatingBottom: 22,         // gap under a floating box (px above ground); Sparky ducks under it
    tallCrateHeight: 40,        // plain crate under a "tall" logo box
    hitboxInset: 3,             // collision boxes are shrunk by this on each side (forgiving)
    bobAmplitude: 2.5,          // idle bob height (px)
    bobSpeed: 2.4,              // idle bob speed (rad/s)
  },

  penalties: {
    penaltySeconds: 10,         // added to the timer per box hit
    graceSeconds: 1,            // invulnerable flicker after a hit
    shakeSeconds: 0.25,         // screen shake duration
    shakeMagnitude: 3,          // screen shake strength (px)
  },

  balls: {
    count: 5,                   // soccer balls placed on the course
    invincibilitySeconds: 5,    // duration of invincibility per ball (collecting again resets)
    warningSeconds: 1,          // final seconds of invincibility that flicker as a warning
  },

  input: {
    swipeMinDistance: 30,       // CSS px of vertical travel to count as a swipe
    swipeMaxTime: 250,          // ms within which that travel must happen
  },

  ui: {
    bannerSeconds: 1.8,         // how long the "MATCH 12 · vs. NYCFC" reveal banner stays up
    countdownStepSeconds: 0.75, // length of each 3-2-1 beat
    buttonCooldownMs: 350,      // ignore repeat taps on the same button within this window
  },

  audio: {
    sfxVolume: 0.7,             // 0..1
    musicVolume: 0.3,           // 0..1, sits under the sound effects
  },

  flags: {
    LEADERBOARD_ENABLED: false, // keep false until the leaderboard backend exists (see README)
  },

  storageKeyPrefix: 'sparky-run:', // localStorage namespace
};
