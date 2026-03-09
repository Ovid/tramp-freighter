import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { GameProvider } from '../../src/context/GameContext';
import { StarmapProvider } from '../../src/context/StarmapContext';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

/**
 * Property-based tests for danger warning system
 *
 * Tests universal properties that must hold for all valid inputs
 * to the danger warning system.
 *
 * Feature: danger-system
 * Property: Danger Warning Consistency
 * Validates: Requirements 1.3, 12.3
 */
describe('Danger Warning System Properties', () => {
  let game;
  let navigationSystem;
  let mockStarmapContext;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      navigationSystem
    );
    game.initNewGame();

    mockStarmapContext = {
      selectStarById: vi.fn(),
    };

    // Mock console methods to avoid test noise
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderSystemPanel = (viewingSystemId, props = {}) => {
    return render(
      <GameProvider game={game}>
        <StarmapProvider value={mockStarmapContext}>
          <SystemPanel
            viewingSystemId={viewingSystemId}
            onClose={vi.fn()}
            onJumpStart={vi.fn()}
            onJumpComplete={vi.fn()}
            {...props}
          />
        </StarmapProvider>
      </GameProvider>
    );
  };

  // Arbitraries for property-based testing
  const arbSystemId = () => fc.integer({ min: 0, max: 116 }); // Valid system IDs
  const arbFuelLevel = () => fc.integer({ min: 0, max: 100 });
  const arbShipCondition = () =>
    fc.record({
      hull: fc.integer({ min: 0, max: 100 }),
      engine: fc.integer({ min: 0, max: 100 }),
      lifeSupport: fc.integer({ min: 0, max: 100 }),
    });
  const arbCargoValue = () => fc.integer({ min: 0, max: 50000 });
  const arbFactionRep = () =>
    fc.record({
      authorities: fc.integer({ min: -100, max: 100 }),
      traders: fc.integer({ min: -100, max: 100 }),
      outlaws: fc.integer({ min: -100, max: 100 }),
      civilians: fc.integer({ min: -100, max: 100 }),
    });

  describe('Property: Danger Warning Consistency', () => {
    it('should show danger warning if and only if destination is contested or dangerous', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbSystemId(),
          arbFuelLevel(),
          (currentSystemId, destinationSystemId, fuelLevel) => {
            // Skip if same system (no jump needed)
            fc.pre(currentSystemId !== destinationSystemId);

            // Set up game state
            game.updateLocation(currentSystemId);
            game.updateFuel(fuelLevel);

            // Get danger zone classification
            const dangerZone =
              game.dangerManager.getDangerZone(destinationSystemId);
            const isDangerous =
              dangerZone === 'contested' || dangerZone === 'dangerous';

            // Render SystemPanel
            const { unmount } = renderSystemPanel(destinationSystemId);

            try {
              // Check if jump button exists and is enabled
              const jumpButton = screen.queryByText('Jump to System');

              if (jumpButton && !jumpButton.disabled) {
                // Click jump button
                fireEvent.click(jumpButton);

                // Check if danger warning appears
                const dangerWarning = screen.queryByText('Jump Warning');
                const hasWarning = dangerWarning !== null;

                // Property: Warning appears if and only if system is dangerous
                expect(hasWarning).toBe(isDangerous);
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never show danger warning for safe systems', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbFuelLevel(),
          (currentSystemId, fuelLevel) => {
            // Set up game state
            game.updateLocation(currentSystemId);
            game.updateFuel(fuelLevel);

            // Test all safe systems
            const safeSystems = [0, 1, 4]; // Sol, Alpha Centauri, Barnard's Star

            for (const safeSystemId of safeSystems) {
              if (safeSystemId !== currentSystemId) {
                const { unmount } = renderSystemPanel(safeSystemId);

                try {
                  const jumpButton = screen.queryByText('Jump to System');

                  if (jumpButton && !jumpButton.disabled) {
                    fireEvent.click(jumpButton);

                    // Property: Safe systems never show danger warning
                    const dangerWarning = screen.queryByText('Jump Warning');
                    expect(dangerWarning).toBeNull();
                  }
                } finally {
                  unmount();
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always show danger warning for systems beyond 15 LY from Sol', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbFuelLevel(),
          (currentSystemId, fuelLevel) => {
            // Set up game state
            game.updateLocation(currentSystemId);
            game.updateFuel(fuelLevel);

            // Find systems beyond 15 LY from Sol
            const distantSystems = STAR_DATA.filter((system) => {
              const distance =
                Math.sqrt(
                  system.x * system.x +
                    system.y * system.y +
                    system.z * system.z
                ) / 10; // Convert to light years
              return distance > 15 && system.id !== currentSystemId;
            });

            if (distantSystems.length > 0) {
              const distantSystem = distantSystems[0];
              const { unmount } = renderSystemPanel(distantSystem.id);

              try {
                const jumpButton = screen.queryByText('Jump to System');

                if (jumpButton && !jumpButton.disabled) {
                  fireEvent.click(jumpButton);

                  // Property: Distant systems always show danger warning
                  const dangerWarning = screen.queryByText('Jump Warning');
                  expect(dangerWarning).not.toBeNull();
                }
              } finally {
                unmount();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Risk Assessment Accuracy', () => {
    it('should display risk percentages within valid range [0, 100]', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbSystemId(),
          arbShipCondition(),
          arbCargoValue(),
          arbFactionRep(),
          (
            currentSystemId,
            destinationSystemId,
            shipCondition,
            cargoValue,
            factionRep
          ) => {
            // Skip if same system
            fc.pre(currentSystemId !== destinationSystemId);

            // Set up game state
            game.updateLocation(currentSystemId);
            game.updateFuel(100); // Ensure sufficient fuel
            game.updateShipCondition(
              shipCondition.hull,
              shipCondition.engine,
              shipCondition.lifeSupport
            );

            // Set faction reputation
            const state = game.getState();
            state.player.factions = factionRep;

            // Add cargo if specified
            if (cargoValue > 0) {
              state.ship.cargo = [
                {
                  type: 'electronics',
                  quantity: Math.floor(cargoValue / 100),
                  purchasePrice: 100,
                  purchaseSystem: currentSystemId,
                  purchaseDate: 0,
                },
              ];
            }

            const dangerZone =
              game.dangerManager.getDangerZone(destinationSystemId);
            const isDangerous =
              dangerZone === 'contested' || dangerZone === 'dangerous';

            if (isDangerous) {
              const { unmount } = renderSystemPanel(destinationSystemId);

              try {
                const jumpButton = screen.queryByText('Jump to System');

                if (jumpButton && !jumpButton.disabled) {
                  fireEvent.click(jumpButton);

                  const dangerWarning = screen.queryByText('Jump Warning');
                  if (dangerWarning) {
                    // Find all percentage displays
                    const percentageElements = screen.getAllByText(/%$/);

                    percentageElements.forEach((element) => {
                      const percentText = element.textContent;
                      const percentValue = parseInt(
                        percentText.replace('%', '')
                      );

                      // Property: All percentages must be in valid range
                      expect(percentValue).toBeGreaterThanOrEqual(0);
                      expect(percentValue).toBeLessThanOrEqual(100);
                    });
                  }
                }
              } finally {
                unmount();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show higher pirate risk for high-value cargo', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          fc.integer({ min: 10000, max: 50000 }), // High cargo value
          (currentSystemId, cargoValue) => {
            // Set up game state with high-value cargo
            game.updateLocation(currentSystemId);
            game.updateFuel(100);

            const state = game.getState();
            state.ship.cargo = [
              {
                type: 'electronics',
                quantity: Math.floor(cargoValue / 1000),
                purchasePrice: 1000,
                purchaseSystem: currentSystemId,
                purchaseDate: 0,
              },
            ];

            // Test with a known dangerous system
            const dangerousSystemId = 73; // 70 Ophiuchi A
            if (dangerousSystemId !== currentSystemId) {
              const { unmount } = renderSystemPanel(dangerousSystemId);

              try {
                const jumpButton = screen.queryByText('Jump to System');

                if (jumpButton && !jumpButton.disabled) {
                  fireEvent.click(jumpButton);

                  const dangerWarning = screen.queryByText('Jump Warning');
                  if (dangerWarning) {
                    // Property: High-value cargo should show risk modifier
                    const cargoRiskText = screen.queryByText(
                      'Cargo value affects pirate encounter chance'
                    );
                    expect(cargoRiskText).not.toBeNull();
                  }
                }
              } finally {
                unmount();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show engine risk factor for damaged engines', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          fc.integer({ min: 0, max: 49 }), // Damaged engine (< 50%)
          (currentSystemId, engineCondition) => {
            // Set up game state with damaged engine
            game.updateLocation(currentSystemId);
            game.updateFuel(100);
            game.updateShipCondition(100, engineCondition, 100);

            // Test with a known dangerous system
            const dangerousSystemId = 73; // 70 Ophiuchi A
            if (dangerousSystemId !== currentSystemId) {
              const { unmount } = renderSystemPanel(dangerousSystemId);

              try {
                const jumpButton = screen.queryByText('Jump to System');

                if (jumpButton && !jumpButton.disabled) {
                  fireEvent.click(jumpButton);

                  const dangerWarning = screen.queryByText('Jump Warning');
                  if (dangerWarning) {
                    // Property: Damaged engine should show risk modifier
                    const engineRiskText = screen.queryByText(
                      'Poor engine condition increases pirate risk'
                    );
                    expect(engineRiskText).not.toBeNull();
                  }
                }
              } finally {
                unmount();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: User Interaction Consistency', () => {
    it('should always provide proceed and cancel options', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbSystemId(),
          (currentSystemId, destinationSystemId) => {
            // Skip if same system
            fc.pre(currentSystemId !== destinationSystemId);

            // Set up game state
            game.updateLocation(currentSystemId);
            game.updateFuel(100);

            const dangerZone =
              game.dangerManager.getDangerZone(destinationSystemId);
            const isDangerous =
              dangerZone === 'contested' || dangerZone === 'dangerous';

            if (isDangerous) {
              const { unmount } = renderSystemPanel(destinationSystemId);

              try {
                const jumpButton = screen.queryByText('Jump to System');

                if (jumpButton && !jumpButton.disabled) {
                  fireEvent.click(jumpButton);

                  const dangerWarning = screen.queryByText('Jump Warning');
                  if (dangerWarning) {
                    // Property: Must always have proceed and cancel options
                    const proceedButton = screen.queryByText(/Proceed/);
                    const cancelButton = screen.queryByText('Cancel Jump');

                    expect(proceedButton).not.toBeNull();
                    expect(cancelButton).not.toBeNull();
                  }
                }
              } finally {
                unmount();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always provide close button', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbSystemId(),
          (currentSystemId, destinationSystemId) => {
            // Skip if same system
            fc.pre(currentSystemId !== destinationSystemId);

            // Set up game state
            game.updateLocation(currentSystemId);
            game.updateFuel(100);

            const dangerZone =
              game.dangerManager.getDangerZone(destinationSystemId);
            const isDangerous =
              dangerZone === 'contested' || dangerZone === 'dangerous';

            if (isDangerous) {
              const { unmount } = renderSystemPanel(destinationSystemId);

              try {
                const jumpButton = screen.queryByText('Jump to System');

                if (jumpButton && !jumpButton.disabled) {
                  fireEvent.click(jumpButton);

                  const dangerWarning = screen.queryByText('Jump Warning');
                  if (dangerWarning) {
                    // Property: Must always have close button in the danger dialog
                    const dangerDialog = screen
                      .getByText('Jump Warning')
                      .closest('#danger-warning-dialog');
                    const closeButton =
                      dangerDialog.querySelector('.close-btn');
                    expect(closeButton).not.toBeNull();
                  }
                }
              } finally {
                unmount();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Component Stability', () => {
    it('should never crash with any valid game state', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbSystemId(),
          arbShipCondition(),
          arbFuelLevel(),
          arbFactionRep(),
          (
            currentSystemId,
            destinationSystemId,
            shipCondition,
            fuelLevel,
            factionRep
          ) => {
            // Skip if same system
            fc.pre(currentSystemId !== destinationSystemId);

            // Set up potentially problematic game state
            game.updateLocation(currentSystemId);
            game.updateFuel(fuelLevel);
            game.updateShipCondition(
              shipCondition.hull,
              shipCondition.engine,
              shipCondition.lifeSupport
            );

            const state = game.getState();
            state.player.factions = factionRep;

            // Property: Should never crash regardless of input
            expect(() => {
              const { unmount } = renderSystemPanel(destinationSystemId);

              try {
                const jumpButton = screen.queryByText('Jump to System');
                if (jumpButton) {
                  fireEvent.click(jumpButton);
                }
              } finally {
                unmount();
              }
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null or undefined faction data gracefully', () => {
      fc.assert(
        fc.property(
          arbSystemId(),
          arbSystemId(),
          (currentSystemId, destinationSystemId) => {
            // Skip if same system
            fc.pre(currentSystemId !== destinationSystemId);

            // Set up game state with corrupted faction data
            game.updateLocation(currentSystemId);
            game.updateFuel(100);

            const state = game.getState();
            state.player.factions = fc.sample(
              fc.oneof(
                fc.constant(null),
                fc.constant(undefined),
                fc.constant({})
              ),
              1
            )[0];

            const dangerZone =
              game.dangerManager.getDangerZone(destinationSystemId);
            const isDangerous =
              dangerZone === 'contested' || dangerZone === 'dangerous';

            if (isDangerous) {
              // Property: Should not crash with corrupted faction data
              expect(() => {
                const { unmount } = renderSystemPanel(destinationSystemId);

                try {
                  const jumpButton = screen.queryByText('Jump to System');
                  if (jumpButton && !jumpButton.disabled) {
                    fireEvent.click(jumpButton);
                  }
                } finally {
                  unmount();
                }
              }).not.toThrow();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
