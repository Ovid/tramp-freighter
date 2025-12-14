import { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

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
        {/* TODO: Implement StarMapCanvas in task 6 */}
        <div
          className="starmap-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <p>StarMapCanvas will be implemented in task 6</p>
        </div>

        {/* HUD is always rendered */}
        {/* TODO: Implement HUD in task 8 */}
        <div
          className="hud-placeholder"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          <p>HUD will be implemented in task 8</p>
          <p>View Mode: {viewMode}</p>
          <button onClick={handleDock}>Dock (Test)</button>
        </div>

        {/* Station menu displayed when docked */}
        {viewMode === VIEW_MODES.STATION && (
          <div
            className="station-menu-placeholder"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              backgroundColor: '#222',
              color: '#fff',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '300px',
            }}
          >
            <h2>Station Menu</h2>
            <p>StationMenu will be implemented in task 9</p>
            <button onClick={() => handleOpenPanel('trade')}>
              Open Trade Panel (Test)
            </button>
            <br />
            <button onClick={handleUndock} style={{ marginTop: '10px' }}>
              Undock
            </button>
          </div>
        )}

        {/* Panel container displayed when a panel is open */}
        {viewMode === VIEW_MODES.PANEL && (
          <div
            className="panel-container-placeholder"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              backgroundColor: '#333',
              color: '#fff',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '400px',
            }}
          >
            <h2>Panel: {activePanel}</h2>
            <p>PanelContainer will be implemented in task 9</p>
            <button onClick={handleClosePanel}>Close Panel</button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
