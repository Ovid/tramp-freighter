import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { ShipStatus } from '../../src/features/hud/ShipStatus.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';

/**
 * ShipStatus Null Safety Tests
 *
 * These tests specifically handle corrupted save data scenarios where ship condition
 * values might be null or undefined due to:
 * - Save file corruption
 * - Incomplete migration from older game versions
 * - Manual localStorage manipulation
 * - Network interruption during save/load
 *
 * The component should gracefully degrade by showing default values (100%) rather
 * than crashing, allowing players to continue playing even with corrupted data.
 *
 * NOTE: These are NOT normal operation tests - in normal gameplay, these values
 * should never be null after proper game initialization.
 */
describe('ShipStatus Null Safety', () => {
  let mockGameStateManager;
  let mockState;

  beforeEach(() => {
    // Mock complete game state structure to prevent useGameEvent from throwing
    mockState = {
      player: {
        credits: 1000,
        debt: 0,
        currentSystem: 1,
        daysElapsed: 0,
      },
      ship: {
        name: 'Test Ship',
        fuel: null, // This could be null in corrupted save data
        hull: null, // This could be null in corrupted save data
        engine: null, // This could be null in corrupted save data
        lifeSupport: null, // This could be null in corrupted save data
        cargo: [],
        cargoCapacity: 100,
        upgrades: [],
        quirks: [],
      },
      world: {
        visitedSystems: new Set([1]),
        priceKnowledge: {},
        activeEvents: [],
        flags: {},
      },
      dialogue: {
        currentNpcId: null,
        currentNodeId: null,
        isActive: false,
        display: null,
      },
    };

    mockGameStateManager = {
      getState: vi.fn(() => mockState),
      getShip: vi.fn(() => mockState.ship),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderShipStatus = () => {
    return render(
      <GameProvider gameStateManager={mockGameStateManager}>
        <ShipStatus />
      </GameProvider>
    );
  };

  it('should handle null fuel value without crashing', () => {
    // Arrange: Simulate corrupted save data with null fuel
    mockState.ship.fuel = null;

    // Act & Assert: Component should gracefully degrade, not crash
    expect(() => renderShipStatus()).not.toThrow();
  });

  it('should handle null hull value without crashing', () => {
    // Arrange: State has null hull
    mockState.ship.hull = null;

    // Act & Assert: Should not throw error
    expect(() => renderShipStatus()).not.toThrow();
  });

  it('should handle null engine value without crashing', () => {
    // Arrange: State has null engine
    mockState.ship.engine = null;

    // Act & Assert: Should not throw error
    expect(() => renderShipStatus()).not.toThrow();
  });

  it('should handle null lifeSupport value without crashing', () => {
    // Arrange: State has null lifeSupport
    mockState.ship.lifeSupport = null;

    // Act & Assert: Should not throw error
    expect(() => renderShipStatus()).not.toThrow();
  });

  it('should handle all null condition values without crashing', () => {
    // Arrange: All condition values are null
    mockState.ship.fuel = null;
    mockState.ship.hull = null;
    mockState.ship.engine = null;
    mockState.ship.lifeSupport = null;

    // Act & Assert: Should not throw error
    expect(() => renderShipStatus()).not.toThrow();
  });

  it('should display default values when ship condition data is null', () => {
    // Arrange: All condition values are null
    mockState.ship.fuel = null;
    mockState.ship.hull = null;
    mockState.ship.engine = null;
    mockState.ship.lifeSupport = null;

    // Act
    const { container } = renderShipStatus();

    // Assert: Should display default 100% values
    const conditionTexts = container.querySelectorAll('.condition-text');
    expect(conditionTexts).toHaveLength(4); // fuel, hull, engine, lifeSupport

    conditionTexts.forEach((element) => {
      expect(element.textContent).toBe('100.0%');
    });
  });

  it('should handle undefined values without crashing', () => {
    // Arrange: Values are undefined instead of null
    mockState.ship.fuel = undefined;
    mockState.ship.hull = undefined;
    mockState.ship.engine = undefined;
    mockState.ship.lifeSupport = undefined;

    // Act & Assert: Should not throw error
    expect(() => renderShipStatus()).not.toThrow();
  });

  it('should handle mixed null and valid values', () => {
    // Arrange: Some values are null, others are valid
    mockState.ship.fuel = 75.5;
    mockState.ship.hull = null;
    mockState.ship.engine = 50.0;
    mockState.ship.lifeSupport = null;

    // Act
    const { container } = renderShipStatus();

    // Assert: Should display mixed values correctly
    const conditionTexts = container.querySelectorAll('.condition-text');
    expect(conditionTexts[0].textContent).toBe('75.5%'); // fuel
    expect(conditionTexts[1].textContent).toBe('100.0%'); // hull (default)
    expect(conditionTexts[2].textContent).toBe('50.0%'); // engine
    expect(conditionTexts[3].textContent).toBe('100.0%'); // lifeSupport (default)
  });

  it('should handle the specific error case from the bug report', () => {
    // This test reproduces the exact scenario that caused the original error

    // Arrange: Simulate the state that would cause "Cannot read properties of null (reading 'toFixed')"
    mockState.ship.fuel = null;
    mockState.ship.hull = null;
    mockState.ship.engine = null;
    mockState.ship.lifeSupport = null;

    // Act & Assert: This should not crash with the null safety fixes
    expect(() => {
      render(
        <GameProvider gameStateManager={mockGameStateManager}>
          <ShipStatus />
        </GameProvider>
      );
    }).not.toThrow();
  });

  it('should gracefully handle corrupted save data scenario', () => {
    // Arrange: Simulate corrupted save data where ship properties might be missing or null
    mockState.ship = {
      name: 'Corrupted Ship',
      fuel: null,
      hull: null,
      engine: null,
      lifeSupport: null,
      cargo: null, // This could also be null
      cargoCapacity: 100,
    };

    // Mock getShip to return the corrupted ship data
    mockGameStateManager.getShip = vi.fn(() => mockState.ship);

    // Act & Assert: Should handle gracefully
    expect(() => renderShipStatus()).not.toThrow();

    // Should render with default values
    const { container } = renderShipStatus();
    const conditionTexts = container.querySelectorAll('.condition-text');

    // All condition bars should show default 100% values
    conditionTexts.forEach((element) => {
      expect(element.textContent).toBe('100.0%');
    });
  });
});
