import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Mission accept button disabled styling', () => {
  const css = readFileSync(resolve('css/panel/mission-board.css'), 'utf-8');

  it('should define .accept-btn:disabled with visual distinction', () => {
    expect(css).toMatch(/\.accept-btn:disabled\s*\{/);
  });

  it('should use cursor: not-allowed when disabled', () => {
    const disabledBlock = css.match(/\.accept-btn:disabled\s*\{([^}]*)\}/s);
    expect(disabledBlock).not.toBeNull();
    expect(disabledBlock[1]).toContain('cursor: not-allowed');
  });

  it('should reduce opacity when disabled', () => {
    const disabledBlock = css.match(/\.accept-btn:disabled\s*\{([^}]*)\}/s);
    expect(disabledBlock).not.toBeNull();
    expect(disabledBlock[1]).toContain('opacity');
  });

  it('should not apply hover effect when disabled', () => {
    expect(css).toMatch(/\.accept-btn:hover:not\(:disabled\)/);
  });
});
