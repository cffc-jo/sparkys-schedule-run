// Title screen: crest, logo text, idling Sparky. PLAY / VIEW SCHEDULE are DOM buttons (index.html).
import { PALETTE as P } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { drawText } from '../pixelText.js';
import { createAnimator } from '../sprite.js';

export function createTitleScene(app) {
  const anim = createAnimator(app.sheet.config);
  let t = 0;

  return {
    enter() {
      t = 0;
      anim.play('idle', true);
      app.ui.showScreen('title');
      app.ui.setPauseVisible(false);
    },

    update(dt) {
      t += dt;
      anim.update(dt);
      app.bg.update(dt, 0);
    },

    render(ctx) {
      const W = GAME.view.width;
      const cx = W / 2;
      app.bg.render(ctx, { reducedMotion: app.reducedMotion });

      if (app.crest) {
        const c = app.crest;
        ctx.drawImage(c, Math.round(cx - c.width / 2), 18);
      }

      drawText(ctx, "SPARKY'S", cx, 74, { size: 16, align: 'center', color: P.WHITE, shadow: P.RED, shadowOffset: 2 });
      drawText(ctx, 'SCHEDULE RUN', cx, 96, { size: 16, align: 'center', color: P.WHITE, shadow: P.RED, shadowOffset: 2 });
      drawText(ctx, `${app.schedule.season} SEASON`, cx, 124, { size: 8, align: 'center', color: P.FLAG_BLUE, shadow: P.DARK_NAVY });

      drawText(ctx, 'RUN THE SEASON.', cx, 300, { size: 8, align: 'center', color: P.WHITE, shadow: P.DARK_NAVY });
      drawText(ctx, 'REVEAL THE SCHEDULE.', cx, 314, { size: 8, align: 'center', color: P.WHITE, shadow: P.DARK_NAVY });

      // Sparky idles on the pitch at 2x for the showcase
      const bob = app.reducedMotion ? 0 : Math.round(Math.sin(t * 3) * 1);
      app.sheet.draw(ctx, anim.frame, cx, GAME.world.groundY + bob, { scale: 2 });
    },
  };
}
