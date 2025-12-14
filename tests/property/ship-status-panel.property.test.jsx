import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { ShipStatusPanel } from '../../src/features/ship-status/ShipStatusPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Property tests for ShipStatusPanel component
 *
 * Validates that the ship status panel correctly displays ship information
 * and updates reactively when ship data changes.
 *
 * React Migration Spec: Requirements 8.7
 */
describe('ShipStatusPanel Property Tests', () => {
  // Suppress React act() warnings for property tests
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (
        message.includes('act(') ||
        message.includes('Warning: ReactDOM.render')
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should render as a React component with all sections', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render ShipStatusPanel
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify the component renders
        const panel = container.querySelector('#ship-status-panel');
        expect(panel).toBeTruthy();
        expect(panel.classList.contains('ship-status-panel')).toBe(true);
        expect(panel.classList.contains('visible')).toBe(true);

        // Verify all main sections exist
        expect(panel.querySelector('h2')).toBeTruthy();
        expect(panel.querySelector('.close-btn')).toBeTruthy();

        // Verify condition section
        const conditionSection = Array.from(
          panel.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Condition'));
        expect(conditionSection).toBeTruthy();

        // Verify upgrades section
        const upgradesSection = Array.from(
          panel.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Upgrades'));
        expect(upgradesSection).toBeTruthy();

        // Verify quirks section
        const quirksSection = Array.from(
          panel.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Ship Quirks'));
        expect(quirksSection).toBeTruthy();
      }),
      { numRuns: 10 }
    );
  });

  it('should display ship name in header', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const shipName = gameStateManager.getShip().name;
        const wrapper = createWrapper(gameStateManager);

        // Render ShipStatusPanel
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify ship name is displayed in header
        const header = container.querySelector('h2');
        expect(header.textContent).toContain(shipName);
        expect(header.textContent).toContain('SHIP STATUS');
      }),
      { numRuns: 10 }
    );
  });

  it('should display all three condition bars', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render ShipStatusPanel
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Verify all three condition bars are present
        const conditionItems = container.querySelectorAll(
          '.ship-status-condition-item'
        );
        expect(conditionItems.length).toBe(3);

        // Verify each condition has a label and bar
        conditionItems.forEach((item) => {
          expect(item.querySelector('.info-label')).toBeTruthy();
          expect(item.querySelector('.condition-bar')).toBeTruthy();
          expect(item.querySelector('.condition-fill')).toBeTruthy();
          expect(item.querySelector('.condition-value')).toBeTruthy();
        });

        // Verify condition labels
        const labels = Array.from(
          container.querySelectorAll('.ship-status-condition-item .info-label')
        ).map((el) => el.textContent);
        expect(labels).toContain('Hull');
        expect(labels).toContain('Engine');
        expect(labels).toContain('Life Support');
      }),
      { numRuns: 10 }
    );
  });

  it('should display ship quirks with all details', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const ship = gameStateManager.getShip();
        const wrapper = createWrapper(gameStateManager);

        // Render ShipStatusPanel
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Find quirks section
        const quirksSection = Array.from(
          container.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Ship Quirks'));

        if (ship.quirks.length === 0) {
          // Should show empty message
          expect(quirksSection.textContent).toContain('No quirks');
        } else {
          // Should display each quirk
          const quirkItems = quirksSection.querySelectorAll('.quirk-item');
          expect(quirkItems.length).toBe(ship.quirks.length);

          // Verify each quirk has all required elements
          quirkItems.forEach((item, index) => {
            const quirkId = ship.quirks[index];
            const quirkDef = SHIP_CONFIG.QUIRKS[quirkId];

            expect(item.querySelector('.quirk-header')).toBeTruthy();
            expect(item.querySelector('.quirk-icon')).toBeTruthy();
            expect(item.querySelector('.quirk-name')).toBeTruthy();
            expect(item.querySelector('.quirk-description')).toBeTruthy();
            expect(item.querySelector('.quirk-flavor')).toBeTruthy();

            // Verify quirk name is displayed
            expect(item.textContent).toContain(quirkDef.name);
            expect(item.textContent).toContain(quirkDef.description);
            expect(item.textContent).toContain(quirkDef.flavor);
          });
        }
      }),
      { numRuns: 10 }
    );
  });

  it('should display upgrades or empty message', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const ship = gameStateManager.getShip();
        const wrapper = createWrapper(gameStateManager);

        // Render ShipStatusPanel
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Find upgrades section
        const upgradesSection = Array.from(
          container.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Upgrades'));

        if (ship.upgrades.length === 0) {
          // Should show empty message
          expect(upgradesSection.textContent).toContain(
            'No upgrades installed'
          );
        } else {
          // Should display each upgrade
          const upgradeItems = upgradesSection.querySelectorAll('.quirk-item');
          expect(upgradeItems.length).toBe(ship.upgrades.length);

          // Verify each upgrade has required elements
          upgradeItems.forEach((item, index) => {
            const upgradeId = ship.upgrades[index];
            const upgradeDef = SHIP_CONFIG.UPGRADES[upgradeId];

            expect(item.querySelector('.quirk-header')).toBeTruthy();
            expect(item.querySelector('.quirk-icon')).toBeTruthy();
            expect(item.querySelector('.quirk-name')).toBeTruthy();
            expect(item.querySelector('.quirk-description')).toBeTruthy();

            // Verify upgrade name is displayed
            expect(item.textContent).toContain(upgradeDef.name);
            expect(item.textContent).toContain(upgradeDef.description);
          });
        }
      }),
      { numRuns: 10 }
    );
  });

  it('should update ship name when shipNameChanged event fires', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 20 }),
        async (newName) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          // Render ShipStatusPanel
          const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
            wrapper,
          });

          // Get initial ship name
          const initialHeader = container.querySelector('h2');
          const initialName = gameStateManager.getShip().name;
          expect(initialHeader.textContent).toContain(initialName);

          // Update ship name
          gameStateManager.updateShipName(newName);

          // Wait for component to re-render
          await waitFor(() => {
            const header = container.querySelector('h2');
            const sanitizedName = gameStateManager.getShip().name;
            expect(header.textContent).toContain(sanitizedName);
            expect(header.textContent).not.toContain(initialName);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should update condition bars when shipConditionChanged event fires', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        async (newHull, newEngine, newLifeSupport) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          const wrapper = createWrapper(gameStateManager);

          // Render ShipStatusPanel
          const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
            wrapper,
          });

          // Update ship condition
          gameStateManager.state.ship.hull = newHull;
          gameStateManager.state.ship.engine = newEngine;
          gameStateManager.state.ship.lifeSupport = newLifeSupport;

          gameStateManager.emit('shipConditionChanged', {
            hull: newHull,
            engine: newEngine,
            lifeSupport: newLifeSupport,
          });

          // Wait for component to re-render
          await waitFor(() => {
            const conditionValues = Array.from(
              container.querySelectorAll('.condition-value')
            ).map((el) => parseInt(el.textContent));

            expect(conditionValues).toContain(newHull);
            expect(conditionValues).toContain(newEngine);
            expect(conditionValues).toContain(newLifeSupport);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should apply correct color class based on condition level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (hull, engine, lifeSupport) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Set specific condition values
          gameStateManager.state.ship.hull = hull;
          gameStateManager.state.ship.engine = engine;
          gameStateManager.state.ship.lifeSupport = lifeSupport;

          const wrapper = createWrapper(gameStateManager);

          // Render ShipStatusPanel
          const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
            wrapper,
          });

          // Get all condition bars
          const conditionBars = container.querySelectorAll('.condition-bar');

          // Verify each bar has appropriate color class
          const conditions = [hull, engine, lifeSupport];
          conditionBars.forEach((bar, index) => {
            const value = conditions[index];

            if (value < 30) {
              expect(bar.classList.contains('critical')).toBe(true);
            } else if (value < 60) {
              expect(bar.classList.contains('warning')).toBe(true);
            } else {
              expect(bar.classList.contains('good')).toBe(true);
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle missing quirk definitions gracefully', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Add an invalid quirk ID
        gameStateManager.state.ship.quirks.push('invalid_quirk_id');

        const wrapper = createWrapper(gameStateManager);

        // Should render without errors
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Panel should still render
        expect(container.querySelector('#ship-status-panel')).toBeTruthy();

        // Should only render valid quirks
        const quirksSection = Array.from(
          container.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Ship Quirks'));

        const quirkItems = quirksSection.querySelectorAll('.quirk-item');
        // Should have one less item than total quirks (invalid one filtered out)
        expect(quirkItems.length).toBe(
          gameStateManager.state.ship.quirks.length - 1
        );
      }),
      { numRuns: 10 }
    );
  });

  it('should handle missing upgrade definitions gracefully', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Add an invalid upgrade ID
        gameStateManager.state.ship.upgrades.push('invalid_upgrade_id');

        const wrapper = createWrapper(gameStateManager);

        // Should render without errors
        const { container } = render(<ShipStatusPanel onClose={() => {}} />, {
          wrapper,
        });

        // Panel should still render
        expect(container.querySelector('#ship-status-panel')).toBeTruthy();

        // Should only render valid upgrades
        const upgradesSection = Array.from(
          container.querySelectorAll('.ship-status-section')
        ).find((section) => section.textContent.includes('Upgrades'));

        const upgradeItems = upgradesSection.querySelectorAll('.quirk-item');
        // Should have one less item than total upgrades (invalid one filtered out)
        expect(upgradeItems.length).toBe(
          gameStateManager.state.ship.upgrades.length - 1
        );
      }),
      { numRuns: 10 }
    );
  });
});
