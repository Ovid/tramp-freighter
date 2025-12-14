import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameState } from '../../context/GameContext';

/**
 * QuickAccessButtons component displays quick access buttons for common actions.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - locationChanged: Updates button state when player location changes
 *
 * React Migration Spec: Requirements 46.1, 46.2, 46.4, 46.5
 *
 * @param {Function} onDock - Callback to trigger docking at a station
 */
export function QuickAccessButtons({ onDock }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');

  // Get current system data
  const starData = gameStateManager.starData || [];
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!currentSystem) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Determine if docking is available (system has a station)
  const canDock = currentSystem.st > 0;

  const handleSystemInfo = () => {
    // TODO: Implement system info display in future task
    console.log('System info clicked');
  };

  const handleDock = () => {
    if (canDock && onDock) {
      onDock();
    }
  };

  return (
    <div className="hud-section hud-quick-access">
      <div className="hud-quick-access-label">Quick Access:</div>
      <div className="hud-quick-access-buttons">
        <button className="quick-access-btn" onClick={handleSystemInfo}>
          System Info
        </button>
        <button
          className="quick-access-btn"
          onClick={handleDock}
          disabled={!canDock}
        >
          Dock
        </button>
      </div>
    </div>
  );
}
