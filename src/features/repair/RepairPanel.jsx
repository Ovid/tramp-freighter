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
  getSystemName,
  isSystemCritical,
  canAffordRepairAboveThreshold,
  calculateCannibalizeRequired,
  calculateMaxDonation,
} from './repairUtils';
import { SHIP_CONFIG, UI_CONFIG, REPAIR_CONFIG } from '../../game/constants';
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
  const {
    repair,
    canGetFreeRepair,
    getFreeRepair,
    applyEmergencyPatch,
    cannibalizeSystem,
  } = useGameAction();

  const [validationMessage, setValidationMessage] = useState('');
  const [validationClass, setValidationClass] = useState('');
  const [cannibalizeAllocation, setCannibalizeAllocation] = useState({});

  // Use Bridge Pattern to get ship condition
  const condition = shipCondition;

  // Get NPCs at current location for free repair checks
  const npcsAtSystem = getNPCsAtSystem(
    currentSystemId,
    gameStateManager.getState?.()
  );

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

  const handleFreeRepair = (npcId, _maxHullPercent) => {
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

  const handleEmergencyPatch = (systemType) => {
    const result = applyEmergencyPatch(systemType);
    if (result.success) {
      setValidationMessage(
        `Emergency patch applied to ${getSystemName(systemType)}. +${REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} days.`
      );
      setValidationClass('warning');
    } else {
      setValidationMessage(`Emergency patch failed: ${result.reason}`);
      setValidationClass('error');
    }
  };

  const handleCannibalize = (targetType) => {
    const donations = Object.entries(cannibalizeAllocation)
      .filter(([, amount]) => amount > 0)
      .map(([system, amount]) => ({ system, amount }));

    const result = cannibalizeSystem(targetType, donations);
    if (result.success) {
      setValidationMessage(
        `Cannibalized systems to patch ${getSystemName(targetType)}.`
      );
      setValidationClass('warning');
      setCannibalizeAllocation({});
    } else {
      setValidationMessage(`Cannibalization failed: ${result.reason}`);
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

        {/* Emergency Patch Section */}
        {['hull', 'engine', 'lifeSupport'].some(
          (sys) =>
            isSystemCritical(getSystemCondition(condition, sys)) &&
            !canAffordRepairAboveThreshold(
              getSystemCondition(condition, sys),
              credits
            )
        ) && (
          <div className="repair-section emergency-section">
            <h3>Emergency Patch</h3>
            <p className="emergency-warning">
              Jury-rig repairs to minimum flight condition. Takes{' '}
              {REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} days per system.
            </p>
            {['hull', 'engine', 'lifeSupport'].map((sys) => {
              const cond = getSystemCondition(condition, sys);
              if (!isSystemCritical(cond)) return null;
              if (canAffordRepairAboveThreshold(cond, credits)) return null;

              return (
                <button
                  key={sys}
                  className="repair-btn emergency-btn"
                  onClick={() => handleEmergencyPatch(sys)}
                >
                  Emergency Patch {getSystemName(sys)} (+
                  {REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} days)
                </button>
              );
            })}
          </div>
        )}

        {/* Cannibalize Section */}
        {['hull', 'engine', 'lifeSupport'].some((sys) =>
          isSystemCritical(getSystemCondition(condition, sys))
        ) && (
          <div className="repair-section cannibalize-section">
            <h3>Cannibalize Systems</h3>
            <p className="cannibalize-warning">
              Sacrifice parts from other systems. 50% waste penalty (1.5x cost).
            </p>
            {['hull', 'engine', 'lifeSupport'].map((targetSys) => {
              const targetCond = getSystemCondition(condition, targetSys);
              if (!isSystemCritical(targetCond)) return null;

              const required = calculateCannibalizeRequired(targetCond);
              const donorSystems = ['hull', 'engine', 'lifeSupport'].filter(
                (s) =>
                  s !== targetSys &&
                  !isSystemCritical(getSystemCondition(condition, s))
              );
              const totalAvailable = donorSystems.reduce(
                (sum, s) =>
                  sum + calculateMaxDonation(getSystemCondition(condition, s)),
                0
              );

              if (totalAvailable < required) return null;

              const totalAllocated = donorSystems.reduce(
                (sum, s) => sum + (cannibalizeAllocation[s] || 0),
                0
              );

              return (
                <div key={targetSys} className="cannibalize-target">
                  <h4>
                    Repair {getSystemName(targetSys)} ({Math.round(targetCond)}%
                    → 21%)
                  </h4>
                  <p>Need {required}% from donors:</p>
                  {donorSystems.map((donorSys) => {
                    const donorCond = getSystemCondition(condition, donorSys);
                    const maxDonation = calculateMaxDonation(donorCond);
                    const currentAlloc = cannibalizeAllocation[donorSys] || 0;

                    return (
                      <div key={donorSys} className="donor-row">
                        <label>
                          {getSystemName(donorSys)} ({Math.round(donorCond)}%,
                          max {maxDonation}%)
                        </label>
                        <div className="donor-slider-group">
                          <input
                            type="range"
                            min={0}
                            max={maxDonation}
                            value={currentAlloc}
                            onChange={(e) =>
                              setCannibalizeAllocation((prev) => ({
                                ...prev,
                                [donorSys]: parseInt(e.target.value),
                              }))
                            }
                          />
                          <span>{currentAlloc}%</span>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className="repair-btn cannibalize-btn"
                    onClick={() => handleCannibalize(targetSys)}
                    disabled={totalAllocated < required}
                  >
                    Cannibalize ({totalAllocated}/{required}%)
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
