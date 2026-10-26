// The schedule-reveal banner: slides in at the top each time a box is cleared or hit.
//   [logo] MATCH 12  [HOME]
//          VS. NEW ENGLAND REVOLUTION    ("AT" for away matches)
//          SAT, OCT 16
// It also shows short notices, e.g. the midwinter break.
import { PALETTE as P } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { drawText, textWidth } from '../pixelText.js';
import { formatMatchDate, isHome, displayName, matchupPrefix } from '../format.js';

const W = GAME.view.width;
const PANEL = { x: 6, w: W - 12, h: 42, y: 60 }; // sits under the HUD and invincibility meter
const TEXT_X = PANEL.x + 42;
const TEXT_W = PANEL.x + PANEL.w - 6 - TEXT_X;
const SLIDE_IN = 0.28;
const SLIDE_OUT = 0.2;

const LINE_H = 11;

// "VS. <OPPONENT>" (or "AT <OPPONENT>") on one line if it fits, otherwise split over two lines at
// the most balanced word break (e.g. "VS. NEW YORK / RED BULLS", never an orphaned "FC"). Letter spacing is never
// squeezed below 1px, so characters never touch.
export function wrapName(name, maxWidth = TEXT_W, prefix = 'VS.') {
  const words = [prefix, ...String(name).toUpperCase().split(/\s+/).filter(Boolean)];
  const one = words.join(' ');
  if (textWidth(one) <= maxWidth || words.length < 2) return [trimToFit(one, maxWidth)];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const worst = Math.max(textWidth(a), textWidth(b));
    if (worst <= maxWidth && (!best || worst < best.worst)) best = { lines: [a, b], worst };
  }
  if (best) return best.lines;
  // Nothing fits even on two lines (very unlikely): trim the second line.
  const mid = Math.ceil(words.length / 2);
  return [trimToFit(words.slice(0, mid).join(' '), maxWidth), trimToFit(words.slice(mid).join(' '), maxWidth)];
}

function trimToFit(str, maxWidth) {
  let s = str;
  while (s.length > 1 && textWidth(s) > maxWidth) s = s.slice(0, -2) + '.';
  return s;
}

// 7x7 pixel snowflake
const SNOWFLAKE = ['...K...', '.K.K.K.', '..KKK..', 'KKKKKKK', '..KKK..', '.K.K.K.', '...K...'];
function drawSnowflake(ctx, x, y, color) {
  ctx.fillStyle = color;
  SNOWFLAKE.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === 'K') ctx.fillRect(x + dx, y + dy, 1, 1); }));
}

function easeOutBack(t) {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

export function createBanner() {
  let cur = null; // match: { match, art, age, title, name[], date } | notice: { notice, age, title, sub }

  return {
    show(match, art) {
      const name = displayName(match.opponent || match.code);
      cur = {
        match,
        art,
        age: 0,
        home: isHome(match),
        title: `MATCH ${match.matchNumber}`,
        name: wrapName(name, TEXT_W, matchupPrefix(match)),
        date: formatMatchDate(match.date, match.dayOfWeek),
      };
    },

    // A short notice in the same slot, e.g. showNotice('MIDWINTER BREAK', 'BACK SAT, FEB 12')
    showNotice(title, sub = '', { snow = false } = {}) {
      cur = { notice: true, age: 0, title, sub, snow };
    },

    get showing() { return cur; },

    update(dt) {
      if (!cur) return;
      cur.age += dt;
      if (cur.age > GAME.ui.bannerSeconds) cur = null;
    },

    clear() { cur = null; },

    // `top` moves the banner (the tutorial shows it lower, under its card).
    render(ctx, { reducedMotion = false, top = PANEL.y } = {}) {
      if (!cur) return;
      const total = GAME.ui.bannerSeconds;
      let offset = 0;
      if (!reducedMotion) {
        const travel = top + PANEL.h + LINE_H;
        if (cur.age < SLIDE_IN) offset = (1 - easeOutBack(cur.age / SLIDE_IN)) * -travel;
        else if (cur.age > total - SLIDE_OUT) offset = ((cur.age - (total - SLIDE_OUT)) / SLIDE_OUT) * -travel;
      }
      const x = PANEL.x;
      const y = Math.round(top + offset);
      const h = cur.notice ? (cur.sub ? 34 : 22) : PANEL.h + (cur.name.length - 1) * LINE_H;
      const flash = cur.age < 0.35 && Math.floor(cur.age * 12) % 2 === 0;

      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(x - 1, y - 1, PANEL.w + 2, h + 2);
      ctx.fillStyle = flash ? P.FIRE_RED : P.WHITE;
      ctx.fillRect(x, y, PANEL.w, h);
      ctx.fillStyle = P.DEEP_RED;
      ctx.fillRect(x + 1, y + 1, PANEL.w - 2, h - 2);
      ctx.fillStyle = P.RED;
      ctx.fillRect(x + 1, y + 1, PANEL.w - 2, 1);

      if (cur.notice) {
        const cx = x + PANEL.w / 2;
        drawText(ctx, cur.title, cx, y + 6, { color: P.WHITE, align: 'center' });
        if (cur.snow) {
          const half = textWidth(cur.title) / 2;
          drawSnowflake(ctx, Math.round(cx - half - 14), y + 6, P.FLAG_BLUE);
          drawSnowflake(ctx, Math.round(cx + half + 7), y + 6, P.FLAG_BLUE);
        }
        if (cur.sub) drawText(ctx, cur.sub, cx, y + 20, { color: P.FLAG_BLUE, align: 'center' });
        return;
      }

      if (cur.art) ctx.drawImage(cur.art, x + 6, y + 6, GAME.obstacles.boxSize, GAME.obstacles.boxSize);

      // No drop shadows on this small text: a shadow fills the gap between letters.
      drawText(ctx, cur.title, TEXT_X, y + 5, { color: P.WHITE });
      // HOME / AWAY chip: word + colour, never colour alone
      const tag = cur.home ? 'HOME' : 'AWAY';
      const tx = TEXT_X + textWidth(cur.title) + 6;
      const tw = textWidth(tag) + 4;
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(tx - 1, y + 3, tw + 2, 12);
      ctx.fillStyle = cur.home ? P.FIRE_RED : P.FLAG_BLUE;
      ctx.fillRect(tx, y + 4, tw, 10);
      drawText(ctx, tag, tx + 2, y + 5, { color: cur.home ? P.WHITE : P.NAVY });

      cur.name.forEach((line, i) => drawText(ctx, line, TEXT_X, y + 18 + i * LINE_H, { color: P.WHITE }));
      if (cur.date) drawText(ctx, cur.date, TEXT_X, y + 18 + cur.name.length * LINE_H + 1, { color: P.FLAG_BLUE });
    },
  };
}
