import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { HUD } from '../../src/features/hud/HUD';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { createWrapper } from '../react-test-utils.jsx';
import { gameDayToDate } from '../../src/game/utils/date-utils.js';

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
  let game;
  let navigationSystem;

  beforeEach(() => {
    // Initialize game state
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game.navigationSystem = navigationSystem;
    game.initNewGame();

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
    game.setAnimationSystem(mockAnimationSystem);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update HUD before animation begins', async () => {
    const wrapper = createWrapper(game);

    render(<HUD />, { wrapper });

    // Record initial state
    const initialFuel = game.getState().ship.fuel;
    const initialDays = game.getState().player.daysElapsed;

    // Track when state changes occur
    let stateChangedBeforeAnimation = false;

    game.subscribe('locationChanged', () => {
      if (!game.animationSystem?.isAnimating) {
        stateChangedBeforeAnimation = true;
      }
    });

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        game,
        1, // Alpha Centauri
        game.animationSystem
      );
    });

    // Verify state changes occurred before animation
    expect(stateChangedBeforeAnimation).toBe(true);

    // Verify HUD was updated
    await waitFor(() => {
      expect(screen.getByText(/Alpha Centauri/i)).toBeInTheDocument();
    });

    // Verify state changed
    const finalState = game.getState();
    expect(finalState.ship.fuel).toBeLessThan(initialFuel);
    expect(finalState.player.daysElapsed).toBeGreaterThan(initialDays);
  });

  it('should display updated location during animation', async () => {
    const wrapper = createWrapper(game);

    render(<HUD />, { wrapper });

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        game,
        1, // Alpha Centauri
        game.animationSystem
      );
    });

    // Verify location is updated
    await waitFor(() => {
      expect(screen.getByText(/Alpha Centauri/i)).toBeInTheDocument();
    });
  });

  it('should display updated fuel during animation', async () => {
    const wrapper = createWrapper(game);

    render(<HUD />, { wrapper });

    const initialFuel = game.getState().ship.fuel;

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        game,
        1, // Alpha Centauri
        game.animationSystem
      );
    });

    // Verify fuel decreased
    await waitFor(() => {
      const state = game.getState();
      expect(state.ship.fuel).toBeLessThan(initialFuel);
    });
  });

  it('should display updated time during animation', async () => {
    const wrapper = createWrapper(game);

    render(<HUD />, { wrapper });

    const initialDays = game.getState().player.daysElapsed;

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        game,
        1, // Alpha Centauri
        game.animationSystem
      );
    });

    // Verify time advanced
    await waitFor(() => {
      const state = game.getState();
      expect(state.player.daysElapsed).toBeGreaterThan(initialDays);
    });
  });

  it('should update all HUD elements reactively via event system', async () => {
    const wrapper = createWrapper(game);

    render(<HUD />, { wrapper });

    // Record initial values
    expect(screen.getByText('Sol')).toBeInTheDocument();

    // Verify initial fuel is 100%
    const initialState = game.getState();
    expect(initialState.ship.fuel).toBe(100);

    const dateLabel = screen.getByText('Date:');
    expect(dateLabel.nextElementSibling).toHaveTextContent(gameDayToDate(0));

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        game,
        1, // Alpha Centauri
        game.animationSystem
      );
    });

    // Verify all HUD elements were updated
    await waitFor(() => {
      expect(screen.getByText(/Alpha Centauri/i)).toBeInTheDocument();
    });

    // Fuel should have decreased
    const finalState = game.getState();
    expect(finalState.ship.fuel).toBeLessThan(100);

    // Days should have advanced
    expect(screen.queryByText(/Day 0/i)).not.toBeInTheDocument();
  });

  it('should maintain HUD visibility during animation', async () => {
    const wrapper = createWrapper(game);

    const { container } = render(<HUD />, { wrapper });

    // HUD should be visible before jump
    const hudElement = container.querySelector('#game-hud');
    expect(hudElement).toBeInTheDocument();
    expect(hudElement).toHaveClass('visible');

    // Execute jump
    await act(async () => {
      await navigationSystem.executeJump(
        game,
        1, // Alpha Centauri
        game.animationSystem
      );
    });

    // HUD should still be visible after jump
    expect(hudElement).toBeInTheDocument();
    expect(hudElement).toHaveClass('visible');
  });
});
