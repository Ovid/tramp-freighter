import { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

/**
 * Hook providing quest and narrative game actions.
 *
 * @returns {Object} Quest action methods
 */
export function useQuestActions() {
  const game = useGame();

  return useMemo(
    () => ({
      getQuestStage: (questId) => game.getQuestStage(questId),
      advanceQuest: (questId) => game.advanceQuest(questId),
      isQuestComplete: (questId) => game.isQuestComplete(questId),
      getQuestState: (questId) => game.getQuestState(questId),
      canStartQuestStage: (questId, stage) =>
        game.canStartQuestStage(questId, stage),
      checkQuestObjectives: (questId) => game.checkQuestObjectives(questId),
      getNarrativeFlags: () => game.getNarrativeFlags(),
      getEpilogueData: () => game.getEpilogueData(),
      getEpilogueStats: () => game.getEpilogueStats(),
    }),
    [game]
  );
}
