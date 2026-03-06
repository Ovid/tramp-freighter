import { describe, it, expect } from 'vitest';
import { transformOutcomeForDisplay } from '../../src/features/danger/transformOutcome';

describe('transformOutcomeForDisplay', () => {
  it('should map success, encounterType, and choiceMade', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {},
      description: 'You escaped.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'flee');

    expect(result.success).toBe(true);
    expect(result.encounterType).toBe('pirate');
    expect(result.choiceMade).toBe('flee');
    expect(result.explanation).toBe('You escaped.');
  });

  it('should convert costs to negative resourceChanges', () => {
    const raw = {
      success: false,
      costs: { hull: 20, fuel: 15, credits: 500 },
      rewards: {},
      description: 'Took damage.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'fight');

    expect(result.resourceChanges.hull).toBe(-20);
    expect(result.resourceChanges.fuel).toBe(-15);
    expect(result.resourceChanges.credits).toBe(-500);
  });

  it('should convert credit rewards to positive resourceChanges', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: { credits: 500 },
      description: 'Rewarded.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.resourceChanges.credits).toBe(500);
  });

  it('should combine credit costs and rewards', () => {
    const raw = {
      success: true,
      costs: { credits: 200 },
      rewards: { credits: 500 },
      description: 'Net gain.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    // -200 cost + 500 reward = net +300
    expect(result.resourceChanges.credits).toBe(300);
  });

  it('should extract karma into karmaChanges array', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: { karma: 1 },
      description: 'Good deed.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.karmaChanges).toEqual([
      { amount: 1, reason: 'distress_call' },
    ]);
  });

  it('should extract negative karma into karmaChanges array', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: { karma: -3 },
      description: 'Bad deed.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'loot');

    expect(result.karmaChanges).toEqual([
      { amount: -3, reason: 'distress_call' },
    ]);
  });

  it('should extract factionRep into reputationChanges array', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {
        factionRep: {
          civilians: 10,
          outlaws: -5,
        },
      },
      description: 'Helped.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.reputationChanges).toEqual([
      { faction: 'civilians', amount: 10, reason: 'distress_call' },
      { faction: 'outlaws', amount: -5, reason: 'distress_call' },
    ]);
  });

  it('should return empty arrays/objects when no karma or factionRep', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {},
      description: 'Nothing special.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'surrender');

    expect(result.karmaChanges).toEqual([]);
    expect(result.reputationChanges).toEqual([]);
    expect(result.modifiers).toEqual([]);
  });

  it('should handle cargoLoss cost', () => {
    const raw = {
      success: false,
      costs: { cargoLoss: true },
      rewards: {},
      description: 'Lost all cargo.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'fight');

    expect(result.resourceChanges.cargo).toBe(-100);
  });

  it('should handle cargoPercent cost', () => {
    const raw = {
      success: true,
      costs: { cargoPercent: 50 },
      rewards: {},
      description: 'Lost half cargo.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'flee');

    expect(result.resourceChanges.cargo).toBe(-50);
  });

  it('should handle days cost', () => {
    const raw = {
      success: true,
      costs: { days: 2 },
      rewards: {},
      description: 'Delayed.',
    };

    const result = transformOutcomeForDisplay(raw, 'distress_call', 'respond');

    expect(result.resourceChanges.days).toBe(2);
  });

  it('should populate additionalEffects when escalate is true', () => {
    const raw = {
      success: false,
      escalate: true,
      costs: {},
      rewards: {},
      description: "The pirates don't take kindly to your offer.",
    };

    const result = transformOutcomeForDisplay(
      raw,
      'negotiation',
      'counter_proposal'
    );

    expect(result.consequences.additionalEffects).toBeDefined();
    expect(result.consequences.additionalEffects.length).toBeGreaterThan(0);
    expect(result.consequences.additionalEffects[0]).toMatch(/aggressive/i);
  });

  it('should show restricted goods confiscated in additionalEffects', () => {
    const raw = {
      success: true,
      costs: { credits: 250, restrictedGoodsConfiscated: true },
      rewards: { factionRep: { authorities: -5 } },
      description: 'The inspector confiscated restricted goods.',
    };

    const result = transformOutcomeForDisplay(
      raw,
      'customs_inspection',
      'cooperate'
    );

    expect(result.consequences.additionalEffects).toBeDefined();
    expect(result.consequences.additionalEffects.length).toBeGreaterThan(0);
    expect(result.consequences.additionalEffects[0]).toMatch(/restricted/i);
    expect(result.consequences.additionalEffects[0]).toMatch(/confiscated/i);
  });

  it('should show hidden cargo confiscated in additionalEffects', () => {
    const raw = {
      success: true,
      costs: { credits: 500, hiddenCargoConfiscated: true },
      rewards: { factionRep: { authorities: -10 } },
      description: 'They found the hidden compartment.',
    };

    const result = transformOutcomeForDisplay(
      raw,
      'customs_inspection',
      'cooperate'
    );

    expect(result.consequences.additionalEffects).toBeDefined();
    expect(result.consequences.additionalEffects.length).toBeGreaterThan(0);
    expect(result.consequences.additionalEffects[0]).toMatch(/hidden cargo/i);
    expect(result.consequences.additionalEffects[0]).toMatch(/confiscated/i);
  });

  it('should not have additionalEffects when escalate is absent', () => {
    const raw = {
      success: true,
      costs: {},
      rewards: {},
      description: 'Resolved peacefully.',
    };

    const result = transformOutcomeForDisplay(raw, 'pirate', 'surrender');

    expect(result.consequences.additionalEffects).toBeUndefined();
  });
});
