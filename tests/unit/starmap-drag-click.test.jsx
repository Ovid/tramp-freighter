import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { StarMapCanvas } from '../../src/features/navigation/StarMapCanvas';
import { GameProvider } from '../../src/context/GameContext';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import * as THREE from 'three';
import { STARMAP_CONFIG } from '../../src/game/constants.js';

/**
 * Mock Three.js for testing
 */
function createMockSceneComponents() {
  const mockRenderer = {
    domElement: document.createElement('canvas'),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };

  const mockControls = {
    update: vi.fn(),
  };

  const mockScene = {
    background: null,
    fog: null,
    add: vi.fn(),
    traverse: vi.fn((_callback) => {
      // Mock traverse for cleanup - callback not needed in mock
    }),
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

  // Mock stars array with minimal data needed for updateCurrentSystemIndicator
  const mockStars = [
    {
      data: { id: 1 },
      position: { x: 0, y: 0, z: 0 },
      sprite: { material: { color: { setHex: vi.fn() } } },
      originalColor: 0xffffff,
    },
  ];

  return {
    scene: mockScene,
    camera: mockCamera,
    renderer: mockRenderer,
    controls: mockControls,
    lights: mockLights,
    stars: mockStars,
    sectorBoundary: { visible: true },
  };
}

// Mock MobileContext
vi.mock('../../src/context/MobileContext', () => ({
  useMobile: () => ({ isMobile: false }),
}));

// Mock the scene module before tests run
vi.mock('../../src/game/engine/scene', () => {
  const mockComponents = createMockSceneComponents();
  return {
    initScene: vi.fn(() => mockComponents),
    onWindowResize: vi.fn(),
  };
});

// Mock the animation system
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

async function renderCanvas() {
  const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  game.initNewGame();
  const onSystemSelected = vi.fn();
  const onSystemDeselected = vi.fn();

  render(
    <GameProvider game={game}>
      <StarMapCanvas
        onSystemSelected={onSystemSelected}
        onSystemDeselected={onSystemDeselected}
      />
    </GameProvider>
  );

  const { initScene } = await import('../../src/game/engine/scene');
  const canvas = initScene.mock.results.at(-1).value.renderer.domElement;
  return { canvas, onSystemSelected, onSystemDeselected };
}

describe('StarMapCanvas drag versus click', () => {
  // The mock sprites have no `layers`, so the real raycaster throws inside
  // the click listener. A throw also leaves both callbacks uncalled, which
  // would let the drag test pass on unfixed code. Stubbing the hit test
  // makes an unfixed click reach onSystemDeselected. setFromCamera is stubbed
  // because it warns about the mock camera.
  beforeEach(() => {
    vi.spyOn(THREE.Raycaster.prototype, 'setFromCamera').mockImplementation(
      () => {}
    );
    vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects').mockReturnValue([]);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('ignores a click that ends past the drag threshold', async () => {
    const { canvas, onSystemSelected, onSystemDeselected } =
      await renderCanvas();

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 100, clientY: 100 })
    );
    canvas.dispatchEvent(
      new MouseEvent('click', {
        clientX: 100 + STARMAP_CONFIG.CLICK_DRAG_THRESHOLD_PX + 1,
        clientY: 100,
      })
    );

    expect(onSystemSelected).not.toHaveBeenCalled();
    expect(onSystemDeselected).not.toHaveBeenCalled();
  });

  it('a click without a drag still reaches the handler', async () => {
    const { canvas, onSystemDeselected } = await renderCanvas();

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 100, clientY: 100 })
    );
    canvas.dispatchEvent(
      new MouseEvent('click', { clientX: 100, clientY: 100 })
    );

    expect(onSystemDeselected).toHaveBeenCalledTimes(1);
  });
});
