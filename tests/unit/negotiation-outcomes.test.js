import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NegotiationManager } from '@game/state/managers/negotiation.js';

const HANDLED_COST_FIELDS = [
  'fuel',
  'hull',
  'engine',
  'lifeSupport',
  'credits',
  'cargoLoss',
  'cargoPercent',
  'days',
  'passengerSatisfaction',
  'kidnappedPassengerId',
  'restrictedGoodsConfiscated',
  'hiddenCargoConfiscated',
];

const HANDLED_REWARD_FIELDS = [
  'credits',
  'karma',
  'factionRep',
  'cargo',
  'passengerSatisfaction',
  'fuelMinimum',
];

describe('Negotiation outcome schema', () => {
  let manager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager = new NegotiationManager({
      getShipCargo: () => [],
      getCredits: () => 500,
      getDaysElapsed: () => 10,
      getCurrentSystem: () => 0,
      getActiveMissions: () => [],
      getHasPriorIntel: () => false,
      getKarma: () => 0,
      incrementDangerFlag: vi.fn(),
      emit: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('counter-proposal failure should not return unhandled cost fields', () => {
    const encounter = { strength: 0.5 };
    const gameState = {
      player: { karma: 0, credits: 500 },
      ship: { cargo: [] },
    };

    // Force failure with high rng
    const result = manager.resolveCounterProposal(encounter, gameState, 0.99);

    expect(result.success).toBe(false);
    Object.keys(result.costs).forEach((key) => {
      expect(HANDLED_COST_FIELDS).toContain(key);
    });
  });

  it('medicine claim lie should not return unhandled cost fields', () => {
    const encounter = { strength: 0.5 };
    const gameState = {
      player: { karma: 0, credits: 500 },
      ship: { cargo: [] },
    };

    const result = manager.resolveMedicineClaim(encounter, gameState, 0.99);

    expect(result.success).toBe(false);
    Object.keys(result.costs).forEach((key) => {
      expect(HANDLED_COST_FIELDS).toContain(key);
    });
  });

  it('intel offer with no intel should not return unhandled cost fields', () => {
    const encounter = { strength: 0.5 };
    const gameState = {
      player: { karma: 0, credits: 500 },
      world: { flags: {} },
    };

    const result = manager.resolveIntelOffer(encounter, gameState, 0.99);

    expect(result.success).toBe(false);
    Object.keys(result.costs).forEach((key) => {
      expect(HANDLED_COST_FIELDS).toContain(key);
    });
  });

  it('intel offer failure should use factionRep for authority penalty', () => {
    const encounter = { strength: 0.5 };
    const gameState = {
      player: { karma: 0, credits: 500 },
      world: { flags: { hasPriorIntel: true } },
    };

    // Force failure with high rng
    const result = manager.resolveIntelOffer(encounter, gameState, 0.99);

    expect(result.success).toBe(false);
    expect(result.costs).not.toHaveProperty('reputationPenalty');
    expect(result.rewards.factionRep).toBeDefined();
    expect(result.rewards.factionRep.authorities).toBeLessThan(0);
    Object.keys(result.rewards).forEach((key) => {
      expect(HANDLED_REWARD_FIELDS).toContain(key);
    });
  });
});
