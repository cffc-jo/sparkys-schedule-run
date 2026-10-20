// Run timer. Raw time and penalty count are tracked separately so the finish screen can show
// "run time + penalties = final time". Penalties are whole multiples of penaltySeconds.
export function createTimer(penaltySeconds) {
  let rawMs = 0;
  let penalties = 0;
  let running = false;
  const penaltyMs = Math.round(penaltySeconds * 1000);

  return {
    start() { running = true; },
    stop() { running = false; },
    reset() { rawMs = 0; penalties = 0; running = false; },
    tick(dtSeconds) { if (running) rawMs += dtSeconds * 1000; },
    addPenalty() { penalties += 1; },
    get running() { return running; },
    get rawMs() { return rawMs; },
    get penalties() { return penalties; },
    get displayMs() { return rawMs + penalties * penaltyMs; },
    result() { return makeResult(rawMs, penalties, penaltySeconds); },
  };
}

// The single run-result object (also what a future leaderboard submit will take).
export function makeResult(rawMs, penalties, penaltySeconds) {
  const rawTimeMs = Math.round(rawMs);
  const penaltyMs = penalties * Math.round(penaltySeconds * 1000);
  return { rawTimeMs, penalties, penaltyMs, finalTimeMs: rawTimeMs + penaltyMs };
}

// 72437 -> "1:12.4" (tenths are truncated, never rounded up)
export function formatTime(ms) {
  const totalTenths = Math.floor(Math.max(0, ms) / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
}
