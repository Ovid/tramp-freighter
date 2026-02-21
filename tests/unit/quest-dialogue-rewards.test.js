import { describe, it, expect } from 'vitest';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

describe('Quest dialogue reward timing', () => {
  describe('completion dialogues claim rewards', () => {
    it('mission_1_complete choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_1_complete;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_2_complete choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_2_complete;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_3_complete choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_3_complete;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_5_accepted choices have claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_5_accepted;
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });

    it('mission_4_complete node exists with claimStageRewards action', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_4_complete;
      expect(node).toBeDefined();
      for (const choice of node.choices) {
        expect(choice.action).toBeTypeOf('function');
      }
    });
  });

  describe('Design Note 1: mission_3_complete routes to greeting', () => {
    it('all mission_3_complete choices route to greeting, not mission_4_offer', () => {
      const node = YUKI_TANAKA_DIALOGUE.mission_3_complete;
      for (const choice of node.choices) {
        expect(choice.next).toBe('greeting');
      }
    });
  });

  describe('Design Note 2: completion choices hide after rewards claimed', () => {
    const completionChoiceTexts = [
      '"The field test is complete."',
      '"I have all five exotic material samples."',
      '"The prototype test went well."',
    ];

    it('completion greeting choices have condition checking hasClaimedStageRewards', () => {
      const greetingChoices = YUKI_TANAKA_DIALOGUE.greeting.choices;
      for (const text of completionChoiceTexts) {
        const choice = greetingChoices.find((c) => c.text === text);
        expect(choice, `choice "${text}" should exist`).toBeDefined();
        expect(
          choice.condition,
          `choice "${text}" should have a condition`
        ).toBeTypeOf('function');

        // Condition should return false when hasClaimedStageRewards returns true
        const mockGSM = {
          getQuestStage: () => {
            if (text.includes('field test')) return 1;
            if (text.includes('exotic material')) return 2;
            if (text.includes('prototype')) return 3;
            return 0;
          },
          checkQuestObjectives: () => true,
          hasClaimedStageRewards: () => true,
        };
        expect(
          choice.condition(50, mockGSM),
          `choice "${text}" should be hidden after rewards claimed`
        ).toBe(false);
      }
    });

    it('mission_4_complete greeting choice exists', () => {
      const greetingChoices = YUKI_TANAKA_DIALOGUE.greeting.choices;
      const choice = greetingChoices.find((c) =>
        c.text.includes('delivered the message')
      );
      expect(choice).toBeDefined();
      expect(choice.next).toBe('mission_4_complete');
    });
  });
});
