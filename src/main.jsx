// 1. External libraries
import React from 'react';
import ReactDOM from 'react-dom/client';

// 2. Internal modules (game logic, state management)
import { GameStateManager } from './game/state/game-state-manager';
import { loadGame } from './game/state/save-load';
import { NavigationSystem } from './game/game-navigation';

// 3. Components
import App from './App';
import { GameProvider } from './context/GameContext';

// 4. Data/constants
import { STAR_DATA } from './game/data/star-data';
import { WORMHOLE_DATA } from './game/data/wormhole-data';
import { initDevMode } from './game/constants';

// 5. Styles (CSS imports)
import '../css/base.css';
import '../css/hud.css';
import '../css/modals.css';
import '../css/starmap-scene.css';
import '../css/system-event-info.css';
import '../css/panel/cargo-manifest.css';
import '../css/panel/dev-admin.css';
import '../css/panel/info-broker.css';
import '../css/panel/jump-dialog.css';
import '../css/panel/refuel.css';
import '../css/panel/repair.css';
import '../css/panel/ship-status.css';
import '../css/panel/system-info.css';
import '../css/panel/system-panel.css';
import '../css/panel/trade.css';
import '../css/panel/upgrades.css';

/**
 * Initialize GameStateManager with either saved game or new game.
 *
 * React Migration Spec: Requirements 32.1, 32.2, 32.3, 32.4, 32.5
 *
 * @returns {GameStateManager} Initialized game state manager
 * @throws {Error} If initialization fails
 */
function initializeGameStateManager() {
  // Create navigation system
  const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);

  // Create GameStateManager instance
  const gameStateManager = new GameStateManager(
    STAR_DATA,
    WORMHOLE_DATA,
    navigationSystem
  );

  // Try to load saved game
  let savedGame = null;
  try {
    savedGame = loadGame(false); // false = not test environment
  } catch (loadError) {
    console.error('Failed to load saved game:', loadError);
    // Continue with new game if load fails
  }

  if (savedGame) {
    // Restore from saved game
    gameStateManager.state = savedGame;
    console.log('Game loaded from save');
  } else {
    // Initialize new game
    gameStateManager.initNewGame();
    console.log('New game initialized');
  }

  return gameStateManager;
}

/**
 * Render error UI when initialization fails.
 *
 * React Migration Spec: Requirements 23.5, 32.5, 36.4
 *
 * @param {Error} error - The error that occurred
 */
function renderErrorUI(error) {
  console.error('Failed to initialize game:', error);

  ReactDOM.createRoot(document.getElementById('root')).render(
    <div
      style={{
        padding: '40px',
        fontFamily: 'sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1>Failed to Load Game</h1>
      <p>
        The game failed to initialize. This could be due to corrupted save data
        or a browser compatibility issue.
      </p>
      <p style={{ color: '#c00', fontFamily: 'monospace', fontSize: '14px' }}>
        {error.message}
      </p>
      <button
        onClick={() => {
          if (
            confirm(
              'This will delete your saved game and start fresh. Continue?'
            )
          ) {
            localStorage.clear();
            window.location.reload();
          }
        }}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          marginRight: '10px',
        }}
      >
        Clear Save and Restart
      </button>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Initialize the application.
 * Initializes dev mode detection, then GameStateManager, then renders the app.
 *
 * React Migration Spec: Requirements 45.1, 45.2, 45.3
 */
async function initializeApp() {
  // Initialize dev mode detection BEFORE rendering
  // This ensures DEV_MODE is set before React evaluates the App component
  const isDevMode = await initDevMode();

  // Initialize GameStateManager
  let gameStateManager;
  try {
    gameStateManager = initializeGameStateManager();
  } catch (error) {
    renderErrorUI(error);
    throw error; // Re-throw to prevent further execution
  }

  // Render application
  // Pass devMode as a prop to ensure React knows about it
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={isDevMode} />
      </GameProvider>
    </React.StrictMode>
  );
}

// Start the application
initializeApp();
