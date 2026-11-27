import { SAVE_KEY } from '../constants.js';
import { devLog } from '../utils/dev-logger.js';

/**
 * Write game state to localStorage now, stamping meta.timestamp.
 *
 * Does not mutate the input. Callers own scheduling: managers call
 * markDirty(), which debounces before writing through here.
 *
 * @param {Object} state - Complete game state to save
 * @returns {{success: boolean, newLastSaveTime: number|null, error?: Error}}
 */
export function saveGame(state) {
  if (!state) {
    console.error('Cannot save: no game state exists');
    return { success: false, newLastSaveTime: null };
  }

  try {
    const now = Date.now();
    const stateToSave = {
      ...state,
      meta: {
        ...state.meta,
        timestamp: now,
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));

    devLog('Game saved successfully');
    return { success: true, newLastSaveTime: now };
  } catch (error) {
    return { success: false, newLastSaveTime: null, error };
  }
}

/**
 * Load game state from localStorage
 *
 * Returns the raw loaded state without validation or migration.
 * Validation and migration should be handled by the caller.
 *
 * @returns {Object|null} Loaded state or null if no save exists or load fails
 */
export function loadGame() {
  try {
    // Retrieve save data from localStorage
    const saveData = localStorage.getItem(SAVE_KEY);

    if (!saveData) {
      devLog('No saved game found');
      return null;
    }

    const loadedState = JSON.parse(saveData);

    devLog('Game loaded successfully');

    return loadedState;
  } catch (error) {
    devLog('Failed to load game:', error);
    return null;
  }
}

/**
 * Check if saved game exists in localStorage
 *
 * @returns {boolean} True if save data exists
 */
export function hasSavedGame() {
  try {
    const saveData = localStorage.getItem(SAVE_KEY);
    return saveData !== null;
  } catch (error) {
    console.error('Failed to check for saved game:', error);
    return false;
  }
}

/**
 * Clear saved game from localStorage
 *
 * @returns {boolean} True if clear succeeded
 */
export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    devLog('Save data cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear save:', error);
    return false;
  }
}
