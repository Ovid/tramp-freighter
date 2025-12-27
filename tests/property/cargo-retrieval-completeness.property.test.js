import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

/**
 * Property-based tests for cargo retrieval completeness
 *
 * Feature: npc-benefits, Property 11: Cargo Retrieval Completeness
 * Validates: Requirements 3.11, 3.12, 3.13
 */

describe('Cargo Retrieval Completeness Property Tests', () => {
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

  // Helper function to reset GameStateManager for each property test iteration
  const resetGameState = () => {
    const testGameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    testGameStateManager.initNewGame();
    return testGameStateManager;
  };

  // Generator for valid NPC IDs from the game data
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  // Generator for current game day
  const arbCurrentDay = () => fc.integer({ min: 0, max: 1000 });

  // Generator for stored cargo arrays (various commodities and quantities)
  const arbStoredCargoArray = () => fc.array(
    fc.record({
      good: fc.constantFrom(...COMMODITY_TYPES),
      qty: fc.integer({ min: 1, max: 15 }),
      buyPrice: fc.integer({ min: 50, max: 200 }),
      buySystem: fc.integer({ min: 1, max: 8 }),
      buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Sirius A'),
      buyDate: fc.integer({ min: 0, max: 100 })
    }),
    { minLength: 1, maxLength: 8 }
  );

  // Generator for ship cargo capacity (remaining space)
  const arbShipCargoCapacity = () => fc.integer({ min: 0, max: 50 });

  it('should transfer min(storedCargo, availableCapacity) to ship when retrieveCargo is called', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbStoredCargoArray(),
        arbShipCargoCapacity(),
        (npcId, currentDay, storedCargo, availableCapacity) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set up stored cargo
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.storedCargo = [...storedCargo];

          // Set up ship cargo to have specific available capacity
          const maxCapacity = testGameStateManager.getState().ship.cargoCapacity;
          const usedCapacity = Math.max(0, maxCapacity - availableCapacity);
          
          // Create ship cargo to use up space, leaving availableCapacity free
          const shipCargo = [];
          let remainingToFill = usedCapacity;
          while (remainingToFill > 0) {
            const qty = Math.min(remainingToFill, 10);
            shipCargo.push({
              good: 'grain',
              qty: qty,
              buyPrice: 100,
              buySystem: 1,
              buySystemName: 'Sol',
              buyDate: 0
            });
            remainingToFill -= qty;
          }
          testGameStateManager.updateCargo(shipCargo);

          // Calculate expected transfer amount
          const totalStoredUnits = storedCargo.reduce((total, stack) => total + stack.qty, 0);
          const expectedTransfer = Math.min(totalStoredUnits, availableCapacity);

          // Record initial state
          const initialShipCargoTotal = testGameStateManager.getCargoUsed();
          const initialNPCStoredTotal = totalStoredUnits;

          // Retrieve cargo from NPC
          const result = testGameStateManager.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Get final state
          const finalShipCargoTotal = testGameStateManager.getCargoUsed();
          const finalNPCState = testGameStateManager.getNPCState(npcId);
          const finalNPCStoredCargo = finalNPCState.storedCargo || [];
          const finalNPCStoredTotal = finalNPCStoredCargo.reduce((total, stack) => total + stack.qty, 0);

          // Amount transferred should equal min(totalStoredUnits, availableCapacity)
          const actualTransfer = finalShipCargoTotal - initialShipCargoTotal;
          expect(actualTransfer).toBe(expectedTransfer);

          // Conservation: initial stored + initial ship = final stored + final ship
          expect(initialNPCStoredTotal + initialShipCargoTotal).toBe(finalNPCStoredTotal + finalShipCargoTotal);

          // Retrieved cargo should be returned in result
          expect(result.retrieved).toBeDefined();
          expect(Array.isArray(result.retrieved)).toBe(true);
          const retrievedTotal = result.retrieved.reduce((total, stack) => total + stack.qty, 0);
          expect(retrievedTotal).toBe(expectedTransfer);

          // Remaining cargo should be returned in result
          expect(result.remaining).toBeDefined();
          expect(Array.isArray(result.remaining)).toBe(true);
          const remainingTotal = result.remaining.reduce((total, stack) => total + stack.qty, 0);
          expect(remainingTotal).toBe(finalNPCStoredTotal);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should empty NPC storedCargo when ship has sufficient capacity', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbStoredCargoArray(),
        (npcId, currentDay, storedCargo) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set up stored cargo
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.storedCargo = [...storedCargo];

          // Ensure ship has sufficient capacity by clearing cargo
          testGameStateManager.updateCargo([]);

          const totalStoredUnits = storedCargo.reduce((total, stack) => total + stack.qty, 0);
          const availableCapacity = testGameStateManager.getCargoRemaining();

          // Only test when ship has sufficient capacity
          fc.pre(availableCapacity >= totalStoredUnits);

          // Retrieve cargo from NPC
          const result = testGameStateManager.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // NPC storedCargo should be empty after retrieval
          const finalNPCState = testGameStateManager.getNPCState(npcId);
          const finalNPCStoredCargo = finalNPCState.storedCargo || [];
          expect(finalNPCStoredCargo).toEqual([]);

          // All cargo should be retrieved
          const retrievedTotal = result.retrieved.reduce((total, stack) => total + stack.qty, 0);
          expect(retrievedTotal).toBe(totalStoredUnits);

          // No cargo should remain
          expect(result.remaining).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should leave remainder in storage when ship has insufficient capacity', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbStoredCargoArray(),
        fc.integer({ min: 1, max: 20 }),
        (npcId, currentDay, storedCargo, limitedCapacity) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and set up stored cargo
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.storedCargo = [...storedCargo];

          const totalStoredUnits = storedCargo.reduce((total, stack) => total + stack.qty, 0);

          // Only test when stored cargo exceeds limited capacity
          fc.pre(totalStoredUnits > limitedCapacity);

          // Set up ship cargo to have limited available capacity
          const maxCapacity = testGameStateManager.getState().ship.cargoCapacity;
          const usedCapacity = Math.max(0, maxCapacity - limitedCapacity);
          
          // Create ship cargo to use up space, leaving limitedCapacity free
          const shipCargo = [];
          let remainingToFill = usedCapacity;
          while (remainingToFill > 0) {
            const qty = Math.min(remainingToFill, 10);
            shipCargo.push({
              good: 'grain',
              qty: qty,
              buyPrice: 100,
              buySystem: 1,
              buySystemName: 'Sol',
              buyDate: 0
            });
            remainingToFill -= qty;
          }
          testGameStateManager.updateCargo(shipCargo);

          // Retrieve cargo from NPC
          const result = testGameStateManager.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Should retrieve exactly limitedCapacity units
          const retrievedTotal = result.retrieved.reduce((total, stack) => total + stack.qty, 0);
          expect(retrievedTotal).toBe(limitedCapacity);

          // Should leave (totalStoredUnits - limitedCapacity) units in storage
          const expectedRemaining = totalStoredUnits - limitedCapacity;
          const remainingTotal = result.remaining.reduce((total, stack) => total + stack.qty, 0);
          expect(remainingTotal).toBe(expectedRemaining);

          // NPC should still have remaining cargo
          const finalNPCState = testGameStateManager.getNPCState(npcId);
          const finalNPCStoredCargo = finalNPCState.storedCargo || [];
          const finalNPCStoredTotal = finalNPCStoredCargo.reduce((total, stack) => total + stack.qty, 0);
          expect(finalNPCStoredTotal).toBe(expectedRemaining);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty storedCargo gracefully', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        (npcId, currentDay) => {
          // Reset GameStateManager for this test iteration
          const testGameStateManager = resetGameState();

          // Set up initial state
          testGameStateManager.updateTime(currentDay);

          // Get NPC state and ensure no stored cargo
          const npcState = testGameStateManager.getNPCState(npcId);
          npcState.storedCargo = [];

          // Record initial ship cargo
          const initialShipCargo = [...testGameStateManager.getState().ship.cargo];

          // Retrieve cargo from NPC (should be empty)
          const result = testGameStateManager.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // No cargo should be retrieved
          expect(result.retrieved).toEqual([]);
          expect(result.remaining).toEqual([]);

          // Ship cargo should be unchanged
          const finalShipCargo = testGameStateManager.getState().ship.cargo;
          expect(finalShipCargo).toEqual(initialShipCargo);
        }
      ),
      { numRuns: 50 }
    );
  });
});