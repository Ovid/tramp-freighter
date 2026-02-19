import { useGameState } from '../context/GameContext';

/**
 * Custom hook for accessing danger zone information
 *
 * Provides access to danger zone classification through the Bridge Pattern.
 * Since danger zones are static based on system ID and don't change during
 * gameplay, this hook simply returns the classification without event subscriptions.
 *
 * @param {number} systemId - The system ID to get danger zone for
 * @returns {string} Danger zone classification: 'safe', 'contested', or 'dangerous'
 */
export function useDangerZone(systemId) {
  const gameStateManager = useGameState();
  return gameStateManager.dangerManager.getDangerZone(systemId);
}
