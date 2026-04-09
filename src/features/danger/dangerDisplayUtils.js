import { KARMA_CONFIG, REPUTATION_BOUNDS } from '../../game/constants';

/**
 * Get CSS class for karma value display.
 *
 * @param {number} karma - Current karma value
 * @returns {string} CSS class name
 */
export function getKarmaClass(karma = 0) {
  if (karma >= KARMA_CONFIG.DISPLAY_THRESHOLDS.SAINT) return 'very-good';
  if (karma >= KARMA_CONFIG.DISPLAY_THRESHOLDS.GOOD) return 'good';
  if (karma >= KARMA_CONFIG.DISPLAY_THRESHOLDS.BAD) return 'neutral';
  if (karma >= KARMA_CONFIG.DISPLAY_THRESHOLDS.VILLAIN) return 'bad';
  return 'very-bad';
}

const OUTLAW_TIER_LABELS = [
  'Family',
  'Trusted',
  'Friendly',
  'Warm',
  'Neutral',
  'Cold',
  'Hostile',
];

const AUTHORITY_TIER_LABELS = [
  'Exemplary',
  'Trusted',
  'Respected',
  'Good Standing',
  'Neutral',
  'Suspicious',
  'Wanted',
];

/**
 * Get reputation tier label for a faction reputation value.
 *
 * @param {number} reputation - Reputation value
 * @param {'outlaw'|'authority'} factionType - Faction type determines label set
 * @returns {string} Tier label
 */
export function getReputationTier(reputation = 0, factionType = 'outlaw') {
  const labels =
    factionType === 'authority' ? AUTHORITY_TIER_LABELS : OUTLAW_TIER_LABELS;

  if (reputation >= REPUTATION_BOUNDS.FAMILY_MIN) return labels[0];
  if (reputation >= REPUTATION_BOUNDS.TRUSTED_MIN) return labels[1];
  if (reputation >= REPUTATION_BOUNDS.FRIENDLY_MIN) return labels[2];
  if (reputation >= REPUTATION_BOUNDS.WARM_MIN) return labels[3];
  if (reputation >= REPUTATION_BOUNDS.NEUTRAL_MIN) return labels[4];
  if (reputation >= REPUTATION_BOUNDS.COLD_MIN) return labels[5];
  return labels[6];
}
