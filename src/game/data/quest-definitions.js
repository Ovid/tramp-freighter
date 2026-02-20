import { ENDGAME_CONFIG } from '../constants.js';

export const TANAKA_QUEST = {
  id: 'tanaka',
  name: 'The Tanaka Sequence',
  npcId: 'tanaka_barnards',

  unlockConditions: {
    systemsVisited: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
    system: ENDGAME_CONFIG.TANAKA_SYSTEM,
  },

  stages: [
    {
      stage: 1,
      name: 'Field Test',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_1_REP],
        engineCondition: ENDGAME_CONFIG.STAGE_1_ENGINE,
      },
      objectives: { jumpsCompleted: ENDGAME_CONFIG.STAGE_1_JUMPS },
      rewards: {
        credits: ENDGAME_CONFIG.STAGE_1_REWARD_CREDITS,
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_1_REWARD_REP },
        engineRestore: true,
      },
      dialogueNode: 'mission_1_offer',
    },
    {
      stage: 2,
      name: 'Rare Materials',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_2_REP],
      },
      objectives: { exoticMaterials: ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED },
      rewards: {
        credits: ENDGAME_CONFIG.STAGE_2_REWARD_CREDITS,
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_2_REWARD_REP },
        upgrade: 'advanced_sensors',
      },
      dialogueNode: 'mission_2_offer',
    },
    {
      stage: 3,
      name: 'The Prototype',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_3_REP],
        hullCondition: ENDGAME_CONFIG.STAGE_3_HULL,
        engineCondition: ENDGAME_CONFIG.STAGE_3_ENGINE,
      },
      objectives: {},
      rewards: {
        credits: ENDGAME_CONFIG.STAGE_3_REWARD_CREDITS,
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_3_REWARD_REP },
      },
      dialogueNode: 'mission_3_offer',
    },
    {
      stage: 4,
      name: 'Personal Request',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_4_REP],
      },
      objectives: { messageDelivered: 1 },
      rewards: {
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_4_REWARD_REP },
      },
      dialogueNode: 'mission_4_offer',
    },
    {
      stage: 5,
      name: 'Final Preparations',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_5_REP],
        debt: 0,
        credits: ENDGAME_CONFIG.VICTORY_CREDITS,
        hullCondition: ENDGAME_CONFIG.STAGE_5_HULL,
        engineCondition: ENDGAME_CONFIG.STAGE_5_ENGINE,
      },
      objectives: {},
      rewards: {
        upgrade: 'range_extender',
      },
      dialogueNode: 'mission_5_offer',
    },
  ],

  victoryStage: ENDGAME_CONFIG.VICTORY_STAGE,
};

export const ALL_QUESTS = [TANAKA_QUEST];
