import { useState } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import {
  calculateRepairCost,
  calculateDiscountedRepairCost,
  calculateRepairAllCost,
  calculateDiscountedRepairAllCost,
  validateRepairAll,
  getSystemCondition,
} from './repairUtils';
import { SHIP_CONFIG, UI_CONFIG } from '../../game/constants';
import { getNPCsAtSystem } from '../../game/game-npcs';

/**
 * RepairPanel component for repairing ship systems.
 *
 * Displays current ship condition and provides options to repair hull,
 * engine, and life support systems individually or all at once.
 *
 * React Migration Spec: Requirements 8.3
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback to close the panel
 * @returns {JSX.Element} Repair panel component
 */
export function RepairPanel({ onClose }) {
  const gameStateManager = useGameState();
  const starData = useStarData();
  const shipCondition = useGameEvent('shipConditionChanged');
  const credits = useGameEvent('creditsChanged');
  const currentSystemId = useGameEvent('locationChanged');
  const { repair, canGetFreeRepair, getFreeRepair } = useGameAction();

  const [validationMessage, setValidationMessage] = useState('');
  const [validationClass, setValidationClass] = useState('');

  // Use Bridge Pattern to get ship condition
  const condition = shipCondition;

  // Get NPCs at current location for free repair checks
  const npcsAtSystem = getNPCsAtSystem(currentSystemId);

  // Check for available free repairs from any NPC at this location
  const freeRepairOptions = npcsAtSystem
    .map((npc) => {
      const freeRepairAvailability = canGetFreeRepair(npc.id);
      return {
        npc,
        availability: freeRepairAvailability,
      };
    })
    .filter((option) => option.availability.available);

  // Get repair service discounts from NPCs at this location
  const repairDiscounts = npcsAtSystem
    .map((npc) => {
      const discountInfo = gameStateManager.getServiceDiscount(
        npc.id,
        'repair'
      );
      return {
        npc,
        discount: discountInfo.discount,
        npcName: discountInfo.npcName,
      };
    })
    .filter((option) => option.discount > 0);

  // Calculate the best discount available
  const bestDiscount = repairDiscounts.reduce(
    (best, current) => (current.discount > best.discount ? current : best),
    { discount: 0, npcName: null }
  );

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

  const handleFreeRepair = (npcId, maxHullPercent) => {
    // Calculate current hull damage percentage
    const currentHull = condition.hull;
    const maxHull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
    const hullDamagePercent = maxHull - currentHull;

    // Apply free repair
    const repairOutcome = getFreeRepair(npcId, hullDamagePercent);

    if (repairOutcome.success) {
      setValidationMessage(`Free repair completed: ${repairOutcome.message}`);
      setValidationClass('success');
    } else {
      setValidationMessage(`Free repair failed: ${repairOutcome.message}`);
      setValidationClass('error');
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
    const repairAmounts = UI_CONFIG.REPAIR_AMOUNTS;

    return (
      <div className="repair-system-group">
        <h4>{label}</h4>
        <div className="repair-buttons">
          {repairAmounts.map((amountStr) => {
            let amount = 0;
            let cost = 0;
            let discountedCost = 0;
            let buttonText = '';

            if (amountStr === 'full') {
              amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
              cost = calculateRepairCost(amount, currentCondition);
              discountedCost = calculateDiscountedRepairCost(
                amount,
                currentCondition,
                bestDiscount.discount
              );

              if (bestDiscount.discount > 0) {
                buttonText = `Full (₡${discountedCost})`;
              } else {
                buttonText = `Full (₡${cost})`;
              }
            } else {
              amount = amountStr;
              cost = calculateRepairCost(amount, currentCondition);
              discountedCost = calculateDiscountedRepairCost(
                amount,
                currentCondition,
                bestDiscount.discount
              );

              if (bestDiscount.discount > 0) {
                buttonText = `+${amount}% (₡${discountedCost})`;
              } else {
                buttonText = `+${amount}% (₡${cost})`;
              }
            }

            const wouldExceedMax =
              currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX;
            const atMax = currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
            const finalCost = bestDiscount.discount > 0 ? discountedCost : cost;
            const notEnoughCredits = credits < finalCost;

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
  const discountedTotalCost = calculateDiscountedRepairAllCost(
    condition,
    bestDiscount.discount
  );
  const finalTotalCost =
    bestDiscount.discount > 0 ? discountedTotalCost : totalCost;

  const allAtMax =
    condition.hull >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.engine >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.lifeSupport >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
  const repairAllDisabled =
    allAtMax || credits < finalTotalCost || totalCost === 0;

  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!currentSystem) {
    return (
      <div id="repair-panel" className="visible">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Repairs - Error</h2>
        <div className="repair-content">
          <div className="validation-message error">
            System data error: Unable to load repair panel. Please restart the
            game.
          </div>
        </div>
        <div className="repair-actions">
          <button className="station-btn secondary" onClick={onClose}>
            Back to Station
          </button>
        </div>
      </div>
    );
  }

  const currentSystemName = currentSystem.name;

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
                Repair All to Full (₡{finalTotalCost})
              </button>
            </div>
          </div>
        </div>

        {/* NPC Discount Section */}
        {bestDiscount.discount > 0 && (
          <div className="repair-section">
            <h3>NPC Discount Applied</h3>
            <div className="discount-info">
              <div className="discount-details">
                <p>
                  <strong>{bestDiscount.npcName}</strong> is providing a{' '}
                  <strong>{Math.round(bestDiscount.discount * 100)}%</strong>{' '}
                  discount on repair services.
                </p>
                <p className="discount-note">
                  <em>All repair prices shown above include this discount.</em>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Free Repair Section */}
        <div className="repair-section">
          <h3>Free Repair</h3>
          {freeRepairOptions.length > 0 ? (
            <div className="free-repair-options">
              {freeRepairOptions.map(({ npc, availability }) => {
                const currentHull = condition.hull;
                const maxHull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
                const hullDamagePercent = maxHull - currentHull;
                const actualRepairPercent = Math.min(
                  hullDamagePercent,
                  availability.maxHullPercent
                );

                // Get tier name for display
                const tierName =
                  availability.maxHullPercent === 25 ? 'Family' : 'Trusted';

                return (
                  <div key={npc.id} className="free-repair-option">
                    <div className="free-repair-info">
                      <h4>
                        {npc.name} ({npc.role})
                      </h4>
                      <div className="free-repair-details">
                        <p className="tier-info">
                          <strong>{tierName} Tier:</strong> Up to{' '}
                          {availability.maxHullPercent}% hull damage repair
                        </p>
                        <p className="limitation-info">
                          <em>Once per visit limitation</em>
                        </p>
                        {actualRepairPercent > 0 ? (
                          <p className="repair-amount">
                            Will repair:{' '}
                            <strong>{actualRepairPercent.toFixed(1)}%</strong>{' '}
                            hull damage
                          </p>
                        ) : (
                          <p className="no-damage">No hull damage to repair</p>
                        )}
                      </div>
                    </div>
                    <button
                      className="free-repair-btn"
                      onClick={() =>
                        handleFreeRepair(npc.id, availability.maxHullPercent)
                      }
                      disabled={actualRepairPercent <= 0}
                    >
                      Get Free Repair
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="free-repair-unavailable">
              {npcsAtSystem.length > 0 ? (
                <div className="validation-info">
                  <h4>Free Repair Requirements</h4>
                  <div className="npc-status-list">
                    {npcsAtSystem.map((npc) => {
                      const availability = canGetFreeRepair(npc.id);
                      return (
                        <div key={npc.id} className="npc-status-item">
                          <div className="npc-info">
                            <strong>{npc.name}</strong> ({npc.role})
                          </div>
                          <div className="status-message">
                            {availability.reason || 'Requirements not met'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="tier-requirements">
                    <p>
                      <strong>Tier Requirements:</strong>
                    </p>
                    <ul>
                      <li>
                        <strong>Trusted Tier:</strong> Up to 10% hull damage
                        repair (once per visit)
                      </li>
                      <li>
                        <strong>Family Tier:</strong> Up to 25% hull damage
                        repair (once per visit)
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="no-npcs">
                  No NPCs available at this station for free repairs.
                </p>
              )}
            </div>
          )}
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
