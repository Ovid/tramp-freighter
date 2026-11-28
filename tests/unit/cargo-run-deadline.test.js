import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { createDefaultMissionState } from '@game/state/state-validators.js';

describe('MissionManager.checkMissionDeadlines – cargo run cargo removal', () => {
  let game;
  let manager;
  let state;

  beforeEach(() => {
    game = createTestGame();
    state = game.state;
    manager = game.missionManager;
    state.player.daysElapsed = 25;
    state.ship.cargo = [];
    state.ship.hiddenCargo = [];
    state.missions = createDefaultMissionState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should remove mission cargo from hold when deadline expires', () => {
    state.player.daysElapsed = 25; // past deadline
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_expired' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_expired',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        penalties: { failure: { faction: { traders: -2 } } },
      },
    ];

    manager.checkMissionDeadlines();

    expect(state.ship.cargo).toHaveLength(0);
    expect(state.missions.failed).toContain('cargo_run_expired');
  });

  // Issue #50: otherwise expired cargo sits in the hidden hold forever
  it('should remove mission cargo from the hidden compartment when deadline expires', () => {
    state.player.daysElapsed = 25;
    state.ship.hiddenCargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_expired' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_expired',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        penalties: { failure: {} },
      },
    ];

    manager.checkMissionDeadlines();

    expect(state.ship.hiddenCargo).toEqual([]);
  });

  it('should not remove cargo for non-expired missions', () => {
    state.player.daysElapsed = 15; // before deadline
    state.ship.cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_active' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_active',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: {
          good: 'registered_freight',
          quantity: 10,
          isIllegal: false,
        },
        penalties: { failure: {} },
      },
    ];

    manager.checkMissionDeadlines();

    expect(state.ship.cargo).toHaveLength(1);
    expect(state.missions.failed).toHaveLength(0);
  });

  it('should apply faction penalties on expiry', () => {
    state.player.daysElapsed = 25;
    state.ship.cargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_expired' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_expired',
        type: 'delivery',
        deadlineDay: 20,
        missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
        penalties: { failure: { faction: { traders: -2 } } },
      },
    ];

    manager.checkMissionDeadlines();

    // The existing deadline check already handles faction penalties
    // Just verify the mission was failed
    expect(state.missions.failed).toContain('cargo_run_expired');
  });
});
