import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('DangerManager markDirty contract', () => {
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

  it('setKarma calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.setKarma(50);
    expect(spy).toHaveBeenCalled();
  });

  it('modifyKarma calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.modifyKarma(5, 'test');
    expect(spy).toHaveBeenCalled();
  });

  it('setFactionRep calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.setFactionRep('traders', 50);
    expect(spy).toHaveBeenCalled();
  });

  it('modifyFactionRep calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.modifyFactionRep('traders', 10, 'test');
    expect(spy).toHaveBeenCalled();
  });
});
