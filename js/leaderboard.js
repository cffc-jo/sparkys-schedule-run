// Leaderboard: ON HOLD. Every function is a safe no-op and isEnabled() returns false.
//
// When the leaderboard is built (see README "Leaderboard (future)"):
//   1. Set GAME.flags.LEADERBOARD_ENABLED = true in config/game.js.
//   2. Implement these functions against a small hosted backend (e.g. Supabase / Firebase):
//      a server-side function should sanity-check times and rate-limit submissions.
//   3. Add the initials step (3-letter arcade picker + blocklist check) between the finish
//      screen and the end screen; the flow already routes through `afterFinish` in main.js.
//   4. Render getTop(10) and getRank() into the [data-leaderboard] slot on the end screen.
// The game must keep working if any of these calls fail or time out.
// True only when the backend exists. The game also checks GAME.flags.LEADERBOARD_ENABLED, so
// the feature needs both: working code here and the flag switched on.
export function isEnabled() {
  return false;
}

// result: the run result object { initials, finalTimeMs, rawTimeMs, penalties }
export async function submitScore({ initials, finalTimeMs, rawTimeMs, penalties } = {}) {
  void initials; void finalTimeMs; void rawTimeMs; void penalties;
  return { ok: false, reason: 'disabled' };
}

// -> [{ rank, initials, finalTimeMs }]
export async function getTop(n = 10) {
  void n;
  return [];
}

// -> rank number (1-based) this time would currently hold, or null if unknown
export async function getRank(finalTimeMs) {
  void finalTimeMs;
  return null;
}
