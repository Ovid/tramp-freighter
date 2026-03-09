import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants.js';

/**
 * ResourceBar component displays player credits and debt.
 *
 * Uses the Bridge Pattern to subscribe to GameCoordinator events:
 * - creditsChanged: Updates when player credits change
 * - debtChanged: Updates when player debt changes
 *
 * React Migration Spec: Requirements 7.1, 7.2, 24.4
 */
export function ResourceBar() {
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const debt = useGameEvent(EVENT_NAMES.DEBT_CHANGED);

  return (
    <div className="hud-section hud-finances">
      <div className="hud-row">
        <span className="hud-label">Credits:</span>
        <span className="hud-value">₡{credits.toLocaleString()}</span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Debt:</span>
        <span className="hud-value">₡{debt.toLocaleString()}</span>
      </div>
    </div>
  );
}
