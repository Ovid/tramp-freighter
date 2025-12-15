import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import App from '../../src/App.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Mock the scene module to avoid WebGL errors in jsdom
vi.mock('../../src/game/engine/scene', () => {
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

// Suppress console warnings during tests
// React Testing Library warnings that are expected in property-based tests:
// - "Warning: An update to" - React state updates outside act() are expected in fast-check
// - "act()" - Property tests intentionally trigger updates without act() wrapper
// - "Not implemented: HTMLFormElement.prototype.submit" - jsdom limitation, not a real error
let originalConsoleError;
let originalConsoleWarn;

beforeAll(() => {
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;

  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: An update to') ||
        message.includes('act()') ||
        message.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return; // Suppress expected warnings listed above
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Not implemented')) {
      return; // Suppress jsdom "Not implemented" warnings (browser API limitations)
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

/**
 * React Migration Spec, Property 26: ORBIT mode displays starmap and HUD
 * Validates: Requirements 9.2, 25.1, 25.2
 *
 * For any view mode set to ORBIT, only the starmap and HUD should be displayed.
 * Station menu and panels should not be visible.
 */
describe('Property: ORBIT mode displays starmap and HUD', () => {
  it('should display starmap and HUD in ORBIT mode', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear localStorage to ensure no saved game exists
        localStorage.clear();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        // Don't initialize game - let App handle it

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Start a new game from title screen
        const newGameButton = screen.getByText('New Game');
        fireEvent.click(newGameButton);

        // Submit ship name (uses default if empty)
        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        // Now we should be in ORBIT mode
        // Verify starmap container is present (StarMapCanvas component)
        const starmapContainer = container.querySelector('.starmap-container');
        expect(starmapContainer).toBeTruthy();

        // Verify HUD is present
        const hud = container.querySelector('#game-hud');
        expect(hud).toBeTruthy();

        // Verify station menu is NOT present (initial state is ORBIT)
        const stationMenu = container.querySelector('#station-interface');
        expect(stationMenu).toBeFalsy();

        // Verify panel container is NOT present
        const panelContainer = container.querySelector('.panel-container');
        expect(panelContainer).toBeFalsy();

        return starmapContainer && hud && !stationMenu && !panelContainer;
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * React Migration Spec, Property 27: STATION mode displays station menu
 * Validates: Requirements 9.3, 25.3
 *
 * For any view mode set to STATION, the station menu should be displayed.
 */
describe('Property: STATION mode displays station menu', () => {
  it('should display station menu when docked', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear localStorage to ensure no saved game exists
        localStorage.clear();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        // Don't initialize game - let App handle it

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Start a new game from title screen
        const newGameButton = screen.getByText('New Game');
        fireEvent.click(newGameButton);

        // Submit ship name (uses default if empty)
        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        // Click dock button to transition to STATION mode
        const dockButton = screen.getByText('Dock');
        fireEvent.click(dockButton);

        // Verify station menu is now present
        const stationMenu = container.querySelector('#station-interface');
        expect(stationMenu).toBeTruthy();

        // Verify starmap and HUD are still present (they're always visible)
        const starmapContainer = container.querySelector('.starmap-container');
        expect(starmapContainer).toBeTruthy();

        const hud = container.querySelector('#game-hud');
        expect(hud).toBeTruthy();

        // Verify panel container is NOT present
        const panelContainer = container.querySelector('.panel-container');
        expect(panelContainer).toBeFalsy();

        return true;
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * React Migration Spec, Property 28: PANEL mode displays active panel
 * Validates: Requirements 9.4, 25.4
 *
 * For any view mode set to PANEL, the active panel should be displayed.
 */
describe('Property: PANEL mode displays active panel', () => {
  it('should display active panel when opened', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear localStorage to ensure no saved game exists
        localStorage.clear();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        // Don't initialize game - let App handle it

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Start a new game from title screen
        const newGameButton = screen.getByText('New Game');
        fireEvent.click(newGameButton);

        // Submit ship name (uses default if empty)
        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        // Click dock button to transition to STATION mode
        const dockButton = screen.getByText('Dock');
        fireEvent.click(dockButton);

        // Click open panel button to transition to PANEL mode
        const openPanelButton = screen.getByText('Trade');
        fireEvent.click(openPanelButton);

        // Verify panel container is now present
        const panelContainer = container.querySelector('.panel-container');
        expect(panelContainer).toBeTruthy();

        // Verify panel displays the trade panel (check for trade-specific content)
        expect(panelContainer.textContent).toContain('Trade -');

        // Verify starmap and HUD are still present
        const starmapContainer = container.querySelector('.starmap-container');
        expect(starmapContainer).toBeTruthy();

        const hud = container.querySelector('#game-hud');
        expect(hud).toBeTruthy();

        // Verify station menu is NOT present (replaced by panel)
        const stationMenu = container.querySelector('#station-interface');
        expect(stationMenu).toBeFalsy();

        return true;
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * React Migration Spec, Property 29: View mode changes update visibility
 * Validates: Requirements 9.5
 *
 * For any view mode change, the visible components should update to match
 * the new view mode.
 */
describe('Property: View mode changes update visibility', () => {
  it('should update visibility when transitioning between view modes', () => {
    fc.assert(
      fc.property(fc.constant('transition'), () => {
        cleanup();

        // Clear localStorage to ensure no saved game exists
        localStorage.clear();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        // Don't initialize game - let App handle it

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Start a new game from title screen
        const newGameButton = screen.getByText('New Game');
        fireEvent.click(newGameButton);

        // Submit ship name (uses default if empty)
        const confirmButton = screen.getByText('Confirm');
        fireEvent.click(confirmButton);

        // Initial state: ORBIT mode
        let stationMenu = container.querySelector('#station-interface');
        let panelContainer = container.querySelector('.panel-container');
        expect(stationMenu).toBeFalsy();
        expect(panelContainer).toBeFalsy();

        // Transition to STATION mode
        const dockButton = screen.getByText('Dock');
        fireEvent.click(dockButton);

        stationMenu = container.querySelector('#station-interface');
        panelContainer = container.querySelector('.panel-container');
        expect(stationMenu).toBeTruthy();
        expect(panelContainer).toBeFalsy();

        // Transition to PANEL mode
        const openPanelButton = screen.getByText('Trade');
        fireEvent.click(openPanelButton);

        stationMenu = container.querySelector('#station-interface');
        panelContainer = container.querySelector('.panel-container');
        expect(stationMenu).toBeFalsy();
        expect(panelContainer).toBeTruthy();

        // Transition back to STATION mode
        const closePanelButtons = screen.getAllByText('×');
        // Find the close button in the panel container (not the station menu)
        const closePanelButton = closePanelButtons.find((btn) =>
          btn.closest('.panel-container')
        );
        fireEvent.click(closePanelButton);

        stationMenu = container.querySelector('#station-interface');
        panelContainer = container.querySelector('.panel-container');
        expect(stationMenu).toBeTruthy();
        expect(panelContainer).toBeFalsy();

        // Transition back to ORBIT mode
        const undockButtons = screen.getAllByText('Undock');
        fireEvent.click(undockButtons[0]);

        stationMenu = container.querySelector('#station-interface');
        panelContainer = container.querySelector('.panel-container');
        expect(stationMenu).toBeFalsy();
        expect(panelContainer).toBeFalsy();

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
