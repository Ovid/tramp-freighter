import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Station header background', () => {
  it('must use a fully opaque background so content does not bleed through when sticky', () => {
    const css = fs.readFileSync(path.resolve('css/hud.css'), 'utf-8');

    // Extract the .station-header rule block
    const headerMatch = css.match(/\.station-header\s*\{([^}]+)\}/);
    expect(headerMatch).not.toBeNull();

    const headerBlock = headerMatch[1];

    // The background must NOT use rgba with alpha < 1
    // It should use an opaque color (rgb, hex, or rgba with alpha = 1)
    const rgbaMatch = headerBlock.match(
      /background(?:-color)?:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/
    );

    if (rgbaMatch) {
      const alpha = parseFloat(rgbaMatch[4]);
      expect(alpha).toBe(1);
    }
    // If no rgba, it's opaque (hex, rgb, etc.) — that's fine
  });
});
