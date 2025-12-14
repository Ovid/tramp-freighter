import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { STAR_DATA } from '../../game/data/star-data';

/**
 * Station menu component.
 *
 * Displays station information and action buttons when docked.
 * Provides access to Trade, Refuel, Repairs, Info Broker, Upgrades,
 * Cargo Manifest, Ship Status, and Undock actions.
 *
 * React Migration Spec: Requirements 9.3
 *
 * @param {Function} onOpenPanel - Callback to open a specific panel
 * @param {Function} onUndock - Callback to undock from station
 */
export function StationMenu({ onOpenPanel, onUndock }) {
  const gameStateManager = useGameState();
  const currentSystemId = useGameEvent('locationChanged');

  // Get current system data
  const system = STAR_DATA.find((s) => s.id === currentSystemId);

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Calculate distance from Sol
  const sol = STAR_DATA.find((s) => s.name === 'Sol');
  const dx = system.x - sol.x;
  const dy = system.y - sol.y;
  const dz = system.z - sol.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) / 10;

  return (
    <div id="station-interface" className="visible">
      <button className="close-btn" onClick={onUndock}>
        ×
      </button>
      <h2>{system.name} Station</h2>
      <div className="station-info">
        <div className="info-row">
          <span className="label">System:</span>
          <span>{system.name}</span>
        </div>
        <div className="info-row">
          <span className="label">Distance from Sol:</span>
          <span>{distance.toFixed(1)} LY</span>
        </div>
      </div>
      <div className="station-actions">
        <button className="station-btn" onClick={() => onOpenPanel('trade')}>
          Trade
        </button>
        <button className="station-btn" onClick={() => onOpenPanel('refuel')}>
          Refuel
        </button>
        <button className="station-btn" onClick={() => onOpenPanel('repair')}>
          Repairs
        </button>
        <button
          className="station-btn"
          onClick={() => onOpenPanel('info-broker')}
        >
          Info Broker
        </button>
        <button className="station-btn" onClick={() => onOpenPanel('upgrades')}>
          Upgrades
        </button>
        <button
          className="station-btn"
          onClick={() => onOpenPanel('cargo-manifest')}
        >
          Cargo Manifest
        </button>
        <button
          className="station-btn"
          onClick={() => onOpenPanel('ship-status')}
        >
          Ship Status
        </button>
        <button className="station-btn" onClick={onUndock}>
          Undock
        </button>
      </div>
    </div>
  );
}
