import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { calculateRefuelCost, calculateMaxRefuel } from './refuelUtils';

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

  // Access GameStateManager
  const gameStateManager = useGameState();

  // Subscribe to game state changes
  const fuel = useGameEvent('fuelChanged');
  const credits = useGameEvent('creditsChanged');

  // Get action methods
  const { refuel } = useGameAction();

  // Get current state for calculations
  const state = gameStateManager.getState();
  const currentSystem = state.player.currentSystem;
  const fuelPrice = gameStateManager.getFuelPrice(currentSystem);

  // Calculate values
  const totalCost = calculateRefuelCost(amount, fuelPrice);
  const maxRefuel = calculateMaxRefuel(fuel, credits, fuelPrice);

  // Validate refuel
  const validation = gameStateManager.validateRefuel(
    fuel,
    amount,
    credits,
    fuelPrice
  );

  // Initialize amount when panel opens
  useEffect(() => {
    const defaultAmount = Math.min(10, maxRefuel);
    setAmount(defaultAmount > 0 ? defaultAmount : 0);
  }, []); // Empty dependency array - only run on mount

  const handleAmountChange = (e) => {
    setAmount(Number(e.target.value));
  };

  const handleMaxClick = () => {
    setAmount(maxRefuel);
  };

  const handleConfirm = () => {
    if (validation.valid && amount > 0) {
      refuel(amount);
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
  } else if (!validation.valid) {
    validationMessage = validation.reason;
    validationClass = 'validation-message error';
  }

  return (
    <div id="refuel-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
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
            <span className="value">{fuelPrice} cr</span>
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
              <span className="cost-value">{totalCost} cr</span>
            </div>
          </div>

          {validationMessage && (
            <div className={validationClass}>{validationMessage}</div>
          )}
        </div>

        <div className="refuel-actions">
          <button
            className="station-btn"
            onClick={handleConfirm}
            disabled={!validation.valid || amount <= 0}
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
