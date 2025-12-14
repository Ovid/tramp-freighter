import { useGameEvent } from '../../hooks/useGameEvent';

/**
 * ResourceBar component displays player credits and ship fuel.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - creditsChanged: Updates when player credits change
 * - fuelChanged: Updates when ship fuel changes
 *
 * React Migration Spec: Requirements 7.1, 7.2, 24.4
 */
export function ResourceBar() {
  const credits = useGameEvent('creditsChanged');
  const fuel = useGameEvent('fuelChanged');

  return (
    <div className="hud-section">
      <div className="hud-row">
        <span className="hud-label">Credits:</span>
        <span className="hud-value">{credits?.toLocaleString() || 0}</span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Fuel:</span>
        <div className="fuel-bar-container condition-bar-container">
          <div
            className="fuel-bar condition-bar"
            style={{ width: `${fuel || 0}%` }}
          />
          <span className="condition-text">{fuel?.toFixed(1) || 0}%</span>
        </div>
      </div>
    </div>
  );
}
