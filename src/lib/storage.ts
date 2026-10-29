// Safari can deny either access to Storage or individual writes (private mode,
// full quota, embedded browsers). Keep a per-tab fallback without replacing the
// browser's read-only window.localStorage/sessionStorage properties.
export function createSafeStorage(name: 'localStorage' | 'sessionStorage') {
  const memory: Record<string, string> = Object.create(null);
  const failedWrites: Record<string, boolean> = Object.create(null);

  return {
    getItem(key: string): string | null {
      if (failedWrites[key]) return memory[key] ?? null;
      try {
        return window[name].getItem(key);
      } catch {
        return memory[key] ?? null;
      }
    },
    setItem(key: string, value: string): void {
      memory[key] = String(value);
      try {
        window[name].setItem(key, value);
        delete failedWrites[key];
      } catch {
        failedWrites[key] = true;
        // The in-memory value remains available while this page is open.
      }
    },
    removeItem(key: string): void {
      delete memory[key];
      delete failedWrites[key];
      try {
        window[name].removeItem(key);
      } catch {
        failedWrites[key] = true;
        // Storage may be blocked entirely.
      }
    },
  };
}

export const localStore = createSafeStorage('localStorage');
export const sessionStore = createSafeStorage('sessionStorage');
