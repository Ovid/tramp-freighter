import { GAME_START_DATE } from '../constants.js';

/**
 * Converts a game day offset into a calendar date string.
 * Day 0 = GAME_START_DATE. Handles month/year boundaries correctly.
 * @param {number} daysElapsed - Days since game start (may be fractional)
 * @returns {string} ISO date string "YYYY-MM-DD"
 */
export function gameDayToDate(daysElapsed) {
  const start = new Date(GAME_START_DATE);
  start.setUTCDate(start.getUTCDate() + Math.floor(daysElapsed));
  return start.toISOString().slice(0, 10);
}
