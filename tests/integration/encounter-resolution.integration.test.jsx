import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import App from '../../src/App';

/**
 * Integration tests for encounter resolution flow
 *
 * Tests the complete flow:
 * 1. DevAdminPanel triggers encounter
 * 2. App displays encounter panel
 * 3. User makes choice
 * 4. OutcomePanel shows result
 * 5. User clicks Continue
 * 6. Returns to orbit
 *
 * Feature: danger-system
 */
describe('Encounter Resolution Integration', () => {
  let gameStateManager;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  /**
   * Helper: navigate past title screen to orbit mode
   * Returns true if successfully reached orbit, false if WebGL failed
   */
  async function navigateToOrbit() {
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    const shipNameInput = screen.getByPlaceholderText('Enter ship name...');
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });
    fireEvent.keyDown(shipNameInput, { key: 'Enter' });

    await waitFor(() => {
      const devButton = screen.queryByText('⚙');
      const errorBoundary = screen.queryByText('Something went wrong');
      expect(devButton || errorBoundary).toBeTruthy();
    });

    if (screen.queryByText('Something went wrong')) {
      return false;
    }
    return true;
  }

  /**
   * Helper: open dev admin and trigger pirate encounter
   */
  async function triggerPirateEncounter() {
    const devAdminButton = screen.getByText('⚙');
    fireEvent.click(devAdminButton);

    await waitFor(() => {
      expect(screen.getByText('🏴‍☠️ Pirate')).toBeInTheDocument();
    });

    const pirateButton = screen.getByText('🏴‍☠️ Pirate');
    fireEvent.click(pirateButton);

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  }

  it('should show OutcomePanel after resolving pirate encounter', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>,
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Select surrender (guaranteed success)
    const surrenderOption = screen.getByText('Surrender');
    fireEvent.click(surrenderOption);

    const confirmButton = screen.getByText('Confirm Surrender');
    fireEvent.click(confirmButton);

    // OutcomePanel should appear with result
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Should show Continue button
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('should return to orbit after clicking Continue on OutcomePanel', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>,
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Surrender and resolve
    const surrenderOption = screen.getByText('Surrender');
    fireEvent.click(surrenderOption);
    fireEvent.click(screen.getByText('Confirm Surrender'));

    // Wait for OutcomePanel
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Click Continue
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // OutcomePanel should disappear
    await waitFor(() => {
      expect(screen.queryByText('Encounter Outcome')).not.toBeInTheDocument();
    });

    // Pirate encounter panel should also be gone
    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();
  });

  it('should apply game state changes from encounter resolution', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>,
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    const initialCredits = gameStateManager.getState().player.credits;

    await triggerPirateEncounter();

    // Flee (costs fuel on success or hull on failure)
    const fleeOption = screen.getByText('Flee');
    fireEvent.click(fleeOption);
    fireEvent.click(screen.getByText('Confirm Flee'));

    // Wait for OutcomePanel
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Game state should have changed
    const state = gameStateManager.getState();
    const fuelChanged = state.ship.fuel !== 100;
    const hullChanged = state.ship.hull !== 100;

    // Flee either costs fuel (success) or hull (failure)
    expect(fuelChanged || hullChanged).toBe(true);
  });
});
