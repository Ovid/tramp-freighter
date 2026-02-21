import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COLE_DEBT_CONFIG, NEW_GAME_DEFAULTS } from '../../src/game/constants.js';
import { DebtManager } from '../../src/game/state/managers/debt.js';

// Suppress console output during tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Cole Debt System', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  describe('Finance State Initialization', () => {
    it('initializes player.finance with correct defaults', () => {
      const state = gsm.state;
      expect(state.player.finance).toBeDefined();
      expect(state.player.finance.heat).toBe(COLE_DEBT_CONFIG.STARTING_HEAT);
      expect(state.player.finance.lienRate).toBe(
        COLE_DEBT_CONFIG.STARTING_LIEN_RATE
      );
      expect(state.player.finance.interestRate).toBe(
        COLE_DEBT_CONFIG.INTEREST_RATE
      );
      expect(state.player.finance.lastInterestDay).toBe(0);
      expect(state.player.finance.nextCheckpoint).toBe(
        COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY
      );
      expect(state.player.finance.totalBorrowed).toBe(0);
      expect(state.player.finance.totalRepaid).toBe(0);
    });

    it('player.debt still exists at starting value', () => {
      expect(gsm.state.player.debt).toBe(NEW_GAME_DEFAULTS.STARTING_DEBT);
    });
  });

  describe('DebtManager', () => {
    let gsm;
    let debtManager;

    beforeEach(() => {
      gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
      gsm.initNewGame();
      debtManager = new DebtManager(gsm);
    });

    describe('getHeatTier', () => {
      it('returns "low" for heat 0-20', () => {
        gsm.state.player.finance.heat = 0;
        expect(debtManager.getHeatTier()).toBe('low');
        gsm.state.player.finance.heat = 20;
        expect(debtManager.getHeatTier()).toBe('low');
      });

      it('returns "medium" for heat 21-45', () => {
        gsm.state.player.finance.heat = 21;
        expect(debtManager.getHeatTier()).toBe('medium');
        gsm.state.player.finance.heat = 45;
        expect(debtManager.getHeatTier()).toBe('medium');
      });

      it('returns "high" for heat 46-70', () => {
        gsm.state.player.finance.heat = 46;
        expect(debtManager.getHeatTier()).toBe('high');
        gsm.state.player.finance.heat = 70;
        expect(debtManager.getHeatTier()).toBe('high');
      });

      it('returns "critical" for heat 71-100', () => {
        gsm.state.player.finance.heat = 71;
        expect(debtManager.getHeatTier()).toBe('critical');
        gsm.state.player.finance.heat = 100;
        expect(debtManager.getHeatTier()).toBe('critical');
      });
    });

    describe('getLienRate', () => {
      it('returns correct lien rate for each heat tier', () => {
        gsm.state.player.finance.heat = 10;
        expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_LOW);

        gsm.state.player.finance.heat = 30;
        expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM);

        gsm.state.player.finance.heat = 50;
        expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_HIGH);

        gsm.state.player.finance.heat = 80;
        expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_CRITICAL);
      });

      it('returns 0 when debt is 0', () => {
        gsm.state.player.debt = 0;
        gsm.state.player.finance.heat = 80;
        expect(debtManager.getLienRate()).toBe(0);
      });
    });
  });
});
