// localStorage wrapper. Storage can throw (private mode, blocked site data, some webviews),
// so every access is guarded and the game works without it.
import { GAME } from '../config/game.js';

const prefix = GAME.storageKeyPrefix;

export function load(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(prefix + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    window.localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
