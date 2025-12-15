import { useGameEvent } from '../../hooks/useGameEvent';

/**
 * ResourceBar component displays player credits and debt.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - creditsChanged: Updates when player credits change
 * - debtChanged: Updates when player debt changes
 *
 * React Migration Spec: Requirements 7.1, 7.2, 24.4
 */
export function ResourceBar() {
  const credits = useGameEvent('creditsChanged');
  const debt = useGameEvent('debtChanged');

  return (
    <div className="hud-section hud-finances">
      <div className="hud-row">
        <span className="hud-label">Credits:</span>
        <span className="hud-value">{credits.toLocaleString()}</span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Debt:</span>
        <span className="hud-value">{debt.toLocaleString()}</span>
      </div>
    </div>
  );
}
