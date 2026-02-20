import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';

/**
 * ShipStatus component displays ship name, fuel, condition bars, and cargo.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - shipNameChanged: Updates when ship name changes
 * - fuelChanged: Updates when ship fuel changes
 * - shipConditionChanged: Updates when ship condition changes
 * - cargoChanged: Updates when cargo changes
 * - cargoCapacityChanged: Updates when cargo capacity changes (upgrades)
 *
 * React Migration Spec: Requirements 7.4, 24.6
 */
export function ShipStatus() {
  const shipName = useGameEvent('shipNameChanged');
  const fuel = useGameEvent('fuelChanged');
  const condition = useGameEvent('shipConditionChanged');
  const cargo = useGameEvent('cargoChanged');
  const cargoCapacity = useGameEvent('cargoCapacityChanged');
  const missions = useGameEvent('missionsChanged');

  // Null safety: Handle corrupted save data gracefully by providing defaults
  const safeFuel = fuel ?? 100;
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
        <div className="fuel-bar-container condition-bar-container">
          <div
            className="fuel-bar condition-bar"
            style={{ width: `${safeFuel}%` }}
          />
          <span className="condition-text">{safeFuel.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Hull:</span>
        <div className="hull-bar-container condition-bar-container">
          <div
            className="hull-bar condition-bar"
            style={{ width: `${safeCondition.hull}%` }}
          />
          <span className="condition-text">
            {safeCondition.hull.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Engine:</span>
        <div className="engine-bar-container condition-bar-container">
          <div
            className="engine-bar condition-bar"
            style={{ width: `${safeCondition.engine}%` }}
          />
          <span className="condition-text">
            {safeCondition.engine.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Life Support:</span>
        <div className="life-support-bar-container condition-bar-container">
          <div
            className="life-support-bar condition-bar"
            style={{ width: `${safeCondition.lifeSupport}%` }}
          />
          <span className="condition-text">
            {safeCondition.lifeSupport.toFixed(1)}%
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
