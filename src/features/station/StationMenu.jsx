import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameState } from '../../context/GameContext';
import { STAR_DATA } from '../../game/data/star-data';
import { calculateDistanceFromSol } from '../hud/hudUtils';
import { getNPCsAtSystem } from '../../game/game-npcs';

/**
 * Station menu component.
 *
 * Displays station information and action buttons when docked.
 * Provides access to Trade, Refuel, Repairs, Info Broker, Upgrades,
 * Cargo Manifest, Ship Status, and Undock actions.
 * Shows NPCs present at the current station in a "PEOPLE" section.
 *
 * React Migration Spec: Requirements 9.3
 * NPC Foundation Spec: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * @param {Function} onOpenPanel - Callback to open a specific panel
 * @param {Function} onUndock - Callback to undock from station
 */
export function StationMenu({ onOpenPanel, onUndock }) {
  const currentSystemId = useGameEvent('locationChanged');
  const gameStateManager = useGameState();

  // Get current system data
  const system = STAR_DATA.find((s) => s.id === currentSystemId);

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Calculate distance from Sol
  const distance = calculateDistanceFromSol(system);

  // Get NPCs at current system
  const npcsAtSystem = getNPCsAtSystem(currentSystemId);

  // Handle NPC selection to open dialogue
  const handleNPCClick = (npcId) => {
    onOpenPanel('dialogue', npcId);
  };

  // Get NPC display info with current reputation tier
  const getNPCDisplayInfo = (npc) => {
    const npcState = gameStateManager.getNPCState(npc.id);
    const currentRep = npcState.rep;
    const tier = gameStateManager.getRepTier(currentRep);
    return {
      name: npc.name,
      role: npc.role,
      tierName: tier.name,
    };
  };

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

      {/* PEOPLE section - only shown when NPCs are present */}
      {npcsAtSystem.length > 0 && (
        <div className="station-people">
          <h3>PEOPLE</h3>
          <div className="npc-list">
            {npcsAtSystem.map((npc) => {
              const displayInfo = getNPCDisplayInfo(npc);
              return (
                <button
                  key={npc.id}
                  className="npc-btn"
                  onClick={() => handleNPCClick(npc.id)}
                >
                  <span className="npc-name">{displayInfo.name}</span>
                  <span className="npc-role">{displayInfo.role}</span>
                  <span
                    className={`npc-tier tier-${displayInfo.tierName.toLowerCase()}`}
                  >
                    {displayInfo.tierName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
