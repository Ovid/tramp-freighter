import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MechanicalFailureManager } from '../../src/game/state/managers/mechanical-failure.js';
import { FAILURE_CONFIG } from '../../src/game/constants.js';

describe('MechanicalFailureManager', () => {
  let manager;
  let mockState;
  let capabilities;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    mockState = {
      player: { daysElapsed: 10, currentSystem: 0 },
      ship: { hull: 100, engine: 100, lifeSupport: 100 },
    };

    capabilities = {
      getDaysElapsed: () => mockState.player.daysElapsed,
      getCurrentSystem: () => mockState.player.currentSystem,
      getShipCondition: () => ({
        hull: mockState.ship.hull,
        engine: mockState.ship.engine,
        lifeSupport: mockState.ship.lifeSupport,
      }),
      emit: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    };

    manager = new MechanicalFailureManager(capabilities);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkMechanicalFailure', () => {
    it('returns null when all conditions are above thresholds', () => {
      const result = manager.checkMechanicalFailure();
      expect(result).toBe(null);
    });

    it('returns null when hull is exactly at threshold', () => {
      mockState.ship.hull = FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD;
      const result = manager.checkMechanicalFailure();
      expect(result).toBe(null);
    });

    it('can return hull_breach when hull is below threshold', () => {
      mockState.ship.hull = FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD - 1;
      // Try many days to find one where RNG triggers the breach
      let found = false;
      for (let day = 0; day < 200; day++) {
        mockState.player.daysElapsed = day;
        const result = manager.checkMechanicalFailure();
        if (result && result.type === 'hull_breach') {
          expect(result.severity).toBe(mockState.ship.hull);
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('can return engine_failure when engine is below threshold', () => {
      mockState.ship.hull = 100; // above threshold
      mockState.ship.engine =
        FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD - 1;
      let found = false;
      for (let day = 0; day < 200; day++) {
        mockState.player.daysElapsed = day;
        const result = manager.checkMechanicalFailure();
        if (result && result.type === 'engine_failure') {
          expect(result.severity).toBe(mockState.ship.engine);
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('can return life_support when lifeSupport is below threshold', () => {
      mockState.ship.hull = 100;
      mockState.ship.engine = 100;
      mockState.ship.lifeSupport =
        FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD - 1;
      let found = false;
      for (let day = 0; day < 500; day++) {
        mockState.player.daysElapsed = day;
        const result = manager.checkMechanicalFailure();
        if (result && result.type === 'life_support') {
          expect(result.severity).toBe(mockState.ship.lifeSupport);
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('resolveMechanicalFailure', () => {
    it('dispatches hull_breach to resolveHullBreach', () => {
      const result = manager.resolveMechanicalFailure('hull_breach', null);
      expect(result.costs.hull).toBe(FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE);
      expect(result.costs.cargoLoss).toBe(true);
    });

    it('dispatches engine_failure to resolveEngineFailure', () => {
      const result = manager.resolveMechanicalFailure(
        'engine_failure',
        'call_for_help'
      );
      expect(result.costs.credits).toBe(
        FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST
      );
    });

    it('dispatches life_support to resolveLifeSupportEmergency', () => {
      const result = manager.resolveMechanicalFailure('life_support', null);
      expect(result.costs.lifeSupport).toBe(
        FAILURE_CONFIG.LIFE_SUPPORT.EMERGENCY_COST
      );
    });

    it('throws on unknown failure type', () => {
      expect(() =>
        manager.resolveMechanicalFailure('warp_core_breach', null)
      ).toThrow('Unknown failure type: warp_core_breach');
    });
  });

  describe('resolveHullBreach', () => {
    it('returns hull damage and cargo loss', () => {
      const result = manager.resolveHullBreach();
      expect(result).toEqual({
        success: false,
        costs: {
          hull: FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE,
          cargoLoss: true,
        },
        rewards: {},
        description: expect.stringContaining('Hull breach'),
      });
    });
  });

  describe('resolveEngineFailure', () => {
    it('emergency_restart succeeds when rng is below threshold', () => {
      const rng = FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE - 0.01;
      const result = manager.resolveEmergencyRestart(rng);
      expect(result.success).toBe(true);
      expect(result.costs.engine).toBe(
        FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST
      );
    });

    it('emergency_restart fails when rng is at or above threshold', () => {
      const rng = FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE;
      const result = manager.resolveEmergencyRestart(rng);
      expect(result.success).toBe(false);
      expect(result.costs.engine).toBe(
        FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST
      );
    });

    it('call_for_help returns credits cost and days delay', () => {
      const result = manager.resolveCallForHelp();
      expect(result).toEqual({
        success: true,
        costs: {
          credits: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST,
          days: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY,
        },
        rewards: {},
        description: expect.stringContaining('Rescue tug'),
      });
    });

    it('jury_rig succeeds when rng is below threshold', () => {
      const rng = FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE - 0.01;
      const result = manager.resolveJuryRig(rng);
      expect(result.success).toBe(true);
      expect(result.costs.engine).toBe(
        FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST
      );
    });

    it('jury_rig fails when rng is at or above threshold', () => {
      const rng = FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE;
      const result = manager.resolveJuryRig(rng);
      expect(result.success).toBe(false);
      expect(result.costs.engine).toBe(
        FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST
      );
    });

    it('throws on unknown engine repair choice', () => {
      expect(() =>
        manager.resolveEngineFailure('percussive_maintenance', 0.5)
      ).toThrow('Unknown engine failure repair choice: percussive_maintenance');
    });
  });

  describe('resolveLifeSupportEmergency', () => {
    it('returns life support damage', () => {
      const result = manager.resolveLifeSupportEmergency();
      expect(result).toEqual({
        success: false,
        costs: {
          lifeSupport: FAILURE_CONFIG.LIFE_SUPPORT.EMERGENCY_COST,
        },
        rewards: {},
        description: expect.stringContaining('Life support emergency'),
      });
    });
  });
});
