import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Encounter panels mobile override consolidated in variables.css', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  const ENCOUNTER_SELECTORS = [
    '#combat-panel',
    '#danger-warning-dialog',
    '#distress-call-panel',
    '#inspection-panel',
    '#mechanical-failure-panel',
    '#negotiation-panel',
    '#outcome-panel',
    '#pirate-encounter-panel',
    '.dialogue-panel',
  ];

  it.each(ENCOUNTER_SELECTORS)(
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
