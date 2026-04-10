import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants.js';

/**
 * ShipStatus component displays ship name, fuel, condition bars, and cargo.
 *
 * Uses the Bridge Pattern to subscribe to GameCoordinator events:
 * - shipNameChanged: Updates when ship name changes
 * - fuelChanged: Updates when ship fuel changes
 * - shipConditionChanged: Updates when ship condition changes
 * - cargoChanged: Updates when cargo changes
 * - cargoCapacityChanged: Updates when cargo capacity changes (upgrades)
 *
 * React Migration Spec: Requirements 7.4, 24.6
 */
export function ShipStatus() {
  const shipName = useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED);
  const fuel = useGameEvent(EVENT_NAMES.FUEL_CHANGED);
  const fuelCapacity = useGameEvent(EVENT_NAMES.FUEL_CAPACITY_CHANGED);
  const condition = useGameEvent(EVENT_NAMES.SHIP_CONDITION_CHANGED);
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED);
  const cargoCapacity = useGameEvent(EVENT_NAMES.CARGO_CAPACITY_CHANGED);
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);

  // Null safety: Handle corrupted save data gracefully by providing defaults
  const safeFuelCapacity = fuelCapacity ?? 100;
  const safeFuel = Math.round(
    ((fuel ?? safeFuelCapacity) / safeFuelCapacity) * 100
  );
  const safeCondition = {
    hull: condition?.hull ?? 100,
    engine: condition?.engine ?? 100,
    lifeSupport: condition?.lifeSupport ?? 100,
  };
  const safeCargo = cargo ?? [];
  const safeCargoCapacity = cargoCapacity ?? 50;

  // Bridge Pattern: Trust the events to provide correct data
  // Component will re-render when events fire, consistent with other HUD components
  const tradeCargoUsed = safeCargo.reduce((sum, stack) => sum + stack.qty, 0);

  const passengerSpace = useMemo(() => {
    if (!missions || !missions.active) return 0;
    return missions.active
      .filter((m) => m.type === 'passenger' && m.requirements?.cargoSpace)
      .reduce((sum, m) => sum + m.requirements.cargoSpace, 0);
  }, [missions]);

  const cargoUsed = tradeCargoUsed + passengerSpace;

  return (
    <div className="hud-section hud-ship">
      <div className="hud-row hud-ship-name-row">
        <span id="hud-ship-name" className="hud-ship-name">
          {shipName}
        </span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Fuel:</span>
        <div
          className="fuel-bar-container condition-bar-container"
          role="meter"
          aria-label="Fuel"
          aria-valuenow={Math.round(safeFuel)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="fuel-bar condition-bar"
            style={{ width: `${safeFuel}%` }}
          />
          <span className="condition-text">{Math.round(safeFuel)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Hull:</span>
        <div
          className="hull-bar-container condition-bar-container"
          role="meter"
          aria-label="Hull"
          aria-valuenow={Math.round(safeCondition.hull)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="hull-bar condition-bar"
            style={{ width: `${safeCondition.hull}%` }}
          />
          <span className="condition-text">
            {Math.round(safeCondition.hull)}%
          </span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Engine:</span>
        <div
          className="engine-bar-container condition-bar-container"
          role="meter"
          aria-label="Engine"
          aria-valuenow={Math.round(safeCondition.engine)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="engine-bar condition-bar"
            style={{ width: `${safeCondition.engine}%` }}
          />
          <span className="condition-text">
            {Math.round(safeCondition.engine)}%
          </span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Life Sup:</span>
        <div
          className="life-support-bar-container condition-bar-container"
          role="meter"
          aria-label="Life support"
          aria-valuenow={Math.round(safeCondition.lifeSupport)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="life-support-bar condition-bar"
            style={{ width: `${safeCondition.lifeSupport}%` }}
          />
          <span className="condition-text">
            {Math.round(safeCondition.lifeSupport)}%
          </span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Cargo:</span>
        <span id="hud-cargo" className="hud-value">
          {cargoUsed}/{safeCargoCapacity}
        </span>
      </div>
    </div>
  );
}
