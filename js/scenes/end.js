// End screen: thanks, final time + breakdown (and a NEW BEST! flash), the full opponents list,
// play again / view schedule / presale access. The panel is DOM (scrollable, accessible); the canvas
// behind it keeps the stadium backdrop.
import { formatTime } from '../timer.js';
import { fillScheduleList } from '../ui/scheduleList.js';

export function createEndScene(app) {
  const root = document.querySelector('[data-screen="end"]');
  const $ = (name) => root.querySelector(`[data-end="${name}"]`);
  const list = root.querySelector('[data-opponents]');
  let built = false;

  function buildOpponents() {
    if (built) return;
    built = true;
    fillScheduleList(list, app);
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
