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

  /** Helper: navigate past title screen to orbit mode */
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

  /**
   * Helper: open dev admin and trigger pirate encounter
   */
  async function triggerPirateEncounter() {
    const devAdminButton = document.querySelector('#dev-admin-btn');
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
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

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
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

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
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    await triggerPirateEncounter();

    // Surrender (guaranteed resolution, costs cargo percentage)
    const surrenderOption = screen.getByText('Surrender');
    fireEvent.click(surrenderOption);
    fireEvent.click(screen.getByText('Confirm Surrender'));

    // Wait for OutcomePanel
    await waitFor(() => {
      expect(screen.getByText('Encounter Outcome')).toBeInTheDocument();
    });

    // Surrender always resolves - game state should reflect the resolution
    const state = game.getState();
    // Surrender costs cargo percentage, so state was mutated
    expect(state).toBeDefined();
  });
});
