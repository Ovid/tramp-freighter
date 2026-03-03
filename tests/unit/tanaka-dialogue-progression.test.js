import { describe, it, expect } from 'vitest';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

function makeContext(overrides = {}) {
  return {
    getQuestStage: () => overrides.questStage ?? 0,
    getQuestState: () => overrides.questState ?? null,
    canStartQuestStage: () => false,
    checkQuestObjectives: () => false,
    hasClaimedStageRewards: () => false,
    canContributeSupply: () => false,
    ...overrides,
  };
}

describe('Tanaka greeting progression within NEUTRAL tier (pre-quest)', () => {
  const greeting = YUKI_TANAKA_DIALOGUE.greeting;

  it('shows cold greeting at rep 0-3', () => {
    const text = greeting.text(0, makeContext());
    expect(text).toContain('Engineer');
    expect(text).toContain('work to do');
  });

  it('shows acknowledging greeting at rep 4-6', () => {
    const text = greeting.text(4, makeContext());
    expect(text).toContain('adequate');
  });

  it('shows near-threshold greeting at rep 7-9', () => {
    const text = greeting.text(7, makeContext());
    expect(text).toContain('reliability');
  });

  it('still shows warm greeting at rep >= WARM_MIN', () => {
    const text = greeting.text(10, makeContext());
    expect(text).toContain('interests me');
  });
});

describe('Tanaka supply response tiered by rep', () => {
  const supplyNode = YUKI_TANAKA_DIALOGUE.research_supply;

  it('returns transactional response at low rep (< 4)', () => {
    const text = supplyNode.text(2, makeContext());
    expect(text).toMatch(/coupling array|consumes components/);
  });

  it('returns appreciative response at mid rep (4-6)', () => {
    const text = supplyNode.text(5, makeContext());
    expect(text).toMatch(/won't pretend|requisition paperwork/);
  });

  it('returns personal response at high rep (>= 7)', () => {
    const text = supplyNode.text(8, makeContext());
    expect(text).toMatch(/won't forget|containment housing/);
  });
});
