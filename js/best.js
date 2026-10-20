// Personal best for this device (localStorage, safe if storage is unavailable).
import { load, save } from './storage.js';

const KEY = 'best';

export function getBest() {
  const b = load(KEY, null);
  return b && Number.isFinite(b.finalTimeMs) ? b : null;
}

// Record a run. Returns { best, isNewBest, previous }.
export function recordRun(result) {
  const previous = getBest();
  const isNewBest = !previous || result.finalTimeMs < previous.finalTimeMs;
  if (isNewBest) {
    save(KEY, {
      finalTimeMs: result.finalTimeMs,
      rawTimeMs: result.rawTimeMs,
      penalties: result.penalties,
      at: new Date().toISOString(),
    });
  }
  return { best: isNewBest ? result : previous, isNewBest, previous };
}
