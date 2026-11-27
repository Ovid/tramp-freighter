import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { COMBAT_CONFIG, NEGOTIATION_CONFIG } from '../../src/game/constants.js';

/**
 * The odds a player is shown and the odds the resolver rolls against come
 * from one calculation, so they cannot drift apart.
 *
 * Feature: danger-system, combat odds
 */
describe('Combat odds', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
    const state = game.getState();
    state.ship.engine = 100;
    state.ship.quirks = [];
    state.ship.upgrades = [];
    state.player.karma = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('a worn engine lowers the evasive chance the resolver rolls against', () => {
    game.getState().ship.engine = COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD - 1;
    const healthyChance = COMBAT_CONFIG.EVASIVE.BASE_CHANCE;
    const wornChance = healthyChance + COMBAT_CONFIG.ENGINE_PENALTY_VALUE;
    const rollBetween = (healthyChance + wornChance) / 2;

    const result = game.combatManager.resolveEvasiveManeuvers(
      { strengthModifier: 0 },
      { player: { karma: 0 }, ship: { quirks: [], upgrades: [], engine: 40 } },
      rollBetween
    );

    expect(result.success).toBe(false);
  });

  it('reports the worn-engine penalty in the combat odds', () => {
    game.getState().ship.engine = COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD - 1;

    const odds = game.getCombatOdds({ strengthModifier: 0 });

    expect(odds.evasive.finalChance).toBeCloseTo(
      COMBAT_CONFIG.EVASIVE.BASE_CHANCE + COMBAT_CONFIG.ENGINE_PENALTY_VALUE
    );
    expect(odds.evasive.modifiers).toContainEqual({
      name: 'Poor Engine Condition',
      value: COMBAT_CONFIG.ENGINE_PENALTY_VALUE,
      type: 'penalty',
    });
  });

  it('includes an escalated encounter strength in every combat chance', () => {
    const strengthModifier = 0.1;

    const odds = game.getCombatOdds({ strengthModifier });

    expect(odds.evasive.finalChance).toBeCloseTo(
      COMBAT_CONFIG.EVASIVE.BASE_CHANCE - strengthModifier
    );
    expect(odds.returnFire.finalChance).toBeCloseTo(
      COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE - strengthModifier
    );
    expect(odds.distressCall.finalChance).toBeCloseTo(
      COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE - strengthModifier
    );
  });

  it('includes the sensitive_sensors bonus in the distress call chance', () => {
    game.getState().ship.quirks = ['sensitive_sensors'];

    const odds = game.getCombatOdds({ strengthModifier: 0 });

    expect(odds.distressCall.finalChance).toBeCloseTo(
      COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE +
        COMBAT_CONFIG.MODIFIERS.sensitive_sensors.distressBonus
    );
  });

  it('every shown combat chance is the threshold the resolver rolls against', () => {
    const state = game.getState();
    state.ship.engine = 30;
    state.ship.quirks = ['hot_thruster', 'sensitive_sensors'];
    state.ship.upgrades = ['efficient_drive'];
    state.player.karma = -120;
    const encounter = { strengthModifier: 0.1 };
    const odds = game.getCombatOdds(encounter);
    const view = {
      player: { karma: state.player.karma },
      ship: {
        quirks: state.ship.quirks,
        upgrades: state.ship.upgrades,
        engine: state.ship.engine,
      },
    };
    const eps = 1e-6;
    const cases = [
      ['resolveEvasiveManeuvers', odds.evasive.finalChance],
      ['resolveReturnFire', odds.returnFire.finalChance],
      ['resolveDistressCall', odds.distressCall.finalChance],
    ];

    for (const [method, chance] of cases) {
      const cm = game.combatManager;
      expect(cm[method](encounter, view, chance - eps).success).toBe(true);
      expect(cm[method](encounter, view, chance + eps).success).toBe(false);
    }
  });

  it('negotiation odds match the negotiation resolver', () => {
    game.getState().player.karma = 200;

    const odds = game.getNegotiationOdds();

    expect(odds.counterProposal.finalChance).toBeCloseTo(
      NEGOTIATION_CONFIG.COUNTER_PROPOSAL.BASE_CHANCE + 0.1
    );
    expect(odds.medicineClaim.finalChance).toBeCloseTo(
      NEGOTIATION_CONFIG.MEDICINE_CLAIM.SYMPATHY_CHANCE + 0.1
    );
    expect(odds.counterProposal.modifiers).toEqual([
      { name: 'Good Karma', value: expect.closeTo(0.1), type: 'bonus' },
    ]);
  });

  it('negotiation odds list no karma modifier too small to see', () => {
    game.getState().player.karma = 1;

    const odds = game.getNegotiationOdds();

    expect(odds.counterProposal.modifiers).toEqual([]);
    expect(odds.medicineClaim.modifiers).toEqual([]);
  });
});
