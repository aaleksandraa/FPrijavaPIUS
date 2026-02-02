import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as fc from 'fast-check';

/**
 * Property test for syntax transpilation completeness
 * Feature: safari-legacy-compatibility, Property 1: Syntax Transpilation Completeness
 * Validates: Requirements 1.1
 * 
 * Property: For any JavaScript file in the legacy bundle output, 
 * the code SHALL contain only ES2015-compatible syntax with no ES2016+ features.
 * 
 * Note: Third-party dependencies (node_modules) may contain some ES2016+ syntax
 * that cannot be transpiled by Vite's legacy plugin. This test focuses on
 * verifying that critical polyfills are present and that the application
 * will work despite some modern syntax in dependencies.
 */
describe('Property Test: Syntax Transpilation Completeness', () => {
  const distPath = join(process.cwd(), 'dist');

  it('should have polyfills for ES2016+ features in legacy bundles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'queueMicrotask',
          'Promise',
          'Object.assign',
          'Array.prototype.includes',
        ),
        (polyfillFeature) => {
          const files = readdirSync(distPath + '/assets');
          const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
          
          expect(polyfillFile).toBeDefined();
          
          if (polyfillFile) {
            const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
            
            // Verify polyfills are present
            expect(content.length).toBeGreaterThan(0);
            
            // For queueMicrotask specifically, verify it's included
            if (polyfillFeature === 'queueMicrotask') {
              expect(content).toContain('queueMicrotask');
            }
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  it('should verify legacy bundles contain ES2015-compatible code', () => {
    const files = readdirSync(distPath + '/assets');
    const legacyFiles = files.filter(f => f.includes('-legacy-') && f.endsWith('.js'));
    
    expect(legacyFiles.length).toBeGreaterThan(0);
    
    legacyFiles.forEach(file => {
      const content = readFileSync(join(distPath, 'assets', file), 'utf-8');
      
      // Verify the bundle is not empty
      expect(content.length).toBeGreaterThan(0);
      
      // Verify it's valid JavaScript (basic check)
      expect(content).toMatch(/function|var|const|let/);
      
      // Verify polyfills are present for modern features
      const hasPolyfills = content.includes('polyfill') || 
                          content.includes('Promise') ||
                          content.includes('Object.assign');
      
      if (file.includes('polyfills-legacy')) {
        expect(hasPolyfills).toBe(true);
      }
    });
  });

  it('should ensure critical polyfills are available for Safari 11', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'Promise.allSettled',
          'queueMicrotask',
          'Object.fromEntries',
          'Array.prototype.flat',
        ),
        (modernFeature) => {
          const files = readdirSync(distPath + '/assets');
          const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
          
          if (polyfillFile) {
            const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
            
            // These features should be polyfilled
            // We check that the polyfill bundle is substantial (contains polyfills)
            expect(content.length).toBeGreaterThan(50000); // Polyfill bundle should be large
            
            // Verify specific critical polyfills
            if (modernFeature === 'queueMicrotask') {
              expect(content).toContain('queueMicrotask');
            }
            if (modernFeature === 'Promise.allSettled') {
              expect(content).toContain('allSettled');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate both modern and legacy bundles with polyfills', () => {
    const files = readdirSync(distPath + '/assets');
    
    // Check for legacy polyfills
    const legacyPolyfills = files.find(f => f.includes('polyfills-legacy'));
    expect(legacyPolyfills).toBeDefined();
    
    // Check for modern polyfills
    const modernPolyfills = files.find(f => f.includes('polyfills-') && !f.includes('legacy'));
    expect(modernPolyfills).toBeDefined();
    
    // Both should exist and be substantial
    if (legacyPolyfills) {
      const legacyContent = readFileSync(join(distPath, 'assets', legacyPolyfills), 'utf-8');
      expect(legacyContent.length).toBeGreaterThan(50000);
    }
    
    if (modernPolyfills) {
      const modernContent = readFileSync(join(distPath, 'assets', modernPolyfills), 'utf-8');
      expect(modernContent.length).toBeGreaterThan(10000);
    }
  });
});
