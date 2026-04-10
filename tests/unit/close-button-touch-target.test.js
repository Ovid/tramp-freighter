import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Close button touch targets', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should have a mobile override for .close-btn with 44px minimum', () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*\.close-btn\s*\{[^}]*min-width:\s*44px/s
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*600px\)[^]*\.close-btn\s*\{[^}]*min-height:\s*44px/s
    );
  });
});
