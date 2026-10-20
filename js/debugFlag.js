// ?debug=1 in the URL turns on developer tools (hitboxes, FPS, god mode, etc.).
let cached = null;

export function isDebug() {
  if (cached === null) {
    try {
      cached = new URLSearchParams(window.location.search).get('debug') === '1';
    } catch {
      cached = false;
    }
  }
  return cached;
}
