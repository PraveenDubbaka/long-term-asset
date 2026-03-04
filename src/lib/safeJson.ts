/**
 * Safe JSON parsing helpers.
 *
 * Motivation: after merges or schema changes, users may have stale/corrupt
 * localStorage values that would otherwise crash the app at runtime.
 */

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function readJsonFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return safeJsonParse<T>(raw, fallback);
  } catch {
    // localStorage might be blocked or corrupted; fail safe.
    return fallback;
  }
}

export function writeJsonToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures (quota exceeded / blocked storage)
  }
}

export function removeLocalStorageKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
