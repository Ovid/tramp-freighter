import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Buttons must not show the default browser blue focus ring.
 * Instead, focus should use the game's primary color for consistency.
 */
describe('Button focus ring styling', () => {
  const css = readFileSync(resolve('css/base.css'), 'utf-8');

  it('should override the default browser focus outline on buttons', () => {
    expect(css).toMatch(/button.*focus/s);
    expect(css).toMatch(/outline/);
  });
});
