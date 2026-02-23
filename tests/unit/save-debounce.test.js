import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SaveLoadManager debounced save', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('markDirty should schedule a save after MARK_DIRTY_DEBOUNCE_MS', async () => {
    const { SaveLoadManager } =
      await import('../../src/game/state/managers/save-load.js');

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, '_forceSave');

    manager.markDirty();

    // Should not save immediately
    expect(saveSpy).not.toHaveBeenCalled();

    // Advance past debounce window
    vi.advanceTimersByTime(600);

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('markDirty should reset timer on repeated calls', async () => {
    const { SaveLoadManager } =
      await import('../../src/game/state/managers/save-load.js');

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, '_forceSave');

    manager.markDirty();
    vi.advanceTimersByTime(300);
    manager.markDirty(); // Reset timer
    vi.advanceTimersByTime(300);

    // Should not have saved yet (timer was reset)
    expect(saveSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    // Now it should have saved
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('flushSave should save immediately if dirty', async () => {
    const { SaveLoadManager } =
      await import('../../src/game/state/managers/save-load.js');

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, '_forceSave');

    manager.markDirty();
    manager.flushSave();

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('flushSave should be a no-op if not dirty', async () => {
    const { SaveLoadManager } =
      await import('../../src/game/state/managers/save-load.js');

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, '_forceSave');

    manager.flushSave();

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
