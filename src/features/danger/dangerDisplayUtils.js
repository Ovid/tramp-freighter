import { KARMA_CONFIG } from '../../game/constants';

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
