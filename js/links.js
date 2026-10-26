import { LINKS } from '../config/links.js';

// Outbound URL with the UTM parameters from config
function withUtm(href) {
  const url = new URL(href);
  for (const [k, v] of Object.entries(LINKS.utm)) url.searchParams.set(k, v);
  return url.toString();
}

export function scheduleUrl() {
  return withUtm(LINKS.scheduleUrl);
}

export function presaleUrl() {
  return withUtm(LINKS.presaleUrl);
}

