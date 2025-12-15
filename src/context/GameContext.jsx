import { createContext, useContext } from 'react';

/**
 * React Context for providing GameStateManager instance to all components.
 *
 * This is the foundation of the Bridge Pattern that connects the imperative
 * GameStateManager to React's declarative component model.
 *
 * React Migration Spec: Requirements 5.1, 13.1, 13.2, 13.3, 13.4, 13.5
 */
const GameContext = createContext(null);

/**
 * Provider component that makes GameStateManager available to all child components.
 *
 * Handles initialization states:
 * - null gameStateManager: Shows loading state
 * - valid gameStateManager: Renders children with context
 *
 * @param {Object} props
 * @param {GameStateManager} props.gameStateManager - Initialized GameStateManager instance
 * @param {React.ReactNode} props.children - Child components
 */
export function GameProvider({ gameStateManager, children }) {
  // Handle null/undefined gameStateManager
  if (!gameStateManager) {
    return (
      <div className="game-loading">
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <GameContext.Provider value={gameStateManager}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Custom hook to access GameStateManager from context.
 *
 * Throws error if used outside GameProvider to catch integration bugs early.
 *
 * @returns {GameStateManager} The GameStateManager instance
 * @throws {Error} If used outside GameProvider
 */
export function useGameState() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGameState must be used within GameProvider');
  }

  return context;
}
