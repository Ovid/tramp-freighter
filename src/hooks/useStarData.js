import { useGameState } from '../context/GameContext';

/**
 * Custom hook for accessing star system data
 *
 * Provides access to the static star system data through the Bridge Pattern.
 * Since star data is static and doesn't change during gameplay, this hook
 * simply returns the data without event subscriptions.
 *
 * @returns {Array} Array of star system objects
 */
export function useStarData() {
  const gameStateManager = useGameState();
  return gameStateManager.starData;
}
