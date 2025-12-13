'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { SHIP_CONFIG } from '../../js/game-constants.js';

describe('HUD Ship Name Display', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Create minimal DOM for testing
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="game-hud">
            <div class="hud-section hud-ship">
              <div class="hud-row hud-ship-name-row">
                <span id="hud-ship-name" class="hud-ship-name">Serendipity</span>
              </div>
              <div class="hud-row">
                <span class="hud-label">Fuel:</span>
                <div class="condition-bar-container fuel-bar-container">
                  <div id="fuel-bar" class="condition-bar fuel-bar"></div>
                  <span id="hud-fuel-text" class="condition-text fuel-text">100%</span>
                </div>
              </div>
            </div>
            <div id="hud-credits">0</div>
            <div id="hud-debt">0</div>
            <div id="hud-days">0</div>
            <div id="hud-cargo">0/50</div>
            <div id="hud-system">Sol</div>
            <div id="hud-distance">0.0 LY</div>
            <div id="hull-bar"></div>
            <div id="hud-hull-text">100%</div>
            <div id="engine-bar"></div>
            <div id="hud-engine-text">100%</div>
            <div id="life-support-bar"></div>
            <div id="hud-life-support-text">100%</div>
          </div>
          <div id="notification-area"></div>
        </body>
      </html>
    `);

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Create minimal star data for testing
    const starData = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2', wh: 5, st: 1, r: 1 },
    ];

    gameStateManager = new GameStateManager(starData, []);
    gameStateManager.initNewGame();

    uiManager = new UIManager(gameStateManager);
  });

  /**
   * Property 1: Ship name element exists in HUD
   *
   * The HUD must contain a ship name element that displays the current ship name.
   */
  it('should have ship name element in HUD', () => {
    const shipNameElement = document.getElementById('hud-ship-name');

    expect(shipNameElement).not.toBeNull();
    expect(shipNameElement.tagName).toBe('SPAN');
    expect(shipNameElement.classList.contains('hud-ship-name')).toBe(true);
  });

  /**
   * Property 2: Ship name is displayed above fuel bar
   *
   * The ship name row should appear before the fuel row in the DOM structure.
   */
  it('should display ship name above fuel bar', () => {
    const shipNameRow = document.querySelector('.hud-ship-name-row');
    const fuelRow = document.querySelector('.hud-row:has(#fuel-bar)');

    expect(shipNameRow).not.toBeNull();
    expect(fuelRow).not.toBeNull();

    // Get parent container
    const shipSection = document.querySelector('.hud-ship');
    const rows = Array.from(shipSection.querySelectorAll('.hud-row'));

    const shipNameIndex = rows.indexOf(shipNameRow);
    const fuelIndex = rows.findIndex((row) => row.querySelector('#fuel-bar'));

    expect(shipNameIndex).toBeGreaterThanOrEqual(0);
    expect(fuelIndex).toBeGreaterThan(shipNameIndex);
  });

  /**
   * Property 3: updateShipName updates DOM element
   *
   * When updateShipName is called, the ship name element's textContent
   * should be updated to match the new name.
   */
  it('should update ship name element when updateShipName is called', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipName) => {
          const shipNameElement = document.getElementById('hud-ship-name');

          uiManager.updateShipName(shipName);

          expect(shipNameElement.textContent).toBe(shipName);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4: updateHUD updates ship name
   *
   * When updateHUD is called, the ship name should be updated to match
   * the current game state.
   */
  it('should update ship name when updateHUD is called', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipName) => {
          const shipNameElement = document.getElementById('hud-ship-name');

          // Update ship name in game state
          gameStateManager.state.ship.name = shipName;

          // Call updateHUD
          uiManager.updateHUD();

          expect(shipNameElement.textContent).toBe(shipName);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5: Ship name subscription updates DOM
   *
   * When ship name changes via updateShipName on GameStateManager,
   * the UI should automatically update via subscription.
   */
  it('should update ship name via subscription when state changes', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (shipName) => {
          const shipNameElement = document.getElementById('hud-ship-name');

          // Update ship name via GameStateManager (triggers event)
          gameStateManager.updateShipName(shipName);

          // Sanitized name should be displayed
          const sanitizedName =
            shipName
              .replace(/<[^>]*>/g, '')
              .substring(0, 50)
              .trim() || SHIP_CONFIG.DEFAULT_NAME;

          expect(shipNameElement.textContent).toBe(sanitizedName);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 6: Default ship name is displayed on new game
   *
   * When a new game is initialized, the default ship name should be displayed.
   */
  it('should display default ship name on new game initialization', () => {
    const shipNameElement = document.getElementById('hud-ship-name');

    // Initialize new game
    gameStateManager.initNewGame();
    uiManager.updateHUD();

    expect(shipNameElement.textContent).toBe(SHIP_CONFIG.DEFAULT_NAME);
  });

  /**
   * Property 7: Ship name persists across HUD updates
   *
   * When other HUD elements are updated, the ship name should remain unchanged
   * unless explicitly updated.
   */
  it('should preserve ship name when other HUD elements update', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 100 }),
        (shipName, credits, fuel) => {
          const shipNameElement = document.getElementById('hud-ship-name');

          // Set ship name
          gameStateManager.state.ship.name = shipName;
          uiManager.updateHUD();

          const displayedName = shipNameElement.textContent;

          // Update other HUD elements
          gameStateManager.updateCredits(credits);
          gameStateManager.updateFuel(fuel);

          // Ship name should remain unchanged
          expect(shipNameElement.textContent).toBe(displayedName);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Ship name handles special characters
   *
   * Ship names with special characters (but not HTML tags) should be
   * displayed correctly.
   */
  it('should handle ship names with special characters', () => {
    const specialNames = [
      "O'Malley's Pride",
      'Star-Chaser',
      'Nova #7',
      'The "Lucky" Break',
      'Ångström Runner',
      'Café Racer',
    ];

    specialNames.forEach((shipName) => {
      const shipNameElement = document.getElementById('hud-ship-name');

      uiManager.updateShipName(shipName);

      expect(shipNameElement.textContent).toBe(shipName);
    });
  });

  /**
   * Property 9: Empty ship name displays default via GameStateManager
   *
   * If ship name is empty or whitespace-only, GameStateManager.updateShipName
   * sanitizes it to the default name, which then updates the UI.
   */
  it('should display default name for empty or whitespace-only names via state manager', () => {
    const emptyNames = ['', '   ', '\t', '\n', '  \t\n  '];

    emptyNames.forEach((shipName) => {
      const shipNameElement = document.getElementById('hud-ship-name');

      // Use GameStateManager to update (which sanitizes)
      gameStateManager.updateShipName(shipName);

      expect(shipNameElement.textContent).toBe(SHIP_CONFIG.DEFAULT_NAME);
    });
  });

  /**
   * Property 10: Ship name element is visible in HUD
   *
   * The ship name element should be visible when the HUD is visible.
   */
  it('should be visible when HUD is visible', () => {
    const gameHud = document.getElementById('game-hud');
    const shipNameElement = document.getElementById('hud-ship-name');

    // Show HUD
    uiManager.showHUD();

    expect(gameHud.classList.contains('visible')).toBe(true);
    expect(shipNameElement).not.toBeNull();

    // Ship name should be in the visible HUD
    expect(gameHud.contains(shipNameElement)).toBe(true);
  });
});
