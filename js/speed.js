// World speed after `cleared` boxes: base * (1 + boostPerClear * cleared), capped.
export function speedMultiplier(cleared, s) {
  return Math.min(1 + s.boostPerClear * cleared, s.maxSpeedMultiplier);
}

export function currentSpeed(cleared, s) {
  return s.baseSpeed * speedMultiplier(cleared, s);
}

export function maxSpeed(s) {
  return s.baseSpeed * s.maxSpeedMultiplier;
}
