import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Title screen mobile styles', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should have a mobile media query for .menu-content', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*\.menu-content\s*\{[^}]*min-width:\s*0/s
    );
  });

  it('should reduce .menu-title font-size on mobile', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*\.menu-title\s*\{[^}]*font-size:\s*24px/s
    );
  });
});
