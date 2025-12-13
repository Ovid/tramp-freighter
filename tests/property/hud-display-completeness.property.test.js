/**
 * Property-Based Tests for HUD Display Completeness
 * Feature: tramp-freighter-core-loop, Property 2: HUD Display Completeness
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { JSDOM } from 'jsdom';

describe('Property 2: HUD Display Completeness', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

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
    uiManager = new UIManager(gameStateManager);
  });

  afterEach(() => {
    // Clean up
    global.localStorage.clear();
    delete global.document;
  });

  const gameStateArbitrary = fc.record({
    player: fc.record({
      credits: fc.integer({ min: 0, max: 100000 }),
      debt: fc.integer({ min: 0, max: 50000 }),
      currentSystem: fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
      daysElapsed: fc.integer({ min: 0, max: 1000 }),
    }),
    ship: fc.record({
      name: fc.constantFrom('Serendipity', 'Wanderer', "Fortune's Fool"),
      fuel: fc.integer({ min: 0, max: 100 }),
      cargoCapacity: fc.integer({ min: 10, max: 200 }),
      cargo: fc.array(
        fc.record({
          good: fc.constantFrom(
            'grain',
            'ore',
            'tritium',
            'parts',
            'medicine',
            'electronics'
          ),
          qty: fc.integer({ min: 1, max: 50 }),
          purchasePrice: fc.integer({ min: 5, max: 100 }),
        }),
        { minLength: 0, maxLength: 10 }
      ),
    }),
    world: fc.record({
      visitedSystems: fc
        .array(fc.constantFrom(0, 1, 4, 5, 7, 13), {
          minLength: 1,
          maxLength: 6,
        })
        .map((arr) => [...new Set(arr)]), // Remove duplicates
    }),
    meta: fc.record({
      version: fc.constant('1.0.0'),
      timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    }),
  });

  it('should display all required HUD fields for any game state', () => {
    fc.assert(
      fc.property(gameStateArbitrary, (generatedState) => {
        // Set the game state
        gameStateManager.state = generatedState;

        // Update the HUD
        uiManager.updateHUD();

        // HUD SHALL display the Player's current credits
        const creditsElement = document.getElementById('hud-credits');
        expect(creditsElement).not.toBeNull();
        expect(creditsElement.textContent).toBe(
          generatedState.player.credits.toLocaleString()
        );

        // HUD SHALL display the Player's current debt
        const debtElement = document.getElementById('hud-debt');
        expect(debtElement).not.toBeNull();
        expect(debtElement.textContent).toBe(
          generatedState.player.debt.toLocaleString()
        );

        // HUD SHALL display the days elapsed counter
        const daysElement = document.getElementById('hud-days');
        expect(daysElement).not.toBeNull();
        expect(daysElement.textContent).toBe(
          String(generatedState.player.daysElapsed)
        );

        // HUD SHALL display the Ship's fuel level as a percentage
        const fuelBarElement = document.getElementById('fuel-bar');
        const fuelTextElement = document.getElementById('hud-fuel-text');
        expect(fuelBarElement).not.toBeNull();
        expect(fuelTextElement).not.toBeNull();
        expect(fuelBarElement.style.width).toBe(`${generatedState.ship.fuel}%`);
        expect(fuelTextElement.textContent).toBe(
          `${Math.round(generatedState.ship.fuel)}%`
        );

        // HUD SHALL display the Ship's cargo usage as current over maximum capacity
        const cargoElement = document.getElementById('hud-cargo');
        expect(cargoElement).not.toBeNull();
        const cargoUsed = generatedState.ship.cargo.reduce(
          (total, stack) => total + stack.qty,
          0
        );
        expect(cargoElement.textContent).toBe(
          `${cargoUsed}/${generatedState.ship.cargoCapacity}`
        );

        // HUD SHALL display the Player's current Star System name
        const systemElement = document.getElementById('hud-system');
        expect(systemElement).not.toBeNull();
        const currentSystem = TEST_STAR_DATA.find(
          (s) => s.id === generatedState.player.currentSystem
        );
        expect(systemElement.textContent).toBe(currentSystem.name);

        // HUD SHALL display the distance from Sol to the current Star System
        const distanceElement = document.getElementById('hud-distance');
        expect(distanceElement).not.toBeNull();
        // Distance should be a number followed by " LY"
        expect(distanceElement.textContent).toMatch(/^\d+\.\d+ LY$/);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  it('should handle zero values correctly', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Create state with zero values
        const zeroState = {
          player: {
            credits: 0,
            debt: 0,
            currentSystem: 0,
            daysElapsed: 0,
          },
          ship: {
            name: 'Serendipity',
            fuel: 0,
            cargoCapacity: 50,
            cargo: [],
          },
          world: {
            visitedSystems: [0],
          },
          meta: {
            version: '1.0.0',
            timestamp: Date.now(),
          },
        };

        gameStateManager.state = zeroState;
        uiManager.updateHUD();

        // Verify zero values are displayed correctly
        expect(document.getElementById('hud-credits').textContent).toBe('0');
        expect(document.getElementById('hud-debt').textContent).toBe('0');
        expect(document.getElementById('hud-days').textContent).toBe('0');
        expect(document.getElementById('fuel-bar').style.width).toBe('0%');
        expect(document.getElementById('hud-fuel-text').textContent).toBe('0%');
        expect(document.getElementById('hud-cargo').textContent).toBe('0/50');
      }),
      { numRuns: 100 }
    );
  });

  it('should handle maximum values correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }), // Cargo capacity
        fc.integer({ min: 50000, max: 100000 }), // Credits
        fc.integer({ min: 25000, max: 50000 }), // Debt
        fc.integer({ min: 500, max: 1000 }), // Days
        (capacity, credits, debt, days) => {
          // Create state with maximum values
          const maxState = {
            player: {
              credits: credits,
              debt: debt,
              currentSystem: 0,
              daysElapsed: days,
            },
            ship: {
              name: 'Serendipity',
              fuel: 100,
              cargoCapacity: capacity,
              cargo: [{ good: 'grain', qty: capacity, purchasePrice: 10 }],
            },
            world: {
              visitedSystems: [0],
            },
            meta: {
              version: '1.0.0',
              timestamp: Date.now(),
            },
          };

          gameStateManager.state = maxState;
          uiManager.updateHUD();

          // Verify maximum values are displayed correctly
          expect(document.getElementById('hud-credits').textContent).toBe(
            credits.toLocaleString()
          );
          expect(document.getElementById('hud-debt').textContent).toBe(
            debt.toLocaleString()
          );
          expect(document.getElementById('hud-days').textContent).toBe(
            String(days)
          );
          expect(document.getElementById('fuel-bar').style.width).toBe('100%');
          expect(document.getElementById('hud-fuel-text').textContent).toBe(
            '100%'
          );
          expect(document.getElementById('hud-cargo').textContent).toBe(
            `${capacity}/${capacity}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct distance from Sol for all systems', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
        (systemId) => {
          // Create state at this system
          const state = {
            player: {
              credits: 500,
              debt: 10000,
              currentSystem: systemId,
              daysElapsed: 0,
            },
            ship: {
              name: 'Serendipity',
              fuel: 100,
              cargoCapacity: 50,
              cargo: [],
            },
            world: {
              visitedSystems: [systemId],
            },
            meta: {
              version: '1.0.0',
              timestamp: Date.now(),
            },
          };

          gameStateManager.state = state;
          uiManager.updateHUD();

          // Verify system name is displayed
          const system = TEST_STAR_DATA.find((s) => s.id === systemId);
          expect(document.getElementById('hud-system').textContent).toBe(
            system.name
          );

          // Verify distance is displayed and is a valid number
          const distanceText =
            document.getElementById('hud-distance').textContent;
          expect(distanceText).toMatch(/^\d+\.\d+ LY$/);

          // Extract and verify the distance value
          const distance = parseFloat(distanceText);
          expect(distance).toBeGreaterThanOrEqual(0);

          // For Sol, distance should be 0.0
          if (systemId === 0) {
            expect(distance).toBe(0.0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format large credit and debt values with separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }), // Large credits
        fc.integer({ min: 10000, max: 50000 }), // Large debt
        (credits, debt) => {
          const state = {
            player: {
              credits: credits,
              debt: debt,
              currentSystem: 0,
              daysElapsed: 0,
            },
            ship: {
              name: 'Serendipity',
              fuel: 100,
              cargoCapacity: 50,
              cargo: [],
            },
            world: {
              visitedSystems: [0],
            },
            meta: {
              version: '1.0.0',
              timestamp: Date.now(),
            },
          };

          gameStateManager.state = state;
          uiManager.updateHUD();

          // Verify numbers are formatted with locale separators
          const creditsText =
            document.getElementById('hud-credits').textContent;
          const debtText = document.getElementById('hud-debt').textContent;

          expect(creditsText).toBe(credits.toLocaleString());
          expect(debtText).toBe(debt.toLocaleString());

          // For values >= 10000, should contain a separator (comma in en-US)
          if (credits >= 10000) {
            expect(creditsText).toContain(',');
          }
          if (debt >= 10000) {
            expect(debtText).toContain(',');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
