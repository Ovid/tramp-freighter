import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('End credits cast row alignment', () => {
  it('centres cast rows so text sits beside the portrait thumbnail', () => {
    // Baseline alignment lines text up with an <img>'s bottom edge, so the
    // name and role hung off the bottom of the 48px thumbnail
    const css = fs.readFileSync(
      path.resolve('src/features/endgame/endgame.css'),
      'utf-8'
    );

    const rule = css.match(/\.credits-cast-row\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule[1]).toMatch(/align-items:\s*center/);
  });
});
