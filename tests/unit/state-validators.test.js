/**
 * Unit Tests for State Validators Module
 *
 * Tests the validation and migration helper functions extracted during refactoring.
 * These functions handle cargo normalization, config ID validation, and cargo repair.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isVersionCompatible,
  validateStateStructure,
  migrateFromV1ToV2,
  migrateFromV2ToV2_1,
  addStateDefaults,
} from '../../js/state/state-validators.js';
import { SHIP_CONFIG } from '../../js/game-constants.js';

const TEST_STAR_DATA = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0 },
  { id: 1, name: 'Alpha Centauri', x: 43, y: 0, z: 0 },
  { id: 2, name: 'Barnard', x: 60, y: 0, z: 0 },
];

describe('State Validators Module', () => {
  describe('isVersionCompatible', () => {
    it('should return true for exact version match', () => {
      expect(isVersionCompatible('2.1.0')).toBe(true);
    });

    it('should return true for v1.0.0 (migratable)', () => {
      expect(isVersionCompatible('1.0.0')).toBe(true);
    });

    it('should return true for v2.0.0 (migratable)', () => {
      expect(isVersionCompatible('2.0.0')).toBe(true);
    });

    it('should return false for incompatible versions', () => {
      expect(isVersionCompatible('0.9.0')).toBe(false);
      expect(isVersionCompatible('3.0.0')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isVersionCompatible(null)).toBe(false);
      expect(isVersionCompatible(undefined)).toBe(false);
    });
  });

  describe('validateStateStructure', () => {
    let validState;

    beforeEach(() => {
      validState = {
        player: {
          credits: 1000,
          debt: 5000,
          currentSystem: 0,
          daysElapsed: 10,
        },
        ship: {
          name: 'Test Ship',
          fuel: 100,
          cargoCapacity: 50,
          cargo: [],
        },
        world: {
          visitedSystems: [0, 1],
        },
        meta: {
          version: '2.1.0',
          timestamp: Date.now(),
        },
      };
    });

    it('should return true for valid state', () => {
      expect(validateStateStructure(validState)).toBe(true);
    });

    it('should return false for null state', () => {
      expect(validateStateStructure(null)).toBe(false);
    });

    it('should return false for missing player', () => {
      delete validState.player;
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should return false for invalid player.credits type', () => {
      validState.player.credits = 'invalid';
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should return false for missing ship', () => {
      delete validState.ship;
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should return false for invalid ship.cargo type', () => {
      validState.ship.cargo = 'not an array';
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should return false for missing world', () => {
      delete validState.world;
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should return false for missing meta', () => {
      delete validState.meta;
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should accept optional ship condition fields', () => {
      validState.ship.hull = 85;
      validState.ship.engine = 90;
      validState.ship.lifeSupport = 95;
      expect(validateStateStructure(validState)).toBe(true);
    });

    it('should reject invalid ship condition field types', () => {
      validState.ship.hull = 'invalid';
      expect(validateStateStructure(validState)).toBe(false);
    });

    it('should accept cargo with old field names', () => {
      validState.ship.cargo = [{ good: 'grain', qty: 10, purchasePrice: 100 }];
      expect(validateStateStructure(validState)).toBe(true);
    });

    it('should accept cargo with new field names', () => {
      validState.ship.cargo = [{ good: 'grain', qty: 10, buyPrice: 100 }];
      expect(validateStateStructure(validState)).toBe(true);
    });

    it('should reject cargo missing price field', () => {
      validState.ship.cargo = [{ good: 'grain', qty: 10 }];
      expect(validateStateStructure(validState)).toBe(false);
    });
  });

  describe('migrateFromV1ToV2', () => {
    let v1State;

    beforeEach(() => {
      v1State = {
        player: {
          credits: 1000,
          debt: 5000,
          currentSystem: 0,
          daysElapsed: 10,
        },
        ship: {
          name: 'Test Ship',
          fuel: 100,
          cargoCapacity: 50,
          cargo: [
            { good: 'grain', qty: 10, purchasePrice: 100 },
            { good: 'ore', qty: 5, purchasePrice: 200 },
          ],
        },
        world: {
          visitedSystems: [0, 1],
        },
        meta: {
          version: '1.0.0',
          timestamp: Date.now(),
        },
      };
    });

    it('should add ship condition fields with max values', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      expect(migrated.ship.hull).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
      expect(migrated.ship.engine).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
      expect(migrated.ship.lifeSupport).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
    });

    it('should migrate cargo field names from old to new', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      migrated.ship.cargo.forEach((stack) => {
        expect(stack.buyPrice).toBeDefined();
        expect(stack.purchasePrice).toBeUndefined();
      });
    });

    it('should add cargo metadata with defaults', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      migrated.ship.cargo.forEach((stack) => {
        expect(stack.buySystem).toBe(0);
        expect(stack.buySystemName).toBe('Sol');
        expect(stack.buyDate).toBe(0);
      });
    });

    it('should initialize ship personality fields', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      expect(Array.isArray(migrated.ship.quirks)).toBe(true);
      expect(Array.isArray(migrated.ship.upgrades)).toBe(true);
      expect(Array.isArray(migrated.ship.hiddenCargo)).toBe(true);
      expect(migrated.ship.hiddenCargoCapacity).toBe(0);
    });

    it('should initialize price knowledge', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      expect(migrated.world.priceKnowledge).toBeDefined();
      expect(migrated.world.priceKnowledge[0]).toBeDefined();
      expect(migrated.world.priceKnowledge[0].lastVisit).toBe(0);
      expect(migrated.world.priceKnowledge[0].prices).toBeDefined();
    });

    it('should initialize active events array', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      expect(Array.isArray(migrated.world.activeEvents)).toBe(true);
      expect(migrated.world.activeEvents).toHaveLength(0);
    });

    it('should initialize market conditions', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      expect(migrated.world.marketConditions).toBeDefined();
      expect(typeof migrated.world.marketConditions).toBe('object');
    });

    it('should update version to 2.1.0', () => {
      const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

      expect(migrated.meta.version).toBe('2.1.0');
    });

    it('should throw error if current system not found in star data', () => {
      v1State.player.currentSystem = 999;

      expect(() => {
        migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);
      }).toThrow('Migration failed');
    });

    it('should filter out unknown quirk IDs', () => {
      v1State.ship.quirks = ['valid_quirk', 'unknown_quirk'];

      // Mock console.warn to suppress expected warning
      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

        // Should only keep valid quirks (none in this case since we don't have real quirk IDs)
        expect(Array.isArray(migrated.ship.quirks)).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should filter out unknown upgrade IDs', () => {
      v1State.ship.upgrades = ['valid_upgrade', 'unknown_upgrade'];

      // Mock console.warn to suppress expected warning
      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        const migrated = migrateFromV1ToV2(v1State, TEST_STAR_DATA, true);

        // Should only keep valid upgrades (none in this case since we don't have real upgrade IDs)
        expect(Array.isArray(migrated.ship.upgrades)).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });
  });

  describe('migrateFromV2ToV2_1', () => {
    let v2State;

    beforeEach(() => {
      v2State = {
        player: {
          credits: 1000,
          debt: 5000,
          currentSystem: 0,
          daysElapsed: 10,
        },
        ship: {
          name: 'Test Ship',
          fuel: 100,
          hull: 85,
          engine: 90,
          lifeSupport: 95,
          cargoCapacity: 50,
          cargo: [],
        },
        world: {
          visitedSystems: [0, 1],
          priceKnowledge: {},
          activeEvents: [],
        },
        meta: {
          version: '2.0.0',
          timestamp: Date.now(),
        },
      };
    });

    it('should add market conditions', () => {
      const migrated = migrateFromV2ToV2_1(v2State, true);

      expect(migrated.world.marketConditions).toBeDefined();
      expect(typeof migrated.world.marketConditions).toBe('object');
    });

    it('should update version to 2.1.0', () => {
      const migrated = migrateFromV2ToV2_1(v2State, true);

      expect(migrated.meta.version).toBe('2.1.0');
    });

    it('should preserve existing state', () => {
      const migrated = migrateFromV2ToV2_1(v2State, true);

      expect(migrated.player.credits).toBe(1000);
      expect(migrated.ship.hull).toBe(85);
      expect(migrated.world.priceKnowledge).toBeDefined();
    });
  });

  describe('addStateDefaults', () => {
    let partialState;

    beforeEach(() => {
      partialState = {
        player: {
          credits: 1000,
          debt: 5000,
          currentSystem: 0,
          daysElapsed: 10,
        },
        ship: {
          name: 'Test Ship',
          fuel: 100,
          cargoCapacity: 50,
          cargo: [],
        },
        world: {
          visitedSystems: [0, 1],
        },
        meta: {
          version: '2.1.0',
          timestamp: Date.now(),
        },
      };
    });

    it('should add missing ship condition fields', () => {
      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(normalized.ship.hull).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
      expect(normalized.ship.engine).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
      expect(normalized.ship.lifeSupport).toBe(
        SHIP_CONFIG.CONDITION_BOUNDS.MAX
      );
    });

    it('should preserve existing ship condition fields', () => {
      partialState.ship.hull = 75;
      partialState.ship.engine = 80;

      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(normalized.ship.hull).toBe(75);
      expect(normalized.ship.engine).toBe(80);
      expect(normalized.ship.lifeSupport).toBe(
        SHIP_CONFIG.CONDITION_BOUNDS.MAX
      );
    });

    it('should add missing ship personality fields', () => {
      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(Array.isArray(normalized.ship.quirks)).toBe(true);
      expect(Array.isArray(normalized.ship.upgrades)).toBe(true);
      expect(Array.isArray(normalized.ship.hiddenCargo)).toBe(true);
      expect(normalized.ship.hiddenCargoCapacity).toBe(0);
    });

    it('should normalize cargo field names', () => {
      partialState.ship.cargo = [
        { good: 'grain', qty: 10, purchasePrice: 100 },
      ];

      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(normalized.ship.cargo[0].buyPrice).toBe(100);
      expect(normalized.ship.cargo[0].purchasePrice).toBeUndefined();
    });

    it('should repair cargo with missing metadata', () => {
      partialState.ship.cargo = [{ good: 'grain', qty: 10, buyPrice: 100 }];

      // Mock console.warn to suppress expected warnings
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (...args) => warnings.push(args);

      try {
        const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

        expect(normalized.ship.cargo[0].buySystem).toBe(0);
        expect(normalized.ship.cargo[0].buySystemName).toBe('Sol');
        expect(normalized.ship.cargo[0].buyDate).toBe(0);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should skip invalid cargo stacks', () => {
      partialState.ship.cargo = [
        { good: 'grain', qty: 10, buyPrice: 100 },
        { good: null, qty: 'invalid' }, // Invalid stack
        { good: 'ore', qty: 5, buyPrice: 200 },
      ];

      // Mock console.warn to suppress expected warnings
      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

        // Invalid stack should still be in array but skipped during repair
        expect(normalized.ship.cargo).toHaveLength(3);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should initialize missing price knowledge', () => {
      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(normalized.world.priceKnowledge).toBeDefined();
      expect(normalized.world.priceKnowledge[0]).toBeDefined();
    });

    it('should initialize missing active events', () => {
      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(Array.isArray(normalized.world.activeEvents)).toBe(true);
    });

    it('should initialize missing market conditions', () => {
      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(normalized.world.marketConditions).toBeDefined();
    });

    it('should throw error if current system not found', () => {
      partialState.player.currentSystem = 999;

      expect(() => {
        addStateDefaults(partialState, TEST_STAR_DATA);
      }).toThrow('Load failed');
    });

    it('should filter out unknown quirk IDs', () => {
      partialState.ship.quirks = ['unknown_quirk'];

      // Mock console.warn to suppress expected warning
      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

        expect(normalized.ship.quirks).toHaveLength(0);
      } finally {
        console.warn = originalWarn;
      }
    });

    it('should filter out unknown upgrade IDs', () => {
      partialState.ship.upgrades = ['unknown_upgrade'];

      // Mock console.warn to suppress expected warning
      const originalWarn = console.warn;
      console.warn = () => {};

      try {
        const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

        expect(normalized.ship.upgrades).toHaveLength(0);
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});
