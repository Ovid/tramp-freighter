import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('ShipManager coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addUpgrade', () => {
    it('returns failure for unknown upgrade', () => {
      const result = gsm.shipManager.addUpgrade('fake_upgrade');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Unknown upgrade');
    });

    it('returns failure for already installed upgrade', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [upgradeId];
      const result = gsm.shipManager.addUpgrade(upgradeId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Upgrade already installed');
    });

    it('installs upgrade and updates capabilities', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [];
      const result = gsm.shipManager.addUpgrade(upgradeId);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.upgrades).toContain(upgradeId);
    });
  });

  describe('removeUpgrade', () => {
    it('returns failure for upgrade not installed', () => {
      gsm.state.ship.upgrades = [];
      const result = gsm.shipManager.removeUpgrade('fake_upgrade');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Upgrade not installed');
    });

    it('removes installed upgrade', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [upgradeId];
      const result = gsm.shipManager.removeUpgrade(upgradeId);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.upgrades).not.toContain(upgradeId);
    });
  });

  describe('purchaseUpgrade', () => {
    it('returns failure for unknown upgrade', () => {
      const result = gsm.shipManager.purchaseUpgrade('fake_upgrade');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Unknown upgrade');
    });

    it('returns failure for already installed upgrade', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [upgradeId];
      const result = gsm.shipManager.purchaseUpgrade(upgradeId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Already installed');
    });

    it('returns failure for insufficient credits', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [];
      gsm.state.player.credits = 0;
      const result = gsm.shipManager.purchaseUpgrade(upgradeId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Insufficient credits');
    });

    it('deducts credits and installs upgrade on success', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
      gsm.state.ship.upgrades = [];
      gsm.state.player.credits = upgrade.cost + 1000;
      const creditsBefore = gsm.state.player.credits;
      const result = gsm.shipManager.purchaseUpgrade(upgradeId);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.upgrades).toContain(upgradeId);
      expect(gsm.state.player.credits).toBe(creditsBefore - upgrade.cost);
    });
  });

  describe('moveToHiddenCargo', () => {
    beforeEach(() => {
      gsm.state.ship.cargo = [
        { good: 'electronics', qty: 10, buyPrice: 200 },
      ];
      gsm.state.ship.hiddenCargo = [];
      // Install smuggling compartment for hidden cargo capacity
      const smugglingUpgrade = Object.entries(SHIP_CONFIG.UPGRADES).find(
        ([, u]) => u.effects.hiddenCargoCapacity > 0
      );
      if (smugglingUpgrade) {
        gsm.state.ship.upgrades = [smugglingUpgrade[0]];
      }
    });

    it('returns failure when good not found in cargo', () => {
      const result = gsm.shipManager.moveToHiddenCargo('grain', 5);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Good not found in cargo');
    });

    it('returns failure when quantity exceeds available', () => {
      const result = gsm.shipManager.moveToHiddenCargo('electronics', 20);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough quantity in cargo');
    });

    it('returns failure when hidden cargo is full', () => {
      // Fill hidden cargo capacity
      const capabilities = gsm.shipManager.calculateShipCapabilities();
      gsm.state.ship.hiddenCargo = [
        { good: 'ore', qty: capabilities.hiddenCargoCapacity, buyPrice: 100 },
      ];
      const result = gsm.shipManager.moveToHiddenCargo('electronics', 1);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough hidden cargo space');
    });

    it('moves cargo to hidden compartment', () => {
      const capabilities = gsm.shipManager.calculateShipCapabilities();
      if (capabilities.hiddenCargoCapacity > 0) {
        const result = gsm.shipManager.moveToHiddenCargo('electronics', 3);
        expect(result.success).toBe(true);
        expect(gsm.state.ship.cargo[0].qty).toBe(7);
        expect(gsm.state.ship.hiddenCargo).toHaveLength(1);
        expect(gsm.state.ship.hiddenCargo[0].qty).toBe(3);
      }
    });

    it('removes cargo stack when fully moved', () => {
      const capabilities = gsm.shipManager.calculateShipCapabilities();
      if (capabilities.hiddenCargoCapacity >= 10) {
        const result = gsm.shipManager.moveToHiddenCargo('electronics', 10);
        expect(result.success).toBe(true);
        expect(gsm.state.ship.cargo).toHaveLength(0);
      }
    });
  });

  describe('moveToRegularCargo', () => {
    beforeEach(() => {
      gsm.state.ship.cargo = [];
      gsm.state.ship.hiddenCargo = [
        { good: 'electronics', qty: 5, buyPrice: 200 },
      ];
    });

    it('returns failure when good not found in hidden cargo', () => {
      const result = gsm.shipManager.moveToRegularCargo('grain', 5);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Good not found in hidden cargo');
    });

    it('returns failure when quantity exceeds available', () => {
      const result = gsm.shipManager.moveToRegularCargo('electronics', 20);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough quantity in hidden cargo');
    });

    it('returns failure when regular cargo is full', () => {
      gsm.state.ship.cargo = [
        { good: 'ore', qty: gsm.state.ship.cargoCapacity, buyPrice: 100 },
      ];
      const result = gsm.shipManager.moveToRegularCargo('electronics', 1);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not enough regular cargo space');
    });

    it('moves cargo from hidden to regular', () => {
      const result = gsm.shipManager.moveToRegularCargo('electronics', 3);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.hiddenCargo[0].qty).toBe(2);
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].qty).toBe(3);
    });

    it('removes hidden cargo stack when fully moved', () => {
      const result = gsm.shipManager.moveToRegularCargo('electronics', 5);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.hiddenCargo).toHaveLength(0);
    });

    it('consolidates into existing regular cargo stack', () => {
      gsm.state.ship.cargo = [
        { good: 'electronics', qty: 3, buyPrice: 200 },
      ];
      const result = gsm.shipManager.moveToRegularCargo('electronics', 2);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.cargo).toHaveLength(1);
      expect(gsm.state.ship.cargo[0].qty).toBe(5);
    });
  });

  describe('calculateShipCapabilities', () => {
    it('returns base capabilities with no upgrades', () => {
      gsm.state.ship.upgrades = [];
      const caps = gsm.shipManager.calculateShipCapabilities();
      expect(caps.fuelCapacity).toBe(SHIP_CONFIG.FUEL_CAPACITY);
      expect(caps.fuelConsumption).toBe(1.0);
      expect(caps.hullDegradation).toBe(1.0);
      expect(caps.lifeSupportDrain).toBe(1.0);
      expect(caps.hiddenCargoCapacity).toBe(0);
    });

    it('warns for unknown upgrade ID', () => {
      gsm.state.ship.upgrades = ['nonexistent_upgrade'];
      const warnSpy = vi.spyOn(gsm.shipManager, 'warn');
      gsm.shipManager.calculateShipCapabilities();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('removeCargoForMission', () => {
    it('returns failure when not enough cargo', () => {
      gsm.state.ship.cargo = [{ good: 'ore', qty: 3, buyPrice: 100 }];
      const result = gsm.shipManager.removeCargoForMission('ore', 10);
      expect(result.success).toBe(false);
    });

    it('removes cargo across multiple stacks', () => {
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 100 },
        { good: 'grain', qty: 10, buyPrice: 50 },
        { good: 'ore', qty: 5, buyPrice: 200 },
      ];
      const result = gsm.shipManager.removeCargoForMission('ore', 8);
      expect(result.success).toBe(true);
      const oreRemaining = gsm.state.ship.cargo
        .filter((c) => c.good === 'ore')
        .reduce((sum, c) => sum + c.qty, 0);
      expect(oreRemaining).toBe(2);
    });

    it('removes stacks entirely when depleted', () => {
      gsm.state.ship.cargo = [
        { good: 'ore', qty: 5, buyPrice: 100 },
      ];
      const result = gsm.shipManager.removeCargoForMission('ore', 5);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.cargo).toHaveLength(0);
    });
  });

  describe('addQuirk', () => {
    it('returns failure for unknown quirk', () => {
      const result = gsm.shipManager.addQuirk('fake_quirk');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Unknown quirk');
    });

    it('returns failure for duplicate quirk', () => {
      const quirkId = Object.keys(SHIP_CONFIG.QUIRKS)[0];
      gsm.state.ship.quirks = [quirkId];
      const result = gsm.shipManager.addQuirk(quirkId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Quirk already installed');
    });

    it('adds valid quirk', () => {
      const quirkId = Object.keys(SHIP_CONFIG.QUIRKS)[0];
      gsm.state.ship.quirks = [];
      const result = gsm.shipManager.addQuirk(quirkId);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.quirks).toContain(quirkId);
    });
  });

  describe('removeQuirk', () => {
    it('returns failure for quirk not installed', () => {
      gsm.state.ship.quirks = [];
      const result = gsm.shipManager.removeQuirk('fake');
      expect(result.success).toBe(false);
    });

    it('removes installed quirk', () => {
      const quirkId = Object.keys(SHIP_CONFIG.QUIRKS)[0];
      gsm.state.ship.quirks = [quirkId];
      const result = gsm.shipManager.removeQuirk(quirkId);
      expect(result.success).toBe(true);
      expect(gsm.state.ship.quirks).not.toContain(quirkId);
    });
  });

  describe('clearHiddenCargo', () => {
    it('clears hidden cargo array', () => {
      gsm.state.ship.hiddenCargo = [{ good: 'ore', qty: 5 }];
      gsm.shipManager.clearHiddenCargo();
      expect(gsm.state.ship.hiddenCargo).toEqual([]);
    });
  });

  describe('getHiddenCargo', () => {
    it('returns hidden cargo array', () => {
      gsm.state.ship.hiddenCargo = [{ good: 'ore', qty: 5 }];
      expect(gsm.shipManager.getHiddenCargo()).toEqual([{ good: 'ore', qty: 5 }]);
    });
  });

  describe('updateShipName', () => {
    it('sets sanitized ship name', () => {
      gsm.shipManager.updateShipName('  My Ship  ');
      expect(gsm.state.ship.name).toBe('My Ship');
    });
  });

  describe('getQuirkDefinition', () => {
    it('returns definition for valid quirk', () => {
      const quirkId = Object.keys(SHIP_CONFIG.QUIRKS)[0];
      const def = gsm.shipManager.getQuirkDefinition(quirkId);
      expect(def).toBeDefined();
      expect(def).toHaveProperty('effects');
    });

    it('returns null for unknown quirk', () => {
      expect(gsm.shipManager.getQuirkDefinition('fake')).toBeNull();
    });
  });

  describe('getUpgradeDefinition', () => {
    it('returns definition for valid upgrade', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      const def = gsm.shipManager.getUpgradeDefinition(upgradeId);
      expect(def).toBeDefined();
      expect(def).toHaveProperty('cost');
    });

    it('returns null for unknown upgrade', () => {
      expect(gsm.shipManager.getUpgradeDefinition('fake')).toBeNull();
    });
  });

  describe('validateUpgradePurchase', () => {
    it('returns invalid for unknown upgrade', () => {
      const result = gsm.shipManager.validateUpgradePurchase('fake');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for already installed', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [upgradeId];
      const result = gsm.shipManager.validateUpgradePurchase(upgradeId);
      expect(result.valid).toBe(false);
    });

    it('returns invalid for insufficient credits', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [];
      gsm.state.player.credits = 0;
      const result = gsm.shipManager.validateUpgradePurchase(upgradeId);
      expect(result.valid).toBe(false);
    });

    it('returns valid when all conditions met', () => {
      const upgradeId = Object.keys(SHIP_CONFIG.UPGRADES)[0];
      gsm.state.ship.upgrades = [];
      gsm.state.player.credits = 999999;
      const result = gsm.shipManager.validateUpgradePurchase(upgradeId);
      expect(result.valid).toBe(true);
    });
  });
});
