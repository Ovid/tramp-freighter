import { useGame } from '../context/GameContext';
import { useGameEvent } from './useGameEvent';
import { EVENT_NAMES } from '../game/constants.js';

/**
 * Custom hook for jump validation
 *
 * Provides jump validation through the Bridge Pattern.
 * Validates whether a jump is possible and calculates fuel cost, distance, and time.
 * Subscribes to shipConditionChanged to block jumps when systems are critically damaged.
 *
 * @param {number} currentSystemId - Current system ID
 * @param {number} targetSystemId - Target system ID
 * @param {number} fuel - Current fuel percentage
 * @returns {Object} Validation result: { valid, error, fuelCost, distance, jumpTime }
 */
export function useJumpValidation(currentSystemId, targetSystemId, fuel) {
  const game = useGameState();
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED) ?? [];
  // Subscribe so hook re-runs when upgrades change (affects fuelConsumption)
  useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const capabilities = game.calculateShipCapabilities();

  return game.navigationSystem.validateJump(
    currentSystemId,
    targetSystemId,
    fuel,
    shipCondition?.engine ?? 100,
    game.applyQuirkModifiers.bind(game),
    quirks,
    capabilities.fuelConsumption,
    shipCondition ?? null
  );
}
