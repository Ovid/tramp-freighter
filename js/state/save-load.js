'use strict';

import { GAME_VERSION, SAVE_KEY } from '../game-constants.js';

// Save debouncing prevents excessive localStorage writes (max 1 save per second)
const SAVE_DEBOUNCE_MS = 1000;

/**
 * Save game state to localStorage with debouncing
 *
 * Implements save debouncing to prevent excessive saves (max 1 save per second).
 * This protects against rapid state changes causing performance issues.
 *
 * @param {Object} state - Complete game state to save
 * @param {number} lastSaveTime - Timestamp of last save (milliseconds since epoch)
 * @param {boolean} isTestEnvironment - Whether running in test mode (suppresses console output)
 * @returns {Object} { success: boolean, newLastSaveTime: number }
 */
export function saveGame(state, lastSaveTime, isTestEnvironment) {
  if (!state) {
    console.error('Cannot save: no game state exists');
    return { success: false, newLastSaveTime: lastSaveTime };
  }

  // Debounce: skip save if less than 1 second since last save
  const now = Date.now();
  if (now - lastSaveTime < SAVE_DEBOUNCE_MS) {
    if (!isTestEnvironment) {
      console.log('Save debounced (too soon since last save)');
    }
    return { success: false, newLastSaveTime: lastSaveTime };
  }

  try {
    // Update timestamp in state metadata
    state.meta.timestamp = now;
    const saveData = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, saveData);

    if (!isTestEnvironment) {
      console.log('Game saved successfully');
    }
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
 * @param {boolean} isTestEnvironment - Whether running in test mode (suppresses console output)
 * @returns {Object|null} Loaded state or null if no save exists or load fails
 */
export function loadGame(isTestEnvironment) {
  try {
    // Retrieve save data from localStorage
    const saveData = localStorage.getItem(SAVE_KEY);

    if (!saveData) {
      if (!isTestEnvironment) {
        console.log('No saved game found');
      }
      return null;
    }

    const loadedState = JSON.parse(saveData);

    if (!isTestEnvironment) {
      console.log('Game loaded successfully');
    }

    return loadedState;
  } catch (error) {
    if (!isTestEnvironment) {
      console.log('Failed to load game:', error);
    }
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
 * @param {boolean} isTestEnvironment - Whether running in test mode (suppresses console output)
 * @returns {boolean} True if clear succeeded
 */
export function clearSave(isTestEnvironment) {
  try {
    localStorage.removeItem(SAVE_KEY);
    if (!isTestEnvironment) {
      console.log('Save data cleared');
    }
    return true;
  } catch (error) {
    console.error('Failed to clear save:', error);
    return false;
  }
}
