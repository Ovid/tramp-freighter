import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

/**
 * Property-based tests for tip cooldown tracking
 *
 * Feature: npc-benefits, Property 3: Tip Cooldown Tracking
 * Validates: Requirements 2.2, 2.6
 */

describe('Tip Cooldown Tracking Property Tests', () => {
  let gameStateManager;
  let originalValidateAndGetNPCData;

  // Test-specific NPC data without modifying global state
  const testNPCs = [
    {
      id: 'test_npc_with_tips_1',
      name: 'Test NPC 1',
      role: 'Test NPC',
      system: 0,
      station: 'Test Station',
      personality: { trust: 0.5, greed: 0.5, loyalty: 0.5, morality: 0.5 },
      speechStyle: { greeting: 'casual', vocabulary: 'simple', quirk: 'none' },
      description: 'Test NPC 1 for testing',
      initialRep: 0,
      tips: ['Test tip 1A', 'Test tip 2A', 'Test tip 3A'],
    },
    {
      id: 'test_npc_with_tips_2',
      name: 'Test NPC 2',
      role: 'Test NPC',
      system: 1,
      station: 'Test Station 2',
      personality: { trust: 0.5, greed: 0.5, loyalty: 0.5, morality: 0.5 },
      speechStyle: { greeting: 'casual', vocabulary: 'simple', quirk: 'none' },
      description: 'Test NPC 2 for testing',
      initialRep: 0,
      tips: ['Test tip 1B', 'Test tip 2B', 'Test tip 3B'],
    },
  ];

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

    // Mock the private validation method to use test NPCs
    originalValidateAndGetNPCData =
      gameStateManager.npcManager._validateAndGetNPCData;
    gameStateManager.npcManager._validateAndGetNPCData = (npcId) => {
      // First check test NPCs
      const testNPC = testNPCs.find((npc) => npc.id === npcId);
      if (testNPC) {
        return testNPC;
      }
      // Fall back to original method for other NPCs
      return originalValidateAndGetNPCData.call(
        gameStateManager.npcManager,
        npcId
      );
    };
  });

  afterEach(() => {
    // Restore original method
    if (originalValidateAndGetNPCData) {
      gameStateManager.npcManager._validateAndGetNPCData =
        originalValidateAndGetNPCData;
    }
  });

  // Generator for test NPCs that have tips
  const arbNPCWithTips = () => {
    return fc.constantFrom('test_npc_with_tips_1', 'test_npc_with_tips_2');
  };

  // Generator for day values
  const arbDay = () => fc.integer({ min: 0, max: 1000 });

  it('should set lastTipDay to current game day after getTip returns non-null', () => {
    fc.assert(
      fc.property(arbNPCWithTips(), arbDay(), (npcId, currentDay) => {
        // Create a fresh GameStateManager for this test iteration
        const testGameStateManager = new GameStateManager(
          STAR_DATA,
          WORMHOLE_DATA
        );
        testGameStateManager.initNewGame();

        // Mock the validation method for this test instance
        testGameStateManager.npcManager._validateAndGetNPCData = (npcId) => {
          const testNPC = testNPCs.find((npc) => npc.id === npcId);
          if (testNPC) {
            return testNPC;
          }
          return originalValidateAndGetNPCData.call(
            testGameStateManager.npcManager,
            npcId
          );
        };

        // Set current day
        testGameStateManager.updateTime(currentDay);

        // Set up NPC state for successful tip
        const npcState = testGameStateManager.getNPCState(npcId);
        npcState.rep = 50; // High enough reputation (Warm tier)
        npcState.lastTipDay = null; // No previous tip

        // Verify tip is available
        const availability = testGameStateManager.canGetTip(npcId);
        expect(availability.available).toBe(true);

        // Get tip
        const tip = testGameStateManager.getTip(npcId);

        // Verify tip was returned
        expect(tip).toBeTruthy();
        expect(typeof tip).toBe('string');

        // Verify lastTipDay was set to current game day
        const updatedNpcState = testGameStateManager.getNPCState(npcId);
        expect(updatedNpcState.lastTipDay).toBe(currentDay);
      }),
      { numRuns: 20 }
    );
  });

  it('should prevent subsequent tips until cooldown passes', () => {
    fc.assert(
      fc.property(
        arbNPCWithTips(),
        arbDay(),
        fc.integer({ min: 1, max: NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS - 1 }),
        (npcId, initialDay, daysAdvanced) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock the validation method for this test instance
          testGameStateManager.npcManager._validateAndGetNPCData = (npcId) => {
            const testNPC = testNPCs.find((npc) => npc.id === npcId);
            if (testNPC) {
              return testNPC;
            }
            return originalValidateAndGetNPCData.call(
              testGameStateManager.npcManager,
              npcId
            );
          };

          // Set initial day
          testGameStateManager.updateTime(initialDay);

          // Set up NPC state for successful tip
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = 50; // High enough reputation
          npcState.lastTipDay = null; // No previous tip

          // Get first tip
          const firstTip = testGameStateManager.getTip(npcId);
          expect(firstTip).toBeTruthy();

          // Advance time but not enough to clear cooldown
          const newDay = initialDay + daysAdvanced;
          testGameStateManager.updateTime(newDay);

          // Verify tip is not available due to cooldown
          const availability = testGameStateManager.canGetTip(npcId);
          expect(availability.available).toBe(false);
          expect(availability.reason).toContain('cooldown');

          // Verify getTip returns null
          const secondTip = testGameStateManager.getTip(npcId);
          expect(secondTip).toBeNull();

          // Verify lastTipDay was not updated
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          expect(updatedNpcState.lastTipDay).toBe(initialDay);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should allow tips again after cooldown period passes', () => {
    fc.assert(
      fc.property(
        arbNPCWithTips(),
        arbDay(),
        fc.integer({
          min: NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS,
          max: NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS + 100,
        }),
        (npcId, initialDay, daysAdvanced) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock the validation method for this test instance
          testGameStateManager.npcManager._validateAndGetNPCData = (npcId) => {
            const testNPC = testNPCs.find((npc) => npc.id === npcId);
            if (testNPC) {
              return testNPC;
            }
            return originalValidateAndGetNPCData.call(
              testGameStateManager.npcManager,
              npcId
            );
          };

          // Set initial day
          testGameStateManager.updateTime(initialDay);

          // Set up NPC state for successful tip
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = 50; // High enough reputation
          npcState.lastTipDay = null; // No previous tip

          // Get first tip
          const firstTip = testGameStateManager.getTip(npcId);
          expect(firstTip).toBeTruthy();

          // Advance time enough to clear cooldown
          const newDay = initialDay + daysAdvanced;
          testGameStateManager.updateTime(newDay);

          // Verify tip is available again
          const availability = testGameStateManager.canGetTip(npcId);
          expect(availability.available).toBe(true);
          expect(availability.reason).toBeNull();

          // Get second tip
          const secondTip = testGameStateManager.getTip(npcId);
          expect(secondTip).toBeTruthy();
          expect(typeof secondTip).toBe('string');

          // Verify lastTipDay was updated to new day
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          expect(updatedNpcState.lastTipDay).toBe(newDay);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should track cooldown independently for different NPCs', () => {
    fc.assert(
      fc.property(arbDay(), (currentDay) => {
        // Create a fresh GameStateManager for this test iteration
        const testGameStateManager = new GameStateManager(
          STAR_DATA,
          WORMHOLE_DATA
        );
        testGameStateManager.initNewGame();

        // Mock the validation method for this test instance
        testGameStateManager.npcManager._validateAndGetNPCData = (npcId) => {
          const testNPC = testNPCs.find((npc) => npc.id === npcId);
          if (testNPC) {
            return testNPC;
          }
          return originalValidateAndGetNPCData.call(
            testGameStateManager.npcManager,
            npcId
          );
        };

        // Use our test NPCs
        const npcId1 = 'test_npc_with_tips_1';
        const npcId2 = 'test_npc_with_tips_2';

        // Set current day
        testGameStateManager.updateTime(currentDay);

        // Set up both NPCs for successful tips
        const npcState1 = testGameStateManager.getNPCState(npcId1);
        const npcState2 = testGameStateManager.getNPCState(npcId2);
        npcState1.rep = 50;
        npcState2.rep = 50;
        npcState1.lastTipDay = null;
        npcState2.lastTipDay = null;

        // Get tip from first NPC
        const tip1 = testGameStateManager.getTip(npcId1);
        expect(tip1).toBeTruthy();

        // Verify first NPC's lastTipDay was updated
        expect(testGameStateManager.getNPCState(npcId1).lastTipDay).toBe(
          currentDay
        );

        // Verify second NPC's lastTipDay was not affected
        expect(testGameStateManager.getNPCState(npcId2).lastTipDay).toBeNull();

        // Verify second NPC can still provide tip
        const availability2 = testGameStateManager.canGetTip(npcId2);
        expect(availability2.available).toBe(true);

        const tip2 = testGameStateManager.getTip(npcId2);
        expect(tip2).toBeTruthy();

        // Verify both NPCs now have lastTipDay set to current day
        expect(testGameStateManager.getNPCState(npcId1).lastTipDay).toBe(
          currentDay
        );
        expect(testGameStateManager.getNPCState(npcId2).lastTipDay).toBe(
          currentDay
        );

        // Verify both NPCs are now on cooldown
        expect(testGameStateManager.canGetTip(npcId1).available).toBe(false);
        expect(testGameStateManager.canGetTip(npcId2).available).toBe(false);
      }),
      { numRuns: 10 }
    );
  });

  it('should return null from getTip when canGetTip returns false', () => {
    fc.assert(
      fc.property(
        arbNPCWithTips(),
        fc.integer({ min: -100, max: 9 }), // Below Warm tier
        arbDay(),
        (npcId, lowReputation, currentDay) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Mock the validation method for this test instance
          testGameStateManager.npcManager._validateAndGetNPCData = (npcId) => {
            const testNPC = testNPCs.find((npc) => npc.id === npcId);
            if (testNPC) {
              return testNPC;
            }
            return originalValidateAndGetNPCData.call(
              testGameStateManager.npcManager,
              npcId
            );
          };

          testGameStateManager.updateTime(currentDay);

          // Set up NPC with low reputation (below Warm tier)
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.rep = lowReputation;
          npcState.lastTipDay = null;

          // Verify tip is not available
          const availability = testGameStateManager.canGetTip(npcId);
          expect(availability.available).toBe(false);

          // Verify getTip returns null
          const tip = testGameStateManager.getTip(npcId);
          expect(tip).toBeNull();

          // Verify lastTipDay was not modified
          const updatedNpcState = testGameStateManager.getNPCState(npcId);
          expect(updatedNpcState.lastTipDay).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  });
});
