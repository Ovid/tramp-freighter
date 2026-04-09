import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('.panel-base mobile treatment', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should have a 600px mobile media query for .panel-base', () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*600px\)[^]*\.panel-base\s*\{/s);
  });

  it('should set solid background on mobile .panel-base', () => {
    const mobileSection = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.panel-base\s*\{([^}]*)\}/s
    );
    expect(mobileSection).not.toBeNull();
    expect(mobileSection[1]).toContain('background-color');
  });

  it('should apply safe area top padding on mobile .panel-base', () => {
    const mobileSection = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.panel-base\s*\{([^}]*)\}/s
    );
    expect(mobileSection).not.toBeNull();
    expect(mobileSection[1]).toContain('--safe-top');
  });
});
