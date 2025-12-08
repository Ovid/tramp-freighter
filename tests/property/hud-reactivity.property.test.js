/**
 * Property-Based Tests for HUD Reactivity
 * Feature: tramp-freighter-core-loop, Property 3: HUD Reactivity
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { JSDOM } from 'jsdom';

describe('Property 3: HUD Reactivity', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager; // eslint-disable-line no-unused-vars

  beforeEach(() => {
    // Create a DOM environment for testing
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud">
                    <div class="hud-section hud-finances">
                        <div class="hud-row">
                            <span class="hud-label">Credits:</span>
                            <span id="hud-credits" class="hud-value">0</span>
                        </div>
                        <div class="hud-row">
                            <span class="hud-label">Debt:</span>
                            <span id="hud-debt" class="hud-value">0</span>
                        </div>
                    </div>
                    
                    <div class="hud-section hud-time">
                        <div class="hud-row">
                            <span class="hud-label">Days:</span>
                            <span id="hud-days" class="hud-value">0</span>
                        </div>
                    </div>
                    
                    <div class="hud-section hud-ship">
                        <div class="hud-row">
                            <span class="hud-label">Fuel:</span>
                            <div class="fuel-bar-container">
                                <div id="fuel-bar" class="fuel-bar"></div>
                                <span id="hud-fuel-text" class="fuel-text">100%</span>
                            </div>
                        </div>
                        <div class="hud-row">
                            <span class="hud-label">Cargo:</span>
                            <span id="hud-cargo" class="hud-value">0/50</span>
                        </div>
                    </div>
                    
                    <div class="hud-section hud-location">
                        <div class="hud-row">
                            <span class="hud-label">System:</span>
                            <span id="hud-system" class="hud-value">Sol</span>
                        </div>
                        <div class="hud-row">
                            <span class="hud-label">Distance from Sol:</span>
                            <span id="hud-distance" class="hud-value">0.0 LY</span>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);

    document = dom.window.document;
    global.document = document;

    // Clear localStorage before each test
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      },
    };

    // Initialize managers
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.lastSaveTime = 0; // Reset debounce timer
    gameStateManager.initNewGame();
    // UIManager is created for DOM initialization side effects
     
    uiManager = new UIManager(gameStateManager);
  });

  afterEach(() => {
    // Clean up
    global.localStorage.clear();
    delete global.document;
  });

  it('should update HUD immediately when credits change', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: 0, max: 100000 }),
        (initialCredits, newCredits) => {
          // Set initial credits
          gameStateManager.updateCredits(initialCredits);

          // Verify initial display
          expect(document.getElementById('hud-credits').textContent).toBe(
            initialCredits.toLocaleString()
          );

          // Change credits
          gameStateManager.updateCredits(newCredits);

          // Verify HUD updated immediately
          expect(document.getElementById('hud-credits').textContent).toBe(
            newCredits.toLocaleString()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD immediately when debt changes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50000 }),
        fc.integer({ min: 0, max: 50000 }),
        (initialDebt, newDebt) => {
          // Set initial debt
          gameStateManager.updateDebt(initialDebt);

          // Verify initial display
          expect(document.getElementById('hud-debt').textContent).toBe(
            initialDebt.toLocaleString()
          );

          // Change debt
          gameStateManager.updateDebt(newDebt);

          // Verify HUD updated immediately
          expect(document.getElementById('hud-debt').textContent).toBe(
            newDebt.toLocaleString()
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD immediately when fuel changes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (initialFuel, newFuel) => {
          // Set initial fuel
          gameStateManager.updateFuel(initialFuel);

          // Verify initial display
          expect(document.getElementById('fuel-bar').style.width).toBe(
            `${initialFuel}%`
          );
          expect(document.getElementById('hud-fuel-text').textContent).toBe(
            `${Math.round(initialFuel)}%`
          );

          // Change fuel
          gameStateManager.updateFuel(newFuel);

          // Verify HUD updated immediately
          expect(document.getElementById('fuel-bar').style.width).toBe(
            `${newFuel}%`
          );
          expect(document.getElementById('hud-fuel-text').textContent).toBe(
            `${Math.round(newFuel)}%`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD immediately when cargo changes', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 10 }),
            purchasePrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            good: fc.constantFrom(
              'grain',
              'ore',
              'tritium',
              'parts',
              'medicine',
              'electronics'
            ),
            qty: fc.integer({ min: 1, max: 10 }),
            purchasePrice: fc.integer({ min: 5, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (initialCargo, newCargo) => {
          const cargoCapacity = gameStateManager.getShip().cargoCapacity;

          // Set initial cargo
          gameStateManager.updateCargo(initialCargo);

          // Calculate initial cargo used
          const initialCargoUsed = initialCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Verify initial display
          expect(document.getElementById('hud-cargo').textContent).toBe(
            `${initialCargoUsed}/${cargoCapacity}`
          );

          // Change cargo
          gameStateManager.updateCargo(newCargo);

          // Calculate new cargo used
          const newCargoUsed = newCargo.reduce(
            (total, stack) => total + stack.qty,
            0
          );

          // Verify HUD updated immediately
          expect(document.getElementById('hud-cargo').textContent).toBe(
            `${newCargoUsed}/${cargoCapacity}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD immediately when location changes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        (initialSystemId, newSystemId) => {
          // Set initial location
          gameStateManager.updateLocation(initialSystemId);

          // Get initial system
          const initialSystem = TEST_STAR_DATA.find(
            (s) => s.id === initialSystemId
          );

          // Verify initial display
          expect(document.getElementById('hud-system').textContent).toBe(
            initialSystem.name
          );

          // Change location
          gameStateManager.updateLocation(newSystemId);

          // Get new system
          const newSystem = TEST_STAR_DATA.find((s) => s.id === newSystemId);

          // Verify HUD updated immediately
          expect(document.getElementById('hud-system').textContent).toBe(
            newSystem.name
          );

          // Verify distance also updated
          const distanceText =
            document.getElementById('hud-distance').textContent;
          expect(distanceText).toMatch(/^\d+\.\d+ LY$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD immediately when time changes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (initialDays, newDays) => {
          // Set initial time
          gameStateManager.updateTime(initialDays);

          // Verify initial display
          expect(document.getElementById('hud-days').textContent).toBe(
            String(initialDays)
          );

          // Change time
          gameStateManager.updateTime(newDays);

          // Verify HUD updated immediately
          expect(document.getElementById('hud-days').textContent).toBe(
            String(newDays)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple rapid state changes correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            credits: fc.integer({ min: 0, max: 100000 }),
            debt: fc.integer({ min: 0, max: 50000 }),
            fuel: fc.integer({ min: 0, max: 100 }),
            days: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (stateChanges) => {
          // Apply each state change
          for (const change of stateChanges) {
            gameStateManager.updateCredits(change.credits);
            gameStateManager.updateDebt(change.debt);
            gameStateManager.updateFuel(change.fuel);
            gameStateManager.updateTime(change.days);
          }

          // Verify HUD reflects the final state
          const finalState = stateChanges[stateChanges.length - 1];

          expect(document.getElementById('hud-credits').textContent).toBe(
            finalState.credits.toLocaleString()
          );
          expect(document.getElementById('hud-debt').textContent).toBe(
            finalState.debt.toLocaleString()
          );
          expect(document.getElementById('fuel-bar').style.width).toBe(
            `${finalState.fuel}%`
          );
          expect(document.getElementById('hud-fuel-text').textContent).toBe(
            `${Math.round(finalState.fuel)}%`
          );
          expect(document.getElementById('hud-days').textContent).toBe(
            String(finalState.days)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD when buying goods', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 5, max: 50 }),
        (goodType, quantity, price) => {
          // Reset to known state
          gameStateManager.initNewGame();

          const initialCredits = gameStateManager.getPlayer().credits;
          const initialCargoUsed = gameStateManager.getCargoUsed();

          // Verify we can afford it
          const totalCost = quantity * price;
          if (totalCost > initialCredits) {
            return true; // Skip this test case
          }

          // Verify we have space
          if (quantity > gameStateManager.getCargoRemaining()) {
            return true; // Skip this test case
          }

          // Buy goods
          const result = gameStateManager.buyGood(goodType, quantity, price);

          if (result.success) {
            // Verify HUD updated credits
            const expectedCredits = initialCredits - totalCost;
            expect(document.getElementById('hud-credits').textContent).toBe(
              expectedCredits.toLocaleString()
            );

            // Verify HUD updated cargo
            const expectedCargoUsed = initialCargoUsed + quantity;
            const cargoCapacity = gameStateManager.getShip().cargoCapacity;
            expect(document.getElementById('hud-cargo').textContent).toBe(
              `${expectedCargoUsed}/${cargoCapacity}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update HUD when refueling', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Refuel amount
        (amount) => {
          // Reset to known state
          gameStateManager.initNewGame();

          // Set fuel to 50% so we have room to refuel
          gameStateManager.updateFuel(50);

          const initialCredits = gameStateManager.getPlayer().credits;
          const initialFuel = gameStateManager.getShip().fuel;

          // Get fuel price at current location
          const systemId = gameStateManager.getPlayer().currentSystem;
          const fuelPrice = gameStateManager.getFuelPrice(systemId);
          const totalCost = amount * fuelPrice;

          // Verify we can afford it
          if (totalCost > initialCredits) {
            return true; // Skip this test case
          }

          // Verify we won't exceed capacity
          if (initialFuel + amount > 100) {
            return true; // Skip this test case
          }

          // Refuel
          const result = gameStateManager.refuel(amount);

          if (result.success) {
            // Verify HUD updated credits
            const expectedCredits = initialCredits - totalCost;
            expect(document.getElementById('hud-credits').textContent).toBe(
              expectedCredits.toLocaleString()
            );

            // Verify HUD updated fuel
            const expectedFuel = initialFuel + amount;
            expect(document.getElementById('fuel-bar').style.width).toBe(
              `${expectedFuel}%`
            );
            expect(document.getElementById('hud-fuel-text').textContent).toBe(
              `${Math.round(expectedFuel)}%`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
