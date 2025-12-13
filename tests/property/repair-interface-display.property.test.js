'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { UIManager } from '../../js/game-ui.js';
import { SHIP_CONFIG, REPAIR_CONFIG } from '../../js/game-constants.js';
import {
  setupRepairPanelDOM,
  createMinimalStarData,
  createMinimalWormholeData,
} from '../test-utils.js';

// Feature: dynamic-economy, Property 26: Repair Interface Display Completeness
// Validates: Requirements 7.2, 7.3, 7.4

describe('Property: Repair Interface Display Completeness', () => {
  let starData;
  let wormholeData;

  beforeEach(() => {
    starData = createMinimalStarData();
    wormholeData = createMinimalWormholeData();
    setupRepairPanelDOM();
  });

  it('should display current condition percentages with visual progress bars for all systems', () => {
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
          uiManager.repairPanelController.updateRepairConditionDisplay();

          // Verify hull display
          const hullPercent = document.getElementById('repair-hull-percent');
          const hullBar = document.getElementById('repair-hull-bar');
          expect(hullPercent.textContent).toBe(
            `${Math.round(condition.hull)}%`
          );
          expect(hullBar.style.width).toBe(`${condition.hull}%`);

          // Verify engine display
          const enginePercent = document.getElementById(
            'repair-engine-percent'
          );
          const engineBar = document.getElementById('repair-engine-bar');
          expect(enginePercent.textContent).toBe(
            `${Math.round(condition.engine)}%`
          );
          expect(engineBar.style.width).toBe(`${condition.engine}%`);

          // Verify life support display
          const lifeSupportPercent = document.getElementById(
            'repair-life-support-percent'
          );
          const lifeSupportBar = document.getElementById(
            'repair-life-support-bar'
          );
          expect(lifeSupportPercent.textContent).toBe(
            `${Math.round(condition.lifeSupport)}%`
          );
          expect(lifeSupportBar.style.width).toBe(`${condition.lifeSupport}%`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display repair options for 10%, 25%, 50% increments and full restoration for each system', () => {
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

          // Verify repair buttons exist for each system
          const systems = ['hull', 'engine', 'lifeSupport'];
          const amounts = ['10', '25', '50', 'full'];

          systems.forEach((systemType) => {
            amounts.forEach((amount) => {
              const button = document.querySelector(
                `.repair-btn[data-system="${systemType}"][data-amount="${amount}"]`
              );
              expect(button).not.toBeNull();
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display costs at ₡5 per 1% restored for each repair option', () => {
    fc.assert(
      fc.property(
        fc.record({
          hull: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX - 50,
          }),
          engine: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX - 50,
          }),
          lifeSupport: fc.integer({
            min: SHIP_CONFIG.CONDITION_BOUNDS.MIN,
            max: SHIP_CONFIG.CONDITION_BOUNDS.MAX - 50,
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

          // Verify costs for fixed amount repairs
          const systems = [
            { type: 'hull', current: condition.hull },
            { type: 'engine', current: condition.engine },
            { type: 'lifeSupport', current: condition.lifeSupport },
          ];

          systems.forEach(({ type, current }) => {
            [10, 25, 50].forEach((amount) => {
              const button = document.querySelector(
                `.repair-btn[data-system="${type}"][data-amount="${amount}"]`
              );

              const expectedCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
              expect(button.textContent).toContain(`₡${expectedCost}`);
            });

            // Verify full repair cost
            const fullButton = document.querySelector(
              `.repair-btn[data-system="${type}"][data-amount="full"]`
            );
            const fullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - current;
            const expectedFullCost =
              fullAmount * REPAIR_CONFIG.COST_PER_PERCENT;
            expect(fullButton.textContent).toContain(`₡${expectedFullCost}`);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display ₡0 cost for systems already at 100% condition', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        (systemAtMax) => {
          const gameStateManager = new GameStateManager(starData, wormholeData);
          gameStateManager.initNewGame();

          // Set one system to max, others to less than max
          const condition = {
            hull:
              systemAtMax === 'hull' ? SHIP_CONFIG.CONDITION_BOUNDS.MAX : 50,
            engine:
              systemAtMax === 'engine' ? SHIP_CONFIG.CONDITION_BOUNDS.MAX : 50,
            lifeSupport:
              systemAtMax === 'lifeSupport'
                ? SHIP_CONFIG.CONDITION_BOUNDS.MAX
                : 50,
          };

          gameStateManager.updateShipCondition(
            condition.hull,
            condition.engine,
            condition.lifeSupport
          );

          const uiManager = new UIManager(gameStateManager);
          uiManager.repairPanelController.updateRepairButtons();

          // Verify full repair button shows ₡0 for system at max
          const fullButton = document.querySelector(
            `.repair-btn[data-system="${systemAtMax}"][data-amount="full"]`
          );
          expect(fullButton.textContent).toContain('₡0');
        }
      ),
      { numRuns: 100 }
    );
  });
});
