import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

/**
 * Property-based tests for tip availability rules
 *
 * Feature: npc-benefits, Property 2: Tip Availability Rules
 * Validates: Requirements 2.1, 2.3, 2.5, 2.6
 */

describe('Tip Availability Rules Property Tests', () => {
  let gameStateManager;

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

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for reputation values
  const arbReputation = () => fc.integer({ min: -100, max: 100 });

  // Generator for day values
  const arbDay = () => fc.integer({ min: 0, max: 1000 });

  it('should return available=true only when all conditions are met', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbReputation(),
        arbDay(),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, reputation, currentDay, randomValue) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Set current day
            testGameStateManager.updateTime(currentDay);

            // Get NPC data and state
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
            const npcState = testGameStateManager.getNPCState(npcId);

            // Set reputation
            npcState.rep = reputation;

            // Test case 1: No previous tip (lastTipDay = null)
            npcState.lastTipDay = null;

            const result1 = testGameStateManager.canGetTip(npcId);

            // Should be available if and only if:
            // 1. Reputation >= 10 (Warm tier)
            // 2. NPC has non-empty tips array
            const hasWarmRep = reputation >= 10;
            const hasTips = !!(npcData.tips && npcData.tips.length > 0);
            const expectedAvailable1 = hasWarmRep && hasTips;

            expect(result1.available).toBe(expectedAvailable1);

            if (!expectedAvailable1) {
              expect(result1.reason).toBeTruthy();
              expect(typeof result1.reason).toBe('string');
              // Verify the reason matches the specific failure
              if (!hasWarmRep) {
                expect(result1.reason).toContain('Warm relationship');
              } else if (!hasTips) {
                expect(result1.reason).toContain('no tips available');
              }
            } else {
              expect(result1.reason).toBeNull();
            }

            // Test case 2: Previous tip within cooldown period (only test if other conditions are met)
            if (
              currentDay >= NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS &&
              hasWarmRep &&
              hasTips
            ) {
              const recentTipDay =
                currentDay - NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS + 1;
              npcState.lastTipDay = recentTipDay;

              const result2 = testGameStateManager.canGetTip(npcId);

              // Should not be available due to cooldown when other conditions are met
              expect(result2.available).toBe(false);
              expect(result2.reason).toBeTruthy();
              expect(result2.reason).toContain('cooldown');
            }

            // Test case 3: Previous tip outside cooldown period (only test if other conditions are met)
            if (
              currentDay >= NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS &&
              hasWarmRep &&
              hasTips
            ) {
              const oldTipDay =
                currentDay - NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS;
              npcState.lastTipDay = oldTipDay;

              const result3 = testGameStateManager.canGetTip(npcId);

              // Should follow same rules as case 1 (cooldown has passed)
              const expectedAvailable3 = hasWarmRep && hasTips;
              expect(result3.available).toBe(expectedAvailable3);

              if (!expectedAvailable3) {
                expect(result3.reason).toBeTruthy();
                expect(typeof result3.reason).toBe('string');
              } else {
                expect(result3.reason).toBeNull();
              }
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should require Warm tier reputation (rep >= 10)', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        fc.integer({ min: -100, max: 9 }),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, lowReputation, randomValue) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Get NPC data to check if it has tips
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

            // Only test NPCs that have tips (otherwise they'd fail for different reason)
            if (npcData.tips && npcData.tips.length > 0) {
              const npcState = testGameStateManager.getNPCState(npcId);
              npcState.rep = lowReputation;
              npcState.lastTipDay = null; // No cooldown

              const result = testGameStateManager.canGetTip(npcId);

              expect(result.available).toBe(false);
              expect(result.reason).toBeTruthy();
              expect(result.reason).toContain('Warm relationship');
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should require non-empty tips array', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        fc.integer({ min: 10, max: 100 }),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, highReputation, randomValue) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Get NPC data to check if it has tips
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

            // Only test NPCs that don't have tips
            if (!npcData.tips || npcData.tips.length === 0) {
              const npcState = testGameStateManager.getNPCState(npcId);
              npcState.rep = highReputation; // High enough reputation
              npcState.lastTipDay = null; // No cooldown

              const result = testGameStateManager.canGetTip(npcId);

              expect(result.available).toBe(false);
              expect(result.reason).toBeTruthy();
              expect(result.reason).toContain('no tips available');
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should enforce tip cooldown period', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        fc.integer({ min: 10, max: 1000 }),
        fc.integer({ min: 1, max: NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS - 1 }),
        fc.float({ min: 0, max: Math.fround(0.99999) }), // Deterministic "random" value
        (npcId, currentDay, daysSinceLastTip, randomValue) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock Math.random for deterministic behavior
          const originalMathRandom = Math.random;
          Math.random = vi.fn(() => randomValue);

          try {
            // Get NPC data to check if it has tips
            const npcData = ALL_NPCS.find((npc) => npc.id === npcId);

            // Only test NPCs that have tips
            if (npcData.tips && npcData.tips.length > 0) {
              testGameStateManager.updateTime(currentDay);

              const npcState = testGameStateManager.getNPCState(npcId);
              npcState.rep = 50; // High enough reputation
              npcState.lastTipDay = currentDay - daysSinceLastTip;

              const result = testGameStateManager.canGetTip(npcId);

              // Should not be available due to cooldown
              expect(result.available).toBe(false);
              expect(result.reason).toBeTruthy();
              expect(result.reason).toContain('cooldown');

              // Should show correct days remaining
              const expectedDaysRemaining =
                NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS - daysSinceLastTip;
              expect(result.reason).toContain(expectedDaysRemaining.toString());
            }
          } finally {
            // Restore Math.random
            Math.random = originalMathRandom;
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
