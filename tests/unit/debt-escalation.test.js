import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COLE_DEBT_CONFIG } from '../../src/game/constants.js';

describe('Debt Escalation (#77)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should return low interest rate at low heat', () => {
    const rate = gsm.debtManager.getInterestRate();
    expect(rate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_LOW);
  });

  it('should return medium interest rate at medium heat', () => {
    const finance = gsm.debtManager.getFinance();
    finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX + 1;
    const rate = gsm.debtManager.getInterestRate();
    expect(rate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM);
  });

  it('should return high interest rate at high heat', () => {
    const finance = gsm.debtManager.getFinance();
    finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX + 1;
    const rate = gsm.debtManager.getInterestRate();
    expect(rate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_HIGH);
  });

  it('should update interestRate in finance when heat changes', () => {
    const finance = gsm.debtManager.getFinance();
    expect(finance.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_LOW);

    finance.heat = 0;
    gsm.debtManager.updateHeat(COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX + 1);
    expect(finance.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM);
  });

  it('should use tier-appropriate interest rate when applying interest', () => {
    const state = gsm.getState();
    const finance = gsm.debtManager.getFinance();
    const initialDebt = state.player.debt;

    finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX + 1;
    gsm.debtManager.updateHeat(0);

    state.player.daysElapsed = finance.lastInterestDay + COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS;

    gsm.debtManager.applyInterest();

    const expectedInterest = Math.ceil(initialDebt * COLE_DEBT_CONFIG.INTEREST_RATE_HIGH);
    expect(state.player.debt).toBe(initialDebt + expectedInterest);
  });

  describe('withholding rates already escalate by tier (pre-existing)', () => {
    it('should apply low withholding rate at low heat', () => {
      const finance = gsm.debtManager.getFinance();
      finance.heat = 0;
      expect(gsm.debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_LOW);
    });

    it('should apply medium withholding rate at medium heat', () => {
      const finance = gsm.debtManager.getFinance();
      finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX + 1;
      expect(gsm.debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM);
    });

    it('should apply correct withholding to trade revenue at high heat', () => {
      const finance = gsm.debtManager.getFinance();
      finance.heat = COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX + 1;
      gsm.debtManager.updateHeat(0);

      const totalRevenue = 1000;
      const result = gsm.debtManager.calculateWithholding(totalRevenue);
      const expectedWithheld = Math.ceil(totalRevenue * COLE_DEBT_CONFIG.LIEN_RATE_HIGH);
      expect(result.withheld).toBe(expectedWithheld);
      expect(result.playerReceives).toBe(totalRevenue - expectedWithheld);
    });
  });
});
