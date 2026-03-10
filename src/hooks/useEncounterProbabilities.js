import { useGame } from '../context/GameContext';

/**
 * Custom hook for encounter probability calculations
 *
 * Provides encounter probability calculations through the Bridge Pattern.
 * Calculates pirate and inspection chances for a given system and game state.
 *
 * @param {number} systemId - System ID to calculate probabilities for
 * @param {Object} gameState - Game state object with ship and player data
 * @returns {Object} Encounter probabilities: { pirateChance, inspectionChance }
 */
export function useEncounterProbabilities(systemId, gameState) {
  const game = useGame();

  if (!gameState) {
    return { pirateChance: 0, inspectionChance: 0 };
  }

  const pirateChance = game.dangerManager.calculatePirateEncounterChance(
    systemId,
    gameState
  );

  const inspectionChance = game.dangerManager.calculateInspectionChance(
    systemId,
    gameState
  );

  return { pirateChance, inspectionChance };
}
