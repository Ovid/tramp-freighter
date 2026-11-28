import { BaseManager } from './base-manager.js';
import { UI_CONFIG, EVENT_NAMES } from '../../constants.js';
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
 * - Save game state to localStorage, debounced through markDirty()
 * - Load game state from localStorage with validation
 * - Handle save/load errors gracefully
 * - Support version migration
 */
export class SaveLoadManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);

    // Time of the last successful write, for diagnostics
    this.lastSaveTime = 0;
    this._dirtyTimer = null;
    this._isDirty = false;
    // Why the last load was rejected, kept so the title screen can tell the
    // player before anything is written over the unreadable save.
    this._loadError = null;
  }

  /**
   * @returns {string|null} Reason the last load rejected an existing save, or
   *   null if it succeeded, found no save, or a save has since been written
   */
  getLoadError() {
    return this._loadError;
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
   * Write now and report the result. Shared by the debounced path and
   * saveGame so there is one write routine.
   * @private
   * @returns {boolean} True if the write succeeded
   */
  _forceSave() {
    const fullState = this.capabilities.getFullState();
    if (!fullState) {
      return false;
    }

    const result = saveGameToStorage(fullState);
    if (result.success) {
      this.lastSaveTime = result.newLastSaveTime;
      this._loadError = null;
      return true;
    }

    this.error('Save failed — game progress may be lost', result.error);
    this.capabilities.emit(EVENT_NAMES.SAVE_FAILED, {
      message: 'Save failed — game progress may be lost',
    });
    return false;
  }

  /**
   * Write the current state now, replacing any pending debounced write.
   * Managers should call markDirty() instead; this is for callers that
   * need the write to have happened before they continue.
   *
   * @returns {boolean} True if the write succeeded, false if it failed
   */
  saveGame() {
    if (this._dirtyTimer) {
      clearTimeout(this._dirtyTimer);
      this._dirtyTimer = null;
    }
    this._isDirty = false;
    return this._forceSave();
  }

  /**
   * Load game state from localStorage
   *
   * Delegates to GameCoordinator.restoreState() for version checking,
   * migrations, validation, defaults, state assignment, and event emission.
   *
   * @returns {Object|null} Loaded and validated game state, or null if load failed
   */
  loadGame() {
    try {
      this._loadError = null;
      const loadedState = loadGameFromStorage();

      if (!loadedState) {
        if (checkSavedGame()) {
          this._loadError = 'Save data is corrupted and could not be read';
        }
        return null;
      }

      const result = this.capabilities.restoreState(loadedState);

      if (result.success) {
        return result.state;
      }

      this.log(result.reason);
      this._loadError = result.reason;
      return null;
    } catch (error) {
      this.log('Failed to load game:', error);
      // The player sees this text, not the raw engine error
      this._loadError = 'Save data could not be loaded';
      return null;
    }
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
