import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('.centered-panel utility class', () => {
  const css = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should define .centered-panel with absolute centering', () => {
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*top:\s*50%/s);
    expect(css).toMatch(/\.centered-panel\s*\{[^}]*left:\s*50%/s);
    expect(css).toMatch(
      /\.centered-panel\s*\{[^}]*transform:\s*translate\(-50%,\s*-50%\)/s
    );
  });

  it('should override to fixed full-screen at 600px breakpoint', () => {
    const mobileBlock = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*\.centered-panel\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    const rules = mobileBlock[1];
    expect(rules).toContain('position: fixed');
    expect(rules).toContain('width: 100%');
    expect(rules).toContain('height: 100%');
    expect(rules).toContain('transform: none');
  });
});
