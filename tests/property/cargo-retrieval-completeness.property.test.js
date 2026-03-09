import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
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
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  // Helper function to reset GameCoordinator for each property test iteration
  const resetGameState = () => {
    const testGameCoordinator = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    testGameCoordinator.initNewGame();
    return testGameCoordinator;
  };

  /**
   * Generator for valid NPC IDs from the game data.
   * Uses actual NPC IDs to ensure tests work with real game entities.
   */
  const arbNPCId = () => fc.constantFrom(...ALL_NPCS.map((npc) => npc.id));

  /**
   * Generator for game day values.
   * Range 0-1000 covers typical gameplay scenarios without extreme edge cases
   * that might cause integer overflow in date calculations.
   */
  const arbCurrentDay = () => fc.integer({ min: 0, max: 1000 });

  /**
   * Generator for stored cargo arrays with realistic trading data.
   * Quantities 1-15 reflect typical cargo stack sizes in trading gameplay.
   * Price range 50-200 covers normal commodity price variations.
   * System IDs 1-8 match the actual star system data range.
   * Array size 1-8 ensures meaningful cargo without overwhelming ship capacity.
   */
  const arbStoredCargoArray = () =>
    fc.array(
      fc.record({
        good: fc.constantFrom(...COMMODITY_TYPES),
        qty: fc.integer({ min: 1, max: 15 }),
        buyPrice: fc.integer({ min: 50, max: 200 }),
        buySystem: fc.integer({ min: 1, max: 8 }),
        buySystemName: fc.constantFrom('Sol', 'Alpha Centauri', 'Sirius A'),
        buyDate: fc.integer({ min: 0, max: 100 }),
      }),
      { minLength: 1, maxLength: 8 }
    );

  /**
   * Generator for ship cargo capacity scenarios.
   * Range 0-50 covers empty ship to full capacity situations,
   * testing both constrained and unconstrained retrieval scenarios.
   */
  const arbShipCargoCapacity = () => fc.integer({ min: 0, max: 50 });

  it('should transfer min(storedCargo, availableCapacity) to ship when retrieveCargo is called', () => {
    fc.assert(
      fc.property(
        arbNPCId(),
        arbCurrentDay(),
        arbStoredCargoArray(),
        arbShipCargoCapacity(),
        (npcId, currentDay, storedCargo, availableCapacity) => {
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up stored cargo
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.storedCargo = [...storedCargo];

          // Set up ship cargo to have specific available capacity
          const maxCapacity = testGameCoordinator.getState().ship.cargoCapacity;
          const usedCapacity = Math.max(0, maxCapacity - availableCapacity);

          // Create ship cargo to use up space, leaving availableCapacity free
          const cargoTemplate = {
            good: 'grain',
            buyPrice: 100,
            buySystem: 1,
            buySystemName: 'Sol',
            buyDate: 0,
          };
          const shipCargo = [];
          let remainingToFill = usedCapacity;
          while (remainingToFill > 0) {
            const qty = Math.min(remainingToFill, 10);
            shipCargo.push({
              ...cargoTemplate,
              qty: qty,
            });
            remainingToFill -= qty;
          }
          testGameCoordinator.updateCargo(shipCargo);

          // Calculate expected transfer amount
          const totalStoredUnits = storedCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          const expectedTransfer = Math.min(
            totalStoredUnits,
            availableCapacity
          );

          // Record initial state
          const initialShipCargoTotal = testGameCoordinator.getCargoUsed();
          const initialNPCStoredTotal = totalStoredUnits;

          // Retrieve cargo from NPC
          const result = testGameCoordinator.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Get final state
          const finalShipCargoTotal = testGameCoordinator.getCargoUsed();
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          const finalNPCStoredTotal = finalNPCState.storedCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Amount transferred should equal min(totalStoredUnits, availableCapacity)
          const actualTransfer = finalShipCargoTotal - initialShipCargoTotal;
          expect(actualTransfer).toBe(expectedTransfer);

          // Conservation: initial stored + initial ship = final stored + final ship
          expect(initialNPCStoredTotal + initialShipCargoTotal).toBe(
            finalNPCStoredTotal + finalShipCargoTotal
          );

          // Retrieved cargo should be returned in result
          expect(result.retrieved).toBeDefined();
          expect(Array.isArray(result.retrieved)).toBe(true);
          const retrievedTotal = result.retrieved.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          expect(retrievedTotal).toBe(expectedTransfer);

          // Remaining cargo should be returned in result
          expect(result.remaining).toBeDefined();
          expect(Array.isArray(result.remaining)).toBe(true);
          const remainingTotal = result.remaining.reduce(
            (total, stack) => total + stack.qty,
            0
          );
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
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up stored cargo
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.storedCargo = [...storedCargo];

          // Ensure ship has sufficient capacity by clearing cargo
          testGameCoordinator.updateCargo([]);

          const totalStoredUnits = storedCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          const availableCapacity = testGameCoordinator.getCargoRemaining();

          // Only test when ship has sufficient capacity
          fc.pre(availableCapacity >= totalStoredUnits);

          // Retrieve cargo from NPC
          const result = testGameCoordinator.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // NPC storedCargo should be empty after retrieval
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          expect(finalNPCState.storedCargo).toEqual([]);

          // All cargo should be retrieved
          const retrievedTotal = result.retrieved.reduce(
            (total, stack) => total + stack.qty,
            0
          );
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
          // Reset GameCoordinator for this test iteration
          const testGameCoordinator = resetGameState();

          // Set up initial state
          testGameCoordinator.updateTime(currentDay);

          // Get NPC state and set up stored cargo
          const npcState = testGameCoordinator.getNPCState(npcId);
          npcState.storedCargo = [...storedCargo];

          const totalStoredUnits = storedCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Only test when stored cargo exceeds limited capacity
          fc.pre(totalStoredUnits > limitedCapacity);

          // Set up ship cargo to have limited available capacity
          const maxCapacity = testGameCoordinator.getState().ship.cargoCapacity;
          const usedCapacity = Math.max(0, maxCapacity - limitedCapacity);

          // Create ship cargo to use up space, leaving limitedCapacity free
          const cargoTemplate = {
            good: 'grain',
            buyPrice: 100,
            buySystem: 1,
            buySystemName: 'Sol',
            buyDate: 0,
          };
          const shipCargo = [];
          let remainingToFill = usedCapacity;
          while (remainingToFill > 0) {
            const qty = Math.min(remainingToFill, 10);
            shipCargo.push({
              ...cargoTemplate,
              qty: qty,
            });
            remainingToFill -= qty;
          }
          testGameCoordinator.updateCargo(shipCargo);

          // Retrieve cargo from NPC
          const result = testGameCoordinator.retrieveCargo(npcId);

          // Should succeed
          expect(result.success).toBe(true);

          // Should retrieve exactly limitedCapacity units
          const retrievedTotal = result.retrieved.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          expect(retrievedTotal).toBe(limitedCapacity);

          // Should leave (totalStoredUnits - limitedCapacity) units in storage
          const expectedRemaining = totalStoredUnits - limitedCapacity;
          const remainingTotal = result.remaining.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          expect(remainingTotal).toBe(expectedRemaining);

          // NPC should still have remaining cargo
          const finalNPCState = testGameCoordinator.getNPCState(npcId);
          const finalNPCStoredTotal = finalNPCState.storedCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );
          expect(finalNPCStoredTotal).toBe(expectedRemaining);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty storedCargo gracefully', () => {
    fc.assert(
      fc.property(arbNPCId(), arbCurrentDay(), (npcId, currentDay) => {
        // Reset GameCoordinator for this test iteration
        const testGameCoordinator = resetGameState();

        // Set up initial state
        testGameCoordinator.updateTime(currentDay);

        // Get NPC state and ensure no stored cargo
        const npcState = testGameCoordinator.getNPCState(npcId);
        npcState.storedCargo = [];

        // Record initial ship cargo
        const initialShipCargo = [...testGameCoordinator.getState().ship.cargo];

        // Retrieve cargo from NPC (should be empty)
        const result = testGameCoordinator.retrieveCargo(npcId);

        // Should succeed
        expect(result.success).toBe(true);

        // No cargo should be retrieved
        expect(result.retrieved).toEqual([]);
        expect(result.remaining).toEqual([]);

        // Ship cargo should be unchanged
        const finalShipCargo = testGameCoordinator.getState().ship.cargo;
        expect(finalShipCargo).toEqual(initialShipCargo);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error for invalid npcId input', () => {
    const testGameCoordinator = resetGameState();

    // Test null npcId
    expect(() => testGameCoordinator.retrieveCargo(null)).toThrow(
      'Invalid npcId: retrieveCargo requires a valid NPC identifier'
    );

    // Test undefined npcId
    expect(() => testGameCoordinator.retrieveCargo(undefined)).toThrow(
      'Invalid npcId: retrieveCargo requires a valid NPC identifier'
    );

    // Test empty string npcId
    expect(() => testGameCoordinator.retrieveCargo('')).toThrow(
      'Invalid npcId: retrieveCargo requires a valid NPC identifier'
    );

    // Test non-string npcId
    expect(() => testGameCoordinator.retrieveCargo(123)).toThrow(
      'Invalid npcId: retrieveCargo requires a valid NPC identifier'
    );
  });
});
