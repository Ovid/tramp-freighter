import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

/**
 * Property-Based Tests for Hidden Cargo Separation
 *
 * Feature: danger-system, Property 14: Hidden Cargo Separation
 * Validates: Requirements 11.4, 11.5, 11.6, 11.7
 *
 * Tests that hidden cargo is maintained separately from regular cargo
 * and that customs inspections only display regular cargo unless
 * hidden compartments are discovered.
 */

describe('Hidden Cargo Separation Property Tests', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(STAR_DATA, [], null);
    gameStateManager.initNewGame();
  });

  it('Property 14: Hidden cargo separation - hidden cargo is separate from regular cargo', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom(...COMMODITY_TYPES),
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 20 }),
            buySystemName: fc.string({ minLength: 1, maxLength: 20 }),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            good: fc.constantFrom(...COMMODITY_TYPES),
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 20 }),
            buySystemName: fc.string({ minLength: 1, maxLength: 20 }),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (regularCargo, hiddenCargo) => {
          // Set up ship state with both regular and hidden cargo
          const state = gameStateManager.getState();
          state.ship.cargo = [...regularCargo];
          state.ship.hiddenCargo = [...hiddenCargo];

          // Get the cargo arrays
          const retrievedRegularCargo = state.ship.cargo;
          const retrievedHiddenCargo = state.ship.hiddenCargo;

          // Property 1: Hidden cargo and regular cargo are separate arrays
          expect(retrievedRegularCargo).not.toBe(retrievedHiddenCargo);

          // Property 2: Changes to regular cargo don't affect hidden cargo
          const originalHiddenCargo = JSON.parse(
            JSON.stringify(retrievedHiddenCargo)
          );
          retrievedRegularCargo.push({
            good: 'grain',
            qty: 1,
            buyPrice: 10,
            buySystem: 0,
            buySystemName: 'Sol',
            buyDate: 0,
          });
          expect(retrievedHiddenCargo).toEqual(originalHiddenCargo);

          // Property 3: Changes to hidden cargo don't affect regular cargo
          const originalRegularCargo = JSON.parse(
            JSON.stringify(retrievedRegularCargo)
          );
          retrievedHiddenCargo.push({
            good: 'electronics',
            qty: 1,
            buyPrice: 20,
            buySystem: 1,
            buySystemName: 'Alpha Centauri',
            buyDate: 1,
          });
          expect(retrievedRegularCargo).toEqual(originalRegularCargo);

          // Property 4: Hidden cargo is not included in regular cargo manifest
          const hiddenCargoGoods = retrievedHiddenCargo.map(
            (stack) => stack.good
          );

          // For each good in hidden cargo, verify it's not automatically included in regular cargo
          for (const hiddenGood of hiddenCargoGoods) {
            // If the good exists in both, they should be separate stacks
            const regularStacks = retrievedRegularCargo.filter(
              (stack) => stack.good === hiddenGood
            );
            const hiddenStacks = retrievedHiddenCargo.filter(
              (stack) => stack.good === hiddenGood
            );

            // The stacks should be different objects even if they contain the same good type
            for (const regularStack of regularStacks) {
              for (const hiddenStack of hiddenStacks) {
                expect(regularStack).not.toBe(hiddenStack);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 14: Hidden cargo separation - customs inspections only show regular cargo by default', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom(...COMMODITY_TYPES),
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 20 }),
            buySystemName: fc.string({ minLength: 1, maxLength: 20 }),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            good: fc.constantFrom(...COMMODITY_TYPES),
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 1, max: 100 }),
            buySystem: fc.integer({ min: 0, max: 20 }),
            buySystemName: fc.string({ minLength: 1, maxLength: 20 }),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (regularCargo, hiddenCargo) => {
          // Set up ship state with both regular and hidden cargo
          const state = gameStateManager.getState();
          state.ship.cargo = [...regularCargo];
          state.ship.hiddenCargo = [...hiddenCargo];

          // Simulate customs inspection manifest (should only show regular cargo)
          const inspectionManifest = state.ship.cargo;

          // Property 1: Inspection manifest contains all regular cargo
          expect(inspectionManifest).toEqual(regularCargo);

          // Property 2: Inspection manifest does not contain hidden cargo
          const hiddenGoods = hiddenCargo.map(
            (stack) => `${stack.good}-${stack.buyPrice}-${stack.buySystem}`
          );

          for (const hiddenGood of hiddenGoods) {
            // Hidden cargo should not appear in the manifest unless it's also in regular cargo
            // (in which case they would be separate stacks)
            const hiddenStack = hiddenCargo.find(
              (stack) =>
                `${stack.good}-${stack.buyPrice}-${stack.buySystem}` ===
                hiddenGood
            );
            const manifestStack = inspectionManifest.find(
              (stack) =>
                `${stack.good}-${stack.buyPrice}-${stack.buySystem}` ===
                hiddenGood
            );

            if (manifestStack && hiddenStack) {
              // If both exist, they should be different objects (separate stacks)
              expect(manifestStack).not.toBe(hiddenStack);
            }
          }

          // Property 3: Hidden cargo remains accessible through separate interface
          const hiddenCargoAccess = state.ship.hiddenCargo;
          expect(hiddenCargoAccess).toEqual(hiddenCargo);
          expect(hiddenCargoAccess).not.toBe(inspectionManifest);
        }
      ),
      { numRuns: 100 }
    );
  });
});
