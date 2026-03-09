import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from "@game/state/game-coordinator.js";
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

describe('Two-Step Encounter Flow', () => {
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

  it('should show CombatPanel when player chooses Fight', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

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
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

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
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

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
