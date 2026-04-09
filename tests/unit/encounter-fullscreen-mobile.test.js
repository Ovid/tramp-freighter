import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ENCOUNTER_PANELS = [
  { file: 'combat.css', selector: '.combat-panel' },
  { file: 'danger-warning.css', selector: '.danger-warning-dialog' },
  { file: 'dialogue.css', selector: '.dialogue-panel' },
  { file: 'distress-call.css', selector: '.distress-call-panel' },
  { file: 'inspection.css', selector: '.inspection-panel' },
  { file: 'mechanical-failure.css', selector: '.mechanical-failure-panel' },
  { file: 'negotiation.css', selector: '.negotiation-panel' },
  { file: 'outcome.css', selector: '.outcome-panel' },
  { file: 'pirate-encounter.css', selector: '.pirate-encounter-panel' },
];

describe('Encounter panels full-screen on mobile', () => {
  it.each(ENCOUNTER_PANELS)(
    '$file should have position: fixed in 600px media query',
    ({ file }) => {
      const css = readFileSync(resolve('css/panel', file), 'utf-8');
      const mobileBlock = css.match(
        /@media\s*\(max-width:\s*600px\)\s*\{([^]*?)\n\}/g
      );
      expect(mobileBlock).not.toBeNull();
      const combined = mobileBlock.join('\n');
      expect(combined).toContain('position: fixed');
    }
  );
});
