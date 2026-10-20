// Display formatting for schedule data.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// "2026-02-21" -> "SAT, FEB 21". Any other text (e.g. "TBD") is shown as-is, upper-cased.
// Parsed as a calendar date (UTC) so the day never shifts with the viewer's timezone.
export function formatMatchDate(date) {
  if (!date) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date).trim());
  if (!m) return String(date).toUpperCase();
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (Number.isNaN(d.getTime())) return String(date).toUpperCase();
  return `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// Opponent name for display: upper case with accents removed ("CF Montréal" -> "CF MONTREAL"),
// so it always renders cleanly in the pixel font. schedule.json keeps the official spelling.
export function displayName(name) {
  return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

export function isHome(match) {
  return String(match.homeAway).toUpperCase() === 'HOME';
}
