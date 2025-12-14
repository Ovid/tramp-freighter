import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

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
  const currentSystemId = useGameEvent('locationChanged');
  const fuel = useGameEvent('fuelChanged');
  const upgrades = useGameEvent('upgradesChanged');
  const { executeJump } = useGameAction();

  // Get system data
  const starData = gameStateManager.starData;
  const viewingSystem = starData.find((s) => s.id === viewingSystemId);
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  if (!viewingSystem || !currentSystem) {
    return null;
  }

  const isCurrentSystem = viewingSystemId === currentSystemId;

  // If viewing a different system, show jump info
  if (!isCurrentSystem) {
    const validation = gameStateManager.navigationSystem.validateJump(
      currentSystemId,
      viewingSystemId,
      fuel
    );

    const handleJump = async () => {
      if (!validation.valid) return;

      // Close panel and station menu immediately so user can see the jump animation
      onClose();
      if (onJumpStart) {
        onJumpStart();
      }

      try {
        const result = await executeJump(viewingSystemId);
        if (result.success) {
          if (onJumpComplete) {
            onJumpComplete();
          }
        }
      } catch (error) {
        console.error('Jump failed:', error);
      }
    };

    return (
      <div className="system-panel">
        <div className="system-panel-header">
          <h3>{viewingSystem.name}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="system-panel-content">
          {/* System Details */}
          <div className="system-details">
            <div className="system-property">
              <span className="label">Coordinates:</span>
              <span className="value">
                {(viewingSystem.x / 10).toFixed(2)},{' '}
                {(viewingSystem.y / 10).toFixed(2)},{' '}
                {(viewingSystem.z / 10).toFixed(2)}
              </span>
            </div>
            <div className="system-property">
              <span className="label">Spectral Class:</span>
              <span className="value">{viewingSystem.type}</span>
            </div>
            <div className="system-property">
              <span className="label">Wormholes:</span>
              <span className="value">{viewingSystem.wh}</span>
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
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="system-panel-content">
        {/* System Details */}
        <div className="system-details">
          <div className="system-property">
            <span className="label">Coordinates:</span>
            <span className="value">
              {(viewingSystem.x / 10).toFixed(2)},{' '}
              {(viewingSystem.y / 10).toFixed(2)},{' '}
              {(viewingSystem.z / 10).toFixed(2)}
            </span>
          </div>
          <div className="system-property">
            <span className="label">Spectral Class:</span>
            <span className="value">{viewingSystem.type}</span>
          </div>
          <div className="system-property">
            <span className="label">Wormholes:</span>
            <span className="value">{viewingSystem.wh}</span>
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
                    if (window.selectStarById) {
                      window.selectStarById(system.id);
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

        {/* Dock button if station available */}
        {viewingSystem.st > 0 && (
          <button
            className="dock-btn"
            onClick={() => {
              // Dock action will be handled by parent
              if (onClose) onClose();
            }}
          >
            Dock at Station
          </button>
        )}
      </div>
    </div>
  );
}
