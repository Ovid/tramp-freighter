import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * The karma/reputation color classes (.neutral, .good, .bad, etc.) in
 * outcome.css must be scoped to the outcome panel so they do not leak
 * borders onto unrelated elements across the app.
 */
describe('Outcome CSS class scoping', () => {
  const css = readFileSync(resolve('css/panel/outcome.css'), 'utf-8');

  it('should not have an unscoped .neutral rule with a border', () => {
    // A bare ".neutral {" at the start of a line leaks globally.
    const bareNeutral = css.match(/^\.(neutral)\s*\{[^}]*border/m);
    expect(bareNeutral).toBeNull();
  });

  it('should not have an unscoped .good rule with a border', () => {
    const bareGood = css.match(/^\.(good)\s*\{[^}]*border/m);
    expect(bareGood).toBeNull();
  });

  it('should not have an unscoped .bad rule with a border', () => {
    const bareBad = css.match(/^\.(bad)\s*\{[^}]*border/m);
    expect(bareBad).toBeNull();
  });
});
