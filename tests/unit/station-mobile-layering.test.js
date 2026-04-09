import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Station menu mobile layering', () => {
  const hudCss = readFileSync(resolve('css/hud.css'), 'utf-8');

  it('should set station interface z-index below sub-panels on mobile', () => {
    const mobileBlock = hudCss.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#station-interface\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toMatch(/z-index/);
  });

  it('should use an opaque background for station interface on mobile', () => {
    const mobileBlock = hudCss.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#station-interface\s*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toMatch(/background-color/);
  });
});

describe('Sub-panel mobile layering', () => {
  const varsCss = readFileSync(resolve('css/variables.css'), 'utf-8');

  it('should use an opaque background for sub-panels on mobile', () => {
    // The consolidated mobile panel override in variables.css
    const mobileBlock = varsCss.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[^}]*#trade-panel[^{]*\{([^}]*)\}/s
    );
    expect(mobileBlock).not.toBeNull();
    expect(mobileBlock[1]).toMatch(/background-color/);
  });
});
