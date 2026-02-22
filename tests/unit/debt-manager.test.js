import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  COLE_DEBT_CONFIG,
  NEW_GAME_DEFAULTS,
} from '../../src/game/constants.js';
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
        expect(debtManager.getLienRate()).toBe(
          COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM
        );

        gsm.state.player.finance.heat = 50;
        expect(debtManager.getLienRate()).toBe(COLE_DEBT_CONFIG.LIEN_RATE_HIGH);

        gsm.state.player.finance.heat = 80;
        expect(debtManager.getLienRate()).toBe(
          COLE_DEBT_CONFIG.LIEN_RATE_CRITICAL
        );
      });

      it('returns 0 when debt is 0', () => {
        gsm.state.player.debt = 0;
        gsm.state.player.finance.heat = 80;
        expect(debtManager.getLienRate()).toBe(0);
      });
    });

    describe('getMaxDraw', () => {
      it('calculates max draw based on net worth', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 10000;
        gsm.state.ship.cargo = [{ good: 'water', qty: 10, buyPrice: 50 }];

        const maxDraw = debtManager.getMaxDraw();
        // netWorth = 5000 + (10*50) - 10000 = -4500, negative
        // max(200, round(-4500 * 0.08)) = max(200, -360) = 200
        expect(maxDraw).toBe(200);
      });

      it('returns minimum 200 even with negative net worth', () => {
        gsm.state.player.credits = 0;
        gsm.state.player.debt = 50000;
        gsm.state.ship.cargo = [];

        expect(debtManager.getMaxDraw()).toBe(200);
      });
    });

    describe('borrow', () => {
      it('increases debt and credits by draw amount', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 0;
        const initialDebt = gsm.state.player.debt;
        const initialCredits = gsm.state.player.credits;

        const result = debtManager.borrow(250);

        expect(result.success).toBe(true);
        expect(gsm.state.player.debt).toBe(initialDebt + 250);
        expect(gsm.state.player.credits).toBe(initialCredits + 250);
      });

      it('increases heat by base + per-500 formula', () => {
        gsm.state.player.finance.heat = 0;

        debtManager.borrow(100);
        // heat += 8 + floor(100/500)*2 = 8 + 0 = 8
        expect(gsm.state.player.finance.heat).toBe(8);
      });

      it('increases heat more for larger draws', () => {
        gsm.state.player.credits = 10000;
        gsm.state.player.debt = 0;
        gsm.state.player.finance.heat = 0;

        debtManager.borrow(500);
        // heat += 8 + floor(500/500)*2 = 8 + 2 = 10
        expect(gsm.state.player.finance.heat).toBe(10);
      });

      it('accelerates next checkpoint', () => {
        gsm.state.player.finance.nextCheckpoint = 60;
        gsm.state.player.daysElapsed = 10;

        debtManager.borrow(100);

        // min(60, 10 + 7) = 17
        expect(gsm.state.player.finance.nextCheckpoint).toBe(17);
      });

      it('tracks totalBorrowed', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 0;

        debtManager.borrow(250);
        expect(gsm.state.player.finance.totalBorrowed).toBe(250);

        debtManager.borrow(100);
        expect(gsm.state.player.finance.totalBorrowed).toBe(350);
      });

      it('rejects draw amount exceeding maxDraw', () => {
        gsm.state.player.credits = 0;
        gsm.state.player.debt = 50000;
        gsm.state.ship.cargo = [];

        const result = debtManager.borrow(500);
        expect(result.success).toBe(false);
      });

      it('sets borrowedThisPeriod flag', () => {
        debtManager.borrow(100);
        expect(gsm.state.player.finance.borrowedThisPeriod).toBe(true);
      });
    });

    describe('makePayment', () => {
      it('reduces debt and deducts credits', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 10000;

        const result = debtManager.makePayment(1000);

        expect(result.success).toBe(true);
        expect(gsm.state.player.debt).toBe(9000);
        expect(gsm.state.player.credits).toBe(4000);
      });

      it('reduces heat by 3 per payment action', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 30;

        debtManager.makePayment(100);

        expect(gsm.state.player.finance.heat).toBe(27);
      });

      it('caps payment at current debt', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 300;

        debtManager.makePayment(500);

        expect(gsm.state.player.debt).toBe(0);
        expect(gsm.state.player.credits).toBe(4700);
      });

      it('resets heat to 0 when debt reaches 0', () => {
        gsm.state.player.credits = 15000;
        gsm.state.player.debt = 1000;
        gsm.state.player.finance.heat = 50;

        debtManager.makePayment(1000);

        expect(gsm.state.player.debt).toBe(0);
        expect(gsm.state.player.finance.heat).toBe(0);
      });

      it('rejects payment when credits insufficient', () => {
        gsm.state.player.credits = 50;

        const result = debtManager.makePayment(100);

        expect(result.success).toBe(false);
      });

      it('rejects payment when debt is 0', () => {
        gsm.state.player.debt = 0;
        gsm.state.player.credits = 5000;

        const result = debtManager.makePayment(100);

        expect(result.success).toBe(false);
      });

      it('tracks totalRepaid', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 10000;

        debtManager.makePayment(500);

        expect(gsm.state.player.finance.totalRepaid).toBe(500);
      });
    });

    describe('calculateWithholding', () => {
      it('calculates withholding based on current lien rate', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 10; // low tier, 5%

        const result = debtManager.calculateWithholding(1000);

        expect(result.withheld).toBe(50); // ceil(1000 * 0.05) = 50
        expect(result.playerReceives).toBe(950);
      });

      it('caps withholding at current debt', () => {
        gsm.state.player.debt = 20;
        gsm.state.player.finance.heat = 10;

        const result = debtManager.calculateWithholding(1000);

        expect(result.withheld).toBe(20);
        expect(result.playerReceives).toBe(980);
      });

      it('returns 0 withholding when debt is 0', () => {
        gsm.state.player.debt = 0;

        const result = debtManager.calculateWithholding(1000);

        expect(result.withheld).toBe(0);
        expect(result.playerReceives).toBe(1000);
      });

      it('uses higher lien rate at higher heat', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 80; // critical, 20%

        const result = debtManager.calculateWithholding(1000);

        expect(result.withheld).toBe(200);
        expect(result.playerReceives).toBe(800);
      });
    });

    describe('applyWithholding', () => {
      it('reduces debt by withheld amount and tracks totalRepaid', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 10;

        debtManager.applyWithholding(1000);

        expect(gsm.state.player.debt).toBe(9950);
        expect(gsm.state.player.finance.totalRepaid).toBe(50);
      });
    });

    describe('applyInterest', () => {
      it('applies interest when period has elapsed', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.lastInterestDay = 0;
        gsm.state.player.daysElapsed = 30;

        debtManager.applyInterest();

        // 10000 * 0.02 = 200, ceil = 200
        expect(gsm.state.player.debt).toBe(10200);
        expect(gsm.state.player.finance.lastInterestDay).toBe(30);
      });

      it('does not apply interest before period elapses', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.lastInterestDay = 0;
        gsm.state.player.daysElapsed = 29;

        debtManager.applyInterest();

        expect(gsm.state.player.debt).toBe(10000);
        expect(gsm.state.player.finance.lastInterestDay).toBe(0);
      });

      it('does not apply interest when debt is 0', () => {
        gsm.state.player.debt = 0;
        gsm.state.player.finance.lastInterestDay = 0;
        gsm.state.player.daysElapsed = 30;

        debtManager.applyInterest();

        expect(gsm.state.player.debt).toBe(0);
      });

      it('rounds interest up with Math.ceil', () => {
        gsm.state.player.debt = 150;
        gsm.state.player.finance.lastInterestDay = 0;
        gsm.state.player.daysElapsed = 30;

        debtManager.applyInterest();

        // 150 * 0.02 = 3, ceil = 3
        expect(gsm.state.player.debt).toBe(153);
      });

      it('applies natural heat decay when no new borrowing in period', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 25;
        gsm.state.player.finance.lastInterestDay = 0;
        gsm.state.player.finance.borrowedThisPeriod = false;
        gsm.state.player.daysElapsed = 30;

        debtManager.applyInterest();

        expect(gsm.state.player.finance.heat).toBe(24);
      });
    });

    describe('checkCheckpoint', () => {
      it('does not trigger before checkpoint day', () => {
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.daysElapsed = 29;

        const result = debtManager.checkCheckpoint();

        expect(result).toBeNull();
      });

      it('does not trigger when debt is 0', () => {
        gsm.state.player.debt = 0;
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.daysElapsed = 30;

        const result = debtManager.checkCheckpoint();

        expect(result).toBeNull();
      });

      it('triggers on checkpoint day with payment made', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.finance.totalRepaid = 500;
        gsm.state.player.finance.lastCheckpointRepaid = 0;
        gsm.state.player.daysElapsed = 30;

        const result = debtManager.checkCheckpoint();

        expect(result).not.toBeNull();
        expect(result.madePayments).toBe(true);
      });

      it('increases heat when no payments made since last checkpoint', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.finance.totalRepaid = 0;
        gsm.state.player.finance.lastCheckpointRepaid = 0;
        gsm.state.player.finance.heat = 10;
        gsm.state.player.daysElapsed = 30;

        debtManager.checkCheckpoint();

        expect(gsm.state.player.finance.heat).toBe(20); // +10
      });

      it('schedules next checkpoint based on heat tier', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.finance.totalRepaid = 500;
        gsm.state.player.finance.lastCheckpointRepaid = 0;
        gsm.state.player.finance.heat = 10; // low tier
        gsm.state.player.daysElapsed = 30;

        debtManager.checkCheckpoint();

        // low tier: +30 days
        expect(gsm.state.player.finance.nextCheckpoint).toBe(60);
      });
    });

    describe('getDebtInfo', () => {
      it('returns complete debt summary for UI', () => {
        gsm.state.player.debt = 8000;
        gsm.state.player.credits = 3000;
        gsm.state.player.finance.heat = 25;
        gsm.state.player.finance.totalBorrowed = 2000;
        gsm.state.player.finance.totalRepaid = 4000;
        gsm.state.player.daysElapsed = 15;

        const info = debtManager.getDebtInfo();

        expect(info.debt).toBe(8000);
        expect(info.lienRate).toBe(COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM);
        expect(info.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE);
        expect(info.nextInterestDay).toBeDefined();
        expect(info.maxDraw).toBeGreaterThanOrEqual(
          COLE_DEBT_CONFIG.DEFAULT_DRAW
        );
        expect(info.availableDrawTiers).toBeInstanceOf(Array);
        expect(info.canPay).toBe(true);
        expect(info.totalBorrowed).toBe(2000);
        expect(info.totalRepaid).toBe(4000);
      });
    });

    describe('generateFavorMission', () => {
      it('returns a mission with source cole and 0 reward', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission).toBeDefined();
        expect(mission.source).toBe('cole');
        expect(mission.reward).toBe(0);
        expect(mission.abandonable).toBe(false);
      });

      it('assigns a valid destination system', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.requirements.destination).toBeDefined();
        expect(typeof mission.requirements.destination).toBe('number');
      });

      it('assigns a destination different from current system', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.requirements.destination).not.toBe(
          gsm.state.player.currentSystem
        );
      });

      it('includes destination name and systemId', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.destination).toBeDefined();
        expect(mission.destination.systemId).toBe(
          mission.requirements.destination
        );
        expect(typeof mission.destination.name).toBe('string');
      });

      it('has a unique id based on template', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.id).toMatch(/^cole_/);
      });

      it('includes rewards with 0 credits', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.rewards).toBeDefined();
        expect(mission.rewards.credits).toBe(0);
      });
    });
  });

  describe('Cole Reputation Constants', () => {
    it('exports all Cole reputation constants', () => {
      expect(COLE_DEBT_CONFIG.COLE_NPC_ID).toBe('cole_sol');
      expect(COLE_DEBT_CONFIG.REP_PER_CREDIT_DIVISOR).toBe(500);
      expect(COLE_DEBT_CONFIG.REP_BORROW_BONUS).toBe(1);
      expect(COLE_DEBT_CONFIG.REP_MISSED_CHECKPOINT).toBe(-3);
      expect(COLE_DEBT_CONFIG.REP_WITHHOLDING_THRESHOLD).toBe(500);
      expect(COLE_DEBT_CONFIG.REP_FAVOR_FAIL).toBe(-5);
    });
  });

  describe('Save/Load Compatibility', () => {
    it('initializes finance state when loading old save without it', () => {
      // Simulate loading an old save that lacks player.finance
      gsm.initNewGame();
      delete gsm.state.player.finance;

      // The system should gracefully handle missing finance state
      // by providing defaults when DebtManager methods are called
      const info = gsm.getDebtInfo();
      expect(info).toBeDefined();
      expect(info.debt).toBe(gsm.state.player.debt);
    });
  });

  describe('Trading Integration', () => {
    it('applies withholding when selling goods', () => {
      // Set up trade scenario with debt and heat
      gsm.state.player.credits = 500;
      gsm.state.player.debt = 10000;
      gsm.state.player.finance.heat = 10; // low tier => 5% lien

      gsm.state.ship.cargo = [{ good: 'water', qty: 10, buyPrice: 50 }];

      // sellGood uses currentSystemPrices for market condition tracking,
      // and the state must already have them set (from initNewGame)
      // We just need cargo and a valid stack index.

      const result = gsm.sellGood(0, 10, 100);

      expect(result.success).toBe(true);
      // Revenue = 10 * 100 = 1000
      // Withholding = ceil(1000 * 0.05) = 50
      // Player gets 500 + 950 = 1450
      expect(gsm.state.player.credits).toBe(1450);
      // Debt reduced by 50
      expect(gsm.state.player.debt).toBe(9950);
      expect(result.withheld).toBe(50);
    });

    it('returns receipt data (totalRevenue, playerReceives) for trade receipt display', () => {
      gsm.state.player.credits = 500;
      gsm.state.player.debt = 10000;
      gsm.state.player.finance.heat = 10; // low tier => 5% lien

      gsm.state.ship.cargo = [{ good: 'water', qty: 10, buyPrice: 50 }];

      const result = gsm.sellGood(0, 10, 100);

      expect(result.success).toBe(true);
      // Revenue = 10 * 100 = 1000
      expect(result.totalRevenue).toBe(1000);
      // Withholding = ceil(1000 * 0.05) = 50
      expect(result.withheld).toBe(50);
      // Player receives = 1000 - 50 = 950
      expect(result.playerReceives).toBe(950);
    });

    it('does not withhold when debt is 0', () => {
      gsm.state.player.credits = 500;
      gsm.state.player.debt = 0;
      gsm.state.player.finance.heat = 10;

      gsm.state.ship.cargo = [{ good: 'water', qty: 5, buyPrice: 50 }];

      const result = gsm.sellGood(0, 5, 100);

      expect(result.success).toBe(true);
      // Revenue = 5 * 100 = 500, no withholding
      expect(gsm.state.player.credits).toBe(1000);
      expect(gsm.state.player.debt).toBe(0);
      expect(result.withheld).toBe(0);
      expect(result.totalRevenue).toBe(500);
      expect(result.playerReceives).toBe(500);
    });
  });
});
