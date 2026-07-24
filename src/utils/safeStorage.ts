// Safe localStorage wrapper to prevent crashes in restricted WebViews, private modes, or custom TV Box environments
class SafeLocalStorage {
  private memoryStore: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Failed to getItem for key "${key}":`, e);
    }
    return Object.prototype.hasOwnProperty.call(this.memoryStore, key) ? this.memoryStore[key] : null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Failed to setItem for key "${key}":`, e);
    }
    this.memoryStore[key] = String(value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn(`[safeLocalStorage] Failed to removeItem for key "${key}":`, e);
    }
    delete this.memoryStore[key];
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn("[safeLocalStorage] Failed to clear localStorage:", e);
    }
    this.memoryStore = {};
  }
}

export const safeLocalStorage = new SafeLocalStorage();
