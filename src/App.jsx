import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StarMapCanvas } from './features/navigation/StarMapCanvas';
import { HUD } from './features/hud/HUD';
import { StationMenu } from './features/station/StationMenu';
import { PanelContainer } from './features/station/PanelContainer';
import { DevAdminPanel } from './features/dev-admin/DevAdminPanel';
import { SystemPanel } from './features/navigation/SystemPanel';
import { useGameState } from './context/GameContext';
import { useGameEvent } from './hooks/useGameEvent';
import { DEV_MODE } from './game/constants';

/**
 * View modes for the application.
 *
 * ORBIT: Player is in orbit around a system, viewing the starmap
 * STATION: Player is docked at a station, viewing the station menu
 * PANEL: Player has opened a specific panel from the station menu
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
const VIEW_MODES = {
  ORBIT: 'ORBIT',
  STATION: 'STATION',
  PANEL: 'PANEL',
};

/**
 * Root application component.
 *
 * Manages view mode state and conditionally renders:
 * - StarMapCanvas (always visible, z-index 0)
 * - HUD (always visible)
 * - StationMenu (when docked)
 * - PanelContainer (when panel is open)
 *
 * React Migration Spec: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 25.1, 25.2, 25.3, 25.4, 25.5
 */
export default function App() {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');

  const [viewMode, setViewMode] = useState(VIEW_MODES.ORBIT);
  const [activePanel, setActivePanel] = useState(null);
  const [showDevAdmin, setShowDevAdmin] = useState(false);
  const [viewingSystemId, setViewingSystemId] = useState(null);

  // Determine if system panel should be shown
  // Show when a system is selected and we're in orbit or station mode
  const showSystemPanel =
    viewingSystemId !== null &&
    (viewMode === VIEW_MODES.ORBIT || viewMode === VIEW_MODES.STATION);

  // Expose system selection handler to starmap (temporary bridge until full migration)
  // This allows the vanilla JS starmap interaction code to trigger React state updates
  if (typeof window !== 'undefined') {
    window.selectStarById = (systemId) => {
      handleSystemSelected(systemId);
    };
  }

  /**
   * Handle docking at a station.
   * Transitions from ORBIT to STATION view mode.
   *
   * React Migration Spec: Requirements 9.3, 25.3
   */
  const handleDock = () => {
    setViewMode(VIEW_MODES.STATION);
    setViewingSystemId(null); // Close system panel when docking
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
    setViewingSystemId(null); // Close system panel when undocking
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
   */
  const handleOpenSystemInfo = () => {
    setViewingSystemId(currentSystemId);
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
   */
  const handleCloseSystemPanel = () => {
    setViewingSystemId(null);
  };

  /**
   * Handle jump start.
   * Close station menu immediately so user can see the animation.
   */
  const handleJumpStart = () => {
    setViewMode(VIEW_MODES.ORBIT);
    setActivePanel(null);
  };

  /**
   * Handle successful jump completion.
   * After jump, close system panel.
   */
  const handleJumpComplete = () => {
    setViewingSystemId(null);
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Starmap is always rendered (z-index 0) */}
        <ErrorBoundary>
          <StarMapCanvas />
        </ErrorBoundary>

        {/* HUD is always rendered */}
        <HUD onDock={handleDock} onSystemInfo={handleOpenSystemInfo} />

        {/* Station menu displayed when docked */}
        {viewMode === VIEW_MODES.STATION && (
          <StationMenu onOpenPanel={handleOpenPanel} onUndock={handleUndock} />
        )}

        {/* Panel container displayed when a panel is open */}
        {viewMode === VIEW_MODES.PANEL && (
          <PanelContainer
            activePanel={activePanel}
            onClose={handleClosePanel}
          />
        )}

        {/* Dev admin button (only visible in dev mode) */}
        {DEV_MODE && (
          <button
            id="dev-admin-btn"
            onClick={handleOpenDevAdmin}
            style={{ display: 'flex' }}
          >
            ⚙
          </button>
        )}

        {/* Dev admin panel (only rendered in dev mode when open) */}
        {DEV_MODE && showDevAdmin && (
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
      </div>
    </ErrorBoundary>
  );
}
