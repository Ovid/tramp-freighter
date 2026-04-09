import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile HUD CSS', () => {
  const css = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should define .mobile-hud-bar styles', () => {
    expect(css).toMatch(/\.mobile-hud-bar\s*\{/);
  });

  it('should define .mobile-hud-expanded styles', () => {
    expect(css).toMatch(/\.mobile-hud-expanded\s*\{/);
  });

  it('should define .mobile-hud-backdrop styles', () => {
    expect(css).toMatch(/\.mobile-hud-backdrop\s*\{/);
  });

  it('should use z-index variables for mobile HUD layers', () => {
    expect(css).toContain('var(--z-hud-collapsed)');
    expect(css).toContain('var(--z-hud-expanded)');
  });

  it('should define severity color classes', () => {
    expect(css).toMatch(/\.mobile-hud-indicator\.critical/);
    expect(css).toMatch(/\.mobile-hud-indicator\.warning/);
    expect(css).toMatch(/\.mobile-hud-indicator\.ok/);
  });
});
