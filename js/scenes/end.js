// End screen: thanks, final time + breakdown, personal best, the full opponents list,
// play again / view schedule / share. The panel is DOM (scrollable, accessible); the canvas
// behind it keeps the stadium backdrop.
import { formatTime } from '../timer.js';
import { formatMatchDate, isHome, displayName } from '../format.js';
import { abbrevLines } from '../game/boxArt.js';

export function createEndScene(app) {
  const root = document.querySelector('[data-screen="end"]');
  const $ = (name) => root.querySelector(`[data-end="${name}"]`);
  const list = root.querySelector('[data-opponents]');
  let built = false;

  function buildOpponents() {
    if (built) return;
    built = true;
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
      name.textContent = `VS. ${displayName(m.opponent)}`;
      const date = document.createElement('span');
      date.className = 'date';
      date.textContent = formatMatchDate(m.date) || 'DATE TBD';
      who.append(name, date);
      const tag = document.createElement('span');
      tag.className = `tag ${home ? 'home' : 'away'}`;
      tag.textContent = home ? 'HOME' : 'AWAY';
      li.append(num, logo, who, tag);
      li.setAttribute('aria-label', `Match ${m.matchNumber}: ${home ? 'home' : 'away'} versus ${m.opponent}${m.date ? ', ' + formatMatchDate(m.date) : ''}`);
      list.append(li);
    }
  }

  return {
    enter() {
      buildOpponents();
      const r = app.lastResult;
      const best = app.lastBest;
      $('final').textContent = formatTime(r.finalTimeMs);
      $('raw').textContent = formatTime(r.rawTimeMs);
      $('penCount').textContent = `×${r.penalties}`;
      $('penTime').textContent = `+${formatTime(r.penaltyMs)}`;
      $('best').textContent = best && best.best ? formatTime(best.best.finalTimeMs) : formatTime(r.finalTimeMs);
      $('newBest').hidden = !(best && best.isNewBest && best.previous);
      list.scrollTop = 0;
      app.ui.setPauseVisible(false);
      app.ui.showScreen('end', { focus: true });
      app.audio.music('title');
    },

    update(dt) {
      app.bg.update(dt, 0);
    },

    render(ctx) {
      app.bg.render(ctx, { reducedMotion: app.reducedMotion });
    },
  };
}
