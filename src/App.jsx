import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TitleScreen } from './features/title-screen/TitleScreen';
import { ShipNamingDialog } from './features/title-screen/ShipNamingDialog';
import { StarMapCanvas } from './features/navigation/StarMapCanvas';
import { HUD } from './features/hud/HUD';
import { StationMenu } from './features/station/StationMenu';
import { PanelContainer } from './features/station/PanelContainer';
import { DevAdminPanel } from './features/dev-admin/DevAdminPanel';
import { SystemPanel } from './features/navigation/SystemPanel';
import { useGameState } from './context/GameContext';
import { useGameEvent } from './hooks/useGameEvent';

/**
 * View modes for the application.
 *
 * TITLE: Title screen with Continue/New Game options
 * SHIP_NAMING: Ship naming dialog for new games
 * ORBIT: Player is in orbit around a system, viewing the starmap
 * STATION: Player is docked at a station, viewing the station menu
 * PANEL: Player has opened a specific panel from the station menu
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 47.1, 48.1
 */
const VIEW_MODES = {
  TITLE: 'TITLE',
  SHIP_NAMING: 'SHIP_NAMING',
  ORBIT: 'ORBIT',
  STATION: 'STATION',
  PANEL: 'PANEL',
};

/**
 * Root application component.
 *
 * Manages view mode state and conditionally renders:
 * - TitleScreen (on initial load)
 * - ShipNamingDialog (when starting a new game)
 * - StarMapCanvas (after title screen flow, z-index 0)
 * - HUD (after title screen flow)
 * - StationMenu (when docked)
 * - PanelContainer (when panel is open)
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 25.1, 25.2, 25.3, 25.4, 25.5, 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 48.1, 48.7
 *
 * @param {boolean} devMode - Whether dev mode is enabled (from .dev file check)
 */
export default function App({ devMode = false }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');

  const [viewMode, setViewMode] = useState(VIEW_MODES.TITLE);
  const [activePanel, setActivePanel] = useState(null);
  const [showDevAdmin, setShowDevAdmin] = useState(false);
  const [viewingSystemId, setViewingSystemId] = useState(null);

  // Determine if system panel should be shown
  // Show when a system is selected (regardless of view mode)
  // System Info should always be accessible, even when panels are open
  const showSystemPanel = viewingSystemId !== null;

  /**
   * Handle starting a game from the title screen.
   * If isNewGame is true, initialize a new game and show ship naming dialog.
   * If isNewGame is false, load existing game and transition to orbit view.
   *
   * React Migration Spec: Requirements 47.2, 47.3, 47.4, 47.6
   *
   * @param {boolean} isNewGame - True for new game, false to continue existing game
   */
  const handleStartGame = (isNewGame) => {
    if (isNewGame) {
      // Initialize new game
      gameStateManager.initNewGame();
      // Show ship naming dialog
      setViewMode(VIEW_MODES.SHIP_NAMING);
    } else {
      // Load existing game
      gameStateManager.loadGame();
      // Transition to game
      setViewMode(VIEW_MODES.ORBIT);
    }
  };

  /**
   * Handle ship name submission from the ship naming dialog.
   * Updates the ship name in game state, saves the game, and transitions to orbit view.
   *
   * React Migration Spec: Requirements 48.7
   *
   * @param {string} shipName - The sanitized ship name
   */
  const handleShipNamed = (shipName) => {
    // Update ship name in game state
    gameStateManager.updateShipName(shipName);
    // Save game with ship name
    gameStateManager.saveGame();
    // Transition to game
    setViewMode(VIEW_MODES.ORBIT);
  };

  // Create namespaced bridge object for temporary React migration
  // This allows the vanilla JS starmap interaction code to trigger React state updates
  if (typeof window !== 'undefined') {
    window.StarmapBridge = window.StarmapBridge || {};

    window.StarmapBridge.selectStarById = (systemId) => {
      handleSystemSelected(systemId);
      // Also trigger visual selection in Three.js scene
      if (window.StarmapBridge.selectStarInScene) {
        window.StarmapBridge.selectStarInScene(systemId);
      }
    };
  }

  /**
   * Handle docking at a station.
   * Toggles between ORBIT and STATION view modes.
   *
   * React Migration Spec: Requirements 9.3, 25.3
   */
  const handleDock = () => {
    if (viewMode === VIEW_MODES.STATION || viewMode === VIEW_MODES.PANEL) {
      // If currently in station or panel mode, go back to orbit
      setViewMode(VIEW_MODES.ORBIT);
      setActivePanel(null);
    } else {
      // If in orbit mode, go to station
      setViewMode(VIEW_MODES.STATION);
    }
  };

  /**
   * Handle undocking from a station.
   * Transitions from STATION to ORBIT view mode.
   *
   * React Migration Spec: Requirements 9.2, 25.1, 25.2
   */
  const handleUndock = () => {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
  };

  /**
   * Handle opening a panel from the station menu.
   * Transitions from STATION to PANEL view mode.
   *
   * React Migration Spec: Requirements 9.4, 25.4
   *
   * @param {string} panelName - Name of the panel to open
   */
  const handleOpenPanel = (panelName) => {
    setActivePanel(panelName);
    setViewMode(VIEW_MODES.PANEL);
  };

  /**
   * Handle closing a panel.
   * Transitions from PANEL back to STATION view mode.
   *
   * React Migration Spec: Requirements 9.3, 25.3
   */
  const handleClosePanel = () => {
    setViewMode(VIEW_MODES.STATION);
    setActivePanel(null);
  };

  /**
   * Handle opening the dev admin panel.
   * Only available in dev mode.
   *
   * React Migration Spec: Requirements 45.2, 45.5
   */
  const handleOpenDevAdmin = () => {
    setShowDevAdmin(true);
  };

  /**
   * Handle closing the dev admin panel.
   *
   * React Migration Spec: Requirements 45.5
   */
  const handleCloseDevAdmin = () => {
    setShowDevAdmin(false);
  };

  /**
   * Handle opening the system panel (shows current system info).
   * Toggles the system panel visibility.
   */
  const handleOpenSystemInfo = () => {
    if (viewingSystemId === currentSystemId) {
      // If already viewing current system, close the panel
      setViewingSystemId(null);
    } else {
      // Open system panel for current system
      setViewingSystemId(currentSystemId);
    }
  };

  /**
   * Handle system selection from starmap.
   * Shows system panel for the selected system.
   */
  const handleSystemSelected = (systemId) => {
    setViewingSystemId(systemId);
  };

  /**
   * Handle closing the system panel.
   * @param {boolean} keepSelection - If true, don't deselect star (used during jump)
   */
  const handleCloseSystemPanel = (keepSelection = false) => {
    setViewingSystemId(null);
    // Deselect star in scene unless we're keeping it for jump animation
    if (!keepSelection && window.StarmapBridge.deselectStarInScene) {
      window.StarmapBridge.deselectStarInScene();
    }
  };

  // Expose close system panel handler to starmap
  if (typeof window !== 'undefined') {
    window.StarmapBridge = window.StarmapBridge || {};
    window.StarmapBridge.closeSystemPanel = handleCloseSystemPanel;
  }

  /**
   * Handle jump start.
   * Close station menu immediately so user can see the animation.
   * Keep selection ring visible during animation to show destination.
   */
  const handleJumpStart = () => {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
    // Don't deselect star - keep selection ring visible during jump
  };

  /**
   * Handle successful jump completion.
   * After jump, deselect star so only current system indicator is visible.
   */
  const handleJumpComplete = () => {
    setViewingSystemId(null);
    // Deselect star after jump completes - we've arrived at destination
    // Only the current system indicator (green) should be visible
    if (window.StarmapBridge.deselectStarInScene) {
      window.StarmapBridge.deselectStarInScene();
    }
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Title screen displayed on initial load */}
        {viewMode === VIEW_MODES.TITLE && (
          <TitleScreen onStartGame={handleStartGame} />
        )}

        {/* Ship naming dialog displayed when starting a new game */}
        {viewMode === VIEW_MODES.SHIP_NAMING && (
          <ShipNamingDialog onSubmit={handleShipNamed} />
        )}

        {/* Game components only rendered after title screen flow completes */}
        {viewMode !== VIEW_MODES.TITLE &&
          viewMode !== VIEW_MODES.SHIP_NAMING && (
            <>
              {/* Starmap is always rendered (z-index 0) */}
              <ErrorBoundary>
                <StarMapCanvas />
              </ErrorBoundary>

              {/* HUD is always rendered */}
              <HUD onDock={handleDock} onSystemInfo={handleOpenSystemInfo} />

              {/* Station menu displayed when docked */}
              {viewMode === VIEW_MODES.STATION && (
                <StationMenu
                  onOpenPanel={handleOpenPanel}
                  onUndock={handleUndock}
                />
              )}

              {/* Panel container displayed when a panel is open */}
              {viewMode === VIEW_MODES.PANEL && (
                <PanelContainer
                  activePanel={activePanel}
                  onClose={handleClosePanel}
                />
              )}

              {/* Dev admin button (only visible in dev mode) */}
              {devMode && (
                <button
                  id="dev-admin-btn"
                  onClick={handleOpenDevAdmin}
                  style={{ display: 'flex' }}
                >
                  ⚙
                </button>
              )}

              {/* Dev admin panel (only rendered in dev mode when open) */}
              {devMode && showDevAdmin && (
                <DevAdminPanel onClose={handleCloseDevAdmin} />
              )}

              {/* System panel (rendered when viewing a system) */}
              {showSystemPanel && (
                <SystemPanel
                  viewingSystemId={viewingSystemId}
                  onClose={handleCloseSystemPanel}
                  onJumpStart={handleJumpStart}
                  onJumpComplete={handleJumpComplete}
                />
              )}
            </>
          )}
      </div>
    </ErrorBoundary>
  );
}
