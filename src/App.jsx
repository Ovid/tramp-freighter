import { useState, useRef } from 'react';
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
 * Application state machine modes.
 * Controls which UI components are rendered and manages the game flow
 * from initial load through gameplay without complex conditional logic.
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
 * Root application orchestrator.
 *
 * Manages the UI state machine and coordinates between React's declarative
 * rendering and the imperative GameStateManager. Acts as the bridge between
 * the game engine and the user interface.
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 25.1, 25.2, 25.3, 25.4, 25.5, 47.1, 47.2, 47.3, 47.4, 47.5, 47.6, 48.1, 48.7
 *
 * @param {boolean} devMode - Whether dev mode is enabled (from .dev file check)
 */
export default function App({ devMode = false }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');
  const starmapRef = useRef(null);

  const [viewMode, setViewMode] = useState(VIEW_MODES.TITLE);
  const [activePanel, setActivePanel] = useState(null);
  const [showDevAdmin, setShowDevAdmin] = useState(false);
  const [viewingSystemId, setViewingSystemId] = useState(null);

  // Determine if system panel should be shown
  // Show when a system is selected (regardless of view mode)
  // System Info should always be accessible, even when panels are open
  const showSystemPanel = viewingSystemId !== null;

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

  const handleShipNamed = (shipName) => {
    // Update ship name in game state
    gameStateManager.updateShipName(shipName);
    // Save game with ship name
    gameStateManager.saveGame();
    // Transition to game
    setViewMode(VIEW_MODES.ORBIT);
  };

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

  const handleUndock = () => {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
  };

  const handleOpenPanel = (panelName) => {
    setActivePanel(panelName);
    setViewMode(VIEW_MODES.PANEL);
  };

  const handleClosePanel = () => {
    setViewMode(VIEW_MODES.STATION);
    setActivePanel(null);
  };

  const handleOpenDevAdmin = () => {
    setShowDevAdmin(true);
  };

  const handleCloseDevAdmin = () => {
    setShowDevAdmin(false);
  };

  const handleOpenSystemInfo = () => {
    if (viewingSystemId === currentSystemId) {
      // If already viewing current system, close the panel
      setViewingSystemId(null);
    } else {
      // Open system panel for current system
      setViewingSystemId(currentSystemId);
    }
  };

  const handleSystemSelected = (systemId) => {
    setViewingSystemId(systemId);
  };

  const handleSystemDeselected = () => {
    setViewingSystemId(null);
  };

  /**
   * @param {boolean} keepSelection - If true, don't deselect star (used during jump)
   */
  const handleCloseSystemPanel = (keepSelection = false) => {
    setViewingSystemId(null);
    // Deselect star in scene unless we're keeping it for jump animation
    if (!keepSelection && starmapRef.current) {
      starmapRef.current.deselectStar();
    }
  };

  // Close station menu immediately so user can see the animation.
  // Keep selection ring visible during animation to show destination.
  const handleJumpStart = () => {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
    // Don't deselect star - keep selection ring visible during jump
  };

  // After jump, deselect star so only current system indicator is visible.
  const handleJumpComplete = () => {
    setViewingSystemId(null);
    // Deselect star after jump completes - we've arrived at destination
    // Only the current system indicator (green) should be visible
    if (starmapRef.current) {
      starmapRef.current.deselectStar();
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
                <StarMapCanvas
                  ref={starmapRef}
                  onSystemSelected={handleSystemSelected}
                  onSystemDeselected={handleSystemDeselected}
                />
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
