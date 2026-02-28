import { useGameState } from '../../context/GameContext.jsx';
import { useGameEvent } from '../../hooks/useGameEvent';
import {
  ACHIEVEMENTS_CONFIG,
  FACTION_CONFIG,
  EVENT_NAMES,
} from '../../game/constants';

/**
 * Extract numeric karma value from useGameEvent data.
 *
 * The KARMA_CHANGED event payload is inconsistent across emitters:
 * - game-state-manager emits a plain number
 * - danger.js emits { karma, change, reason }
 * - extractStateForEvent initializes as state.player.karma (number)
 *
 * This helper normalizes both shapes to a numeric value.
 *
 * @param {number|Object|null} karmaData - Raw data from useGameEvent
 * @returns {number} Numeric karma value
 */
function extractKarma(karmaData) {
  if (karmaData == null) return 0;
  if (typeof karmaData === 'number') return karmaData;
  if (typeof karmaData === 'object' && typeof karmaData.karma === 'number') {
    return karmaData.karma;
  }
  return 0;
}

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
  const gameStateManager = useGameState();
  const karmaData = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED) ?? {};

  // Subscribe to events that trigger re-renders when stats change
  useGameEvent(EVENT_NAMES.JUMP_COMPLETED);
  useGameEvent(EVENT_NAMES.TIME_CHANGED);

  const karma = extractKarma(karmaData);

  // Read current state for gameplay counters and danger history
  const state = gameStateManager.getState();
  const stats = state?.stats ?? {};
  const player = state?.player ?? {};
  const world = state?.world ?? {};
  const dangerFlags = world.dangerFlags ?? {};
  const visitedCount = (world.visitedSystems ?? []).length;

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
        <h3 className="stats-group-title">Gameplay Counters</h3>
        <div className="stat-row">
          <span className="stat-label">Systems Visited</span>
          <span className="stat-value">{visitedCount} / 48</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Jumps Completed</span>
          <span className="stat-value">{stats.jumpsCompleted ?? 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Days Elapsed</span>
          <span className="stat-value">
            {Math.round(player.daysElapsed ?? 0)}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Credits Earned</span>
          <span className="stat-value">{stats.creditsEarned ?? 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Cargo Hauled</span>
          <span className="stat-value">{stats.cargoHauled ?? 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Charitable Acts</span>
          <span className="stat-value">{stats.charitableActs ?? 0}</span>
        </div>
      </div>

      <div className="stats-group">
        <h3 className="stats-group-title">Danger History</h3>
        {Object.entries(DANGER_FLAG_LABELS).map(([key, label]) => (
          <div className="stat-row" key={key}>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{dangerFlags[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
