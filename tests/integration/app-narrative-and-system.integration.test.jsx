import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { EVENT_NAMES } from '../../src/game/constants';
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
 * Integration tests for narrative events and system panel handlers
 *
 * Tests:
 * - Narrative event overlay display and close
 * - System Info toggle via HUD button
 *
 * Feature: narrative-events, system-panel
 */
describe('Narrative Events and System Panel Integration', () => {
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

    const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Helper: navigate past title screen to orbit mode and dismiss instructions */
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

    // Dismiss the instructions modal if it appeared
    const closeModalBtn = screen.queryByLabelText('Close modal');
    if (closeModalBtn) {
      fireEvent.click(closeModalBtn);
    }
  }

  describe('Narrative Event Overlay', () => {
    const mockNarrativeEvent = {
      id: 'test_narrative_event',
      cooldown: 10,
      content: {
        speaker: 'Station Commander',
        text: [
          'Welcome to the frontier, captain.',
          'These are dangerous times.',
        ],
        choices: [
          { text: 'Understood, Commander.', flags: ['met_commander'] },
          { text: 'I can handle myself.' },
        ],
      },
    };

    it('should show NarrativeEventPanel when narrative event is emitted', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      // Emit narrative event through the game coordinator
      act(() => {
        game.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, mockNarrativeEvent);
      });

      // NarrativeEventPanel should appear with the event content
      await waitFor(() => {
        expect(
          screen.getByText('Welcome to the frontier, captain.')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('These are dangerous times.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Station Commander')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Understood, Commander.')
      ).toBeInTheDocument();
      expect(screen.getByText('I can handle myself.')).toBeInTheDocument();
    });

    it('should close NarrativeEventPanel when a choice is clicked', async () => {
      // Stub manager methods the NarrativeEventPanel calls on choice
      game.markEventFired = vi.fn();
      game.setEventCooldown = vi.fn();
      game.setNarrativeFlag = vi.fn();
      game.markDirty = vi.fn();

      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      act(() => {
        game.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, mockNarrativeEvent);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Welcome to the frontier, captain.')
        ).toBeInTheDocument();
      });

      // Click a choice to close the panel
      const choiceButton = screen.getByText('Understood, Commander.');
      fireEvent.click(choiceButton);

      // NarrativeEventPanel should disappear
      await waitFor(() => {
        expect(
          screen.queryByText('Welcome to the frontier, captain.')
        ).not.toBeInTheDocument();
      });
    });

    it('should not change viewMode when narrative event is shown (overlay behavior)', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      // HUD should be visible (orbit mode indicator)
      expect(document.querySelector('#game-hud')).toBeTruthy();

      act(() => {
        game.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, mockNarrativeEvent);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Welcome to the frontier, captain.')
        ).toBeInTheDocument();
      });

      // HUD should still be visible — narrative event is an overlay, not a mode change
      expect(document.querySelector('#game-hud')).toBeTruthy();

      // Dev admin button should still be present (orbit mode indicator)
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });
  });

  describe('System Info Toggle', () => {
    it('should show SystemPanel when System Info button is clicked', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      // Click the System Info button in HUD
      const systemInfoButton = screen.getByText('System Info');
      fireEvent.click(systemInfoButton);

      // SystemPanel should appear showing the current system
      await waitFor(() => {
        expect(
          document.querySelector('.system-panel')
        ).toBeTruthy();
      });

      // Should show system details like Spectral Class
      expect(screen.getByText('Spectral Class:')).toBeInTheDocument();
    });

    it('should close SystemPanel when System Info button is clicked again (toggle)', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      // Click System Info to open
      const systemInfoButton = screen.getByText('System Info');
      fireEvent.click(systemInfoButton);

      await waitFor(() => {
        expect(
          document.querySelector('.system-panel')
        ).toBeTruthy();
      });

      // Click System Info again to close (toggle behavior)
      fireEvent.click(systemInfoButton);

      await waitFor(() => {
        expect(
          document.querySelector('.system-panel')
        ).toBeFalsy();
      });
    });

    it('should close SystemPanel when close button is clicked', async () => {
      render(
        <GameProvider game={game}>
          <App devMode={true} />
        </GameProvider>
      );

      await navigateToOrbit();

      // Open system panel
      const systemInfoButton = screen.getByText('System Info');
      fireEvent.click(systemInfoButton);

      await waitFor(() => {
        expect(
          document.querySelector('.system-panel')
        ).toBeTruthy();
      });

      // Click the close button on the SystemPanel
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          document.querySelector('.system-panel')
        ).toBeFalsy();
      });
    });
  });
});
