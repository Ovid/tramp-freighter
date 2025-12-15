import { useGameEvent } from '../../hooks/useGameEvent';

/**
 * DateDisplay component displays the current game time.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - timeChanged: Updates when game time advances
 *
 * React Migration Spec: Requirements 7.3, 24.5
 */
export function DateDisplay() {
  const daysElapsed = useGameEvent('timeChanged');

  return (
    <div className="hud-section hud-time">
      <div className="hud-row">
        <span className="hud-label">Days:</span>
        <span className="hud-value">{daysElapsed}</span>
      </div>
    </div>
  );
}
