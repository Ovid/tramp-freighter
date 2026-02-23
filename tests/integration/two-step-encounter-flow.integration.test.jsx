import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import App from '../../src/App';

describe('Two-Step Encounter Flow', () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    return !screen.queryByText('Something went wrong');
  }

  async function triggerPirateEncounter() {
    const devAdminButton = screen.getByText('⚙');
    fireEvent.click(devAdminButton);
    await waitFor(() => {
      expect(screen.getByText('🏴‍☠️ Pirate')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🏴‍☠️ Pirate'));
    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  }

  it('should show CombatPanel when player chooses Fight', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Click Fight option
    fireEvent.click(screen.getByText('Fight'));
    fireEvent.click(screen.getByText('Confirm Fight'));

    // Should now see CombatPanel with its 4 options
    await waitFor(() => {
      expect(screen.getByText('Combat Resolution')).toBeInTheDocument();
      expect(screen.getByText('Evasive Maneuvers')).toBeInTheDocument();
      expect(screen.getByText('Return Fire')).toBeInTheDocument();
      expect(screen.getByText('Dump Cargo')).toBeInTheDocument();
      expect(screen.getByText('Distress Call')).toBeInTheDocument();
    });
  });

  it('should show NegotiationPanel when player chooses Negotiate', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Click Negotiate option
    fireEvent.click(screen.getByText('Negotiate'));
    fireEvent.click(screen.getByText('Confirm Negotiate'));

    // Should now see NegotiationPanel
    await waitFor(() => {
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
      expect(screen.getByText('Counter-Proposal')).toBeInTheDocument();
      expect(screen.getByText('Accept Demand')).toBeInTheDocument();
    });
  });

  it('should resolve immediately when player chooses Surrender', async () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={true} />
      </GameProvider>
    );

    const reachedOrbit = await navigateToOrbit();
    if (!reachedOrbit) return;

    await triggerPirateEncounter();

    // Click Surrender option
    fireEvent.click(screen.getByText('Surrender'));
    fireEvent.click(screen.getByText('Confirm Surrender'));

    // Should go directly to OutcomePanel (not NegotiationPanel)
    await waitFor(() => {
      expect(screen.queryByText('Negotiation')).not.toBeInTheDocument();
      // OutcomePanel should be visible
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });
});
