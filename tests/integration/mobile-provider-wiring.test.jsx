// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { SAVE_KEY } from '../../src/game/constants';

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
 * Integration tests for MobileProvider wiring in App.jsx
 *
 * Verifies that MobileProvider wraps the game component tree and
 * provides mobile context to descendant components.
 *
 * Feature: mobile-layout
 */
describe('MobileProvider wiring in App', () => {
  let game;
  let savedState;

  beforeEach(() => {
    // Mock matchMedia for useMobileLayout hook
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

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

  it('should render title screen without crashing with MobileProvider', () => {
    render(
      <GameProvider game={game}>
        <App />
      </GameProvider>
    );
    expect(screen.getByText(/tramp freighter blues/i)).toBeTruthy();
  });

  it('should provide MobileProvider context after transitioning to game view', async () => {
    // Use a spy on useMobile to verify context is available
    const { useMobile } = await import('../../src/context/MobileContext');

    // Create a test component that consumes the mobile context
    let mobileValue = null;
    const MobileProbe = () => {
      mobileValue = useMobile();
      return null;
    };

    // Mock the HUD to include our probe component
    const originalModule = await import('../../src/features/hud/HUD');
    const OriginalHUD = originalModule.HUD;
    vi.spyOn(originalModule, 'HUD').mockImplementation((props) => {
      return (
        <>
          <MobileProbe />
          <OriginalHUD {...props} />
        </>
      );
    });

    render(
      <GameProvider game={game}>
        <App devMode={true} />
      </GameProvider>
    );

    // Click Continue Game to transition past title screen
    await waitFor(() => {
      expect(screen.getByText('Continue Game')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Continue Game'));

    // After transition, MobileProvider should be wrapping game components
    await waitFor(() => {
      expect(document.querySelector('#dev-admin-btn')).toBeTruthy();
    });

    // The probe should have received a valid mobile context
    expect(mobileValue).not.toBeNull();
    expect(typeof mobileValue.isMobile).toBe('boolean');
  });
});
