import { GameProvider } from '../src/context/GameContext.jsx';

/**
 * React Testing Library utilities for testing React components and hooks.
 *
 * Provides common test setup functions to avoid duplication across React test files.
 */

/**
 * Creates a wrapper component with GameProvider for testing hooks and components.
 *
 * This wrapper provides the GameStateManager context to components under test,
 * enabling them to use useGameState, useGameEvent, and useGameAction hooks.
 *
 * Used with React Testing Library's renderHook and render functions.
 *
 * @param {GameStateManager} gameStateManager - The GameStateManager instance to provide
 * @returns {Function} Wrapper component that provides GameContext
 *
 * @example
 * const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
 * gameStateManager.initNewGame();
 *
 * const { result } = renderHook(() => useGameEvent('creditsChanged'), {
 *   wrapper: createWrapper(gameStateManager),
 * });
 */
export function createWrapper(gameStateManager) {
  return function Wrapper({ children }) {
    return (
      <GameProvider gameStateManager={gameStateManager}>
        {children}
      </GameProvider>
    );
  };
}
