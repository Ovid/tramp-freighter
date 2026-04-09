import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Modal mobile styles', () => {
  const css = readFileSync(resolve('css/modals.css'), 'utf-8');

  it('should have a 600px mobile media query for .modal-dialog', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*\.modal-dialog\s*\{/s);
  });

  it('should reduce padding on mobile', () => {
    const mobileSection = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^]*\.modal-dialog\s*\{([^}]*)\}/s
    );
    expect(mobileSection).not.toBeNull();
    expect(mobileSection[1]).toContain('padding');
  });

  it('should set minimum touch target height for modal buttons', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*min-height:\s*44px/s);
  });
});
