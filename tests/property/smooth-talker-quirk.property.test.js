/**
 * Property-based tests for smooth talker quirk bonus
 *
 * Feature: npc-foundation, Property 7: Smooth talker quirk bonus
 * Validates: Requirements 3.3
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Smooth Talker Quirk Properties', () => {
  it('should apply 1.05 multiplier to positive reputation gains when smooth_talker quirk is present', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 1, max: 50 }), // Positive reputation gain
        (npcId, reputationGain) => {
          // Get NPC data to check trust value
          const npcData = ALL_NPCS.find(npc => npc.id === npcId);
          const trustValue = npcData.personality.trust;

          // Set up NPC state with known initial reputation
          const initialRep = 0;
          gameStateManager.state.npcs[npcId] = {
            rep: initialRep,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };

          // Ensure smooth_talker quirk is present
          if (!gameStateManager.state.ship.quirks.includes('smooth_talker')) {
            gameStateManager.state.ship.quirks.push('smooth_talker');
          }

          // Apply reputation change
          gameStateManager.modifyRep(npcId, reputationGain, 'test');

          // Calculate expected reputation after trust modifier and smooth_talker bonus
          const expectedGain = reputationGain * trustValue * 1.05;
          const expectedFinalRep = initialRep + expectedGain;
          const actualFinalRep = gameStateManager.state.npcs[npcId].rep;

          // Allow for floating point precision and clamping
          const clampedExpected = Math.max(-100, Math.min(100, expectedFinalRep));
          return Math.abs(actualFinalRep - clampedExpected) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply smooth_talker bonus to negative reputation changes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: -50, max: -1 }), // Negative reputation change
        (npcId, reputationChange) => {
          // Set up NPC state with known initial reputation
          const initialRep = 0;
          gameStateManager.state.npcs[npcId] = {
            rep: initialRep,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };

          // Ensure smooth_talker quirk is present
          if (!gameStateManager.state.ship.quirks.includes('smooth_talker')) {
            gameStateManager.state.ship.quirks.push('smooth_talker');
          }

          // Apply reputation change
          gameStateManager.modifyRep(npcId, reputationChange, 'test');

          // For negative changes, no smooth_talker bonus should be applied
          const expectedFinalRep = initialRep + reputationChange;
          const actualFinalRep = gameStateManager.state.npcs[npcId].rep;

          // Allow for clamping
          const clampedExpected = Math.max(-100, Math.min(100, expectedFinalRep));
          return actualFinalRep === clampedExpected;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide larger reputation gains with smooth_talker than without', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 10, max: 50 }), // Positive reputation gain
        (npcId, reputationGain) => {
          // Test without smooth_talker quirk
          const gameStateManager1 = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gameStateManager1.initNewGame();
          gameStateManager1.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };
          // Remove smooth_talker quirk
          gameStateManager1.state.ship.quirks = gameStateManager1.state.ship.quirks.filter(
            quirk => quirk !== 'smooth_talker'
          );
          gameStateManager1.modifyRep(npcId, reputationGain, 'test');
          const repWithoutQuirk = gameStateManager1.state.npcs[npcId].rep;

          // Test with smooth_talker quirk
          const gameStateManager2 = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gameStateManager2.initNewGame();
          gameStateManager2.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: 0,
            flags: [],
            interactions: 0,
          };
          // Ensure smooth_talker quirk is present
          if (!gameStateManager2.state.ship.quirks.includes('smooth_talker')) {
            gameStateManager2.state.ship.quirks.push('smooth_talker');
          }
          gameStateManager2.modifyRep(npcId, reputationGain, 'test');
          const repWithQuirk = gameStateManager2.state.npcs[npcId].rep;

          // Reputation with quirk should be higher (unless clamped at 100)
          return repWithQuirk >= repWithoutQuirk;
        }
      ),
      { numRuns: 100 }
    );
  });
});