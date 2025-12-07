/**
 * Property-Based Tests for Market Data Display
 *
 * Tests the Market Data view in the Information Broker panel,
 * verifying that purchased intelligence is displayed correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property: Market Data Display', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Create minimal DOM for testing market data display
    // UIManager caches all elements but handles null gracefully
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="market-data-list"></div>
            </body>
            </html>
        `);

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Initialize game state manager
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Initialize UI manager
    uiManager = new UIManager(gameStateManager);
  });

  it('should display all systems with known prices', () => {
    fc.assert(
      fc.property(
        // Generate random number of systems with price knowledge
        fc.array(
          fc.record({
            systemId: fc.constantFrom(0, 1, 4, 5, 7, 13),
            lastVisit: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 6 }
        ),
        (knownSystems) => {
          const state = gameStateManager.getState();

          // Clear existing price knowledge (game starts with Sol)
          state.world.priceKnowledge = {};

          // Add price knowledge for each system
          knownSystems.forEach(({ systemId, lastVisit }) => {
            state.world.priceKnowledge[systemId] = {
              lastVisit: lastVisit,
              prices: {
                grain: 10,
                ore: 15,
                tritium: 50,
                parts: 30,
                medicine: 40,
                electronics: 35,
              },
            };
          });

          // Render market data
          uiManager.renderMarketData();

          const marketDataList = document.getElementById('market-data-list');
          const systemItems = marketDataList.querySelectorAll(
            '.market-data-system'
          );

          // Property: Should display one item per system with known prices
          const uniqueSystemIds = [
            ...new Set(knownSystems.map((s) => s.systemId)),
          ];
          expect(systemItems.length).toBe(uniqueSystemIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display all commodity prices for each system', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        fc.integer({ min: 0, max: 100 }),
        (systemId, lastVisit) => {
          const state = gameStateManager.getState();

          // Add price knowledge
          state.world.priceKnowledge[systemId] = {
            lastVisit: lastVisit,
            prices: {
              grain: 10,
              ore: 15,
              tritium: 50,
              parts: 30,
              medicine: 40,
              electronics: 35,
            },
          };

          // Render market data
          uiManager.renderMarketData();

          const marketDataList = document.getElementById('market-data-list');
          const systemItem = marketDataList.querySelector(
            '.market-data-system'
          );
          const priceItems = systemItem.querySelectorAll(
            '.market-data-price-item'
          );

          // Property: Should display all 6 commodities
          expect(priceItems.length).toBe(6);

          // Property: Each commodity should have a name and price
          priceItems.forEach((item) => {
            const commodity = item.querySelector('.market-data-commodity');
            const price = item.querySelector('.market-data-price');

            expect(commodity).toBeDefined();
            expect(price).toBeDefined();
            expect(commodity.textContent.length).toBeGreaterThan(0);
            expect(price.textContent).toMatch(/₡\d+/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display staleness information correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        fc.integer({ min: 0, max: 100 }),
        (systemId, lastVisit) => {
          const state = gameStateManager.getState();
          state.player.daysElapsed = 50;

          // Clear existing price knowledge
          state.world.priceKnowledge = {};

          // Add price knowledge
          state.world.priceKnowledge[systemId] = {
            lastVisit: lastVisit,
            prices: {
              grain: 10,
              ore: 15,
              tritium: 50,
              parts: 30,
              medicine: 40,
              electronics: 35,
            },
          };

          // Render market data
          uiManager.renderMarketData();

          const marketDataList = document.getElementById('market-data-list');
          const systemItem = marketDataList.querySelector(
            '.market-data-system'
          );
          const stalenessElement = systemItem.querySelector(
            '.market-data-staleness'
          );

          // Property: Staleness text should reflect lastVisit value
          if (lastVisit === 0) {
            expect(stalenessElement.textContent).toBe('Current');
          } else if (lastVisit === 1) {
            expect(stalenessElement.textContent).toBe('1 day old');
          } else {
            expect(stalenessElement.textContent).toContain(
              `${lastVisit} days old`
            );
          }

          // Property: Staleness should have correct CSS class
          if (lastVisit > 30) {
            expect(stalenessElement.classList.contains('very-stale')).toBe(
              true
            );
          } else if (lastVisit > 10) {
            expect(stalenessElement.classList.contains('stale')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort systems by staleness (current first)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            systemId: fc.integer({ min: 0, max: 13 }),
            lastVisit: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 3, maxLength: 6 }
        ),
        (knownSystems) => {
          const state = gameStateManager.getState();

          // Add price knowledge for each system
          knownSystems.forEach(({ systemId, lastVisit }) => {
            state.world.priceKnowledge[systemId] = {
              lastVisit: lastVisit,
              prices: {
                grain: 10,
                ore: 15,
                tritium: 50,
                parts: 30,
                medicine: 40,
                electronics: 35,
              },
            };
          });

          // Render market data
          uiManager.renderMarketData();

          const marketDataList = document.getElementById('market-data-list');
          const systemItems = marketDataList.querySelectorAll(
            '.market-data-system'
          );

          // Property: Systems should be sorted by lastVisit (ascending)
          let previousLastVisit = -1;
          systemItems.forEach((item) => {
            const stalenessText = item.querySelector(
              '.market-data-staleness'
            ).textContent;

            let currentLastVisit;
            if (stalenessText === 'Current') {
              currentLastVisit = 0;
            } else {
              const match = stalenessText.match(/(\d+) day/);
              currentLastVisit = match ? parseInt(match[1]) : 0;
            }

            expect(currentLastVisit).toBeGreaterThanOrEqual(previousLastVisit);
            previousLastVisit = currentLastVisit;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show empty state when no price knowledge exists', () => {
    const state = gameStateManager.getState();
    state.world.priceKnowledge = {};

    // Render market data
    uiManager.renderMarketData();

    const marketDataList = document.getElementById('market-data-list');
    const emptyMessage = marketDataList.querySelector('.market-data-empty');

    // Property: Should display empty state message
    expect(emptyMessage).toBeDefined();
    expect(emptyMessage.textContent.length).toBeGreaterThan(0);
    expect(emptyMessage.textContent).toContain('No market data');
  });

  it('should display system names correctly', () => {
    fc.assert(
      fc.property(fc.constantFrom(0, 1, 4, 5, 7, 13), (systemId) => {
        const state = gameStateManager.getState();

        // Clear existing price knowledge
        state.world.priceKnowledge = {};

        // Add price knowledge
        state.world.priceKnowledge[systemId] = {
          lastVisit: 0,
          prices: {
            grain: 10,
            ore: 15,
            tritium: 50,
            parts: 30,
            medicine: 40,
            electronics: 35,
          },
        };

        // Render market data
        uiManager.renderMarketData();

        const marketDataList = document.getElementById('market-data-list');
        const systemItem = marketDataList.querySelector('.market-data-system');
        const systemNameElement = systemItem.querySelector(
          '.market-data-system-name'
        );

        // Property: System name should match the star data
        const expectedSystem = TEST_STAR_DATA.find((s) => s.id === systemId);
        expect(systemNameElement.textContent).toBe(expectedSystem.name);
      }),
      { numRuns: 100 }
    );
  });

  it('should update when price knowledge changes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        fc.integer({ min: 0, max: 50 }),
        (systemId, initialLastVisit) => {
          const state = gameStateManager.getState();

          // Clear existing price knowledge
          state.world.priceKnowledge = {};

          // Add initial price knowledge
          state.world.priceKnowledge[systemId] = {
            lastVisit: initialLastVisit,
            prices: {
              grain: 10,
              ore: 15,
              tritium: 50,
              parts: 30,
              medicine: 40,
              electronics: 35,
            },
          };

          // Render market data
          uiManager.renderMarketData();

          const marketDataList = document.getElementById('market-data-list');
          let systemItems = marketDataList.querySelectorAll(
            '.market-data-system'
          );
          const initialCount = systemItems.length;

          // Add another system (ensure it's different)
          const availableIds = [0, 1, 4, 5, 7, 13].filter(
            (id) => id !== systemId
          );
          if (availableIds.length === 0) return; // Skip if no other systems available

          const newSystemId = availableIds[0];
          state.world.priceKnowledge[newSystemId] = {
            lastVisit: 0,
            prices: {
              grain: 12,
              ore: 18,
              tritium: 55,
              parts: 32,
              medicine: 42,
              electronics: 37,
            },
          };

          // Re-render
          uiManager.renderMarketData();

          systemItems = marketDataList.querySelectorAll('.market-data-system');

          // Property: Should display updated count
          expect(systemItems.length).toBe(initialCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
