import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing mission-related game actions.
 *
 * @returns {Object} Mission action methods
 */
export function useMissionActions() {
  const game = useGame();

  return useMemo(
    () => ({
      acceptMission: (mission) => game.acceptMission(mission),
      completeMission: (missionId) => game.completeMission(missionId),
      abandonMission: (missionId) => game.abandonMission(missionId),
      refreshMissionBoard: () => game.refreshMissionBoard(),
      getActiveMissions: () => game.getActiveMissions(),
      getCompletableMissions: () => game.getCompletableMissions(),
      updatePassengerSatisfaction: (missionId, event) =>
        game.updatePassengerSatisfaction(missionId, event),
      dismissMissionFailureNotice: (missionId) =>
        game.dismissMissionFailureNotice(missionId),
    }),
    [game]
  );
}
