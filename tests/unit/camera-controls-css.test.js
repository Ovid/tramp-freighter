import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Camera controls must use the game's mono font, and sit above the HUD panel.
 */
describe('Camera controls CSS', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should use mono font-family on control buttons', () => {
    // .control-btn must declare font-family
    const controlBtnBlock = css.match(
      /\.control-btn\s*\{[^}]*\}/s
    )?.[0];
    expect(controlBtnBlock).toBeDefined();
    expect(controlBtnBlock).toMatch(/font-family/);
  });

  it('should use mono font-family on camera toggle button', () => {
    const toggleBlock = css.match(
      /\.camera-controls-toggle\s*\{[^}]*\}/s
    )?.[0];
    expect(toggleBlock).toBeDefined();
    expect(toggleBlock).toMatch(/font-family/);
  });

  it('should have camera controls z-index above the HUD', () => {
    // #camera-controls z-index must be higher than --z-hud (200)
    const cameraBlock = css.match(
      /#camera-controls\s*\{[^}]*\}/s
    )?.[0];
    expect(cameraBlock).toBeDefined();
    const zMatch = cameraBlock.match(/z-index:\s*(\d+)/);
    expect(zMatch).not.toBeNull();
    expect(Number(zMatch[1])).toBeGreaterThan(200);
  });
});
