import { STAR_DATA } from '../../game/data/star-data';

/**
 * Calculate distance from Sol to a given system.
 *
 * Uses the same formula as NavigationSystem but provides a simpler
 * interface for HUD components that don't need the full NavigationSystem.
 *
 * Formula: hypot(x, y, z) / 10 (converts coordinate units to light years)
 *
 * @param {Object} system - Star system with x, y, z coordinates
 * @returns {number} Distance in light years
 */
export function calculateDistanceFromSol(system) {
  if (!system) return 0;

  const sol = STAR_DATA.find((s) => s.name === 'Sol');
  if (!sol) return 0;

  const dx = system.x - sol.x;
  const dy = system.y - sol.y;
  const dz = system.z - sol.z;

  // Distance formula: hypot / 10 to convert to light years
  return Math.sqrt(dx * dx + dy * dy + dz * dz) / 10;
}
