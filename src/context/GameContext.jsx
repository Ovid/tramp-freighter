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
 * @param {Object} props
 * @param {GameCoordinator} props.game - Game coordinator instance
 * @param {React.ReactNode} props.children - Child components
 */
export function GameProvider({ game, children }) {
  if (!game) {
    return (
      <div className="game-loading">
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <GameContext.Provider value={game}>{children}</GameContext.Provider>
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
    throw new Error('useGame must be used within GameProvider');
  }

  return context;
}
