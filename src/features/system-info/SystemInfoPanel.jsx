import { useMemo } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useStarData } from '../../hooks/useStarData';
import { formatCoordinate } from '../../game/utils/string-utils';

/**
 * SystemInfoPanel displays information about the current system.
 *
 * Shows:
 * - System name, coordinates, spectral class
 * - Wormhole count and station availability
 * - Connected systems with distance and fuel cost
 * - Economic event information (if Advanced Sensors installed)
 *
 * @param {Function} onClose - Callback to close the panel
 */
export function SystemInfoPanel({ onClose }) {
  const gameStateManager = useGameState();
  const starData = useStarData();
  const currentSystemId = useGameEvent('locationChanged');
  const upgrades = useGameEvent('upgradesChanged');

  // Get current system data
  const currentSystem = starData.find((s) => s.id === currentSystemId);

  // Get connected systems (memoized to avoid recalculation on every render)
  const connectedSystems = useMemo(() => {
    if (!currentSystem) return [];

    const connectedSystemIds =
      gameStateManager.navigationSystem.getConnectedSystems(currentSystemId);

    return connectedSystemIds
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
  }, [currentSystem, currentSystemId, gameStateManager, starData]);

  if (!currentSystem) {
    return (
      <div className="system-info-panel">
        <div className="panel-header">
          <h2>System Information</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="panel-content">
          <p>Error: Current system not found</p>
        </div>
      </div>
    );
  }

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
    <div className="system-info-panel">
      <div className="panel-header">
        <h2>System Information</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="panel-content">
        {/* System Details */}
        <div className="system-details">
          <h3>{currentSystem.name}</h3>
          <div className="system-property">
            <span className="label">Coordinates:</span>
            <span className="value">
              {formatCoordinate(currentSystem.x)},{' '}
              {formatCoordinate(currentSystem.y)},{' '}
              {formatCoordinate(currentSystem.z)}
            </span>
          </div>
          <div className="system-property">
            <span className="label">Spectral Class:</span>
            <span className="value">{currentSystem.type}</span>
          </div>
          <div className="system-property">
            <span className="label">Wormholes:</span>
            <span className="value">{currentSystem.wh}</span>
          </div>
          <div className="system-property">
            <span className="label">Status:</span>
            <span className="value">
              {currentSystem.st > 0 ? 'Station Available' : 'No Station'}
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
          <h4>Connected Systems:</h4>
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
      </div>
    </div>
  );
}
