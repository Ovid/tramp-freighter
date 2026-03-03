import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateProfit } from '../../src/features/trade/tradeUtils.js';
import { createTestGameStateManager } from '../test-utils.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

describe('calculateProfit', () => {
  it('percentage is a number, not a string', () => {
    const { percentage } = calculateProfit({ buyPrice: 100 }, 120);
    expect(typeof percentage).toBe('number');
    expect(percentage).toBe(20);
  });

  it('percentage rounds to integer', () => {
    const { percentage } = calculateProfit({ buyPrice: 3 }, 4);
    // (4-3)/3 * 100 = 33.333... → rounds to 33
    expect(percentage).toBe(33);
  });
});

describe('sellGood emits new cargo array reference', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('CARGO_CHANGED event carries a new array reference after sell', () => {
    const state = gsm.getState();
    state.player.credits = 1000;
    state.player.debt = 0;
    state.ship.cargo = [{ good: 'ore', qty: 10, buyPrice: 15 }];

    // Capture the cargo reference before the sell
    const cargoBefore = state.ship.cargo;

    // Listen for CARGO_CHANGED
    let emittedCargo = null;
    gsm.subscribe(EVENT_NAMES.CARGO_CHANGED, (data) => {
      emittedCargo = data;
    });

    // Set up prices so we can sell
    state.world.currentSystemPrices = { ore: 20 };

    gsm.sellGood(0, 5, 20);

    // The emitted cargo must be a different reference so React re-renders
    expect(emittedCargo).not.toBe(cargoBefore);
  });
});
