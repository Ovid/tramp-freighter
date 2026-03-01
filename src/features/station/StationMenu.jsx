import { useMemo } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameState } from '../../context/GameContext';
import { useGameAction } from '../../hooks/useGameAction';
import { EVENT_NAMES } from '../../game/constants.js';
import { STAR_DATA } from '../../game/data/star-data';
import { calculateDistanceFromSol } from '../../game/constants';
import { getNPCsAtSystem } from '../../game/game-npcs';
import { Modal } from '../../components/Modal';

/**
 * Station menu component.
 *
 * Displays station information and action buttons when docked.
 * Provides access to Trade, Refuel, Repairs, Info Broker, Upgrades,
 * Cargo Manifest, and Ship Status actions.
 * Shows NPCs present at the current station in a "PEOPLE" section.
 *
 * React Migration Spec: Requirements 9.3
 * NPC Foundation Spec: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * @param {Function} onOpenPanel - Callback to open a specific panel
 * @param {Function} onUndock - Callback to undock from station
 */
export function StationMenu({ onOpenPanel, onUndock }) {
  const currentSystemId = useGameEvent(EVENT_NAMES.LOCATION_CHANGED);
  const gameStateManager = useGameState();
  const { getNarrativeFlags, dismissMissionFailureNotice } = useGameAction();
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  const pendingNotices = missions?.pendingFailureNotices ?? [];
  const currentNotice = pendingNotices[0] ?? null;

  // Get current system data
  const system = STAR_DATA.find((s) => s.id === currentSystemId);

  if (!system) {
    throw new Error(
      `Invalid game state: current system ID ${currentSystemId} not found in star data`
    );
  }

  // Calculate distance from Sol
  const distance = calculateDistanceFromSol(system);

  // Get NPCs at current system (pass narrative flags to resolve quest-revealed NPCs)
  const npcsAtSystem = getNPCsAtSystem(currentSystemId, getNarrativeFlags());

  // Handle NPC selection to open dialogue
  const handleNPCClick = (npcId) => {
    onOpenPanel('dialogue', npcId);
  };

  // Compute NPC display info using Bridge Pattern
  // This memoized computation updates when location changes (via currentSystemId dependency)
  // and provides the NPC display data without direct GameStateManager method calls
  const npcDisplayData = useMemo(() => {
    return npcsAtSystem.map((npc) => {
      // Access NPC state through GameStateManager (this is acceptable in useMemo)
      // since it's computed once per location change, not on every render
      const npcState = gameStateManager.getNPCState(npc.id);
      const currentRep = npcState.rep;
      const tier = gameStateManager.getRepTier(currentRep);

      return {
        id: npc.id,
        name: npc.name,
        role: npc.role,
        tierName: tier.name,
      };
    });
  }, [npcsAtSystem, gameStateManager]);

  return (
    <div id="station-interface" className="visible">
      <button className="close-btn" onClick={onUndock} aria-label="Close">
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
            {npcDisplayData.map((npcDisplay) => (
              <button
                key={npcDisplay.id}
                className="npc-btn"
                onClick={() => handleNPCClick(npcDisplay.id)}
              >
                <span className="npc-name">{npcDisplay.name}</span>
                <span className="npc-role">{npcDisplay.role}</span>
                <span
                  className={`npc-tier tier-${npcDisplay.tierName.toLowerCase()}`}
                >
                  {npcDisplay.tierName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="station-actions">
        <button
          className="station-btn"
          onClick={() => onOpenPanel('mission-board')}
        >
          Mission Board
        </button>
        <button className="station-btn" onClick={() => onOpenPanel('finance')}>
          Finance
        </button>
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
      </div>
      <Modal
        isOpen={currentNotice !== null}
        onClose={() => dismissMissionFailureNotice(currentNotice?.id)}
        title="Mission Failed"
        showCloseButton={true}
      >
        <p>
          {currentNotice?.title}
          {currentNotice?.destination
            ? ` — delivery to ${currentNotice.destination} was not completed in time.`
            : ' — the deadline has passed.'}
        </p>
        <p>The contact won&apos;t be working with you again.</p>
      </Modal>
    </div>
  );
}
