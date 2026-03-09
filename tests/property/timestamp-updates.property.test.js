/**
 * Property-based tests for timestamp update on reputation change
 *
 * Feature: npc-foundation, Property 15: Timestamp update on reputation change
 * Validates: Requirements 3.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Timestamp Update Properties', () => {
  it('should update lastInteraction timestamp to current game day when reputation changes', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 0, max: 100 }), // Current game day
        fc.integer({ min: -10, max: 10 }), // Reputation change
        (npcId, currentDay, reputationChange) => {
          // Set game day
          game.state.player.daysElapsed = currentDay;

          // Set up NPC state with different lastInteraction timestamp
          const oldTimestamp = currentDay - 10; // 10 days ago
          const npcState = game.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = oldTimestamp;

          // Apply reputation change
          game.modifyRep(npcId, reputationChange, 'test');

          // Check that lastInteraction was updated to current day
          const updatedTimestamp =
            game.state.npcs[npcId].lastInteraction;
          expect(updatedTimestamp).toBe(currentDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp for both positive and negative reputation changes', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 10, max: 100 }), // Current game day
        fc.integer({ min: -20, max: -1 }), // Negative reputation change
        (npcId, currentDay, reputationChange) => {
          // Set game day
          game.state.player.daysElapsed = currentDay;

          // Set up NPC state with old timestamp
          const oldTimestamp = currentDay - 5;
          const npcState = game.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = oldTimestamp;

          // Apply negative reputation change
          game.modifyRep(npcId, reputationChange, 'test');

          // Check that timestamp was updated even for negative changes
          const updatedTimestamp =
            game.state.npcs[npcId].lastInteraction;
          expect(updatedTimestamp).toBe(currentDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp for multiple interactions on the same day', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 20, max: 100 }), // Current game day
        fc.array(fc.integer({ min: -5, max: 5 }), {
          minLength: 2,
          maxLength: 5,
        }), // Multiple reputation changes
        (npcId, currentDay, reputationChanges) => {
          // Set game day
          game.state.player.daysElapsed = currentDay;

          // Set up NPC state with old timestamp
          const oldTimestamp = currentDay - 15;
          const npcState = game.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = oldTimestamp;

          // Apply multiple reputation changes on the same day
          for (const change of reputationChanges) {
            game.modifyRep(npcId, change, 'test');

            // After each change, timestamp should be current day
            const currentTimestamp =
              game.state.npcs[npcId].lastInteraction;
            expect(currentTimestamp).toBe(currentDay);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp when game day advances between interactions', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map((npc) => npc.id)), // Valid NPC ID
        fc.integer({ min: 10, max: 50 }), // Starting game day
        fc.integer({ min: 1, max: 10 }), // Days to advance
        (npcId, startDay, daysAdvance) => {
          // Set initial game day
          game.state.player.daysElapsed = startDay;

          // Set up NPC state
          const npcState = game.getNPCState(npcId);
          npcState.rep = 0;
          npcState.lastInteraction = startDay - 5;

          // First interaction
          game.modifyRep(npcId, 1, 'test');
          const firstTimestamp =
            game.state.npcs[npcId].lastInteraction;

          // Advance game time
          const newDay = startDay + daysAdvance;
          game.state.player.daysElapsed = newDay;

          // Second interaction
          game.modifyRep(npcId, 1, 'test');
          const secondTimestamp =
            game.state.npcs[npcId].lastInteraction;

          // First timestamp should be start day, second should be new day
          expect(firstTimestamp).toBe(startDay);
          expect(secondTimestamp).toBe(newDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain separate timestamps for different NPCs', () => {
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();

    // Use first two NPCs for testing
    const npc1Id = ALL_NPCS[0].id;
    const npc2Id = ALL_NPCS[1].id;

    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 100 }), // Game day for NPC 1 interaction
        fc.integer({ min: 1, max: 10 }), // Days to advance before NPC 2 interaction
        (day1, dayAdvance) => {
          const day2 = day1 + dayAdvance;

          // Set up both NPCs with old timestamps
          const npc1State = game.getNPCState(npc1Id);
          npc1State.rep = 0;
          npc1State.lastInteraction = day1 - 10;

          const npc2State = game.getNPCState(npc2Id);
          npc2State.rep = 0;
          npc2State.lastInteraction = day2 - 10;

          // Interact with NPC 1 on day1
          game.state.player.daysElapsed = day1;
          game.modifyRep(npc1Id, 1, 'test');

          // Advance time and interact with NPC 2 on day2
          game.state.player.daysElapsed = day2;
          game.modifyRep(npc2Id, 1, 'test');

          // Check that each NPC has the correct timestamp
          const npc1Timestamp =
            game.state.npcs[npc1Id].lastInteraction;
          const npc2Timestamp =
            game.state.npcs[npc2Id].lastInteraction;

          expect(npc1Timestamp).toBe(day1);
          expect(npc2Timestamp).toBe(day2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
