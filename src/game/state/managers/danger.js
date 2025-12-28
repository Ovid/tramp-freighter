import { BaseManager } from './base-manager.js';
import { DANGER_CONFIG, calculateDistanceFromSol } from '../../constants.js';

/**
 * DangerManager - Handles danger zone classification and encounter mechanics
 *
 * Danger zones classify star systems based on pirate activity and law enforcement:
 * - Safe: Core systems with strong law enforcement presence
 * - Contested: Systems with mixed control and moderate risk
 * - Dangerous: Frontier systems with high pirate activity
 *
 * Classification is deterministic based on:
 * 1. Explicit system lists in DANGER_CONFIG (safe, contested)
 * 2. Distance from Sol (systems beyond threshold are dangerous)
 *
 * Feature: danger-system
 * Validates: Requirements 1.1, 1.2, 1.10, 1.11, 1.12
 */
export class DangerManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Get the danger zone classification for a star system
   *
   * Classification priority:
   * 1. Check if system is explicitly listed as safe
   * 2. Check if system is explicitly listed as contested
   * 3. Check if system is beyond distance threshold (dangerous)
   * 4. Default to contested for unlisted systems within threshold
   *
   * @param {number} systemId - The star system ID to classify
   * @returns {string} Zone type: 'safe', 'contested', or 'dangerous'
   */
  getDangerZone(systemId) {
    const { ZONES } = DANGER_CONFIG;

    // Check explicit safe systems first
    if (ZONES.safe.systems.includes(systemId)) {
      return 'safe';
    }

    // Check explicit contested systems
    if (ZONES.contested.systems.includes(systemId)) {
      return 'contested';
    }

    // Check distance-based dangerous classification
    const system = this.getStarData().find((s) => s.id === systemId);
    if (system) {
      const distance = calculateDistanceFromSol(system);
      if (distance > ZONES.dangerous.distanceThreshold) {
        return 'dangerous';
      }
    }

    // Default to contested for unlisted systems within threshold
    return 'contested';
  }
}
