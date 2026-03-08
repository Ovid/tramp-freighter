import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  DANGER_CONFIG,
  KARMA_CONFIG,
  FACTION_CONFIG,
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
} from '../../src/game/constants.js';

describe('DangerManager coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDangerZone', () => {
    it('returns safe for safe system', () => {
      const safeId = DANGER_CONFIG.ZONES.safe.systems[0];
      expect(gsm.dangerManager.getDangerZone(safeId)).toBe('safe');
    });

    it('returns contested for contested system', () => {
      const contestedId = DANGER_CONFIG.ZONES.contested.systems[0];
      expect(gsm.dangerManager.getDangerZone(contestedId)).toBe('contested');
    });

    it('returns contested as default for unlisted system', () => {
      // Use a system ID that exists in star data but is not explicitly listed
      const allSafe = DANGER_CONFIG.ZONES.safe.systems;
      const allContested = DANGER_CONFIG.ZONES.contested.systems;
      const starData = gsm.starData || [];
      const unclassified = starData.find(
        (s) => !allSafe.includes(s.id) && !allContested.includes(s.id)
      );
      if (unclassified) {
        const zone = gsm.dangerManager.getDangerZone(unclassified.id);
        expect(['contested', 'dangerous']).toContain(zone);
      }
    });
  });

  describe('karma system', () => {
    it('getKarma returns current karma', () => {
      gsm.state.player.karma = 25;
      expect(gsm.dangerManager.getKarma()).toBe(25);
    });

    it('setKarma sets and clamps karma', () => {
      gsm.dangerManager.setKarma(50);
      expect(gsm.state.player.karma).toBe(50);
    });

    it('setKarma clamps to max', () => {
      gsm.dangerManager.setKarma(200);
      expect(gsm.state.player.karma).toBe(KARMA_CONFIG.MAX);
    });

    it('setKarma clamps to min', () => {
      gsm.dangerManager.setKarma(-200);
      expect(gsm.state.player.karma).toBe(KARMA_CONFIG.MIN);
    });

    it('modifyKarma changes karma by amount', () => {
      gsm.state.player.karma = 0;
      gsm.dangerManager.modifyKarma(15, 'helped someone');
      expect(gsm.state.player.karma).toBe(15);
    });

    it('modifyKarma clamps result', () => {
      gsm.state.player.karma = 95;
      gsm.dangerManager.modifyKarma(20, 'very helpful');
      expect(gsm.state.player.karma).toBe(KARMA_CONFIG.MAX);
    });

    it('modifyKarma increments charitableActs for positive amount', () => {
      gsm.state.stats = { charitableActs: 0 };
      gsm.dangerManager.modifyKarma(5, 'charity');
      expect(gsm.state.stats.charitableActs).toBe(1);
    });

    it('modifyKarma does not increment charitableActs for negative amount', () => {
      gsm.state.stats = { charitableActs: 0 };
      gsm.dangerManager.modifyKarma(-5, 'bad deed');
      expect(gsm.state.stats.charitableActs).toBe(0);
    });
  });

  describe('faction reputation', () => {
    it('getFactionRep returns faction rep', () => {
      gsm.state.player.factions.outlaws = 30;
      expect(gsm.dangerManager.getFactionRep('outlaws')).toBe(30);
    });

    it('getFactionRep throws for invalid faction', () => {
      expect(() => gsm.dangerManager.getFactionRep('pirates')).toThrow(
        'Invalid faction'
      );
    });

    it('setFactionRep sets and clamps', () => {
      gsm.dangerManager.setFactionRep('outlaws', 50);
      expect(gsm.state.player.factions.outlaws).toBe(50);
    });

    it('setFactionRep clamps to bounds', () => {
      gsm.dangerManager.setFactionRep('outlaws', 200);
      expect(gsm.state.player.factions.outlaws).toBe(FACTION_CONFIG.MAX);
    });

    it('setFactionRep throws for invalid faction', () => {
      expect(() => gsm.dangerManager.setFactionRep('pirates', 50)).toThrow(
        'Invalid faction'
      );
    });

    it('modifyFactionRep changes by amount', () => {
      gsm.state.player.factions.authorities = 10;
      gsm.dangerManager.modifyFactionRep('authorities', 15, 'helped patrol');
      expect(gsm.state.player.factions.authorities).toBe(25);
    });

    it('modifyFactionRep clamps result', () => {
      gsm.state.player.factions.authorities = 95;
      gsm.dangerManager.modifyFactionRep('authorities', 20, 'test');
      expect(gsm.state.player.factions.authorities).toBe(FACTION_CONFIG.MAX);
    });

    it('modifyFactionRep throws for invalid faction', () => {
      expect(() =>
        gsm.dangerManager.modifyFactionRep('pirates', 5, 'test')
      ).toThrow('Invalid faction');
    });
  });

  describe('calculateCargoValue', () => {
    it('returns 0 for empty cargo', () => {
      expect(gsm.dangerManager.calculateCargoValue([])).toBe(0);
    });

    it('sums cargo values correctly', () => {
      const cargo = [
        { qty: 5, buyPrice: 100 },
        { qty: 3, buyPrice: 200 },
      ];
      expect(gsm.dangerManager.calculateCargoValue(cargo)).toBe(1100);
    });

    it('handles missing qty or buyPrice', () => {
      const cargo = [{ good: 'ore' }, { qty: 5 }];
      expect(gsm.dangerManager.calculateCargoValue(cargo)).toBe(0);
    });
  });

  describe('hasIllegalMissionCargo', () => {
    it('returns false for empty cargo', () => {
      expect(gsm.dangerManager.hasIllegalMissionCargo([])).toBe(false);
    });

    it('returns false for regular cargo', () => {
      const cargo = [{ good: 'ore', qty: 5 }];
      expect(gsm.dangerManager.hasIllegalMissionCargo(cargo)).toBe(false);
    });

    it('returns true for illegal mission cargo', () => {
      const cargo = [
        { good: 'unmarked_crates', qty: 5, missionId: 'mission_1' },
      ];
      expect(gsm.dangerManager.hasIllegalMissionCargo(cargo)).toBe(true);
    });

    it('returns false for non-illegal mission cargo', () => {
      const cargo = [{ good: 'electronics', qty: 5, missionId: 'mission_1' }];
      expect(gsm.dangerManager.hasIllegalMissionCargo(cargo)).toBe(false);
    });
  });

  describe('incrementDangerFlag', () => {
    it('increments existing flag', () => {
      gsm.state.world.dangerFlags = { piratesFought: 5 };
      gsm.dangerManager.incrementDangerFlag('piratesFought');
      expect(gsm.state.world.dangerFlags.piratesFought).toBe(6);
    });

    it('does nothing for non-existent flag', () => {
      gsm.state.world.dangerFlags = {};
      gsm.dangerManager.incrementDangerFlag('nonexistent');
      expect(gsm.state.world.dangerFlags.nonexistent).toBeUndefined();
    });

    it('does nothing when dangerFlags is missing', () => {
      gsm.state.world.dangerFlags = null;
      // Should not throw
      gsm.dangerManager.incrementDangerFlag('piratesFought');
    });
  });

  describe('calculatePirateEncounterChance', () => {
    const makeGameState = (overrides = {}) => ({
      player: {
        factions: { outlaws: 0, authorities: 0 },
        ...overrides.player,
      },
      ship: {
        cargo: [],
        engine: 100,
        upgrades: [],
        ...overrides.ship,
      },
    });

    it('returns a value between 0 and 1', () => {
      const safeId = DANGER_CONFIG.ZONES.safe.systems[0];
      const chance = gsm.dangerManager.calculatePirateEncounterChance(
        safeId,
        makeGameState()
      );
      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(1);
    });

    it('higher for high-value cargo', () => {
      const safeId = DANGER_CONFIG.ZONES.safe.systems[0];
      const baseChance = gsm.dangerManager.calculatePirateEncounterChance(
        safeId,
        makeGameState()
      );
      const highValueChance = gsm.dangerManager.calculatePirateEncounterChance(
        safeId,
        makeGameState({
          ship: {
            cargo: [{ qty: 100, buyPrice: 500 }],
            engine: 100,
            upgrades: [],
          },
        })
      );
      expect(highValueChance).toBeGreaterThan(baseChance);
    });

    it('higher for poor engine condition', () => {
      const safeId = DANGER_CONFIG.ZONES.safe.systems[0];
      const baseChance = gsm.dangerManager.calculatePirateEncounterChance(
        safeId,
        makeGameState()
      );
      const poorEngineChance = gsm.dangerManager.calculatePirateEncounterChance(
        safeId,
        makeGameState({ ship: { cargo: [], engine: 20, upgrades: [] } })
      );
      expect(poorEngineChance).toBeGreaterThan(baseChance);
    });

    it('lower with advanced_sensors upgrade', () => {
      const contestedId = DANGER_CONFIG.ZONES.contested.systems[0];
      const baseChance = gsm.dangerManager.calculatePirateEncounterChance(
        contestedId,
        makeGameState()
      );
      const sensorsChance = gsm.dangerManager.calculatePirateEncounterChance(
        contestedId,
        makeGameState({
          ship: { cargo: [], engine: 100, upgrades: ['advanced_sensors'] },
        })
      );
      expect(sensorsChance).toBeLessThan(baseChance);
    });

    it('lower with high outlaw rep', () => {
      const contestedId = DANGER_CONFIG.ZONES.contested.systems[0];
      const baseChance = gsm.dangerManager.calculatePirateEncounterChance(
        contestedId,
        makeGameState()
      );
      const outlawChance = gsm.dangerManager.calculatePirateEncounterChance(
        contestedId,
        makeGameState({
          player: { factions: { outlaws: 50, authorities: 0 } },
        })
      );
      expect(outlawChance).toBeLessThan(baseChance);
    });
  });

  describe('calculateInspectionChance', () => {
    const makeGameState = (overrides = {}) => ({
      player: {
        factions: { outlaws: 0, authorities: 0 },
        ...overrides.player,
      },
      ship: {
        cargo: [],
        engine: 100,
        upgrades: [],
        ...overrides.ship,
      },
    });

    it('returns a value between 0 and 1', () => {
      const safeId = DANGER_CONFIG.ZONES.safe.systems[0];
      const chance = gsm.dangerManager.calculateInspectionChance(
        safeId,
        makeGameState()
      );
      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(1);
    });

    it('higher at core systems (Sol)', () => {
      const nonCoreId = DANGER_CONFIG.ZONES.safe.systems.find(
        (id) => id !== SOL_SYSTEM_ID && id !== ALPHA_CENTAURI_SYSTEM_ID
      );
      if (nonCoreId !== undefined) {
        const coreChance = gsm.dangerManager.calculateInspectionChance(
          SOL_SYSTEM_ID,
          makeGameState()
        );
        const nonCoreChance = gsm.dangerManager.calculateInspectionChance(
          nonCoreId,
          makeGameState()
        );
        expect(coreChance).toBeGreaterThan(nonCoreChance);
      }
    });
  });

  describe('countRestrictedGoods', () => {
    it('returns 0 for empty cargo', () => {
      expect(gsm.dangerManager.countRestrictedGoods([], 'safe', 0)).toBe(0);
    });

    it('counts illegal mission cargo', () => {
      const cargo = [
        { good: 'unmarked_crates', qty: 5, missionId: 'mission_1' },
      ];
      expect(gsm.dangerManager.countRestrictedGoods(cargo, 'safe', 0)).toBe(1);
    });
  });

  describe('removeRestrictedCargo', () => {
    it('removes restricted goods from cargo', () => {
      gsm.state.player.currentSystem = SOL_SYSTEM_ID;
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5 },
        { good: 'unmarked_crates', qty: 3, missionId: 'mission_1' },
      ];
      gsm.dangerManager.removeRestrictedCargo();
      // Contraband should be removed
      const hasContraband = gsm.state.ship.cargo.some(
        (c) => c.good === 'unmarked_crates'
      );
      expect(hasContraband).toBe(false);
    });
  });
});
