import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Dialogue panel mobile open animation', () => {
  it('does not animate transform on mobile, where the panel is full screen', () => {
    // On mobile the panel is pinned at top-left with transform: none. A
    // keyframe transform overrides that while it runs, so the desktop
    // centring translate shoved the panel half off screen for 0.3s.
    const css = fs.readFileSync(
      path.resolve('css/panel/dialogue.css'),
      'utf-8'
    );

    const mobileRule = css.match(
      /@media\s*\(max-width:\s*600px\)\s*\{[\s\S]*?\.dialogue-panel\.visible\s*\{[^}]*animation-name:\s*([\w-]+)/
    );
    expect(mobileRule).not.toBeNull();

    const keyframes = css.match(
      new RegExp(`@keyframes\\s+${mobileRule[1]}\\s*\\{([\\s\\S]*?)\\n\\}`)
    );
    expect(keyframes).not.toBeNull();
    expect(keyframes[1]).not.toContain('transform');
  });
});
