import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Narrative event panel mobile treatment', () => {
  const css = readFileSync(resolve('css/panel/narrative-event.css'), 'utf-8');

  it('should have a 600px mobile media query for #narrative-event-panel', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*#narrative-event-panel\s*\{/s
    );
  });

  it('should set position: fixed on mobile', () => {
    const mobileBlock = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#narrative-event-panel\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toContain('position: fixed');
  });

  it('should set width: 100% on mobile', () => {
    const mobileBlock = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#narrative-event-panel\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toContain('width: 100%');
  });
});
