/**
 * Unit tests for runtime error handling
 * Tests error handlers, polyfill fallbacks, and graceful degradation
 * 
 * Validates: Requirements 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isAPIAvailable,
  ensureQueueMicrotask,
  ensurePromiseAllSettled,
  ensurePromiseFinally,
  ensureArrayFlat,
  ensureArrayFlatMap,
  ensureObjectFromEntries,
  safeAPICall,
  initializeRuntimeErrorHandling,
  checkBrowserCompatibility
} from '../lib/runtimeErrorHandling';

describe('Runtime Error Handling', () => {
  let consoleWarnSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('isAPIAvailable', () => {
    it('should detect available APIs', () => {
      expect(isAPIAvailable('Promise')).toBe(true);
      expect(isAPIAvailable('Array')).toBe(true);
      expect(isAPIAvailable('Object')).toBe(true);
    });

    it('should detect unavailable APIs', () => {
      expect(isAPIAvailable('NonExistentAPI')).toBe(false);
      expect(isAPIAvailable('window.nonExistent.api')).toBe(false);
    });

    it('should handle nested API paths', () => {
      expect(isAPIAvailable('Array.prototype.map')).toBe(true);
      expect(isAPIAvailable('Promise.resolve')).toBe(true);
    });
  });

  describe('ensureQueueMicrotask', () => {
    it('should add queueMicrotask polyfill if missing', () => {
      const originalQueueMicrotask = (window as any).queueMicrotask;
      delete (window as any).queueMicrotask;

      ensureQueueMicrotask();

      expect(typeof (window as any).queueMicrotask).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('queueMicrotask not available')
      );

      // Restore
      (window as any).queueMicrotask = originalQueueMicrotask;
    });

    it('should not override existing queueMicrotask', () => {
      const mockQueueMicrotask = vi.fn();
      (window as any).queueMicrotask = mockQueueMicrotask;

      ensureQueueMicrotask();

      expect((window as any).queueMicrotask).toBe(mockQueueMicrotask);
    });

    it('should execute callback asynchronously when polyfilled', async () => {
      const originalQueueMicrotask = (window as any).queueMicrotask;
      delete (window as any).queueMicrotask;

      ensureQueueMicrotask();

      let executed = false;
      (window as any).queueMicrotask(() => {
        executed = true;
      });

      expect(executed).toBe(false);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(executed).toBe(true);

      // Restore
      (window as any).queueMicrotask = originalQueueMicrotask;
    });
  });

  describe('ensurePromiseAllSettled', () => {
    it('should add Promise.allSettled polyfill if missing', () => {
      const originalAllSettled = Promise.allSettled;
      delete (Promise as any).allSettled;

      ensurePromiseAllSettled();

      expect(typeof Promise.allSettled).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Promise.allSettled not available')
      );

      // Restore
      (Promise as any).allSettled = originalAllSettled;
    });

    it('should handle fulfilled and rejected promises correctly', async () => {
      const originalAllSettled = Promise.allSettled;
      delete (Promise as any).allSettled;

      ensurePromiseAllSettled();

      const results = await Promise.allSettled([
        Promise.resolve('success'),
        Promise.reject('error'),
        Promise.resolve('another success')
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 'success' });
      expect(results[1]).toEqual({ status: 'rejected', reason: 'error' });
      expect(results[2]).toEqual({ status: 'fulfilled', value: 'another success' });

      // Restore
      (Promise as any).allSettled = originalAllSettled;
    });
  });

  describe('ensurePromiseFinally', () => {
    it('should add Promise.finally polyfill if missing', () => {
      const originalFinally = Promise.prototype.finally;
      delete (Promise.prototype as any).finally;

      ensurePromiseFinally();

      expect(typeof Promise.prototype.finally).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Promise.finally not available')
      );

      // Restore
      (Promise.prototype as any).finally = originalFinally;
    });

    it('should execute finally callback on fulfilled promise', async () => {
      const originalFinally = Promise.prototype.finally;
      delete (Promise.prototype as any).finally;

      ensurePromiseFinally();

      let finallyCalled = false;
      const result = await Promise.resolve('success').finally(() => {
        finallyCalled = true;
      });

      expect(finallyCalled).toBe(true);
      expect(result).toBe('success');

      // Restore
      (Promise.prototype as any).finally = originalFinally;
    });

    it('should execute finally callback on rejected promise', async () => {
      const originalFinally = Promise.prototype.finally;
      delete (Promise.prototype as any).finally;

      ensurePromiseFinally();

      let finallyCalled = false;
      try {
        await Promise.reject('error').finally(() => {
          finallyCalled = true;
        });
      } catch (error) {
        expect(error).toBe('error');
      }

      expect(finallyCalled).toBe(true);

      // Restore
      (Promise.prototype as any).finally = originalFinally;
    });
  });

  describe('ensureArrayFlat', () => {
    it('should add Array.flat polyfill if missing', () => {
      const originalFlat = Array.prototype.flat;
      delete (Array.prototype as any).flat;

      ensureArrayFlat();

      expect(typeof Array.prototype.flat).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Array.prototype.flat not available')
      );

      // Restore
      (Array.prototype as any).flat = originalFlat;
    });

    it('should flatten arrays correctly', () => {
      const originalFlat = Array.prototype.flat;
      delete (Array.prototype as any).flat;

      ensureArrayFlat();

      const nested = [1, [2, 3], [4, [5, 6]]];
      expect(nested.flat()).toEqual([1, 2, 3, 4, [5, 6]]);
      expect(nested.flat(2)).toEqual([1, 2, 3, 4, 5, 6]);

      // Restore
      (Array.prototype as any).flat = originalFlat;
    });
  });

  describe('ensureArrayFlatMap', () => {
    it('should add Array.flatMap polyfill if missing', () => {
      const originalFlatMap = Array.prototype.flatMap;
      delete (Array.prototype as any).flatMap;

      ensureArrayFlatMap();

      expect(typeof Array.prototype.flatMap).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Array.prototype.flatMap not available')
      );

      // Restore
      (Array.prototype as any).flatMap = originalFlatMap;
    });

    it('should map and flatten arrays correctly', () => {
      const originalFlatMap = Array.prototype.flatMap;
      delete (Array.prototype as any).flatMap;

      ensureArrayFlatMap();

      const arr = [1, 2, 3];
      const result = arr.flatMap(x => [x, x * 2]);
      expect(result).toEqual([1, 2, 2, 4, 3, 6]);

      // Restore
      (Array.prototype as any).flatMap = originalFlatMap;
    });
  });

  describe('ensureObjectFromEntries', () => {
    it('should add Object.fromEntries polyfill if missing', () => {
      const originalFromEntries = Object.fromEntries;
      delete (Object as any).fromEntries;

      ensureObjectFromEntries();

      expect(typeof Object.fromEntries).toBe('function');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Object.fromEntries not available')
      );

      // Restore
      (Object as any).fromEntries = originalFromEntries;
    });

    it('should convert entries to object correctly', () => {
      const originalFromEntries = Object.fromEntries;
      delete (Object as any).fromEntries;

      ensureObjectFromEntries();

      const entries: [string, any][] = [['a', 1], ['b', 2], ['c', 3]];
      const result = Object.fromEntries(entries);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });

      // Restore
      (Object as any).fromEntries = originalFromEntries;
    });
  });

  describe('safeAPICall', () => {
    it('should return result when API call succeeds', () => {
      const result = safeAPICall(() => 'success', 'fallback', 'testAPI');
      expect(result).toBe('success');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return fallback when API call throws error', () => {
      const result = safeAPICall(
        () => {
          throw new Error('API error');
        },
        'fallback',
        'testAPI'
      );
      
      expect(result).toBe('fallback');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error calling testAPI'),
        expect.any(Error)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback value')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const mockGetItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      const result = safeAPICall(
        () => mockGetItem(),
        null,
        'localStorage.getItem'
      );

      expect(result).toBe(null);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('initializeRuntimeErrorHandling', () => {
    it('should initialize all polyfills', () => {
      initializeRuntimeErrorHandling();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initializing runtime error handling')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Runtime error handling initialized')
      );
    });

    it('should set up global error handlers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      initializeRuntimeErrorHandling();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });
  });

  describe('checkBrowserCompatibility', () => {
    it('should log available APIs', () => {
      checkBrowserCompatibility();

      // Should log either missing APIs or success message
      expect(consoleWarnSpy.mock.calls.length + consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it('should detect missing APIs', () => {
      const originalQueueMicrotask = (window as any).queueMicrotask;
      delete (window as any).queueMicrotask;

      checkBrowserCompatibility();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing browser APIs'),
        expect.arrayContaining(['queueMicrotask'])
      );

      // Restore
      (window as any).queueMicrotask = originalQueueMicrotask;
    });
  });

  describe('Application continues functioning after errors', () => {
    it('should allow application to continue after localStorage error', () => {
      let appContinued = false;

      safeAPICall(
        () => {
          throw new Error('localStorage error');
        },
        null,
        'localStorage'
      );

      // Application should continue
      appContinued = true;
      expect(appContinued).toBe(true);
    });

    it('should allow application to continue after API error', () => {
      let appContinued = false;

      safeAPICall(
        () => {
          throw new Error('API error');
        },
        'default',
        'someAPI'
      );

      // Application should continue
      appContinued = true;
      expect(appContinued).toBe(true);
    });
  });
});
