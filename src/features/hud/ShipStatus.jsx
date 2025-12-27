import { useGameEvent } from '../../hooks/useGameEvent';
import { UI_CONFIG } from '../../game/constants';

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

  // Bridge Pattern: Trust the events to provide correct data
  // If events haven't fired yet, component will re-render when they do
  const hull = condition?.hull ?? UI_CONFIG.DEFAULT_VALUES.SHIP_CONDITION;
  const engine = condition?.engine ?? UI_CONFIG.DEFAULT_VALUES.SHIP_CONDITION;
  const lifeSupport =
    condition?.lifeSupport ?? UI_CONFIG.DEFAULT_VALUES.SHIP_CONDITION;
  const currentFuel = fuel ?? UI_CONFIG.DEFAULT_VALUES.FUEL;
  const currentCargo = cargo ?? [];
  const currentShipName = shipName ?? UI_CONFIG.DEFAULT_VALUES.SHIP_NAME;
  const currentCargoCapacity =
    cargoCapacity ?? UI_CONFIG.DEFAULT_VALUES.CARGO_CAPACITY;

  // Calculate cargo info from event data
  const cargoUsed = currentCargo.reduce((sum, stack) => sum + stack.qty, 0);

  return (
    <div className="hud-section hud-ship">
      <div className="hud-row hud-ship-name-row">
        <span id="hud-ship-name" className="hud-ship-name">
          {currentShipName}
        </span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Fuel:</span>
        <div className="fuel-bar-container condition-bar-container">
          <div
            className="fuel-bar condition-bar"
            style={{ width: `${currentFuel}%` }}
          />
          <span className="condition-text">{currentFuel.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Hull:</span>
        <div className="hull-bar-container condition-bar-container">
          <div
            className="hull-bar condition-bar"
            style={{ width: `${hull}%` }}
          />
          <span className="condition-text">{hull.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Engine:</span>
        <div className="engine-bar-container condition-bar-container">
          <div
            className="engine-bar condition-bar"
            style={{ width: `${engine}%` }}
          />
          <span className="condition-text">{engine.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Life Support:</span>
        <div className="life-support-bar-container condition-bar-container">
          <div
            className="life-support-bar condition-bar"
            style={{ width: `${lifeSupport}%` }}
          />
          <span className="condition-text">{lifeSupport.toFixed(1)}%</span>
        </div>
      </div>
      <div className="hud-row">
        <span className="hud-label">Cargo:</span>
        <span id="hud-cargo" className="hud-value">
          {cargoUsed}/{currentCargoCapacity}
        </span>
      </div>
    </div>
  );
}
