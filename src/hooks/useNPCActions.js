import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing NPC-related game actions.
 *
 * @returns {Object} NPC action methods
 */
export function useNPCActions() {
  const game = useGame();

  return useMemo(
    () => ({
      canGetFreeRepair: (npcId) => game.canGetFreeRepair(npcId),
      getFreeRepair: (npcId, hullDamagePercent) =>
        game.getFreeRepair(npcId, hullDamagePercent),
      getServiceDiscount: (npcId, serviceType) =>
        game.getServiceDiscount(npcId, serviceType),
      purchaseIntelligence: (systemId, discount) =>
        game.purchaseIntelligence(systemId, discount),
      generateRumor: () => game.generateRumor(),
    }),
    [game]
  );
}
