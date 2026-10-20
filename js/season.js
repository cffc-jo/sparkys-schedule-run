// Which season a match date falls in, for the background theme.
// Winter: Nov 21 - Mar 19 · Spring: Mar 20 - Jun 20 · Summer: Jun 21 - Sep 21 · Fall: Sep 22 - Nov 20
// (Equinox / solstice dates split the months that sit between two seasons.)
const STARTS = [
  ['spring', 3, 20],
  ['summer', 6, 21],
  ['fall', 9, 22],
  ['winter', 11, 21],
];

// "2026-02-21" -> 'winter'. Anything that isn't a YYYY-MM-DD date (e.g. "TBD") -> null.
export function seasonForDate(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || '').trim());
  if (!m) return null;
  const md = Number(m[2]) * 100 + Number(m[3]);
  let season = 'winter';
  for (const [name, month, day] of STARTS) if (md >= month * 100 + day) season = name;
  return season;
}

// True for October dates (jack-o'-lanterns join the fall scenery).
export function isOctober(date) {
  return /^\d{4}-10-\d{2}$/.test(String(date || '').trim());
}

// Scenery options for a match date: { season, isOctober }, or null for undated matches.
export function sceneryForDate(date) {
  const season = seasonForDate(date);
  return season ? { season, isOctober: isOctober(date) } : null;
}

// Season to show before any box has been passed: the first dated match, else summer.
export function openingSeason(matches) {
  return openingScenery(matches).season;
}

export function openingScenery(matches) {
  for (const m of matches) {
    const s = sceneryForDate(m.date);
    if (s) return s;
  }
  return { season: 'summer', isOctober: false };
}
