import { LINKS } from '../config/links.js';

// Schedule URL with UTM parameters from config.
export function scheduleUrl() {
  const url = new URL(LINKS.scheduleUrl);
  for (const [k, v] of Object.entries(LINKS.utm)) url.searchParams.set(k, v);
  return url.toString();
}

// Public link to the game (for sharing). Strips debug/query params.
export function gameUrl() {
  if (LINKS.gameUrl) return LINKS.gameUrl;
  const { origin, pathname } = window.location;
  return origin + pathname;
}
