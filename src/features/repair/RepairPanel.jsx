import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import {
  calculateRepairCost,
  calculateRepairAllCost,
  validateRepair,
  validateRepairAll,
  getSystemName,
  getSystemCondition,
} from './repairUtils';
import { SHIP_CONFIG } from '../../game/constants';

export function RepairPanel({ onClose }) {
  const gameStateManager = useGameState();
  const shipCondition = useGameEvent('shipConditionChanged');
  const credits = useGameEvent('creditsChanged');
  const { repair } = useGameAction();

  const [validationMessage, setValidationMessage] = useState('');
  const [validationClass, setValidationClass] = useState('');

  const state = gameStateManager.getState();
  const condition = shipCondition || {
    hull: state.ship.hull,
    engine: state.ship.engine,
    lifeSupport: state.ship.lifeSupport,
  };

  const handleRepairSystem = (systemType, amountStr) => {
    let amount = 0;
    const currentCondition = getSystemCondition(condition, systemType);

    if (amountStr === 'full') {
      amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
    } else {
      amount = parseInt(amountStr);
    }

    // Execute repair
    const repairOutcome = repair(systemType, amount);

    if (!repairOutcome.success) {
      setValidationMessage(`Repair failed: ${repairOutcome.reason}`);
      setValidationClass('error');
    } else {
      setValidationMessage('');
      setValidationClass('');
    }
  };

  const handleRepairAll = () => {
    const validation = validateRepairAll(condition, credits);

    if (!validation.valid) {
      setValidationMessage(validation.reason);
      setValidationClass('error');
      return;
    }

    let repairCount = 0;
    let failedRepairs = [];

    // Repair hull
    const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      const repairOutcome = repair('hull', hullAmount);
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Hull: ${repairOutcome.reason}`);
      }
    }

    // Repair engine
    const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      const repairOutcome = repair('engine', engineAmount);
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Engine: ${repairOutcome.reason}`);
      }
    }

    // Repair life support
    const lifeSupportAmount =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      const repairOutcome = repair('lifeSupport', lifeSupportAmount);
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Life Support: ${repairOutcome.reason}`);
      }
    }

    // Show results
    if (failedRepairs.length > 0) {
      setValidationMessage(`Some repairs failed: ${failedRepairs.join(', ')}`);
      setValidationClass('error');
    } else if (repairCount > 0) {
      setValidationMessage('');
      setValidationClass('');
    } else {
      setValidationMessage('All systems already at maximum condition');
      setValidationClass('info');
    }
  };

  const renderConditionItem = (systemType, label, barClass) => {
    const currentCondition = getSystemCondition(condition, systemType);

    return (
      <div className="condition-item">
        <div className="condition-header">
          <span className="condition-label">{label}:</span>
          <span className="condition-value">
            {Math.round(currentCondition)}%
          </span>
        </div>
        <div className="condition-bar-container">
          <div
            className={`condition-bar ${barClass}`}
            style={{ width: `${currentCondition}%` }}
          />
        </div>
      </div>
    );
  };

  const renderSystemRepair = (systemType, label) => {
    const currentCondition = getSystemCondition(condition, systemType);
    const repairAmounts = [10, 25, 50, 'full'];

    return (
      <div className="repair-system-group">
        <h4>{label}</h4>
        <div className="repair-buttons">
          {repairAmounts.map((amountStr) => {
            let amount = 0;
            let cost = 0;
            let buttonText = '';

            if (amountStr === 'full') {
              amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
              cost = calculateRepairCost(systemType, amount, currentCondition);
              buttonText = `Full (₡${cost})`;
            } else {
              amount = amountStr;
              cost = calculateRepairCost(systemType, amount, currentCondition);
              buttonText = `+${amount}% (₡${cost})`;
            }

            const wouldExceedMax =
              currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX;
            const atMax = currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
            const notEnoughCredits = credits < cost;

            const disabled =
              atMax || notEnoughCredits || wouldExceedMax || amount <= 0;

            return (
              <button
                key={amountStr}
                className="repair-btn"
                onClick={() => handleRepairSystem(systemType, amountStr)}
                disabled={disabled}
              >
                {buttonText}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const totalCost = calculateRepairAllCost(condition);
  const allAtMax =
    condition.hull >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.engine >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.lifeSupport >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  const repairAllDisabled = allAtMax || credits < totalCost || totalCost === 0;

  const currentSystem = gameStateManager.starData.find(
    (s) => s.id === state.player.currentSystem
  );
  const currentSystemName = currentSystem?.name || 'Unknown';

  return (
    <div id="repair-panel" className="visible">
      <button className="close-btn" onClick={onClose}>
        ×
      </button>
      <h2>
        Repairs - <span>{currentSystemName}</span>
      </h2>

      <div className="repair-content">
        {/* Ship Condition Status Section */}
        <div className="repair-section">
          <h3>Ship Condition</h3>
          <div className="condition-status">
            {renderConditionItem('hull', 'Hull Integrity', 'hull-bar')}
            {renderConditionItem('engine', 'Engine', 'engine-bar')}
            {renderConditionItem(
              'lifeSupport',
              'Life Support',
              'life-support-bar'
            )}
          </div>
        </div>

        {/* Repair Options Section */}
        <div className="repair-section">
          <h3>Repair Options</h3>
          <div className="repair-options">
            {renderSystemRepair('hull', 'Hull Integrity')}
            {renderSystemRepair('engine', 'Engine')}
            {renderSystemRepair('lifeSupport', 'Life Support')}

            {/* Repair All Option */}
            <div className="repair-all-section">
              <button
                className="repair-all-btn"
                onClick={handleRepairAll}
                disabled={repairAllDisabled}
              >
                Repair All to Full (₡{totalCost})
              </button>
            </div>
          </div>
        </div>

        {/* Validation Message */}
        {validationMessage && (
          <div className={`validation-message ${validationClass}`}>
            {validationMessage}
          </div>
        )}
      </div>

      <div className="repair-actions">
        <button className="station-btn secondary" onClick={onClose}>
          Back to Station
        </button>
      </div>
    </div>
  );
}
