import { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { STAR_DATA } from '../../game/data/star-data';
import { getNPCsAtSystem } from '../../game/game-npcs';
import { ENDGAME_CONFIG } from '../../game/constants';

export function PostCreditsStation({ onOpenPanel, onReturnToTitle }) {
  const game = useGame();
  const systemId = ENDGAME_CONFIG.DELTA_PAVONIS_ID;
  const system = STAR_DATA.find((s) => s.id === systemId);

  const npcsAtSystem = getNPCsAtSystem(systemId, { post_credits: true });

  const npcDisplayData = useMemo(() => {
    return npcsAtSystem.map((npc) => {
      const npcState = game.getNPCState(npc.id);
      const tier = game.getRepTier(npcState.rep);
      return {
        id: npc.id,
        name: npc.name,
        role: npc.role,
        tierName: tier.name,
      };
    });
  }, [npcsAtSystem, game]);

  return (
    <div id="station-interface" className="visible">
      <h2>{system?.name || 'Delta Pavonis'} Colony</h2>
      <div className="station-info">
        <div className="info-row">
          <span className="label">System:</span>
          <span>{system?.name || 'Delta Pavonis'}</span>
        </div>
      </div>

      {npcsAtSystem.length > 0 && (
        <div className="station-people">
          <h3>PEOPLE</h3>
          <div className="npc-list">
            {npcDisplayData.map((npcDisplay) => (
              <button
                key={npcDisplay.id}
                className="npc-btn"
                onClick={() => onOpenPanel('dialogue', npcDisplay.id)}
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
        <button className="station-btn" onClick={onReturnToTitle}>
          Return to Title
        </button>
      </div>
    </div>
  );
}
