import { useGameState } from '../context/GameContext';
import { useGameEvent } from './useGameEvent';

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
  const gameStateManager = useGameState();
  const shipCondition = useGameEvent('shipConditionChanged');

  return gameStateManager.navigationSystem.validateJump(
    currentSystemId,
    targetSystemId,
    fuel,
    shipCondition?.engine ?? 100,
    null,
    [],
    1.0,
    shipCondition ?? null
  );
}
