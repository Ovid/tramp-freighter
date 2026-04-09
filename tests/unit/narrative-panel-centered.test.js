import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('NarrativeEventPanel uses .centered-panel', () => {
  it('NarrativeEventPanel.jsx should include centered-panel class', () => {
    const jsx = readFileSync(
      resolve('src/features/narrative/NarrativeEventPanel.jsx'), 'utf-8'
    );
    expect(jsx).toContain('centered-panel');
  });

  it('narrative-event.css should not duplicate center-positioning', () => {
    const css = readFileSync(resolve('css/panel/narrative-event.css'), 'utf-8');
    expect(css).not.toMatch(
      /#narrative-event-panel\s*\{[^}]*transform:\s*translate\(-50%,\s*-50%\)/s
    );
  });
});
