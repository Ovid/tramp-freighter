import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

/**
 * Property-based tests for NPC state initialization
 *
 * Feature: npc-benefits, Property: NPC state includes all benefit tracking fields
 * Validates: Requirements 2.2, 3.5, 3.6, 3.7
 */

describe('NPC State Initialization Property Tests', () => {
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

  it('should initialize NPC state with all benefit tracking fields', () => {
    fc.assert(
      fc.property(arbNPCId(), (npcId) => {
        // Get NPC state (this will initialize it if it doesn't exist)
        const npcState = gameStateManager.getNPCState(npcId);

        // Verify all original NPC state fields exist
        expect(npcState).toHaveProperty('rep');
        expect(npcState).toHaveProperty('lastInteraction');
        expect(npcState).toHaveProperty('flags');
        expect(npcState).toHaveProperty('interactions');

        // Verify all new benefit tracking fields exist
        expect(npcState).toHaveProperty('lastTipDay');
        expect(npcState).toHaveProperty('lastFavorDay');
        expect(npcState).toHaveProperty('loanAmount');
        expect(npcState).toHaveProperty('loanDay');
        expect(npcState).toHaveProperty('storedCargo');
        expect(npcState).toHaveProperty('lastFreeRepairDay');

        // Verify field types and initial values
        expect(typeof npcState.rep).toBe('number');
        expect(typeof npcState.lastInteraction).toBe('number');
        expect(Array.isArray(npcState.flags)).toBe(true);
        expect(typeof npcState.interactions).toBe('number');

        // Verify benefit tracking fields have correct initial values
        expect(npcState.lastTipDay).toBeNull();
        expect(npcState.lastFavorDay).toBeNull();
        expect(npcState.loanAmount).toBeNull();
        expect(npcState.loanDay).toBeNull();
        expect(Array.isArray(npcState.storedCargo)).toBe(true);
        expect(npcState.storedCargo).toEqual([]);
        expect(npcState.lastFreeRepairDay).toBeNull();

        // Verify reputation is set to NPC's initial reputation
        const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
        expect(npcState.rep).toBe(npcData.initialRep);

        // Verify interaction count starts at 0
        expect(npcState.interactions).toBe(0);

        // Verify flags array starts empty
        expect(npcState.flags).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve existing NPC state when accessing again', () => {
    fc.assert(
      fc.property(arbNPCId(), (npcId) => {
        // Create a fresh GameStateManager for this test iteration
        const testGameStateManager = new GameStateManager(
          STAR_DATA,
          WORMHOLE_DATA
        );
        testGameStateManager.initNewGame();

        // Get NPC state for the first time (initializes it)
        const firstAccess = testGameStateManager.getNPCState(npcId);

        // Modify some values to test preservation
        firstAccess.rep = 50;
        firstAccess.interactions = 5;
        firstAccess.flags.push('test_flag');
        firstAccess.lastTipDay = 10;
        firstAccess.lastFavorDay = 20;
        firstAccess.loanAmount = 500;
        firstAccess.loanDay = 15;
        firstAccess.storedCargo.push({ good: 'grain', qty: 5 });
        firstAccess.lastFreeRepairDay = 25;

        // Get NPC state again
        const secondAccess = testGameStateManager.getNPCState(npcId);

        // Verify it's the same object (not re-initialized)
        expect(secondAccess).toBe(firstAccess);

        // Verify all modified values are preserved
        expect(secondAccess.rep).toBe(50);
        expect(secondAccess.interactions).toBe(5);
        expect(secondAccess.flags).toEqual(['test_flag']);
        expect(secondAccess.lastTipDay).toBe(10);
        expect(secondAccess.lastFavorDay).toBe(20);
        expect(secondAccess.loanAmount).toBe(500);
        expect(secondAccess.loanDay).toBe(15);
        expect(secondAccess.storedCargo).toEqual([{ good: 'grain', qty: 5 }]);
        expect(secondAccess.lastFreeRepairDay).toBe(25);
      }),
      { numRuns: 50 }
    );
  });

  it('should initialize different NPCs with independent state', () => {
    fc.assert(
      fc.property(
        fc.tuple(arbNPCId(), arbNPCId()).filter(([id1, id2]) => id1 !== id2),
        ([npcId1, npcId2]) => {
          // Create a fresh GameStateManager for this test iteration
          const testGameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          testGameStateManager.initNewGame();

          // Get state for both NPCs
          const npcState1 = testGameStateManager.getNPCState(npcId1);
          const npcState2 = testGameStateManager.getNPCState(npcId2);

          // Verify they are different objects
          expect(npcState1).not.toBe(npcState2);

          // Modify first NPC's state
          npcState1.rep = 75;
          npcState1.lastTipDay = 30;
          npcState1.loanAmount = 1000;
          npcState1.storedCargo.push({ good: 'electronics', qty: 3 });

          // Verify second NPC's state is unaffected
          const npcData2 = ALL_NPCS.find((npc) => npc.id === npcId2);
          expect(npcState2.rep).toBe(npcData2.initialRep);
          expect(npcState2.lastTipDay).toBeNull();
          expect(npcState2.loanAmount).toBeNull();
          expect(npcState2.storedCargo).toEqual([]);

          // Verify first NPC's state retains modifications
          expect(npcState1.rep).toBe(75);
          expect(npcState1.lastTipDay).toBe(30);
          expect(npcState1.loanAmount).toBe(1000);
          expect(npcState1.storedCargo).toEqual([
            { good: 'electronics', qty: 3 },
          ]);
        }
      ),
      { numRuns: 50 }
    );
  });
});
