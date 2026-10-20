// Pure gesture classifier. dy > 0 means the finger moved DOWN the screen (CSS px).
// A swipe is >= minDistance px of vertical travel within maxTime ms; anything else is a tap.
export function classifyGesture(dy, elapsedMs, { swipeMinDistance, swipeMaxTime }) {
  if (elapsedMs <= swipeMaxTime && Math.abs(dy) >= swipeMinDistance) {
    return dy > 0 ? 'swipeDown' : 'swipeUp';
  }
  return 'tap';
}
