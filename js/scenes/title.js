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
        ctx.drawImage(c, Math.round(cx - c.width / 2), 12);
      }

      // Red title banner: Fire Red highlight, Red body, Deep Red season strip, Dark Red lip
      const by = 62;
      ctx.fillStyle = P.DARK_NAVY;
      ctx.fillRect(0, by - 1, W, 76);
      ctx.fillStyle = P.FIRE_RED;
      ctx.fillRect(0, by, W, 2);
      ctx.fillStyle = P.RED;
      ctx.fillRect(0, by + 2, W, 52);
      ctx.fillStyle = P.DEEP_RED;
      ctx.fillRect(0, by + 54, W, 16);
      ctx.fillStyle = P.DARK_RED;
      ctx.fillRect(0, by + 70, W, 4);

      drawText(ctx, "SPARKY'S", cx, by + 8, { size: 16, align: 'center', color: P.WHITE, shadow: P.DARK_RED, shadowOffset: 2 });
      drawText(ctx, 'SCHEDULE RUN', cx, by + 30, { size: 16, align: 'center', color: P.WHITE, shadow: P.DARK_RED, shadowOffset: 2 });
      drawText(ctx, `${app.schedule.season} SEASON`, cx, by + 58, { size: 8, align: 'center', color: P.FLAG_BLUE });

      drawText(ctx, 'RUN THE SEASON.', cx, 242, { size: 8, align: 'center', color: P.WHITE, outline: P.DARK_NAVY });
      drawText(ctx, 'REVEAL THE SCHEDULE.', cx, 256, { size: 8, align: 'center', color: P.WHITE, outline: P.DARK_NAVY });

      // Sparky idles on the pitch at 2x for the showcase
      const bob = app.reducedMotion ? 0 : Math.round(Math.sin(t * 3) * 1);
      app.sheet.draw(ctx, anim.frame, cx, GAME.world.groundY + bob, { scale: 2 });
    },
  };
}
