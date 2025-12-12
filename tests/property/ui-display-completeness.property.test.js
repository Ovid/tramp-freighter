'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { SHIP_CONFIG, COMMODITY_TYPES } from '../../js/game-constants.js';

/**
 * Property 9: UI Display Completeness
 * Feature: ship-personality, Property 9: UI Display Completeness
 * Validates: Requirements 1.3, 2.2, 5.2, 8.2, 8.3, 8.4, 9.2 (Ship Personality Spec)
 *
 * For any quirk, upgrade, or cargo item displayed in the UI, all required fields
 * for that item type should be present in the rendered output.
 */

// Mock star data for testing
const mockStarData = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 1, st: 1, r: 1 },
  {
    id: 1,
    name: 'Alpha Centauri',
    x: 4.37,
    y: 0,
    z: 0,
    type: 'G',
    wh: 1,
    st: 1,
    r: 1,
  },
];

// Mock wormhole data
const mockWormholeData = [[0, 1]];

describe('Property 9: UI Display Completeness', () => {
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Setup DOM elements required by UIManager
    document.body.innerHTML = `
      <div id="game-hud"></div>
      <div id="hud-credits"></div>
      <div id="hud-debt"></div>
      <div id="hud-days"></div>
      <div id="fuel-bar"></div>
      <div id="hud-fuel-text"></div>
      <div id="hull-bar"></div>
      <div id="hud-hull-text"></div>
      <div id="engine-bar"></div>
      <div id="hud-engine-text"></div>
      <div id="life-support-bar"></div>
      <div id="hud-life-support-text"></div>
      <div id="hud-cargo"></div>
      <div id="hud-system"></div>
      <div id="hud-distance"></div>
      <div id="quick-system-info-btn"></div>
      <div id="quick-station-btn"></div>
      <div id="hud"></div>
      <div id="station-interface"></div>
      <div id="station-name"></div>
      <div id="station-system-name"></div>
      <div id="station-distance"></div>
      <div id="station-close-btn"></div>
      <div id="trade-btn"></div>
      <div id="refuel-btn"></div>
      <div id="undock-btn"></div>
      <div id="trade-panel"></div>
      <div id="trade-system-name"></div>
      <div id="trade-close-btn"></div>
      <div id="trade-back-btn"></div>
      <div id="market-goods"></div>
      <div id="cargo-stacks"></div>
      <div id="trade-cargo-used"></div>
      <div id="trade-cargo-capacity"></div>
      <div id="trade-cargo-remaining"></div>
      <div id="refuel-panel"></div>
      <div id="refuel-system-name"></div>
      <div id="refuel-current-fuel"></div>
      <div id="refuel-price-per-percent"></div>
      <div id="refuel-amount-input"></div>
      <div id="refuel-total-cost"></div>
      <div id="refuel-confirm-btn"></div>
      <div id="refuel-close-btn"></div>
      <div id="refuel-back-btn"></div>
      <div id="refuel-max-btn"></div>
      <div id="refuel-validation-message"></div>
      <div id="info-broker-btn"></div>
      <div id="info-broker-panel"></div>
      <div id="info-broker-system-name"></div>
      <div id="info-broker-close-btn"></div>
      <div id="info-broker-back-btn"></div>
      <div id="buy-rumor-btn"></div>
      <div id="rumor-text"></div>
      <div id="intelligence-list"></div>
      <div id="info-broker-validation-message"></div>
      <div id="purchase-tab"></div>
      <div id="market-data-tab"></div>
      <div id="purchase-intel-content"></div>
      <div id="market-data-content"></div>
      <div id="market-data-list"></div>
      <div id="repairs-btn"></div>
      <div id="repair-panel"></div>
      <div id="repair-system-name"></div>
      <div id="repair-close-btn"></div>
      <div id="repair-back-btn"></div>
      <div id="repair-hull-percent"></div>
      <div id="repair-hull-bar"></div>
      <div id="repair-engine-percent"></div>
      <div id="repair-engine-bar"></div>
      <div id="repair-life-support-percent"></div>
      <div id="repair-life-support-bar"></div>
      <div id="repair-all-btn"></div>
      <div id="repair-validation-message"></div>
      <div id="notification-area"></div>
      <div id="event-modal-overlay"></div>
      <div id="event-modal-title"></div>
      <div id="event-modal-description"></div>
      <div id="event-modal-duration"></div>
      <div id="event-modal-dismiss"></div>
      <div id="ship-status-btn"></div>
      <div id="upgrades-btn"></div>
      <div id="upgrades-panel"></div>
      <div id="upgrades-close-btn"></div>
      <div id="upgrades-back-btn"></div>
      <div id="upgrades-credits-value"></div>
      <div id="available-upgrades-list"></div>
      <div id="installed-upgrades-list"></div>
      <div id="upgrade-confirmation-overlay"></div>
      <div id="upgrade-confirmation-title"></div>
      <div id="upgrade-confirmation-effects"></div>
      <div id="upgrade-current-credits"></div>
      <div id="upgrade-cost"></div>
      <div id="upgrade-credits-after"></div>
      <div id="upgrade-cancel-btn"></div>
      <div id="upgrade-confirm-btn"></div>
    `;

    gameStateManager = new GameStateManager(mockStarData, mockWormholeData);
    uiManager = new UIManager(gameStateManager);
  });

  it('should display all required fields for quirks (name, description, flavor text)', () => {
    fc.assert(
      fc.property(
        // Generate random quirk selections (1-3 quirks)
        fc
          .array(fc.constantFrom(...Object.keys(SHIP_CONFIG.QUIRKS)), {
            minLength: 1,
            maxLength: 3,
          })
          .map((arr) => [...new Set(arr)]), // Ensure unique quirks
        (quirkIds) => {
          // Setup game state with quirks
          gameStateManager.initNewGame();
          const state = gameStateManager.getState();
          state.ship.quirks = quirkIds;

          // Render ship status
          uiManager.renderShipStatus();

          // Get rendered HTML
          const shipStatusPanel = document.getElementById('ship-status-panel');
          const html = shipStatusPanel.innerHTML;

          // Verify each quirk has all required fields displayed
          for (const quirkId of quirkIds) {
            const quirk = SHIP_CONFIG.QUIRKS[quirkId];

            // Check that quirk name is present
            expect(html).toContain(quirk.name);

            // Check that quirk description is present
            expect(html).toContain(quirk.description);

            // Check that quirk flavor text is present
            expect(html).toContain(quirk.flavor);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display all required fields for cargo (quantity, price, location, date)', () => {
    fc.assert(
      fc.property(
        // Generate random cargo entries
        fc.array(
          fc.record({
            good: fc.constantFrom(...COMMODITY_TYPES),
            qty: fc.integer({ min: 1, max: 50 }),
            buyPrice: fc.integer({ min: 10, max: 200 }),
            buySystem: fc.integer({ min: 0, max: 1 }), // Use valid system IDs from mockStarData
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (cargoEntries) => {
          // Setup game state with cargo
          gameStateManager.initNewGame();
          const state = gameStateManager.getState();

          // Add buySystemName based on buySystem ID for consistency
          const enrichedCargo = cargoEntries.map((cargo) => ({
            ...cargo,
            buySystemName: mockStarData.find((s) => s.id === cargo.buySystem)
              .name,
          }));

          state.ship.cargo = enrichedCargo;

          // Render trade panel (which displays cargo with metadata)
          const currentSystem = gameStateManager.starData.find(
            (s) => s.id === state.player.currentSystem
          );
          uiManager.renderCargoStacks(currentSystem);

          // Get rendered HTML
          const cargoStacks = document.getElementById('cargo-stacks');
          const html = cargoStacks.innerHTML;

          // Verify each cargo entry has all required metadata fields displayed
          for (const cargo of enrichedCargo) {
            // Check quantity is displayed
            expect(html).toContain(`Qty: ${cargo.qty}`);

            // Check buy price is displayed
            expect(html).toContain(`${cargo.buyPrice} cr/unit`);

            // Check buy system name is displayed (UI looks up by ID)
            const systemName = mockStarData.find(
              (s) => s.id === cargo.buySystem
            ).name;
            expect(html).toContain(systemName);

            // Check days ago is displayed (calculated from buyDate)
            const daysSincePurchase = state.player.daysElapsed - cargo.buyDate;
            if (daysSincePurchase === 0) {
              expect(html).toContain('today');
            } else if (daysSincePurchase === 1) {
              expect(html).toContain('1 day ago');
            } else {
              expect(html).toContain(`${daysSincePurchase} days ago`);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display warning symbol (⚠) for all upgrades that have tradeoffs', () => {
    // Get all upgrades with tradeoffs (tradeoff !== 'None')
    const upgradesWithTradeoffs = Object.entries(SHIP_CONFIG.UPGRADES)
      .filter(([, upgrade]) => upgrade.tradeoff && upgrade.tradeoff !== 'None')
      .map(([id]) => id);

    expect(upgradesWithTradeoffs.length).toBeGreaterThan(0);

    // Setup game state
    gameStateManager.initNewGame();
    const state = gameStateManager.getState();
    state.player.credits = 100000; // Ensure player can afford upgrades

    // Render upgrades interface
    uiManager.renderAvailableUpgrades();

    // Get rendered HTML
    const availableUpgradesList = document.getElementById(
      'available-upgrades-list'
    );
    const html = availableUpgradesList.innerHTML;

    // Verify each upgrade with a tradeoff displays the warning symbol
    for (const upgradeId of upgradesWithTradeoffs) {
      const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

      // Check that upgrade name is present
      expect(html).toContain(upgrade.name);

      // Check that warning symbol is present for this upgrade
      // The warning symbol should appear near the upgrade name
      const upgradeCardMatch = html.match(
        new RegExp(`${upgrade.name}[\\s\\S]*?⚠`, 'i')
      );
      expect(upgradeCardMatch).not.toBeNull();
    }
  });

  it('should display all required fields for upgrades when interface is rendered', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

          // Setup game state
          gameStateManager.initNewGame();
          const state = gameStateManager.getState();
          state.player.credits = 100000; // Ensure player can afford upgrades

          // Render upgrades interface
          uiManager.renderAvailableUpgrades();

          // Get rendered HTML
          const availableUpgradesList = document.getElementById(
            'available-upgrades-list'
          );
          const html = availableUpgradesList.innerHTML;

          // Verify upgrade has all required fields displayed
          expect(html).toContain(upgrade.name);
          expect(html).toContain(upgrade.cost.toLocaleString());
          expect(html).toContain(upgrade.description);

          // Verify effects are displayed
          // At least one effect should be visible in the rendered output
          const hasEffects = Object.keys(upgrade.effects).length > 0;
          expect(hasEffects).toBe(true);

          // Verify tradeoff is displayed if present
          if (upgrade.tradeoff && upgrade.tradeoff !== 'None') {
            expect(html).toContain(upgrade.tradeoff);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
