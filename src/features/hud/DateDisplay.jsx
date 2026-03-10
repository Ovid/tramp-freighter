import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants.js';
import { gameDayToDate } from '../../game/utils/date-utils.js';

/**
 * DateDisplay component displays the current game time.
 *
 * Uses the Bridge Pattern to subscribe to GameCoordinator events:
 * - timeChanged: Updates when game time advances
 *
 * React Migration Spec: Requirements 7.3, 24.5
 */
export function DateDisplay() {
  const daysElapsed = useGameEvent(EVENT_NAMES.TIME_CHANGED);

  return (
    <div className="hud-section hud-time">
      <div className="hud-row">
        <span className="hud-label">Date:</span>
        <span className="hud-value">{gameDayToDate(daysElapsed ?? 0)}</span>
      </div>
    </div>
  );
}
