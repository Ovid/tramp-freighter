import { useGame } from '../context/GameContext';

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
  const game = useGameState();
  return game.starData;
}
