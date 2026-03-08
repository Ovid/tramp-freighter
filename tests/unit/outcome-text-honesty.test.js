import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CombatManager } from '@game/state/managers/combat.js';
import { InspectionManager } from '@game/state/managers/inspection.js';

describe('Outcome text honesty', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('combat return fire success', () => {
    it('should mention hull damage in description', () => {
      const manager = new CombatManager({ state: {}, getState: () => ({}) });
      const encounter = { strength: 0.3 };
      const gameState = {
        player: { karma: 10 },
        ship: { quirks: [], upgrades: [] },
      };

      // Force success with low rng (well below BASE_CHANCE)
      const result = manager.resolveReturnFire(encounter, gameState, 0.01);

      expect(result.success).toBe(true);
      expect(result.description.toLowerCase()).toMatch(
        /hull|hits|damage|scoring/
      );
    });
  });

  describe('inspection bribe success', () => {
    it('should hint at reputation consequences', () => {
      const manager = new InspectionManager({
        emit: vi.fn(),
        markDirty: vi.fn(),
        isTestEnvironment: true,
      });

      // Force bribe success (rng well below BRIBE.BASE_CHANCE)
      const result = manager.resolveInspectionBribe(0.01);

      expect(result.success).toBe(true);
      expect(result.description.toLowerCase()).toMatch(
        /books|noted|reputation|record/
      );
    });
  });

  describe('inspection cooperate', () => {
    it('should describe clean inspection positively', () => {
      const manager = new InspectionManager({
        getCurrentSystem: () => 0,
        getShipCargo: () => [],
        getShipHiddenCargo: () => [],
        getDangerZone: () => 'safe',
        countRestrictedGoods: () => 0,
        emit: vi.fn(),
        markDirty: vi.fn(),
        isTestEnvironment: true,
      });

      const result = manager.resolveInspectionCooperate(0.99);

      expect(result.description.toLowerCase()).toMatch(
        /checks out|clean|clear|approv/
      );
    });
  });
});
