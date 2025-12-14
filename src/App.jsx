import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StarMapCanvas } from './features/navigation/StarMapCanvas';
import { HUD } from './features/hud/HUD';
import { StationMenu } from './features/station/StationMenu';
import { PanelContainer } from './features/station/PanelContainer';

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
  const [viewMode, setViewMode] = useState(VIEW_MODES.ORBIT);
  const [activePanel, setActivePanel] = useState(null);

  /**
   * Handle docking at a station.
   * Transitions from ORBIT to STATION view mode.
   *
   * React Migration Spec: Requirements 9.3, 25.3
   */
  const handleDock = () => {
    setViewMode(VIEW_MODES.STATION);
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

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Starmap is always rendered (z-index 0) */}
        <ErrorBoundary>
          <StarMapCanvas />
        </ErrorBoundary>

        {/* HUD is always rendered */}
        <HUD onDock={handleDock} />

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
      </div>
    </ErrorBoundary>
  );
}
