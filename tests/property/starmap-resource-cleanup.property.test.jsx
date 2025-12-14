import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { StarMapCanvas } from '../../src/features/navigation/StarMapCanvas';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

/**
 * Mock Three.js for testing resource cleanup
 */
function createMockSceneComponents() {
  const mockGeometry = {
    dispose: vi.fn(),
  };

  const mockMaterial = {
    dispose: vi.fn(),
  };

  const mockObject = {
    geometry: mockGeometry,
    material: mockMaterial,
  };

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
    traverse: vi.fn((callback) => {
      // Call callback with mock object to test disposal
      callback(mockObject);
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
    mockGeometry,
    mockMaterial,
  };
}

// Mock the scene module before tests run
vi.mock('../../src/game/engine/scene', () => {
  const mockComponents = createMockSceneComponents();
  return {
    initScene: vi.fn(() => mockComponents),
    onWindowResize: vi.fn(),
    _mockComponents: mockComponents, // Export for test access
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

describe('Property: Resource cleanup', () => {
  let initSceneMock;
  let mockComponents;

  beforeAll(async () => {
    // Get the mocked initScene function and mock components
    const sceneModule = await import('../../src/game/engine/scene');
    initSceneMock = sceneModule.initScene;
    mockComponents = sceneModule._mockComponents;
  });

  afterEach(() => {
    cleanup();
    if (initSceneMock) {
      initSceneMock.mockClear();
    }
    // Reset mock disposal calls
    if (mockComponents) {
      mockComponents.renderer.dispose.mockClear();
      mockComponents.mockGeometry.dispose.mockClear();
      mockComponents.mockMaterial.dispose.mockClear();
    }
  });

  /**
   * React Migration Spec, Property 18: Resource cleanup on unmount
   * Validates: Requirements 14.4
   *
   * For any StarMapCanvas unmount, all Three.js resources should be disposed.
   */
  it('should dispose of renderer on unmount', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        cleanup();

        // Reset disposal mocks
        mockComponents.renderer.dispose.mockClear();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render StarMapCanvas
        const { unmount } = render(
          <GameProvider gameStateManager={gameStateManager}>
            <StarMapCanvas />
          </GameProvider>
        );

        // Wait for useEffect to run
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify renderer.dispose was not called yet
        expect(mockComponents.renderer.dispose).not.toHaveBeenCalled();

        // Unmount component
        unmount();

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify renderer.dispose was called
        expect(mockComponents.renderer.dispose).toHaveBeenCalled();

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should dispose of geometries and materials on unmount', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        cleanup();

        // Reset disposal mocks
        mockComponents.mockGeometry.dispose.mockClear();
        mockComponents.mockMaterial.dispose.mockClear();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render StarMapCanvas
        const { unmount } = render(
          <GameProvider gameStateManager={gameStateManager}>
            <StarMapCanvas />
          </GameProvider>
        );

        // Wait for useEffect to run
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify disposal methods were not called yet
        expect(mockComponents.mockGeometry.dispose).not.toHaveBeenCalled();
        expect(mockComponents.mockMaterial.dispose).not.toHaveBeenCalled();

        // Unmount component
        unmount();

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify scene.traverse was called (which calls disposal on objects)
        expect(mockComponents.scene.traverse).toHaveBeenCalled();

        // Verify geometry and material disposal was called
        expect(mockComponents.mockGeometry.dispose).toHaveBeenCalled();
        expect(mockComponents.mockMaterial.dispose).toHaveBeenCalled();

        return true;
      }),
      { numRuns: 50 }
    );
  });

  it('should remove renderer DOM element on unmount', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render StarMapCanvas
        const { unmount, container } = render(
          <GameProvider gameStateManager={gameStateManager}>
            <StarMapCanvas />
          </GameProvider>
        );

        // Wait for useEffect to run
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Find the starmap container
        const starmapContainer = container.querySelector('.starmap-container');
        expect(starmapContainer).toBeTruthy();

        // Verify renderer DOM element was added
        const canvasElement = starmapContainer.querySelector('canvas');
        expect(canvasElement).toBeTruthy();

        // Unmount component
        unmount();

        // Wait for cleanup
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify canvas was removed (container should be empty or not exist)
        const canvasAfterUnmount = container.querySelector('canvas');
        expect(canvasAfterUnmount).toBeNull();

        return true;
      }),
      { numRuns: 50 }
    );
  });
});
