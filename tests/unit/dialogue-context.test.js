import { describe, it, expect } from 'vitest';
import { buildDialogueContext } from '../../src/game/game-dialogue.js';

describe('buildDialogueContext', () => {
  const mockGSM = {
    getState: () => ({
      player: { daysElapsed: 42, credits: 1000, debt: 5000 },
      ship: {
        cargo: [{ type: 'food', quantity: 5 }],
        hull: 85,
        engine: 90,
      },
      world: { visitedSystems: [0, 1, 4] },
    }),
    getKarma: () => 15,
    getHeatTier: () => 'low',
    getNPCState: (_id) => ({
      rep: 50,
      loanAmount: 0,
      loanDay: null,
      storedCargo: [],
      flags: [],
    }),
    canGetTip: (_id) => ({ available: true }),
    canRequestFavor: (id, type) => ({ available: type === 'loan' }),
    getFactionRep: (f) =>
      ({ authorities: 10, outlaws: -5, civilians: 20 })[f] || 0,
    getQuestStage: () => 0,
    getQuestState: () => null,
    canStartQuestStage: () => false,
    checkQuestObjectives: () => ({}),
    hasClaimedStageRewards: () => false,
    getNarrativeFlags: () => ({ tanaka_met: true }),
    requestLoan: () => ({ success: true }),
    storeCargo: () => ({ success: true }),
    repayLoan: () => ({ success: true }),
    retrieveCargo: () => ({ success: true }),
    advanceQuest: () => ({ success: true }),
    claimStageRewards: () => ({ success: true }),
    startPavonisRun: () => {},
    updateQuestData: () => {},
    modifyColeRep: () => {},
  };

  it('builds context with data properties', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.karma).toBe(15);
    expect(ctx.heat).toBe('low');
    expect(ctx.daysElapsed).toBe(42);
    expect(ctx.credits).toBe(1000);
    expect(ctx.factionReps.authorities).toBe(10);
    expect(ctx.canGetTip).toEqual({ available: true });
  });

  it('builds context with npc state', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.npcState.rep).toBe(50);
  });

  it('builds context with action callbacks', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(typeof ctx.requestLoan).toBe('function');
    expect(typeof ctx.storeCargo).toBe('function');
    expect(typeof ctx.repayLoan).toBe('function');
    expect(typeof ctx.retrieveCargo).toBe('function');
  });

  it('builds context with quest accessors', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(typeof ctx.getQuestStage).toBe('function');
    expect(typeof ctx.getQuestState).toBe('function');
  });

  it('includes systemsVisited count', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.systemsVisited).toBe(3);
  });

  it('includes narrativeFlags', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.narrativeFlags).toEqual({ tanaka_met: true });
  });

  it('includes ship hull and engine conditions', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.shipHull).toBe(85);
    expect(ctx.shipEngine).toBe(90);
  });

  it('includes player debt', () => {
    const ctx = buildDialogueContext(mockGSM, 'test_npc');
    expect(ctx.debt).toBe(5000);
  });
});
