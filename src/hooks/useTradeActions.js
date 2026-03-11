import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing trade-related game actions.
 *
 * @returns {Object} Trade action methods
 */
export function useTradeActions() {
  const game = useGame();

  return useMemo(
    () => ({
      buyGood: (goodType, quantity, price) =>
        game.buyGood(goodType, quantity, price),
      sellGood: (stackIndex, quantity, salePrice) =>
        game.sellGood(stackIndex, quantity, salePrice),
      getCurrentSystemPrices: () => game.getCurrentSystemPrices(),
      recordVisitedPrices: () => game.recordVisitedPrices(),
      calculateTradeWithholding: (amount) =>
        game.calculateTradeWithholding(amount),
    }),
    [game]
  );
}
