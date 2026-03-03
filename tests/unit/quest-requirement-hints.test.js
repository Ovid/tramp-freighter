import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { ENDGAME_CONFIG } from '@game/constants.js';
import { buildDialogueContext } from '@game/game-dialogue.js';
import { YUKI_TANAKA_DIALOGUE } from '@game/data/dialogue/tanaka-dialogue.js';
import { TANAKA_QUEST } from '@game/data/quest-definitions.js';

describe('Quest Requirement Hints', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    manager.getState().npcs.tanaka_barnards = {
      rep: 5,
      flags: ['tanaka_met'],
      interactions: 0,
      lastInteraction: null,
    };
  });

  describe('getUnmetRequirements', () => {
    it('should return rep when NPC reputation is below threshold', () => {
      const unmet = manager.getUnmetRequirements('tanaka', 1);
      expect(unmet).toContain('rep');
    });

    it('should return engine when engine condition is below threshold', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_1_REP;
      manager.getState().ship.engine = 50;
      const unmet = manager.getUnmetRequirements('tanaka', 1);
      expect(unmet).toContain('engine');
      expect(unmet).not.toContain('rep');
    });

    it('should return empty array when all requirements are met', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_1_REP;
      manager.getState().ship.engine = ENDGAME_CONFIG.STAGE_1_ENGINE;
      const unmet = manager.getUnmetRequirements('tanaka', 1);
      expect(unmet).toEqual([]);
    });

    it('should return debt when debt is not zero for stage 5', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_5_REP;
      manager.getState().ship.hull = ENDGAME_CONFIG.STAGE_5_HULL;
      manager.getState().ship.engine = ENDGAME_CONFIG.STAGE_5_ENGINE;
      manager.getState().player.credits = ENDGAME_CONFIG.VICTORY_CREDITS;
      const unmet = manager.getUnmetRequirements('tanaka', 5);
      expect(unmet).toContain('debt');
    });

    it('should return credits when credits are insufficient for stage 5', () => {
      manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_5_REP;
      manager.getState().player.debt = 0;
      manager.getState().ship.hull = ENDGAME_CONFIG.STAGE_5_HULL;
      manager.getState().ship.engine = ENDGAME_CONFIG.STAGE_5_ENGINE;
      manager.getState().player.credits = 100;
      const unmet = manager.getUnmetRequirements('tanaka', 5);
      expect(unmet).toContain('credits');
    });
  });
});

describe('Tanaka dialogue hints', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGameStateManager();
    manager.getState().npcs.tanaka_barnards = {
      rep: 5,
      flags: ['tanaka_met'],
      interactions: 0,
      lastInteraction: null,
    };
    manager.questManager.registerQuest(TANAKA_QUEST);
  });

  it('should show engine hint when stage 0 and engine below threshold', () => {
    manager.getState().npcs.tanaka_barnards.rep = ENDGAME_CONFIG.STAGE_1_REP;
    manager.getState().ship.engine = 50;
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    const text = YUKI_TANAKA_DIALOGUE.greeting.text(
      manager.getState().npcs.tanaka_barnards.rep,
      context
    );
    expect(text).toContain('engine');
  });

  it('should show rep hint when stage 0 and rep below threshold', () => {
    manager.getState().npcs.tanaka_barnards.rep = 3;
    const context = buildDialogueContext(manager, 'tanaka_barnards');
    const text = YUKI_TANAKA_DIALOGUE.greeting.text(3, context);
    expect(text).toContain("don't know you well enough");
  });
});
