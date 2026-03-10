import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { SAVE_KEY } from '../../src/game/constants';
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
 * Integration tests for the load game path in App.jsx
 *
 * Tests the handleStartGame flow when isNewGame is false:
 * 1. Continue Game button appears when a save exists
 * 2. Clicking Continue Game loads save and transitions to ORBIT
 * 3. Post-credits load resets Yumi interaction counter
 *
 * Feature: save-load
 */
describe('App Load Game Integration', () => {
  let game;
  let savedState;

  beforeEach(() => {
    // Create a game and initialize it to produce a valid state for saving
    const tempGame = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    tempGame.initNewGame();
    savedState = JSON.stringify(tempGame.getState());

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === SAVE_KEY) return savedState;
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show Continue Game button when save exists and transition to ORBIT on click', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    // Continue Game button should appear because localStorage has a save
    await waitFor(() => {
      expect(screen.getByText('Continue Game')).toBeInTheDocument();
    });

    // Click Continue Game to load
    fireEvent.click(screen.getByText('Continue Game'));

    // Should transition to ORBIT mode (dev admin button is a reliable indicator)
    await waitFor(() => {
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should not show Continue Game button when no save exists', async () => {
    // Override localStorage to return null for save key
    localStorage.getItem.mockReturnValue(null);

    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    // Should show New Game but not Continue Game
    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
    });
    expect(screen.queryByText('Continue Game')).not.toBeInTheDocument();
  });

  it('should reset Yumi interaction counter on post-credits load', async () => {
    // Initialize the game with a valid state, then set post-credits flags
    game.initNewGame();

    // Set post-credits flag and Yumi interactions to a non-zero value
    game.setNarrativeFlag('post_credits');
    const yumiState = game.getNPCState('yumi_delta_pavonis');
    yumiState.interactions = 5;

    // Spy on loadGame to simulate loading without localStorage round-trip.
    // The state is already set up — loadGame just needs to be a no-op.
    vi.spyOn(game, 'loadGame').mockImplementation(() => {
      // State is already initialized with post-credits flags — nothing to do
    });
    vi.spyOn(game, 'markDirty');

    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    // Wait for Continue Game button
    await waitFor(() => {
      expect(screen.getByText('Continue Game')).toBeInTheDocument();
    });

    // Click Continue Game to trigger the load path
    fireEvent.click(screen.getByText('Continue Game'));

    // Should transition to ORBIT
    await waitFor(() => {
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });

    // Verify Yumi interaction counter was reset to 0
    expect(yumiState.interactions).toBe(0);

    // Verify loadGame and markDirty were both called (post-credits path persists the reset)
    expect(game.loadGame).toHaveBeenCalledOnce();
    expect(game.markDirty).toHaveBeenCalled();
  });
});
