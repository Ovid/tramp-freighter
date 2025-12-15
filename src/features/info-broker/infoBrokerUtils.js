import { INTELLIGENCE_CONFIG } from '../../game/constants';

/**
 * Validate intelligence purchase
 *
 * @param {number} cost - Intelligence cost
 * @param {number} credits - Player credits
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateIntelligencePurchase(cost, credits) {
  if (credits < cost) {
    return {
      valid: false,
      reason: 'Insufficient credits for intelligence',
    };
  }

  return { valid: true, reason: null };
}

/**
 * Validate rumor purchase
 *
 * @param {number} credits - Player credits
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateRumorPurchase(credits) {
  const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;

  if (credits < rumorCost) {
    return {
      valid: false,
      reason: 'Insufficient credits for rumor',
    };
  }

  return { valid: true, reason: null };
}

/**
 * Get intelligence priority for sorting
 *
 * Prioritizes systems where intelligence is most valuable:
 * never visited → stale → recent → current
 *
 * @param {Object} option - Intelligence option with lastVisit property
 * @returns {number} Priority value (lower = higher priority)
 */
export function getIntelligencePriority(option) {
  if (option.lastVisit === null) return 0; // Never visited - highest priority
  if (option.lastVisit === 0) return 3; // Current - lowest priority (already have data)
  if (option.lastVisit > INTELLIGENCE_CONFIG.RECENT_THRESHOLD) return 1; // Stale
  return 2; // Recent
}

/**
 * Format staleness information for price knowledge display
 *
 * Converts lastVisit days into human-readable text with appropriate CSS class.
 * Centralizes staleness display logic to ensure consistency across UI.
 *
 * @param {number} lastVisit - Days since last visit (0 = current)
 * @returns {Object} { text: string, cssClass: string }
 */
export function formatStaleness(lastVisit) {
  if (lastVisit === 0) {
    return { text: 'Current', cssClass: '' };
  } else if (lastVisit === 1) {
    return { text: '1 day old', cssClass: '' };
  } else if (lastVisit <= 10) {
    return { text: `${lastVisit} days old`, cssClass: '' };
  } else if (lastVisit <= 30) {
    return { text: `${lastVisit} days old`, cssClass: 'stale' };
  } else {
    return { text: `${lastVisit} days old`, cssClass: 'very-stale' };
  }
}

/**
 * Format visit information for intelligence list
 *
 * @param {number|null} lastVisit - Days since last visit (null = never visited, 0 = current)
 * @returns {string} Human-readable visit information
 */
export function formatVisitInfo(lastVisit) {
  if (lastVisit === null) {
    return 'Never visited';
  } else if (lastVisit === 0) {
    return 'Current prices';
  } else if (lastVisit === 1) {
    return 'Last visited 1 day ago';
  } else {
    return `Last visited ${lastVisit} days ago`;
  }
}

/**
 * Sort intelligence options by priority
 *
 * @param {Array} options - Array of intelligence options
 * @returns {Array} Sorted array (highest priority first)
 */
export function sortIntelligenceByPriority(options) {
  return [...options].sort(
    (a, b) => getIntelligencePriority(a) - getIntelligencePriority(b)
  );
}

/**
 * Get systems with known prices sorted by staleness
 *
 * @param {Object} priceKnowledge - Player's price knowledge database
 * @param {Array} starData - Star system data
 * @returns {Array} Array of { system, knowledge } sorted by staleness (current first)
 */
export function getKnownSystemsSortedByStaleness(priceKnowledge, starData) {
  const knownSystemIds = Object.keys(priceKnowledge).map(Number);

  if (knownSystemIds.length === 0) {
    return [];
  }

  // Sort by staleness (current first, then recent, then stale)
  const sortedIds = knownSystemIds.sort((a, b) => {
    const aLastVisit = priceKnowledge[a].lastVisit;
    const bLastVisit = priceKnowledge[b].lastVisit;
    return aLastVisit - bLastVisit;
  });

  return sortedIds
    .map((systemId) => {
      const system = starData.find((s) => s.id === systemId);
      if (!system) return null;

      return {
        system,
        knowledge: priceKnowledge[systemId],
      };
    })
    .filter((item) => item !== null);
}
