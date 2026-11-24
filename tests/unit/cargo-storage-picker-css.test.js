import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// The picker disables its confirm and per-row buttons at their limits; without
// a visible disabled state they look clickable and the player can't tell why
// nothing happens.
describe('Cargo storage picker styling', () => {
  const modalsCss = readFileSync(resolve('css/modals.css'), 'utf-8');

  it('gives a disabled modal confirm button a distinct look', () => {
    expect(modalsCss).toMatch(/\.modal-confirm:disabled\s*{[^}]*opacity/);
  });

  it('styles the per-row buttons and their disabled state', () => {
    const pickerCss = readFileSync(
      resolve('css/panel/cargo-storage.css'),
      'utf-8'
    );
    expect(pickerCss).toMatch(/\.picker-controls button\s*{[^}]*border/);
    expect(pickerCss).toMatch(
      /\.picker-controls button:disabled\s*{[^}]*opacity/
    );
  });
});
