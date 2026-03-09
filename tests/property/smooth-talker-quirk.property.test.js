/**
 * Property-based tests for smooth talker quirk bonus
 *
 * Feature: npc-foundation, Property 7: Smooth talker quirk bonus
 * Validates: Requirements 3.3
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Smooth Talker Quirk Properties', () => {
  it('should apply 1.05 multiplier to positive reputation gains when smooth_talker quirk is present', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 1, max: 50 }), // Positive reputation gain
        (npcId, reputationGain) => {
          // Get NPC data to check trust value
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
          const trustValue = npcData.personality.trust;

          // Set up NPC state with known initial reputation
          const initialRep = 0;
          const npcState = game.getNPCState(npcId);
          npcState.rep = initialRep;
          npcState.lastInteraction = 0;

          // Ensure smooth_talker quirk is present
          if (!game.state.ship.quirks.includes('smooth_talker')) {
            game.state.ship.quirks.push('smooth_talker');
          }

          // Apply reputation change
          game.modifyRep(npcId, reputationGain, 'test');

          // Calculate expected reputation after trust modifier and smooth_talker bonus and rounding
          const expectedGain = reputationGain * trustValue * 1.05;
          const expectedFinalRep = initialRep + expectedGain;
          const actualFinalRep = game.state.npcs[npcId].rep;

          // Expected value should be rounded and clamped
          const clampedExpected = Math.max(
            -100,
            Math.min(100, Math.round(expectedFinalRep))
          );
          return actualFinalRep === clampedExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply smooth_talker bonus to negative reputation changes', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: -50, max: -1 }), // Negative reputation change
        (npcId, reputationChange) => {
          // Set up NPC state with known initial reputation
          const initialRep = 0;
          const npcState = game.getNPCState(npcId);
          npcState.rep = initialRep;
          npcState.lastInteraction = 0;

          // Ensure smooth_talker quirk is present
          if (!game.state.ship.quirks.includes('smooth_talker')) {
            game.state.ship.quirks.push('smooth_talker');
          }

          // Apply reputation change
          game.modifyRep(npcId, reputationChange, 'test');

          // For negative changes, no smooth_talker bonus should be applied
          const expectedFinalRep = initialRep + reputationChange;
          const actualFinalRep = game.state.npcs[npcId].rep;

          // Allow for clamping
          const clampedExpected = Math.max(
            -100,
            Math.min(100, expectedFinalRep)
          );
          return actualFinalRep === clampedExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide larger reputation gains with smooth_talker than without', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 10, max: 50 }), // Positive reputation gain
        (npcId, reputationGain) => {
          // Test without smooth_talker quirk
          const game1 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game1.initNewGame();
          game1.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };
          // Remove smooth_talker quirk
          game1.state.ship.quirks =
            game1.state.ship.quirks.filter(
              (quirk) => quirk !== 'smooth_talker'
            );
          game1.modifyRep(npcId, reputationGain, 'test');
          const repWithoutQuirk = game1.state.npcs[npcId].rep;

          // Test with smooth_talker quirk
          const game2 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game2.initNewGame();
          game2.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };
          // Ensure smooth_talker quirk is present
          if (!game2.state.ship.quirks.includes('smooth_talker')) {
            game2.state.ship.quirks.push('smooth_talker');
          }
          game2.modifyRep(npcId, reputationGain, 'test');
          const repWithQuirk = game2.state.npcs[npcId].rep;

          // Reputation with quirk should be higher (unless clamped at 100)
          return repWithQuirk >= repWithoutQuirk;
        }
      ),
      { numRuns: 100 }
    );
  });
});
