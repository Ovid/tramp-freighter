import { BaseManager } from './base-manager.js';
import {
  ENDGAME_CONFIG,
  SHIP_CONFIG,
  EVENT_NAMES,
  TANAKA_SUPPLY_CONFIG,
  calculateDistanceFromSol,
} from '../../constants.js';

export class QuestManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
    this.questDefinitions = {};
    this.capabilities.subscribe(EVENT_NAMES.JUMP_COMPLETED, () =>
      this.onJump()
    );
    this.capabilities.subscribe(EVENT_NAMES.DOCKED, (data) =>
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
    const quests = this.capabilities.getOwnState();
    if (!quests[questId]) {
      quests[questId] = {
        stage: 0,
        data: {},
        startedDay: null,
        completedDay: null,
      };
    }
    return quests[questId];
  }

  advanceQuest(questId) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return { success: false, reason: 'Quest not found' };

    const questState = this.getQuestState(questId);
    if (questState.completedDay != null) {
      return { success: false, reason: 'Quest already complete' };
    }

    const nextStage = questState.stage + 1;

    if (questState.stage === 0) {
      questState.startedDay = this.capabilities.getDaysElapsed();
    }

    questState.stage = nextStage;

    if (nextStage >= questDef.victoryStage) {
      questState.completedDay = this.capabilities.getDaysElapsed();
    }

    const quests = this.capabilities.getOwnState();
    this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
    this.capabilities.markDirty();

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
    const quests = this.capabilities.getOwnState();
    this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
    this.capabilities.markDirty();

    return { success: true, stage: currentStage };
  }

  hasClaimedStageRewards(questId) {
    const questState = this.getQuestState(questId);
    if (!questState) return false;
    return (questState.data._rewardsClaimedStage || 0) >= questState.stage;
  }

  _applyRewards(rewards) {
    if (rewards.credits) {
      const currentCredits = this.capabilities.getCredits();
      this.capabilities.updateCredits(currentCredits + rewards.credits);
      this.capabilities.updateStats('creditsEarned', rewards.credits);
    }

    if (rewards.rep) {
      for (const [npcId, amount] of Object.entries(rewards.rep)) {
        this.capabilities.modifyRepRaw(npcId, amount, 'quest_reward');
      }
    }

    if (rewards.karma) {
      this.capabilities.modifyKarma(rewards.karma, 'quest_reward');
    }

    if (rewards.engineRestore) {
      this.capabilities.setShipEngine(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
    }

    if (rewards.upgrade) {
      this.capabilities.addShipUpgrade(rewards.upgrade);
    }
  }

  updateQuestData(questId, key, value) {
    const questState = this.getQuestState(questId);
    if (!questState) return;
    questState.data[key] = value;
    const quests = this.capabilities.getOwnState();
    this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
    this.capabilities.markDirty();
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
    if (!stageDef) return false;
    return this.getUnmetRequirements(questId, stage).length === 0;
  }

  getUnmetRequirements(questId, stage) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return [];

    const stageDef = questDef.stages.find((s) => s.stage === stage);
    if (!stageDef?.requirements) return [];

    const reqs = stageDef.requirements;
    const unmet = [];

    if (reqs.npcRep) {
      const [npcId, threshold] = reqs.npcRep;
      const npcs = this.capabilities.getNpcs();
      const npcState = npcs[npcId];
      if (!npcState || npcState.rep < threshold) unmet.push('rep');
    }
    if (
      reqs.engineCondition != null &&
      this.capabilities.getShipEngine() < reqs.engineCondition
    )
      unmet.push('engine');
    if (
      reqs.hullCondition != null &&
      this.capabilities.getShipHull() < reqs.hullCondition
    )
      unmet.push('hull');
    if (reqs.debt != null && this.capabilities.getDebt() !== reqs.debt)
      unmet.push('debt');
    if (reqs.credits != null && this.capabilities.getCredits() < reqs.credits)
      unmet.push('credits');

    return unmet;
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
    if (this.capabilities.getCurrentSystem() !== ENDGAME_CONFIG.TANAKA_SYSTEM)
      return false;

    const narrativeFlags = this.capabilities.getNarrativeFlags();
    if (!narrativeFlags?.tanaka_met) return false;

    const questState = this.getQuestState('tanaka');
    if (questState?.data?.lastSupplyDay != null) {
      const daysSince =
        this.capabilities.getDaysElapsed() - questState.data.lastSupplyDay;
      if (daysSince < TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS) return false;
    }

    const cargo = this.capabilities.getShipCargo();
    for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
      const total = cargo
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

    const cargo = this.capabilities.getShipCargo();

    let goodToDonate = null;
    for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
      const total = cargo
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

    this.capabilities.removeCargoForMission(
      goodToDonate,
      TANAKA_SUPPLY_CONFIG.QUANTITY
    );

    this.capabilities.modifyRepRaw(
      'tanaka_barnards',
      TANAKA_SUPPLY_CONFIG.REP_GAIN,
      'tanaka_supply'
    );

    const questState = this.getQuestState('tanaka');
    questState.data.lastSupplyDay = this.capabilities.getDaysElapsed();

    const quests = this.capabilities.getOwnState();
    this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
    this.capabilities.markDirty();

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
        const quests = this.capabilities.getOwnState();
        this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
      }
    }
  }

  onDock(systemId, rngFn = Math.random) {
    const tanakaState = this.getQuestState('tanaka');
    if (!tanakaState || tanakaState.stage !== 2) return;

    const starData = this.capabilities.starData;
    const system = starData.find((s) => s.id === systemId);
    if (!system) return;

    const distanceLY = calculateDistanceFromSol(system);
    if (distanceLY < ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE) return;

    if (!tanakaState.data.exoticStations) tanakaState.data.exoticStations = [];
    if (
      (tanakaState.data.exoticMaterials || 0) >=
      ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED
    )
      return;
    if (tanakaState.data.exoticStations.includes(systemId)) {
      this.capabilities.emit(EVENT_NAMES.EXOTIC_MATTER_ALREADY_SAMPLED);
      return;
    }

    if (rngFn() >= ENDGAME_CONFIG.STAGE_2_EXOTIC_CHANCE) return;

    tanakaState.data.exoticStations.push(systemId);
    tanakaState.data.exoticMaterials =
      (tanakaState.data.exoticMaterials || 0) + 1;
    const quests = this.capabilities.getOwnState();
    this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
    this.capabilities.emit(EVENT_NAMES.EXOTIC_MATTER_COLLECTED, {
      count: tanakaState.data.exoticMaterials,
      total: ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED,
    });
    this.capabilities.markDirty();
  }
}
