import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const STATION_PANELS = [
  { file: 'refuel.css', selector: '#refuel-panel' },
  { file: 'trade.css', selector: '#trade-panel' },
  { file: 'repair.css', selector: '#repair-panel' },
  { file: 'finance.css', selector: '#finance-panel' },
  { file: 'ship-status.css', selector: '.ship-status-panel' },
  { file: 'info-broker.css', selector: '#info-broker-panel' },
  { file: 'mission-board.css', selector: '#mission-board-panel' },
  { file: 'system-info.css', selector: '.system-info-panel' },
  { file: 'jump-dialog.css', selector: '.jump-dialog' },
  { file: 'system-panel.css', selector: '.system-panel' },
];

describe('Station panels full-screen on mobile', () => {
  it.each(STATION_PANELS)(
    '$file should have position: fixed in 600px media query',
    ({ file }) => {
      const css = readFileSync(resolve('css/panel', file), 'utf-8');
      const mobileBlock = css.match(
        /@media\s*\(max-width:\s*600px\)\s*\{([^]*?)\n\}/g
      );
      expect(
        mobileBlock,
        `${file} should have a 600px media query`
      ).not.toBeNull();
      const combined = mobileBlock.join('\n');
      expect(combined).toContain('position: fixed');
    }
  );
});
