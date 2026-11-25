import { useState, useEffect, useId, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { useStarData } from '../../hooks/useStarData';
import { useStarmap } from '../../context/StarmapContext';
import { useDangerZone } from '../../hooks/useDangerZone';
import { useJumpValidation } from '../../hooks/useJumpValidation';
import { restoreFocus } from '../../hooks/useFocusTrap';
import { DangerWarningDialog } from '../danger/DangerWarningDialog';
import { Modal } from '../../components/Modal';
import { getCompanions, starKind } from '../../game/utils/star-systems';
import { calculateDistanceFromSol, EVENT_NAMES } from '../../game/constants';

/** Lists every star in a multi-star system; renders nothing for a lone star. */
function SystemStars({ star, starData }) {
  const companions = getCompanions(starData, star.id);
  if (companions.length === 0) return null;
  return (
    <div className="system-property system-stars">
      <span className="label">Stars:</span>
      <ul className="value">
        {[star, ...companions].map((s) => (
          <li
            key={s.id}
          >{`${s.starName ?? s.name}: ${s.type}, ${starKind(s.type)}`}</li>
        ))}
      </ul>
    </div>
  );
}

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
  const game = useGame();
  const starData = useStarData();
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const upgrades = useGameEvent(EVENT_NAMES.UPGRADES_CHANGED);
  const quirks = useGameEvent(EVENT_NAMES.QUIRKS_CHANGED) ?? [];
  const shipCondition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const { executeJump } = useGameAction();
  const { selectStarById } = useStarmap();
  const dangerZone = useDangerZone(viewingSystemId);
  const currentDay = useGameEvent(EVENT_NAMES.TIME_CHANGED) ?? 0;
  useGameEvent(EVENT_NAMES.ACTIVE_EVENTS_CHANGED);
  const preferences = useGameEvent(EVENT_NAMES.PREFERENCES_CHANGED);
  const jumpWarningsEnabled = preferences?.jumpWarningsEnabled ?? true;
  const headingId = useId();
  const headingRef = useRef(null);

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

  // Runs before the heading-focus effect below, so it records the opener.
  useEffect(() => {
    const opener = document.activeElement;
    return () => restoreFocus(opener);
  }, []);

  // Picking a connected system replaces the button that had focus, which would
  // drop keyboard users to <body>. Leave canvas focus alone so arrow-key
  // rotation keeps working after a mouse pick.
  useEffect(() => {
    if (document.activeElement?.closest('.starmap-container')) return;
    headingRef.current?.focus();
  }, [viewingSystemId]);

  // Get system data
  const viewingSystem = starData.find((s) => s.id === viewingSystemId);
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!viewingSystem || !currentSystem) {
    return null;
  }

  const isCurrentSystem = viewingSystemId === currentSystemId;

  const handleJump = async () => {
    if (!validation.valid) return;

    // Check if this is a dangerous system that requires warning
    const isDangerous =
      dangerZone === 'contested' || dangerZone === 'dangerous';

    if (isDangerous && jumpWarningsEnabled) {
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

  // The root keeps the same shape in both views so React updates it in place
  // rather than remounting it when the player switches systems.
  return (
    <>
      {!isCurrentSystem && showDangerWarning && (
        <DangerWarningDialog
          destinationSystemId={viewingSystemId}
          destinationSystemName={viewingSystem.name}
          onProceed={handleDangerWarningProceed}
          onCancel={handleDangerWarningCancel}
        />
      )}
      {!isCurrentSystem && (
        <Modal
          isOpen={showCriticalDamageModal}
          onClose={() => setShowCriticalDamageModal(false)}
          title="Ship Damaged"
          showCloseButton={false}
        >
          <p>{validation.error}</p>
          <p>Dock at a station for repairs before attempting a jump.</p>
          <button
            className="modal-btn"
            onClick={() => setShowCriticalDamageModal(false)}
          >
            Understood
          </button>
        </Modal>
      )}
      <section className="system-panel" data-panel aria-labelledby={headingId}>
        <div className="system-panel-header">
          <h2 id={headingId} ref={headingRef} tabIndex={-1}>
            {viewingSystem.name}
          </h2>
          <button
            className="close-btn"
            onClick={() => onClose()}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="system-panel-content">
          <SystemDetails
            system={viewingSystem}
            starData={starData}
            dangerZone={dangerZone}
          />
          {isCurrentSystem ? (
            <ConnectedSystems
              game={game}
              currentSystem={currentSystem}
              starData={starData}
              shipCondition={shipCondition}
              quirks={quirks}
              upgrades={upgrades}
              currentDay={currentDay}
              selectStarById={selectStarById}
            />
          ) : (
            <JumpSection validation={validation} onJump={handleJump} />
          )}
        </div>
      </section>
    </>
  );
}

function SystemDetails({ system, starData, dangerZone }) {
  return (
    <div className="system-details">
      <div className="system-property">
        <span className="label">Spectral Class:</span>
        <span className="value">{system.type}</span>
      </div>
      <SystemStars star={system} starData={starData} />
      <div className="system-property">
        <span className="label">Wormholes:</span>
        <span className="value">{system.wh}</span>
      </div>
      <div className="system-property">
        <span className="label">Distance from Sol:</span>
        <span className="value">
          {calculateDistanceFromSol(system).toFixed(1)} LY
        </span>
      </div>
      <div className="system-property">
        <span className="label">Security Level:</span>
        <span className={`value danger-${dangerZone}`}>
          {dangerZone.charAt(0).toUpperCase() + dangerZone.slice(1)}
        </span>
      </div>
      <div className="system-property">
        <span className="label">Station:</span>
        <span className="value">{system.st > 0 ? 'Available' : 'None'}</span>
      </div>
      <div className="system-property">
        <span className="label">Network:</span>
        <span className="value">
          {system.r === 1
            ? 'On the wormhole network'
            : 'Off the wormhole network'}
        </span>
      </div>
    </div>
  );
}

function JumpSection({ validation, onJump }) {
  const errorId = useId();
  return (
    <>
      <div className="system-divider"></div>

      {/* Validation returns zero placeholders when unconnected; showing them reads as a free jump */}
      {validation.reason !== 'no_connection' && (
        <div className="jump-information">
          <div className="jump-info-row">
            <span className="label">Jump Distance:</span>
            <span className="value">{validation.distance.toFixed(1)} LY</span>
          </div>
          <div className="jump-info-row">
            <span className="label">Fuel Cost:</span>
            <span className="value">{Math.round(validation.fuelCost)}%</span>
          </div>
          <div className="jump-info-row">
            <span className="label">Jump Time:</span>
            <span className="value">
              {validation.jumpTime} day
              {validation.jumpTime !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {!validation.valid && (
        <div id={errorId} className="validation-message error" role="alert">
          {validation.error}
        </div>
      )}

      <button
        className="jump-btn"
        onClick={onJump}
        disabled={!validation.valid}
        aria-describedby={validation.valid ? undefined : errorId}
      >
        Jump to System
      </button>
    </>
  );
}

function ConnectedSystems({
  game,
  currentSystem,
  starData,
  shipCondition,
  quirks,
  upgrades,
  currentDay,
  selectStarById,
}) {
  const capabilities = game.calculateShipCapabilities();
  const engineCondition = shipCondition?.engine ?? 100;
  const hasAdvancedSensors = upgrades.includes('advanced_sensors');
  const idPrefix = useId();

  const connectedSystems = game.navigationSystem
    .getConnectedSystems(currentSystem.id)
    .map((id) => {
      const system = starData.find((s) => s.id === id);
      if (!system) return null;

      const distance = game.navigationSystem.calculateDistanceBetween(
        currentSystem,
        system
      );
      const fuelCost = game.navigationSystem.calculateFuelCostWithCondition(
        distance,
        engineCondition,
        game.applyQuirkModifiers.bind(game),
        quirks,
        capabilities.fuelConsumption
      );
      const jumpTime = game.navigationSystem.calculateJumpTimeWithCondition(
        distance,
        engineCondition
      );

      return {
        ...system,
        distance,
        fuelCost,
        jumpTime,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="connected-systems">
      {connectedSystems.length === 0 ? (
        <p className="no-connections">No wormhole connections</p>
      ) : (
        <div className="connections-list">
          {connectedSystems.map((system) => {
            let destinationEvent = null;
            let destinationEventType = null;
            if (hasAdvancedSensors) {
              destinationEvent = game.getActiveEventForSystem(system.id);
              if (destinationEvent) {
                destinationEventType = game.getEventType(destinationEvent.type);
              }
            }
            const daysRemaining = destinationEvent
              ? destinationEvent.endDay - currentDay
              : 0;

            const days = `${system.jumpTime} day${system.jumpTime !== 1 ? 's' : ''}`;
            const fuelPercent = Math.round(system.fuelCost);
            const hasEvent = destinationEventType && daysRemaining >= 0;
            const ids = `${idPrefix}-${system.id}`;

            // Name the button by system only; the stats and any event become
            // its description so each Tab doesn't read a paragraph.
            return (
              <button
                key={system.id}
                className="connection-item"
                aria-labelledby={`${ids}-name`}
                aria-describedby={
                  hasEvent ? `${ids}-details ${ids}-event` : `${ids}-details`
                }
                onClick={() => {
                  if (selectStarById) {
                    selectStarById(system.id);
                  }
                }}
              >
                <span id={`${ids}-name`} className="connection-name">
                  {system.name}
                </span>
                <span className="connection-details" aria-hidden="true">
                  {system.distance.toFixed(1)} LY • {fuelPercent}% fuel • {days}
                </span>
                <span id={`${ids}-details`} hidden>
                  {`${system.distance.toFixed(1)} light-years, ${fuelPercent}% fuel, ${days}`}
                </span>
                {hasEvent && (
                  <span
                    id={`${ids}-event`}
                    className="system-event-info destination-event"
                  >
                    <span className="event-indicator">
                      <span className="event-icon" aria-hidden="true">
                        📊
                      </span>
                      <span className="event-name">
                        {destinationEventType.name} at {system.name}
                      </span>
                    </span>
                    <span className="event-description">
                      {destinationEventType.description}
                    </span>
                    <span className="event-time-remaining">
                      {daysRemaining === 0
                        ? 'Final day'
                        : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
