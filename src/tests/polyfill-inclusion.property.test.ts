import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as fc from 'fast-check';

/**
 * Property test for polyfill inclusion
 * Property 2: Polyfill Inclusion for Modern APIs
 * Validates: Requirements 1.2, 2.3
 * 
 * For any modern JavaScript API used in the source code (ES2016+),
 * the legacy bundle SHALL include a corresponding polyfill implementation.
 */
describe('Property 2: Polyfill Inclusion for Modern APIs', () => {
  const distPath = join(process.cwd(), 'dist');
  const assetsPath = join(distPath, 'assets');
  const srcPath = join(process.cwd(), 'src');
  const viteConfigPath = join(process.cwd(), 'vite.config.ts');

  /**
   * Mapping of modern APIs to their core-js polyfill names
   */
  const apiToPolyfillMap: Record<string, string> = {
    'Promise.allSettled': 'es.promise.all-settled',
    'Promise.finally': 'es.promise.finally',
    'queueMicrotask': 'web.queue-microtask',
    'Object.fromEntries': 'es.object.from-entries',
    'Object.entries': 'es.object.entries',
    'Object.values': 'es.object.values',
    'Array.prototype.flat': 'es.array.flat',
    'Array.prototype.flatMap': 'es.array.flat-map',
    'Array.prototype.includes': 'es.array.includes',
    'Array.prototype.find': 'es.array.find',
    'String.prototype.includes': 'es.string.includes',
    'String.prototype.startsWith': 'es.string.starts-with',
    'String.prototype.endsWith': 'es.string.ends-with'
  };

  /**
   * Helper function to get Vite configuration polyfills
   */
  function getViteConfigPolyfills(): string[] {
    if (!existsSync(viteConfigPath)) {
      throw new Error('vite.config.ts not found');
    }
    
    const configContent = readFileSync(viteConfigPath, 'utf-8');
    
    // Extract polyfills array from legacy plugin configuration
    const polyfillsMatch = configContent.match(/polyfills:\s*\[([\s\S]*?)\]/);
    if (!polyfillsMatch) {
      return [];
    }
    
    // Extract individual polyfill strings
    const polyfillsSection = polyfillsMatch[1];
    const polyfillMatches = polyfillsSection.match(/'([^']+)'/g);
    
    if (!polyfillMatches) {
      return [];
    }
    
    return polyfillMatches.map(match => match.replace(/'/g, ''));
  }

  /**
   * Helper function to scan source code for modern API usage
   */
  function scanSourceForModernAPIs(dirPath: string, apis: string[]): Set<string> {
    const foundAPIs = new Set<string>();
    
    try {
      const files = readdirSync(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = join(dirPath, file.name);
        
        if (file.isDirectory() && file.name !== 'node_modules' && file.name !== 'dist') {
          const nestedAPIs = scanSourceForModernAPIs(fullPath, apis);
          nestedAPIs.forEach(api => foundAPIs.add(api));
        } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js'))) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            
            for (const api of apis) {
              if (content.includes(api)) {
                foundAPIs.add(api);
              }
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    } catch (err) {
      // Directory doesn't exist or can't be read
    }
    
    return foundAPIs;
  }

  /**
   * Helper function to verify legacy bundle exists
   */
  function verifyLegacyBundleExists(): boolean {
    if (!existsSync(assetsPath)) {
      return false;
    }
    
    const files = readdirSync(assetsPath);
    return files.some(f => f.includes('polyfills-legacy') || (f.includes('polyfills') && f.endsWith('.js')));
  }

  it('should include polyfills for all modern APIs used in source code', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'Promise.allSettled',
          'Promise.finally',
          'queueMicrotask',
          'Object.fromEntries',
          'Object.entries',
          'Object.values',
          'Array.prototype.flat',
          'Array.prototype.flatMap',
          'Array.prototype.includes',
          'Array.prototype.find',
          'String.prototype.includes',
          'String.prototype.startsWith',
          'String.prototype.endsWith'
        ),
        (modernAPI) => {
          // Get the configured polyfills from Vite config
          const configuredPolyfills = getViteConfigPolyfills();
          
          // Get the expected polyfill name for this API
          const expectedPolyfill = apiToPolyfillMap[modernAPI];
          
          // Verify the polyfill is configured
          const hasPolyfill = configuredPolyfills.includes(expectedPolyfill);
          
          expect(hasPolyfill).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scan source code and verify polyfills for found modern APIs', () => {
    const modernAPIs = [
      'Promise.allSettled',
      'Promise.finally',
      'queueMicrotask',
      'Object.fromEntries',
      'Object.entries',
      'Object.values',
      'Array.prototype.flat',
      'Array.prototype.flatMap',
      'Array.prototype.includes',
      'Array.prototype.find',
      'String.prototype.includes',
      'String.prototype.startsWith',
      'String.prototype.endsWith'
    ];
    
    // Scan source code for modern API usage
    const foundAPIs = scanSourceForModernAPIs(srcPath, modernAPIs);
    
    // Get configured polyfills
    const configuredPolyfills = getViteConfigPolyfills();
    
    // For each found API, verify polyfill is configured
    foundAPIs.forEach(api => {
      const expectedPolyfill = apiToPolyfillMap[api];
      
      const hasPolyfill = configuredPolyfills.includes(expectedPolyfill);
      
      expect(hasPolyfill).toBe(true);
    });
  });

  it('should include core ES2015+ polyfills regardless of usage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'es.promise',
          'es.object.assign',
          'es.symbol'
        ),
        (corePolyfill) => {
          const configuredPolyfills = getViteConfigPolyfills();
          
          // These core polyfills should always be configured for Safari 11-12
          const hasPolyfill = configuredPolyfills.includes(corePolyfill);
          
          expect(hasPolyfill).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify queueMicrotask polyfill specifically (critical for Safari 11)', () => {
    const configuredPolyfills = getViteConfigPolyfills();
    
    // queueMicrotask is critical for Safari 11-12 compatibility
    expect(configuredPolyfills).toContain('web.queue-microtask');
  });

  it('should verify Promise.allSettled polyfill specifically (not in Safari < 13)', () => {
    const configuredPolyfills = getViteConfigPolyfills();
    
    // Promise.allSettled is not available in Safari < 13
    expect(configuredPolyfills).toContain('es.promise.all-settled');
  });

  it('should verify legacy bundle is generated', () => {
    // Verify that the build process generates a legacy bundle
    expect(verifyLegacyBundleExists()).toBe(true);
  });
});
