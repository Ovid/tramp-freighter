/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useGameEvent } from '../../src/hooks/useGameEvent.js';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES } from '@game/constants.js';

// useGameEvent stores the payload with setState, and React skips the update
// when the new value is Object.is-equal to the old one. A slice mutated in
// place and emitted by reference would never re-render its subscribers.
describe('useGameEvent sees each in-place slice change', () => {
  let game;

  beforeEach(() => {
    game = createTestGame();
    game.getState().player.credits = 100000;
    game.getState().ship.quirks = [];
  });

  const watch = (eventName) =>
    renderHook(() => useGameEvent(eventName), {
      wrapper: ({ children }) => (
        <GameProvider game={game}>{children}</GameProvider>
      ),
    });

  it.each([
    [
      'addUpgrade',
      EVENT_NAMES.UPGRADES_CHANGED,
      (g) => g.addUpgrade('extended_tank'),
    ],
    [
      'purchaseUpgrade',
      EVENT_NAMES.UPGRADES_CHANGED,
      (g) => g.purchaseUpgrade('extended_tank'),
    ],
    ['addQuirk', EVENT_NAMES.QUIRKS_CHANGED, (g) => g.addQuirk('sticky_seal')],
    [
      'updatePriceKnowledge',
      EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
      (g) => g.updatePriceKnowledge(4, { grain: 10 }, 0),
    ],
    [
      'incrementPriceKnowledgeStaleness',
      EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
      (g) => g.incrementPriceKnowledgeStaleness(1),
    ],
    [
      'recalculatePricesForKnownSystems',
      EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
      (g) => g.recalculatePricesForKnownSystems(),
    ],
    [
      'purchaseIntelligence',
      EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
      (g) => g.purchaseIntelligence(1),
    ],
  ])('%s gives subscribers a new value', (_name, eventName, mutate) => {
    const { result } = watch(eventName);
    const before = result.current;
    act(() => mutate(game));
    expect(result.current).not.toBe(before);
  });

  it('removeUpgrade and removeQuirk give subscribers a new value', () => {
    game.addUpgrade('extended_tank');
    game.addQuirk('sticky_seal');
    const upgrades = watch(EVENT_NAMES.UPGRADES_CHANGED).result;
    const quirks = watch(EVENT_NAMES.QUIRKS_CHANGED).result;
    const [u0, q0] = [upgrades.current, quirks.current];
    act(() => {
      game.removeUpgrade('extended_tank');
      game.removeQuirk('sticky_seal');
    });
    expect(upgrades.current).not.toBe(u0);
    expect(quirks.current).not.toBe(q0);
  });
});
