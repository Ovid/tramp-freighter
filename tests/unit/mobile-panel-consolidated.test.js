import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Consolidated mobile panel override', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  const EXPECTED_SELECTORS = [
    '#refuel-panel',
    '#trade-panel',
    '#repair-panel',
    '#finance-panel',
    '#info-broker-panel',
    '#mission-board-panel',
    '#narrative-event-panel',
    '#combat-panel',
    '#danger-warning-dialog',
    '#distress-call-panel',
    '#inspection-panel',
    '#mechanical-failure-panel',
    '#negotiation-panel',
    '#outcome-panel',
    '#pirate-encounter-panel',
    '.dialogue-panel',
    '.ship-status-panel',
    '.jump-dialog',
    '.system-panel',
  ];

  it('should contain all panel selectors in a 600px media query', () => {
    EXPECTED_SELECTORS.forEach((sel) => {
      const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(css).toMatch(new RegExp(escaped));
    });
  });

  it('should use --mobile-hud-height for panel top position', () => {
    expect(css).toContain('top: var(--mobile-hud-height');
  });

  it('should define --mobile-hud-height in mobile media query', () => {
    expect(css).toContain('--mobile-hud-height');
    expect(css).toContain('48px');
  });

  it('should set z-index to --z-panel-fullscreen so HUD bar stays above panels', () => {
    const consolidatedBlock = css.match(
      /Consolidated mobile full-screen override[^]*?@media\s*\(max-width:\s*600px\)\s*\{([^]*?)\n\}/s
    );
    expect(consolidatedBlock).not.toBeNull();
    expect(consolidatedBlock[1]).toContain(
      'z-index: var(--z-panel-fullscreen)'
    );
  });
});
