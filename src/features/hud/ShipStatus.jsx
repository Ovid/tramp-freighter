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
  const cargo = useGameEvent('cargoChanged');

  // Get state for fallback values when events haven't fired yet
  const state = gameStateManager.getState();
  
  // Use event data with fallback to state data
  const actualCondition = condition || {
    hull: state.ship.hull,
    engine: state.ship.engine,
    lifeSupport: state.ship.lifeSupport,
  };
  
  const actualFuel = fuel !== null && fuel !== undefined ? fuel : state.ship.fuel;
  const actualCargo = cargo || state.ship.cargo;
  const actualShipName = shipName || state.ship.name;

  // Additional defensive checks for null/undefined values
  const hull = actualCondition.hull !== null && actualCondition.hull !== undefined ? actualCondition.hull : 100;
  const engine = actualCondition.engine !== null && actualCondition.engine !== undefined ? actualCondition.engine : 100;
  const lifeSupport = actualCondition.lifeSupport !== null && actualCondition.lifeSupport !== undefined ? actualCondition.lifeSupport : 100;
  const safeFuel = actualFuel !== null && actualFuel !== undefined ? actualFuel : 100;

  // Calculate cargo info from event data
  const cargoUsed = (actualCargo || []).reduce((sum, stack) => sum + stack.qty, 0);
  const ship = gameStateManager.getShip();
  const cargoCapacity = ship.cargoCapacity;

  return (
    <div className="hud-section hud-ship">
      <div className="hud-row hud-ship-name-row">
        <span id="hud-ship-name" className="hud-ship-name">
          {actualShipName}
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
