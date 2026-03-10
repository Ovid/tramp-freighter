import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CombatManager } from '../../src/game/state/managers/combat.js';
import { COMBAT_CONFIG } from '../../src/game/constants.js';

describe('CombatManager lucky_ship negation paths', () => {
  let manager;

  const makeGameState = (overrides = {}) => ({
    player: {
      daysElapsed: 10,
      currentSystem: 0,
      karma: 0,
      credits: 5000,
      ...overrides.player,
    },
    ship: {
      quirks: ['lucky_ship'],
      upgrades: [],
      cargo: [],
      ...overrides.ship,
    },
  });

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = makeGameState();
    const capabilities = {
      getDaysElapsed: () => state.player.daysElapsed,
      getCurrentSystem: () => state.player.currentSystem,
      getShipQuirks: () => state.ship.quirks,
      getShipUpgrades: () => state.ship.upgrades,
      getKarma: () => state.player.karma,
      incrementDangerFlag: vi.fn(),
      emit: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    };
    manager = new CombatManager(capabilities);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('evasive maneuvers lucky negation', () => {
    it('succeeds via lucky_ship when main evasive check fails', () => {
      const gameState = makeGameState();
      // strengthModifier = 1.0 makes successChance = max(0, 0.7 - 1.0) = 0
      // rng = 0.01 fails evasive (0.01 >= 0 is true, wait: 0.01 < 0 is false)
      // So evasive fails, then lucky check: 0.01 < 0.05 = true → negation!
      const encounter = { strengthModifier: 1.0 };
      const result = manager.resolveEvasiveManeuvers(
        encounter,
        gameState,
        0.01
      );

      expect(result.success).toBe(true);
      expect(result.description).toMatch(/lucky/i);
      expect(result.costs.fuel).toBe(COMBAT_CONFIG.EVASIVE.SUCCESS_FUEL_COST);
      expect(result.costs.engine).toBe(
        COMBAT_CONFIG.EVASIVE.SUCCESS_ENGINE_COST
      );
    });
  });

  describe('return fire lucky negation', () => {
    it('succeeds via lucky_ship when main return fire check fails', () => {
      const gameState = makeGameState();
      // strengthModifier = 1.0 makes successChance = max(0, 0.45 - 1.0) = 0
      // rng = 0.01 fails return fire, then lucky check: 0.01 < 0.05 = true
      const encounter = { strengthModifier: 1.0 };
      const result = manager.resolveReturnFire(encounter, gameState, 0.01);

      expect(result.success).toBe(true);
      expect(result.description).toMatch(/lucky/i);
      expect(result.costs.hull).toBeDefined();
      expect(result.rewards.factionRep.outlaws).toBe(
        COMBAT_CONFIG.RETURN_FIRE.SUCCESS_OUTLAW_REP
      );
    });
  });

  describe('distress call lucky negation', () => {
    it('succeeds via lucky_ship when main distress call check fails', () => {
      const gameState = makeGameState();
      // strengthModifier = 1.0 makes successChance = max(0, 0.3 - 1.0) = 0
      // rng = 0.01 fails distress, then lucky check: 0.01 < 0.05 = true
      const encounter = { strengthModifier: 1.0 };
      const result = manager.resolveDistressCall(encounter, gameState, 0.01);

      expect(result.success).toBe(true);
      expect(result.description).toMatch(/lucky/i);
      expect(result.rewards.factionRep.authorities).toBe(
        COMBAT_CONFIG.DISTRESS_CALL.SUCCESS_REP_GAIN
      );
    });
  });
});
