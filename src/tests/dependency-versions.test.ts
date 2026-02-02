import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Unit tests for verifying required dependency versions
 * Requirements: 3.2
 */
describe('Dependency Versions', () => {
  const packageJsonPath = join(__dirname, '../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  it('should have core-js version >= 3.35.0', () => {
    const coreJsVersion = packageJson.dependencies['core-js'];
    expect(coreJsVersion).toBeDefined();
    
    // Extract version number (remove ^ or ~ prefix)
    const versionNumber = coreJsVersion.replace(/^[\^~]/, '');
    const [major, minor] = versionNumber.split('.').map(Number);
    
    expect(major).toBeGreaterThanOrEqual(3);
    if (major === 3) {
      expect(minor).toBeGreaterThanOrEqual(35);
    }
  });

  it('should have @vitejs/plugin-legacy installed', () => {
    const legacyPlugin = packageJson.devDependencies['@vitejs/plugin-legacy'];
    expect(legacyPlugin).toBeDefined();
    expect(legacyPlugin).toMatch(/^\^?\d+\.\d+\.\d+/);
  });

  it('should have terser installed', () => {
    const terser = packageJson.devDependencies['terser'];
    expect(terser).toBeDefined();
    expect(terser).toMatch(/^\^?\d+\.\d+\.\d+/);
  });

  it('should have all required dependencies for Safari 11-12 compatibility', () => {
    // Verify all critical dependencies are present
    expect(packageJson.dependencies['core-js']).toBeDefined();
    expect(packageJson.devDependencies['@vitejs/plugin-legacy']).toBeDefined();
    expect(packageJson.devDependencies['terser']).toBeDefined();
  });
});
