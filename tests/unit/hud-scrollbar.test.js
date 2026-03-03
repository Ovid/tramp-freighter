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
  const hudCss = readFileSync(resolve('css/hud.css'), 'utf-8');
  const baseCss = readFileSync(resolve('css/base.css'), 'utf-8');

  it('should constrain #game-hud height to the viewport', () => {
    expect(hudCss).toMatch(/#game-hud\s*\{[^}]*max-height/);
  });

  it('should enable vertical scrolling on #game-hud', () => {
    expect(hudCss).toMatch(/#game-hud\s*\{[^}]*overflow-y:\s*auto/);
  });

  it('should style scrollbars globally to match the game theme', () => {
    expect(baseCss).toMatch(/::-webkit-scrollbar\s*\{/);
    expect(baseCss).toMatch(/::-webkit-scrollbar-thumb\s*\{/);
  });
});
