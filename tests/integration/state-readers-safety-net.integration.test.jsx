/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useGameEvent } from '../../src/hooks/useGameEvent.js';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES } from '@game/constants.js';

// Pins what readers of the whole state see after earlier writes, whether
// getState() hands out the live root or something else.
describe('State readers safety net', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a component mounted after writes starts from the written values', () => {
    game.updateCredits(1234);
    game.updateFuel(37);
    game.updateCargo([
      {
        good: 'ore',
        qty: 3,
        buyPrice: 10,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ]);

    const watch = (eventName) =>
      renderHook(() => useGameEvent(eventName), {
        wrapper: ({ children }) => (
          <GameProvider game={game}>{children}</GameProvider>
        ),
      }).result.current;

    expect(watch(EVENT_NAMES.CREDITS_CHANGED)).toBe(1234);
    expect(watch(EVENT_NAMES.FUEL_CHANGED)).toBe(37);
    expect(watch(EVENT_NAMES.CARGO_CHANGED)).toEqual([
      expect.objectContaining({ good: 'ore', qty: 3 }),
    ]);
  });

  it('the stats snapshot reflects stats and time written before it is taken', () => {
    game.updateCargo([
      {
        good: 'grain',
        qty: 10,
        buyPrice: 10,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ]);
    game.sellGood(0, 4, 20);
    game.updateTime(game.getState().player.daysElapsed + 5);

    const snapshot = game.getStatsSnapshot();

    expect(snapshot.cargoHauled).toBe(4);
    expect(snapshot.creditsEarned).toBe(80);
    expect(snapshot.daysElapsed).toBe(5);
  });
});
