import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSafeStorage } from '../lib/storage';

afterEach(() => vi.restoreAllMocks());

describe('Safari storage restrictions', () => {
  it('keeps values when storage exists but writes fail with a full quota', () => {
    const storage = createSafeStorage('localStorage');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    storage.setItem('token', 'session-token');
    expect(storage.getItem('token')).toBe('session-token');
    storage.removeItem('token');
    expect(storage.getItem('token')).toBeNull();
  });

  it('works when even accessing localStorage is denied', () => {
    const storage = createSafeStorage('localStorage');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    expect(storage.getItem('token')).toBeNull();
    storage.setItem('token', 'session-token');
    expect(storage.getItem('token')).toBe('session-token');
    storage.removeItem('token');
    expect(storage.getItem('token')).toBeNull();
  });
});
