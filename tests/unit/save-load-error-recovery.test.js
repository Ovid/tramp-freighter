/**
 * Unit Tests for Save/Load Error Recovery Paths
 * Covers _forceSave error handling, handleLoadError routing,
 * and attemptNPCRecovery in SaveLoadManager.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Save/Load Error Recovery', () => {
  let gsm;
  beforeEach(() => {
    localStorage.clear();
    gsm = createTestGameStateManager();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('_forceSave error path', () => {
    it('does not throw when localStorage.setItem fails', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => gsm.saveLoadManager._forceSave()).not.toThrow();
    });

    it('does nothing when state is null', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      vi.spyOn(gsm.saveLoadManager, 'getState').mockReturnValue(null);

      gsm.saveLoadManager._forceSave();

      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleLoadError', () => {
    it('returns null for non-NPC errors', () => {
      const error = new Error('Something went wrong');
      const result = gsm.saveLoadManager.handleLoadError(error);

      expect(result).toBeNull();
    });

    it('calls attemptNPCRecovery when error message includes NPC', () => {
      const recoverySpy = vi
        .spyOn(gsm.saveLoadManager, 'attemptNPCRecovery')
        .mockReturnValue({ recovered: true });

      const error = new Error('Invalid NPC data found');
      const result = gsm.saveLoadManager.handleLoadError(error);

      expect(recoverySpy).toHaveBeenCalled();
      expect(result).toEqual({ recovered: true });
    });
  });

  describe('attemptNPCRecovery', () => {
    it('clears NPC and dialogue state then restores successfully', () => {
      // Save current valid game state to localStorage first
      gsm.saveLoadManager._forceSave();

      const restoreSpy = vi.spyOn(gsm, 'restoreState');

      const result = gsm.saveLoadManager.attemptNPCRecovery();

      // Should return non-null on successful recovery
      expect(result).not.toBeNull();

      expect(restoreSpy).toHaveBeenCalledTimes(1);
      const restoredArg = restoreSpy.mock.calls[0][0];
      expect(restoredArg.npcs).toEqual({});
      expect(restoredArg.dialogue).toEqual({
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      });
    });

    it('returns null when no saved state exists', () => {
      // localStorage is already clear from beforeEach
      const result = gsm.saveLoadManager.attemptNPCRecovery();

      expect(result).toBeNull();
    });

    it('returns null when recovery itself throws', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage read error');
      });

      const result = gsm.saveLoadManager.attemptNPCRecovery();

      expect(result).toBeNull();
    });
  });
});
