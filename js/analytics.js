// Analytics hook. Does nothing yet; wire GA4 (or similar) into track() later.
// Events: game_start, game_complete, schedule_click, presale_click, play_again.
import { isDebug } from './debugFlag.js';

export function track(eventName, data = {}) {
  if (isDebug()) console.info('[track]', eventName, data);
}
