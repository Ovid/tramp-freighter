/**
 * Unit Tests for Save/Load Error Recovery Paths
 * Covers _forceSave error handling in SaveLoadManager.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('Save/Load Error Recovery', () => {
  let gsm;
  beforeEach(() => {
    localStorage.clear();
    gsm = createTestGame();
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
      gsm.saveLoadManager.capabilities.getFullState = () => null;

      gsm.saveLoadManager._forceSave();

      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });
});
