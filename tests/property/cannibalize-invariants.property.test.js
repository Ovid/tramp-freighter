import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Property: Cannibalization invariants', () => {
  const THRESHOLD = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
  const TARGET = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;
  const WASTE = REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER;
  const DONOR_MIN = REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN;

  function makeManager(ship) {
    const mockState = {
      player: { credits: 0 },
      ship: { ...ship },
    };
    const capabilities = {
      getShipCondition: () => ({
        hull: mockState.ship.hull,
        engine: mockState.ship.engine,
        lifeSupport: mockState.ship.lifeSupport,
      }),
      getCredits: () => mockState.player.credits,
      getDaysElapsed: () => mockState.player?.daysElapsed ?? 0,
      updateShipCondition: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    };
    const mgr = new RepairManager(capabilities);
    return { mgr, capabilities };
  }

  it('successful cannibalization always sets target to exactly 21%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: THRESHOLD }), // target condition
        fc.integer({ min: DONOR_MIN + 1, max: 100 }), // donor1 condition
        fc.integer({ min: DONOR_MIN + 1, max: 100 }), // donor2 condition
        (targetCond, donor1Cond, donor2Cond) => {
          const amountNeeded = TARGET - targetCond;
          const requiredDonation = Math.ceil(amountNeeded * WASTE);
          const maxFromDonor1 = donor1Cond - DONOR_MIN;
          const maxFromDonor2 = donor2Cond - DONOR_MIN;

          if (maxFromDonor1 + maxFromDonor2 < requiredDonation) return true; // skip infeasible

          const fromDonor1 = Math.min(maxFromDonor1, requiredDonation);
          const fromDonor2 = Math.min(
            maxFromDonor2,
            requiredDonation - fromDonor1
          );

          const { mgr, capabilities } = makeManager({
            hull: targetCond,
            engine: donor1Cond,
            lifeSupport: donor2Cond,
          });

          const donations = [];
          if (fromDonor1 > 0)
            donations.push({ system: 'engine', amount: fromDonor1 });
          if (fromDonor2 > 0)
            donations.push({ system: 'lifeSupport', amount: fromDonor2 });

          const result = mgr.cannibalizeSystem('hull', donations);
          if (!result.success) return true; // skip edge cases

          const call = capabilities.updateShipCondition.mock.calls[0];
          expect(call[0]).toBe(TARGET); // hull always 21
        }
      ),
      { numRuns: 200 }
    );
  });

  it('donors never go below CANNIBALIZE_DONOR_MIN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: THRESHOLD }),
        fc.integer({ min: DONOR_MIN + 1, max: 100 }),
        fc.integer({ min: DONOR_MIN + 1, max: 100 }),
        (targetCond, donor1Cond, donor2Cond) => {
          const amountNeeded = TARGET - targetCond;
          const requiredDonation = Math.ceil(amountNeeded * WASTE);
          const maxFromDonor1 = donor1Cond - DONOR_MIN;
          const maxFromDonor2 = donor2Cond - DONOR_MIN;

          if (maxFromDonor1 + maxFromDonor2 < requiredDonation) return true;

          const fromDonor1 = Math.min(maxFromDonor1, requiredDonation);
          const fromDonor2 = Math.min(
            maxFromDonor2,
            requiredDonation - fromDonor1
          );

          const { mgr, capabilities } = makeManager({
            hull: targetCond,
            engine: donor1Cond,
            lifeSupport: donor2Cond,
          });

          const donations = [];
          if (fromDonor1 > 0)
            donations.push({ system: 'engine', amount: fromDonor1 });
          if (fromDonor2 > 0)
            donations.push({ system: 'lifeSupport', amount: fromDonor2 });

          const result = mgr.cannibalizeSystem('hull', donations);
          if (!result.success) return true;

          const call = capabilities.updateShipCondition.mock.calls[0];
          expect(call[1]).toBeGreaterThanOrEqual(DONOR_MIN); // engine
          expect(call[2]).toBeGreaterThanOrEqual(DONOR_MIN); // lifeSupport
        }
      ),
      { numRuns: 200 }
    );
  });

  it('cannibalization is rejected when donation is insufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: THRESHOLD }),
        fc.integer({ min: 1, max: 50 }),
        (targetCond, donationAmount) => {
          const amountNeeded = TARGET - targetCond;
          const requiredDonation = amountNeeded * WASTE;

          // Only test cases where donation is definitely insufficient
          if (donationAmount >= requiredDonation) return true;

          const { mgr } = makeManager({
            hull: targetCond,
            engine: 100,
            lifeSupport: 100,
          });

          const result = mgr.cannibalizeSystem('hull', [
            { system: 'engine', amount: donationAmount },
          ]);

          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
