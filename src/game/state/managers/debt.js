import { BaseManager } from './base-manager.js';
import { COLE_DEBT_CONFIG, EVENT_NAMES } from '../../constants.js';
import { COLE_FAVOR_MISSIONS } from '../../data/cole-missions.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

export class DebtManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
  }

  getFinance() {
    const ownState = this.capabilities.getOwnState();
    if (!ownState.finance) {
      const financeObj = {
        heat: COLE_DEBT_CONFIG.STARTING_HEAT,
        lienRate: COLE_DEBT_CONFIG.STARTING_LIEN_RATE,
        interestRate: COLE_DEBT_CONFIG.INTEREST_RATE,
        lastInterestDay: 0,
        nextCheckpoint:
          this.capabilities.getDaysElapsed() +
          COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY,
        totalBorrowed: 0,
        totalRepaid: 0,
        borrowedThisPeriod: false,
        lastCheckpointRepaid: 0,
        lastBorrowDay: null,
      };
      this.capabilities.initFinance(financeObj);
      return financeObj;
    }
    return ownState.finance;
  }

  getDebt() {
    return this.capabilities.getOwnState().debt;
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

  getInterestRate() {
    if (this.getDebt() === 0) return 0;

    const tier = this.getHeatTier();
    switch (tier) {
      case 'low':
        return COLE_DEBT_CONFIG.INTEREST_RATE_LOW;
      case 'medium':
        return COLE_DEBT_CONFIG.INTEREST_RATE_MEDIUM;
      case 'high':
        return COLE_DEBT_CONFIG.INTEREST_RATE_HIGH;
      case 'critical':
        return COLE_DEBT_CONFIG.INTEREST_RATE_CRITICAL;
      default:
        return COLE_DEBT_CONFIG.INTEREST_RATE_LOW;
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
    finance.interestRate = this.getInterestRate();
  }

  applyInterest() {
    const finance = this.getFinance();
    const debt = this.getDebt();

    if (debt === 0) return;

    const daysElapsed = this.capabilities.getDaysElapsed();
    const daysSinceLast = daysElapsed - finance.lastInterestDay;
    if (daysSinceLast < COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS) return;

    const interest = Math.ceil(debt * this.getInterestRate());
    this.capabilities.updateDebt(debt + interest);
    finance.lastInterestDay = daysElapsed;

    // Natural heat decay if player hasn't borrowed this period
    if (!finance.borrowedThisPeriod) {
      this.updateHeat(COLE_DEBT_CONFIG.HEAT_NATURAL_DECAY);
    }
    finance.borrowedThisPeriod = false;

    this.emitFinanceChanged();
  }

  getMaxDraw() {
    const credits = this.capabilities.getCredits();
    const debt = this.getDebt();

    // Estimate cargo liquidation value
    const cargo = this.capabilities.getShipCargo();
    const cargoValue = (cargo || []).reduce(
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
    const finance = this.getFinance();
    const maxDraw = this.getMaxDraw();

    if (amount > maxDraw) {
      return { success: false, reason: 'Amount exceeds maximum draw' };
    }

    if (amount < COLE_DEBT_CONFIG.MIN_DRAW) {
      return { success: false, reason: 'Amount below minimum draw' };
    }

    const credits = this.capabilities.getCredits();
    const daysElapsed = this.capabilities.getDaysElapsed();

    // Increase debt
    this.capabilities.updateDebt(this.getDebt() + amount);

    // Give credits
    this.capabilities.updateCredits(credits + amount);

    // Increase heat
    const heatIncrease =
      COLE_DEBT_CONFIG.HEAT_BORROW_BASE +
      Math.floor(amount / COLE_DEBT_CONFIG.HEAT_BORROW_STEP) *
        COLE_DEBT_CONFIG.HEAT_BORROW_PER_STEP;
    this.updateHeat(heatIncrease);

    // Accelerate next checkpoint
    const accelerated =
      daysElapsed + COLE_DEBT_CONFIG.BORROW_CHECKPOINT_ACCELERATION_DAYS;
    finance.nextCheckpoint = Math.min(finance.nextCheckpoint, accelerated);

    // Track
    finance.totalBorrowed += amount;
    finance.borrowedThisPeriod = true;
    finance.lastBorrowDay = daysElapsed;

    // Cole likes customers
    this.modifyColeRep(COLE_DEBT_CONFIG.REP_BORROW_BONUS);

    this.emitFinanceChanged();
    this.capabilities.markDirty();

    return { success: true, amount };
  }

  makePayment(amount) {
    const finance = this.getFinance();
    const debt = this.getDebt();

    if (debt === 0) {
      return { success: false, reason: 'No outstanding debt' };
    }

    let actualPayment = Math.min(amount, debt);

    if (actualPayment <= 0) {
      return { success: false, reason: 'Invalid payment amount' };
    }

    const credits = this.capabilities.getCredits();
    const daysElapsed = this.capabilities.getDaysElapsed();

    // Calculate early repayment fee
    let fee = 0;
    if (
      finance.lastBorrowDay !== null &&
      daysElapsed - finance.lastBorrowDay <
        COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS
    ) {
      fee = Math.ceil(
        actualPayment * COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE
      );
    }

    const totalCost = actualPayment + fee;

    // If can't afford payment + fee, reduce payment to fit
    if (credits < totalCost) {
      if (fee > 0) {
        actualPayment = Math.floor(
          credits / (1 + COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE)
        );
        actualPayment = Math.min(actualPayment, debt);
        if (actualPayment <= 0) {
          return { success: false, reason: 'Insufficient credits' };
        }
        fee = Math.ceil(
          actualPayment * COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE
        );
      } else {
        if (credits < actualPayment) {
          return { success: false, reason: 'Insufficient credits' };
        }
      }
    }

    this.capabilities.updateDebt(debt - actualPayment);
    this.capabilities.updateCredits(credits - actualPayment - fee);

    if (finance.totalRepaid === 0 && this.capabilities.setNarrativeFlag) {
      this.capabilities.setNarrativeFlag('cole_first_payment_hint');
    }

    finance.totalRepaid += actualPayment;

    // Heat reduction per payment action
    this.updateHeat(COLE_DEBT_CONFIG.HEAT_VOLUNTARY_PAYMENT);

    // Cole respects payers: +floor(actualPayment/divisor), min +1
    const repGain = Math.max(
      1,
      Math.floor(actualPayment / COLE_DEBT_CONFIG.REP_PER_CREDIT_DIVISOR)
    );
    this.modifyColeRep(repGain);

    // If debt is now 0, reset heat and notify for immediate narrative trigger
    if (this.getDebt() === 0) {
      finance.heat = 0;
      finance.lienRate = 0;
      finance.interestRate = 0;
      this.modifyColeRep(COLE_DEBT_CONFIG.REP_DEBT_CLEARED_BONUS);
    }

    this.emitFinanceChanged();

    if (this.getDebt() === 0) {
      this.capabilities.emit(EVENT_NAMES.DEBT_CLEARED);
    }
    this.capabilities.markDirty();

    return { success: true, amount: actualPayment, fee };
  }

  calculateWithholding(totalRevenue) {
    const debt = this.getDebt();
    if (debt === 0) {
      return { withheld: 0, playerReceives: totalRevenue };
    }

    const lienRate = this.getLienRate();
    const withheld = Math.ceil(totalRevenue * lienRate);

    return {
      withheld,
      playerReceives: totalRevenue - withheld,
    };
  }

  applyWithholding(totalRevenue) {
    const { withheld } = this.calculateWithholding(totalRevenue);
    if (withheld === 0) return { withheld: 0 };

    // Cole's cut is a pure penalty — money taken, debt unchanged.
    // Only voluntary payments through the Finance panel reduce debt.

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
    const finance = this.getFinance();
    const debt = this.getDebt();
    const daysElapsed = this.capabilities.getDaysElapsed();

    if (debt === 0) return null;
    if (daysElapsed < finance.nextCheckpoint) return null;

    const madePayments = finance.totalRepaid > finance.lastCheckpointRepaid;

    if (!madePayments) {
      this.updateHeat(COLE_DEBT_CONFIG.HEAT_MISSED_CHECKPOINT);
      this.modifyColeRep(COLE_DEBT_CONFIG.REP_MISSED_CHECKPOINT);
    }

    // Record repayment level at this checkpoint
    finance.lastCheckpointRepaid = finance.totalRepaid;

    // Schedule next checkpoint
    const interval = this.getCheckpointInterval();
    finance.nextCheckpoint = daysElapsed + interval;

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
    const finance = this.getFinance();
    const debt = this.getDebt();
    const credits = this.capabilities.getCredits();
    const daysElapsed = this.capabilities.getDaysElapsed();

    const isEarlyRepayment =
      finance.lastBorrowDay !== null &&
      daysElapsed - finance.lastBorrowDay <
        COLE_DEBT_CONFIG.EARLY_REPAYMENT_WINDOW_DAYS;

    return {
      debt,
      lienRate: this.getLienRate(),
      interestRate: this.getInterestRate(),
      nextInterestDay:
        finance.lastInterestDay + COLE_DEBT_CONFIG.INTEREST_PERIOD_DAYS,
      maxDraw: this.getMaxDraw(),
      availableDrawTiers: this.getAvailableDrawTiers(),
      canPay: debt > 0 && credits > 0,
      totalBorrowed: finance.totalBorrowed,
      totalRepaid: finance.totalRepaid,
      nextCheckpoint: finance.nextCheckpoint,
      earlyRepaymentFeeRate: isEarlyRepayment
        ? COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE
        : 0,
    };
  }

  generateFavorMission() {
    const daysElapsed = this.capabilities.getDaysElapsed();
    const currentSystem = this.capabilities.getCurrentSystem();
    const starData = this.capabilities.starData;

    const seed = buildEncounterSeed(
      daysElapsed,
      currentSystem,
      'favor_mission'
    );
    const rng = new SeededRandom(seed);

    // Pick a random template
    const templateIndex = Math.floor(rng.next() * COLE_FAVOR_MISSIONS.length);
    const template = COLE_FAVOR_MISSIONS[templateIndex];
    const reachable = starData.filter(
      (s) => s.id !== currentSystem && s.r === 1
    );
    if (reachable.length === 0) {
      throw new Error(
        `No reachable systems found for favor mission from system ${currentSystem}`
      );
    }
    const destStar = reachable[Math.floor(rng.next() * reachable.length)];

    const deadline = template.requirements.deadline;

    return {
      id: `${template.id}_${Date.now()}_${Math.floor(rng.next() * 10000)}`,
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
      coleRepReward: template.coleRepReward,
    };
  }

  modifyColeRep(delta) {
    this.capabilities.modifyRepRaw(
      COLE_DEBT_CONFIG.COLE_NPC_ID,
      delta,
      'cole_debt'
    );
  }

  emitFinanceChanged() {
    this.capabilities.emit(EVENT_NAMES.FINANCE_CHANGED, {
      ...this.getFinance(),
    });
  }
}
