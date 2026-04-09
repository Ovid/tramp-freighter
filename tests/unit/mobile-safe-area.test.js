import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile safe area setup', () => {
  it('index.html should include viewport-fit=cover', () => {
    const html = readFileSync(resolve('index.html'), 'utf-8');
    expect(html).toContain('viewport-fit=cover');
  });

  it('variables.css should define --safe-top and --safe-bottom in mobile media query', () => {
    const css = readFileSync(resolve('css/variables.css'), 'utf-8');
    expect(css).toContain('--safe-top');
    expect(css).toContain('--safe-bottom');
    expect(css).toContain('env(safe-area-inset-top)');
    expect(css).toContain('env(safe-area-inset-bottom)');
  });
});
