import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateUpgradePurchase,
  formatUpgradeEffects,
  getAvailableUpgrades,
  getInstalledUpgrades,
  calculateCreditsAfterPurchase,
} from '../../src/features/upgrades/upgradesUtils.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

/**
 * Property: Utility functions are pure
 *
 * Validates that upgrade utility functions are pure (no side effects, same inputs produce same outputs).
 *
 * React Migration Spec: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
describe('Property: Upgrade utility functions are pure', () => {
  it('validateUpgradePurchase should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        fc.integer({ min: 0, max: 100000 }),
        fc.array(fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)), {
          maxLength: 5,
        }),
        (upgradeId, credits, installedUpgrades) => {
          const state = {
            player: { credits },
            ship: { upgrades: installedUpgrades },
          };

          // Call function twice with same inputs
          const result1 = validateUpgradePurchase(upgradeId, state);
          const result2 = validateUpgradePurchase(upgradeId, state);

          // Results should be identical
          expect(result1).toEqual(result2);

          // State should not be modified
          expect(state.player.credits).toBe(credits);
          expect(state.ship.upgrades).toEqual(installedUpgrades);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateUpgradePurchase should not modify input state object', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        fc.integer({ min: 0, max: 100000 }),
        fc.array(fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)), {
          maxLength: 5,
        }),
        (upgradeId, credits, installedUpgrades) => {
          const state = {
            player: { credits },
            ship: { upgrades: [...installedUpgrades] },
          };

          // Create deep copy of state
          const stateCopy = JSON.parse(JSON.stringify(state));

          // Call function
          validateUpgradePurchase(upgradeId, state);

          // State should be unchanged
          expect(state).toEqual(stateCopy);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('validateUpgradePurchase should reject already installed upgrades', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        fc.integer({ min: 0, max: 100000 }),
        (upgradeId, credits) => {
          const state = {
            player: { credits },
            ship: { upgrades: [upgradeId] }, // Already installed
          };

          const result = validateUpgradePurchase(upgradeId, state);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('Upgrade already installed');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('validateUpgradePurchase should reject insufficient credits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
          const insufficientCredits = upgrade.cost - 1;

          const state = {
            player: { credits: insufficientCredits },
            ship: { upgrades: [] },
          };

          const result = validateUpgradePurchase(upgradeId, state);

          expect(result.valid).toBe(false);
          expect(result.reason).toBe('Insufficient credits');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('validateUpgradePurchase should accept valid purchases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
          const sufficientCredits = upgrade.cost;

          const state = {
            player: { credits: sufficientCredits },
            ship: { upgrades: [] },
          };

          const result = validateUpgradePurchase(upgradeId, state);

          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('formatUpgradeEffects should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
          const effects = upgrade.effects;

          // Call function twice with same inputs
          const result1 = formatUpgradeEffects(effects);
          const result2 = formatUpgradeEffects(effects);

          // Results should be identical
          expect(result1).toEqual(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatUpgradeEffects should return array of strings', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        (upgradeId) => {
          const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
          const result = formatUpgradeEffects(upgrade.effects);

          expect(Array.isArray(result)).toBe(true);
          result.forEach((item) => {
            expect(typeof item).toBe('string');
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('getAvailableUpgrades should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)), {
          maxLength: 5,
        }),
        (installedUpgrades) => {
          const state = {
            ship: { upgrades: installedUpgrades },
          };

          // Call function twice with same inputs
          const result1 = getAvailableUpgrades(state);
          const result2 = getAvailableUpgrades(state);

          // Results should be identical
          expect(result1).toEqual(result2);

          // State should not be modified
          expect(state.ship.upgrades).toEqual(installedUpgrades);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getAvailableUpgrades should exclude installed upgrades', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)), {
          minLength: 1,
          maxLength: 5,
        }),
        (installedUpgrades) => {
          const state = {
            ship: { upgrades: installedUpgrades },
          };

          const available = getAvailableUpgrades(state);

          // No installed upgrade should be in available list
          installedUpgrades.forEach((upgradeId) => {
            expect(available).not.toContain(upgradeId);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('getInstalledUpgrades should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)), {
          maxLength: 5,
        }),
        (installedUpgrades) => {
          const state = {
            ship: { upgrades: installedUpgrades },
          };

          // Call function twice with same inputs
          const result1 = getInstalledUpgrades(state);
          const result2 = getInstalledUpgrades(state);

          // Results should be identical
          expect(result1).toEqual(result2);

          // State should not be modified
          expect(state.ship.upgrades).toEqual(installedUpgrades);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateCreditsAfterPurchase should be pure - same inputs produce same outputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        fc.integer({ min: 0, max: 100000 }),
        (upgradeId, currentCredits) => {
          // Call function twice with same inputs
          const result1 = calculateCreditsAfterPurchase(
            upgradeId,
            currentCredits
          );
          const result2 = calculateCreditsAfterPurchase(
            upgradeId,
            currentCredits
          );

          // Results should be identical
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateCreditsAfterPurchase should return correct amount', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SHIP_CONFIG.UPGRADES)),
        fc.integer({ min: 1000, max: 100000 }),
        (upgradeId, currentCredits) => {
          const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
          const result = calculateCreditsAfterPurchase(
            upgradeId,
            currentCredits
          );

          expect(result).toBe(currentCredits - upgrade.cost);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('calculateCreditsAfterPurchase should handle invalid upgrade ID', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((id) => !SHIP_CONFIG.UPGRADES[id]),
        fc.integer({ min: 0, max: 100000 }),
        (invalidId, currentCredits) => {
          const result = calculateCreditsAfterPurchase(
            invalidId,
            currentCredits
          );

          // Should return unchanged credits for invalid ID
          expect(result).toBe(currentCredits);
        }
      ),
      { numRuns: 50 }
    );
  });
});
