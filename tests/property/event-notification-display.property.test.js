import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { EconomicEventsSystem } from '../../js/game-events.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Feature: dynamic-economy, Property 14: Event Notification Display
 * Validates: Requirements 4.6
 *
 * For any docking operation at a system with an active event, an event notification
 * should be displayed with the event name, description, and expected duration.
 */
describe('Property: Event Notification Display', () => {
  let dom;
  let document;
  let gameStateManager;
  let uiManager;

  beforeEach(() => {
    // Create a minimal DOM for testing
    dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud" class="game-hud">
                    <div id="hud-credits">0</div>
                    <div id="hud-debt">0</div>
                    <div id="hud-days">0</div>
                    <div id="fuel-bar"></div>
                    <div id="hud-fuel-text">100%</div>
                    <div id="hud-cargo">0/50</div>
                    <div id="hud-system">Sol</div>
                    <div id="hud-distance">0.0 LY</div>
                </div>
                <div id="station-interface">
                    <div id="station-name"></div>
                    <div id="station-system-name"></div>
                    <div id="station-distance"></div>
                    <button id="station-close-btn"></button>
                    <button id="trade-btn"></button>
                    <button id="refuel-btn"></button>
                    <button id="undock-btn"></button>
                </div>
                <div id="trade-panel">
                    <div id="trade-system-name"></div>
                    <button id="trade-close-btn"></button>
                    <button id="trade-back-btn"></button>
                    <div id="market-goods"></div>
                    <div id="cargo-stacks"></div>
                    <div id="trade-cargo-used">0</div>
                    <div id="trade-cargo-capacity">50</div>
                    <div id="trade-cargo-remaining">50</div>
                </div>
                <div id="refuel-panel">
                    <div id="refuel-system-name"></div>
                    <div id="refuel-current-fuel">100</div>
                    <div id="refuel-price-per-percent">1</div>
                    <input id="refuel-amount-input" type="number" value="0" />
                    <div id="refuel-total-cost">0</div>
                    <button id="refuel-confirm-btn"></button>
                    <button id="refuel-close-btn"></button>
                    <button id="refuel-back-btn"></button>
                    <button id="refuel-max-btn"></button>
                    <div id="refuel-validation-message"></div>
                </div>
                <div id="notification-area"></div>
                <div id="event-modal-overlay" class="modal-overlay hidden">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <h3 id="event-modal-title" class="event-modal-title"></h3>
                            <p id="event-modal-description" class="event-modal-description"></p>
                            <p id="event-modal-duration" class="event-modal-duration"></p>
                            <div class="modal-actions">
                                <button id="event-modal-dismiss" class="modal-confirm">Dismiss</button>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Initialize game state manager
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Initialize UI manager
    uiManager = new UIManager(gameStateManager);
  });

  it('should display event notification when docking at system with active event', () => {
    fc.assert(
      fc.property(
        // Generate random event type
        fc.constantFrom(
          'mining_strike',
          'medical_emergency',
          'festival',
          'supply_glut'
        ),
        // Generate random system ID from test data
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        // Generate random current day
        fc.integer({ min: 0, max: 100 }),
        // Generate random remaining days
        fc.integer({ min: 1, max: 10 }),
        (eventTypeKey, systemId, currentDay) => {
          // Create an active event
          const event = EconomicEventsSystem.createEvent(
            eventTypeKey,
            systemId,
            currentDay
          );

          // Set up game state with the event
          const state = gameStateManager.getState();
          state.player.currentSystem = systemId;
          state.player.daysElapsed = currentDay;
          state.world.activeEvents = [event];

          // Show station interface (which should trigger event notification)
          uiManager.showStationInterface();

          // Property: Event modal should be visible
          const eventModalOverlay = document.getElementById(
            'event-modal-overlay'
          );
          expect(eventModalOverlay.classList.contains('hidden')).toBe(false);

          // Property: Event title should match event name
          const eventModalTitle = document.getElementById('event-modal-title');
          const eventType = EconomicEventsSystem.EVENT_TYPES[eventTypeKey];
          expect(eventModalTitle.textContent).toBe(eventType.name);

          // Property: Event description should match event description
          const eventModalDescription = document.getElementById(
            'event-modal-description'
          );
          expect(eventModalDescription.textContent).toBe(eventType.description);

          // Property: Event duration should be displayed
          const eventModalDuration = document.getElementById(
            'event-modal-duration'
          );
          const expectedRemainingDays = event.endDay - currentDay;
          expect(eventModalDuration.textContent).toContain(
            String(expectedRemainingDays)
          );
          expect(eventModalDuration.textContent).toContain('day');

          // Property: Duration should use correct pluralization
          if (expectedRemainingDays === 1) {
            expect(eventModalDuration.textContent).toContain('1 day remaining');
          } else {
            expect(eventModalDuration.textContent).toContain(
              `${expectedRemainingDays} days remaining`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display event notification when docking at system without active event', () => {
    fc.assert(
      fc.property(
        // Generate random system ID from test data
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        // Generate random current day
        fc.integer({ min: 0, max: 100 }),
        (systemId, currentDay) => {
          // Set up game state without any events
          const state = gameStateManager.getState();
          state.player.currentSystem = systemId;
          state.player.daysElapsed = currentDay;
          state.world.activeEvents = [];

          // Show station interface
          uiManager.showStationInterface();

          // Property: Event modal should remain hidden
          const eventModalOverlay = document.getElementById(
            'event-modal-overlay'
          );
          expect(eventModalOverlay.classList.contains('hidden')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should hide event notification when dismiss button is clicked', () => {
    fc.assert(
      fc.property(
        // Generate random event type
        fc.constantFrom(
          'mining_strike',
          'medical_emergency',
          'festival',
          'supply_glut'
        ),
        // Generate random system ID from test data
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        // Generate random current day
        fc.integer({ min: 0, max: 100 }),
        (eventTypeKey, systemId, currentDay) => {
          // Create an active event
          const event = EconomicEventsSystem.createEvent(
            eventTypeKey,
            systemId,
            currentDay
          );

          // Set up game state with the event
          const state = gameStateManager.getState();
          state.player.currentSystem = systemId;
          state.player.daysElapsed = currentDay;
          state.world.activeEvents = [event];

          // Show station interface (which should trigger event notification)
          uiManager.showStationInterface();

          // Verify modal is visible
          const eventModalOverlay = document.getElementById(
            'event-modal-overlay'
          );
          expect(eventModalOverlay.classList.contains('hidden')).toBe(false);

          // Click dismiss button
          const dismissButton = document.getElementById('event-modal-dismiss');
          dismissButton.click();

          // Property: Event modal should be hidden after dismiss
          expect(eventModalOverlay.classList.contains('hidden')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display correct event information for all event types', () => {
    fc.assert(
      fc.property(
        // Generate random system ID from test data
        fc.constantFrom(0, 1, 4, 5, 7, 13),
        // Generate random current day
        fc.integer({ min: 0, max: 100 }),
        (systemId, currentDay) => {
          // Test each event type
          const eventTypes = [
            'mining_strike',
            'medical_emergency',
            'festival',
            'supply_glut',
          ];

          for (const eventTypeKey of eventTypes) {
            // Create event
            const event = EconomicEventsSystem.createEvent(
              eventTypeKey,
              systemId,
              currentDay
            );

            // Set up game state
            const state = gameStateManager.getState();
            state.player.currentSystem = systemId;
            state.player.daysElapsed = currentDay;
            state.world.activeEvents = [event];

            // Show station interface
            uiManager.showStationInterface();

            // Get event type definition
            const eventType = EconomicEventsSystem.EVENT_TYPES[eventTypeKey];

            // Property: Title matches event name
            const eventModalTitle =
              document.getElementById('event-modal-title');
            expect(eventModalTitle.textContent).toBe(eventType.name);

            // Property: Description matches event description
            const eventModalDescription = document.getElementById(
              'event-modal-description'
            );
            expect(eventModalDescription.textContent).toBe(
              eventType.description
            );

            // Property: Duration is within expected range
            const [minDuration, maxDuration] = eventType.duration;
            const actualDuration = event.endDay - event.startDay;
            expect(actualDuration).toBeGreaterThanOrEqual(minDuration);
            expect(actualDuration).toBeLessThanOrEqual(maxDuration);

            // Hide modal for next iteration
            uiManager.hideEventNotification();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
