// Preloader. Each entry: { key, type: 'image' | 'json' | 'font', src, optional }.
// Optional assets resolve to null on failure (e.g. a missing logo shows the club abbreviation).
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed: ' + src));
    img.src = src;
  });
}

async function loadJson(src) {
  const res = await fetch(src, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
  return res.json();
}

async function loadFont(family, timeoutMs = 4000) {
  if (!document.fonts || !document.fonts.load) return false;
  const timeout = new Promise((resolve) => setTimeout(() => resolve([]), timeoutMs));
  const faces = await Promise.race([document.fonts.load(`8px "${family}"`), timeout]);
  return faces.length > 0;
}

export async function loadAssets(manifest, onProgress = () => {}) {
  const out = {};
  let done = 0;
  onProgress(0);
  await Promise.all(manifest.map(async (item) => {
    try {
      if (item.type === 'image') out[item.key] = await loadImage(item.src);
      else if (item.type === 'json') out[item.key] = await loadJson(item.src);
      else if (item.type === 'font') out[item.key] = await loadFont(item.family);
    } catch (err) {
      if (!item.optional) throw err;
      console.warn(err.message);
      out[item.key] = null;
    } finally {
      done++;
      onProgress(done / manifest.length);
    }
  }));
  return out;
}
