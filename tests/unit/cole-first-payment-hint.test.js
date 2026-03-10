import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtManager } from '../../src/game/state/managers/debt.js';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Cole first payment hint', () => {
  let manager;
  let capabilities;

  beforeEach(() => {
    capabilities = {
      getOwnState: () => ({
        debt: 10000,
        finance: {
          totalRepaid: 0,
          heat: 50,
          lienRate: 0.05,
          interestRate: 0.03,
          gracePeriod: 30,
        },
      }),
      getCredits: () => 5000,
      getDaysElapsed: () => 40,
      getShipCargo: () => [],
      getCurrentSystem: () => 0,
      updateDebt: vi.fn(),
      updateCredits: vi.fn(),
      modifyRepRaw: vi.fn(),
      markDirty: vi.fn(),
      emit: vi.fn(),
      setNarrativeFlag: vi.fn(),
      starData: [],
      isTestEnvironment: true,
      initFinance: vi.fn(),
    };
    manager = new DebtManager(capabilities);
  });

  it('sets cole_first_payment_hint flag on first debt payment', () => {
    manager.makePayment(500);
    expect(capabilities.setNarrativeFlag).toHaveBeenCalledWith(
      'cole_first_payment_hint'
    );
  });

  it('does not set flag on subsequent payments', () => {
    // Simulate totalRepaid already > 0
    capabilities.getOwnState = () => ({
      debt: 9500,
      finance: {
        totalRepaid: 500,
        heat: 45,
        lienRate: 0.05,
        interestRate: 0.03,
        gracePeriod: 30,
      },
    });
    manager = new DebtManager(capabilities);
    manager.makePayment(500);
    expect(capabilities.setNarrativeFlag).not.toHaveBeenCalled();
  });
});

describe('Cole first payment narrative event', () => {
  it('should include cole_first_payment_hint event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'cole_first_payment_hint'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('dock');
    expect(event.once).toBe(true);
  });

  it('requires cole_first_payment_hint flag', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'cole_first_payment_hint'
    );
    const conditions = event.trigger.condition;
    const flagCondition = conditions.find(
      (c) => c.type === 'flag_set' && c.flag === 'cole_first_payment_hint'
    );
    expect(flagCondition).toBeDefined();
  });
});
