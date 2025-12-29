import { useGameState } from '../context/GameContext';

/**
 * Custom hook for jump validation
 *
 * Provides jump validation through the Bridge Pattern.
 * Validates whether a jump is possible and calculates fuel cost, distance, and time.
 *
 * @param {number} currentSystemId - Current system ID
 * @param {number} targetSystemId - Target system ID
 * @param {number} fuel - Current fuel percentage
 * @returns {Object} Validation result: { valid, error, fuelCost, distance, jumpTime }
 */
export function useJumpValidation(currentSystemId, targetSystemId, fuel) {
  const gameStateManager = useGameState();
  return gameStateManager.navigationSystem.validateJump(
    currentSystemId,
    targetSystemId,
    fuel
  );
}
