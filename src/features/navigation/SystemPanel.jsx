import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import { useStarmap } from '../../context/StarmapContext';
import { useDangerZone } from '../../hooks/useDangerZone';
import { useJumpValidation } from '../../hooks/useJumpValidation';
import { DangerWarningDialog } from '../danger/DangerWarningDialog';
import { calculateDistanceFromSol, EVENT_NAMES } from '../../game/constants';

/**
 * SystemPanel displays information about a system.
 *
 * When viewing current system: Shows system info with connected systems
 * When viewing different system: Shows jump information with jump button
 *
 * @param {number} viewingSystemId - ID of the system being viewed
 * @param {Function} onClose - Callback to close the panel
 * @param {Function} onJumpStart - Callback when jump starts (before animation)
 * @param {Function} onJumpComplete - Callback after successful jump
 */
export function SystemPanel({
  viewingSystemId,
  onClose,
  onJumpStart,
  onJumpComplete,
}) {
  const gameStateManager = useGameState();
  const starData = useStarData();
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const { executeJump } = useGameAction();
  const { selectStarById } = useStarmap();
  const dangerZone = useDangerZone(viewingSystemId);

  // Jump validation via Bridge Pattern (passes shipCondition for critical damage check)
  const validation = useJumpValidation(currentSystemId, viewingSystemId, fuel);

  // State for danger warning dialog
  const [showDangerWarning, setShowDangerWarning] = useState(false);

  // State for critical damage modal
  const [showCriticalDamageModal, setShowCriticalDamageModal] = useState(false);
  const isCriticalDamageError =
    validation && !validation.valid && validation.reason === 'critical_damage';

  // Auto-show critical damage modal when selecting a target system
  useEffect(() => {
    const isTargetSystem = viewingSystemId !== currentSystemId;
    if (isTargetSystem && isCriticalDamageError) {
      setShowCriticalDamageModal(true);
    } else {
      setShowCriticalDamageModal(false);
    }
  }, [viewingSystemId, currentSystemId, isCriticalDamageError]);

  // Get system data
  const viewingSystem = starData.find((s) => s.id === viewingSystemId);
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!viewingSystem || !currentSystem) {
    return null;
  }

  const isCurrentSystem = viewingSystemId === currentSystemId;

  // If viewing a different system, show jump info
  if (!isCurrentSystem) {
    const handleJump = async () => {
      if (!validation.valid) return;

      // Check if this is a dangerous system that requires warning
      const isDangerous =
        dangerZone === 'contested' || dangerZone === 'dangerous';

      if (isDangerous) {
        setShowDangerWarning(true);
        return; // Stop here and wait for user decision
      }

      // If not dangerous, proceed directly
      await executeJumpAfterConfirmation();
    };

    const executeJumpAfterConfirmation = async () => {
      // Close panel immediately so user can see the jump animation
      // Pass true to indicate we're jumping (don't deselect star)
      onClose(true); // true = keep selection ring visible

      if (onJumpStart) {
        onJumpStart();
      }

      try {
        await executeJump(viewingSystemId);
      } catch (error) {
        console.error('Jump failed:', error);
      } finally {
        if (onJumpComplete) {
          onJumpComplete();
        }
      }
    };

    const handleDangerWarningProceed = () => {
      setShowDangerWarning(false);
      executeJumpAfterConfirmation();
    };

    const handleDangerWarningCancel = () => {
      setShowDangerWarning(false);
    };

    return (
      <>
        {showDangerWarning && (
          <DangerWarningDialog
            destinationSystemId={viewingSystemId}
            destinationSystemName={viewingSystem.name}
            onProceed={handleDangerWarningProceed}
            onCancel={handleDangerWarningCancel}
          />
        )}
        {showCriticalDamageModal && (
          <div className="modal-overlay">
            <div className="modal critical-damage-modal">
              <h3>Ship Damaged</h3>
              <p>{validation.error}</p>
              <p>Dock at a station for repairs before attempting a jump.</p>
              <button
                className="modal-btn"
                onClick={() => setShowCriticalDamageModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        )}
        <div className="system-panel">
          <div className="system-panel-header">
            <h3>{viewingSystem.name}</h3>
            <button className="close-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <div className="system-panel-content">
            {/* System Details */}
            <div className="system-details">
              <div className="system-property">
                <span className="label">Spectral Class:</span>
                <span className="value">{viewingSystem.type}</span>
              </div>
              <div className="system-property">
                <span className="label">Wormholes:</span>
                <span className="value">{viewingSystem.wh}</span>
              </div>
              <div className="system-property">
                <span className="label">Distance from Sol:</span>
                <span className="value">
                  {calculateDistanceFromSol(viewingSystem).toFixed(1)} LY
                </span>
              </div>
              <div className="system-property">
                <span className="label">Security Level:</span>
                <span className={`value danger-${dangerZone}`}>
                  {dangerZone.charAt(0).toUpperCase() + dangerZone.slice(1)}
                </span>
              </div>
              <div className="system-property">
                <span className="label">Status:</span>
                <span className="value">
                  {viewingSystem.r === 1 ? 'Reachable' : 'Unreachable'}
                </span>
              </div>
            </div>

            <div className="system-divider"></div>

            {/* Jump Information */}
            <div className="jump-information">
              <div className="jump-info-row">
                <span className="label">Jump Distance:</span>
                <span className="value">
                  {validation.distance.toFixed(1)} LY
                </span>
              </div>
              <div className="jump-info-row">
                <span className="label">Fuel Cost:</span>
                <span className="value">
                  {Math.round(validation.fuelCost)}%
                </span>
              </div>
              <div className="jump-info-row">
                <span className="label">Jump Time:</span>
                <span className="value">
                  {validation.jumpTime} day
                  {validation.jumpTime !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

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
      </>
    );
  }

  // If viewing current system, show system info with connected systems
  const connectedSystemIds =
    gameStateManager.navigationSystem.getConnectedSystems(currentSystemId);
  const connectedSystems = connectedSystemIds
    .map((id) => {
      const system = starData.find((s) => s.id === id);
      if (!system) return null;

      const distance =
        gameStateManager.navigationSystem.calculateDistanceBetween(
          currentSystem,
          system
        );
      const fuelCost =
        gameStateManager.navigationSystem.calculateFuelCost(distance);
      const jumpTime =
        gameStateManager.navigationSystem.calculateJumpTime(distance);

      return {
        ...system,
        distance,
        fuelCost,
        jumpTime,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);

  // Check for active economic event (if Advanced Sensors installed)
  const hasAdvancedSensors = upgrades.includes('advanced_sensors');
  let activeEvent = null;
  let eventType = null;

  if (hasAdvancedSensors) {
    activeEvent = gameStateManager.getActiveEventForSystem(currentSystemId);
    if (activeEvent) {
      eventType = gameStateManager.getEventType(activeEvent.type);
    }
  }

  return (
    <div className="system-panel">
      <div className="system-panel-header">
        <h3>{viewingSystem.name}</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="system-panel-content">
        {/* System Details */}
        <div className="system-details">
          <div className="system-property">
            <span className="label">Spectral Class:</span>
            <span className="value">{viewingSystem.type}</span>
          </div>
          <div className="system-property">
            <span className="label">Wormholes:</span>
            <span className="value">{viewingSystem.wh}</span>
          </div>
          <div className="system-property">
            <span className="label">Distance from Sol:</span>
            <span className="value">
              {calculateDistanceFromSol(viewingSystem).toFixed(1)} LY
            </span>
          </div>
          <div className="system-property">
            <span className="label">Security Level:</span>
            <span className={`value danger-${dangerZone}`}>
              {dangerZone.charAt(0).toUpperCase() + dangerZone.slice(1)}
            </span>
          </div>
          <div className="system-property">
            <span className="label">Status:</span>
            <span className="value">
              {viewingSystem.st > 0 ? 'Station Available' : 'No Station'}
            </span>
          </div>
        </div>

        {/* Economic Event Info (if Advanced Sensors installed) */}
        {hasAdvancedSensors && activeEvent && eventType && (
          <div className="system-event-info">
            <div className="event-indicator">
              <span className="event-icon">📊</span>
              <span className="event-name">{eventType.name}</span>
            </div>
            <div className="event-description">{eventType.description}</div>
          </div>
        )}

        {/* Connected Systems */}
        <div className="connected-systems">
          {connectedSystems.length === 0 ? (
            <p className="no-connections">No wormhole connections</p>
          ) : (
            <div className="connections-list">
              {connectedSystems.map((system) => (
                <button
                  key={system.id}
                  className="connection-item"
                  onClick={() => {
                    if (selectStarById) {
                      selectStarById(system.id);
                    }
                  }}
                >
                  <div className="connection-name">{system.name}</div>
                  <div className="connection-details">
                    {system.distance.toFixed(1)} LY •{' '}
                    {system.fuelCost.toFixed(1)}% fuel • {system.jumpTime}d
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
