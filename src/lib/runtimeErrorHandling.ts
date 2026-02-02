/**
 * Runtime error handling for legacy browser compatibility
 * Provides graceful degradation and polyfill fallbacks for Safari 11-12
 */

/**
 * Check if an API is available in the current browser
 */
export const isAPIAvailable = (apiPath: string): boolean => {
  const parts = apiPath.split('.');
  let current: any = window;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return false;
    }
    current = current[part];
  }
  
  return current !== undefined;
};

/**
 * Polyfill for queueMicrotask (not available in Safari < 12.1)
 */
export const ensureQueueMicrotask = (): void => {
  if (typeof queueMicrotask === 'undefined') {
    console.warn('⚠️ queueMicrotask not available, using Promise-based fallback');
    (window as any).queueMicrotask = (callback: () => void) => {
      Promise.resolve()
        .then(callback)
        .catch(e => {
          setTimeout(() => { throw e; });
        });
    };
  }
};

/**
 * Polyfill for Promise.allSettled (not available in Safari < 13)
 */
export const ensurePromiseAllSettled = (): void => {
  if (!Promise.allSettled) {
    console.warn('⚠️ Promise.allSettled not available, using polyfill');
    (Promise as any).allSettled = function(promises: Promise<any>[]): Promise<any[]> {
      return Promise.all(
        promises.map(promise =>
          Promise.resolve(promise)
            .then(value => ({ status: 'fulfilled', value }))
            .catch(reason => ({ status: 'rejected', reason }))
        )
      );
    };
  }
};

/**
 * Polyfill for Promise.finally (not available in Safari < 11.1)
 */
export const ensurePromiseFinally = (): void => {
  if (!Promise.prototype.finally) {
    console.warn('⚠️ Promise.finally not available, using polyfill');
    (Promise.prototype as any).finally = function(onFinally: () => void) {
      return this.then(
        (value: any) => Promise.resolve(onFinally()).then(() => value),
        (reason: any) => Promise.resolve(onFinally()).then(() => { throw reason; })
      );
    };
  }
};

/**
 * Polyfill for Array.prototype.flat (not available in Safari < 12)
 */
export const ensureArrayFlat = (): void => {
  if (!Array.prototype.flat) {
    console.warn('⚠️ Array.prototype.flat not available, using polyfill');
    (Array.prototype as any).flat = function(depth: number = 1): any[] {
      const flatten = (arr: any[], d: number): any[] => {
        return d > 0
          ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), [])
          : arr.slice();
      };
      return flatten(this, depth);
    };
  }
};

/**
 * Polyfill for Array.prototype.flatMap (not available in Safari < 12)
 */
export const ensureArrayFlatMap = (): void => {
  if (!Array.prototype.flatMap) {
    console.warn('⚠️ Array.prototype.flatMap not available, using polyfill');
    (Array.prototype as any).flatMap = function(callback: (value: any, index: number, array: any[]) => any): any[] {
      return this.map(callback).flat(1);
    };
  }
};

/**
 * Polyfill for Object.fromEntries (not available in Safari < 12.1)
 */
export const ensureObjectFromEntries = (): void => {
  if (!Object.fromEntries) {
    console.warn('⚠️ Object.fromEntries not available, using polyfill');
    (Object as any).fromEntries = function(entries: Iterable<[string, any]>): any {
      const obj: any = {};
      for (const [key, value] of entries) {
        // Use Object.defineProperty to handle special keys like __proto__
        Object.defineProperty(obj, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
      return obj;
    };
  }
};

/**
 * Safe wrapper for API calls that might not be available
 */
export const safeAPICall = <T>(
  apiCall: () => T,
  fallback: T,
  apiName: string
): T => {
  try {
    return apiCall();
  } catch (error) {
    console.warn(`⚠️ Error calling ${apiName}:`, error);
    console.warn(`Using fallback value for ${apiName}`);
    return fallback;
  }
};

/**
 * Initialize all runtime polyfills and error handlers
 */
export const initializeRuntimeErrorHandling = (): void => {
  console.log('🛡️ Initializing runtime error handling...');
  
  try {
    // Apply critical polyfills
    ensureQueueMicrotask();
    ensurePromiseAllSettled();
    ensurePromiseFinally();
    ensureArrayFlat();
    ensureArrayFlatMap();
    ensureObjectFromEntries();
    
    // Global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
      // Prevent the default behavior (which would throw an error)
      event.preventDefault();
    });
    
    // Global error handler for runtime errors
    window.addEventListener('error', (event) => {
      console.error('❌ Runtime error:', event.error || event.message);
      // Log but don't prevent default - let the error be visible in console
    });
    
    console.log('✅ Runtime error handling initialized');
  } catch (error) {
    console.error('❌ Failed to initialize runtime error handling:', error);
  }
};

/**
 * Check browser compatibility and log warnings
 */
export const checkBrowserCompatibility = (): void => {
  const missingAPIs: string[] = [];
  
  const criticalAPIs = [
    'Promise',
    'Promise.prototype.finally',
    'Promise.allSettled',
    'queueMicrotask',
    'Array.prototype.flat',
    'Array.prototype.flatMap',
    'Object.fromEntries',
    'Object.entries',
    'Object.values'
  ];
  
  for (const api of criticalAPIs) {
    if (!isAPIAvailable(api)) {
      missingAPIs.push(api);
    }
  }
  
  if (missingAPIs.length > 0) {
    console.warn('⚠️ Missing browser APIs (will use polyfills):', missingAPIs);
  } else {
    console.log('✅ All critical browser APIs available');
  }
};
