import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile camera toolbar CSS', () => {
  // Find the CSS file containing toolbar styles
  const possiblePaths = ['css/panel/camera-controls.css', 'css/camera-controls.css', 'css/hud.css'];
  const cssPath = possiblePaths.find((p) => {
    try {
      return readFileSync(resolve(p), 'utf-8').includes('.mobile-camera-toolbar');
    } catch { return false; }
  });

  it('should define .mobile-camera-toolbar', () => {
    expect(cssPath).toBeDefined();
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toMatch(/\.mobile-camera-toolbar\s*\{/);
  });

  it('should use z-index variable for toolbar', () => {
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toContain('var(--z-camera-toolbar)');
  });

  it('should use safe-bottom for toolbar padding', () => {
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toContain('--safe-bottom');
  });

  it('should define 44px minimum touch targets for buttons', () => {
    const css = readFileSync(resolve(cssPath), 'utf-8');
    expect(css).toMatch(/\.mobile-toolbar-btn\s*\{[^}]*min-width:\s*44px/s);
    expect(css).toMatch(/\.mobile-toolbar-btn\s*\{[^}]*min-height:\s*44px/s);
  });
});
