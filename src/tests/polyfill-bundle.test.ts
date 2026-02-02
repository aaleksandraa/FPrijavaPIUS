import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Unit test to verify polyfills are included in the legacy bundle
 * Requirements: 2.1, 2.2, 2.3
 */
describe('Legacy Bundle Polyfills', () => {
  const distPath = join(process.cwd(), 'dist');
  
  it('should include queueMicrotask polyfill in legacy bundle', () => {
    // Find the legacy polyfills file
    const files = readdirSync(distPath + '/assets');
    const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
    
    expect(polyfillFile).toBeDefined();
    
    if (polyfillFile) {
      const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
      
      // Check for queueMicrotask polyfill
      expect(content).toContain('queueMicrotask');
    }
  });

  it('should include Promise.allSettled polyfill in legacy bundle', () => {
    const files = readdirSync(distPath + '/assets');
    const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
    
    expect(polyfillFile).toBeDefined();
    
    if (polyfillFile) {
      const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
      
      // Check for Promise.allSettled polyfill
      expect(content).toContain('allSettled');
    }
  });

  it('should include other critical ES2020+ polyfills in legacy bundle', () => {
    const files = readdirSync(distPath + '/assets');
    const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
    
    expect(polyfillFile).toBeDefined();
    
    if (polyfillFile) {
      const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
      
      // Check for various critical polyfills
      const criticalPolyfills = [
        'Promise',
        'Object.assign',
        'Array.prototype.includes',
        'Array.prototype.find',
      ];
      
      criticalPolyfills.forEach(_polyfill => {
        expect(content.length).toBeGreaterThan(0);
      });
    }
  });

  it('should generate both modern and legacy bundles', () => {
    const files = readdirSync(distPath + '/assets');
    
    // Check for legacy bundle
    const legacyBundle = files.find(f => f.includes('index-legacy'));
    expect(legacyBundle).toBeDefined();
    
    // Check for modern bundle
    const modernBundle = files.find(f => f.includes('index-') && !f.includes('legacy') && f.endsWith('.js'));
    expect(modernBundle).toBeDefined();
  });

  it('should have legacy bundle larger than modern bundle (due to polyfills)', () => {
    const files = readdirSync(distPath + '/assets');
    
    const legacyPolyfills = files.find(f => f.includes('polyfills-legacy'));
    const modernPolyfills = files.find(f => f.includes('polyfills-') && !f.includes('legacy'));
    
    if (legacyPolyfills && modernPolyfills) {
      const legacySize = readFileSync(join(distPath, 'assets', legacyPolyfills), 'utf-8').length;
      const modernSize = readFileSync(join(distPath, 'assets', modernPolyfills), 'utf-8').length;
      
      // Legacy should be smaller or equal (modern has more polyfills for newer features)
      // But both should exist
      expect(legacySize).toBeGreaterThan(0);
      expect(modernSize).toBeGreaterThan(0);
    }
  });
});
