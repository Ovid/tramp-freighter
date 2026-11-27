import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Issue #52: `.moral-choice.available:hover` out-specifies `.moral-choice.selected`,
 * so the green selected border is hidden while the cursor is still over the option.
 */
describe('Distress call choice selected state under hover', () => {
  const css = readFileSync(resolve('css/panel/distress-call.css'), 'utf-8');

  it('hover rule must not apply to the selected choice', () => {
    const hoverRule = css.match(/^[^{}]*\.moral-choice[^{}]*:hover[^{}]*\{/m);
    expect(hoverRule).not.toBeNull();
    expect(hoverRule[0]).toContain(':not(.selected)');
  });
});
