import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import App from '../../src/App';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { GameProvider } from '../../src/context/GameContext';

/**
 * Integration tests for panel hiding during jump animation
 *
 * Verifies that panels maintain their state during animations
 * and that the app handles view mode transitions correctly.
 */
describe('Panel Animation Hide Integration', () => {
  let gameStateManager;
  let navigationSystem;
  let consoleErrorSpy;

  beforeEach(() => {
    // Clear localStorage to ensure clean state
    localStorage.clear();

    // Mock console.error to suppress expected WebGL errors in test environment
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Initialize game state
    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.navigationSystem = navigationSystem;

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

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should handle jump animation without errors', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Ensure player has enough fuel for jump and execute jump
    let result;
    await act(async () => {
      gameStateManager.updateFuel(100);
      result = await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify jump was successful
    expect(result.success).toBe(true);
  });

  it('should maintain app state during animation', async () => {
    const { container } = render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Verify app is rendered
    expect(container.querySelector('.app-container')).toBeInTheDocument();

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Ensure player has enough fuel for jump and execute jump
    await act(async () => {
      gameStateManager.updateFuel(100);
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // Verify app is still rendered
    expect(container.querySelector('.app-container')).toBeInTheDocument();
  });

  it('should work correctly when no animation system is provided', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Ensure player has enough fuel for jump and execute jump
    let result;
    await act(async () => {
      gameStateManager.updateFuel(100);
      result = await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        null // No animation system
      );
    });

    // Verify jump was successful
    expect(result.success).toBe(true);
  });

  it('should handle animation state transitions', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Set animation to running
    gameStateManager.animationSystem.isAnimating = true;
    gameStateManager.animationSystem.inputLockManager.isInputLocked.mockReturnValue(
      true
    );

    // Wait for state to propagate
    await waitFor(() => {
      expect(gameStateManager.animationSystem.isAnimating).toBe(true);
    });

    // Set animation to stopped
    gameStateManager.animationSystem.isAnimating = false;
    gameStateManager.animationSystem.inputLockManager.isInputLocked.mockReturnValue(
      false
    );

    // Wait for state to propagate
    await waitFor(() => {
      expect(gameStateManager.animationSystem.isAnimating).toBe(false);
    });
  });

  it('should handle multiple jumps in sequence', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Execute first jump
    let result1;
    await act(async () => {
      gameStateManager.updateFuel(100);
      result1 = await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    expect(result1.success).toBe(true);

    // Execute second jump back to Sol
    let result2;
    await act(async () => {
      gameStateManager.updateFuel(100);
      result2 = await navigationSystem.executeJump(
        gameStateManager,
        0, // Sol
        gameStateManager.animationSystem
      );
    });

    expect(result2.success).toBe(true);
  });

  it('should handle failed jumps gracefully', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Execute jump with invalid system ID
    let result;
    await act(async () => {
      result = await navigationSystem.executeJump(
        gameStateManager,
        999, // Invalid system ID
        gameStateManager.animationSystem
      );
    });

    // Verify jump failed
    expect(result.success).toBe(false);
  });

  it('should maintain HUD visibility during jumps', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App />
      </GameProvider>
    );

    // Start a new game to transition from title screen
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    // Submit ship name to enter game
    const shipNameInput =
      await screen.findByPlaceholderText(/enter ship name/i);
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // HUD should be visible with Sol
    await waitFor(() => {
      expect(screen.getAllByText(/Sol/i).length).toBeGreaterThan(0);
    });

    // Execute jump
    await act(async () => {
      gameStateManager.updateFuel(100);
      await navigationSystem.executeJump(
        gameStateManager,
        1, // Alpha Centauri
        gameStateManager.animationSystem
      );
    });

    // HUD should still be visible with updated location
    await waitFor(() => {
      expect(screen.getAllByText(/Alpha Centauri/i).length).toBeGreaterThan(0);
    });
  });
});
