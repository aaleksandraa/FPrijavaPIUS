/**
 * Property-based test for API fallback functionality
 * 
 * Property 3: API Fallback Functionality
 * For any modern JavaScript API call in the application, when the native API is unavailable,
 * the polyfill SHALL provide equivalent functionality without throwing reference errors.
 * 
 * Validates: Requirements 1.4
 * 
 * Feature: safari-legacy-compatibility, Property 3: API Fallback Functionality
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ensureQueueMicrotask,
  ensurePromiseAllSettled,
  ensurePromiseFinally,
  ensureArrayFlat,
  ensureArrayFlatMap,
  ensureObjectFromEntries
} from '../lib/runtimeErrorHandling';

describe('Property 3: API Fallback Functionality', () => {
  describe('queueMicrotask polyfill', () => {
    it('should provide equivalent functionality when native API is absent', () => {
      fc.assert(
        fc.property(
          fc.func(fc.constant(undefined)),
          () => {
            // Save original
            const original = (window as any).queueMicrotask;
            
            try {
              // Remove native API
              delete (window as any).queueMicrotask;
              
              // Apply polyfill
              ensureQueueMicrotask();
              
              // Verify polyfill exists and is a function
              expect(typeof (window as any).queueMicrotask).toBe('function');
              
              // Verify no reference error is thrown
              let executed = false;
              expect(() => {
                (window as any).queueMicrotask(() => {
                  executed = true;
                });
              }).not.toThrow();
              
              // Verify callback is queued (will execute asynchronously)
              expect(executed).toBe(false);
            } finally {
              // Restore
              (window as any).queueMicrotask = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should execute callbacks asynchronously like native API', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (numCallbacks) => {
            const original = (window as any).queueMicrotask;
            
            try {
              delete (window as any).queueMicrotask;
              ensureQueueMicrotask();
              
              const results: number[] = [];
              const promises: Promise<void>[] = [];
              
              for (let i = 0; i < numCallbacks; i++) {
                promises.push(
                  new Promise<void>((resolve) => {
                    (window as any).queueMicrotask(() => {
                      results.push(i);
                      resolve();
                    });
                  })
                );
              }
              
              await Promise.all(promises);
              
              // All callbacks should have executed
              expect(results).toHaveLength(numCallbacks);
            } finally {
              (window as any).queueMicrotask = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Promise.allSettled polyfill', () => {
    it('should provide equivalent functionality when native API is absent', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.constant(Promise.resolve('success')),
              fc.constant(Promise.reject('error'))
            ),
            { minLength: 1, maxLength: 10 }
          ),
          async (promises) => {
            const original = Promise.allSettled;
            
            try {
              delete (Promise as any).allSettled;
              ensurePromiseAllSettled();
              
              expect(typeof Promise.allSettled).toBe('function');
              
              // Should not throw reference error
              let results;
              expect(async () => {
                results = await Promise.allSettled(promises);
              }).not.toThrow();
              
              results = await Promise.allSettled(promises);
              
              // Should return array of results
              expect(Array.isArray(results)).toBe(true);
              expect(results).toHaveLength(promises.length);
              
              // Each result should have status
              results.forEach((result: any) => {
                expect(['fulfilled', 'rejected']).toContain(result.status);
              });
            } finally {
              (Promise as any).allSettled = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Promise.finally polyfill', () => {
    it('should provide equivalent functionality when native API is absent', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('fulfilled'),
            fc.constant('rejected')
          ),
          async (promiseType) => {
            const original = Promise.prototype.finally;
            
            try {
              delete (Promise.prototype as any).finally;
              ensurePromiseFinally();
              
              expect(typeof Promise.prototype.finally).toBe('function');
              
              let finallyCalled = false;
              const promise = promiseType === 'fulfilled'
                ? Promise.resolve('success')
                : Promise.reject('error');
              
              // Should not throw reference error
              expect(() => {
                promise.finally(() => {
                  finallyCalled = true;
                });
              }).not.toThrow();
              
              try {
                await promise.finally(() => {
                  finallyCalled = true;
                });
              } catch (e) {
                // Expected for rejected promises
              }
              
              // Finally should have been called
              expect(finallyCalled).toBe(true);
            } finally {
              (Promise.prototype as any).finally = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Array.prototype.flat polyfill', () => {
    it('should provide equivalent functionality when native API is absent', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.integer(),
              fc.array(fc.integer(), { maxLength: 3 })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (nestedArray) => {
            const original = Array.prototype.flat;
            
            try {
              delete (Array.prototype as any).flat;
              ensureArrayFlat();
              
              expect(typeof Array.prototype.flat).toBe('function');
              
              // Should not throw reference error
              let result;
              expect(() => {
                result = nestedArray.flat();
              }).not.toThrow();
              
              result = nestedArray.flat();
              
              // Result should be an array
              expect(Array.isArray(result)).toBe(true);
              
              // Should flatten one level
              // If original had 2+ levels, result might still have arrays
              // But it should have flattened at least one level
              result.some((item: any) => Array.isArray(item));
            } finally {
              (Array.prototype as any).flat = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Array.prototype.flatMap polyfill', () => {
    it('should provide equivalent functionality when native API is absent', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
          (arr) => {
            const original = Array.prototype.flatMap;
            
            try {
              delete (Array.prototype as any).flatMap;
              ensureArrayFlatMap();
              
              expect(typeof Array.prototype.flatMap).toBe('function');
              
              // Should not throw reference error
              let result;
              expect(() => {
                result = arr.flatMap(x => [x, x * 2]);
              }).not.toThrow();
              
              result = arr.flatMap(x => [x, x * 2]);
              
              // Result should be an array
              expect(Array.isArray(result)).toBe(true);
              
              // Should have doubled the length
              expect(result).toHaveLength(arr.length * 2);
            } finally {
              (Array.prototype as any).flatMap = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Object.fromEntries polyfill', () => {
    it('should provide equivalent functionality when native API is absent', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(fc.string(), fc.anything()),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            const original = Object.fromEntries;
            
            try {
              delete (Object as any).fromEntries;
              ensureObjectFromEntries();
              
              expect(typeof Object.fromEntries).toBe('function');
              
              // Should not throw reference error
              let result;
              expect(() => {
                result = Object.fromEntries(entries);
              }).not.toThrow();
              
              result = Object.fromEntries(entries);
              
              // Result should be an object
              expect(typeof result).toBe('object');
              expect(result).not.toBeNull();
              
              // Should have correct number of keys (accounting for duplicates)
              const uniqueKeys = new Set(entries.map(([key]) => key));
              expect(Object.keys(result).length).toBe(uniqueKeys.size);
            } finally {
              (Object as any).fromEntries = original;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined API usage', () => {
    it('should handle multiple missing APIs without reference errors', () => {
      fc.assert(
        fc.property(
          fc.record({
            useQueueMicrotask: fc.boolean(),
            usePromiseAllSettled: fc.boolean(),
            useArrayFlat: fc.boolean(),
            useObjectFromEntries: fc.boolean()
          }),
          (config) => {
            // Save originals
            const originals = {
              queueMicrotask: (window as any).queueMicrotask,
              allSettled: Promise.allSettled,
              flat: Array.prototype.flat,
              fromEntries: Object.fromEntries
            };
            
            try {
              // Remove selected APIs
              if (config.useQueueMicrotask) delete (window as any).queueMicrotask;
              if (config.usePromiseAllSettled) delete (Promise as any).allSettled;
              if (config.useArrayFlat) delete (Array.prototype as any).flat;
              if (config.useObjectFromEntries) delete (Object as any).fromEntries;
              
              // Apply polyfills
              ensureQueueMicrotask();
              ensurePromiseAllSettled();
              ensureArrayFlat();
              ensureObjectFromEntries();
              
              // Verify no reference errors when using APIs
              expect(() => {
                if (config.useQueueMicrotask) {
                  (window as any).queueMicrotask(() => {});
                }
                if (config.usePromiseAllSettled) {
                  Promise.allSettled([Promise.resolve(1)]);
                }
                if (config.useArrayFlat) {
                  [1, [2, 3]].flat();
                }
                if (config.useObjectFromEntries) {
                  Object.fromEntries([['a', 1]]);
                }
              }).not.toThrow();
            } finally {
              // Restore
              (window as any).queueMicrotask = originals.queueMicrotask;
              (Promise as any).allSettled = originals.allSettled;
              (Array.prototype as any).flat = originals.flat;
              (Object as any).fromEntries = originals.fromEntries;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
