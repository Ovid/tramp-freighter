import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import App from '../../src/App';

// Mock scene to avoid WebGL in jsdom
vi.mock('../../src/game/engine/scene', () => {
  const mockRenderer = {
    domElement: document.createElement('canvas'),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
  const mockControls = { update: vi.fn() };
  const mockScene = {
    background: null,
    fog: null,
    add: vi.fn(),
    traverse: vi.fn(),
  };
  const mockCamera = {
    aspect: 1,
    position: { set: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
  };
  const mockLights = {
    ambientLight: {},
    directionalLight: {
      position: { set: vi.fn().mockReturnThis(), normalize: vi.fn() },
    },
  };
  const mockStars = [
    {
      data: { id: 1 },
      position: { x: 0, y: 0, z: 0 },
      sprite: { material: { color: { setHex: vi.fn() } } },
      originalColor: 0xffffff,
    },
  ];

  return {
    initScene: vi.fn(() => ({
      scene: mockScene,
      camera: mockCamera,
      renderer: mockRenderer,
      controls: mockControls,
      lights: mockLights,
      stars: mockStars,
      sectorBoundary: { visible: true },
    })),
    onWindowResize: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    toggleBoundary: vi.fn(() => true),
  };
});

// Mock animation system
vi.mock('../../src/game/engine/game-animation', () => {
  return {
    JumpAnimationSystem: vi.fn().mockImplementation(() => ({
      isAnimating: false,
      inputLockManager: {
        isInputLocked: vi.fn(() => false),
        lock: vi.fn(),
        unlock: vi.fn(),
      },
      playJumpAnimation: vi.fn(),
    })),
  };
});

/**
 * Integration tests for combat and negotiation resolution paths in App.jsx
 *
 * Tests lines 340-413 (combat/negotiation sub-choice resolution,
 * escalation, error path) and lines 424-437 (handleOutcomeContinue).
 *
 * Feature: danger-system
 */
describe('Combat and Negotiation Resolution Paths', () => {
  let game;

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

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Navigate past title screen to orbit mode */
  async function navigateToOrbit() {
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);

    const shipNameInput = screen.getByPlaceholderText('Enter ship name...');
    fireEvent.change(shipNameInput, { target: { value: 'Test Ship' } });
    fireEvent.keyDown(shipNameInput, { key: 'Enter' });

    await waitFor(() => {
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  }

  /** Open dev admin and trigger pirate encounter */
  async function triggerPirateEncounter() {
    const devAdminButton = document.querySelector('#dev-admin-btn');
    fireEvent.click(devAdminButton);

    await waitFor(() => {
      expect(screen.getByText('🏴‍☠️ Pirate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('🏴‍☠️ Pirate'));

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });
  }

  /** Navigate to CombatPanel: Fight -> Confirm Fight */
  function navigateToCombat() {
    fireEvent.click(screen.getByText('Fight'));
    fireEvent.click(screen.getByText('Confirm Fight'));
  }

  /** Navigate to NegotiationPanel: Negotiate -> Confirm Negotiate */
  function navigateToNegotiation() {
    fireEvent.click(screen.getByText('Negotiate'));
    fireEvent.click(screen.getByText('Confirm Negotiate'));
  }

  it('should resolve combat choice and show OutcomePanel after Return Fire', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveCombatChoice to return a successful outcome
    vi.spyOn(game, 'resolveCombatChoice').mockReturnValue({
      success: true,
      description: 'You drove off the pirates!',
      costs: { hull: 10 },
      rewards: { factionRep: { outlaws: 5 } },
    });

    navigateToCombat();

    // CombatPanel should be visible
    await waitFor(() => {
      expect(screen.getByText('Combat Resolution')).toBeInTheDocument();
    });

    // Select Return Fire option and confirm
    fireEvent.click(screen.getByText('Return Fire'));
    fireEvent.click(screen.getByText('Execute Return Fire'));

    // OutcomePanel should appear
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // resolveCombatChoice should have been called with 'return_fire'
    expect(game.resolveCombatChoice).toHaveBeenCalledWith(
      expect.any(Object),
      'return_fire'
    );

    // Continue button should be present
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('should map negotiation flee to evasive via resolveCombatChoice', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveCombatChoice for the flee-from-negotiation path
    vi.spyOn(game, 'resolveCombatChoice').mockReturnValue({
      success: true,
      description: 'You broke off negotiations and escaped!',
      costs: { fuel: 15 },
      rewards: {},
    });

    navigateToNegotiation();

    // NegotiationPanel should be visible
    await waitFor(() => {
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    // Click the close button (x) which triggers onChoice('flee')
    const closeBtn = document.querySelector('#negotiation-panel .close-btn');
    fireEvent.click(closeBtn);

    // OutcomePanel should appear
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // resolveCombatChoice should have been called with 'evasive' (mapped from 'flee')
    expect(game.resolveCombatChoice).toHaveBeenCalledWith(
      expect.any(Object),
      'evasive'
    );
  });

  it('should call resolveNegotiation for counter-proposal choice', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveNegotiation
    vi.spyOn(game, 'resolveNegotiation').mockReturnValue({
      success: true,
      description: 'The pirates accepted your counter-proposal.',
      costs: { cargoPercent: 10 },
      rewards: {},
    });

    navigateToNegotiation();

    // NegotiationPanel should be visible
    await waitFor(() => {
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    // Select Counter-Proposal and confirm
    fireEvent.click(screen.getByText('Counter-Proposal'));
    fireEvent.click(
      screen.getByText('Say: "How about something more reasonable?"')
    );

    // OutcomePanel should appear
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // resolveNegotiation should have been called with 'counter_proposal'
    expect(game.resolveNegotiation).toHaveBeenCalledWith(
      expect.any(Object),
      'counter_proposal'
    );
  });

  it('should escalate to combat when negotiation returns escalate: true', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveNegotiation to return escalation
    vi.spyOn(game, 'resolveNegotiation').mockReturnValue({
      escalate: true,
      success: false,
      description: 'The pirates are done talking!',
      costs: {},
      rewards: {},
    });

    navigateToNegotiation();

    await waitFor(() => {
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    // Select Counter-Proposal and confirm
    fireEvent.click(screen.getByText('Counter-Proposal'));
    fireEvent.click(
      screen.getByText('Say: "How about something more reasonable?"')
    );

    // Should show OutcomePanel in escalated_combat phase
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Click Continue on the outcome — should return to PirateEncounterPanel
    // with negotiate disabled
    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Pirate Encounter')).toBeInTheDocument();
    });

    // Negotiate option should be disabled (has aria-disabled)
    const negotiateOption = screen
      .getByText('Negotiate')
      .closest('.tactical-option');
    expect(negotiateOption).toHaveAttribute('aria-disabled', 'true');

    // The "They're done talking." message should be visible
    expect(screen.getByText("They're done talking.")).toBeInTheDocument();
  });

  it('should return to orbit when encounter resolution throws an error', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();
    await triggerPirateEncounter();

    // Mock resolveCombatChoice to throw an error
    vi.spyOn(game, 'resolveCombatChoice').mockImplementation(() => {
      throw new Error('Combat system failure');
    });

    navigateToCombat();

    await waitFor(() => {
      expect(screen.getByText('Combat Resolution')).toBeInTheDocument();
    });

    // Select Return Fire and confirm
    fireEvent.click(screen.getByText('Return Fire'));
    fireEvent.click(screen.getByText('Execute Return Fire'));

    // Should return to orbit — encounter panels gone
    await waitFor(() => {
      expect(screen.queryByText('Combat Resolution')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Pirate Encounter')).not.toBeInTheDocument();
    expect(screen.queryByText('Encounter Outcome')).not.toBeInTheDocument();

    // Error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Encounter resolution failed:',
      expect.any(Error)
    );
  });
});
