import { GameProvider } from '../src/context/GameContext.jsx';
import { MobileProvider } from '../src/context/MobileContext.jsx';

/**
 * React Testing Library utilities for testing React components and hooks.
 *
 * Provides common test setup functions to avoid duplication across React test files.
 */

/**
 * Creates a wrapper component with GameProvider and MobileProvider for testing
 * hooks and components.
 *
 * This wrapper provides the GameCoordinator context and mobile detection context
 * to components under test, enabling them to use useGame, useGameEvent,
 * useGameAction, and useMobile hooks.
 *
 * Used with React Testing Library's renderHook and render functions.
 *
 * @param {GameCoordinator} game - The GameCoordinator instance to provide
 * @param {object} [options] - Optional configuration
 * @param {boolean} [options.isMobile=false] - Whether to simulate mobile mode
 * @returns {Function} Wrapper component that provides GameContext and MobileContext
 *
 * @example
 * const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
 * game.initNewGame();
 *
 * const { result } = renderHook(() => useGameEvent('creditsChanged'), {
 *   wrapper: createWrapper(game),
 * });
 */
export function createWrapper(game, { isMobile = false } = {}) {
  return function Wrapper({ children }) {
    return (
      <GameProvider game={game}>
        <MobileProvider isMobile={isMobile}>{children}</MobileProvider>
      </GameProvider>
    );
  };
}
