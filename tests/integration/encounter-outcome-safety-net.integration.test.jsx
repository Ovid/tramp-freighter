import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  render,
  renderHook,
  screen,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { NotificationProvider } from '../../src/context/NotificationContext.jsx';
import { useEncounterOrchestration } from '../../src/hooks/useEncounterOrchestration.js';
import { NarrativeEventPanel } from '../../src/features/narrative/NarrativeEventPanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Pins what the player's game state looks like after an encounter or
 * narrative choice resolves, observed only through the hook and panel that
 * apply it. Whichever layer ends up applying outcomes, a resolved outcome
 * must leave the same state behind and schedule a save.
 *
 * Feature: danger encounters, narrative events
 */

function newGame() {
  const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  game.initNewGame();
  return game;
}

function resolveInspectionWith(game, outcome, notificationCtx) {
  vi.spyOn(game, 'resolveEncounter').mockReturnValue(outcome);
  const { result } = renderHook(() =>
    useEncounterOrchestration(game, notificationCtx, null)
  );
  act(() => {
    result.current.registerSetViewMode(() => {});
    result.current.handleEncounterTriggered({
      type: 'inspection',
      encounter: { id: 'insp', type: 'inspection', severity: 'routine' },
    });
  });
  act(() => {
    result.current.handleEncounterChoice('comply');
  });
  return result;
}

describe('Encounter outcome application safety net', () => {
  let game;
  let notificationCtx;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = newGame();
    notificationCtx = { showInfo: vi.fn() };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('an outcome costing hull, engine and life support reduces all three', () => {
    game.updateShipCondition(80, 70, 60);

    resolveInspectionWith(
      game,
      { success: true, costs: { hull: 10, engine: 5, lifeSupport: 3 } },
      notificationCtx
    );

    const ship = game.getState().ship;
    expect([ship.hull, ship.engine, ship.lifeSupport]).toEqual([70, 65, 57]);
  });

  it('a fine larger than the credits on hand rolls the rest into debt, then rewards are added', () => {
    game.updateCredits(200);
    game.updateDebt(1000);

    resolveInspectionWith(
      game,
      {
        success: true,
        costs: { credits: 500, isFine: true },
        rewards: { credits: 50 },
      },
      notificationCtx
    );

    const player = game.getState().player;
    expect(player.credits).toBe(50);
    expect(player.debt).toBe(1300);
  });

  it('salvage merges into a matching stack, starts a new one otherwise, and reports what did not fit', () => {
    const capacity = game.getState().ship.cargoCapacity;
    game.updateCargo([
      {
        good: 'food',
        qty: capacity - 5,
        buyPrice: 50,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      },
    ]);

    resolveInspectionWith(
      game,
      {
        success: true,
        rewards: {
          cargo: [
            { good: 'food', qty: 2, buyPrice: 50 },
            { good: 'ore', qty: 5, buyPrice: 10 },
          ],
        },
      },
      notificationCtx
    );

    const cargo = game.getState().ship.cargo;
    expect(cargo.map((c) => [c.good, c.qty, c.buyPrice])).toEqual([
      ['food', capacity - 3, 50],
      ['ore', 3, 10],
    ]);
    expect(cargo[1].buySystemName).toBe('Salvaged');
    expect(notificationCtx.showInfo).toHaveBeenCalledWith(
      'Could only fit 3 of 5 units.'
    );
  });

  it('a resolved outcome schedules a save', () => {
    const markDirty = vi.spyOn(game, 'markDirty');

    resolveInspectionWith(
      game,
      { success: true, costs: { fuel: 5 } },
      notificationCtx
    );

    expect(markDirty).toHaveBeenCalled();
  });

  it('a narrative choice with effects changes the game state and marks the event fired', () => {
    game.updateShipCondition(80, 70, 60);
    game.updateCredits(100);
    const onClose = vi.fn();
    const event = {
      id: 'test_narrative_effects',
      cooldown: null,
      content: {
        text: ['A trader offers a deal.'],
        choices: [
          {
            text: 'Take the deal',
            effects: { costs: { hull: 5 }, rewards: { credits: 40 } },
            flags: ['took_deal'],
            next: null,
          },
        ],
      },
    };

    render(
      <GameProvider game={game}>
        <NotificationProvider>
          <NarrativeEventPanel event={event} onClose={onClose} />
        </NotificationProvider>
      </GameProvider>
    );
    fireEvent.click(screen.getByText('Take the deal'));

    const state = game.getState();
    expect(state.ship.hull).toBe(75);
    expect(state.player.credits).toBe(140);
    expect(state.world.narrativeEvents.fired).toContain(
      'test_narrative_effects'
    );
    expect(onClose).toHaveBeenCalled();
  });
});
