import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { UIManager } from '../../js/game-ui.js';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

/**
 * Feature: tramp-freighter-core-loop, Property 32: Error Message Sequencing
 * 
 * Property: For any sequence of multiple error messages, they should be displayed
 * one at a time without overlapping.
 */

describe('Property 32: Error Message Sequencing', () => {
    let dom;
    let document;
    let gameStateManager;
    let uiManager;
    
    beforeEach(() => {
        // Set up DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud"></div>
                <div id="notification-area"></div>
                <div id="hud-credits"></div>
                <div id="hud-debt"></div>
                <div id="hud-days"></div>
                <div id="fuel-bar"></div>
                <div id="hud-fuel-text"></div>
                <div id="hud-cargo"></div>
                <div id="hud-system"></div>
                <div id="hud-distance"></div>
                <div id="station-interface"></div>
                <div id="station-name"></div>
                <div id="station-system-name"></div>
                <div id="station-distance"></div>
                <div id="station-close-btn"></div>
                <div id="trade-btn"></div>
                <div id="refuel-btn"></div>
                <div id="undock-btn"></div>
                <div id="trade-panel"></div>
                <div id="trade-system-name"></div>
                <div id="trade-close-btn"></div>
                <div id="trade-back-btn"></div>
                <div id="market-goods"></div>
                <div id="cargo-stacks"></div>
                <div id="refuel-panel"></div>
                <div id="refuel-system-name"></div>
                <div id="refuel-current-fuel"></div>
                <div id="refuel-price-per-percent"></div>
                <div id="refuel-amount-input"></div>
                <div id="refuel-total-cost"></div>
                <div id="refuel-confirm-btn"></div>
                <div id="refuel-close-btn"></div>
                <div id="refuel-back-btn"></div>
                <div id="refuel-max-btn"></div>
            </body>
            </html>
        `);
        
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;
        
        // Mock timers
        vi.useFakeTimers();
        
        // Initialize game state manager
        gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager.initNewGame();
        
        // Initialize UI manager
        uiManager = new UIManager(gameStateManager);
    });
    
    afterEach(() => {
        vi.useRealTimers();
        delete global.document;
        delete global.window;
    });
    
    it('should display multiple error messages sequentially without overlap', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
                (messages) => {
                    uiManager.clearNotifications();
                    
                    messages.forEach(msg => {
                        uiManager.showError(msg, 100);
                    });
                    
                    const notificationArea = document.getElementById('notification-area');
                    let visibleNotifications = notificationArea.querySelectorAll('.notification:not(.fade-out)');
                    
                    expect(visibleNotifications.length).toBeLessThanOrEqual(1);
                    
                    for (let i = 0; i < messages.length; i++) {
                        vi.advanceTimersByTime(50);
                        
                        visibleNotifications = notificationArea.querySelectorAll('.notification:not(.fade-out)');
                        
                        expect(visibleNotifications.length).toBeLessThanOrEqual(1);
                        
                        vi.advanceTimersByTime(100);
                        vi.advanceTimersByTime(300);
                    }
                    
                    // Boundary check: empty queue proves all messages were processed
                    expect(uiManager.notificationQueue.length).toBe(0);
                    expect(uiManager.isShowingNotification).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should display each message for the specified duration', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 50 }),
                fc.integer({ min: 1000, max: 5000 }),
                (message, duration) => {
                    // Clear any previous state
                    uiManager.clearNotifications();
                    
                    // Show error with custom duration
                    uiManager.showError(message, duration);
                    
                    const notificationArea = document.getElementById('notification-area');
                    
                    // Should be visible immediately
                    let notifications = notificationArea.querySelectorAll('.notification');
                    expect(notifications.length).toBe(1);
                    expect(notifications[0].textContent).toBe(message);
                    
                    // Should still be visible just before duration expires
                    vi.advanceTimersByTime(duration - 100);
                    notifications = notificationArea.querySelectorAll('.notification:not(.fade-out)');
                    expect(notifications.length).toBe(1);
                    
                    // Should start fading out after duration
                    vi.advanceTimersByTime(200);
                    notifications = notificationArea.querySelectorAll('.notification.fade-out');
                    expect(notifications.length).toBe(1);
                    
                    // Should be removed after fade-out animation
                    vi.advanceTimersByTime(300);
                    notifications = notificationArea.querySelectorAll('.notification');
                    expect(notifications.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should maintain message order in the queue', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 3, maxLength: 5 }),
                (messages) => {
                    // Clear any previous state
                    uiManager.clearNotifications();
                    
                    // Queue all messages
                    messages.forEach(msg => {
                        uiManager.showError(msg, 100);
                    });
                    
                    const notificationArea = document.getElementById('notification-area');
                    const displayedMessages = [];
                    
                    // Process through all messages and record order
                    for (let i = 0; i < messages.length; i++) {
                        // Wait for notification to appear
                        vi.advanceTimersByTime(10);
                        
                        const visibleNotifications = notificationArea.querySelectorAll('.notification:not(.fade-out)');
                        if (visibleNotifications.length > 0) {
                            displayedMessages.push(visibleNotifications[0].textContent);
                        }
                        
                        // Advance through display duration and fade-out
                        vi.advanceTimersByTime(100);
                        vi.advanceTimersByTime(300);
                    }
                    
                    // Messages should be displayed in the same order they were queued
                    expect(displayedMessages).toEqual(messages);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle rapid successive error calls without overlap', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
                (messages) => {
                    // Clear any previous state
                    uiManager.clearNotifications();
                    
                    // Rapidly queue all messages (simulating rapid errors)
                    messages.forEach(msg => {
                        uiManager.showError(msg, 100);
                    });
                    
                    const notificationArea = document.getElementById('notification-area');
                    
                    // Check at multiple time points that we never have overlapping notifications
                    for (let t = 0; t < messages.length * 450; t += 50) {
                        vi.advanceTimersByTime(50);
                        
                        const visibleNotifications = notificationArea.querySelectorAll('.notification:not(.fade-out)');
                        
                        // Should never have more than 1 visible notification
                        expect(visibleNotifications.length).toBeLessThanOrEqual(1);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
