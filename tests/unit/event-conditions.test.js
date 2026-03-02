import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../src/game/event-conditions.js';
import { CONDITION_TYPES } from '../../src/game/constants.js';

describe('evaluateCondition', () => {
  const baseState = {
    player: {
      currentSystem: 0,
      debt: 10000,
      karma: 0,
      daysElapsed: 15,
      factions: { authorities: 0, outlaws: 0, traders: 0, civilians: 0 },
    },
    ship: {
      fuel: 50,
      hull: 80,
      cargo: [{ good: 'ore', qty: 5, buyPrice: 10 }],
    },
    world: {
      visitedSystems: [0, 1],
      narrativeEvents: { fired: [], cooldowns: {}, flags: { met_chen: true } },
    },
  };

  describe('first_visit', () => {
    it('should return true when system not in visitedSystems', () => {
      const context = { system: 4 };
      expect(
        evaluateCondition({ type: 'first_visit' }, baseState, context)
      ).toBe(true);
    });

    it('should return false when system already visited', () => {
      const context = { system: 0 };
      expect(
        evaluateCondition({ type: 'first_visit' }, baseState, context)
      ).toBe(false);
    });
  });

  describe('first_dock', () => {
    it('should return true when system not in dockedSystems', () => {
      const context = { system: 4 };
      expect(
        evaluateCondition({ type: 'first_dock' }, baseState, context)
      ).toBe(true);
    });

    it('should return false when system already docked', () => {
      const state = {
        ...baseState,
        world: {
          ...baseState.world,
          narrativeEvents: {
            ...baseState.world.narrativeEvents,
            dockedSystems: [0, 1],
          },
        },
      };
      const context = { system: 0 };
      expect(evaluateCondition({ type: 'first_dock' }, state, context)).toBe(
        false
      );
    });

    it('should return true when dockedSystems is empty', () => {
      const context = { system: 0 };
      expect(
        evaluateCondition({ type: 'first_dock' }, baseState, context)
      ).toBe(true);
    });
  });

  describe('debt_above', () => {
    it('should return true when debt exceeds value', () => {
      expect(
        evaluateCondition({ type: 'debt_above', value: 8000 }, baseState)
      ).toBe(true);
    });

    it('should return false when debt is below value', () => {
      expect(
        evaluateCondition({ type: 'debt_above', value: 15000 }, baseState)
      ).toBe(false);
    });
  });

  describe('debt_below', () => {
    it('should return true when debt is below value', () => {
      expect(
        evaluateCondition({ type: 'debt_below', value: 15000 }, baseState)
      ).toBe(true);
    });

    it('should return false when debt exceeds value', () => {
      expect(
        evaluateCondition({ type: 'debt_below', value: 5000 }, baseState)
      ).toBe(false);
    });
  });

  describe('karma_above', () => {
    it('should return true when karma exceeds value', () => {
      const state = {
        ...baseState,
        player: { ...baseState.player, karma: 10 },
      };
      expect(evaluateCondition({ type: 'karma_above', value: 5 }, state)).toBe(
        true
      );
    });

    it('should return false when karma is below value', () => {
      expect(
        evaluateCondition({ type: 'karma_above', value: 5 }, baseState)
      ).toBe(false);
    });
  });

  describe('karma_below', () => {
    it('should return true when karma is below value', () => {
      const state = {
        ...baseState,
        player: { ...baseState.player, karma: -10 },
      };
      expect(evaluateCondition({ type: 'karma_below', value: -5 }, state)).toBe(
        true
      );
    });
  });

  describe('fuel_below', () => {
    it('should return true when fuel is below value', () => {
      const state = { ...baseState, ship: { ...baseState.ship, fuel: 8 } };
      expect(evaluateCondition({ type: 'fuel_below', value: 10 }, state)).toBe(
        true
      );
    });

    it('should return false when fuel is above value', () => {
      expect(
        evaluateCondition({ type: 'fuel_below', value: 10 }, baseState)
      ).toBe(false);
    });
  });

  describe('hull_below', () => {
    it('should return true when hull is below value', () => {
      const state = { ...baseState, ship: { ...baseState.ship, hull: 25 } };
      expect(evaluateCondition({ type: 'hull_below', value: 30 }, state)).toBe(
        true
      );
    });
  });

  describe('days_past', () => {
    it('should return true when daysElapsed >= value', () => {
      expect(
        evaluateCondition({ type: 'days_past', value: 15 }, baseState)
      ).toBe(true);
    });

    it('should return false when daysElapsed < value', () => {
      expect(
        evaluateCondition({ type: 'days_past', value: 30 }, baseState)
      ).toBe(false);
    });
  });

  describe('has_visited', () => {
    it('should return true when system is in visitedSystems', () => {
      expect(
        evaluateCondition({ type: 'has_visited', system: 1 }, baseState)
      ).toBe(true);
    });

    it('should return false when system not visited', () => {
      expect(
        evaluateCondition({ type: 'has_visited', system: 99 }, baseState)
      ).toBe(false);
    });
  });

  describe('has_cargo', () => {
    it('should return true when cargo contains the good', () => {
      expect(
        evaluateCondition({ type: 'has_cargo', good: 'ore' }, baseState)
      ).toBe(true);
    });

    it('should return false when cargo does not contain the good', () => {
      expect(
        evaluateCondition({ type: 'has_cargo', good: 'medicine' }, baseState)
      ).toBe(false);
    });
  });

  describe('flag_set', () => {
    it('should return true when flag exists in narrativeEvents.flags', () => {
      expect(
        evaluateCondition({ type: 'flag_set', flag: 'met_chen' }, baseState)
      ).toBe(true);
    });

    it('should return false when flag is not set', () => {
      expect(
        evaluateCondition({ type: 'flag_set', flag: 'unknown_flag' }, baseState)
      ).toBe(false);
    });
  });

  describe('flag_not_set', () => {
    it('should return true when flag is not set', () => {
      expect(
        evaluateCondition(
          { type: 'flag_not_set', flag: 'unknown_flag' },
          baseState
        )
      ).toBe(true);
    });

    it('should return false when flag exists in narrativeEvents.flags', () => {
      expect(
        evaluateCondition({ type: 'flag_not_set', flag: 'met_chen' }, baseState)
      ).toBe(false);
    });
  });

  describe('array of conditions (AND logic)', () => {
    it('should return true when all conditions in array are met', () => {
      const conditions = [
        { type: 'debt_above', value: 8000 },
        { type: 'days_past', value: 15 },
      ];
      expect(evaluateCondition(conditions, baseState)).toBe(true);
    });

    it('should return false when any condition in array is not met', () => {
      const conditions = [
        { type: 'debt_above', value: 8000 },
        { type: 'days_past', value: 30 },
      ];
      expect(evaluateCondition(conditions, baseState)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(evaluateCondition([], baseState)).toBe(true);
    });
  });

  describe('null condition', () => {
    it('should return true when condition is null', () => {
      expect(evaluateCondition(null, baseState)).toBe(true);
    });
  });

  describe('unknown condition type', () => {
    it('should return false for unknown condition types', () => {
      expect(evaluateCondition({ type: 'bogus' }, baseState)).toBe(false);
    });
  });

  describe('npc_rep_above', () => {
    it('returns true when NPC rep meets threshold', () => {
      const state = {
        ...baseState,
        npcs: { tanaka_barnards: { rep: 50 } },
      };
      expect(
        evaluateCondition(
          {
            type: CONDITION_TYPES.NPC_REP_ABOVE,
            npcId: 'tanaka_barnards',
            value: 30,
          },
          state
        )
      ).toBe(true);
    });

    it('returns false when NPC rep below threshold', () => {
      const state = {
        ...baseState,
        npcs: { tanaka_barnards: { rep: 10 } },
      };
      expect(
        evaluateCondition(
          {
            type: CONDITION_TYPES.NPC_REP_ABOVE,
            npcId: 'tanaka_barnards',
            value: 30,
          },
          state
        )
      ).toBe(false);
    });

    it('returns false when NPC state does not exist', () => {
      const state = { ...baseState, npcs: {} };
      expect(
        evaluateCondition(
          {
            type: CONDITION_TYPES.NPC_REP_ABOVE,
            npcId: 'tanaka_barnards',
            value: 30,
          },
          state
        )
      ).toBe(false);
    });
  });

  describe('systems_visited_count', () => {
    it('returns true when enough systems visited', () => {
      const state = {
        ...baseState,
        world: { ...baseState.world, visitedSystems: [0, 1, 4, 5, 7] },
      };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
          state
        )
      ).toBe(true);
    });

    it('returns false when not enough systems visited', () => {
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
          baseState
        )
      ).toBe(false);
    });
  });

  describe('quest_stage', () => {
    it('returns true when quest is at specified stage', () => {
      const state = { ...baseState, quests: { tanaka: { stage: 2 } } };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 2 },
          state
        )
      ).toBe(true);
    });

    it('returns false when quest not at stage', () => {
      const state = { ...baseState, quests: { tanaka: { stage: 1 } } };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 2 },
          state
        )
      ).toBe(false);
    });

    it('returns false when quest does not exist', () => {
      const state = { ...baseState, quests: {} };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 1 },
          state
        )
      ).toBe(false);
    });
  });

  describe('debt_zero', () => {
    it('returns true when debt is zero', () => {
      const state = { ...baseState, player: { ...baseState.player, debt: 0 } };
      expect(
        evaluateCondition({ type: CONDITION_TYPES.DEBT_ZERO }, state)
      ).toBe(true);
    });

    it('returns false when debt exists', () => {
      expect(
        evaluateCondition({ type: CONDITION_TYPES.DEBT_ZERO }, baseState)
      ).toBe(false);
    });
  });

  describe('credits_above', () => {
    it('returns true when credits meet threshold', () => {
      const state = {
        ...baseState,
        player: { ...baseState.player, credits: 30000 },
      };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.CREDITS_ABOVE, value: 25000 },
          state
        )
      ).toBe(true);
    });

    it('returns false when credits below threshold', () => {
      const state = {
        ...baseState,
        player: { ...baseState.player, credits: 1000 },
      };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.CREDITS_ABOVE, value: 25000 },
          state
        )
      ).toBe(false);
    });
  });

  describe('hull_above', () => {
    it('returns true when hull meets threshold', () => {
      const state = { ...baseState, ship: { ...baseState.ship, hull: 85 } };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.HULL_ABOVE, value: 80 },
          state
        )
      ).toBe(true);
    });

    it('returns false when hull below threshold', () => {
      const state = { ...baseState, ship: { ...baseState.ship, hull: 60 } };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.HULL_ABOVE, value: 80 },
          state
        )
      ).toBe(false);
    });
  });

  describe('engine_above', () => {
    it('returns true when engine meets threshold', () => {
      const state = { ...baseState, ship: { ...baseState.ship, engine: 95 } };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.ENGINE_ABOVE, value: 90 },
          state
        )
      ).toBe(true);
    });

    it('returns false when engine below threshold', () => {
      const state = { ...baseState, ship: { ...baseState.ship, engine: 70 } };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.ENGINE_ABOVE, value: 90 },
          state
        )
      ).toBe(false);
    });
  });

  describe('has_upgrade', () => {
    it('returns true when player has the upgrade', () => {
      const state = {
        ...baseState,
        ship: {
          ...baseState.ship,
          upgrades: ['extended_tank', 'range_extender'],
        },
      };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.HAS_UPGRADE, upgrade: 'range_extender' },
          state
        )
      ).toBe(true);
    });

    it('returns false when player does not have the upgrade', () => {
      const state = {
        ...baseState,
        ship: { ...baseState.ship, upgrades: ['extended_tank'] },
      };
      expect(
        evaluateCondition(
          { type: CONDITION_TYPES.HAS_UPGRADE, upgrade: 'range_extender' },
          state
        )
      ).toBe(false);
    });
  });
});
