import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Unit test for bundle generation
 * Verifies that both modern and legacy bundles are generated correctly
 * Requirements: 3.3
 */
describe('Bundle Generation', () => {
  const distPath = join(process.cwd(), 'dist');
  const assetsPath = join(distPath, 'assets');

  it('should have dist folder created', () => {
    expect(existsSync(distPath)).toBe(true);
  });

  it('should have assets folder in dist', () => {
    expect(existsSync(assetsPath)).toBe(true);
  });

  it('should contain both modern and legacy bundles', () => {
    const files = readdirSync(assetsPath);
    
    // Check for legacy bundle
    const legacyBundle = files.find(f => f.includes('index-legacy') && f.endsWith('.js'));
    expect(legacyBundle).toBeDefined();
    
    // Check for modern bundle
    const modernBundle = files.find(f => f.includes('index-') && !f.includes('legacy') && f.endsWith('.js'));
    expect(modernBundle).toBeDefined();
  });

  it('should contain polyfill files', () => {
    const files = readdirSync(assetsPath);
    
    // Check for polyfills file
    const polyfillFile = files.find(f => f.includes('polyfills') && f.endsWith('.js'));
    expect(polyfillFile).toBeDefined();
  });

  it('should have legacy bundle larger than modern bundle', () => {
    const files = readdirSync(assetsPath);
    
    const legacyBundle = files.find(f => f.includes('index-legacy') && f.endsWith('.js'));
    const modernBundle = files.find(f => f.includes('index-') && !f.includes('legacy') && f.endsWith('.js'));
    
    if (legacyBundle && modernBundle) {
      const legacySize = statSync(join(assetsPath, legacyBundle)).size;
      const modernSize = statSync(join(assetsPath, modernBundle)).size;
      
      // Legacy bundle should be larger due to transpilation and polyfills
      expect(legacySize).toBeGreaterThan(modernSize);
    } else {
      throw new Error('Both legacy and modern bundles must exist');
    }
  });

  it('should have index.html in dist folder', () => {
    const indexPath = join(distPath, 'index.html');
    expect(existsSync(indexPath)).toBe(true);
  });

  it('should have multiple JavaScript bundles for code splitting', () => {
    const files = readdirSync(assetsPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    // Should have at least: index, polyfills, and some chunks
    expect(jsFiles.length).toBeGreaterThan(2);
  });
});
