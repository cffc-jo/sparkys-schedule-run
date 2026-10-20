// The schedule-reveal banner: slides in at the top each time a box is cleared or hit.
//   [logo] MATCH 12  [HOME]
//          VS. NEW YORK CITY FC
//          SAT, OCT 10
import { PALETTE as P } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { drawText, textWidth } from '../pixelText.js';
import { formatMatchDate, isHome } from '../format.js';

const W = GAME.view.width;
const PANEL = { x: 6, w: W - 12, h: 42, y: 60 }; // sits under the HUD and invincibility meter
const TEXT_X = PANEL.x + 42;
const TEXT_W = PANEL.x + PANEL.w - 6 - TEXT_X;
const SLIDE_IN = 0.28;
const SLIDE_OUT = 0.2;

// Pick the widest wording/spacing that fits the text column.
function fitLine(candidates) {
  for (const str of candidates) {
    for (const spacing of [1, 0]) {
      if (textWidth(str, 8, spacing) <= TEXT_W) return { str, spacing };
    }
  }
  let s = candidates[candidates.length - 1];
  while (s.length > 1 && textWidth(s + '.', 8, 0) > TEXT_W) s = s.slice(0, -1);
  return { str: s + '.', spacing: 0 };
}

function easeOutBack(t) {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

export function createBanner() {
  let cur = null; // { match, art, age, lines }

  return {
    show(match, art) {
      const name = String(match.opponent || match.code || '').toUpperCase();
      cur = {
        match,
        art,
        age: 0,
        home: isHome(match),
        title: `MATCH ${match.matchNumber}`,
        name: fitLine([`VS. ${name}`, name]),
        date: formatMatchDate(match.date),
      };
    },

    update(dt) {
      if (!cur) return;
      cur.age += dt;
      if (cur.age > GAME.ui.bannerSeconds) cur = null;
    },

    clear() { cur = null; },

    render(ctx, { reducedMotion = false } = {}) {
      if (!cur) return;
      const total = GAME.ui.bannerSeconds;
      let offset = 0;
      if (!reducedMotion) {
        if (cur.age < SLIDE_IN) offset = (1 - easeOutBack(cur.age / SLIDE_IN)) * -(PANEL.y + PANEL.h);
        else if (cur.age > total - SLIDE_OUT) offset = ((cur.age - (total - SLIDE_OUT)) / SLIDE_OUT) * -(PANEL.y + PANEL.h);
      }
      const x = PANEL.x;
      const y = Math.round(PANEL.y + offset);
      const flash = cur.age < 0.35 && Math.floor(cur.age * 12) % 2 === 0;

      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(x - 1, y - 1, PANEL.w + 2, PANEL.h + 2);
      ctx.fillStyle = flash ? P.FIRE_RED : P.WHITE;
      ctx.fillRect(x, y, PANEL.w, PANEL.h);
      ctx.fillStyle = P.DEEP_RED;
      ctx.fillRect(x + 1, y + 1, PANEL.w - 2, PANEL.h - 2);
      ctx.fillStyle = P.RED;
      ctx.fillRect(x + 1, y + 1, PANEL.w - 2, 1);

      if (cur.art) ctx.drawImage(cur.art, x + 6, y + 6);

      drawText(ctx, cur.title, TEXT_X, y + 5, { color: P.WHITE, shadow: P.DARK_RED });
      // HOME / AWAY chip: word + colour, never colour alone
      const tag = cur.home ? 'HOME' : 'AWAY';
      const tx = TEXT_X + textWidth(cur.title) + 6;
      const tw = textWidth(tag) + 4;
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(tx - 1, y + 3, tw + 2, 12);
      ctx.fillStyle = cur.home ? P.FIRE_RED : P.FLAG_BLUE;
      ctx.fillRect(tx, y + 4, tw, 10);
      drawText(ctx, tag, tx + 2, y + 5, { color: cur.home ? P.WHITE : P.NAVY });

      drawText(ctx, cur.name.str, TEXT_X, y + 18, { color: P.WHITE, spacing: cur.name.spacing });
      if (cur.date) drawText(ctx, cur.date, TEXT_X, y + 30, { color: P.FLAG_BLUE });
    },
  };
}
