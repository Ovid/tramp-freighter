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
 * StatsSection displays the player's reputation and faction standings.
 *
 * Subscribes to karmaChanged and factionRepChanged events via the
 * Bridge Pattern. Renders numeric values alongside human-readable labels
 * (e.g. "25 (Decent)").
 */
export function StatsSection() {
  const karmaData = useGameEvent(EVENT_NAMES.KARMA_CHANGED);
  const factions = useGameEvent(EVENT_NAMES.FACTION_REP_CHANGED) ?? {};

  const karma = extractKarma(karmaData);

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
    </div>
  );
}
