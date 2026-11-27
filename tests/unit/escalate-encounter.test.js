import { describe, it, expect } from 'vitest';
import { escalateEncounter } from '../../src/game/utils/calculators.js';
import { NEGOTIATION_CONFIG } from '../../src/game/constants.js';

/**
 * Feature: danger-system, negotiation escalation
 */
describe('escalateEncounter', () => {
  it('returns an escalated copy and leaves the original encounter untouched', () => {
    const original = { id: 'p', type: 'pirate', threatLevel: 'weak' };

    const escalated = escalateEncounter(original);

    expect(escalated).toEqual({
      id: 'p',
      type: 'pirate',
      threatLevel: 'moderate',
      strengthModifier:
        NEGOTIATION_CONFIG.OUTCOME_VALUES
          .COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE,
    });
    expect(original).toEqual({ id: 'p', type: 'pirate', threatLevel: 'weak' });
  });
});
