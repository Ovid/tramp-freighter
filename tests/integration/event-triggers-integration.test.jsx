import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useEventTriggers } from '../../src/hooks/useEventTriggers.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Minimal component that mounts useEventTriggers for integration testing.
 */
function EventTriggersHarness() {
  useEventTriggers();
  return <div data-testid="harness" />;
}

function renderWithGame(gameStateManager) {
  return render(
    <GameProvider gameStateManager={gameStateManager}>
      <EventTriggersHarness />
    </GameProvider>
  );
}

describe('useEventTriggers Integration', () => {
  let gameStateManager;
  let emitSpy;

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

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();

    // Spy on emit to track what events are dispatched
    emitSpy = vi.spyOn(gameStateManager, 'emit');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should not trigger encounters on initial locationChanged during mount', () => {
    renderWithGame(gameStateManager);

    // The hook subscribes to locationChanged. On mount, useGameEvent fires
    // the initial value (current system). The hook should skip this.
    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );

    expect(encounterEmissions).toHaveLength(0);
    expect(narrativeEmissions).toHaveLength(0);
  });

  it('should process jump events when locationChanged fires for a new system', () => {
    renderWithGame(gameStateManager);
    emitSpy.mockClear();

    // Simulate a jump to a different system
    act(() => {
      gameStateManager.emit('locationChanged', 4); // Barnard's Star
    });

    // The hook should have called checkEvents for 'jump' type.
    // Whether an encounter actually fires depends on RNG and event data,
    // but the hook should process without errors.
    // Verify no uncaught exceptions — the render is still alive
    expect(document.querySelector('[data-testid="harness"]')).toBeTruthy();
  });

  it('should skip duplicate locationChanged for the same system', () => {
    renderWithGame(gameStateManager);

    // First real jump
    act(() => {
      gameStateManager.emit('locationChanged', 4);
    });
    emitSpy.mockClear();

    // Duplicate emission for same system
    act(() => {
      gameStateManager.emit('locationChanged', 4);
    });

    // No new encounter or narrative emissions from the duplicate
    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );

    expect(encounterEmissions).toHaveLength(0);
    expect(narrativeEmissions).toHaveLength(0);
  });

  it('should trigger dock event checks when docked event fires', () => {
    renderWithGame(gameStateManager);
    emitSpy.mockClear();

    // Simulate docking at Sol (system 0)
    act(() => {
      gameStateManager.emit('docked', { systemId: 0 });
    });

    // The hook should process dock triggers. dock_sol_first has chance 1.0
    // and first_dock condition, so if Sol isn't in dockedSystems yet it
    // should emit narrativeEventTriggered.
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );

    expect(narrativeEmissions.length).toBeGreaterThanOrEqual(1);
    expect(narrativeEmissions[0][1]).toHaveProperty('id', 'dock_sol_first');
  });

  it('should route narrative events to narrativeEventTriggered, not encounterTriggered', () => {
    renderWithGame(gameStateManager);
    emitSpy.mockClear();

    // dock_sol_first is a narrative event
    act(() => {
      gameStateManager.emit('docked', { systemId: 0 });
    });

    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );

    // Narrative events must NOT go to encounterTriggered
    expect(encounterEmissions).toHaveLength(0);
    // They must go to narrativeEventTriggered
    expect(narrativeEmissions.length).toBeGreaterThanOrEqual(1);
  });

  it('should route danger events to encounterTriggered', () => {
    renderWithGame(gameStateManager);

    // Register a test danger event that always fires on jump
    gameStateManager.eventEngineManager.registerEvent({
      id: 'test_danger_jump',
      type: 'jump',
      category: 'danger',
      trigger: { system: null, condition: null, chance: 1.0 },
      once: false,
      cooldown: 0,
      priority: 999, // Highest priority so it wins over other events
      encounter: { generator: 'pirate' },
    });

    emitSpy.mockClear();

    act(() => {
      gameStateManager.emit('locationChanged', 1); // Initial skip
    });
    emitSpy.mockClear();

    act(() => {
      gameStateManager.emit('locationChanged', 4); // Real jump
    });

    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );

    expect(encounterEmissions.length).toBeGreaterThanOrEqual(1);
    expect(encounterEmissions[0][1]).toHaveProperty('type', 'pirate');
  });

  it('should ignore docked events with no systemId', () => {
    renderWithGame(gameStateManager);
    emitSpy.mockClear();

    act(() => {
      gameStateManager.emit('docked', {});
    });

    act(() => {
      gameStateManager.emit('docked', null);
    });

    // No emissions should occur for malformed dock events
    const narrativeEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'narrativeEventTriggered'
    );
    const encounterEmissions = emitSpy.mock.calls.filter(
      ([event]) => event === 'encounterTriggered'
    );

    expect(narrativeEmissions).toHaveLength(0);
    expect(encounterEmissions).toHaveLength(0);
  });
});
