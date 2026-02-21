import { BaseManager } from './base-manager.js';
import { COLE_DEBT_CONFIG } from '../../constants.js';
import { COLE_FAVOR_MISSIONS } from '../../data/cole-missions.js';

export class DebtManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  getFinance() {
    const state = this.getState();
    if (!state.player.finance) {
      state.player.finance = {
        heat: COLE_DEBT_CONFIG.STARTING_HEAT,
        lienRate: COLE_DEBT_CONFIG.STARTING_LIEN_RATE,
        interestRate: COLE_DEBT_CONFIG.INTEREST_RATE,
        lastInterestDay: 0,
        nextCheckpoint:
          state.player.daysElapsed + COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY,
        totalBorrowed: 0,
        totalRepaid: 0,
        borrowedThisPeriod: false,
        lastCheckpointRepaid: 0,
      };
    }
    return state.player.finance;
  }

  getDebt() {
    return this.getState().player.debt;
  }

  getHeatTier() {
    const heat = this.getFinance().heat;
    if (heat <= COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX) return 'low';
    if (heat <= COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX) return 'medium';
    if (heat <= COLE_DEBT_CONFIG.HEAT_TIER_HIGH_MAX) return 'high';
    return 'critical';
  }

  getLienRate() {
    if (this.getDebt() === 0) return 0;

    const tier = this.getHeatTier();
    switch (tier) {
      case 'low':
        return COLE_DEBT_CONFIG.LIEN_RATE_LOW;
      case 'medium':
        return COLE_DEBT_CONFIG.LIEN_RATE_MEDIUM;
      case 'high':
        return COLE_DEBT_CONFIG.LIEN_RATE_HIGH;
      case 'critical':
        return COLE_DEBT_CONFIG.LIEN_RATE_CRITICAL;
      default:
        return COLE_DEBT_CONFIG.LIEN_RATE_LOW;
    }
  }

  clampHeat(heat) {
    return Math.max(
      COLE_DEBT_CONFIG.HEAT_MIN,
      Math.min(COLE_DEBT_CONFIG.HEAT_MAX, heat)
    );
  }

  updateHeat(delta) {
    const finance = this.getFinance();
    finance.heat = this.clampHeat(finance.heat + delta);
    finance.lienRate = this.getLienRate();
    this.emitFinanceChanged();
  }

  applyInterest() {
    this.validateState();
    const state = this.getState();
    const finance = this.getFinance();
    const debt = this.getDebt();

    if (debt === 0) return;

    const daysSinceLast = state.player.daysElapsed - finance.lastInterestDay;
    if (daysSinceLast < COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS) return;

    const interest = Math.ceil(debt * finance.interestRate);
    this.gameStateManager.updateDebt(debt + interest);
    finance.lastInterestDay = state.player.daysElapsed;

    // Natural heat decay if player hasn't borrowed this period
    if (!finance.borrowedThisPeriod) {
      this.updateHeat(COLE_DEBT_CONFIG.HEAT_NATURAL_DECAY);
    }
    finance.borrowedThisPeriod = false;

    this.emitFinanceChanged();
  }

  getMaxDraw() {
    this.validateState();
    const state = this.getState();
    const credits = state.player.credits;
    const debt = this.getDebt();

    // Estimate cargo liquidation value
    const cargoValue = (state.ship.cargo || []).reduce(
      (sum, stack) => sum + stack.qty * stack.buyPrice,
      0
    );

    const netWorth = credits + cargoValue - debt;
    const calculated = Math.round(
      netWorth * COLE_DEBT_CONFIG.NET_WORTH_DRAW_PERCENT
    );

    return Math.max(COLE_DEBT_CONFIG.DEFAULT_DRAW, calculated);
  }

  getAvailableDrawTiers() {
    const maxDraw = this.getMaxDraw();
    const tiers = COLE_DEBT_CONFIG.DRAW_TIERS.filter((t) => t <= maxDraw);
    if (maxDraw > tiers[tiers.length - 1]) {
      tiers.push(maxDraw);
    }
    return tiers;
  }

  borrow(amount) {
    this.validateState();
    const state = this.getState();
    const finance = this.getFinance();
    const maxDraw = this.getMaxDraw();

    if (amount > maxDraw) {
      return { success: false, reason: 'Amount exceeds maximum draw' };
    }

    if (amount < COLE_DEBT_CONFIG.MIN_DRAW) {
      return { success: false, reason: 'Amount below minimum draw' };
    }

    // Increase debt
    this.gameStateManager.updateDebt(this.getDebt() + amount);

    // Give credits
    this.gameStateManager.updateCredits(state.player.credits + amount);

    // Increase heat
    const heatIncrease =
      COLE_DEBT_CONFIG.HEAT_BORROW_BASE +
      Math.floor(amount / 500) * COLE_DEBT_CONFIG.HEAT_BORROW_PER_500;
    this.updateHeat(heatIncrease);

    // Accelerate next checkpoint
    const accelerated =
      state.player.daysElapsed +
      COLE_DEBT_CONFIG.BORROW_CHECKPOINT_ACCELERATION_DAYS;
    finance.nextCheckpoint = Math.min(finance.nextCheckpoint, accelerated);

    // Track
    finance.totalBorrowed += amount;
    finance.borrowedThisPeriod = true;

    this.emitFinanceChanged();
    this.gameStateManager.saveGame();

    return { success: true, amount };
  }

  makePayment(amount) {
    this.validateState();
    const state = this.getState();
    const finance = this.getFinance();
    const debt = this.getDebt();

    if (debt === 0) {
      return { success: false, reason: 'No outstanding debt' };
    }

    if (state.player.credits < amount) {
      return { success: false, reason: 'Insufficient credits' };
    }

    // Cap at actual debt
    const actualPayment = Math.min(amount, debt);

    this.gameStateManager.updateDebt(debt - actualPayment);
    this.gameStateManager.updateCredits(state.player.credits - actualPayment);

    finance.totalRepaid += actualPayment;

    // Heat reduction per payment action
    this.updateHeat(COLE_DEBT_CONFIG.HEAT_VOLUNTARY_PAYMENT);

    // If debt is now 0, reset heat
    if (this.getDebt() === 0) {
      finance.heat = 0;
      finance.lienRate = 0;
    }

    this.emitFinanceChanged();
    this.gameStateManager.saveGame();

    return { success: true, amount: actualPayment };
  }

  calculateWithholding(totalRevenue) {
    const debt = this.getDebt();
    if (debt === 0) {
      return { withheld: 0, playerReceives: totalRevenue };
    }

    const lienRate = this.getLienRate();
    let withheld = Math.ceil(totalRevenue * lienRate);
    withheld = Math.min(withheld, debt);

    return {
      withheld,
      playerReceives: totalRevenue - withheld,
    };
  }

  applyWithholding(totalRevenue) {
    const { withheld } = this.calculateWithholding(totalRevenue);
    if (withheld === 0) return { withheld: 0 };

    const finance = this.getFinance();
    this.gameStateManager.updateDebt(this.getDebt() - withheld);
    finance.totalRepaid += withheld;

    if (this.getDebt() === 0) {
      finance.heat = 0;
      finance.lienRate = 0;
    }

    this.emitFinanceChanged();

    return { withheld };
  }

  getCheckpointInterval() {
    const tier = this.getHeatTier();
    switch (tier) {
      case 'low':
        return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_LOW;
      case 'medium':
        return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_MEDIUM;
      case 'high':
        return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_HIGH;
      case 'critical':
        return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_CRITICAL;
      default:
        return COLE_DEBT_CONFIG.CHECKPOINT_INTERVAL_LOW;
    }
  }

  checkCheckpoint() {
    this.validateState();
    const state = this.getState();
    const finance = this.getFinance();
    const debt = this.getDebt();

    if (debt === 0) return null;
    if (state.player.daysElapsed < finance.nextCheckpoint) return null;

    const madePayments = finance.totalRepaid > finance.lastCheckpointRepaid;

    if (!madePayments) {
      this.updateHeat(COLE_DEBT_CONFIG.HEAT_MISSED_CHECKPOINT);
    }

    // Record repayment level at this checkpoint
    finance.lastCheckpointRepaid = finance.totalRepaid;

    // Schedule next checkpoint
    const interval = this.getCheckpointInterval();
    finance.nextCheckpoint = state.player.daysElapsed + interval;

    const tier = this.getHeatTier();
    const requiresFavor = tier === 'high' || tier === 'critical';
    const favorMandatory = tier === 'critical';

    this.emitFinanceChanged();

    const result = {
      madePayments,
      tier,
      requiresFavor,
      favorMandatory,
      debt,
      heat: finance.heat,
    };

    if (requiresFavor) {
      result.favorMission = this.generateFavorMission();
    }

    return result;
  }

  getDebtInfo() {
    this.validateState();
    const state = this.getState();
    const finance = this.getFinance();
    const debt = this.getDebt();

    return {
      debt,
      lienRate: this.getLienRate(),
      interestRate: finance.interestRate,
      nextInterestDay:
        finance.lastInterestDay + COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS,
      maxDraw: this.getMaxDraw(),
      availableDrawTiers: this.getAvailableDrawTiers(),
      canBorrow: debt > 0 || true,
      canPay: debt > 0 && state.player.credits > 0,
      totalBorrowed: finance.totalBorrowed,
      totalRepaid: finance.totalRepaid,
      nextCheckpoint: finance.nextCheckpoint,
    };
  }

  generateFavorMission() {
    this.validateState();
    const state = this.getState();
    const starData = this.getStarData();

    // Pick a random template
    const templateIndex = Math.floor(
      Math.random() * COLE_FAVOR_MISSIONS.length
    );
    const template = COLE_FAVOR_MISSIONS[templateIndex];

    // Pick a random destination different from current system
    const currentSystem = state.player.currentSystem;
    const reachable = starData.filter(
      (s) => s.id !== currentSystem && s.r === 1
    );
    const destStar = reachable[Math.floor(Math.random() * reachable.length)];

    const deadline = template.requirements.deadline;

    return {
      id: `${template.id}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      type: template.type,
      source: template.source,
      title: template.title,
      description: template.description,
      giverSystem: currentSystem,
      requirements: {
        destination: destStar.id,
        deadline,
        cargoSpace: template.requirements.cargoSpace,
      },
      destination: {
        systemId: destStar.id,
        name: destStar.name,
      },
      missionCargo: template.missionCargo || null,
      rewards: { credits: template.reward },
      reward: template.reward,
      abandonable: template.abandonable,
    };
  }

  emitFinanceChanged() {
    this.emit('financeChanged', { ...this.getFinance() });
  }
}
