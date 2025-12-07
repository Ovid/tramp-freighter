/**
 * Feature: tramp-freighter-core-loop, Property 14: Station Interface Display
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { JSDOM } from 'jsdom';

describe('Property 14: Station Interface Display', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Create a DOM environment for testing
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud">
                    <span id="hud-credits">0</span>
                    <span id="hud-debt">0</span>
                    <span id="hud-days">0</span>
                    <div id="fuel-bar"></div>
                    <span id="hud-fuel-text">100%</span>
                    <span id="hud-cargo">0/50</span>
                    <span id="hud-system">Sol</span>
                    <span id="hud-distance">0.0 LY</span>
                </div>
                
                <div id="station-interface">
                    <button class="close-btn" id="station-close-btn">×</button>
                    <h2 id="station-name">Station Name</h2>
                    <div class="station-info">
                        <div class="info-row">
                            <span class="label">System:</span>
                            <span id="station-system-name">Sol</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Distance from Sol:</span>
                            <span id="station-distance">0.0 LY</span>
                        </div>
                    </div>
                    <div class="station-actions">
                        <button class="station-btn" id="trade-btn">Trade</button>
                        <button class="station-btn" id="refuel-btn">Refuel</button>
                        <button class="station-btn" id="undock-btn">Undock</button>
                    </div>
                </div>
            </body>
            </html>
        `);

    document = dom.window.document;
    global.document = document;

    // Clear localStorage before each test
    global.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      },
    };

    // Initialize managers
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.lastSaveTime = 0; // Reset debounce timer
    gameStateManager.initNewGame(); // Initialize game state
    uiManager = new UIManager(gameStateManager);
  });

  afterEach(() => {
    // Clean up
    global.localStorage.clear();
    delete global.document;
  });

  it('should display system name, distance from Sol, and all action buttons', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
        (systemId) => {
          // Set player at this system
          gameStateManager.state.player.currentSystem = systemId;

          // Show station interface
          uiManager.showStationInterface();

          // Get the system data
          const system = TEST_STAR_DATA.find((s) => s.id === systemId);

          // Requirement 6.2: Station interface SHALL show the Star System name
          const stationNameElement = document.getElementById('station-name');
          expect(stationNameElement).not.toBeNull();
          expect(stationNameElement.textContent).toBe(`${system.name} Station`);

          const systemNameElement = document.getElementById(
            'station-system-name'
          );
          expect(systemNameElement).not.toBeNull();
          expect(systemNameElement.textContent).toBe(system.name);

          // Requirement 6.2: Station interface SHALL show distance from Sol
          const distanceElement = document.getElementById('station-distance');
          expect(distanceElement).not.toBeNull();
          expect(distanceElement.textContent).toMatch(/^\d+\.\d+ LY$/);

          // Extract distance value
          const distance = parseFloat(distanceElement.textContent);
          expect(distance).toBeGreaterThanOrEqual(0);

          // For Sol, distance should be 0.0
          if (systemId === 0) {
            expect(distance).toBe(0.0);
          }

          // Requirement 6.2: Station interface SHALL provide Trade option
          const tradeBtn = document.getElementById('trade-btn');
          expect(tradeBtn).not.toBeNull();
          expect(tradeBtn.textContent).toBe('Trade');

          // Requirement 6.2: Station interface SHALL provide Refuel option
          const refuelBtn = document.getElementById('refuel-btn');
          expect(refuelBtn).not.toBeNull();
          expect(refuelBtn.textContent).toBe('Refuel');

          // Requirement 6.2: Station interface SHALL provide Undock option
          const undockBtn = document.getElementById('undock-btn');
          expect(undockBtn).not.toBeNull();
          expect(undockBtn.textContent).toBe('Undock');

          // Verify interface is visible
          const stationInterface = document.getElementById('station-interface');
          expect(stationInterface.classList.contains('visible')).toBe(true);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  it('should hide station interface when undock button is clicked', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
        (systemId) => {
          // Set player at this system
          gameStateManager.state.player.currentSystem = systemId;

          // Show station interface
          uiManager.showStationInterface();

          // Verify interface is visible
          const stationInterface = document.getElementById('station-interface');
          expect(stationInterface.classList.contains('visible')).toBe(true);

          // Click undock button
          const undockBtn = document.getElementById('undock-btn');
          undockBtn.click();

          // Requirement 6.4: Undock SHALL close the Station interface
          expect(stationInterface.classList.contains('visible')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should hide station interface when close button is clicked', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
        (systemId) => {
          // Set player at this system
          gameStateManager.state.player.currentSystem = systemId;

          // Show station interface
          uiManager.showStationInterface();

          // Verify interface is visible
          const stationInterface = document.getElementById('station-interface');
          expect(stationInterface.classList.contains('visible')).toBe(true);

          // Click close button
          const closeBtn = document.getElementById('station-close-btn');
          closeBtn.click();

          // Interface should be hidden
          expect(stationInterface.classList.contains('visible')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only show station interface when clicking on current system', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Current system
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Clicked system
        (currentSystemId, clickedSystemId) => {
          // Ensure interface is hidden before test
          uiManager.hideStationInterface();

          // Set player at current system
          gameStateManager.state.player.currentSystem = currentSystemId;

          // Handle system click
          uiManager.handleSystemClick(clickedSystemId);

          const stationInterface = document.getElementById('station-interface');

          // Requirement 6.1: Station interface SHALL display when clicking current system
          if (currentSystemId === clickedSystemId) {
            expect(stationInterface.classList.contains('visible')).toBe(true);
          } else {
            // Should not show station interface for other systems
            expect(stationInterface.classList.contains('visible')).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct information for Sol system', () => {
    // Set player at Sol
    gameStateManager.state.player.currentSystem = 0;

    // Show station interface
    uiManager.showStationInterface();

    // Verify Sol-specific information
    expect(document.getElementById('station-name').textContent).toBe(
      'Sol Station'
    );
    expect(document.getElementById('station-system-name').textContent).toBe(
      'Sol'
    );
    expect(document.getElementById('station-distance').textContent).toBe(
      '0.0 LY'
    );

    // Verify interface is visible
    const stationInterface = document.getElementById('station-interface');
    expect(stationInterface.classList.contains('visible')).toBe(true);
  });

  it('should display correct information for Alpha Centauri system', () => {
    // Set player at Alpha Centauri (id: 1)
    gameStateManager.state.player.currentSystem = 1;

    // Show station interface
    uiManager.showStationInterface();

    // Get Alpha Centauri data
    const alphaCentauri = TEST_STAR_DATA.find((s) => s.id === 1);

    // Verify Alpha Centauri-specific information
    expect(document.getElementById('station-name').textContent).toBe(
      `${alphaCentauri.name} Station`
    );
    expect(document.getElementById('station-system-name').textContent).toBe(
      alphaCentauri.name
    );

    // Distance should be greater than 0
    const distanceText =
      document.getElementById('station-distance').textContent;
    const distance = parseFloat(distanceText);
    expect(distance).toBeGreaterThan(0);

    // Verify interface is visible
    const stationInterface = document.getElementById('station-interface');
    expect(stationInterface.classList.contains('visible')).toBe(true);
  });

  it('should maintain button functionality across multiple show/hide cycles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
        fc.integer({ min: 2, max: 5 }), // Number of cycles
        (systemId, cycles) => {
          // Set player at this system
          gameStateManager.state.player.currentSystem = systemId;

          for (let i = 0; i < cycles; i++) {
            // Show station interface
            uiManager.showStationInterface();

            const stationInterface =
              document.getElementById('station-interface');
            expect(stationInterface.classList.contains('visible')).toBe(true);

            // Verify all buttons are present
            expect(document.getElementById('trade-btn')).not.toBeNull();
            expect(document.getElementById('refuel-btn')).not.toBeNull();
            expect(document.getElementById('undock-btn')).not.toBeNull();

            // Hide station interface
            uiManager.hideStationInterface();
            expect(stationInterface.classList.contains('visible')).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
