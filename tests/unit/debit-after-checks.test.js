import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';

// A throw after the debit would leave the player charged for nothing.
describe('credits are taken only after every check that can throw', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuel keeps credits when the fuel-reduction guard throws', () => {
    const state = gsm.state;
    state.player.credits = 500;
    state.ship.fuel = 120; // above capacity: the guard's trigger
    vi.spyOn(gsm.refuelManager, 'validateRefuel').mockReturnValue({
      valid: true,
      cost: 40,
    });

    expect(() => gsm.refuel(10)).toThrow(/CRITICAL BUG/);
    expect(state.player.credits).toBe(500);
  });

  it('buyGood keeps credits when the current system is unknown', () => {
    const state = gsm.state;
    state.player.credits = 1000;
    state.ship.cargo = [];
    state.player.currentSystem = 99999;

    expect(() => gsm.tradingManager.buyGood('ore', 5, 100)).toThrow();
    expect(state.player.credits).toBe(1000);
  });
});
