import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Station menu mobile styles', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should have a 600px media query for #station-interface', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*#station-interface\s*\{/s
    );
  });

  it('should make station interface fixed full-screen on mobile', () => {
    const mobileBlock = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#station-interface\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toContain('position: fixed');
    expect(mobileBlock[1]).toContain('width: 100%');
    expect(mobileBlock[1]).toContain('height: 100%');
  });
});
