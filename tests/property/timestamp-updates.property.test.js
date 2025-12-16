/**
 * Property-based tests for timestamp update on reputation change
 *
 * Feature: npc-foundation, Property 15: Timestamp update on reputation change
 * Validates: Requirements 3.5
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Timestamp Update Properties', () => {
  it('should update lastInteraction timestamp to current game day when reputation changes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 0, max: 100 }), // Current game day
        fc.integer({ min: -10, max: 10 }), // Reputation change
        (npcId, currentDay, reputationChange) => {
          // Set game day
          gameStateManager.state.player.daysElapsed = currentDay;

          // Set up NPC state with different lastInteraction timestamp
          const oldTimestamp = currentDay - 10; // 10 days ago
          gameStateManager.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: oldTimestamp,
            flags: [],
            interactions: 0,
          };

          // Apply reputation change
          gameStateManager.modifyRep(npcId, reputationChange, 'test');

          // Check that lastInteraction was updated to current day
          const updatedTimestamp = gameStateManager.state.npcs[npcId].lastInteraction;
          return updatedTimestamp === currentDay;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp for both positive and negative reputation changes', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 10, max: 100 }), // Current game day
        fc.integer({ min: -20, max: -1 }), // Negative reputation change
        (npcId, currentDay, reputationChange) => {
          // Set game day
          gameStateManager.state.player.daysElapsed = currentDay;

          // Set up NPC state with old timestamp
          const oldTimestamp = currentDay - 5;
          gameStateManager.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: oldTimestamp,
            flags: [],
            interactions: 0,
          };

          // Apply negative reputation change
          gameStateManager.modifyRep(npcId, reputationChange, 'test');

          // Check that timestamp was updated even for negative changes
          const updatedTimestamp = gameStateManager.state.npcs[npcId].lastInteraction;
          return updatedTimestamp === currentDay;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp for multiple interactions on the same day', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 20, max: 100 }), // Current game day
        fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 2, maxLength: 5 }), // Multiple reputation changes
        (npcId, currentDay, reputationChanges) => {
          // Set game day
          gameStateManager.state.player.daysElapsed = currentDay;

          // Set up NPC state with old timestamp
          const oldTimestamp = currentDay - 15;
          gameStateManager.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: oldTimestamp,
            flags: [],
            interactions: 0,
          };

          // Apply multiple reputation changes on the same day
          for (const change of reputationChanges) {
            gameStateManager.modifyRep(npcId, change, 'test');
            
            // After each change, timestamp should be current day
            const currentTimestamp = gameStateManager.state.npcs[npcId].lastInteraction;
            if (currentTimestamp !== currentDay) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update timestamp when game day advances between interactions', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_NPCS.map(npc => npc.id)), // Valid NPC ID
        fc.integer({ min: 10, max: 50 }), // Starting game day
        fc.integer({ min: 1, max: 10 }), // Days to advance
        (npcId, startDay, daysAdvance) => {
          // Set initial game day
          gameStateManager.state.player.daysElapsed = startDay;

          // Set up NPC state
          gameStateManager.state.npcs[npcId] = {
            rep: 0,
            lastInteraction: startDay - 5,
            flags: [],
            interactions: 0,
          };

          // First interaction
          gameStateManager.modifyRep(npcId, 1, 'test');
          const firstTimestamp = gameStateManager.state.npcs[npcId].lastInteraction;

          // Advance game time
          const newDay = startDay + daysAdvance;
          gameStateManager.state.player.daysElapsed = newDay;

          // Second interaction
          gameStateManager.modifyRep(npcId, 1, 'test');
          const secondTimestamp = gameStateManager.state.npcs[npcId].lastInteraction;

          // First timestamp should be start day, second should be new day
          return firstTimestamp === startDay && secondTimestamp === newDay;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain separate timestamps for different NPCs', () => {
    const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

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
          gameStateManager.state.npcs[npc1Id] = {
            rep: 0,
            lastInteraction: day1 - 10,
            flags: [],
            interactions: 0,
          };
          gameStateManager.state.npcs[npc2Id] = {
            rep: 0,
            lastInteraction: day2 - 10,
            flags: [],
            interactions: 0,
          };

          // Interact with NPC 1 on day1
          gameStateManager.state.player.daysElapsed = day1;
          gameStateManager.modifyRep(npc1Id, 1, 'test');

          // Advance time and interact with NPC 2 on day2
          gameStateManager.state.player.daysElapsed = day2;
          gameStateManager.modifyRep(npc2Id, 1, 'test');

          // Check that each NPC has the correct timestamp
          const npc1Timestamp = gameStateManager.state.npcs[npc1Id].lastInteraction;
          const npc2Timestamp = gameStateManager.state.npcs[npc2Id].lastInteraction;

          return npc1Timestamp === day1 && npc2Timestamp === day2;
        }
      ),
      { numRuns: 100 }
    );
  });
});