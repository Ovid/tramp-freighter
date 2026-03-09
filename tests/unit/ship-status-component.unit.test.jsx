import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { ShipStatus } from '../../src/features/hud/ShipStatus.jsx';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
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
  let game;

  beforeEach(() => {
    cleanup();
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  it('should display ship name', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    expect(screen.getByText(state.ship.name)).toBeInTheDocument();
  });

  it('should display fuel percentage', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    const fuelBar = document.querySelector(
      '.fuel-bar-container .condition-text'
    );
    expect(fuelBar.textContent).toBe(`${Math.round(state.ship.fuel)}%`);
  });

  it('should display hull condition percentage', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    const hullBar = document.querySelector(
      '.hull-bar-container .condition-text'
    );
    expect(hullBar.textContent).toBe(`${Math.round(state.ship.hull)}%`);
  });

  it('should display engine condition percentage', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    const engineBar = document.querySelector(
      '.engine-bar-container .condition-text'
    );
    expect(engineBar.textContent).toBe(`${Math.round(state.ship.engine)}%`);
  });

  it('should display life support condition percentage', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    const lifeSupportBar = document.querySelector(
      '.life-support-bar-container .condition-text'
    );
    expect(lifeSupportBar.textContent).toBe(
      `${Math.round(state.ship.lifeSupport)}%`
    );
  });

  it('should update hull bar width when condition changes', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Update hull condition to 90%
    act(() => {
      game.updateShipCondition(90, 100, 100);
    });

    // Force re-render to pick up condition change
    rerender(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const hullBar = document.querySelector('.hull-bar');
    expect(hullBar.style.width).toBe('90%');
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('should update engine bar width when condition changes', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Update engine condition to 95%
    act(() => {
      game.updateShipCondition(100, 95, 100);
    });

    // Force re-render to pick up condition change
    rerender(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const engineBar = document.querySelector('.engine-bar');
    expect(engineBar.style.width).toBe('95%');
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should update life support bar width when condition changes', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Update life support condition to 89%
    act(() => {
      game.updateShipCondition(100, 100, 89);
    });

    // Force re-render to pick up condition change
    rerender(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const lifeSupportBar = document.querySelector('.life-support-bar');
    expect(lifeSupportBar.style.width).toBe('89%');
    expect(screen.getByText('89%')).toBeInTheDocument();
  });

  it('should update all condition bars reactively', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Update all conditions
    act(() => {
      game.updateShipCondition(75, 82, 68);
    });

    // Force re-render to pick up condition changes
    rerender(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const hullBar = document.querySelector('.hull-bar');
    const engineBar = document.querySelector('.engine-bar');
    const lifeSupportBar = document.querySelector('.life-support-bar');

    expect(hullBar.style.width).toBe('75%');
    expect(engineBar.style.width).toBe('82%');
    expect(lifeSupportBar.style.width).toBe('68%');

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('should handle zero percent condition', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Update engine to 0%
    act(() => {
      game.updateShipCondition(100, 0, 100);
    });

    // Force re-render
    rerender(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const engineBar = document.querySelector('.engine-bar');
    expect(engineBar.style.width).toBe('0%');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle 100 percent condition', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Initial state should be 100%
    const lifeSupportBar = document.querySelector('.life-support-bar');
    const lifeSupportText = document.querySelector(
      '.life-support-bar-container .condition-text'
    );
    expect(lifeSupportBar.style.width).toBe('100%');
    expect(lifeSupportText.textContent).toBe('100%');
  });

  it('should display cargo capacity', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    const ship = game.getShip();
    const cargoUsed = state.ship.cargo.reduce(
      (sum, stack) => sum + stack.qty,
      0
    );
    const cargoText = `${cargoUsed}/${ship.cargoCapacity}`;

    expect(screen.getByText(cargoText)).toBeInTheDocument();
  });

  it('should update cargo display when cargo changes', () => {
    const { rerender } = render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    // Buy some goods to change cargo
    const state = game.getState();
    const currentSystem = STAR_DATA.find(
      (s) => s.id === state.player.currentSystem
    );

    if (currentSystem && currentSystem.st > 0) {
      act(() => {
        game.buyGood('electronics', 10);
      });

      // Force re-render
      rerender(
        <GameProvider game={game}>
          <ShipStatus />
        </GameProvider>
      );

      const ship = game.getShip();
      const newState = game.getState();
      const cargoUsed = newState.ship.cargo.reduce(
        (sum, stack) => sum + stack.qty,
        0
      );
      const cargoText = `${cargoUsed}/${ship.cargoCapacity}`;

      expect(screen.getByText(cargoText)).toBeInTheDocument();
    }
  });

  it('should display fuel bar with correct width', () => {
    render(
      <GameProvider game={game}>
        <ShipStatus />
      </GameProvider>
    );

    const state = game.getState();
    const fuelBar = document.querySelector('.fuel-bar');
    expect(fuelBar.style.width).toBe(`${state.ship.fuel}%`);
  });
});
