import { KARMA_CONFIG } from '../constants.js';

/**
 * Calculate karma modifier for success rates.
 * Karma provides a hidden +-5% modifier at extreme values.
 *
 * @param {number} karma - Current karma value (-100 to +100)
 * @returns {number} Modifier to add to success rate (-0.05 to +0.05)
 */
export function calculateKarmaModifier(karma) {
  return karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;
}
