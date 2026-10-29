// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { transformSync } from 'esbuild';

// Exercise the generated code: checking for a literal list in vite.config.ts
// misses usage-based polyfills and says nothing about what ships to Safari.
describe.each(['modern', 'legacy'])('%s Safari polyfill bundle', kind => {
  const assets = join(process.cwd(), 'dist/assets');
  const file = readdirSync(assets).find(name =>
    name.startsWith('polyfills-') && name.endsWith('.js')
    && name.includes('-legacy-') === (kind === 'legacy'))!;

  it('restores the APIs missing from the target Safari version', async () => {
    expect(file).toBeDefined();
    const context = createContext({ setTimeout, clearTimeout, console, DOMException, module: { exports: {} } });
    runInContext(`
      this.self = this;
      delete Promise.allSettled;
      delete Object.fromEntries;
      delete this.queueMicrotask;
    `, context);
    if (kind === 'legacy') {
      runInContext(`
        delete Promise.prototype.finally;
        delete Array.prototype.flat;
        delete Array.prototype.flatMap;
        delete this.globalThis;
      `, context);
    }
    // Convert only the module wrapper so it can execute in an isolated VM.
    // The exported Vite feature guard is intentionally never called here.
    const code = transformSync(readFileSync(join(assets, file), 'utf8'), {
      format: 'cjs', target: 'es2018', logLevel: 'silent',
    }).code;
    runInContext(code, context);

    expect(runInContext('typeof queueMicrotask', context)).toBe('function');
    expect(runInContext('Object.fromEntries([["course", "eyeliner-lips"]]).course', context)).toBe('eyeliner-lips');
    const settled = await runInContext(`Promise.allSettled([
      Promise.resolve('registered'), Promise.reject('offline')
    ]).then(results => JSON.stringify(results))`, context);
    expect(JSON.parse(settled)).toEqual([
      { status: 'fulfilled', value: 'registered' },
      { status: 'rejected', reason: 'offline' },
    ]);
    expect(await runInContext('new Promise(resolve => queueMicrotask(() => resolve("ready")))', context)).toBe('ready');
    if (kind === 'legacy') {
      expect(runInContext('JSON.stringify([1, [2]].flat())', context)).toBe('[1,2]');
      expect(runInContext('JSON.stringify([1, 2].flatMap(n => [n, n]))', context)).toBe('[1,1,2,2]');
      expect(runInContext('typeof Promise.prototype.finally', context)).toBe('function');
      expect(runInContext('typeof globalThis', context)).toBe('object');
    }
  });
});
