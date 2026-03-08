import { useGame } from '../../context/GameContext.jsx';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  ACHIEVEMENTS_CONFIG,
  FACTION_CONFIG,
  EVENT_NAMES,
} from '../../game/constants';
import { gameDayToDate } from '../../game/utils/date-utils.js';

/**
 * Get karma label from numeric value.
 *
 * Iterates KARMA_LABELS top-to-bottom; first entry where
 * karma >= entry.min wins. Falls back to 'Neutral'.
 *
 * @param {number} karma - Current karma value
 * @returns {string} Human-readable label
 */
export function getKarmaLabel(karma) {
  for (const entry of ACHIEVEMENTS_CONFIG.KARMA_LABELS) {
    if (karma >= entry.min) return entry.label;
  }
  return 'Neutral';
}

/**
 * Get faction standing label from numeric value.
 *
 * Iterates FACTION_LABELS top-to-bottom; first entry where
 * rep >= entry.min wins. Falls back to 'Neutral'.
 *
 * @param {number} rep - Current faction reputation value
 * @returns {string} Human-readable label
 */
export function getFactionLabel(rep) {
  for (const entry of ACHIEVEMENTS_CONFIG.FACTION_LABELS) {
    if (rep >= entry.min) return entry.label;
  }
  return 'Neutral';
}

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str - Input string
 * @returns {string} String with first character uppercased
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Human-readable labels for danger flag keys.
 */
const DANGER_FLAG_LABELS = {
  piratesFought: 'Pirates Fought',
  piratesNegotiated: 'Pirates Negotiated',
  civiliansSaved: 'Civilians Saved',
  civiliansLooted: 'Civilians Looted',
  inspectionsPassed: 'Inspections Passed',
  inspectionsBribed: 'Inspections Bribed',
  inspectionsFled: 'Inspections Fled',
};

/**
 * StatsSection displays the player's reputation, gameplay counters,
 * and danger encounter history.
 *
 * Subscribes to karmaChanged, factionRepChanged, jumpCompleted,
 * and timeChanged events via the Bridge Pattern. Reads additional
 * stats from GameStateManager on each render.
 */
export function StatsSection() {
  const game = useGame();
  const karma = useGameEvent(EVENT_NAMES.KARMA_CHANGED) ?? 0;
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED) ?? {};

  // These two events cover all remaining stats: jump counters, visited
  // systems, days elapsed, and danger flags (encounters resolve pre-jump).
  // Trade stats (creditsEarned, cargoHauled) don't need subscriptions
  // because the modal must be closed to trade, and it remounts fresh.
  useGameEvent(EVENT_NAMES.JUMP_COMPLETED);
  useGameEvent(EVENT_NAMES.TIME_CHANGED);

  const snapshot = game.getStatsSnapshot();

  return (
    <div className="stats-section">
      <div className="stats-group">
        <h3 className="stats-group-title">Reputation &amp; Standing</h3>
        <div className="stat-row">
          <span className="stat-label">Karma</span>
          <span className="stat-value">
            {karma} ({getKarmaLabel(karma)})
          </span>
        </div>
        {FACTION_CONFIG.FACTIONS.map((faction) => {
          const rep = factions[faction] ?? 0;
          return (
            <div className="stat-row" key={faction}>
              <span className="stat-label">{capitalize(faction)}</span>
              <span className="stat-value">
                {rep} ({getFactionLabel(rep)})
              </span>
            </div>
          );
        })}
      </div>

      <div className="stats-group">
        <h3 className="stats-group-title">Ship's Log</h3>
        <div className="stat-row">
          <span className="stat-label">Systems Visited</span>
          <span className="stat-value">
            {snapshot.visitedCount} /{' '}
            {ACHIEVEMENTS_CONFIG.THRESHOLDS.EXPLORATION_TIER_4}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Jumps Completed</span>
          <span className="stat-value">{snapshot.jumpsCompleted}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Current Date</span>
          <span className="stat-value">
            {gameDayToDate(snapshot.daysElapsed ?? 0)}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Credits Earned</span>
          <span className="stat-value">{snapshot.creditsEarned}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Cargo Hauled</span>
          <span className="stat-value">{snapshot.cargoHauled}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Charitable Acts</span>
          <span className="stat-value">{snapshot.charitableActs}</span>
        </div>
      </div>

      <div className="stats-group">
        <h3 className="stats-group-title">Danger History</h3>
        {Object.entries(DANGER_FLAG_LABELS).map(([key, label]) => (
          <div className="stat-row" key={key}>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{snapshot.dangerFlags[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
