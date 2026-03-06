import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVENT_NAMES, UI_CONFIG } from '../../src/game/constants.js';

describe('SaveLoadManager emits SAVE_FAILED on save failure', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('emits SAVE_FAILED when _forceSave catches a localStorage error', async () => {
    const { SaveLoadManager } =
      await import('../../src/game/state/managers/save-load.js');

    const emitSpy = vi.fn();
    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
      emit: emitSpy,
    };
    const manager = new SaveLoadManager(mockGSM);

    // Suppress expected console.error from the error() call
    vi.spyOn(console, 'error').mockImplementation(() => {});

    manager.markDirty();
    vi.advanceTimersByTime(UI_CONFIG.MARK_DIRTY_DEBOUNCE_MS + 100);

    expect(emitSpy).toHaveBeenCalledWith(
      EVENT_NAMES.SAVE_FAILED,
      expect.objectContaining({ message: expect.any(String) })
    );
  });
});
