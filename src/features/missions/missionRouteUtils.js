import { getShortestPath } from '@game/utils/wormhole-graph.js';

/**
 * Calculate route indicator data for a mission destination.
 *
 * Sums actual per-hop jump times rather than estimating from straight-line
 * distance, because wormhole routes can be indirect.
 *
 * @param {number} fromSystemId - Origin system ID (player's current system)
 * @param {number} toSystemId - Destination system ID
 * @param {Array} starData - Array of star system objects with id, x, y, z
 * @param {Object} navigationSystem - NavigationSystem instance with calculateDistanceBetween/calculateJumpTime
 * @returns {{ hops: number, totalDays: number } | null} Route data, or null if unreachable or same system
 */
export function calculateRouteIndicator(
  fromSystemId,
  toSystemId,
  starData,
  navigationSystem
) {
  if (fromSystemId === toSystemId) return null;

  const route = getShortestPath(fromSystemId, toSystemId);
  if (!route || route.hops === 0) return null;

  let totalDays = 0;
  for (let i = 0; i < route.path.length - 1; i++) {
    const from = starData.find((s) => s.id === route.path[i]);
    const to = starData.find((s) => s.id === route.path[i + 1]);
    const distance = navigationSystem.calculateDistanceBetween(from, to);
    totalDays += navigationSystem.calculateJumpTime(distance);
  }

  return { hops: route.hops, totalDays };
}

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
