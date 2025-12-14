import { useGameEvent } from '../../hooks/useGameEvent';

/**
 * ShipStatus component displays ship condition bars.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - shipConditionChanged: Updates when ship condition changes
 *
 * React Migration Spec: Requirements 7.4, 24.6
 */
export function ShipStatus() {
  const condition = useGameEvent('shipConditionChanged');

  const hull = condition?.hull || 100;
  const engine = condition?.engine || 100;
  const lifeSupport = condition?.lifeSupport || 100;

  return (
    <div className="hud-section">
      <div className="hud-row">
        <span className="hud-label">Hull:</span>
        <div className="hull-bar-container condition-bar-container">
          <div
            className="hull-bar condition-bar"
            style={{ width: `${hull}%` }}
          />
          <span className="condition-text">{hull.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Engine:</span>
        <div className="engine-bar-container condition-bar-container">
          <div
            className="engine-bar condition-bar"
            style={{ width: `${engine}%` }}
          />
          <span className="condition-text">{engine.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Life Support:</span>
        <div className="life-support-bar-container condition-bar-container">
          <div
            className="life-support-bar condition-bar"
            style={{ width: `${lifeSupport}%` }}
          />
          <span className="condition-text">{lifeSupport.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
