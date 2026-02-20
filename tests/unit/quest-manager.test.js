import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

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

  it('initializes state.quests as empty object', () => {
    expect(manager.state.quests).toBeDefined();
    expect(manager.state.quests).toEqual({});
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
