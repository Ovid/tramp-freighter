import { GameProvider } from '../src/context/GameContext.jsx';

/**
 * React Testing Library utilities for testing React components and hooks.
 *
 * Provides common test setup functions to avoid duplication across React test files.
 */

/**
 * Creates a wrapper component with GameProvider for testing hooks and components.
 *
 * This wrapper provides the GameCoordinator context to components under test,
 * enabling them to use useGame, useGameEvent, and useGameAction hooks.
 *
 * Used with React Testing Library's renderHook and render functions.
 *
 * @param {GameCoordinator} game - The GameCoordinator instance to provide
 * @returns {Function} Wrapper component that provides GameContext
 *
 * @example
 * const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
 * game.initNewGame();
 *
 * const { result } = renderHook(() => useGameEvent('creditsChanged'), {
 *   wrapper: createWrapper(game),
 * });
 */
export function createWrapper(game) {
  return function Wrapper({ children }) {
    return <GameProvider game={game}>{children}</GameProvider>;
  };
}
