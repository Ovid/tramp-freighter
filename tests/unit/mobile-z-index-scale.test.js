import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mobile z-index scale', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  const layers = [
    { name: '--z-camera-toolbar', expected: 10 },
    { name: '--z-panel-fullscreen', expected: 20 },
    { name: '--z-hud-collapsed', expected: 30 },
    { name: '--z-hud-expanded', expected: 40 },
  ];

  it.each(layers)(
    'should define $name with value $expected',
    ({ name, expected }) => {
      const regex = new RegExp(
        `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(\\d+)`
      );
      const match = css.match(regex);
      expect(match).not.toBeNull();
      expect(parseInt(match[1], 10)).toBe(expected);
    }
  );

  it('should maintain ascending z-index order', () => {
    const values = layers.map(({ name }) => {
      const regex = new RegExp(
        `${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(\\d+)`
      );
      const match = css.match(regex);
      expect(match, `${name} should be defined in variables.css`).not.toBeNull();
      return parseInt(match[1], 10);
    });
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('should keep --z-modal higher than all mobile layers', () => {
    const modalMatch = css.match(/--z-modal:\s*(\d+)/);
    expect(modalMatch, '--z-modal should be defined in variables.css').not.toBeNull();
    expect(parseInt(modalMatch[1], 10)).toBeGreaterThan(40);
  });
});
