import { useGameEvent } from '../../hooks/useGameEvent';
import { STAR_DATA } from '../../game/data/star-data';
import { calculateDistanceFromSol } from './hudUtils';

/**
 * LocationDisplay component displays current system and distance from Sol.
 *
 * Uses the Bridge Pattern to subscribe to GameStateManager events:
 * - locationChanged: Updates when player location changes
 *
 * React Migration Spec: Requirements 7.1, 7.2, 24.4
 */
export function LocationDisplay() {
  const currentSystemId = useGameEvent('locationChanged');

  // Get current system data
  const system = STAR_DATA.find((s) => s.id === currentSystemId);

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Calculate distance from Sol
  const distance = calculateDistanceFromSol(system);

  return (
    <div className="hud-section hud-location">
      <div className="hud-row">
        <span className="hud-label">System:</span>
        <span id="hud-system" className="hud-value">
          {system.name}
        </span>
      </div>
      <div className="hud-row">
        <span className="hud-label">Distance from Sol:</span>
        <span id="hud-distance" className="hud-value">
          {distance.toFixed(1)} LY
        </span>
      </div>
    </div>
  );
}
