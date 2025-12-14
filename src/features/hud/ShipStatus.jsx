import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameState } from '../../context/GameContext';

/**
 * ShipStatus component displays ship name, fuel, condition bars, and cargo.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - shipNameChanged: Updates when ship name changes
 * - fuelChanged: Updates when ship fuel changes
 * - shipConditionChanged: Updates when ship condition changes
 * - cargoChanged: Updates when cargo changes
 *
 * React Migration Spec: Requirements 7.4, 24.6
 */
export function ShipStatus() {
  const gameStateManager = useGameState();
  const shipName = useGameEvent('shipNameChanged');
  const fuel = useGameEvent('fuelChanged');
  const condition = useGameEvent('shipConditionChanged');
  useGameEvent('cargoChanged'); // Subscribe to trigger re-render

  const hull = condition.hull;
  const engine = condition.engine;
  const lifeSupport = condition.lifeSupport;

  // Get cargo info from GameStateManager
  const cargoUsed = gameStateManager.getCargoUsed();
  const ship = gameStateManager.getShip();
  const cargoCapacity = ship.cargoCapacity;

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
            style={{ width: `${fuel}%` }}
          />
          <span className="condition-text">{fuel.toFixed(1)}%</span>
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
          {cargoUsed}/{cargoCapacity}
        </span>
      </div>
    </div>
  );
}
