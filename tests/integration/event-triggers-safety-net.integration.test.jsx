import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useEventTriggers } from '../../src/hooks/useEventTriggers.js';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import {
  EVENT_NAMES,
  PIRATE_CREDIT_DEMAND_CONFIG,
} from '../../src/game/constants.js';

/**
 * Pins the observable behaviour of the encounter/event trigger pipeline
 * from the game's side: a real jump, dock or passage of time produces the
 * same encounterTriggered / narrativeEventTriggered emissions, whichever
 * layer ends up owning the trigger rules. The trigger hook is mounted the
 * way App mounts it, before the game is started.
 *
 * Feature: event-engine, danger encounters
 */

function Harness() {
  useEventTriggers();
  return null;
}

const SOL = 0;
const NEIGHBOUR = WORMHOLE_DATA.find(([a, b]) => a === SOL || b === SOL).find(
  (id) => id !== SOL
);

function startGame() {
  const game = new GameCoordinator(
    STAR_DATA,
    WORMHOLE_DATA,
    new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
  );
  render(
    <GameProvider game={game}>
      <Harness />
    </GameProvider>
  );
  act(() => {
    game.initNewGame();
  });
  game.getState().ship.fuel = 100;
  return game;
}

function onlyEvents(game, events) {
  game.eventEngineManager.clearEvents();
  game.eventEngineManager.registerEvents(events);
}

function emissionsOf(spy, name) {
  return spy.mock.calls.filter(([e]) => e === name).map(([, data]) => data);
}

async function jump(game, target) {
  let result;
  await act(async () => {
    result = await game.navigationSystem.executeJump(game, target);
  });
  expect(result.success).toBe(true);
}

function dangerEvent(id, generator, system = null) {
  return {
    id,
    type: 'jump',
    category: 'danger',
    trigger: { system, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 999,
    encounter: { generator },
  };
}

function withoutIds(value) {
  if (Array.isArray(value)) return value.map(withoutIds);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'id')
        .map(([key, v]) => [key, withoutIds(v)])
    );
  }
  return value;
}

describe('Event trigger pipeline safety net', () => {
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
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('the first real jump after starting a game triggers a pirate encounter for the destination', async () => {
    const game = startGame();
    onlyEvents(game, [dangerEvent('test_pirate', 'pirate', NEIGHBOUR)]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    const encounters = emissionsOf(emitSpy, EVENT_NAMES.ENCOUNTER_TRIGGERED);
    expect(encounters).toHaveLength(1);
    expect(encounters[0].type).toBe('pirate');
    expect(encounters[0].encounter).toMatchObject({
      type: 'pirate',
      systemId: NEIGHBOUR,
      demandPercent: PIRATE_CREDIT_DEMAND_CONFIG.CARGO_DEMAND_PERCENT,
    });
    expect(['weak', 'moderate', 'strong', 'dangerous']).toContain(
      encounters[0].encounter.threatLevel
    );
    expect(typeof encounters[0].encounter.id).toBe('string');
  });

  it('a jump-triggered inspection carries the destination and a severity', async () => {
    const game = startGame();
    onlyEvents(game, [dangerEvent('test_inspection', 'inspection')]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    const encounters = emissionsOf(emitSpy, EVENT_NAMES.ENCOUNTER_TRIGGERED);
    expect(encounters).toHaveLength(1);
    expect(encounters[0].type).toBe('inspection');
    expect(encounters[0].encounter).toMatchObject({
      type: 'inspection',
      systemId: NEIGHBOUR,
    });
    expect(encounters[0].encounter.severity).toBeDefined();
  });

  it('a danger event restricted to another system does not fire on this jump', async () => {
    const game = startGame();
    const elsewhere = STAR_DATA.find(
      (s) => s.id !== NEIGHBOUR && s.id !== SOL
    ).id;
    onlyEvents(game, [dangerEvent('test_elsewhere', 'pirate', elsewhere)]);
    const emitSpy = vi.spyOn(game, 'emit');

    await jump(game, NEIGHBOUR);

    expect(emissionsOf(emitSpy, EVENT_NAMES.ENCOUNTER_TRIGGERED)).toHaveLength(
      0
    );
  });

  it('identical games making the same jumps emit identical encounters and narratives', async () => {
    const run = async () => {
      const game = startGame();
      // A coin-flip danger event alongside the real content makes the
      // outcome depend on the seeded roll for each day and system.
      game.eventEngineManager.registerEvent({
        ...dangerEvent('test_coin_flip', 'pirate'),
        trigger: { system: null, condition: null, chance: 0.5 },
      });
      const emitSpy = vi.spyOn(game, 'emit');
      for (let i = 0; i < 8; i++) {
        game.getState().ship.fuel = 100;
        await jump(game, i % 2 === 0 ? NEIGHBOUR : SOL);
      }
      const out = {
        encounters: emissionsOf(emitSpy, EVENT_NAMES.ENCOUNTER_TRIGGERED),
        narratives: emissionsOf(
          emitSpy,
          EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED
        ).map((e) => e.id),
      };
      cleanup();
      return withoutIds(out);
    };

    const first = await run();
    const second = await run();

    expect(first.encounters.length).toBeGreaterThan(0);
    expect(first.encounters.length).toBeLessThan(8);
    expect(second).toEqual(first);
  });

  it('falls back to an eligible condition event when no event of the trigger type fires', () => {
    const game = startGame();
    onlyEvents(game, [
      {
        id: 'test_condition',
        type: 'condition',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 1,
        content: { text: ['Condition fallback'] },
      },
    ]);
    const emitSpy = vi.spyOn(game, 'emit');

    act(() => {
      game.emit(EVENT_NAMES.DOCKED, { systemId: NEIGHBOUR });
    });

    const narratives = emissionsOf(
      emitSpy,
      EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED
    );
    expect(narratives.map((n) => n.id)).toEqual(['test_condition']);
  });

  it('passing time triggers time events for the current system', () => {
    const game = startGame();
    onlyEvents(game, [
      {
        id: 'test_time',
        type: 'time',
        category: 'narrative',
        trigger: { system: SOL, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 1,
        content: { text: ['Time passes'] },
      },
    ]);
    const emitSpy = vi.spyOn(game, 'emit');

    act(() => {
      game.updateTime(game.getState().player.daysElapsed + 1);
    });

    const narratives = emissionsOf(
      emitSpy,
      EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED
    );
    expect(narratives.map((n) => n.id)).toEqual(['test_time']);
  });
});
