import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing navigation-related game actions.
 *
 * @returns {Object} Navigation action methods
 */
export function useNavigationActions() {
  const game = useGame();

  return useMemo(
    () => ({
      executeJump: async (targetSystemId) => {
        return await game.navigationSystem.executeJump(
          game,
          targetSystemId,
          game.animationSystem
        );
      },
    }),
    [game]
  );
}
