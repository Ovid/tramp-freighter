import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * CSS z-index hierarchy validation.
 *
 * The modal overlay must always have a higher z-index than the title screen,
 * otherwise the confirmation dialog (e.g. "Start new game?") renders behind
 * the title screen and is invisible to the player.
 */
describe('CSS z-index hierarchy', () => {
  it('modal overlay z-index should be higher than title screen z-index', () => {
    const variablesCss = readFileSync(resolve('css/variables.css'), 'utf-8');
    const hudCss = readFileSync(resolve('css/hud.css'), 'utf-8');

    const modalZMatch = variablesCss.match(/--z-modal:\s*(\d+)/);
    expect(modalZMatch).not.toBeNull();
    const modalZ = parseInt(modalZMatch[1], 10);

    const titleScreenMatch = hudCss.match(
      /\.title-screen\s*\{[^}]*z-index:\s*(\d+)/s
    );
    expect(titleScreenMatch).not.toBeNull();
    const titleScreenZ = parseInt(titleScreenMatch[1], 10);

    expect(modalZ).toBeGreaterThan(titleScreenZ);
  });
});
