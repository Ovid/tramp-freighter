/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { prefersReducedMotion } from '../../src/game/utils/reduced-motion.js';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when OS prefers reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when OS does not prefer reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false when matchMedia is not available', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => {
      throw new Error('not available');
    });
    expect(prefersReducedMotion()).toBe(false);
  });
});
