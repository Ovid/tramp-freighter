import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { StarMapCanvas } from '../../src/features/navigation/StarMapCanvas';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

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

describe('Property: Scene initialization', () => {
  let initSceneMock;

  beforeAll(async () => {
    // Get the mocked initScene function
    const sceneModule = await import('../../src/game/engine/scene');
    initSceneMock = sceneModule.initScene;
  });

  afterEach(() => {
    cleanup();
    if (initSceneMock) {
      initSceneMock.mockClear();
    }
  });

  /**
   * React Migration Spec, Property 16: Scene initialization once per mount
   * Validates: Requirements 4.3, 14.1, 14.5
   *
   * For any StarMapCanvas mount, the Three.js scene should be initialized exactly once.
   */
  it('should initialize scene exactly once per mount', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        cleanup();

        // Reset mock call count
        if (initSceneMock) {
          initSceneMock.mockClear();
        }

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Render StarMapCanvas
        render(
          <GameProvider gameStateManager={gameStateManager}>
            <StarMapCanvas />
          </GameProvider>
        );

        // Wait for useEffect to run
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify initScene was called exactly once
        expect(initSceneMock).toHaveBeenCalledTimes(1);

        return true;
      }),
      { numRuns: 50 }
    );
  });

  /**
   * React Migration Spec, Property 17: No scene re-initialization on re-render
   * Validates: Requirements 4.2, 14.5
   *
   * For any React component re-render, the Three.js scene should not be re-initialized.
   */
  it('should not re-initialize scene on component re-render', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (rerenderCount) => {
          cleanup();

          // Reset mock call count
          if (initSceneMock) {
            initSceneMock.mockClear();
          }

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Render StarMapCanvas
          const { rerender } = render(
            <GameProvider gameStateManager={gameStateManager}>
              <StarMapCanvas />
            </GameProvider>
          );

          // Wait for initial useEffect
          await new Promise((resolve) => setTimeout(resolve, 10));

          const initialCallCount = initSceneMock.mock.calls.length;

          // Force re-renders
          for (let i = 0; i < rerenderCount; i++) {
            rerender(
              <GameProvider gameStateManager={gameStateManager}>
                <StarMapCanvas />
              </GameProvider>
            );
            await new Promise((resolve) => setTimeout(resolve, 5));
          }

          // Verify initScene was not called again
          const finalCallCount = initSceneMock.mock.calls.length;
          expect(finalCallCount).toBe(initialCallCount);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
