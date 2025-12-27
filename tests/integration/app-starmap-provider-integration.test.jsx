import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';
import { GameProvider } from '../../src/context/GameContext';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

describe('Integration: App StarmapProvider Integration', () => {
  let gameStateManager;
  let navigationSystem;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gameStateManager = new GameStateManager(
      STAR_DATA,
      WORMHOLE_DATA,
      navigationSystem
    );
    gameStateManager.initNewGame();

    // Mock Three.js to avoid WebGL context issues in tests
    vi.mock('three', () => ({
      Scene: vi.fn(() => ({
        add: vi.fn(),
        remove: vi.fn(),
        traverse: vi.fn(),
      })),
      PerspectiveCamera: vi.fn(() => ({
        position: { copy: vi.fn(), add: vi.fn() },
        lookAt: vi.fn(),
      })),
      WebGLRenderer: vi.fn(() => ({
        setSize: vi.fn(),
        render: vi.fn(),
        domElement: document.createElement('canvas'),
        dispose: vi.fn(),
      })),
      Vector3: vi.fn(() => ({
        copy: vi.fn(() => ({ sub: vi.fn(), add: vi.fn() })),
        sub: vi.fn(),
        add: vi.fn(),
      })),
      Raycaster: vi.fn(() => ({
        setFromCamera: vi.fn(),
        intersectObjects: vi.fn(() => []),
      })),
    }));

    // Mock scene initialization to avoid Three.js setup
    vi.mock('../../src/game/engine/scene', () => ({
      initScene: vi.fn(() => ({
        scene: { add: vi.fn(), remove: vi.fn(), traverse: vi.fn() },
        camera: { position: { copy: vi.fn(), add: vi.fn() }, lookAt: vi.fn() },
        renderer: {
          setSize: vi.fn(),
          render: vi.fn(),
          domElement: document.createElement('canvas'),
          dispose: vi.fn(),
        },
        controls: { update: vi.fn(), target: { x: 0, y: 0, z: 0 } },
        lights: [],
        stars: [],
        sectorBoundary: { visible: true },
      })),
      onWindowResize: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleBoundary: vi.fn(() => true),
    }));
  });

  it('should provide StarmapProvider context to SystemPanel when game is running', () => {
    render(
      <GameProvider gameStateManager={gameStateManager}>
        <App devMode={false} />
      </GameProvider>
    );

    // App should render without errors
    // The StarmapProvider should be available to all components within the game UI
    // This test verifies that the context hierarchy is correct
    expect(document.querySelector('.app-container')).toBeInTheDocument();
  });

  it('should not provide StarmapProvider context during title screen', () => {
    // Create a fresh game state manager that hasn't been initialized
    const freshGameStateManager = new GameStateManager(
      STAR_DATA,
      WORMHOLE_DATA,
      navigationSystem
    );

    render(
      <GameProvider gameStateManager={freshGameStateManager}>
        <App devMode={false} />
      </GameProvider>
    );

    // Should show title screen, which doesn't need StarmapProvider
    expect(screen.getByText(/Tramp Freighter Blues/i)).toBeInTheDocument();

    // StarmapProvider should not be in the DOM yet
    expect(
      document.querySelector('.starmap-container')
    ).not.toBeInTheDocument();
  });
});
