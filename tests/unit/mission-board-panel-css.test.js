import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Mission Board panel CSS validation.
 *
 * The Mission Board panel must have a CSS file with proper positioning
 * so it is visible when opened from the station menu.
 */
describe('Mission Board panel CSS', () => {
  it('should have a dedicated CSS file', () => {
    const cssPath = resolve('css/panel/mission-board.css');
    expect(existsSync(cssPath)).toBe(true);
  });

  it('should have position and z-index for visibility', () => {
    const css = readFileSync(resolve('css/panel/mission-board.css'), 'utf-8');
    expect(css).toMatch(/position:\s*(absolute|fixed)/);
    expect(css).toMatch(/z-index/);
  });
});
