import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';

describe('NPCManager coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateAndGetNPCData', () => {
    it('returns NPC data for valid ID', () => {
      const data = gsm.npcManager.validateAndGetNPCData('chen_barnards');
      expect(data).toBeDefined();
      expect(data.id).toBe('chen_barnards');
    });

    it('throws for unknown NPC ID', () => {
      expect(() => gsm.npcManager.validateAndGetNPCData('fake_npc')).toThrow(
        'Unknown NPC ID: fake_npc'
      );
    });
  });

  describe('getRepTier', () => {
    it('returns Hostile for very negative rep', () => {
      expect(gsm.npcManager.getRepTier(-100).name).toBe('Hostile');
    });

    it('returns Neutral for zero rep', () => {
      expect(gsm.npcManager.getRepTier(0).name).toBe('Neutral');
    });

    it('returns Family for max rep', () => {
      expect(gsm.npcManager.getRepTier(100).name).toBe('Family');
    });

    it('returns correct tier at boundary values', () => {
      expect(gsm.npcManager.getRepTier(REPUTATION_BOUNDS.WARM_MIN).name).toBe(
        'Warm'
      );
      expect(
        gsm.npcManager.getRepTier(REPUTATION_BOUNDS.FRIENDLY_MIN).name
      ).toBe('Friendly');
      expect(
        gsm.npcManager.getRepTier(REPUTATION_BOUNDS.TRUSTED_MIN).name
      ).toBe('Trusted');
    });
  });

  describe('getNPCState', () => {
    it('creates default state for new NPC', () => {
      const state = gsm.npcManager.getNPCState('chen_barnards');
      expect(state).toHaveProperty('rep');
      expect(state).toHaveProperty('flags');
      expect(state).toHaveProperty('interactions');
      expect(state.storedCargo).toEqual([]);
    });

    it('returns existing state on second call', () => {
      const first = gsm.npcManager.getNPCState('chen_barnards');
      first.rep = 50;
      const second = gsm.npcManager.getNPCState('chen_barnards');
      expect(second.rep).toBe(50);
    });
  });

  describe('modifyRep', () => {
    it('applies trust modifier for positive amounts', () => {
      const spy = vi.spyOn(gsm.npcManager, 'modifyRepRaw');
      gsm.npcManager.modifyRep('chen_barnards', 10, 'test');
      const calledAmount = spy.mock.calls[0][1];
      // Trust modifier should modify the amount
      expect(calledAmount).not.toBe(0);
    });

    it('does not apply trust modifier for negative amounts', () => {
      const spy = vi.spyOn(gsm.npcManager, 'modifyRepRaw');
      gsm.npcManager.modifyRep('chen_barnards', -10, 'test');
      expect(spy.mock.calls[0][1]).toBe(-10);
    });

    it('applies smooth_talker bonus for positive amounts', () => {
      // First get the amount without smooth_talker
      const spy1 = vi.spyOn(gsm.npcManager, 'modifyRepRaw');
      gsm.state.ship.quirks = [];
      gsm.npcManager.modifyRep('chen_barnards', 10, 'test');
      const withoutSmoothTalker = spy1.mock.calls[0][1];
      spy1.mockRestore();

      // Now with smooth_talker
      const spy2 = vi.spyOn(gsm.npcManager, 'modifyRepRaw');
      gsm.state.ship.quirks = ['smooth_talker'];
      gsm.npcManager.modifyRep('chen_barnards', 10, 'test');
      const withSmoothTalker = spy2.mock.calls[0][1];
      // smooth_talker adds 5% on top of trust-modified amount
      expect(withSmoothTalker).toBeGreaterThan(withoutSmoothTalker);
    });
  });

  describe('modifyRepRaw', () => {
    it('clamps reputation to bounds', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 95;
      gsm.npcManager.modifyRepRaw('chen_barnards', 20, 'test');
      expect(gsm.npcManager.getNPCState('chen_barnards').rep).toBe(100);
    });

    it('clamps negative reputation', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = -95;
      gsm.npcManager.modifyRepRaw('chen_barnards', -20, 'test');
      expect(gsm.npcManager.getNPCState('chen_barnards').rep).toBe(-100);
    });

    it('increments interactions', () => {
      const state = gsm.npcManager.getNPCState('chen_barnards');
      const before = state.interactions;
      gsm.npcManager.modifyRepRaw('chen_barnards', 5, 'test');
      expect(state.interactions).toBe(before + 1);
    });
  });

  describe('setNpcRep', () => {
    it('sets exact reputation value', () => {
      gsm.npcManager.setNpcRep('chen_barnards', 75);
      expect(gsm.npcManager.getNPCState('chen_barnards').rep).toBe(75);
    });

    it('clamps to bounds', () => {
      gsm.npcManager.setNpcRep('chen_barnards', 200);
      expect(gsm.npcManager.getNPCState('chen_barnards').rep).toBe(100);
    });
  });

  describe('canGetTip', () => {
    it('returns unavailable for low rep NPC', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 0;
      const result = gsm.npcManager.canGetTip('chen_barnards');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Requires Warm');
    });

    it('returns available for warm rep NPC with tips', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.WARM_MIN;
      const result = gsm.npcManager.canGetTip('chen_barnards');
      expect(result.available).toBe(true);
    });

    it('returns unavailable during cooldown', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.WARM_MIN;
      npcState.lastTipDay = gsm.state.player.daysElapsed;
      const result = gsm.npcManager.canGetTip('chen_barnards');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('cooldown');
    });

    it('returns available after cooldown expires', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.WARM_MIN;
      npcState.lastTipDay =
        gsm.state.player.daysElapsed - NPC_BENEFITS_CONFIG.TIP_COOLDOWN_DAYS;
      const result = gsm.npcManager.canGetTip('chen_barnards');
      expect(result.available).toBe(true);
    });
  });

  describe('getTip', () => {
    it('returns null when tip unavailable', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 0;
      expect(gsm.npcManager.getTip('chen_barnards')).toBeNull();
    });

    it('returns tip string when available', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.WARM_MIN;
      const tip = gsm.npcManager.getTip('chen_barnards');
      expect(typeof tip).toBe('string');
      expect(tip.length).toBeGreaterThan(0);
    });

    it('sets lastTipDay after getting tip', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.WARM_MIN;
      gsm.npcManager.getTip('chen_barnards');
      expect(gsm.npcManager.getNPCState('chen_barnards').lastTipDay).toBe(
        gsm.state.player.daysElapsed
      );
    });
  });

  describe('getServiceDiscount', () => {
    it('returns no discount when service type does not match', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 50;
      // chen_barnards has discountService: 'docking'
      const result = gsm.npcManager.getServiceDiscount(
        'chen_barnards',
        'repair'
      );
      expect(result.discount).toBe(0);
      expect(result.npcName).toBeNull();
    });

    it('returns discount when service type matches and rep is sufficient', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.WARM_MIN;
      const result = gsm.npcManager.getServiceDiscount(
        'chen_barnards',
        'docking'
      );
      expect(result.discount).toBe(NPC_BENEFITS_CONFIG.TIER_DISCOUNTS.warm);
    });

    it('returns higher discount at higher rep tier', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.TRUSTED_MIN;
      const result = gsm.npcManager.getServiceDiscount(
        'chen_barnards',
        'docking'
      );
      expect(result.discount).toBe(NPC_BENEFITS_CONFIG.TIER_DISCOUNTS.trusted);
    });

    it('returns zero discount for hostile rep', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = -80;
      const result = gsm.npcManager.getServiceDiscount(
        'chen_barnards',
        'docking'
      );
      expect(result.discount).toBe(0);
    });
  });

  describe('canRequestFavor', () => {
    it('returns unavailable for unmet NPC', () => {
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'storage');
      expect(result.available).toBe(false);
      expect(result.reason).toBe('NPC not met');
    });

    it('returns unavailable for unknown favor type', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 90;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'unknown');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Unknown favor type');
    });

    it('returns unavailable for loan with insufficient rep', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 30;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'loan');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Requires Trusted');
    });

    it('returns unavailable for storage with insufficient rep', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 5;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'storage');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Requires Friendly');
    });

    it('returns unavailable during favor cooldown', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      npcState.lastFavorDay = gsm.state.player.daysElapsed;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'loan');
      expect(result.available).toBe(false);
      expect(result.daysRemaining).toBeDefined();
    });

    it('returns unavailable with outstanding loan', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      npcState.loanAmount = 500;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'loan');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Outstanding loan');
    });

    it('returns available when all conditions met for loan', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'loan');
      expect(result.available).toBe(true);
    });

    it('returns available when all conditions met for storage', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
      const result = gsm.npcManager.canRequestFavor('chen_barnards', 'storage');
      expect(result.available).toBe(true);
    });
  });

  describe('requestLoan', () => {
    it('fails when canRequestFavor fails', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 0;
      const result = gsm.npcManager.requestLoan('chen_barnards');
      expect(result.success).toBe(false);
    });

    it('grants loan successfully', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      const creditsBefore = gsm.state.player.credits;
      const result = gsm.npcManager.requestLoan('chen_barnards');
      expect(result.success).toBe(true);
      expect(gsm.state.player.credits).toBe(
        creditsBefore + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
      );
      expect(npcState.loanAmount).toBe(
        NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
      );
    });
  });

  describe('repayLoan', () => {
    it('fails with no outstanding loan', () => {
      gsm.npcManager.getNPCState('chen_barnards');
      const result = gsm.npcManager.repayLoan('chen_barnards');
      expect(result.success).toBe(false);
      expect(result.message).toBe('No outstanding loan');
    });

    it('fails with insufficient credits', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.loanAmount = 500;
      gsm.state.player.credits = 100;
      const result = gsm.npcManager.repayLoan('chen_barnards');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Insufficient credits');
    });

    it('repays loan successfully', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.loanAmount = 500;
      npcState.loanDay = 1;
      gsm.state.player.credits = 1000;
      const result = gsm.npcManager.repayLoan('chen_barnards');
      expect(result.success).toBe(true);
      expect(npcState.loanAmount).toBeNull();
      expect(npcState.loanDay).toBeNull();
      expect(gsm.state.player.credits).toBe(500);
    });
  });

  describe('checkLoanDefaults', () => {
    it('does nothing when no loans exist', () => {
      gsm.npcManager.checkLoanDefaults();
      // No error thrown
    });

    it('does not penalize recent loan', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed;
      gsm.npcManager.checkLoanDefaults();
      expect(npcState.rep).toBe(REPUTATION_BOUNDS.TRUSTED_MIN);
      expect(npcState.loanAmount).toBe(500);
    });

    it('penalizes overdue loan by dropping tier', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN; // 60 -> should drop to FRIENDLY_MAX (59)
      npcState.loanAmount = 500;
      npcState.loanDay =
        gsm.state.player.daysElapsed -
        NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE -
        1;
      gsm.npcManager.checkLoanDefaults();
      expect(npcState.rep).toBe(REPUTATION_BOUNDS.FRIENDLY_MAX);
      expect(npcState.loanAmount).toBeNull();
    });

    it('handles Family tier default', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = 95;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 50;
      gsm.npcManager.checkLoanDefaults();
      expect(npcState.rep).toBe(REPUTATION_BOUNDS.TRUSTED_MAX);
    });

    it('handles Hostile tier default', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.rep = -80;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 50;
      gsm.npcManager.checkLoanDefaults();
      expect(npcState.rep).toBeLessThan(-80);
      expect(npcState.rep).toBeGreaterThanOrEqual(REPUTATION_BOUNDS.MIN);
    });
  });

  describe('storeCargo', () => {
    it('fails when favor unavailable', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep = 0;
      const result = gsm.npcManager.storeCargo('chen_barnards');
      expect(result.success).toBe(false);
    });

    it('fails when no cargo to store', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.FRIENDLY_MIN;
      gsm.state.ship.cargo = [];
      const result = gsm.npcManager.storeCargo('chen_barnards');
      expect(result.success).toBe(false);
      expect(result.message).toBe('No cargo to store');
    });

    it('stores cargo successfully', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.FRIENDLY_MIN;
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = gsm.npcManager.storeCargo('chen_barnards');
      expect(result.success).toBe(true);
      expect(result.stored).toBe(5);
      expect(
        gsm.npcManager.getNPCState('chen_barnards').storedCargo
      ).toHaveLength(1);
    });

    it('limits storage to CARGO_STORAGE_LIMIT', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.FRIENDLY_MIN;
      gsm.state.ship.cargo = [{ good: 'ore', qty: 20, buyPrice: 100 }];
      const result = gsm.npcManager.storeCargo('chen_barnards');
      expect(result.success).toBe(true);
      expect(result.stored).toBe(NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT);
    });

    it('throws for invalid npcId', () => {
      expect(() => gsm.npcManager.storeCargo(null)).toThrow('Invalid npcId');
    });
  });

  describe('retrieveCargo', () => {
    it('returns empty when no stored cargo', () => {
      gsm.npcManager.getNPCState('chen_barnards');
      const result = gsm.npcManager.retrieveCargo('chen_barnards');
      expect(result.success).toBe(true);
      expect(result.retrieved).toEqual([]);
    });

    it('retrieves stored cargo', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.storedCargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      gsm.state.ship.cargo = [];
      const result = gsm.npcManager.retrieveCargo('chen_barnards');
      expect(result.success).toBe(true);
      expect(result.retrieved).toHaveLength(1);
      expect(npcState.storedCargo).toHaveLength(0);
    });

    it('throws for invalid npcId', () => {
      expect(() => gsm.npcManager.retrieveCargo(null)).toThrow('Invalid npcId');
    });
  });
});
