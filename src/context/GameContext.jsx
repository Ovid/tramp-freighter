import { createContext, useContext } from 'react';

/**
 * React Context for providing the game coordinator instance to all components.
 *
 * This is the foundation of the Bridge Pattern that connects the imperative
 * game coordinator to React's declarative component model.
 */
const GameContext = createContext(null);

/**
 * Provider component that makes the game coordinator available to all child components.
 *
 * Accepts either `game` (preferred) or `gameStateManager` (backward compat for tests).
 *
 * @param {Object} props
 * @param {GameCoordinator} props.game - Game coordinator instance (preferred)
 * @param {GameStateManager} props.gameStateManager - Legacy prop (backward compat)
 * @param {React.ReactNode} props.children - Child components
 */
export function GameProvider({ game, gameStateManager, children }) {
  const instance = game || gameStateManager;

  if (!instance) {
    return (
      <div className="game-loading">
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <GameContext.Provider value={instance}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook to access the game coordinator from context.
 *
 * @returns {GameCoordinator} The game coordinator instance
 * @throws {Error} If used outside GameProvider
 */
export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGameState must be used within GameProvider');
  }

  return context;
}

/**
 * @deprecated Use useGame() instead. Will be removed in Phase 5.
 */
export const useGameState = useGame;
