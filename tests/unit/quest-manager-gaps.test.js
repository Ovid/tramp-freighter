import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('QuestManager coverage gaps', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('advanceQuest edge cases', () => {
    it('returns failure for unknown quest', () => {
      const result = gsm.questManager.advanceQuest('nonexistent_quest');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('returns failure for already completed quest', () => {
      // Find a valid quest ID from the definitions
      const questIds = Object.keys(gsm.questManager.questDefinitions);
      if (questIds.length > 0) {
        const questId = questIds[0];
        const questState = gsm.questManager.getQuestState(questId);
        questState.completedDay = 10;
        const result = gsm.questManager.advanceQuest(questId);
        expect(result.success).toBe(false);
        expect(result.reason).toContain('complete');
      }
    });
  });

  describe('claimStageRewards edge cases', () => {
    it('returns failure for unknown quest', () => {
      const result = gsm.questManager.claimStageRewards('nonexistent');
      expect(result.success).toBe(false);
    });

    it('returns failure for invalid stage', () => {
      const questIds = Object.keys(gsm.questManager.questDefinitions);
      if (questIds.length > 0) {
        const questId = questIds[0];
        const questState = gsm.questManager.getQuestState(questId);
        questState.stage = 999; // Invalid stage
        const result = gsm.questManager.claimStageRewards(questId);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('claimStageRewards reward types', () => {
    it('applies karma rewards', () => {
      const questIds = Object.keys(gsm.questManager.questDefinitions);
      if (questIds.length > 0) {
        const questId = questIds[0];
        const questDef = gsm.questManager.questDefinitions[questId];
        const questState = gsm.questManager.getQuestState(questId);

        // Find a stage with rewards
        const stageWithRewards = questDef.stages.find(
          (s) => s.rewards && s.rewards.karma
        );
        if (stageWithRewards) {
          questState.stage = stageWithRewards.stage;
          questState.data._rewardsClaimedStage = stageWithRewards.stage - 1;
          vi.spyOn(gsm.questManager, 'checkObjectivesComplete').mockReturnValue(
            true
          );
          vi.spyOn(gsm, 'modifyKarma').mockImplementation(() => {});
          gsm.questManager.claimStageRewards(questId);
          expect(gsm.modifyKarma).toHaveBeenCalled();
        }
      }
    });
  });
});
