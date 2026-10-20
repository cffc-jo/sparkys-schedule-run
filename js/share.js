// Share the player's time: Web Share API where available, otherwise copy to the clipboard.
import { SHARE } from '../config/links.js';
import { gameUrl } from './links.js';
import { formatTime } from './timer.js';

export function shareText(finalTimeMs) {
  let text = SHARE.text.replace('{time}', formatTime(finalTimeMs));
  if (SHARE.hashtags) text += ' ' + SHARE.hashtags;
  return text;
}

// Returns 'shared' | 'copied' | 'cancelled' | 'manual' (caller shows the text to copy by hand).
export async function shareResult(finalTimeMs) {
  const text = shareText(finalTimeMs);
  const url = gameUrl();
  if (navigator.share) {
    try {
      await navigator.share({ title: SHARE.title, text, url });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
      // Some in-app webviews expose share() but fail: fall through to copy
    }
  }
  const full = `${text} ${url}`;
  try {
    await navigator.clipboard.writeText(full);
    return 'copied';
  } catch {
    // Older webviews: hidden textarea + execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = full;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (ok) return 'copied';
    } catch { /* ignore */ }
  }
  return 'manual';
}
