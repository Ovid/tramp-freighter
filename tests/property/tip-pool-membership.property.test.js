import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

/**
 * Property-based tests for tip pool membership
 *
 * Feature: npc-benefits, Property 4: Tip Pool Membership
 * Validates: Requirements 2.4
 */

describe('Tip Pool Membership Property Tests', () => {
  let game;

  beforeEach(() => {
    // Mock localStorage with Vitest
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    vi.stubGlobal('localStorage', localStorageMock);

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Generator for valid NPC IDs
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for day values
  const arbDay = () => fc.integer({ min: 0, max: 1000 });

  it('should return tips that are members of the NPCs tips array', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbDay(),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, currentDay, randomValue) => {
          // Create a fresh GameCoordinator for this test iteration
          const testGameCoordinator = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameCoordinator.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Get NPC data
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

            // Only test NPCs that have tips
            if (npcData.tips && npcData.tips.length > 0) {
              testGameCoordinator.updateTime(currentDay);

              // Set up NPC state for successful tip
              const npcState = testGameCoordinator.getNPCState(npcId);
              npcState.rep = 50; // High enough reputation (Warm tier)
              npcState.lastTipDay = null; // No previous tip

              // Get tip
              const tip = testGameCoordinator.getTip(npcId);

              // Verify tip was returned and is from the correct pool
              expect(tip).toBeTruthy();
              expect(typeof tip).toBe('string');
              expect(tip.length).toBeGreaterThan(0);
              expect(npcData.tips).toContain(tip);
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when NPC has no tips array', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbDay(),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, currentDay, randomValue) => {
          // Create a fresh GameCoordinator for this test iteration
          const testGameCoordinator = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameCoordinator.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Get NPC data
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

            // Only test NPCs that don't have tips
            if (!npcData.tips || npcData.tips.length === 0) {
              testGameCoordinator.updateTime(currentDay);

              // Set up NPC state with high reputation (other conditions met)
              const npcState = testGameCoordinator.getNPCState(npcId);
              npcState.rep = 50; // High enough reputation
              npcState.lastTipDay = null; // No cooldown

              // Verify canGetTip returns false due to no tips
              const availability = testGameCoordinator.canGetTip(npcId);
              expect(availability.available).toBe(false);
              expect(availability.reason).toContain('no tips available');

              // Verify getTip returns null
              const tip = testGameCoordinator.getTip(npcId);
              expect(tip).toBeNull();
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when NPC has empty tips array', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbDay(),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, currentDay, randomValue) => {
          // Create a fresh GameCoordinator for this test iteration
          const testGameCoordinator = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameCoordinator.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Get NPC data
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

            // Only test NPCs that have empty tips array
            if (npcData.tips && npcData.tips.length === 0) {
              testGameCoordinator.updateTime(currentDay);

              // Set up NPC state with high reputation (other conditions met)
              const npcState = testGameCoordinator.getNPCState(npcId);
              npcState.rep = 50; // High enough reputation
              npcState.lastTipDay = null; // No cooldown

              // Verify canGetTip returns false due to empty tips
              const availability = testGameCoordinator.canGetTip(npcId);
              expect(availability.available).toBe(false);
              expect(availability.reason).toContain('no tips available');

              // Verify getTip returns null
              const tip = testGameCoordinator.getTip(npcId);
              expect(tip).toBeNull();
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should select tips deterministically based on random seed', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbDay(),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, currentDay, randomValue) => {
          // Create a fresh GameCoordinator for this test iteration
          const testGameCoordinator = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameCoordinator.initNewGame();

          // Get NPC data
          const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

          // Only test NPCs that have multiple tips (to test selection logic)
          if (npcData.tips && npcData.tips.length > 1) {
            testGameCoordinator.updateTime(currentDay);

            // Set up NPC state for successful tips
            const npcState = testGameCoordinator.getNPCState(npcId);
            npcState.rep = 50; // High enough reputation
            npcState.lastTipDay = null; // No previous tip

            // Mock Math.random for deterministic behavior
            const originalMathRandom = Math.random;
            Math.random = vi.fn(() => randomValue);

            try {
              // Get tip with deterministic random value
              const tip1 = testGameCoordinator.getTip(npcId);
              expect(tip1).toBeTruthy();
              expect(npcData.tips).toContain(tip1);

              // Reset cooldown and get another tip with same random value
              npcState.lastTipDay = null;
              const tip2 = testGameCoordinator.getTip(npcId);
              expect(tip2).toBeTruthy();
              expect(npcData.tips).toContain(tip2);

              // With same random seed, should get same tip
              expect(tip2).toBe(tip1);
            } finally {
              // Restore Math.random
              Math.random = originalMathRandom;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
