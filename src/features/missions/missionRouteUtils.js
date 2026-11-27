import { MISSION_CONFIG } from '@game/constants.js';

/**
 * Format route indicator data into a human-readable string.
 *
 * @param {{ hops: number, totalDays: number } | null} routeData - From calculateRouteIndicator
 * @returns {string} Formatted route string, or empty string if no data
 */
export function formatRouteIndicator(routeData) {
  if (!routeData) return '';

  const hopLabel = routeData.hops === 1 ? 'hop' : 'hops';

  if (routeData.hops === 1) {
    return `1 hop \u2014 direct jump`;
  }

  return `${routeData.hops} ${hopLabel} \u2014 ~${routeData.totalDays} days travel`;
}

/**
 * Determine whether a mission's deadline is feasible given the estimated
 * travel time. Returns a warning object for display, or null when the
 * deadline is comfortably reachable.
 *
 * @param {number} totalDays - Estimated travel days from calculateRouteIndicator
 * @param {number} deadline - Mission deadline in days
 * @param {number} [threshold] - Ratio above which the deadline is considered tight
 * @returns {{ level: string, text: string } | null}
 */
export function getFeasibilityWarning(
  totalDays,
  deadline,
  threshold = MISSION_CONFIG.FEASIBILITY_WARNING_THRESHOLD
) {
  if (!totalDays || !deadline) return null;

  const ratio = totalDays / deadline;

  if (ratio >= 1.0)
    return { level: 'impossible', text: 'Deadline likely impossible' };
  if (ratio > threshold) return { level: 'tight', text: 'Tight deadline' };

  return null;
}
