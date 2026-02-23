import { describe, it, expect } from 'vitest';
import {
  hasFactionRep,
  hasKarma,
  hasMaxKarma,
  isTrustedByAuthorities,
  isKnownToOutlaws,
  isFriendToCivilians,
  hasGoodKarma,
  hasBadKarma,
  isWantedByAuthorities,
  hasMixedReputation,
  getKarmaFirstImpression,
  getFactionAttitudeModifier,
} from '../../src/game/data/dialogue/faction-karma-conditions.js';

describe('faction-karma-conditions with context object', () => {
  const makeContext = (overrides = {}) => ({
    karma: 0,
    factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
    ...overrides,
  });

  it('hasFactionRep checks context.factionReps', () => {
    const ctx = makeContext({ factionReps: { authorities: 60 } });
    expect(hasFactionRep('authorities', 50, ctx)).toBe(true);
    expect(hasFactionRep('authorities', 70, ctx)).toBe(false);
  });

  it('hasKarma checks context.karma', () => {
    const ctx = makeContext({ karma: 30 });
    expect(hasKarma(25, ctx)).toBe(true);
    expect(hasKarma(35, ctx)).toBe(false);
  });

  it('hasMaxKarma checks context.karma is at or below max', () => {
    const ctx = makeContext({ karma: -30 });
    expect(hasMaxKarma(-25, ctx)).toBe(true);
    expect(hasMaxKarma(-35, ctx)).toBe(false);
  });

  it('isTrustedByAuthorities checks authority rep >= 50', () => {
    expect(
      isTrustedByAuthorities(
        makeContext({ factionReps: { authorities: 50 } })
      )
    ).toBe(true);
    expect(
      isTrustedByAuthorities(
        makeContext({ factionReps: { authorities: 49 } })
      )
    ).toBe(false);
  });

  it('isKnownToOutlaws checks outlaw rep >= 50', () => {
    expect(
      isKnownToOutlaws(makeContext({ factionReps: { outlaws: 50 } }))
    ).toBe(true);
  });

  it('isFriendToCivilians checks civilian rep >= 50', () => {
    expect(
      isFriendToCivilians(makeContext({ factionReps: { civilians: 50 } }))
    ).toBe(true);
  });

  it('hasGoodKarma checks karma >= 25', () => {
    expect(hasGoodKarma(makeContext({ karma: 25 }))).toBe(true);
    expect(hasGoodKarma(makeContext({ karma: 24 }))).toBe(false);
  });

  it('hasBadKarma checks karma <= -25', () => {
    expect(hasBadKarma(makeContext({ karma: -25 }))).toBe(true);
    expect(hasBadKarma(makeContext({ karma: -24 }))).toBe(false);
  });

  it('isWantedByAuthorities checks authority rep <= -25', () => {
    expect(
      isWantedByAuthorities(
        makeContext({ factionReps: { authorities: -25 } })
      )
    ).toBe(true);
    expect(
      isWantedByAuthorities(
        makeContext({ factionReps: { authorities: -24 } })
      )
    ).toBe(false);
  });

  it('hasMixedReputation checks high >= 25 and low <= -25', () => {
    const ctx = makeContext({
      factionReps: { authorities: 30, outlaws: -30 },
    });
    expect(hasMixedReputation('authorities', 'outlaws', ctx)).toBe(true);
  });

  it('getFactionAttitudeModifier uses context.factionReps', () => {
    const ctx = makeContext({ factionReps: { civilians: 60 } });
    const result = getFactionAttitudeModifier('civilians', ctx);
    expect(typeof result).toBe('string');
  });

  // getKarmaFirstImpression is already pure — no change needed
  it('getKarmaFirstImpression remains pure (takes karma value, not context)', () => {
    const result = getKarmaFirstImpression(30, 'neutral');
    expect(typeof result).toBe('string');
  });
});
