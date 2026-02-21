import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import { useDangerZone } from '../../hooks/useDangerZone';
import { useJumpValidation } from '../../hooks/useJumpValidation';
import { useEncounterProbabilities } from '../../hooks/useEncounterProbabilities';

/**
 * JumpDialog displays information about a selected target system and allows jumping to it.
 *
 * Shows:
 * - Target system name
 * - Distance, fuel cost, and jump time
 * - Validation message if jump is not possible
 * - Jump button (disabled if jump is invalid)
 *
 * @param {number} targetSystemId - ID of the selected target system
 * @param {Function} onClose - Callback to close the dialog
 * @param {Function} onJumpComplete - Callback after successful jump
 */
export function JumpDialog({ targetSystemId, onClose, onJumpComplete }) {
  const starData = useStarData();
  const currentSystemId = useGameEvent('locationChanged');
  const fuel = useGameEvent('fuelChanged');
  const cargo = useGameEvent('cargoChanged');
  const shipCondition = useGameEvent('shipConditionChanged');
  const factionRep = useGameEvent('factionRepChanged');
  const upgrades = useGameEvent('upgradesChanged');
  const { executeJump } = useGameAction();

  // Validate jump using Bridge Pattern
  const validation = useJumpValidation(currentSystemId, targetSystemId, fuel);

  // Get danger zone information for the destination
  const dangerZone = useDangerZone(targetSystemId);

  // Build game state object from Bridge Pattern hooks for danger calculations
  const gameStateForDanger =
    cargo && shipCondition && factionRep && upgrades
      ? {
          ship: {
            cargo,
            hull: shipCondition.hull,
            engine: shipCondition.engine,
            upgrades,
          },
          player: {
            factions: factionRep,
          },
        }
      : null;

  // Calculate encounter probabilities using Bridge Pattern
  const { pirateChance, inspectionChance } = useEncounterProbabilities(
    targetSystemId,
    gameStateForDanger
  );

  // Get system data
  const targetSystem = starData.find((s) => s.id === targetSystemId);
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!targetSystem || !currentSystem) {
    return null;
  }

  // Determine if we should show danger warning
  const showDangerWarning =
    dangerZone === 'contested' || dangerZone === 'dangerous';
  const isHighRisk = dangerZone === 'dangerous' || pirateChance > 0.25;

  const handleJump = async () => {
    if (!validation.valid) return;

    try {
      const result = await executeJump(targetSystemId);
      if (result.success) {
        if (onJumpComplete) {
          // Pass the destination system ID to the complete handler
          onJumpComplete(targetSystemId);
        }
        onClose();
      } else {
        console.error('Jump failed:', result.error);
      }
    } catch (error) {
      console.error('Jump failed:', error);
    }
  };

  return (
    <div className="jump-dialog">
      <div className="jump-dialog-header">
        <h3>{targetSystem.name}</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="jump-dialog-content">
        <div className="jump-info-row">
          <span className="label">Distance:</span>
          <span className="value">{validation.distance.toFixed(1)} LY</span>
        </div>
        <div className="jump-info-row">
          <span className="label">Fuel Cost:</span>
          <span className="value">{Math.round(validation.fuelCost)}%</span>
        </div>
        <div className="jump-info-row">
          <span className="label">Jump Time:</span>
          <span className="value">
            {validation.jumpTime} day{validation.jumpTime !== 1 ? 's' : ''}
          </span>
        </div>

        {showDangerWarning && (
          <div
            className={`danger-warning ${isHighRisk ? 'high-risk' : 'moderate-risk'}`}
          >
            <div className="danger-header">
              <span className="danger-icon">⚠️</span>
              <span className="danger-title">
                {dangerZone === 'dangerous'
                  ? 'Dangerous System'
                  : 'Contested System'}
              </span>
            </div>
            <div className="danger-details">
              <div className="danger-info-row">
                <span className="danger-label">Pirate Activity:</span>
                <span className="danger-value">
                  {Math.round(pirateChance * 100)}%
                </span>
              </div>
              <div className="danger-info-row">
                <span className="danger-label">Inspection Risk:</span>
                <span className="danger-value">
                  {Math.round(inspectionChance * 100)}%
                </span>
              </div>
              {dangerZone === 'dangerous' && (
                <div className="danger-note">
                  Frontier system with minimal law enforcement presence.
                </div>
              )}
              {dangerZone === 'contested' && (
                <div className="danger-note">
                  System with mixed control and moderate security.
                </div>
              )}
            </div>
          </div>
        )}

        {!validation.valid && (
          <div className="validation-message error">{validation.error}</div>
        )}

        <button
          className="jump-btn"
          onClick={handleJump}
          disabled={!validation.valid}
        >
          Jump to System
        </button>
      </div>
    </div>
  );
}
