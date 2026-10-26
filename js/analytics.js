// Analytics hook. Does nothing yet; wire GA4 (or similar) into track() later.
// Events: game_start, game_complete, schedule_open, presale_click, play_again.
// presale_click fires as the page navigates away (links open in the same window),
// so send them with a beacon transport (e.g. GA4 transport_type: 'beacon') so they aren't lost.
import { isDebug } from './debugFlag.js';

export function track(eventName, data = {}) {
  if (isDebug()) console.info('[track]', eventName, data);
}
