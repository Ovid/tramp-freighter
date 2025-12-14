import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import App from '../../src/App.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

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

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Verify starmap placeholder is present
        const starmapPlaceholder = container.querySelector(
          '.starmap-placeholder'
        );
        expect(starmapPlaceholder).toBeTruthy();

        // Verify HUD placeholder is present
        const hudPlaceholder = container.querySelector('.hud-placeholder');
        expect(hudPlaceholder).toBeTruthy();

        // Verify station menu is NOT present (initial state is ORBIT)
        const stationMenu = container.querySelector(
          '.station-menu-placeholder'
        );
        expect(stationMenu).toBeFalsy();

        // Verify panel container is NOT present
        const panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(panelContainer).toBeFalsy();

        return (
          starmapPlaceholder &&
          hudPlaceholder &&
          !stationMenu &&
          !panelContainer
        );
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

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Click dock button to transition to STATION mode
        const dockButton = screen.getByText('Dock (Test)');
        fireEvent.click(dockButton);

        // Verify station menu is now present
        const stationMenu = container.querySelector(
          '.station-menu-placeholder'
        );
        expect(stationMenu).toBeTruthy();

        // Verify starmap and HUD are still present (they're always visible)
        const starmapPlaceholder = container.querySelector(
          '.starmap-placeholder'
        );
        expect(starmapPlaceholder).toBeTruthy();

        const hudPlaceholder = container.querySelector('.hud-placeholder');
        expect(hudPlaceholder).toBeTruthy();

        // Verify panel container is NOT present
        const panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
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

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Click dock button to transition to STATION mode
        const dockButton = screen.getByText('Dock (Test)');
        fireEvent.click(dockButton);

        // Click open panel button to transition to PANEL mode
        const openPanelButton = screen.getByText('Open Trade Panel (Test)');
        fireEvent.click(openPanelButton);

        // Verify panel container is now present
        const panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(panelContainer).toBeTruthy();

        // Verify panel displays the correct panel name
        expect(panelContainer.textContent).toContain('trade');

        // Verify starmap and HUD are still present
        const starmapPlaceholder = container.querySelector(
          '.starmap-placeholder'
        );
        expect(starmapPlaceholder).toBeTruthy();

        const hudPlaceholder = container.querySelector('.hud-placeholder');
        expect(hudPlaceholder).toBeTruthy();

        // Verify station menu is NOT present (replaced by panel)
        const stationMenu = container.querySelector(
          '.station-menu-placeholder'
        );
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

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Render App component
        const { container } = render(<App />, { wrapper });

        // Initial state: ORBIT mode
        let stationMenu = container.querySelector('.station-menu-placeholder');
        let panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(stationMenu).toBeFalsy();
        expect(panelContainer).toBeFalsy();

        // Transition to STATION mode
        const dockButton = screen.getByText('Dock (Test)');
        fireEvent.click(dockButton);

        stationMenu = container.querySelector('.station-menu-placeholder');
        panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(stationMenu).toBeTruthy();
        expect(panelContainer).toBeFalsy();

        // Transition to PANEL mode
        const openPanelButton = screen.getByText('Open Trade Panel (Test)');
        fireEvent.click(openPanelButton);

        stationMenu = container.querySelector('.station-menu-placeholder');
        panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(stationMenu).toBeFalsy();
        expect(panelContainer).toBeTruthy();

        // Transition back to STATION mode
        const closePanelButton = screen.getByText('Close Panel');
        fireEvent.click(closePanelButton);

        stationMenu = container.querySelector('.station-menu-placeholder');
        panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(stationMenu).toBeTruthy();
        expect(panelContainer).toBeFalsy();

        // Transition back to ORBIT mode
        const undockButton = screen.getByText('Undock');
        fireEvent.click(undockButton);

        stationMenu = container.querySelector('.station-menu-placeholder');
        panelContainer = container.querySelector(
          '.panel-container-placeholder'
        );
        expect(stationMenu).toBeFalsy();
        expect(panelContainer).toBeFalsy();

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
