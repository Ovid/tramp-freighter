import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';

/**
 * DevAdminPanel - Development admin panel for testing
 *
 * Provides controls to modify game state for testing purposes.
 * Only rendered when dev mode is enabled (detected via .dev file).
 */
export function DevAdminPanel({ onClose }) {
  const gameStateManager = useGameState();

  // Subscribe to game state changes
  const credits = useGameEvent('creditsChanged');
  const debt = useGameEvent('debtChanged');
  const fuel = useGameEvent('fuelChanged');

  // Local state for input fields
  const [creditsInput, setCreditsInput] = useState('0');
  const [debtInput, setDebtInput] = useState('0');
  const [fuelInput, setFuelInput] = useState('100');

  // Update input fields when game state changes
  useEffect(() => {
    if (credits !== undefined) {
      setCreditsInput(String(credits));
    }
  }, [credits]);

  useEffect(() => {
    if (debt !== undefined) {
      setDebtInput(String(debt));
    }
  }, [debt]);

  useEffect(() => {
    if (fuel !== undefined) {
      setFuelInput(String(Math.round(fuel)));
    }
  }, [fuel]);

  const handleSetCredits = () => {
    const amount = parseInt(creditsInput);
    if (!isNaN(amount) && amount >= 0) {
      gameStateManager.setCredits(amount);
    }
  };

  const handleSetDebt = () => {
    const amount = parseInt(debtInput);
    if (!isNaN(amount) && amount >= 0) {
      gameStateManager.setDebt(amount);
    }
  };

  const handleSetFuel = () => {
    const amount = parseInt(fuelInput);
    if (!isNaN(amount) && amount >= 0 && amount <= 100) {
      gameStateManager.setFuel(amount);
    }
  };

  const handleRepairAll = () => {
    gameStateManager.updateShipCondition(100, 100, 100);
  };

  const handleClearCargo = () => {
    gameStateManager.updateCargo([]);
  };

  return (
    <div id="dev-admin-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>🔧 Dev Admin Panel</h2>

      <div className="dev-admin-section">
        <h3>Player Resources</h3>
        <div className="dev-admin-control">
          <label>Credits:</label>
          <input
            type="number"
            value={creditsInput}
            onChange={(e) => setCreditsInput(e.target.value)}
            min="0"
          />
          <button onClick={handleSetCredits}>Set</button>
        </div>
        <div className="dev-admin-control">
          <label>Debt:</label>
          <input
            type="number"
            value={debtInput}
            onChange={(e) => setDebtInput(e.target.value)}
            min="0"
          />
          <button onClick={handleSetDebt}>Set</button>
        </div>
      </div>

      <div className="dev-admin-section">
        <h3>Ship Status</h3>
        <div className="dev-admin-control">
          <label>Fuel (%):</label>
          <input
            type="number"
            value={fuelInput}
            onChange={(e) => setFuelInput(e.target.value)}
            min="0"
            max="100"
          />
          <button onClick={handleSetFuel}>Set</button>
        </div>
      </div>

      <div className="dev-admin-actions">
        <button onClick={handleRepairAll}>Repair All Systems to 100%</button>
        <button onClick={handleClearCargo}>Clear All Cargo</button>
      </div>

      <div className="dev-admin-warning">
        ⚠ Dev Mode Only - Not visible in production
      </div>
    </div>
  );
}
