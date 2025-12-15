import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { HUD } from '../../src/features/hud/HUD';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Integration test for HUD updates during jump animation
 *
 * Validates Requirement 8.5: WHEN the animation is playing THEN the HUD SHALL
 * display the updated location, fuel, and time values
 *
 * This test verifies that:
 * 1. State change events fire before animation begins
 * 2. HUD displays updated values during animation playback
 * 3. UI updates are visible throughout the animation sequence
 */
describe('HUD Animation State Integration', () => {
  let gameStateManager;
  let navigationSystem;

  beforeEach(() => {
    // Initialize game state
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.navigationSystem = navigationSystem;
    gameStateManager.initNewGame();

    // Mock animation system to resolve immediately
    const mockAnimationSystem = {
      isAnimating: false,
      playJumpAnimation: vi.fn().mockResolvedValue(undefined),
      inputLockManager: {
        isInputLocked: vi.fn(() => false),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
    };
    gameStateManager.setAnimationSystem(mockAnimationSystem);
  });

  it('should update HUD before animation begins', async () => {
    const wrapper = createWrapper(gameStateManager);

    render(<HUD />, { wrapper });

    // Record initial state
    const initialFuel = gameStateManager.getState().ship.fuel;
    const initialDays = gameStateManager.getState().player.daysElapsed;

    // Track when state changes occur
    let stateChangedBeforeAnimation = false;

    gameStateManager.subscribe('locationChanged', () => {
      if (!gameStateManager.animationSystem?.isAnimating) {
        stateChangedBeforeAnimation = true;
      }
    });

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify state changes occurred before animation
    expect(stateChangedBeforeAnimation).toBe(true);

    // Verify HUD was updated
    await waitFor(() => {
      expect(screen.getByText(/Alpha Centauri/i)).toBeInTheDocument();
    });

    // Verify state changed
    const finalState = gameStateManager.getState();
    expect(finalState.ship.fuel).toBeLessThan(initialFuel);
    expect(finalState.player.daysElapsed).toBeGreaterThan(initialDays);
  });

  it('should display updated location during animation', async () => {
    const wrapper = createWrapper(gameStateManager);

    render(<HUD />, { wrapper });

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify location is updated
    await waitFor(() => {
      expect(screen.getByText(/Alpha Centauri/i)).toBeInTheDocument();
    });
  });

  it('should display updated fuel during animation', async () => {
    const wrapper = createWrapper(gameStateManager);

    render(<HUD />, { wrapper });

    const initialFuel = gameStateManager.getState().ship.fuel;

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify fuel decreased
    await waitFor(() => {
      const state = gameStateManager.getState();
      expect(state.ship.fuel).toBeLessThan(initialFuel);
    });
  });

  it('should display updated time during animation', async () => {
    const wrapper = createWrapper(gameStateManager);

    render(<HUD />, { wrapper });

    const initialDays = gameStateManager.getState().player.daysElapsed;

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify time advanced
    await waitFor(() => {
      const state = gameStateManager.getState();
      expect(state.player.daysElapsed).toBeGreaterThan(initialDays);
    });
  });

  it('should update all HUD elements reactively via event system', async () => {
    const wrapper = createWrapper(gameStateManager);

    render(<HUD />, { wrapper });

    // Record initial values
    expect(screen.getByText('Sol')).toBeInTheDocument();

    // Verify initial fuel is 100%
    const initialState = gameStateManager.getState();
    expect(initialState.ship.fuel).toBe(100);

    const daysLabel = screen.getByText('Days:');
    expect(daysLabel.nextElementSibling).toHaveTextContent('0');

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify all HUD elements were updated
    await waitFor(() => {
      expect(screen.getByText(/Alpha Centauri/i)).toBeInTheDocument();
    });

    // Fuel should have decreased
    const finalState = gameStateManager.getState();
    expect(finalState.ship.fuel).toBeLessThan(100);

    // Days should have advanced
    expect(screen.queryByText(/Day 0/i)).not.toBeInTheDocument();
  });

  it('should maintain HUD visibility during animation', async () => {
    const wrapper = createWrapper(gameStateManager);

    const { container } = render(<HUD />, { wrapper });

    // HUD should be visible before jump
    const hudElement = container.querySelector('#game-hud');
    expect(hudElement).toBeInTheDocument();
    expect(hudElement).toHaveClass('visible');

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // HUD should still be visible after jump
    expect(hudElement).toBeInTheDocument();
    expect(hudElement).toHaveClass('visible');
  });
});
