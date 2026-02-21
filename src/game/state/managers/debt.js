import { BaseManager } from './base-manager.js';
import { COLE_DEBT_CONFIG } from '../../constants.js';

export class DebtManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  getFinance() {
    return this.getState().player.finance;
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

  emitFinanceChanged() {
    this.emit('financeChanged', { ...this.getFinance() });
  }
}
