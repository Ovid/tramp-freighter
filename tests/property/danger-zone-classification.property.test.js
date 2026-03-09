/**
 * Property-based tests for danger zone classification consistency
 *
 * Feature: danger-system, Property 1: Danger Zone Classification Consistency
 * Validates: Requirements 1.1, 1.2, 1.10, 1.11, 1.12
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  DANGER_CONFIG,
  calculateDistanceFromSol,
} from '../../src/game/constants.js';

describe('Danger Zone Classification Properties', () => {
  it('should classify every system to exactly one zone type', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    const validZones = ['safe', 'contested', 'dangerous'];

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (systemId) => {
          const zone = game.getDangerZone(systemId);

          // Zone must be one of the valid types
          return validZones.includes(zone);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent zone for the same system', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: STAR_DATA.length - 1 }),
        (systemId) => {
          const zone1 = game.getDangerZone(systemId);
          const zone2 = game.getDangerZone(systemId);

          // Same system should always return same zone
          return zone1 === zone2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify explicitly listed systems correctly', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Safe systems from config
    for (const systemId of DANGER_CONFIG.ZONES.safe.systems) {
      expect(game.getDangerZone(systemId)).toBe('safe');
    }

    // Contested systems from config
    for (const systemId of DANGER_CONFIG.ZONES.contested.systems) {
      expect(game.getDangerZone(systemId)).toBe('contested');
    }
  });

  it('should classify distant systems as dangerous', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    const threshold = DANGER_CONFIG.ZONES.dangerous.distanceThreshold;

    // Find systems beyond the distance threshold that aren't explicitly listed
    const explicitSystems = [
      ...DANGER_CONFIG.ZONES.safe.systems,
      ...DANGER_CONFIG.ZONES.contested.systems,
    ];

    for (const system of STAR_DATA) {
      if (explicitSystems.includes(system.id)) continue;

      // Use the canonical distance calculation from constants.js
      const distance = calculateDistanceFromSol(system);

      if (distance > threshold) {
        expect(game.getDangerZone(system.id)).toBe('dangerous');
      }
    }
  });
});
