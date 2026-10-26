// Schedule schema: reads config/schedule.json into the shape the game uses.
//
// Top level
//   season                    "2027-28"
//   isDemo                    true shows a "DEMO SCHEDULE" tag on the title and end screens
//   note                      free text, ignored by the game
//   midwinterBreakAfterMatch  match number the midwinter break follows (optional)
// Each match
//   matchNumber, opponent, code, homeAway ("HOME" | "AWAY"), date ("YYYY-MM-DD" or text like "TBD")
//   dayOfWeek   "Sat" (optional; worked out from the date if missing)
//   kickoff     "7:30 PM CT" (optional; kept with the match, not shown in the game)
//   conference  "East" | "West" (optional)
//   half        1 | 2 (optional; which half of the summer-to-spring season)
//   logo        optional override; by default the logo is assets/logos/<code>.png
import { weekdayOf } from './format.js';

export function logoPathFor(code) {
  return `assets/logos/${code}.png`;
}

export function normalizeSchedule(raw) {
  if (!raw || !Array.isArray(raw.matches) || !raw.matches.length) {
    throw new Error('config/schedule.json has no matches');
  }
  const matches = raw.matches.map((m, i) => {
    const code = String(m.code || '').trim().toUpperCase();
    return {
      ...m,
      matchNumber: Number(m.matchNumber) || i + 1,
      code,
      logo: m.logo || (code ? logoPathFor(code) : null),
      homeAway: String(m.homeAway || '').toUpperCase(),
      dayOfWeek: m.dayOfWeek ? String(m.dayOfWeek).trim() : weekdayOf(m.date),
      kickoff: m.kickoff ? String(m.kickoff).trim() : '',
      conference: m.conference ? String(m.conference).trim() : '',
      half: m.half != null ? Number(m.half) : null,
    };
  });
  const after = Number(raw.midwinterBreakAfterMatch);
  const breakAfter = Number.isInteger(after) && matches.some((m, i) => m.matchNumber === after && i < matches.length - 1) ? after : null;
  return {
    season: String(raw.season || ''),
    isDemo: raw.isDemo === true,
    note: raw.note || '',
    midwinterBreakAfterMatch: breakAfter,
    matches,
  };
}

// Problems worth a console warning (the game still runs): wrong weekday, odd home/away, etc.
export function scheduleWarnings(schedule) {
  const out = [];
  schedule.matches.forEach((m, i) => {
    const tag = `match ${m.matchNumber}`;
    if (m.matchNumber !== i + 1) out.push(`${tag}: matchNumber out of order`);
    if (!m.code) out.push(`${tag}: missing code`);
    if (m.homeAway !== 'HOME' && m.homeAway !== 'AWAY') out.push(`${tag}: homeAway should be HOME or AWAY`);
    const actual = weekdayOf(m.date);
    if (actual && m.dayOfWeek && actual.toUpperCase() !== m.dayOfWeek.toUpperCase()) {
      out.push(`${tag}: ${m.date} is a ${actual}, not ${m.dayOfWeek}`);
    }
  });
  return out;
}
