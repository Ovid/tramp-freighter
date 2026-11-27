/**
 * Tests: Encounter panels are delayed until jump animation nears completion.
 *
 * When a jump triggers an encounter, the encounter panel should NOT appear
 * immediately. Instead, it should be buffered and revealed when the ship
 * travel animation reaches ~75% progress, creating a surprise effect.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ANIMATION_CONFIG, EVENT_NAMES } from '@game/constants.js';

// ── Constants ────────────────────────────────────────────────────────

describe('ANIMATION_CONFIG.ENCOUNTER_REVEAL_PROGRESS', () => {
  it('exists and is between 0 and 1', () => {
    expect(ANIMATION_CONFIG.ENCOUNTER_REVEAL_PROGRESS).toBeDefined();
    expect(ANIMATION_CONFIG.ENCOUNTER_REVEAL_PROGRESS).toBeGreaterThan(0);
    expect(ANIMATION_CONFIG.ENCOUNTER_REVEAL_PROGRESS).toBeLessThan(1);
  });
});

describe('EVENT_NAMES.JUMP_ANIMATION_NEAR_END', () => {
  it('exists as a frozen event name', () => {
    expect(EVENT_NAMES.JUMP_ANIMATION_NEAR_END).toBeDefined();
    expect(typeof EVENT_NAMES.JUMP_ANIMATION_NEAR_END).toBe('string');
    expect(Object.isFrozen(EVENT_NAMES)).toBe(true);
  });
});

// ── executeJump emits JUMP_ANIMATION_NEAR_END ────────────────────────

describe('executeJump near-end event', () => {
  let NavigationSystem;
  let GameCoordinator;
  let STAR_DATA;
  let WORMHOLE_DATA;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@game/game-navigation.js');
    NavigationSystem = mod.NavigationSystem;
    ({ GameCoordinator } = await import('@game/state/game-coordinator.js'));
    ({ STAR_DATA } = await import('@game/data/star-data.js'));
    ({ WORMHOLE_DATA } = await import('@game/data/wormhole-data.js'));
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // A real coordinator on a new game at Sol (id 0), with validation stubbed
  // as before so the jump to id 1 always passes.
  function buildMockGameCoordinator(onEmit = () => {}) {
    const nav = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    stubNavValidation(nav, NavigationSystem);
    const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, nav);
    game.isTestEnvironment = true;
    game.initNewGame();
    const emit = game.emit.bind(game);
    vi.spyOn(game, 'emit').mockImplementation((event, ...rest) => {
      onEmit(event);
      return emit(event, ...rest);
    });
    return game;
  }

  it('passes onTravelNearEnd callback to playJumpAnimation', async () => {
    const mockAnimationSystem = {
      playJumpAnimation: vi.fn(() => Promise.resolve()),
    };

    const mockGSM = buildMockGameCoordinator();

    mockGSM.setAnimationSystem(mockAnimationSystem);
    await mockGSM.executeJump(1);

    // Third argument should be the near-end callback function
    expect(mockAnimationSystem.playJumpAnimation).toHaveBeenCalledWith(
      0,
      1,
      expect.any(Function)
    );
  });

  it('emits JUMP_ANIMATION_NEAR_END when animation fires near-end callback', async () => {
    const mockAnimationSystem = {
      playJumpAnimation: vi.fn((_origin, _dest, onNearEnd) => {
        // Simulate animation calling back at the near-end point
        if (onNearEnd) onNearEnd();
        return Promise.resolve();
      }),
    };

    const emittedEvents = [];
    const mockGSM = buildMockGameCoordinator((event) =>
      emittedEvents.push(event)
    );

    mockGSM.setAnimationSystem(mockAnimationSystem);
    await mockGSM.executeJump(1);

    expect(emittedEvents).toContain(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
  });

  it('does not emit JUMP_ANIMATION_NEAR_END without animation system', async () => {
    const emittedEvents = [];
    const mockGSM = buildMockGameCoordinator((event) =>
      emittedEvents.push(event)
    );

    // No animation system — should not emit
    mockGSM.setAnimationSystem(null);
    await mockGSM.executeJump(1);

    expect(emittedEvents).not.toContain(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────

function stubNavValidation(nav, NavigationSystem) {
  vi.spyOn(nav, 'validateJump').mockReturnValue({
    valid: true,
    fuelCost: 5,
    jumpTime: 1,
    distance: 10,
  });

  vi.spyOn(NavigationSystem, 'applyJumpDegradation').mockReturnValue({
    hull: 98,
    engine: 97,
    lifeSupport: 99,
  });
}
