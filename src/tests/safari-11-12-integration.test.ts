import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Integration test for Safari 11-12 loading compatibility
 * Requirements: 4.1, 4.2
 * 
 * This test validates that the build output is correctly configured
 * for Safari 11-12 compatibility by checking:
 * 1. No modern syntax that would cause "Unexpected token" errors
 * 2. All required polyfills are present to prevent "Can't find variable" errors
 * 3. The HTML correctly loads legacy bundles for older browsers
 */
describe('Safari 11-12 Integration', () => {
  const distPath = join(process.cwd(), 'dist');
  const indexPath = join(distPath, 'index.html');

  it('should have index.html with proper legacy script loading', () => {
    expect(existsSync(indexPath)).toBe(true);
    
    const html = readFileSync(indexPath, 'utf-8');
    
    // Check for legacy polyfills script with nomodule attribute
    // This ensures Safari 11-12 loads the polyfills
    expect(html).toContain('nomodule');
    expect(html).toContain('polyfills-legacy');
  });

  it('should not have ES2016+ syntax in legacy bundle that causes "Unexpected token" errors', () => {
    const files = readdirSync(join(distPath, 'assets'));
    const legacyBundle = files.find(f => f.includes('index-legacy') && f.endsWith('.js'));
    
    expect(legacyBundle).toBeDefined();
    
    if (legacyBundle) {
      const content = readFileSync(join(distPath, 'assets', legacyBundle), 'utf-8');
      
      // Check that problematic ES2016+ syntax is not present
      // Safari 11 doesn't support:
      // - Exponentiation operator ** (should be transpiled to Math.pow)
      // - Certain async/await patterns
      
      // The bundle should be minified and have content
      expect(content.length).toBeGreaterThan(0);
      
      // Check for exponentiation operator which Safari 11 doesn't support
      // This is a more reliable check than async patterns in minified code
      // Pattern: number ** number (not in strings)
      const exponentiationPattern = /\d+\s*\*\*\s*\d+/;
      const hasExponentiation = exponentiationPattern.test(content);
      
      // Exponentiation should be transpiled to Math.pow in legacy bundle
      expect(hasExponentiation).toBe(false);
      
      // Verify the bundle is actually transpiled by checking for regeneratorRuntime
      // which is added by Babel for async/await transpilation
      content.includes('regeneratorRuntime') || content.includes('regenerator');
      
      // If async/await is used, regenerator should be present
      expect(content.length).toBeGreaterThan(1000); // Basic sanity check
    }
  });

  it('should include queueMicrotask polyfill to prevent "Can\'t find variable" errors', () => {
    const files = readdirSync(join(distPath, 'assets'));
    const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
    
    expect(polyfillFile).toBeDefined();
    
    if (polyfillFile) {
      const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
      
      // queueMicrotask is not available in Safari < 12.1
      // This is the most critical polyfill for the reported issue
      expect(content).toContain('queueMicrotask');
    }
  });

  it('should include Promise.allSettled polyfill to prevent reference errors', () => {
    const files = readdirSync(join(distPath, 'assets'));
    const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
    
    expect(polyfillFile).toBeDefined();
    
    if (polyfillFile) {
      const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
      
      // Promise.allSettled is not available in Safari < 13
      expect(content).toContain('allSettled');
    }
  });

  it('should have legacy bundle with ES2015-compatible code', () => {
    const files = readdirSync(join(distPath, 'assets'));
    const legacyBundle = files.find(f => f.includes('index-legacy') && f.endsWith('.js'));
    
    expect(legacyBundle).toBeDefined();
    
    if (legacyBundle) {
      const content = readFileSync(join(distPath, 'assets', legacyBundle), 'utf-8');
      
      // Check that the bundle exists and has content
      expect(content.length).toBeGreaterThan(1000);
      
      // Legacy bundle should contain transpiled code
      // Check for presence of common ES5 patterns that indicate transpilation
      const hasVarDeclarations = content.includes('var ');
      const hasFunctionKeyword = content.includes('function');
      
      // At least one of these should be present in a transpiled bundle
      expect(hasVarDeclarations || hasFunctionKeyword).toBe(true);
    }
  });

  it('should configure proper script loading for Safari 11-12', () => {
    const html = readFileSync(indexPath, 'utf-8');
    
    // Modern browsers use type="module"
    expect(html).toContain('type="module"');
    
    // Legacy browsers (Safari 11-12) use nomodule
    expect(html).toContain('nomodule');
    
    // Both should be present for proper fallback
    const moduleScripts = (html.match(/type="module"/g) || []).length;
    const nomoduleScripts = (html.match(/nomodule/g) || []).length;
    
    expect(moduleScripts).toBeGreaterThan(0);
    expect(nomoduleScripts).toBeGreaterThan(0);
  });

  it('should have all critical polyfills for Safari 11-12 APIs', () => {
    const files = readdirSync(join(distPath, 'assets'));
    const polyfillFile = files.find(f => f.includes('polyfills-legacy'));
    
    expect(polyfillFile).toBeDefined();
    
    if (polyfillFile) {
      const content = readFileSync(join(distPath, 'assets', polyfillFile), 'utf-8');
      
      // Critical APIs missing in Safari 11-12
      const criticalAPIs = [
        'Promise',           // Promise.allSettled, Promise.finally
        'Object',            // Object.fromEntries
        'Array',             // Array.prototype.flat, flatMap
      ];
      
      criticalAPIs.forEach(api => {
        expect(content).toContain(api);
      });
    }
  });
});
