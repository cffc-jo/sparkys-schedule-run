// The full schedule as an accessible list: number, logo, VS./AT opponent, date, HOME/AWAY tag,
// with a MIDWINTER BREAK divider. Used by the end screen and the title screen's schedule pop-up.
import { formatMatchDate, isHome, displayName, matchupPrefix } from '../format.js';
import { abbrevLines } from '../game/boxArt.js';

export function fillScheduleList(list, app) {
  list.textContent = '';
  for (const m of app.schedule.matches) {
    const li = document.createElement('li');
    const home = isHome(m);
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = m.matchNumber;
    const logo = document.createElement('span');
    logo.className = 'logo';
    const fallback = () => { logo.textContent = abbrevLines(m.code).join(' '); };
    if (app.logos[m.logo]) {
      const img = document.createElement('img');
      img.src = m.logo;
      img.alt = '';
      img.onerror = () => { img.remove(); fallback(); };
      logo.append(img);
    } else {
      fallback();
    }
    const who = document.createElement('span');
    who.className = 'who';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = `${matchupPrefix(m)} ${displayName(m.opponent)}`;
    const when = formatMatchDate(m.date, m.dayOfWeek);
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = when || 'DATE TBD';
    who.append(name, date);
    const tag = document.createElement('span');
    tag.className = `tag ${home ? 'home' : 'away'}`;
    tag.textContent = home ? 'HOME' : 'AWAY';
    li.append(num, logo, who, tag);
    li.setAttribute('aria-label', `Match ${m.matchNumber}: ${home ? 'home versus' : 'away at'} ${m.opponent}${when ? ', ' + when : ''}`);
    list.append(li);
    if (m.matchNumber === app.schedule.midwinterBreakAfterMatch) {
      const brk = document.createElement('li');
      brk.className = 'break';
      brk.textContent = 'MIDWINTER BREAK';
      list.append(brk);
    }
  }
}
