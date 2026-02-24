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
  });
});

// ── executeJump emits JUMP_ANIMATION_NEAR_END ────────────────────────

describe('executeJump near-end event', () => {
  let NavigationSystem;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@game/game-navigation.js');
    NavigationSystem = mod.NavigationSystem;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes onTravelNearEnd callback to playJumpAnimation', async () => {
    const mockAnimationSystem = {
      playJumpAnimation: vi.fn(() => Promise.resolve()),
    };

    const mockGSM = buildMockGameStateManager();

    const nav = new NavigationSystem();
    stubNavValidation(nav, NavigationSystem);

    await nav.executeJump(mockGSM, 1, mockAnimationSystem);

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
    const mockGSM = buildMockGameStateManager((event) =>
      emittedEvents.push(event)
    );

    const nav = new NavigationSystem();
    stubNavValidation(nav, NavigationSystem);

    await nav.executeJump(mockGSM, 1, mockAnimationSystem);

    expect(emittedEvents).toContain(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
  });

  it('does not emit JUMP_ANIMATION_NEAR_END without animation system', async () => {
    const emittedEvents = [];
    const mockGSM = buildMockGameStateManager((event) =>
      emittedEvents.push(event)
    );

    const nav = new NavigationSystem();
    stubNavValidation(nav, NavigationSystem);

    // No animation system — should not emit
    await nav.executeJump(mockGSM, 1, null);

    expect(emittedEvents).not.toContain(EVENT_NAMES.JUMP_ANIMATION_NEAR_END);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────

function buildMockGameStateManager(onEmit = () => {}) {
  return {
    getState: () => ({
      player: { currentSystem: 0, daysElapsed: 10 },
      ship: {
        fuel: 100,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        quirks: [],
      },
    }),
    calculateShipCapabilities: () => ({
      fuelConsumption: 1,
      hullDegradation: 1,
      lifeSupportDrain: 1,
    }),
    updateFuel: vi.fn(),
    updateTime: vi.fn(),
    updateLocation: vi.fn(),
    updateShipCondition: vi.fn(),
    saveGame: vi.fn(),
    applyQuirkModifiers: vi.fn((_, val) => val),
    emit: vi.fn((event) => onEmit(event)),
    markDirty: vi.fn(),
  };
}

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
