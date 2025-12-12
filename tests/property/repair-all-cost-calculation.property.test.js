'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { SHIP_CONFIG, REPAIR_CONFIG } from '../../js/game-constants.js';

// Feature: dynamic-economy, Property 27: Repair All Cost Calculation
// Validates: Requirements 7.9

describe('Property: Repair All Cost Calculation', () => {
  let starData;
  let wormholeData;

  beforeEach(() => {
    // Minimal star data for testing
    starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2', wh: 3, st: 1, r: 1 },
      {
        id: 1,
        name: 'Alpha Centauri',
        x: 43,
        y: 0,
        z: 0,
        type: 'G2',
        wh: 1,
        st: 1,
        r: 1,
      },
    ];

    wormholeData = [[0, 1]];

    // Setup DOM elements for repair panel
    document.body.innerHTML = `
      <div id="game-hud"></div>
      <div id="repair-panel">
        <span id="repair-system-name"></span>
        <span id="repair-hull-percent"></span>
        <div id="repair-hull-bar"></div>
        <span id="repair-engine-percent"></span>
        <div id="repair-engine-bar"></div>
        <span id="repair-life-support-percent"></span>
        <div id="repair-life-support-bar"></div>
        <button class="repair-btn" data-system="hull" data-amount="10"></button>
        <button class="repair-btn" data-system="hull" data-amount="25"></button>
        <button class="repair-btn" data-system="hull" data-amount="50"></button>
        <button class="repair-btn" data-system="hull" data-amount="full"></button>
        <button class="repair-btn" data-system="engine" data-amount="10"></button>
        <button class="repair-btn" data-system="engine" data-amount="25"></button>
        <button class="repair-btn" data-system="engine" data-amount="50"></button>
        <button class="repair-btn" data-system="engine" data-amount="full"></button>
        <button class="repair-btn" data-system="lifeSupport" data-amount="10"></button>
        <button class="repair-btn" data-system="lifeSupport" data-amount="25"></button>
        <button class="repair-btn" data-system="lifeSupport" data-amount="50"></button>
        <button class="repair-btn" data-system="lifeSupport" data-amount="full"></button>
        <button id="repair-all-btn"></button>
        <div id="repair-validation-message"></div>
      </div>
      <div id="notification-area"></div>
    `;
  });

  it('should calculate repair all cost as sum of costs to repair each system to 100%', () => {
    fc.assert(
      fc.property(
        fc.record({
          hull: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          }),
          engine: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          }),
          lifeSupport: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          }),
        }),
        (condition) => {
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set ship condition
          gameStateManager.updateShipCondition(
            condition.hull,
            condition.engine,
            condition.lifeSupport
          );

          const uiManager = new UIManager(gameStateManager);

          // Calculate expected total cost
          const hullAmount = Math.max(
            0,
            SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull
          );
          const engineAmount = Math.max(
            0,
            SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine
          );
          const lifeSupportAmount = Math.max(
            0,
            SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport
          );

          const expectedTotalCost =
            hullAmount * REPAIR_CONFIG.COST_PER_PERCENT +
            engineAmount * REPAIR_CONFIG.COST_PER_PERCENT +
            lifeSupportAmount * REPAIR_CONFIG.COST_PER_PERCENT;

          // Get actual calculated cost
          const actualTotalCost =
            uiManager.repairPanelController.calculateRepairAllCost();

          expect(actualTotalCost).toBe(expectedTotalCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display repair all cost in the button text', () => {
    fc.assert(
      fc.property(
        fc.record({
          hull: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          }),
          engine: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          }),
          lifeSupport: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          }),
        }),
        (condition) => {
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set ship condition
          gameStateManager.updateShipCondition(
            condition.hull,
            condition.engine,
            condition.lifeSupport
          );

          const uiManager = new UIManager(gameStateManager);
          uiManager.repairPanelController.updateRepairButtons();

          // Calculate expected total cost
          const totalCost =
            uiManager.repairPanelController.calculateRepairAllCost();

          // Verify button text contains the cost
          const repairAllBtn = document.getElementById('repair-all-btn');
          expect(repairAllBtn.textContent).toContain(`₡${totalCost}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate ₡0 cost when all systems are at 100%', () => {
    const gameStateManager = new GameStateManager(starData, wormholeData);
    gameStateManager.initNewGame();

    // Set all systems to max
    gameStateManager.updateShipCondition(
      SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      SHIP_CONFIG.CONDITION_BOUNDS.MAX
    );

    const uiManager = new UIManager(gameStateManager);
    const totalCost = uiManager.repairPanelController.calculateRepairAllCost();

    expect(totalCost).toBe(0);
  });

  it('should calculate correct cost when only one system needs repair', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        fc.integer({
          min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
          max: SHIP_CONFIG.CONDITION_BOUNDS.MAX - 1,
        }),
        (systemToRepair, damagedCondition) => {
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set one system damaged, others at max
          const condition = {
            hull:
              systemToRepair === 'hull'
                ? damagedCondition
                : SHIP_CONFIG.CONDITION_BOUNDS.MAX,
            engine:
              systemToRepair === 'engine'
                ? damagedCondition
                : SHIP_CONFIG.CONDITION_BOUNDS.MAX,
            lifeSupport:
              systemToRepair === 'lifeSupport'
                ? damagedCondition
                : SHIP_CONFIG.CONDITION_BOUNDS.MAX,
          };

          gameStateManager.updateShipCondition(
            condition.hull,
            condition.engine,
            condition.lifeSupport
          );

          const uiManager = new UIManager(gameStateManager);
          const totalCost =
            uiManager.repairPanelController.calculateRepairAllCost();

          // Expected cost is only for the damaged system
          const expectedCost =
            (SHIP_CONFIG.CONDITION_BOUNDS.MAX - damagedCondition) *
            REPAIR_CONFIG.COST_PER_PERCENT;

          expect(totalCost).toBe(expectedCost);
        }
      ),
      { numRuns: 100 }
    );
  });
});
