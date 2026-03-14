import { useState, useEffect, useRef } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { EVENT_NAMES, TRADE_CONFIG } from '../../game/constants.js';
import {
  calculateRefuelCost,
  calculateDiscountedRefuelCost,
  calculateMaxRefuel,
} from './refuelUtils';
import { getNPCsAtSystem } from '../../game/game-npcs';

/**
 * RefuelPanel - React component for refueling the ship
 *
 * Manages local state for the refuel amount slider and displays real-time
 * cost calculations and validation messages. Uses the Bridge Pattern to
 * subscribe to fuel and credit changes and trigger refuel actions.
 *
 * React Migration Spec - Requirements 8.2, 27.1, 27.2, 27.3, 27.4, 27.5
 *
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the panel
 */
export function RefuelPanel({ onClose }) {
  // Local state for slider amount (UI-only state)
  const [amount, setAmount] = useState(0);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  // Subscribe to game state changes
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const credits = useGameEvent(EVENT_NAMES.CREDITS_CHANGED);
  const currentSystem = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);

  // Get action methods
  const {
    refuel,
    validateRefuel,
    getNarrativeFlags,
    getFuelPrice,
    getServiceDiscount,
  } = useGameAction();
  const fuelPrice = getFuelPrice(currentSystem);

  // Get NPCs at current location for refuel discounts
  const npcsAtSystem = getNPCsAtSystem(currentSystem, getNarrativeFlags());

  // Get refuel service discounts from NPCs at this location
  const refuelDiscounts = npcsAtSystem
    .map((npc) => {
      const discountInfo = getServiceDiscount(npc.id, 'refuel');
      return {
        npc,
        discount: discountInfo.discount,
        npcName: discountInfo.npcName,
      };
    })
    .filter((option) => option.discount > 0);

  // Calculate the best discount available
  const bestDiscount = refuelDiscounts.reduce(
    (best, current) => (current.discount > best.discount ? current : best),
    { discount: 0, npcName: null }
  );

  // Derive effective price once, accounting for any NPC discount
  const effectiveFuelPrice =
    bestDiscount.discount > 0
      ? fuelPrice * (1 - bestDiscount.discount)
      : fuelPrice;

  // Calculate values using effective price consistently
  const totalCost = calculateRefuelCost(amount, fuelPrice);
  const discountedTotalCost = calculateDiscountedRefuelCost(
    amount,
    fuelPrice,
    bestDiscount.discount
  );
  const finalTotalCost =
    bestDiscount.discount > 0 ? discountedTotalCost : totalCost;
  const maxRefuel = calculateMaxRefuel(fuel, credits, effectiveFuelPrice);

  // Validate refuel with effective price
  const finalValidation = validateRefuel(
    fuel,
    amount,
    credits,
    effectiveFuelPrice
  );

  // Initialize amount when panel opens (only on first render)
  useEffect(() => {
    if (isFirstRender.current) {
      const defaultAmount = Math.min(
        TRADE_CONFIG.QUICK_BUY_QUANTITY,
        maxRefuel
      );
      setAmount(defaultAmount > 0 ? defaultAmount : 0);
      isFirstRender.current = false;
    }
  }, [maxRefuel]);

  /**
   * Handle slider value changes
   * @param {Event} e - Change event from range input
   */
  const handleAmountChange = (e) => {
    setAmount(Number(e.target.value));
  };

  /**
   * Set slider to maximum refuelable amount
   */
  const handleMaxClick = () => {
    setAmount(maxRefuel);
  };

  /**
   * Confirm refuel transaction and reset slider
   */
  const handleConfirm = () => {
    if (finalValidation.valid && amount > 0) {
      refuel(amount, bestDiscount.discount);
      // Reset amount after successful refuel
      setAmount(0);
    }
  };

  // Determine validation message
  let validationMessage = '';
  let validationClass = 'validation-message';

  if (amount <= 0) {
    validationMessage = 'Enter an amount to refuel';
    validationClass = 'validation-message info';
  } else if (!finalValidation.valid) {
    validationMessage = finalValidation.reason;
    validationClass = 'validation-message error';
  }

  return (
    <div id="refuel-panel" className="visible">
      <button className="close-btn" onClick={onClose} aria-label="Close">
        ×
      </button>
      <h2>Refuel</h2>

      <div className="refuel-content">
        <div className="refuel-section refuel-status">
          <h3>Current Status</h3>
          <div className="info-row">
            <span className="label">Current Fuel:</span>
            <span className="value">{Math.round(fuel)}%</span>
          </div>
          <div className="info-row">
            <span className="label">Price per %:</span>
            <span className="value">{fuelPrice} ₡</span>
          </div>
        </div>

        <div className="refuel-section refuel-controls">
          <h3>Refuel Amount</h3>
          <div className="refuel-input-group">
            <label htmlFor="refuel-amount">Amount:</label>
            <input
              id="refuel-amount"
              type="range"
              min="0"
              max={maxRefuel}
              value={amount}
              onChange={handleAmountChange}
            />
            <span className="value">{amount}%</span>
          </div>

          <div className="refuel-buttons">
            <button
              type="button"
              className="refuel-preset-btn"
              onClick={handleMaxClick}
            >
              Max ({maxRefuel}%)
            </button>
          </div>

          <div className="refuel-cost-display">
            <div className="cost-row">
              <span className="cost-label">Total Cost:</span>
              <span className="cost-value">{finalTotalCost} ₡</span>
            </div>
            {bestDiscount.discount > 0 && (
              <div className="discount-row">
                <span className="discount-label">
                  Discount ({Math.round(bestDiscount.discount * 100)}% from{' '}
                  {bestDiscount.npcName}):
                </span>
                <span className="discount-value">
                  -{totalCost - finalTotalCost} ₡
                </span>
              </div>
            )}
          </div>

          {validationMessage && (
            <div className={validationClass} role="alert">{validationMessage}</div>
          )}
        </div>

        <div className="refuel-actions">
          <button
            className="station-btn"
            onClick={handleConfirm}
            disabled={!finalValidation.valid || amount <= 0}
          >
            Confirm Refuel
          </button>
          <button className="station-btn secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
