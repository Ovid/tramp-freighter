import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { SHIP_CONFIG, EVENT_NAMES } from '@game/constants.js';
import { sanitizeShipName } from '../../src/game/utils/string-utils.js';

describe('ShipManager', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Ship Name', () => {
    it('sanitizeShipName returns default for empty string', () => {
      const result = sanitizeShipName('');
      expect(result).toBe(SHIP_CONFIG.DEFAULT_NAME);
    });

    it('sanitizeShipName returns default for whitespace-only', () => {
      const result = sanitizeShipName('   ');
      expect(result).toBe(SHIP_CONFIG.DEFAULT_NAME);
    });

    it('sanitizeShipName strips HTML tags', () => {
      const result = sanitizeShipName('<script>alert("x")</script>MyShip');
      expect(result).toBe('alert("x")MyShip');
    });

    it('sanitizeShipName limits length to MAX_NAME_LENGTH', () => {
      const longName = 'A'.repeat(SHIP_CONFIG.MAX_NAME_LENGTH + 20);
      const result = sanitizeShipName(longName);
      expect(result.length).toBe(SHIP_CONFIG.MAX_NAME_LENGTH);
    });

    it('sanitizeShipName trims whitespace', () => {
      const result = sanitizeShipName('  Rusty Bucket  ');
      expect(result).toBe('Rusty Bucket');
    });

    it('updateShipName updates state and emits event', () => {
      const events = [];
      gsm.eventSystemManager.subscribe(EVENT_NAMES.SHIP_NAME_CHANGED, (name) =>
        events.push(name)
      );

      gsm.shipManager.updateShipName('Nebula Runner');

      const state = gsm.getState();
      expect(state.ship.name).toBe('Nebula Runner');
      expect(events).toHaveLength(1);
      expect(events[0]).toBe('Nebula Runner');
    });
  });

  describe('Quirks', () => {
    it('assignShipQuirks returns 2-3 quirks', () => {
      const quirks = gsm.shipManager.assignShipQuirks();
      expect(quirks.length).toBeGreaterThanOrEqual(2);
      expect(quirks.length).toBeLessThanOrEqual(3);
    });

    it('assignShipQuirks returns unique quirk IDs', () => {
      const quirks = gsm.shipManager.assignShipQuirks();
      const uniqueSet = new Set(quirks);
      expect(uniqueSet.size).toBe(quirks.length);
    });

    it('assignShipQuirks respects provided RNG', () => {
      // Cycle through different values so pickRandomFrom picks unique quirks
      let callCount = 0;
      const values = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8];
      const deterministicRng = () => {
        const val = values[callCount % values.length];
        callCount++;
        return val;
      };

      // First call (0.1 < 0.5) means count = 2
      const quirks = gsm.shipManager.assignShipQuirks(deterministicRng);
      expect(quirks).toHaveLength(2);
      expect(callCount).toBeGreaterThan(0);
    });

    it('applyQuirkModifiers applies multiplicatively', () => {
      // fuel_sipper: fuelConsumption 0.85, hot_thruster: fuelConsumption 1.05
      const baseValue = 100;
      const result = gsm.shipManager.applyQuirkModifiers(
        baseValue,
        'fuelConsumption',
        ['fuel_sipper', 'hot_thruster']
      );
      const expected = 100 * 0.85 * 1.05;
      expect(result).toBeCloseTo(expected);
    });

    it('applyQuirkModifiers ignores quirks without matching attribute', () => {
      // sticky_seal has loadingTime and theftRisk effects, but not fuelConsumption
      const baseValue = 100;
      const result = gsm.shipManager.applyQuirkModifiers(
        baseValue,
        'fuelConsumption',
        ['sticky_seal']
      );
      expect(result).toBe(100);
    });

    it('applyQuirkModifiers throws on invalid quirk ID', () => {
      expect(() => {
        gsm.shipManager.applyQuirkModifiers(100, 'fuelConsumption', [
          'nonexistent_quirk',
        ]);
      }).toThrow('Invalid quirk ID');
    });

    it('getQuirkDefinition returns definition for valid ID', () => {
      const def = gsm.shipManager.getQuirkDefinition('fuel_sipper');
      expect(def).not.toBeNull();
      expect(def.name).toBe('Fuel Sipper');
      expect(def.effects.fuelConsumption).toBe(0.85);
    });

    it('getQuirkDefinition returns null for invalid ID', () => {
      const def = gsm.shipManager.getQuirkDefinition('nonexistent');
      expect(def).toBeNull();
    });

    it('addQuirk adds quirk and emits event', () => {
      const state = gsm.getState();
      // Clear existing quirks so we can add a known one
      state.ship.quirks = [];

      const events = [];
      gsm.eventSystemManager.subscribe(EVENT_NAMES.QUIRKS_CHANGED, (quirks) =>
        events.push(quirks)
      );

      const result = gsm.shipManager.addQuirk('fuel_sipper');
      expect(result.success).toBe(true);
      expect(state.ship.quirks).toContain('fuel_sipper');
      expect(events).toHaveLength(1);
    });

    it('addQuirk rejects duplicate', () => {
      const state = gsm.getState();
      state.ship.quirks = ['fuel_sipper'];

      const result = gsm.shipManager.addQuirk('fuel_sipper');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Quirk already installed');
    });

    it('addQuirk rejects unknown quirk', () => {
      const result = gsm.shipManager.addQuirk('totally_fake_quirk');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Unknown quirk');
    });

    it('removeQuirk removes and emits event', () => {
      const state = gsm.getState();
      state.ship.quirks = ['leaky_seals', 'hot_thruster'];

      const events = [];
      gsm.eventSystemManager.subscribe(EVENT_NAMES.QUIRKS_CHANGED, (quirks) =>
        events.push(quirks)
      );

      const result = gsm.shipManager.removeQuirk('leaky_seals');
      expect(result.success).toBe(true);
      expect(state.ship.quirks).not.toContain('leaky_seals');
      expect(state.ship.quirks).toContain('hot_thruster');
      expect(events).toHaveLength(1);
    });

    it('removeQuirk rejects if not installed', () => {
      const state = gsm.getState();
      state.ship.quirks = [];

      const result = gsm.shipManager.removeQuirk('fuel_sipper');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Quirk not installed');
    });
  });

  describe('Ship Condition', () => {
    it('updateShipCondition clamps values to [0, 100]', () => {
      gsm.shipManager.updateShipCondition(150, -20, 200);

      const state = gsm.getState();
      expect(state.ship.hull).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
      expect(state.ship.engine).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MIN);
      expect(state.ship.lifeSupport).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
    });

    it('updateShipCondition emits SHIP_CONDITION_CHANGED', () => {
      const events = [];
      gsm.eventSystemManager.subscribe(
        EVENT_NAMES.SHIP_CONDITION_CHANGED,
        (data) => events.push(data)
      );

      gsm.shipManager.updateShipCondition(80, 70, 60);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        hull: 80,
        engine: 70,
        lifeSupport: 60,
      });
    });

    it('checkConditionWarnings returns hull warning when below 50', () => {
      gsm.shipManager.updateShipCondition(49, 100, 100);

      const warnings = gsm.shipManager.checkConditionWarnings();
      const hullWarning = warnings.find((w) => w.system === 'hull');
      expect(hullWarning).toBeDefined();
      expect(hullWarning.severity).toBe('warning');
    });

    it('checkConditionWarnings returns engine warning when below 30', () => {
      gsm.shipManager.updateShipCondition(100, 29, 100);

      const warnings = gsm.shipManager.checkConditionWarnings();
      const engineWarning = warnings.find((w) => w.system === 'engine');
      expect(engineWarning).toBeDefined();
      expect(engineWarning.severity).toBe('warning');
    });

    it('checkConditionWarnings returns lifeSupport warning when below 20', () => {
      gsm.shipManager.updateShipCondition(100, 100, 19);

      const warnings = gsm.shipManager.checkConditionWarnings();
      const lsWarning = warnings.find((w) => w.system === 'lifeSupport');
      expect(lsWarning).toBeDefined();
      expect(lsWarning.severity).toBe('critical');
    });

    it('checkConditionWarnings returns empty array when all healthy', () => {
      gsm.shipManager.updateShipCondition(100, 100, 100);

      const warnings = gsm.shipManager.checkConditionWarnings();
      expect(warnings).toHaveLength(0);
    });

    it('getShipCondition returns current values', () => {
      gsm.shipManager.updateShipCondition(75, 60, 45);

      const condition = gsm.shipManager.getShipCondition();
      expect(condition).toEqual({
        hull: 75,
        engine: 60,
        lifeSupport: 45,
      });
    });
  });

  describe('Upgrades', () => {
    it('validateUpgradePurchase - valid purchase', () => {
      const state = gsm.getState();
      state.player.credits = 10000;
      state.ship.upgrades = [];

      const result = gsm.shipManager.validateUpgradePurchase('extended_tank');
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('');
    });

    it('validateUpgradePurchase - unknown upgrade', () => {
      const result = gsm.shipManager.validateUpgradePurchase('warp_drive_9000');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Unknown upgrade');
    });

    it('validateUpgradePurchase - already installed', () => {
      const state = gsm.getState();
      state.ship.upgrades = ['extended_tank'];

      const result = gsm.shipManager.validateUpgradePurchase('extended_tank');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Already installed');
    });

    it('validateUpgradePurchase - insufficient credits', () => {
      const state = gsm.getState();
      state.player.credits = 1;
      state.ship.upgrades = [];

      const result = gsm.shipManager.validateUpgradePurchase('extended_tank');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient credits');
    });

    it('purchaseUpgrade deducts credits and installs', () => {
      const state = gsm.getState();
      state.player.credits = 10000;
      state.ship.upgrades = [];

      const result = gsm.shipManager.purchaseUpgrade('extended_tank');
      expect(result.success).toBe(true);

      expect(state.player.credits).toBe(
        10000 - SHIP_CONFIG.UPGRADES.extended_tank.cost
      );
      expect(state.ship.upgrades).toContain('extended_tank');
    });

    it('purchaseUpgrade emits UPGRADES_CHANGED', () => {
      const state = gsm.getState();
      state.player.credits = 10000;
      state.ship.upgrades = [];

      const events = [];
      gsm.eventSystemManager.subscribe(
        EVENT_NAMES.UPGRADES_CHANGED,
        (upgrades) => events.push(upgrades)
      );

      gsm.shipManager.purchaseUpgrade('extended_tank');

      expect(events).toHaveLength(1);
      expect(events[0]).toContain('extended_tank');
    });

    it('calculateShipCapabilities with no upgrades returns base values', () => {
      const state = gsm.getState();
      state.ship.upgrades = [];

      const capabilities = gsm.shipManager.calculateShipCapabilities();

      expect(capabilities.fuelCapacity).toBe(SHIP_CONFIG.FUEL_CAPACITY);
      expect(capabilities.cargoCapacity).toBe(50);
      expect(capabilities.fuelConsumption).toBe(1.0);
      expect(capabilities.hullDegradation).toBe(1.0);
      expect(capabilities.lifeSupportDrain).toBe(1.0);
      expect(capabilities.hiddenCargoCapacity).toBe(0);
    });

    it('calculateShipCapabilities with expanded_hold increases cargo', () => {
      const state = gsm.getState();
      state.ship.upgrades = ['expanded_hold'];

      const capabilities = gsm.shipManager.calculateShipCapabilities();

      // Base 50 + expanded_hold effect 75 = 125
      expect(capabilities.cargoCapacity).toBe(
        50 + SHIP_CONFIG.UPGRADES.expanded_hold.effects.cargoCapacity
      );
    });

    it('getFuelCapacity returns 100 base, 250 with extended_tank', () => {
      const state = gsm.getState();
      state.ship.upgrades = [];

      expect(gsm.shipManager.getFuelCapacity()).toBe(100);

      state.ship.upgrades = ['extended_tank'];

      // Base 100 + extended_tank adds 150 = 250
      expect(gsm.shipManager.getFuelCapacity()).toBe(250);
    });
  });

  describe('Hidden Cargo', () => {
    it('moveToHiddenCargo succeeds with smuggler_panels installed', () => {
      const state = gsm.getState();
      state.ship.upgrades = ['smuggler_panels'];
      state.ship.hiddenCargoCapacity = 10;
      // Ensure cargo has grain
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 20,
          buyPrice: 10,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 0,
        },
      ];
      state.ship.hiddenCargo = [];

      const result = gsm.shipManager.moveToHiddenCargo('grain', 5);
      expect(result.success).toBe(true);

      // 5 units moved out of regular cargo
      const grainInCargo = state.ship.cargo.find((s) => s.good === 'grain');
      expect(grainInCargo.qty).toBe(15);

      // 5 units now in hidden cargo
      const grainInHidden = state.ship.hiddenCargo.find(
        (s) => s.good === 'grain'
      );
      expect(grainInHidden.qty).toBe(5);
    });

    it('moveToHiddenCargo fails without hidden cargo capacity', () => {
      const state = gsm.getState();
      state.ship.upgrades = [];
      state.ship.hiddenCargo = [];
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 20,
          buyPrice: 10,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 0,
        },
      ];

      const result = gsm.shipManager.moveToHiddenCargo('grain', 5);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough hidden cargo space');
    });

    it('moveToHiddenCargo fails if good not in cargo', () => {
      const state = gsm.getState();
      state.ship.upgrades = ['smuggler_panels'];
      state.ship.hiddenCargo = [];
      state.ship.cargo = [];

      const result = gsm.shipManager.moveToHiddenCargo('electronics', 5);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Good not found in cargo');
    });

    it('moveToRegularCargo succeeds', () => {
      const state = gsm.getState();
      state.ship.upgrades = [];
      state.ship.cargoCapacity = 50;
      state.ship.cargo = [];
      state.ship.hiddenCargo = [
        {
          good: 'ore',
          qty: 5,
          buyPrice: 15,
          buySystem: 1,
          buySystemName: 'Alpha Centauri',
          buyDate: 1,
        },
      ];

      const result = gsm.shipManager.moveToRegularCargo('ore', 3);
      expect(result.success).toBe(true);

      // 3 units moved to regular cargo
      const oreInCargo = state.ship.cargo.find((s) => s.good === 'ore');
      expect(oreInCargo.qty).toBe(3);

      // 2 units remain in hidden cargo
      const oreInHidden = state.ship.hiddenCargo.find((s) => s.good === 'ore');
      expect(oreInHidden.qty).toBe(2);
    });

    it('moveToRegularCargo fails if not enough space', () => {
      const state = gsm.getState();
      state.ship.upgrades = [];
      state.ship.cargoCapacity = 5;
      // Fill regular cargo to capacity
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 5,
          buyPrice: 10,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 0,
        },
      ];
      state.ship.hiddenCargo = [
        {
          good: 'ore',
          qty: 10,
          buyPrice: 15,
          buySystem: 1,
          buySystemName: 'Alpha Centauri',
          buyDate: 1,
        },
      ];

      const result = gsm.shipManager.moveToRegularCargo('ore', 3);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough regular cargo space');
    });
  });

  describe('removeCargoForMission', () => {
    it('removes from end of cargo array first', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 8,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 0,
        },
        {
          good: 'grain',
          qty: 5,
          buyPrice: 12,
          buySystem: 1,
          buySystemName: 'Alpha Centauri',
          buyDate: 3,
        },
      ];

      const result = gsm.shipManager.removeCargoForMission('grain', 5);
      expect(result.success).toBe(true);

      // The second stack (index 1, buyPrice 12) should be fully consumed first
      // since removeCargoForMission iterates from end
      expect(state.ship.cargo).toHaveLength(1);
      expect(state.ship.cargo[0].qty).toBe(10);
      expect(state.ship.cargo[0].buyPrice).toBe(8);
    });

    it('returns failure if not enough quantity', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 3,
          buyPrice: 10,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 0,
        },
      ];

      const result = gsm.shipManager.removeCargoForMission('grain', 50);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Not enough');
    });
  });
});
