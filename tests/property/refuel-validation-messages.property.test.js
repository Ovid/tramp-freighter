import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';

/**
 * Property-based tests for refuel validation messages
 *
 * Verifies that users receive clear feedback when refueling
 * is not possible, improving UX.
 */
describe('Refuel Validation Messages', () => {
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
                    <div id="game-hud" class="visible">
                        <span id="hud-credits">1000</span>
                        <span id="hud-debt">0</span>
                        <span id="hud-days">0</span>
                        <div id="fuel-bar"></div>
                        <span id="hud-fuel-text">100%</span>
                        <span id="hud-cargo">0/50</span>
                        <span id="hud-system">Sol</span>
                        <span id="hud-distance">0.0 LY</span>
                    </div>
                    <div id="refuel-panel">
                        <span id="refuel-system-name">Sol</span>
                        <span id="refuel-current-fuel">100%</span>
                        <span id="refuel-price-per-percent">2 cr/%</span>
                        <input id="refuel-amount-input" type="number" value="10" />
                        <span id="refuel-total-cost">20 cr</span>
                        <button id="refuel-confirm-btn">Refuel</button>
                        <button id="refuel-close-btn">Close</button>
                        <button id="refuel-back-btn">Back</button>
                        <button id="refuel-max-btn">Max</button>
                        <div id="refuel-validation-message"></div>
                    </div>
                    <div id="notification-area"></div>
                </body>
            </html>
        `);
    document = dom.window.document;
    global.document = document;

    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
    uiManager = new UIManager(gameStateManager);
  });

  afterEach(() => {
    delete global.document;
  });

  it('should show error message when insufficient credits', () => {
    // Set low credits
    gameStateManager.updateCredits(10);
    gameStateManager.updateFuel(50);

    // Try to refuel more than affordable
    const refuelInput = document.getElementById('refuel-amount-input');
    refuelInput.value = '20'; // Would cost 40 cr, but only have 10 cr

    // Trigger update
    uiManager.updateRefuelCost();

    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );
    const confirmBtn = document.getElementById('refuel-confirm-btn');

    // Should show error message
    expect(validationMessage.textContent).toContain('Insufficient credits');
    expect(validationMessage.classList.contains('error')).toBe(true);

    // Button should be disabled
    expect(confirmBtn.disabled).toBe(true);
  });

  it('should show error message when exceeding capacity', () => {
    gameStateManager.updateFuel(95);

    // Try to refuel beyond 100%
    const refuelInput = document.getElementById('refuel-amount-input');
    refuelInput.value = '10'; // Would result in 105%

    // Trigger update
    uiManager.updateRefuelCost();

    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );
    const confirmBtn = document.getElementById('refuel-confirm-btn');

    // Should show error message
    expect(validationMessage.textContent).toContain('beyond 100% capacity');
    expect(validationMessage.classList.contains('error')).toBe(true);

    // Button should be disabled
    expect(confirmBtn.disabled).toBe(true);
  });

  it('should show info message when amount is zero', () => {
    gameStateManager.updateFuel(50);

    // Set amount to 0
    const refuelInput = document.getElementById('refuel-amount-input');
    refuelInput.value = '0';

    // Trigger update
    uiManager.updateRefuelCost();

    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );
    const confirmBtn = document.getElementById('refuel-confirm-btn');

    // Should show info message
    expect(validationMessage.textContent).toContain('Enter an amount');
    expect(validationMessage.classList.contains('info')).toBe(true);

    // Button should be disabled
    expect(confirmBtn.disabled).toBe(true);
  });

  it('should hide message when refuel is valid', () => {
    gameStateManager.updateFuel(50);
    gameStateManager.updateCredits(1000);

    // Set valid amount
    const refuelInput = document.getElementById('refuel-amount-input');
    refuelInput.value = '20';

    // Trigger update
    uiManager.updateRefuelCost();

    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );
    const confirmBtn = document.getElementById('refuel-confirm-btn');

    // Should hide message
    expect(validationMessage.textContent).toBe('');
    expect(validationMessage.classList.contains('error')).toBe(false);
    expect(validationMessage.classList.contains('info')).toBe(false);

    // Button should be enabled
    expect(confirmBtn.disabled).toBe(false);
  });

  it('should update message dynamically as amount changes', () => {
    gameStateManager.updateFuel(50);
    gameStateManager.updateCredits(50);

    const refuelInput = document.getElementById('refuel-amount-input');
    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );

    // Start with valid amount
    refuelInput.value = '10';
    uiManager.updateRefuelCost();
    expect(validationMessage.textContent).toBe('');

    // Change to invalid amount (insufficient credits)
    refuelInput.value = '50'; // Would cost 100 cr
    uiManager.updateRefuelCost();
    expect(validationMessage.textContent).toContain('Insufficient credits');
    expect(validationMessage.classList.contains('error')).toBe(true);

    // Change to zero
    refuelInput.value = '0';
    uiManager.updateRefuelCost();
    expect(validationMessage.textContent).toContain('Enter an amount');
    expect(validationMessage.classList.contains('info')).toBe(true);

    // Change back to valid
    refuelInput.value = '10';
    uiManager.updateRefuelCost();
    expect(validationMessage.textContent).toBe('');
  });

  it('should show appropriate message for nearly full tank', () => {
    gameStateManager.updateFuel(99.5);

    // Try to refuel when nearly full
    const refuelInput = document.getElementById('refuel-amount-input');
    refuelInput.value = '1';

    // Trigger update
    uiManager.updateRefuelCost();

    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );

    // Should show capacity error
    expect(validationMessage.textContent).toContain('beyond 100% capacity');
    expect(validationMessage.classList.contains('error')).toBe(true);
  });

  it('should provide clear feedback for max button with insufficient credits', () => {
    gameStateManager.updateFuel(20);
    gameStateManager.updateCredits(10); // Only enough for 5%

    // Click max button
    uiManager.setRefuelAmountToMax();

    const refuelInput = document.getElementById('refuel-amount-input');
    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );

    // Should set to max affordable (5%)
    expect(parseInt(refuelInput.value)).toBe(5);

    // Should not show error (this is valid)
    expect(validationMessage.textContent).toBe('');
  });

  it('should handle fractional fuel with validation messages', () => {
    gameStateManager.updateFuel(57.3);
    gameStateManager.updateCredits(1000);

    const refuelInput = document.getElementById('refuel-amount-input');

    // Try to refuel exactly to 100%
    refuelInput.value = '43'; // 57.3 + 43 = 100.3 (exceeds)
    uiManager.updateRefuelCost();

    const validationMessage = document.getElementById(
      'refuel-validation-message'
    );

    // Should show capacity error
    expect(validationMessage.textContent).toContain('beyond 100% capacity');

    // Reduce by 1
    refuelInput.value = '42'; // 57.3 + 42 = 99.3 (valid)
    uiManager.updateRefuelCost();

    // Should be valid now
    expect(validationMessage.textContent).toBe('');
  });
});
