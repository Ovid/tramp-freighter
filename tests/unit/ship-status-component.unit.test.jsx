import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { ShipStatus } from '../../src/features/hud/ShipStatus.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Unit tests for ShipStatus React component
 *
 * Tests the React ShipStatus component functionality including:
 * - Displaying ship name, fuel, condition bars, and cargo
 * - Updating display when ship condition changes
 * - Correct percentage formatting
 * - Bar width reflects condition percentage
 */
describe('ShipStatus Component', () => {
  let gameStateManager;

  beforeEach(() => {
    cleanup();
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should display ship name', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    expect(screen.getByText(state.ship.name)).toBeInTheDocument();
  });

  it('should display fuel percentage', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    const fuelBar = document.querySelector('.fuel-bar-container .condition-text');
    expect(fuelBar.textContent).toBe(`${state.ship.fuel.toFixed(1)}%`);
  });

  it('should display hull condition percentage', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    const hullBar = document.querySelector('.hull-bar-container .condition-text');
    expect(hullBar.textContent).toBe(`${state.ship.hull.toFixed(1)}%`);
  });

  it('should display engine condition percentage', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    const engineBar = document.querySelector('.engine-bar-container .condition-text');
    expect(engineBar.textContent).toBe(`${state.ship.engine.toFixed(1)}%`);
  });

  it('should display life support condition percentage', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    const lifeSupportBar = document.querySelector('.life-support-bar-container .condition-text');
    expect(lifeSupportBar.textContent).toBe(`${state.ship.lifeSupport.toFixed(1)}%`);
  });

  it('should update hull bar width when condition changes', () => {
    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Update hull condition to 90%
    act(() => {
      gameStateManager.updateShipCondition(90, 100, 100);
    });

    // Force re-render to pick up condition change
    rerender(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const hullBar = document.querySelector('.hull-bar');
    expect(hullBar.style.width).toBe('90%');
    expect(screen.getByText('90.0%')).toBeInTheDocument();
  });

  it('should update engine bar width when condition changes', () => {
    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Update engine condition to 95%
    act(() => {
      gameStateManager.updateShipCondition(100, 95, 100);
    });

    // Force re-render to pick up condition change
    rerender(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const engineBar = document.querySelector('.engine-bar');
    expect(engineBar.style.width).toBe('95%');
    expect(screen.getByText('95.0%')).toBeInTheDocument();
  });

  it('should update life support bar width when condition changes', () => {
    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Update life support condition to 89%
    act(() => {
      gameStateManager.updateShipCondition(100, 100, 89);
    });

    // Force re-render to pick up condition change
    rerender(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const lifeSupportBar = document.querySelector('.life-support-bar');
    expect(lifeSupportBar.style.width).toBe('89%');
    expect(screen.getByText('89.0%')).toBeInTheDocument();
  });

  it('should update all condition bars reactively', () => {
    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Update all conditions
    act(() => {
      gameStateManager.updateShipCondition(75, 82, 68);
    });

    // Force re-render to pick up condition changes
    rerender(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const hullBar = document.querySelector('.hull-bar');
    const engineBar = document.querySelector('.engine-bar');
    const lifeSupportBar = document.querySelector('.life-support-bar');

    expect(hullBar.style.width).toBe('75%');
    expect(engineBar.style.width).toBe('82%');
    expect(lifeSupportBar.style.width).toBe('68%');

    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('82.0%')).toBeInTheDocument();
    expect(screen.getByText('68.0%')).toBeInTheDocument();
  });

  it('should handle zero percent condition', () => {
    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Update engine to 0%
    act(() => {
      gameStateManager.updateShipCondition(100, 0, 100);
    });

    // Force re-render
    rerender(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const engineBar = document.querySelector('.engine-bar');
    expect(engineBar.style.width).toBe('0%');
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('should handle 100 percent condition', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Initial state should be 100%
    const lifeSupportBar = document.querySelector('.life-support-bar');
    const lifeSupportText = document.querySelector('.life-support-bar-container .condition-text');
    expect(lifeSupportBar.style.width).toBe('100%');
    expect(lifeSupportText.textContent).toBe('100.0%');
  });

  it('should display cargo capacity', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    const ship = gameStateManager.getShip();
    const cargoUsed = state.ship.cargo.reduce((sum, stack) => sum + stack.qty, 0);
    const cargoText = `${cargoUsed}/${ship.cargoCapacity}`;

    expect(screen.getByText(cargoText)).toBeInTheDocument();
  });

  it('should update cargo display when cargo changes', () => {
    const { rerender } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    // Buy some goods to change cargo
    const state = gameStateManager.getState();
    const currentSystem = STAR_DATA.find((s) => s.id === state.player.currentSystem);
    
    if (currentSystem && currentSystem.st > 0) {
      act(() => {
        gameStateManager.buyGood('electronics', 10);
      });

      // Force re-render
      rerender(
        <GameProvider gameStateManager={gameStateManager}>
          <ShipStatus />
        </GameProvider>
      );

      const ship = gameStateManager.getShip();
      const newState = gameStateManager.getState();
      const cargoUsed = newState.ship.cargo.reduce((sum, stack) => sum + stack.qty, 0);
      const cargoText = `${cargoUsed}/${ship.cargoCapacity}`;

      expect(screen.getByText(cargoText)).toBeInTheDocument();
    }
  });

  it('should display fuel bar with correct width', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <ShipStatus />
      </GameProvider>
    );

    const state = gameStateManager.getState();
    const fuelBar = document.querySelector('.fuel-bar');
    expect(fuelBar.style.width).toBe(`${state.ship.fuel}%`);
  });
});
