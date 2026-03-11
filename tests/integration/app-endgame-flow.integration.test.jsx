import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { EVENT_NAMES, ENDGAME_CONFIG } from '../../src/game/constants';
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

// Mock endgame components as simple stubs
vi.mock('../../src/features/endgame/PavonisRun.jsx', () => ({
  PavonisRun: ({ onComplete, onCancel }) => (
    <div data-testid="pavonis-run">
      <button onClick={onComplete}>Complete Run</button>
      <button onClick={onCancel}>Cancel Run</button>
    </div>
  ),
}));

vi.mock('../../src/features/endgame/Epilogue.jsx', () => ({
  Epilogue: ({ onCreditsComplete }) => (
    <div data-testid="epilogue">
      <button onClick={onCreditsComplete}>Credits Done</button>
    </div>
  ),
}));

vi.mock('../../src/features/endgame/PostCreditsStation.jsx', () => ({
  PostCreditsStation: ({ onOpenPanel, onReturnToTitle }) => (
    <div data-testid="post-credits-station">
      <button onClick={() => onOpenPanel('trade')}>Open Panel</button>
      <button onClick={onReturnToTitle}>Return to Title</button>
    </div>
  ),
}));

/**
 * Integration tests for endgame flows
 *
 * Tests the complete Pavonis Run → Epilogue → PostCreditsStation → Title flow,
 * plus cancel and dev epilogue preview paths.
 *
 * Feature: endgame
 */
describe('Endgame Flow Integration', () => {
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

  it('should complete the full Pavonis Run → Epilogue → PostCreditsStation → Title flow', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Emit PAVONIS_RUN_TRIGGERED to start the endgame sequence
    game.emit(EVENT_NAMES.PAVONIS_RUN_TRIGGERED, true);

    // PavonisRun should render
    await waitFor(() => {
      expect(screen.getByTestId('pavonis-run')).toBeInTheDocument();
    });

    // Complete the Pavonis Run → should transition to Epilogue
    fireEvent.click(screen.getByText('Complete Run'));

    await waitFor(() => {
      expect(screen.getByTestId('epilogue')).toBeInTheDocument();
    });

    // Verify markVictory was called
    expect(game.getState().meta.victory).toBe(true);

    // Complete credits → should transition to STATION with postCredits=true
    fireEvent.click(screen.getByText('Credits Done'));

    await waitFor(() => {
      expect(screen.getByTestId('post-credits-station')).toBeInTheDocument();
    });

    // Verify narrative flag was set
    expect(game.getNarrativeFlags()?.post_credits).toBe(true);

    // Return to title
    fireEvent.click(screen.getByText('Return to Title'));

    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
    });

    // PostCreditsStation should be gone
    expect(
      screen.queryByTestId('post-credits-station')
    ).not.toBeInTheDocument();
  });

  it('should return to station when Pavonis Run is cancelled', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Dock first so we can verify station renders after cancel
    game.dock();

    // Emit PAVONIS_RUN_TRIGGERED
    game.emit(EVENT_NAMES.PAVONIS_RUN_TRIGGERED, true);

    await waitFor(() => {
      expect(screen.getByTestId('pavonis-run')).toBeInTheDocument();
    });

    // Cancel the run → should go to STATION mode
    fireEvent.click(screen.getByText('Cancel Run'));

    // PavonisRun should be gone, and since postCredits is false, StationMenu shows
    await waitFor(() => {
      expect(screen.queryByTestId('pavonis-run')).not.toBeInTheDocument();
    });

    // Should not show PostCreditsStation (postCredits is false)
    expect(
      screen.queryByTestId('post-credits-station')
    ).not.toBeInTheDocument();
  });

  it('should show Epilogue directly when EPILOGUE_PREVIEW_TRIGGERED is emitted', async () => {
    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    await navigateToOrbit();

    // Spy on devTeleport to verify it's called
    const devTeleportSpy = vi.spyOn(game, 'devTeleport');

    // Emit EPILOGUE_PREVIEW_TRIGGERED (dev shortcut, skips Pavonis Run)
    game.emit(EVENT_NAMES.EPILOGUE_PREVIEW_TRIGGERED, true);

    // Epilogue should render directly (no PavonisRun)
    await waitFor(() => {
      expect(screen.getByTestId('epilogue')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('pavonis-run')).not.toBeInTheDocument();

    expect(devTeleportSpy).toHaveBeenCalledWith(ENDGAME_CONFIG.DELTA_PAVONIS_ID);
  });
});
