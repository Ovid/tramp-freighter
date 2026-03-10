import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COMMODITY_TYPES,
} from '../../src/game/constants.js';

/**
 * Property-based tests for cargo storage transfer
 *
 * Feature: npc-benefits, Property 10: Cargo Storage Transfer
 * Validates: Requirements 3.6
 */

describe('Cargo Storage Transfer Property Tests', () => {
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

  // Helper function to reset GameCoordinator for each property test iteration
  const resetGameState = () => {
    const testGameCoordinator = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    testGameCoordinator.initNewGame();
    return testGameCoordinator;
  };

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for initial NPC reputation (Friendly tier or higher for storage eligibility)
  const arbFriendlyReputation = () =>
    fc.integer({
      min: REPUTATION_BOUNDS.FRIENDLY_MIN,
      max: REPUTATION_BOUNDS.MAX,
    });

  // Generator for current game day
  const arbCurrentDay = () => fc.integer({ min: 0, max: 1000 });

  // Generator for cargo arrays (up to 20 units total, various commodities)
  const arbCargoArray = () =>
    fc.array(
      fc.record({
        good: fc.constantFrom(...COMMODITY_TYPES),
        qty: fc.integer({ min: 1, max: 10 }),
        buyPrice: fc.integer({ min: 50, max: 200 }),
        buySystem: fc.integer({ min: 1, max: 8 }),
        buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Sirius A'),
        buyDate: fc.integer({ min: 0, max: 100 }),
      }),
      { minLength: 1, maxLength: 5 }
    );

  it('should remove up to 10 cargo units from ship when storeCargo is called', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFriendlyReputation(),
        arbCurrentDay(),
        arbCargoArray(),
        (npcId, reputation, currentDay, cargoToStore) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set reputation to Friendly tier or higher
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no recent favor
          npcState.lastFavorDay = null;

          // Set up ship cargo
          const initialShipCargo = [...cargoToStore];
          testGameCoordinator.updateCargo(initialShipCargo);

          // Calculate initial cargo quantities
          const initialShipCargoTotal = initialShipCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          const initialNPCStoredCargo = [...(npcState.storedCargo || [])];
          const initialNPCStoredTotal = initialNPCStoredCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Store cargo with NPC
          const result = testGameCoordinator.storeCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Get final state
          const finalShipCargo = testGameCoordinator.getState().ship.cargo;
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          const finalNPCStoredCargo = finalNPCState.storedCargo || [];

          // Calculate final cargo quantities
          const finalShipCargoTotal = finalShipCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          const finalNPCStoredTotal = finalNPCStoredCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Up to 10 cargo units should be removed from ship
          const cargoRemoved = initialShipCargoTotal - finalShipCargoTotal;
          const expectedCargoRemoved = Math.min(
            initialShipCargoTotal,
            NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT
          );
          expect(cargoRemoved).toBe(expectedCargoRemoved);

          // Cargo should be added to NPC's storedCargo array
          const cargoAdded = finalNPCStoredTotal - initialNPCStoredTotal;
          expect(cargoAdded).toBe(cargoRemoved);

          // Conservation: ship cargo + NPC stored cargo should equal initial ship cargo
          expect(finalShipCargoTotal + finalNPCStoredTotal).toBe(
            initialShipCargoTotal + initialNPCStoredTotal
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should add removed cargo to NPC storedCargo array', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFriendlyReputation(),
        arbCurrentDay(),
        arbCargoArray(),
        (npcId, reputation, currentDay, cargoToStore) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set reputation to Friendly tier or higher
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no recent favor
          npcState.lastFavorDay = null;

          // Set up ship cargo
          const initialShipCargo = [...cargoToStore];
          testGameCoordinator.updateCargo(initialShipCargo);

          // Record initial NPC stored cargo
          const initialNPCStoredCargo = [...(npcState.storedCargo || [])];

          // Store cargo with NPC
          const result = testGameCoordinator.storeCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Get final NPC state
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          const finalNPCStoredCargo = finalNPCState.storedCargo || [];

          // NPC should have stored cargo
          expect(finalNPCStoredCargo.length).toBeGreaterThanOrEqual(
            initialNPCStoredCargo.length
          );

          // Total stored cargo should not exceed what was available to store
          const finalStoredTotal = finalNPCStoredCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          const initialStoredTotal = initialNPCStoredCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          const initialShipTotal = initialShipCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          const maxPossibleStored = Math.min(
            initialShipTotal,
            NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT
          );
          expect(finalStoredTotal - initialStoredTotal).toBeLessThanOrEqual(
            maxPossibleStored
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update lastFavorDay when cargo is stored', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFriendlyReputation(),
        arbCurrentDay(),
        arbCargoArray(),
        (npcId, reputation, currentDay, cargoToStore) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set reputation to Friendly tier or higher
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no recent favor
          npcState.lastFavorDay = null;

          // Set up ship cargo
          testGameCoordinator.updateCargo(cargoToStore);

          // Store cargo with NPC
          const result = testGameCoordinator.storeCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // lastFavorDay should be set to current day
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          expect(finalNPCState.lastFavorDay).toBe(currentDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect cargo storage limit of 10 units', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbFriendlyReputation(),
        arbCurrentDay(),
        (npcId, reputation, currentDay) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set reputation to Friendly tier or higher
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = reputation;

          // Ensure no recent favor
          npcState.lastFavorDay = null;

          // Create cargo with more than 10 units
          const largeCargo = [
            {
              good: 'grain',
              qty: 15,
              buyPrice: 100,
              buySystem: 1,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ];
          testGameCoordinator.updateCargo(largeCargo);

          // Store cargo with NPC
          const result = testGameCoordinator.storeCargo(npcId, largeCargo);

          // Should succeed
          expect(result.success).toBe(true);

          // Should store exactly 10 units (the limit)
          expect(result.stored).toBe(NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT);

          // Ship should have 5 units remaining
          const finalShipCargo = testGameCoordinator.getState().ship.cargo;
          const finalShipTotal = finalShipCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          expect(finalShipTotal).toBe(
            15 - NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should fail gracefully when NPC is below Friendly tier', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        fc.integer({
          min: REPUTATION_BOUNDS.MIN,
          max: REPUTATION_BOUNDS.FRIENDLY_MIN - 1,
        }),
        arbCurrentDay(),
        arbCargoArray(),
        (npcId, lowReputation, currentDay, cargoToStore) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set reputation below Friendly tier
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.rep = lowReputation;

          // Set up ship cargo
          testGameCoordinator.updateCargo(cargoToStore);

          // Record initial state
          const initialShipCargo = [
            ...testGameCoordinator.getState().ship.cargo,
          ];
          const initialNPCStoredCargo = [...(npcState.storedCargo || [])];

          // Attempt to store cargo should fail
          const result = testGameCoordinator.storeCargo(npcId, cargoToStore);

          // Should fail
          expect(result.success).toBe(false);
          expect(result.message).toBeTruthy();
          expect(typeof result.message).toBe('string');

          // No state should be modified
          const finalShipCargo = testGameCoordinator.getState().ship.cargo;
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          const finalNPCStoredCargo = finalNPCState.storedCargo || [];

          expect(finalShipCargo).toEqual(initialShipCargo);
          expect(finalNPCStoredCargo).toEqual(initialNPCStoredCargo);
          expect(finalNPCState.lastFavorDay).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
