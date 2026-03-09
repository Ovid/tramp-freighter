import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  COLE_DEBT_CONFIG,
  NEW_GAME_DEFAULTS,
} from '../../src/game/constants.js';
import { DebtManager } from '../../src/game/state/managers/debt.js';

function buildDebtCapabilities(gsm) {
  return {
    getOwnState: () => ({
      debt: gsm.state.player.debt,
      finance: gsm.state.player.finance,
    }),
    initFinance: (financeObj) => {
      gsm.state.player.finance = financeObj;
    },
    getDaysElapsed: () => gsm.state.player.daysElapsed,
    getCredits: () => gsm.state.player.credits,
    getShipCargo: () => gsm.state.ship.cargo,
    getCurrentSystem: () => gsm.state.player.currentSystem,
    updateDebt: (amount) => {
      gsm.state.player.debt = amount;
    },
    updateCredits: (value) => {
      gsm.state.player.credits = value;
    },
    modifyRepRaw: (npcId, amount, reason) =>
      gsm.modifyRepRaw(npcId, amount, reason),
    markDirty: () => {},
    emit: (...args) => gsm.emit(...args),
    starData: STAR_DATA,
    isTestEnvironment: true,
  };
}

describe('Cole Debt System', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Finance State Initialization', () => {
    it('initializes player.finance with correct defaults', () => {
      const state = gsm.state;
      expect(state.player.finance).toEqual(expect.any(Object));
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
      gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
      gsm.initNewGame();
      debtManager = new DebtManager(buildDebtCapabilities(gsm));
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

      it('improves Cole rep by +1 per borrow', () => {
        gsm.state.player.credits = 5000;
        gsm.state.player.debt = 0;

        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

        debtManager.borrow(100);
        expect(gsm.getNPCState('cole_sol').rep).toBe(-19);

        debtManager.borrow(250);
        expect(gsm.getNPCState('cole_sol').rep).toBe(-18);
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

      it('improves Cole rep by floor(amount/500), min +1 per payment', () => {
        gsm.state.player.credits = 15000;
        gsm.state.player.debt = 15000;

        // Cole starts at -20
        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

        // Pay 500 → floor(500/500) = 1 → +1
        debtManager.makePayment(500);
        expect(gsm.getNPCState('cole_sol').rep).toBe(-19);

        // Pay 100 → floor(100/500) = 0, but min +1 → +1
        debtManager.makePayment(100);
        expect(gsm.getNPCState('cole_sol').rep).toBe(-18);

        // Pay 1000 → floor(1000/500) = 2 → +2
        debtManager.makePayment(1000);
        expect(gsm.getNPCState('cole_sol').rep).toBe(-16);
      });

      it('gives Cole a significant rep bonus when debt is fully cleared', () => {
        gsm.state.player.credits = 15000;
        gsm.state.player.debt = 500;

        const repBefore = gsm.getNPCState('cole_sol').rep;

        debtManager.makePayment(500);

        expect(gsm.state.player.debt).toBe(0);

        const repAfter = gsm.getNPCState('cole_sol').rep;
        // Debt-cleared bonus should push Cole well past COLD (-10) into NEUTRAL or higher
        expect(repAfter).toBeGreaterThanOrEqual(-9);
        // Should be a meaningful jump, not just the per-payment +1
        expect(repAfter - repBefore).toBeGreaterThan(5);
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

      it('does not cap withholding at current debt (pure penalty)', () => {
        gsm.state.player.debt = 20;
        gsm.state.player.finance.heat = 10;

        const result = debtManager.calculateWithholding(1000);

        // 5% of 1000 = 50, NOT capped at debt of 20
        expect(result.withheld).toBe(50);
        expect(result.playerReceives).toBe(950);
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
      it('does not reduce debt (pure penalty)', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 10;

        debtManager.applyWithholding(1000);

        expect(gsm.state.player.debt).toBe(10000);
        expect(gsm.state.player.finance.totalRepaid).toBe(0);
      });

      it('returns withheld amount without affecting debt', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.heat = 80; // critical, 20% lien

        const result = debtManager.applyWithholding(5000);

        expect(result.withheld).toBe(1000);
        expect(gsm.state.player.debt).toBe(10000);
      });

      it('does not modify Cole rep', () => {
        gsm.state.player.debt = 100000;
        gsm.state.player.finance.heat = 80; // critical, 20% lien

        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

        debtManager.applyWithholding(5000);

        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);
      });
    });

    describe('applyInterest', () => {
      it('applies interest when period has elapsed', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.lastInterestDay = 0;
        gsm.state.player.daysElapsed = 30;

        debtManager.applyInterest();

        // 10000 * 0.03 = 300, ceil = 300
        expect(gsm.state.player.debt).toBe(10300);
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

        // 150 * 0.03 = 4.5, ceil = 5
        expect(gsm.state.player.debt).toBe(155);
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

      it('reduces Cole rep by 3 when no payments made at checkpoint', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.finance.totalRepaid = 0;
        gsm.state.player.finance.lastCheckpointRepaid = 0;
        gsm.state.player.finance.heat = 10;
        gsm.state.player.daysElapsed = 30;

        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

        debtManager.checkCheckpoint();

        expect(gsm.getNPCState('cole_sol').rep).toBe(-23);
      });

      it('does not reduce Cole rep when payments were made at checkpoint', () => {
        gsm.state.player.debt = 10000;
        gsm.state.player.finance.nextCheckpoint = 30;
        gsm.state.player.finance.totalRepaid = 500;
        gsm.state.player.finance.lastCheckpointRepaid = 0;
        gsm.state.player.finance.heat = 10;
        gsm.state.player.daysElapsed = 30;

        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

        debtManager.checkCheckpoint();

        expect(gsm.getNPCState('cole_sol').rep).toBe(-20);
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
        expect(info.interestRate).toBe(COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM);
        expect(info.nextInterestDay).toEqual(expect.any(Number));
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

        expect(mission).toEqual(expect.objectContaining({ source: 'cole' }));
        expect(mission.reward).toBe(0);
        expect(mission.abandonable).toBe(false);
      });

      it('assigns a valid destination system', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.requirements.destination).toEqual(expect.any(Number));
      });

      it('assigns a destination different from current system', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.requirements.destination).not.toBe(
          gsm.state.player.currentSystem
        );
      });

      it('includes destination name and systemId', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.destination).toEqual(
          expect.objectContaining({
            systemId: mission.requirements.destination,
            name: expect.any(String),
          })
        );
      });

      it('has a unique id based on template', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.id).toMatch(/^cole_/);
      });

      it('includes rewards with 0 credits', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.rewards).toEqual(
          expect.objectContaining({ credits: 0 })
        );
      });

      it('includes coleRepReward from template', () => {
        const mission = debtManager.generateFavorMission();

        expect(mission.coleRepReward).toEqual(expect.any(Number));
        expect(mission.coleRepReward).toBeGreaterThanOrEqual(8);
        expect(mission.coleRepReward).toBeLessThanOrEqual(12);
      });
    });

    describe('modifyColeRep', () => {
      it('changes Cole rep by delta, bypassing trust modifier', () => {
        // Cole starts at -20 (COLD)
        const coleBefore = gsm.getNPCState('cole_sol');
        expect(coleBefore.rep).toBe(-20);

        debtManager.modifyColeRep(5);

        const coleAfter = gsm.getNPCState('cole_sol');
        expect(coleAfter.rep).toBe(-15);
      });

      it('clamps rep to [-100, 100] range', () => {
        gsm.setNpcRep('cole_sol', 98);

        debtManager.modifyColeRep(10);

        const coleAfter = gsm.getNPCState('cole_sol');
        expect(coleAfter.rep).toBe(100);
      });

      it('handles negative deltas', () => {
        gsm.setNpcRep('cole_sol', 0);

        debtManager.modifyColeRep(-5);

        const coleAfter = gsm.getNPCState('cole_sol');
        expect(coleAfter.rep).toBe(-5);
      });
    });
  });

  describe('Cole Mission Reputation', () => {
    it('completes cole mission and applies direct rep reward', () => {
      gsm.state.player.credits = 5000;
      gsm.state.player.currentSystem = 0;

      // Create a Cole mission at destination = current system (so it can complete)
      const coleMission = {
        id: 'cole_courier_test',
        type: 'delivery',
        source: 'cole',
        title: 'Sealed Package',
        description: 'Test delivery',
        giverSystem: 1,
        requirements: { destination: 0, deadline: 21, cargoSpace: 1 },
        destination: { systemId: 0, name: 'Sol' },
        missionCargo: { good: 'sealed_package', quantity: 1 },
        rewards: { credits: 0 },
        reward: 0,
        abandonable: false,
        coleRepReward: 8,
      };

      gsm.state.missions.active.push(coleMission);
      gsm.state.ship.cargo.push({
        good: 'sealed_package',
        qty: 1,
        buyPrice: 0,
        missionId: 'cole_courier_test',
      });

      expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

      gsm.completeMission('cole_courier_test');

      expect(gsm.getNPCState('cole_sol').rep).toBe(-12); // -20 + 8
    });

    it('applies -5 rep when Cole mission deadline expires', () => {
      gsm.state.player.daysElapsed = 50;

      const coleMission = {
        id: 'cole_courier_fail_test',
        type: 'delivery',
        source: 'cole',
        title: 'Sealed Package',
        description: 'Test delivery',
        giverSystem: 1,
        requirements: { destination: 5, deadline: 21, cargoSpace: 1 },
        destination: { systemId: 5, name: 'Alpha Centauri' },
        missionCargo: { good: 'sealed_package', quantity: 1 },
        rewards: { credits: 0 },
        reward: 0,
        abandonable: false,
        deadlineDay: 40, // Already past (daysElapsed is 50)
      };

      gsm.state.missions.active.push(coleMission);
      gsm.state.ship.cargo.push({
        good: 'sealed_package',
        qty: 1,
        buyPrice: 0,
        missionId: 'cole_courier_fail_test',
      });

      expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

      gsm.checkMissionDeadlines();

      expect(gsm.getNPCState('cole_sol').rep).toBe(-25); // -20 + (-5)
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
      expect(info).toEqual(
        expect.objectContaining({ debt: gsm.state.player.debt })
      );
    });
  });

  describe('Trading Integration', () => {
    it('applies withholding when selling goods without reducing debt', () => {
      // Set up trade scenario with debt and heat
      gsm.state.player.credits = 500;
      gsm.state.player.debt = 10000;
      gsm.state.player.finance.heat = 10; // low tier => 5% lien

      gsm.state.ship.cargo = [{ good: 'water', qty: 10, buyPrice: 50 }];

      const result = gsm.sellGood(0, 10, 100);

      expect(result.success).toBe(true);
      // Revenue = 10 * 100 = 1000
      // Withholding = ceil(1000 * 0.05) = 50
      // Player gets 500 + 950 = 1450
      expect(gsm.state.player.credits).toBe(1450);
      // Debt NOT reduced — Cole's cut is a penalty, not repayment
      expect(gsm.state.player.debt).toBe(10000);
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

  describe('Cole Reputation Progression', () => {
    let debtManager;

    beforeEach(() => {
      debtManager = new DebtManager(buildDebtCapabilities(gsm));
    });

    it('paying off 10K in voluntary payments moves Cole from COLD to NEUTRAL or better', () => {
      gsm.state.player.credits = 20000;
      gsm.state.player.debt = 10000;

      expect(gsm.getNPCState('cole_sol').rep).toBe(-20);

      // Pay 10 x ₡1000 payments
      for (let i = 0; i < 10; i++) {
        debtManager.makePayment(1000);
      }

      const coleRep = gsm.getNPCState('cole_sol').rep;
      // Each ₡1000 payment → floor(1000/500) = +2 rep → 10 * 2 = +20
      // Final payment clears debt → +15 bonus (REP_DEBT_CLEARED_BONUS)
      // -20 + 20 + 15 = 15 (WARM)
      expect(coleRep).toBe(15);
    });

    it('borrow-and-repay cycle builds rep over time', () => {
      gsm.state.player.credits = 10000;
      gsm.state.player.debt = 0;

      gsm.setNpcRep('cole_sol', 0); // Start at NEUTRAL for this test

      // Borrow 500 → +1 rep
      debtManager.borrow(500);
      // Repay 500 → +1 rep (floor(500/500)) + 15 (debt cleared bonus)
      debtManager.makePayment(500);

      // +1 (borrow) + 1 (payment) + 15 (debt cleared) = +17
      expect(gsm.getNPCState('cole_sol').rep).toBe(17);
    });
  });
});
