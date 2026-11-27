import { describe, it, expect, afterEach, vi } from 'vitest';
import { getPortraitUrl } from '../../src/features/portraits/portrait-url.js';

describe('getPortraitUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes the deploy base path', () => {
    vi.stubEnv('BASE_URL', '/tramp/');
    expect(getPortraitUrl('npc', 'cole_sol')).toBe(
      '/tramp/portraits/npc/cole_sol.webp'
    );
  });
});
