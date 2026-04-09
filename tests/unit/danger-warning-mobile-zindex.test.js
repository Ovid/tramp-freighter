import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Danger warning dialog mobile z-index', () => {
  it('must have a higher z-index than panel-fullscreen on mobile so it renders above the system panel', () => {
    const variables = fs.readFileSync(
      path.resolve('css/variables.css'),
      'utf-8'
    );

    // The consolidated mobile fullscreen selector should NOT include #danger-warning-dialog
    // because it sets z-index to --z-panel-fullscreen, which is the same as .system-panel,
    // causing the dialog to be hidden behind the system panel
    const mobileBlock = variables.match(
      /@media\s*\(max-width:\s*600px\)\s*\{([\s\S]*?)\n\}/g
    );
    expect(mobileBlock).not.toBeNull();

    // Check that no mobile media query sets #danger-warning-dialog to z-panel-fullscreen
    for (const block of mobileBlock) {
      if (
        block.includes('#danger-warning-dialog') &&
        block.includes('z-panel-fullscreen')
      ) {
        // If danger-warning-dialog is in a block with z-panel-fullscreen,
        // make sure it's NOT in the same rule that sets z-index to z-panel-fullscreen
        const rules = block.match(
          /([^{}]+)\{([^}]+z-index:\s*var\(--z-panel-fullscreen\)[^}]*)\}/g
        );
        if (rules) {
          for (const rule of rules) {
            expect(rule).not.toContain('#danger-warning-dialog');
          }
        }
      }
    }
  });
});
