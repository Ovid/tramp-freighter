import { BaseManager } from './base-manager.js';
import { ENDGAME_CONFIG } from '../../constants.js';

export class QuestManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.questDefinitions = {};
    gameStateManager.subscribe('locationChanged', () => this.onJump());
    gameStateManager.subscribe('docked', (data) => this.onDock(data?.systemId));
  }

  registerQuest(questDef) {
    this.questDefinitions[questDef.id] = questDef;
  }

  getQuestDefinition(questId) {
    return this.questDefinitions[questId] || null;
  }

  getQuestState(questId) {
    if (!this.questDefinitions[questId]) return null;
    const state = this.getState();
    if (!state.quests[questId]) {
      state.quests[questId] = {
        stage: 0,
        data: {},
        startedDay: null,
        completedDay: null,
      };
    }
    return state.quests[questId];
  }

  advanceQuest(questId) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return { success: false, reason: 'Quest not found' };

    const questState = this.getQuestState(questId);
    const state = this.getState();
    const nextStage = questState.stage + 1;

    if (questState.stage === 0) {
      questState.startedDay = state.player.daysElapsed;
    }

    const stageDef = questDef.stages.find((s) => s.stage === nextStage);

    questState.stage = nextStage;

    if (stageDef?.rewards) {
      this._applyRewards(stageDef.rewards);
    }

    if (nextStage >= questDef.victoryStage) {
      questState.completedDay = state.player.daysElapsed;
    }

    this.emit('questChanged', { ...state.quests });
    this.gameStateManager.saveGame();

    return { success: true, stage: nextStage };
  }

  _applyRewards(rewards) {
    if (rewards.credits) {
      const state = this.getState();
      state.player.credits += rewards.credits;
      if (state.stats) {
        state.stats.creditsEarned += rewards.credits;
      }
      this.emit('creditsChanged', state.player.credits);
    }

    if (rewards.rep) {
      for (const [npcId, amount] of Object.entries(rewards.rep)) {
        this.gameStateManager.modifyRep(npcId, amount, 'quest_reward');
      }
    }

    if (rewards.karma) {
      this.gameStateManager.modifyKarma(rewards.karma, 'quest_reward');
    }

    if (rewards.engineRestore) {
      const state = this.getState();
      state.ship.engine = 100;
      this.emit('shipConditionChanged', {
        hull: state.ship.hull,
        engine: state.ship.engine,
        lifeSupport: state.ship.lifeSupport,
      });
    }

    if (rewards.upgrade) {
      const state = this.getState();
      if (!state.ship.upgrades.includes(rewards.upgrade)) {
        state.ship.upgrades.push(rewards.upgrade);
        this.emit('upgradesChanged', [...state.ship.upgrades]);
      }
    }
  }

  updateQuestData(questId, key, value) {
    const questState = this.getQuestState(questId);
    if (!questState) return;
    questState.data[key] = value;
    this.emit('questChanged', { ...this.getState().quests });
    this.gameStateManager.saveGame();
  }

  isQuestComplete(questId) {
    const questDef = this.questDefinitions[questId];
    const questState = this.getQuestState(questId);
    if (!questDef || !questState) return false;
    return questState.stage >= questDef.victoryStage;
  }

  getActiveQuests() {
    return Object.keys(this.questDefinitions).filter((questId) => {
      const questState = this.getQuestState(questId);
      return (
        questState && questState.stage > 0 && !this.isQuestComplete(questId)
      );
    });
  }

  getQuestStage(questId) {
    const questState = this.getQuestState(questId);
    return questState ? questState.stage : 0;
  }

  canStartStage(questId, stage) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return false;

    const stageDef = questDef.stages.find((s) => s.stage === stage);
    if (!stageDef?.requirements) return true;

    const state = this.getState();
    const reqs = stageDef.requirements;

    if (reqs.npcRep) {
      const [npcId, threshold] = reqs.npcRep;
      const npcState = state.npcs[npcId];
      if (!npcState || npcState.rep < threshold) return false;
    }

    if (
      reqs.engineCondition != null &&
      state.ship.engine < reqs.engineCondition
    )
      return false;
    if (reqs.hullCondition != null && state.ship.hull < reqs.hullCondition)
      return false;
    if (reqs.debt != null && state.player.debt !== reqs.debt) return false;
    if (reqs.credits != null && state.player.credits < reqs.credits)
      return false;

    return true;
  }

  checkObjectivesComplete(questId) {
    const questDef = this.questDefinitions[questId];
    const questState = this.getQuestState(questId);
    if (!questDef || !questState) return false;

    const stageDef = questDef.stages.find((s) => s.stage === questState.stage);
    if (!stageDef?.objectives) return true;

    for (const [key, target] of Object.entries(stageDef.objectives)) {
      if ((questState.data[key] || 0) < target) return false;
    }
    return true;
  }

  onJump() {
    for (const questId of Object.keys(this.questDefinitions)) {
      const questState = this.getQuestState(questId);
      if (!questState || questState.stage === 0) continue;

      const stageDef = this.questDefinitions[questId].stages.find(
        (s) => s.stage === questState.stage
      );
      if (stageDef?.objectives?.jumpsCompleted != null) {
        questState.data.jumpsCompleted =
          (questState.data.jumpsCompleted || 0) + 1;
        this.emit('questChanged', { ...this.getState().quests });
      }
    }
  }

  onDock(systemId, rngFn = Math.random) {
    const tanakaState = this.getQuestState('tanaka');
    if (!tanakaState || tanakaState.stage !== 2) return;

    const starData = this.gameStateManager.starData;
    const system = starData.find((s) => s.id === systemId);
    const sol = starData.find((s) => s.id === 0);
    if (!system || !sol) return;

    const distance = Math.sqrt(
      (system.x - sol.x) ** 2 +
        (system.y - sol.y) ** 2 +
        (system.z - sol.z) ** 2
    );
    if (distance < ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE) return;

    if (!tanakaState.data.exoticStations) tanakaState.data.exoticStations = [];
    if (tanakaState.data.exoticStations.includes(systemId)) return;

    if (rngFn() >= ENDGAME_CONFIG.STAGE_2_EXOTIC_CHANCE) return;

    tanakaState.data.exoticStations.push(systemId);
    tanakaState.data.exoticMaterials =
      (tanakaState.data.exoticMaterials || 0) + 1;
    this.emit('questChanged', { ...this.getState().quests });
  }
}
