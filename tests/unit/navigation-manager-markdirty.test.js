import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('NavigationManager markDirty contract', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updateLocation calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.navigationManager.updateLocation(1);
    expect(spy).toHaveBeenCalled();
  });
});
