import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { NotificationProvider } from '../../src/context/NotificationContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { EVENT_NAMES } from '../../src/game/constants.js';
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
 * Integration tests for App.jsx notification effects.
 *
 * Covers:
 * - Save-failed notification (lines 115-120)
 * - Exotic matter scanner feedback (lines 122-147)
 *
 * Feature: notifications
 */
describe('App Notification Integration', () => {
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
    cleanup();
    vi.restoreAllMocks();
  });

  /** Helper: render App with all required providers */
  function renderApp() {
    return render(
      <GameProvider game={game}>
        <NotificationProvider>
          <App devMode={true} />
        </NotificationProvider>
      </GameProvider>
    );
  }

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

  describe('Save-failed notification', () => {
    it('should show error notification when SAVE_FAILED event fires', async () => {
      renderApp();
      await navigateToOrbit();

      // Emit save failed event
      game.emit(EVENT_NAMES.SAVE_FAILED, {
        message: 'Storage quota exceeded',
      });

      await waitFor(() => {
        expect(screen.getByText('Storage quota exceeded')).toBeInTheDocument();
      });

      // Verify it's rendered as an error notification
      const notification = screen.getByText('Storage quota exceeded');
      expect(notification.closest('.notification')).toHaveClass(
        'notification-error'
      );
    });
  });

  describe('Exotic matter scanner feedback', () => {
    it('should show info notification when exotic matter is collected', async () => {
      renderApp();
      await navigateToOrbit();

      // Emit exotic matter collected event
      game.emit(EVENT_NAMES.EXOTIC_MATTER_COLLECTED, {
        count: 1,
        total: 5,
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Scanner: Exotic matter detected. Sample collected. [1/5]'
          )
        ).toBeInTheDocument();
      });

      // Verify it's rendered as an info notification
      const notification = screen.getByText(
        'Scanner: Exotic matter detected. Sample collected. [1/5]'
      );
      expect(notification.closest('.notification')).toHaveClass(
        'notification-info'
      );
    });

    it('should show info notification when exotic matter already sampled', async () => {
      renderApp();
      await navigateToOrbit();

      // Emit already sampled event
      game.emit(EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED);

      await waitFor(() => {
        expect(
          screen.getByText('Scanner: Already sampled this station.')
        ).toBeInTheDocument();
      });

      const notification = screen.getByText(
        'Scanner: Already sampled this station.'
      );
      expect(notification.closest('.notification')).toHaveClass(
        'notification-info'
      );
    });

    it('should unsubscribe from exotic matter events on unmount', async () => {
      const unsubscribeSpy = vi.spyOn(game, 'unsubscribe');

      const { unmount } = renderApp();
      await navigateToOrbit();

      unmount();

      // Verify unsubscribe was called for both exotic matter events
      const unsubscribeCalls = unsubscribeSpy.mock.calls.map((call) => call[0]);
      expect(unsubscribeCalls).toContain(EVENT_NAMES.EXOTIC_MATTER_COLLECTED);
      expect(unsubscribeCalls).toContain(
        EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED
      );
    });
  });
});
