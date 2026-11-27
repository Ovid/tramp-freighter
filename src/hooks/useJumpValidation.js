import { useGame } from '../context/GameContext';
import { useGameEvent } from './useGameEvent';
import { EVENT_NAMES } from '../game/constants.js';

/**
 * Custom hook for jump validation
 *
 * Previews a jump from the current system through the Bridge Pattern. The
 * jump itself validates through the same preview, so the panel shows exactly
 * what the jump will charge.
 *
 * @param {number} targetSystemId - Target system ID
 * @returns {Object} Validation result: { valid, error, fuelCost, distance, jumpTime }
 */
export function useJumpValidation(targetSystemId) {
  const game = useGame();
  // Subscribed only so the preview re-runs when anything it reads changes
  useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  useGameEvent(EVENT_NAMES.QUIRKS_CHANGED);
  useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);

  return game.previewJump(targetSystemId);
}
