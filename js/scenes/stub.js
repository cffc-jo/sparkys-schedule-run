// Phase 1 placeholder for gameplay: scrolls the world at base speed to exercise the loop.
// Replaced by the real run in Phase 2.
import { PALETTE as P } from '../../config/palette.js';
import { GAME } from '../../config/game.js';
import { drawText } from '../pixelText.js';
import { createAnimator } from '../sprite.js';

export function createStubScene(app) {
  const anim = createAnimator(app.sheet.config);

  return {
    enter() {
      anim.play('idle', true);
      app.ui.showScreen('stub');
      app.ui.setPauseVisible(false);
    },

    update(dt) {
      anim.update(dt);
      app.bg.update(dt, GAME.speed.baseSpeed, 0);
    },

    render(ctx) {
      const cx = GAME.view.width / 2;
      app.bg.render(ctx, { reducedMotion: app.reducedMotion });
      drawText(ctx, 'GAMEPLAY ARRIVES', cx, 120, { align: 'center', color: P.WHITE, shadow: P.DARK_NAVY });
      drawText(ctx, 'IN PHASE 2', cx, 136, { align: 'center', color: P.FLAG_BLUE, shadow: P.DARK_NAVY });
      app.sheet.draw(ctx, anim.frame, GAME.world.sparkyX, GAME.world.groundY);
    },
  };
}
