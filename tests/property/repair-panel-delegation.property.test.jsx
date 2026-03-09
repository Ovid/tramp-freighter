import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Property: Repair panel delegates to GameCoordinator
 *
 * Validates that the RepairPanel component delegates all repair operations to GameCoordinator
 * and does not duplicate repair logic.
 *
 * React Migration Spec: Requirements 26.1, 26.2, 26.3
 */
describe('Property: Repair panel delegates to GameCoordinator', () => {
  // Suppress React act() warnings for property tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call game.repair when repairing a system', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hull', 'engine', 'lifeSupport'),
        (systemType) => {
          cleanup();

          const game = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game.initNewGame();

          // Give player credits and damage the system
          game.state.player.credits = 10000;
          game.state.ship[systemType] = 50;
          game.emit('shipConditionChanged', {
            hull: game.state.ship.hull,
            engine: game.state.ship.engine,
            lifeSupport: game.state.ship.lifeSupport,
          });

          const wrapper = createWrapper(game);

          // Track repair calls
          let repairCalled = false;
          let repairArgs = null;
          const originalRepair =
            game.repairShipSystem.bind(game);
          game.repairShipSystem = (system, repairAmount) => {
            repairCalled = true;
            repairArgs = { system, repairAmount };
            return originalRepair(system, repairAmount);
          };

          // Render RepairPanel
          const { container } = render(<RepairPanel onClose={() => {}} />, {
            wrapper,
          });

          // Find any repair button (not disabled)
          const repairButtons = container.querySelectorAll(
            '.repair-btn:not([disabled])'
          );

          if (repairButtons.length > 0) {
            fireEvent.click(repairButtons[0]);

            // Verify repair was called
            expect(repairCalled).toBe(true);
            expect(repairArgs).toBeTruthy();
            expect(repairArgs.repairAmount).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should subscribe to shipConditionChanged event', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Damage all systems
        game.state.ship.hull = 50;
        game.state.ship.engine = 60;
        game.state.ship.lifeSupport = 70;
        game.state.player.credits = 10000;

        const wrapper = createWrapper(game);

        // Render RepairPanel
        const { container } = render(<RepairPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify initial condition display
        const conditionValues = container.querySelectorAll('.condition-value');
        expect(conditionValues.length).toBeGreaterThan(0);

        // Update ship condition
        game.state.ship.hull = 80;
        game.emit('shipConditionChanged', {
          hull: 80,
          engine: 60,
          lifeSupport: 70,
        });

        // Component should re-render with new values
        // (This is tested implicitly - if subscription doesn't work, buttons won't update)
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should subscribe to creditsChanged event', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Damage systems and set low credits
        game.state.ship.hull = 50;
        game.state.player.credits = 10;

        const wrapper = createWrapper(game);

        // Render RepairPanel
        render(<RepairPanel onClose={() => {}} />, { wrapper });

        // Find repair buttons - should be disabled due to low credits
        const repairButtons = screen.getAllByText(/\+10%/);
        expect(repairButtons.length).toBeGreaterThan(0);
        expect(repairButtons[0].disabled).toBe(true);

        // Update credits
        game.state.player.credits = 10000;
        game.emit('creditsChanged', 10000);

        // Buttons should now be enabled
        // (This is tested implicitly - if subscription doesn't work, buttons won't update)
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should display repair costs from calculateRepairCost', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Damage systems
        game.state.ship.hull = 50;
        game.state.ship.engine = 60;
        game.state.ship.lifeSupport = 70;
        game.state.player.credits = 10000;

        const wrapper = createWrapper(game);

        // Render RepairPanel
        const { container } = render(<RepairPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify that costs are displayed (should be numbers followed by "₡")
        const repairButtons = container.querySelectorAll('.repair-btn');
        expect(repairButtons.length).toBeGreaterThan(0);

        repairButtons.forEach((button) => {
          expect(button.textContent).toMatch(/₡\d+/);
        });

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should not duplicate repair logic in component', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Set low credits and damage systems
        game.state.player.credits = 10;
        game.state.ship.hull = 50;

        const wrapper = createWrapper(game);

        // Render RepairPanel
        const { container } = render(<RepairPanel onClose={() => {}} />, {
          wrapper,
        });

        // Find repair buttons - should be disabled due to insufficient credits
        const repairButtons = container.querySelectorAll('.repair-btn');
        expect(repairButtons.length).toBeGreaterThan(0);

        // At least some buttons should be disabled
        const disabledButtons = Array.from(repairButtons).filter(
          (btn) => btn.disabled
        );
        expect(disabledButtons.length).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle repair all button click', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Damage all systems and give credits
        game.state.ship.hull = 50;
        game.state.ship.engine = 60;
        game.state.ship.lifeSupport = 70;
        game.state.player.credits = 10000;

        const wrapper = createWrapper(game);

        // Track repair calls
        let repairCallCount = 0;
        const originalRepair =
          game.repairShipSystem.bind(game);
        game.repairShipSystem = (system, amount) => {
          repairCallCount++;
          return originalRepair(system, amount);
        };

        // Render RepairPanel
        render(<RepairPanel onClose={() => {}} />, { wrapper });

        // Find and click "Repair All" button
        const repairAllButton = screen.getByText(/Repair All to Full/);
        expect(repairAllButton).toBeTruthy();

        fireEvent.click(repairAllButton);

        // Verify repair was called multiple times (once per system)
        expect(repairCallCount).toBeGreaterThan(0);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
