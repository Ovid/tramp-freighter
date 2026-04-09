import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ENCOUNTER_FILES = [
  'combat.css',
  'danger-warning.css',
  'dialogue.css',
  'distress-call.css',
  'inspection.css',
  'mechanical-failure.css',
  'negotiation.css',
  'outcome.css',
  'pirate-encounter.css',
];

const CANONICAL_BREAKPOINTS = [600, 900];

describe('Encounter panel breakpoint consistency', () => {
  it.each(ENCOUNTER_FILES)(
    '%s should only use canonical breakpoints (600px, 900px)',
    (file) => {
      const css = readFileSync(resolve('css/panel', file), 'utf-8');
      const breakpoints = [
        ...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g),
      ];
      breakpoints.forEach((match) => {
        const value = parseInt(match[1], 10);
        expect(
          CANONICAL_BREAKPOINTS,
          `${file} uses non-canonical breakpoint ${value}px`
        ).toContain(value);
      });
    }
  );
});
