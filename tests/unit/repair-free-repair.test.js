import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  SHIP_CONFIG,
} from '../../src/game/constants.js';

const TEST_NPC_ID = 'chen_barnards';

describe('RepairManager free repair', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper: set NPC rep directly via npcManager state object
   */
  function setNpcRep(npcId, rep) {
    const npcState = gsm.npcManager.getNPCState(npcId);
    npcState.rep = rep;
  }

  /**
   * Helper: get NPC state for assertions
   */
  function getNpcState(npcId) {
    return gsm.npcManager.getNPCState(npcId);
  }

  describe('canGetFreeRepair', () => {
    it('returns available=true with trusted maxHullPercent when rep is in Trusted range', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.available).toBe(true);
      expect(result.maxHullPercent).toBe(
        NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted
      );
      expect(result.reason).toBeNull();
    });

    it('returns available=true with family maxHullPercent when rep is in Family range', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.FAMILY_MIN);

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.available).toBe(true);
      expect(result.maxHullPercent).toBe(
        NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family
      );
      expect(result.reason).toBeNull();
    });

    it('returns available=false when rep is below Trusted', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN - 1);

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.available).toBe(false);
      expect(result.maxHullPercent).toBe(0);
    });

    it('returns reason mentioning current tier name when rep not high enough', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN - 1);

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.reason).toContain('Friendly');
      expect(result.reason).toContain('Requires Trusted');
    });

    it('returns available=false when lastFreeRepairDay equals current day', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      const currentDay = gsm.getState().player.daysElapsed;
      getNpcState(TEST_NPC_ID).lastFreeRepairDay = currentDay;

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Free repair already used once per visit');
    });

    it('returns available=true when lastFreeRepairDay is null', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      getNpcState(TEST_NPC_ID).lastFreeRepairDay = null;

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.available).toBe(true);
    });

    it('returns available=true when lastFreeRepairDay is a different day', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      const currentDay = gsm.getState().player.daysElapsed;
      getNpcState(TEST_NPC_ID).lastFreeRepairDay = currentDay - 1;

      const result = gsm.repairManager.canGetFreeRepair(TEST_NPC_ID);

      expect(result.available).toBe(true);
    });
  });

  describe('applyFreeRepair', () => {
    it('repairs hull up to maxHullPercent for Trusted NPC', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      const state = gsm.getState();
      state.ship.hull = 70;
      const trustedLimit = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted;

      const result = gsm.repairManager.applyFreeRepair(
        TEST_NPC_ID,
        trustedLimit + 5
      );

      expect(result.success).toBe(true);
      expect(result.repairedPercent).toBe(trustedLimit);
      expect(gsm.getState().ship.hull).toBe(70 + trustedLimit);
    });

    it('repairs hull up to maxHullPercent for Family NPC', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.FAMILY_MIN);
      const state = gsm.getState();
      state.ship.hull = 50;
      const familyLimit = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;

      const result = gsm.repairManager.applyFreeRepair(
        TEST_NPC_ID,
        familyLimit + 10
      );

      expect(result.success).toBe(true);
      expect(result.repairedPercent).toBe(familyLimit);
      expect(gsm.getState().ship.hull).toBe(50 + familyLimit);
    });

    it('returns failure when NPC rep too low', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN - 1);

      const result = gsm.repairManager.applyFreeRepair(TEST_NPC_ID, 20);

      expect(result.success).toBe(false);
      expect(result.repairedPercent).toBe(0);
      expect(result.message).toContain('Requires Trusted');
    });

    it('caps repair at actual hull damage when damage < maxHullPercent', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.FAMILY_MIN);
      const state = gsm.getState();
      state.ship.hull = 95;
      const smallDamage = 3;

      const result = gsm.repairManager.applyFreeRepair(
        TEST_NPC_ID,
        smallDamage
      );

      expect(result.success).toBe(true);
      expect(result.repairedPercent).toBe(smallDamage);
      expect(gsm.getState().ship.hull).toBe(95 + smallDamage);
    });

    it('returns failure for negative hullDamagePercent', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);

      const result = gsm.repairManager.applyFreeRepair(TEST_NPC_ID, -5);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid hull damage percentage');
    });

    it('returns failure for hullDamagePercent > 100', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);

      const result = gsm.repairManager.applyFreeRepair(TEST_NPC_ID, 101);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid hull damage percentage');
    });

    it('returns failure for non-number hullDamagePercent', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);

      const result = gsm.repairManager.applyFreeRepair(TEST_NPC_ID, 'ten');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid hull damage percentage');
    });

    it('sets lastFreeRepairDay to current day after successful repair', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      gsm.getState().ship.hull = 80;
      const currentDay = gsm.getState().player.daysElapsed;

      gsm.repairManager.applyFreeRepair(TEST_NPC_ID, 10);

      expect(getNpcState(TEST_NPC_ID).lastFreeRepairDay).toBe(currentDay);
    });

    it('increments NPC interactions count', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      gsm.getState().ship.hull = 80;
      const interactionsBefore = getNpcState(TEST_NPC_ID).interactions;

      gsm.repairManager.applyFreeRepair(TEST_NPC_ID, 10);

      expect(getNpcState(TEST_NPC_ID).interactions).toBe(
        interactionsBefore + 1
      );
    });

    it('calls markDirty after successful repair', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      gsm.getState().ship.hull = 80;
      const markDirtySpy = vi.spyOn(gsm, 'markDirty');

      gsm.repairManager.applyFreeRepair(TEST_NPC_ID, 10);

      expect(markDirtySpy).toHaveBeenCalled();
    });

    it('clamps hull to CONDITION_BOUNDS.MAX when repair would exceed it', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.FAMILY_MIN);
      gsm.getState().ship.hull = 90;
      const familyLimit = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;

      gsm.repairManager.applyFreeRepair(TEST_NPC_ID, familyLimit);

      expect(gsm.getState().ship.hull).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
    });
  });
});
