import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { NEGOTIATION_CONFIG, COMBAT_CONFIG } from '../../src/game/constants.js';

describe('Negotiation Escalation (#68/73)', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('should return escalate: true when counter-proposal fails', () => {
    const encounter = { demandPercent: 20, threatLevel: 0.5 };
    // rng=0.99 is well above the 0.6 base chance, so negotiation fails
    const result = gsm.negotiationManager.resolveCounterProposal(
      encounter,
      gsm.getState(),
      0.99
    );
    expect(result.success).toBe(false);
    expect(result.escalate).toBe(true);
  });

  it('should NOT return escalate when counter-proposal succeeds', () => {
    const state = gsm.getState();
    state.ship.cargo = [{ good: 'grain', qty: 10, buyPrice: 10 }];
    const encounter = { demandPercent: 20, threatLevel: 0.5 };
    // rng=0.01 is well below the 0.6 base chance, so negotiation succeeds
    const result = gsm.negotiationManager.resolveCounterProposal(
      encounter,
      gsm.getState(),
      0.01
    );
    expect(result.success).toBe(true);
    expect(result.escalate).toBeUndefined();
  });

  it('should include threatLevel increase constant for escalated combat', () => {
    expect(
      NEGOTIATION_CONFIG.OUTCOME_VALUES
        .COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE
    ).toBe(0.1);
  });

  it('should reduce combat success chance when strengthModifier is set', () => {
    // Clear quirks/upgrades to isolate the strengthModifier effect
    const state = gsm.getState();
    state.ship.quirks = [];
    state.ship.upgrades = [];
    state.player.karma = 0;

    const baseEncounter = { demandPercent: 20, threatLevel: 'moderate' };
    const escalatedEncounter = {
      demandPercent: 20,
      threatLevel: 'strong',
      strengthModifier:
        NEGOTIATION_CONFIG.OUTCOME_VALUES
          .COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE,
    };

    // Use an rng value between escalated chance and base chance
    // Base: 0.7, escalated: 0.6 — pick 0.65 which is between them
    const rngNearBoundary = COMBAT_CONFIG.EVASIVE.BASE_CHANCE - 0.05;

    const baseResult = gsm.combatManager.resolveEvasiveManeuvers(
      baseEncounter,
      gsm.getState(),
      rngNearBoundary
    );
    const escalatedResult = gsm.combatManager.resolveEvasiveManeuvers(
      escalatedEncounter,
      gsm.getState(),
      rngNearBoundary
    );

    // Normal encounter succeeds, escalated fails (chance reduced by 0.1)
    expect(baseResult.success).toBe(true);
    expect(escalatedResult.success).toBe(false);
  });
});
