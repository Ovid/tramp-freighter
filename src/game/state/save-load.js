import { SAVE_KEY, UI_CONFIG } from '../constants.js';
import { devLog } from '../utils/dev-logger.js';

/**
 * Save game state to localStorage with debouncing
 *
 * Implements save debouncing to prevent excessive saves (max 1 save per second).
 * This protects against rapid state changes causing performance issues.
 *
 * Creates a new state object with updated timestamp without mutating the input.
 *
 * @param {Object} state - Complete game state to save
 * @param {number} lastSaveTime - Timestamp of last save (milliseconds since epoch)
 * @returns {Object} { success: boolean, newLastSaveTime: number }
 */
export function saveGame(state, lastSaveTime) {
  if (!state) {
    console.error('Cannot save: no game state exists');
    return { success: false, newLastSaveTime: lastSaveTime };
  }

  // Debounce: skip save if less than 1 second since last save
  const now = Date.now();
  if (now - lastSaveTime < UI_CONFIG.SAVE_DEBOUNCE_MS) {
    devLog('Save debounced (too soon since last save)');
    return { success: false, newLastSaveTime: lastSaveTime };
  }

  try {
    // Create new state object with updated timestamp (avoid mutation)
    const stateToSave = {
      ...state,
      meta: {
        ...state.meta,
        timestamp: now,
      },
    };
    const saveData = JSON.stringify(stateToSave);
    localStorage.setItem(SAVE_KEY, saveData);

    devLog('Game saved successfully');
    return { success: true, newLastSaveTime: now };
  } catch (error) {
    console.error('Failed to save game:', error);
    return { success: false, newLastSaveTime: lastSaveTime };
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
