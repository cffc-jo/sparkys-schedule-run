// Every gameplay tunable lives here. Units: logical pixels (the 240x428 canvas) and seconds,
// unless noted. Edit freely; nothing else in the code should hard-code these numbers.
export const GAME = {
  view: {
    width: 240,                 // logical canvas width (portrait). Smaller = more zoomed in
    height: 428,                // logical canvas height (~9:16)
    renderScale: 2,             // backing canvas = logical size x this. Logos are drawn at this extra
                                // detail (24 logical px = 48px logo files); all other art is unchanged
    integerScaleMinFill: 0.88,  // use a whole-number device-pixel scale only if it fills >= 88% of the
                                // available space; otherwise fall back to a fractional pixelated fit
  },

  loop: {
    fixedStep: 1 / 120,         // physics step (s). Same behaviour at 60Hz, 120Hz or throttled
    maxFrameTime: 0.25,         // clamp long frames (tab hitch) so physics never "teleports"
  },

  world: {
    groundY: 350,               // y of the running line (Sparky's feet)
    pitchDepth: 64,             // px of pitch visible between the LED boards and the running line.
                                // Pitch (boards' foot to screen bottom) = height - groundY + pitchDepth ~= 1/3 of the screen
    sparkyX: 40,                // Sparky's fixed screen x (centre of sprite). Further left = more look-ahead
    crestSize: 44,              // club crest size on the title screen (logical px)
    titleBoardSpeed: 24,        // px/s the LED board text scrolls on the title screen
  },

  physics: {
    gravity: 2200,              // px/s^2 downward (snappy arcade jumps)
    jumpVelocity: 545,          // first jump take-off speed (px/s). Apex = v^2 / 2g ~= 67.5px, airtime ~0.5s
    doubleJumpVelocity: 545,    // second jump speed, applied mid-air (resets upward speed)
    maxDoubleJumps: 1,          // extra jumps allowed per airtime
    fastFallVelocity: 900,      // swipe-down in the air snaps fall speed to at least this (px/s)
    duckDuration: 0.45,         // s Sparky stays crouched after a swipe down / S / Down
    jumpBufferTime: 0.10,       // s a jump pressed just before landing (with no jumps left) is remembered
    hitStumbleTime: 0.35,       // s Sparky shows the stumble frame after a hit
  },

  speed: {
    baseSpeed: 190,             // world scroll speed at the start (px/s)
    boostPerClear: 0.01,        // speed = base * (1 + boostPerClear * boxesCleared): +1% per clear
    maxSpeedMultiplier: 1.35,   // hard cap on that multiplier
  },

  course: {
    leadIn: 300,                // px of open ground before the first box
    reactionGap: 0.8,           // s of open ground guaranteed between obstacles at the fastest speed
                                // the player could have reached by that point (clean run, capped)
    extraSpacingMax: 0.12,      // s of extra breathing room, largest early in the season, shrinking later
    seed: '',                   // course layout seed; blank = use the season string (same layout every run)
    easyStartCount: 6,          // first N boxes are always ground boxes
    typeMix: { ground: 0.60, floating: 0.25, tall: 0.15 }, // target obstacle mix
    noBackToBackHardUntil: 0.6, // fraction of the course where two hard boxes never appear in a row
    finishRunout: 220,          // px from the last box to the finish line
    midwinterBreakSeconds: 1.6, // s of extra open pitch at the midwinter break (schedule.json
                                // midwinterBreakAfterMatch), where the "MIDWINTER BREAK" banner shows
    midwinterBannerDelay: 1.0,  // s after passing the last box before the break that the banner appears
  },

  obstacles: {
    boxSize: 30,                // logo box outer size (px): 1px outline + 2px border + 24px logo
    logoSize: 24,               // logo slot inside the box (logical px). Logo files are this x renderScale
    logoPadding: 1,             // white margin (logical px) between the logo and the slot edge, so logos never touch the frame
    floatingBottom: 20,         // gap under a floating box (px above ground). Must sit between the duck and stand hitbox heights.
                                // Floating boxes hang from a cable, so jumping over them is impossible
    tallCrateHeight: 44,        // plain crate under a "tall" logo box (total 74px > single-jump apex ~67px)
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
    speedBoost: 1.25,           // run speed multiplier while invincible. Ramps in over boostRampSeconds and
    boostRampSeconds: 0.3,      // eases back to normal over warningSeconds, so the course's reaction gaps
                                // hold again the moment invincibility ends
    endGraceSeconds: 0.25,      // after invincibility ends, boxes touched in this window still smash (no penalty)
    size: 20,                   // ball sprite size (px)
    arcHeight: 80,              // ball centre height when floating over a ground box (top of a jump)
    lowHeight: 12,              // ball centre height when placed just before a floating box
    lowLead: 42,                // px in front of a floating box for the low ball
    radius: 13,                 // collection radius (generous: grabbing a ball should feel easy)
    bobAmplitude: 2,            // hover bob (px)
    spinFps: 8,                 // 4-frame spin speed
  },

  input: {
    swipeMinDistance: 30,       // CSS px of vertical travel to count as a swipe
    swipeMaxTime: 250,          // ms within which that travel must happen
  },

  ui: {
    bannerSeconds: 1.8,         // how long the "MATCH 12 · vs. NYCFC" reveal banner stays up
    bannerMinSeconds: 1.2,      // a banner stays up at least this long; a newer reveal waits its turn
    celebrateSeconds: 1.8,      // victory animation at the finish before the time breakdown
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
