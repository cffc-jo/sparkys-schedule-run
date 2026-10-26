// Display formatting for schedule data.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "2027-10-16" -> calendar date (UTC, so the day never shifts with the viewer's timezone), or null
function parseDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || '').trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

// "2027-10-16" -> "Sat" ('' for text dates such as "TBD")
export function weekdayOf(date) {
  const d = parseDate(date);
  return d ? DAYS[d.getUTCDay()] : '';
}

// "2027-10-16" -> "SAT, OCT 16". Any other text (e.g. "TBD") is shown as-is, upper-cased.
// `dayOfWeek` from the schedule wins over the computed weekday.
export function formatMatchDate(date, dayOfWeek) {
  if (!date) return '';
  const d = parseDate(date);
  if (!d) return String(date).toUpperCase();
  const day = (dayOfWeek || DAYS[d.getUTCDay()]).toUpperCase();
  return `${day}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// Opponent name for display: upper case with accents removed ("CF Montréal" -> "CF MONTREAL"),
// so it always renders cleanly in the pixel font. schedule.json keeps the official spelling.
export function displayName(name) {
  return String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

export function isHome(match) {
  return String(match.homeAway).toUpperCase() === 'HOME';
}
