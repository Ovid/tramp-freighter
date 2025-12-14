import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameState } from '../../context/GameContext';
import { useAnimationLock } from '../../hooks/useAnimationLock';

/**
 * QuickAccessButtons component displays quick access buttons for common actions.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - locationChanged: Updates button state when player location changes
 *
 * Uses useAnimationLock to disable buttons during animations.
 *
 * React Migration Spec: Requirements 46.1, 46.2, 46.3, 46.4, 46.5
 *
 * @param {Function} onDock - Callback to trigger docking at a station
 */
export function QuickAccessButtons({ onDock }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');
  const animationLock = useAnimationLock();

  // Get current system data
  const starData = gameStateManager.starData;
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!currentSystem) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Determine if docking is available (system has a station)
  const canDock = currentSystem.st > 0;

  // Check if animations are running (disables all buttons during animations)
  const isAnimationRunning = animationLock.isLocked();

  const handleSystemInfo = () => {
    // Don't execute if animation is running
    if (isAnimationRunning) return;

    // TODO: Implement system info display in future task
    // Placeholder - no action until system info panel is implemented
  };

  const handleDock = () => {
    // Don't execute if animation is running
    if (isAnimationRunning) return;

    if (canDock && onDock) {
      onDock();
    }
  };

  return (
    <div className="hud-section hud-quick-access">
      <div className="hud-quick-access-label">Quick Access:</div>
      <div className="hud-quick-access-buttons">
        <button
          className="quick-access-btn"
          onClick={handleSystemInfo}
          disabled={isAnimationRunning}
        >
          System Info
        </button>
        <button
          className="quick-access-btn"
          onClick={handleDock}
          disabled={!canDock || isAnimationRunning}
        >
          Dock
        </button>
      </div>
    </div>
  );
}
