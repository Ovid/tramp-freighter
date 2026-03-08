import { BaseManager } from './base-manager.js';
import { UI_CONFIG, SAVE_KEY, EVENT_NAMES } from '../../constants.js';
import {
  saveGame as saveGameToStorage,
  loadGame as loadGameFromStorage,
  hasSavedGame as checkSavedGame,
  clearSave as clearSaveFromStorage,
} from '../save-load.js';

/**
 * SaveLoadManager - Handles game state persistence and loading
 *
 * Responsibilities:
 * - Save game state to localStorage with debouncing
 * - Load game state from localStorage with validation
 * - Handle save/load errors gracefully
 * - Support version migration
 * - Manage save debouncing to prevent performance issues
 */
export class SaveLoadManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);

    // Track last save time for debouncing
    this.lastSaveTime = 0;
    this._dirtyTimer = null;
    this._isDirty = false;
  }

  /**
   * Mark state as dirty and schedule a debounced save.
   * Resets the timer on each call — saves 500ms after the last mutation.
   */
  markDirty() {
    this._isDirty = true;

    if (this._dirtyTimer) {
      clearTimeout(this._dirtyTimer);
    }

    this._dirtyTimer = setTimeout(() => {
      this._dirtyTimer = null;
      this._isDirty = false;
      this._forceSave();
    }, UI_CONFIG.MARK_DIRTY_DEBOUNCE_MS);
  }

  /**
   * Immediately save if dirty. Used for browser unload.
   * Cancels any pending debounced save.
   */
  flushSave() {
    if (!this._isDirty) return;

    if (this._dirtyTimer) {
      clearTimeout(this._dirtyTimer);
      this._dirtyTimer = null;
    }

    this._isDirty = false;
    this._forceSave();
  }

  /**
   * Save immediately, bypassing the passive debounce in saveGameToStorage.
   * Only called from markDirty/flushSave which already handle debouncing.
   * @private
   */
  _forceSave() {
    if (!this.capabilities.getFullState()) {
      return;
    }

    try {
      const now = Date.now();
      const stateToSave = {
        ...this.capabilities.getFullState(),
        meta: {
          ...this.capabilities.getFullState().meta,
          timestamp: now,
        },
      };
      const saveData = JSON.stringify(stateToSave);
      localStorage.setItem(SAVE_KEY, saveData);
      this.lastSaveTime = now;
    } catch (error) {
      this.error('Save failed — game progress may be lost', error);
      this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, {
        message: 'Save failed — game progress may be lost',
      });
    }
  }

  /**
   * Save game state to localStorage with debouncing
   *
   * Implements save debouncing to prevent excessive saves (max 1 save per second).
   * This protects against rapid state changes causing performance issues.
   *
   * Handles save failures gracefully by logging errors and notifying the user.
   *
   * @returns {boolean} True if save succeeded or was debounced, false if failed
   */
  saveGame() {
    const result = saveGameToStorage(
      this.capabilities.getFullState(),
      this.lastSaveTime
    );

    if (result.success) {
      this.lastSaveTime = result.newLastSaveTime;
    } else {
      // Only show error notification if save actually failed (not just debounced)
      const now = Date.now();
      const timeSinceLastSave = now - this.lastSaveTime;

      if (timeSinceLastSave >= UI_CONFIG.SAVE_DEBOUNCE_MS) {
        this.error('Save failed — game progress may be lost');
        this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, {
          message: 'Save failed — game progress may be lost',
        });
      }
    }

    return result.success;
  }

  /**
   * Load game state from localStorage
   *
   * Delegates to GameStateManager.restoreState() for version checking,
   * migrations, validation, defaults, state assignment, and event emission.
   *
   * @returns {Object|null} Loaded and validated game state, or null if load failed
   */
  loadGame() {
    try {
      const loadedState = loadGameFromStorage();

      if (!loadedState) {
        return null;
      }

      const result = this.capabilities.restoreState(loadedState);

      if (result.success) {
        return result.state;
      }

      this.log(result.reason);
      return null;
    } catch (error) {
      return this.handleLoadError(error);
    }
  }

  /**
   * Handle load errors with recovery mechanisms
   *
   * @param {Error} error - The error that occurred during loading
   * @returns {Object|null} Recovered state or null if recovery failed
   * @private
   */
  handleLoadError(error) {
    this.log('Failed to load game:', error);

    // If NPC data is corrupted, try to recover by initializing empty NPC state
    if (error.message && error.message.includes('NPC')) {
      this.log('NPC data corrupted, continuing with fresh NPC relationships');
      return this.attemptNPCRecovery();
    }

    return null;
  }

  /**
   * Attempt to recover from NPC data corruption
   *
   * @returns {Object|null} Recovered state or null if recovery failed
   * @private
   */
  attemptNPCRecovery() {
    try {
      let recoveredState = loadGameFromStorage();
      if (recoveredState) {
        recoveredState.npcs = {};
        if (recoveredState.dialogue) {
          recoveredState.dialogue = {
            currentNpcId: null,
            currentNodeId: null,
            isActive: false,
            display: null,
          };
        }

        const result = this.capabilities.restoreState(recoveredState);
        if (result.success) {
          return result.state;
        }
      }
    } catch {
      this.log('Recovery failed, starting new game');
    }

    return null;
  }

  /**
   * Check if saved game exists
   *
   * @returns {boolean} True if save data exists in localStorage
   */
  hasSavedGame() {
    return checkSavedGame();
  }

  /**
   * Clear saved game from localStorage
   *
   * @returns {boolean} True if clear succeeded
   */
  clearSave() {
    return clearSaveFromStorage();
  }

  /**
   * Get last save time for debouncing
   *
   * @returns {number} Timestamp of last save
   */
  getLastSaveTime() {
    return this.lastSaveTime;
  }

  /**
   * Set last save time (for testing purposes)
   *
   * @param {number} timestamp - New last save time
   */
  setLastSaveTime(timestamp) {
    this.lastSaveTime = timestamp;
  }
}
