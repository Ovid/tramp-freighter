import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Station panels mobile override consolidated in variables.css', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  const STATION_SELECTORS = [
    '#refuel-panel',
    '#trade-panel',
    '#repair-panel',
    '#finance-panel',
    '#info-broker-panel',
    '#mission-board-panel',
    '.ship-status-panel',
    '.jump-dialog',
    '.system-panel',
  ];

  it.each(STATION_SELECTORS)(
    '%s should be in the consolidated mobile override in variables.css',
    (sel) => {
      const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(css).toMatch(new RegExp(escaped));
    }
  );

  it('should use --mobile-hud-height for top position', () => {
    expect(css).toContain('top: var(--mobile-hud-height');
  });
});
