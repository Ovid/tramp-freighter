import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * HUD scrollbar validation.
 *
 * When the player accepts many missions, the HUD panel can overflow
 * the viewport. The panel must constrain its height and show a scrollbar.
 */
describe('HUD scrollbar', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should constrain #game-hud height to the viewport', () => {
    expect(css).toMatch(/#game-hud\s*\{[^}]*max-height/);
  });

  it('should enable vertical scrolling on #game-hud', () => {
    expect(css).toMatch(/#game-hud\s*\{[^}]*overflow-y:\s*auto/);
  });

  it('should style the scrollbar to match the game theme', () => {
    expect(css).toMatch(/#game-hud::-webkit-scrollbar\b/);
    expect(css).toMatch(/#game-hud::-webkit-scrollbar-thumb\b/);
  });
});
