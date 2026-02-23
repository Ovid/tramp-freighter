import { BaseManager } from './base-manager.js';
import { ENDGAME_CONFIG, SHIP_CONFIG, EVENT_NAMES, TANAKA_SUPPLY_CONFIG } from '../../constants.js';

export class QuestManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.questDefinitions = {};
    gameStateManager.subscribe(EVENT_NAMES.JUMP_COMPLETED, () => this.onJump());
    gameStateManager.subscribe(EVENT_NAMES.DOCKED, (data) =>
      this.onDock(data?.systemId)
    );
  }

  registerQuest(questDef) {
    this.questDefinitions[questDef.id] = questDef;
    this.getQuestState(questDef.id);
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
    if (questState.completedDay != null) {
      return { success: false, reason: 'Quest already complete' };
    }

    const state = this.getState();
    const nextStage = questState.stage + 1;

    if (questState.stage === 0) {
      questState.startedDay = state.player.daysElapsed;
    }

    questState.stage = nextStage;

    if (nextStage >= questDef.victoryStage) {
      questState.completedDay = state.player.daysElapsed;
    }

    this.emit(EVENT_NAMES.QUEST_CHANGED, { ...state.quests });
    this.gameStateManager.markDirty();

    return { success: true, stage: nextStage };
  }

  claimStageRewards(questId) {
    const questDef = this.questDefinitions[questId];
    const questState = this.getQuestState(questId);
    if (!questDef || !questState) {
      return { success: false, reason: 'Quest not found' };
    }

    const currentStage = questState.stage;
    const stageDef = questDef.stages.find((s) => s.stage === currentStage);
    if (!stageDef) {
      return { success: false, reason: 'Invalid stage' };
    }

    if ((questState.data._rewardsClaimedStage || 0) >= currentStage) {
      return { success: false, reason: 'Rewards already claimed' };
    }

    if (!this.checkObjectivesComplete(questId)) {
      return { success: false, reason: 'Objectives not complete' };
    }

    if (stageDef.rewards) {
      this._applyRewards(stageDef.rewards);
    }

    questState.data._rewardsClaimedStage = currentStage;
    this.emit(EVENT_NAMES.QUEST_CHANGED, { ...this.getState().quests });
    this.gameStateManager.markDirty();

    return { success: true, stage: currentStage };
  }

  hasClaimedStageRewards(questId) {
    const questState = this.getQuestState(questId);
    if (!questState) return false;
    return (questState.data._rewardsClaimedStage || 0) >= questState.stage;
  }

  _applyRewards(rewards) {
    if (rewards.credits) {
      const state = this.getState();
      this.gameStateManager.updateCredits(
        state.player.credits + rewards.credits
      );
      if (state.stats) {
        state.stats.creditsEarned += rewards.credits;
      }
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
      state.ship.engine = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      this.emit(EVENT_NAMES.SHIP_CONDITION_CHANGED, {
        hull: state.ship.hull,
        engine: state.ship.engine,
        lifeSupport: state.ship.lifeSupport,
      });
    }

    if (rewards.upgrade) {
      const state = this.getState();
      if (!state.ship.upgrades.includes(rewards.upgrade)) {
        state.ship.upgrades.push(rewards.upgrade);
        this.emit(EVENT_NAMES.UPGRADES_CHANGED, [...state.ship.upgrades]);
      }
    }
  }

  updateQuestData(questId, key, value) {
    const questState = this.getQuestState(questId);
    if (!questState) return;
    questState.data[key] = value;
    this.emit(EVENT_NAMES.QUEST_CHANGED, { ...this.getState().quests });
    this.gameStateManager.markDirty();
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

  canContributeSupply() {
    const state = this.getState();

    // Must be at Barnard's Star
    if (state.player.currentSystem !== ENDGAME_CONFIG.TANAKA_SYSTEM) return false;

    // Must have met Tanaka
    const npcState = this.gameStateManager.getNPCState('tanaka_barnards');
    if (!npcState || !npcState.flags.includes('tanaka_met')) return false;

    // Check cooldown
    const questState = this.getQuestState('tanaka');
    if (questState?.data?.lastSupplyDay != null) {
      const daysSince = state.player.daysElapsed - questState.data.lastSupplyDay;
      if (daysSince < TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS) return false;
    }

    // Check cargo - need QUANTITY of any qualifying good
    for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
      const total = state.ship.cargo
        .filter((c) => c.good === goodType)
        .reduce((sum, c) => sum + c.qty, 0);
      if (total >= TANAKA_SUPPLY_CONFIG.QUANTITY) return true;
    }

    return false;
  }

  contributeSupply() {
    if (!this.canContributeSupply()) {
      return { success: false, reason: 'Not eligible' };
    }

    const state = this.getState();

    // Find first qualifying good with enough quantity (GOODS array order = preference)
    let goodToDonate = null;
    for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
      const total = state.ship.cargo
        .filter((c) => c.good === goodType)
        .reduce((sum, c) => sum + c.qty, 0);
      if (total >= TANAKA_SUPPLY_CONFIG.QUANTITY) {
        goodToDonate = goodType;
        break;
      }
    }

    if (!goodToDonate) {
      return { success: false, reason: 'No qualifying cargo' };
    }

    // Deduct cargo
    this.gameStateManager.removeCargoForMission(goodToDonate, TANAKA_SUPPLY_CONFIG.QUANTITY);

    // Add rep (flat gain, bypasses trust modifier so the reward is guaranteed)
    const npcState = this.gameStateManager.getNPCState('tanaka_barnards');
    this.gameStateManager.setNpcRep('tanaka_barnards', npcState.rep + TANAKA_SUPPLY_CONFIG.REP_GAIN);
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    // Set cooldown
    const questState = this.getQuestState('tanaka');
    questState.data.lastSupplyDay = state.player.daysElapsed;

    this.emit(EVENT_NAMES.QUEST_CHANGED, { ...state.quests });
    this.gameStateManager.markDirty();

    return { success: true, goodDonated: goodToDonate };
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
        this.emit(EVENT_NAMES.QUEST_CHANGED, { ...this.getState().quests });
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
    this.emit(EVENT_NAMES.QUEST_CHANGED, { ...this.getState().quests });
    this.gameStateManager.markDirty();
  }
}
