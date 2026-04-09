import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Narrative event panel mobile override consolidated in variables.css', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should include #narrative-event-panel in consolidated mobile override', () => {
    expect(css).toContain('#narrative-event-panel');
  });

  it('should use --mobile-hud-height for top position', () => {
    expect(css).toContain('top: var(--mobile-hud-height');
  });
});
