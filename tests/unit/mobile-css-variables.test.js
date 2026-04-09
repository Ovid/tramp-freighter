import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS variable extraction for mobile', () => {
  it('HUD width should use var(--hud-width, 300px)', () => {
    const css = readFileSync(resolve('css/hud.css'), 'utf-8');
    expect(css).toMatch(/#game-hud\s*\{[^}]*width:\s*var\(--hud-width,\s*300px\)/s);
  });

  it('station interface width should use var(--station-width, 400px)', () => {
    const css = readFileSync(resolve('css/hud.css'), 'utf-8');
    expect(css).toMatch(/#station-interface\s*\{[^}]*width:\s*var\(--station-width,\s*400px\)/s);
  });

  it('modal dialog should use variable for min-width', () => {
    const css = readFileSync(resolve('css/modals.css'), 'utf-8');
    expect(css).toMatch(/\.modal-dialog\s*\{[^}]*min-width:\s*var\(--modal-min-width,\s*400px\)/s);
  });

  it('modal dialog should use variable for max-width', () => {
    const css = readFileSync(resolve('css/modals.css'), 'utf-8');
    expect(css).toMatch(/\.modal-dialog\s*\{[^}]*max-width:\s*var\(--modal-max-width,\s*500px\)/s);
  });

  it('mobile media query should override variables for mobile', () => {
    const css = readFileSync(resolve('css/variables.css'), 'utf-8');
    expect(css).toContain('--hud-width: 100%');
    expect(css).toContain('--station-width: 100%');
    expect(css).toContain('--modal-min-width: 0');
    expect(css).toContain('--modal-max-width: 100%');
  });
});
