import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { useTradeActions } from './useTradeActions.js';
import { useNavigationActions } from './useNavigationActions.js';
import { useShipActions } from './useShipActions.js';
import { useNPCActions } from './useNPCActions.js';
import { useMissionActions } from './useMissionActions.js';
import { useQuestActions } from './useQuestActions.js';
import { useDebtActions } from './useDebtActions.js';

/**
 * Custom hook for triggering game actions through GameCoordinator.
 *
 * This hook composes domain-specific action hooks and adds remaining
 * general-purpose actions. It provides backward compatibility — all
 * previously available methods are still returned.
 *
 * For new code, prefer importing the domain-specific hooks directly
 * (useTradeActions, useNavigationActions, etc.) to get a narrower API.
 *
 * @returns {Object} Object containing all action methods
 *
 * @example
 * function TradePanel() {
 *   const { buyGood, sellGood } = useGameAction();
 *
 *   const handleBuy = () => {
 *     buyGood('electronics', 10, 150);
 *   };
 *
 *   return <button onClick={handleBuy}>Buy Electronics</button>;
 * }
 */
export function useGameAction() {
  const trade = useTradeActions();
  const navigation = useNavigationActions();
  const ship = useShipActions();
  const npc = useNPCActions();
  const missions = useMissionActions();
  const quests = useQuestActions();
  const debt = useDebtActions();
  const game = useGame();

  return useMemo(
    () => ({
      ...trade,
      ...navigation,
      ...ship,
      ...npc,
      ...missions,
      ...quests,
      ...debt,

      /** Dock at current system's station */
      dock: () => game.dock(),

      /** Undock from current system's station */
      undock: () => game.undock(),

      /** Save the game */
      saveGame: () => game.saveGame(),

      /** Start a new game */
      newGame: () => game.initNewGame(),

      /** Update player credits */
      updateCredits: (newCredits) => game.updateCredits(newCredits),
    }),
    [trade, navigation, ship, npc, missions, quests, debt, game]
  );
}
