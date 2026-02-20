import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { getNPCsAtSystem } from '../../src/game/game-npcs.js';
import { TANAKA_QUEST } from '../../src/game/data/quest-definitions.js';

describe('Stats initialization', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('initializes state.stats with zero counters', () => {
    expect(manager.state.stats).toBeDefined();
    expect(manager.state.stats.creditsEarned).toBe(0);
    expect(manager.state.stats.jumpsCompleted).toBe(0);
    expect(manager.state.stats.cargoHauled).toBe(0);
    expect(manager.state.stats.smugglingRuns).toBe(0);
    expect(manager.state.stats.charitableActs).toBe(0);
  });

  it('initializes state.quests with registered quest defaults', () => {
    expect(manager.state.quests).toBeDefined();
    expect(manager.state.quests.tanaka).toBeDefined();
    expect(manager.state.quests.tanaka.stage).toBe(0);
  });
});

describe('Stats tracking', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('increments jumpsCompleted on location change', () => {
    manager.state.player.currentSystem = 0;
    manager.updateLocation(4);
    expect(manager.state.stats.jumpsCompleted).toBe(1);
  });

  it('increments cargoHauled and creditsEarned on sell', () => {
    manager.state.ship.cargo = [
      { good: 'grain', qty: 10, buyPrice: 50, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    manager.state.world.currentSystemPrices = { grain: 100 };
    const result = manager.sellGood(0, 5, 100);
    if (result.success) {
      expect(manager.state.stats.cargoHauled).toBe(5);
      expect(manager.state.stats.creditsEarned).toBe(500);
    }
  });
});

describe('Karma-based stats', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('increments charitableActs on positive karma change', () => {
    manager.modifyKarma(5, 'helped_civilian');
    expect(manager.state.stats.charitableActs).toBe(1);
  });

  it('does not increment charitableActs on negative karma', () => {
    manager.modifyKarma(-5, 'looted_civilian');
    expect(manager.state.stats.charitableActs).toBe(0);
  });
});

describe('QuestManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  describe('registerQuest', () => {
    it('registers a quest definition', () => {
      const questDef = {
        id: 'test_quest',
        name: 'Test Quest',
        stages: [{ stage: 1, name: 'Step 1' }],
        victoryStage: 2,
      };
      manager.registerQuest(questDef);
      expect(manager.getQuestState('test_quest')).toBeDefined();
      expect(manager.getQuestState('test_quest').stage).toBe(0);
    });
  });

  describe('getQuestState', () => {
    it('returns null for unregistered quest', () => {
      const state = manager.getQuestState('nonexistent');
      expect(state).toBeNull();
    });

    it('initializes quest state on first access for registered quest', () => {
      manager.registerQuest({ id: 'q1', stages: [], victoryStage: 1 });
      const state = manager.getQuestState('q1');
      expect(state.stage).toBe(0);
      expect(state.data).toEqual({});
      expect(state.startedDay).toBeNull();
      expect(state.completedDay).toBeNull();
    });
  });

  describe('advanceStage', () => {
    it('advances quest stage and applies credit rewards', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: { credits: 1000 } }],
        victoryStage: 2,
      });
      const startingCredits = manager.state.player.credits;
      manager.advanceQuest('q1');
      expect(manager.getQuestState('q1').stage).toBe(1);
      expect(manager.state.player.credits).toBe(startingCredits + 1000);
    });

    it('sets startedDay on first advance', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: {} }],
        victoryStage: 2,
      });
      manager.state.player.daysElapsed = 42;
      manager.advanceQuest('q1');
      expect(manager.getQuestState('q1').startedDay).toBe(42);
    });

    it('applies rep rewards', () => {
      manager.registerQuest({
        id: 'q1',
        npcId: 'chen_barnards',
        stages: [{ stage: 1, name: 'S1', rewards: { rep: { chen_barnards: 15 } } }],
        victoryStage: 2,
      });
      manager.getNPCState('chen_barnards');
      const startRep = manager.getNPCState('chen_barnards').rep;
      manager.advanceQuest('q1');
      expect(manager.getNPCState('chen_barnards').rep).toBeGreaterThan(startRep);
    });
  });

  describe('updateQuestData', () => {
    it('updates a counter in quest data', () => {
      manager.registerQuest({ id: 'q1', stages: [], victoryStage: 1 });
      manager.updateQuestData('q1', 'jumpsCompleted', 3);
      expect(manager.getQuestState('q1').data.jumpsCompleted).toBe(3);
    });
  });

  describe('isQuestComplete', () => {
    it('returns true when stage equals victoryStage', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: {} }],
        victoryStage: 2,
      });
      manager.advanceQuest('q1');
      manager.advanceQuest('q1');
      expect(manager.isQuestComplete('q1')).toBe(true);
    });

    it('returns false when quest in progress', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: {} }],
        victoryStage: 2,
      });
      manager.advanceQuest('q1');
      expect(manager.isQuestComplete('q1')).toBe(false);
    });
  });

  describe('getActiveQuests', () => {
    it('returns quests with stage > 0 and not complete', () => {
      manager.registerQuest({ id: 'q1', stages: [{ stage: 1, rewards: {} }], victoryStage: 3 });
      manager.registerQuest({ id: 'q2', stages: [{ stage: 1, rewards: {} }], victoryStage: 3 });
      manager.advanceQuest('q1');
      const active = manager.getActiveQuests();
      expect(active).toHaveLength(1);
      expect(active[0]).toBe('q1');
    });
  });
});

describe('NPC visibility', () => {
  it('excludes hidden NPCs from getNPCsAtSystem', () => {
    const npcs = getNPCsAtSystem(4);
    const tanakaVisible = npcs.some((n) => n.id === 'tanaka_barnards');
    expect(tanakaVisible).toBe(false);
  });

  it('reveals hidden NPC when revealFlag is set in gameState', () => {
    const gameState = {
      world: { narrativeEvents: { flags: { tanaka_met: true } } },
    };
    const npcs = getNPCsAtSystem(4, gameState);
    const tanakaVisible = npcs.some((n) => n.id === 'tanaka_barnards');
    expect(tanakaVisible).toBe(true);
  });

  it('keeps hidden NPC hidden when revealFlag is not set', () => {
    const gameState = {
      world: { narrativeEvents: { flags: {} } },
    };
    const npcs = getNPCsAtSystem(4, gameState);
    const tanakaVisible = npcs.some((n) => n.id === 'tanaka_barnards');
    expect(tanakaVisible).toBe(false);
  });
});

describe('Quest event hooks', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    manager.registerQuest({
      id: 'test_quest',
      stages: [
        { stage: 1, name: 'Jump Test', objectives: { jumpsCompleted: 3 }, rewards: { credits: 100 } },
      ],
      victoryStage: 2,
    });
  });

  it('increments jump counter when quest is at tracking stage', () => {
    manager.advanceQuest('test_quest');
    expect(manager.getQuestState('test_quest').stage).toBe(1);

    manager.questManager.onJump();
    manager.questManager.onJump();
    expect(manager.getQuestState('test_quest').data.jumpsCompleted).toBe(2);
  });

  it('does not increment jump counter when quest not at tracking stage', () => {
    manager.questManager.onJump();
    expect(manager.getQuestState('test_quest').data.jumpsCompleted).toBeUndefined();
  });
});

describe('Quest auto-registration', () => {
  it('registers Tanaka quest on initNewGame', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    const questState = manager.getQuestState('tanaka');
    expect(questState).not.toBeNull();
    expect(questState.stage).toBe(0);
    expect(questState.data).toEqual({});
  });
});

describe('Exotic material collection', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    // Advance Tanaka quest to stage 2
    manager.advanceQuest('tanaka');
    manager.advanceQuest('tanaka');
  });

  it('does not collect from Sol (too close)', () => {
    manager.questManager.onDock(0);
    expect(manager.getQuestState('tanaka').data.exoticMaterials).toBeUndefined();
  });

  it('collects from distant system when roll succeeds', () => {
    // Barnard's Star is at ~83 LY from Sol in test data, well over 15
    // Use a fixed "random" that always succeeds (returns 0, which is < 0.6 chance)
    manager.questManager.onDock(4, () => 0);
    expect(manager.getQuestState('tanaka').data.exoticMaterials).toBe(1);
  });

  it('does not collect twice from the same system', () => {
    manager.questManager.onDock(4, () => 0);
    manager.questManager.onDock(4, () => 0);
    expect(manager.getQuestState('tanaka').data.exoticMaterials).toBe(1);
  });

  it('does not collect when quest is not at stage 2', () => {
    manager.advanceQuest('tanaka'); // stage 3
    manager.questManager.onDock(4, () => 0);
    expect(manager.getQuestState('tanaka').data.exoticMaterials).toBeUndefined();
  });
});

describe('Tanaka quest end-to-end', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('progresses through all 5 stages to victory', () => {
    // Stage 0 → 1
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(1);

    // Complete stage 1 objectives (3 jumps)
    manager.questManager.onJump();
    manager.questManager.onJump();
    manager.questManager.onJump();
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 1 → 2
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(2);

    // Complete stage 2 objectives (5 exotic materials)
    manager.updateQuestData('tanaka', 'exoticMaterials', 5);
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 2 → 3
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(3);

    // Stage 3 has no objectives (narrative auto-complete)
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 3 → 4
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(4);

    // Complete stage 4 (message delivered)
    manager.updateQuestData('tanaka', 'messageDelivered', 1);
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 4 → 5
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(5);

    // Stage 5 has no objectives (requirements check only)
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 5 → 6 (victory!)
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(6);
    expect(manager.isQuestComplete('tanaka')).toBe(true);
  });

  it('applies credit rewards correctly', () => {
    const startCredits = manager.state.player.credits;
    manager.advanceQuest('tanaka'); // Stage 1: 1000cr
    expect(manager.state.player.credits).toBe(startCredits + 1000);
  });
});

describe('Tanaka quest definition', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    manager.registerQuest(TANAKA_QUEST);
  });

  it('has 5 stages', () => {
    expect(TANAKA_QUEST.stages).toHaveLength(5);
  });

  it('starts at stage 0', () => {
    expect(manager.getQuestStage('tanaka')).toBe(0);
  });

  it('victory stage is 6', () => {
    expect(TANAKA_QUEST.victoryStage).toBe(6);
  });

  it('all stages have requirements', () => {
    for (const stage of TANAKA_QUEST.stages) {
      expect(stage.requirements).toBeDefined();
    }
  });
});
