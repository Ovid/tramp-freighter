import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve('css/panel/system-panel.css'), 'utf-8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[2] : '';
}

describe('System panel CSS accessibility', () => {
  it('close button is a 44px target on every screen size', () => {
    const close = rule('.system-panel .close-btn');
    expect(close).toMatch(/min-width:\s*44px/);
    expect(close).toMatch(/min-height:\s*44px/);
  });

  it('connection button border is at least 3:1 against the panel at rest', () => {
    // rgba(0,255,136,a) over near-black reaches 3:1 at about a = 0.45
    const alpha = Number(
      rule('.connection-item').match(
        /border:\s*1px solid rgba\(0, 255, 136, ([\d.]+)\)/
      )?.[1]
    );
    expect(alpha).toBeGreaterThanOrEqual(0.6);
  });

  it('focus scrolling clears the sticky header', () => {
    expect(rule('.system-panel')).toMatch(/scroll-padding-top:/);
  });
});
