import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing debt-related game actions.
 *
 * @returns {Object} Debt action methods
 */
export function useDebtActions() {
  const game = useGame();

  return useMemo(
    () => ({
      getDebtInfo: () => game.getDebtInfo(),
      borrowFromCole: (amount) => game.borrowFromCole(amount),
      makeDebtPayment: (amount) => game.makeDebtPayment(amount),
    }),
    [game]
  );
}
